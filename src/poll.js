export class Poll {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
    this.votes = new Map();
    this.pollData = null;
    this.userVotes = new Map(); // Track user votes: userId -> Set of options
    
    console.log('Poll Durable Object initialized');
    
    // Load data from storage
    this.state.blockConcurrencyWhile(async () => {
      const storedPollData = await this.state.storage.get('pollData');
      const storedVotes = await this.state.storage.get('votes');
      const storedUserVotes = await this.state.storage.get('userVotes');
      
      if (storedPollData) {
        this.pollData = storedPollData;
        console.log('Loaded poll data:', storedPollData);
      }
      
      if (storedVotes) {
        this.votes = new Map(Object.entries(storedVotes));
        console.log('Loaded votes:', Object.fromEntries(this.votes));
      }

      if (storedUserVotes) {
        // Convert stored array back to Set
        const userVotesEntries = Object.entries(storedUserVotes).map(([userId, options]) => [
          userId, 
          new Set(Array.isArray(options) ? options : [])
        ]);
        this.userVotes = new Map(userVotesEntries);
        console.log('Loaded user votes:', this.getUserVotesForStorage());
      }
    });
  }

  generateAnonymousUserId(request) {
    const ip = request.headers.get('CF-Connecting-IP') || 
               request.headers.get('X-Forwarded-For') || 
               request.headers.get('X-Real-IP') || 
               'unknown';
    
    const userAgent = request.headers.get('User-Agent') || 'unknown';
    const acceptLanguage = request.headers.get('Accept-Language') || 'unknown';
    const acceptEncoding = request.headers.get('Accept-Encoding') || 'unknown';

    const combined = `${ip}_${userAgent}_${acceptLanguage}_${acceptEncoding}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const anonymousId = `anonymous_${Math.abs(hash).toString(36)}`;
    console.log('Generated anonymous ID:', anonymousId, 'from IP:', ip, 'User-Agent:', userAgent.substring(0, 50));
    return anonymousId;
  }

  // Helper method to convert userVotes Map<userId, Set> to storage format
  getUserVotesForStorage() {
    const result = {};
    for (const [userId, optionsSet] of this.userVotes.entries()) {
      result[userId] = Array.from(optionsSet);
    }
    return result;
  }

  async fetch(request) {
    const url = new URL(request.url);
    
    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket(request);
    }

    switch (url.pathname) {
      case "/vote":
        return this.handleVote(request);
      case "/get":
        return this.handleGetPoll(request);
      case "/create":
        return this.handleCreatePoll(request);
      default:
        return new Response("Not found", { status: 404 });
    }
  }

  async handleCreatePoll(request) {
    const data = await request.json();
    this.pollData = {
      id: data.id,
      question: data.question,
      options: data.options,
      created: Date.now()
    };

    this.votes.clear();
    this.userVotes.clear();
    data.options.forEach(option => {
      this.votes.set(option, 0);
    });

    console.log('Created poll with options:', data.options);
    console.log('Initialized votes:', Object.fromEntries(this.votes));

    await this.state.storage.put('pollData', this.pollData);
    await this.state.storage.put('votes', Object.fromEntries(this.votes));
    await this.state.storage.put('userVotes', this.getUserVotesForStorage());

    this.broadcast({
      type: "poll_data",
      poll: this.pollData,
      votes: Object.fromEntries(this.votes),
      total: 0
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  async handleVote(request) {
    const data = await request.json();
    const { option, userId } = data;

    let voterId = userId;
    if (!voterId) {
      voterId = this.generateAnonymousUserId(request);
      console.log('No userId provided, generated:', voterId);
    }
    
    console.log('=== MULTI-VOTE HANDLER ===');
    console.log('Option:', option);
    console.log('UserId from request:', userId);
    console.log('Final voterId:', voterId);
    
    if (!this.votes.has(option)) {
      console.log('Invalid option:', option);
      return new Response(JSON.stringify({ error: "Invalid option" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    let userCurrentVotes = this.userVotes.get(voterId);
    if (!userCurrentVotes) {
      userCurrentVotes = new Set();
      this.userVotes.set(voterId, userCurrentVotes);
    }

    console.log('Current user votes:', Array.from(userCurrentVotes));

    let action = '';

    if (userCurrentVotes.has(option)) {
      console.log('UNVOTING option:', option);
      userCurrentVotes.delete(option);
      const currentVotes = this.votes.get(option);
      this.votes.set(option, Math.max(0, currentVotes - 1));
      action = 'unvote';
    } else {
      // User is VOTING for this option (can vote multiple)
      console.log('VOTING for option:', option);
      userCurrentVotes.add(option);
      const currentVotes = this.votes.get(option);
      this.votes.set(option, currentVotes + 1);
      action = 'vote';
    }
    
    console.log('Final action:', action);
    console.log('Updated votes:', Object.fromEntries(this.votes));
    console.log('Updated user votes:', Array.from(userCurrentVotes));
    
    // Persist votes to storage
    await this.state.storage.put('votes', Object.fromEntries(this.votes));
    await this.state.storage.put('userVotes', this.getUserVotesForStorage());
    
    // Broadcast update to all connected clients
    const total = Array.from(this.votes.values()).reduce((a, b) => a + b, 0);
    const broadcastData = {
      type: "vote_update",
      votes: Object.fromEntries(this.votes),
      total,
      userVotes: Array.from(userCurrentVotes),
      action,
      voterId
    };
    
    console.log('Broadcasting:', broadcastData);
    this.broadcast(broadcastData);

    return new Response(JSON.stringify({ 
      success: true, 
      action,
      userVotes: Array.from(userCurrentVotes),
      total,
      voterId
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  async handleGetPoll(request) {
    if (!this.pollData) {
      return new Response(JSON.stringify({ error: "Poll not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const url = new URL(request.url);
    let userId = url.searchParams.get('userId');
    if (!userId) {
      userId = this.generateAnonymousUserId(request);
      console.log('No userId in URL, generated:', userId);
    }

    const total = Array.from(this.votes.values()).reduce((a, b) => a + b, 0);

    const userCurrentVotes = this.userVotes.get(userId);
    const userVotesArray = userCurrentVotes ? Array.from(userCurrentVotes) : [];
    
    const response = {
      ...this.pollData,
      votes: Object.fromEntries(this.votes),
      total,
      userVotes: userVotesArray
    };
    
    console.log('Returning poll data for userId:', userId, 'userVotes:', userVotesArray);

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" }
    });
  }

  async handleWebSocket(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.accept();

    const sessionId = crypto.randomUUID();

    const url = new URL(request.url);
    let userId = url.searchParams.get('userId');
    if (!userId) {
      userId = this.generateAnonymousUserId(request);
      console.log('WebSocket: No userId in URL, generated:', userId);
    }

    this.sessions.set(sessionId, { socket: server, userId });

    console.log('WebSocket connection established:', { sessionId, userId });
    console.log('Total sessions:', this.sessions.size);

    if (this.pollData) {
      const total = Array.from(this.votes.values()).reduce((a, b) => a + b, 0);

      const userCurrentVotes = this.userVotes.get(userId);
      const userVotesArray = userCurrentVotes ? Array.from(userCurrentVotes) : [];
      
      const initialData = {
        type: "poll_data",
        poll: this.pollData,
        votes: Object.fromEntries(this.votes),
        total,
        userVotes: userVotesArray,
        userId
      };
      console.log('Sending initial data for userId:', userId, 'userVotes:', userVotesArray);
      server.send(JSON.stringify(initialData));
    }

    this.broadcast({
      type: "user_count",
      count: this.sessions.size
    });

    server.addEventListener("close", () => {
      console.log('WebSocket connection closed:', { sessionId, userId });
      this.sessions.delete(sessionId);
      this.broadcast({
        type: "user_count",
        count: this.sessions.size
      });
    });

    server.addEventListener("error", () => {
      console.log('WebSocket error:', { sessionId, userId });
      this.sessions.delete(sessionId);
      this.broadcast({
        type: "user_count",
        count: this.sessions.size
      });
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  broadcast(message) {
    const messageStr = JSON.stringify(message);
    console.log('Broadcasting message to', this.sessions.size, 'sessions:', message.type);
    
    for (const [sessionId, sessionData] of this.sessions.entries()) {
      try {
        sessionData.socket.send(messageStr);
      } catch (e) {
        console.log('Failed to send message to session:', sessionId, e);
        this.sessions.delete(sessionId);
      }
    }
  }
}