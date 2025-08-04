import { Cursor, CodeChange, WSMessage } from '@/types';

interface Participant {
  id: string;
  name: string;
  color: string;
  webSocket: WebSocket;
  isConnected: boolean;
  lastSeen: Date;
}

interface DocumentState {
  content: string;
  version: number;
  changes: CodeChange[];
}

export class CollaborationRoom implements DurableObject {
  private participants: Map<string, Participant> = new Map();
  private document: DocumentState = {
    content: '',
    version: 0,
    changes: [],
  };
  private cursors: Map<string, Cursor> = new Map();
  private env: any;
  private state: DurableObjectState;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/ws' && request.method === 'POST') {
      return this.handleWebSocketConnection(request);
    }

    if (path === '/state') {
      return this.getState();
    }

    if (path === '/participants') {
      return this.getParticipants();
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleWebSocketConnection(request: Request): Promise<Response> {
    const data = await request.json();
    const { userId, userName, userColor, webSocket } = data;

    // Add participant
    const participant: Participant = {
      id: userId,
      name: userName,
      color: userColor,
      webSocket,
      isConnected: true,
      lastSeen: new Date(),
    };

    this.participants.set(userId, participant);

    // Set up WebSocket event handlers
    webSocket.addEventListener('message', (event) => {
      this.handleWebSocketMessage(userId, event);
    });

    webSocket.addEventListener('close', () => {
      this.handleParticipantDisconnect(userId);
    });

    webSocket.addEventListener('error', () => {
      this.handleParticipantDisconnect(userId);
    });

    // Send initial state
    this.sendToParticipant(userId, {
      type: 'init',
      payload: {
        content: this.document.content,
        version: this.document.version,
        participants: Array.from(this.participants.values()).map(p => ({
          id: p.id,
          name: p.name,
          color: p.color,
        })),
        cursors: Array.from(this.cursors.values()),
      },
    });

    // Notify other participants
    this.broadcastToOthers(userId, {
      type: 'participant_joined',
      payload: {
        id: userId,
        name: userName,
        color: userColor,
      },
    });

    return new Response('OK');
  }

  private handleWebSocketMessage(userId: string, event: MessageEvent): void {
    try {
      const message: WSMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'cursor_update':
          this.handleCursorUpdate(userId, message.payload);
          break;
        case 'code_change':
          this.handleCodeChange(userId, message.payload);
          break;
        case 'chat_message':
          this.handleChatMessage(userId, message.payload);
          break;
        case 'ping':
          this.handlePing(userId);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  private handleCursorUpdate(userId: string, cursorData: Partial<Cursor>): void {
    const participant = this.participants.get(userId);
    if (!participant) return;

    const cursor: Cursor = {
      id: userId,
      userId,
      userName: participant.name,
      userColor: participant.color,
      position: cursorData.position!,
      selection: cursorData.selection,
    };

    this.cursors.set(userId, cursor);

    // Broadcast to other participants
    this.broadcastToOthers(userId, {
      type: 'cursor_update',
      payload: cursor,
    });
  }

  private handleCodeChange(userId: string, change: CodeChange): void {
    // Apply Operational Transform
    const transformedChange = this.applyOperationalTransform(change);
    
    // Update document
    this.document.content = this.applyChange(this.document.content, transformedChange);
    this.document.version++;
    this.document.changes.push(transformedChange);

    // Broadcast to other participants
    this.broadcastToOthers(userId, {
      type: 'code_change',
      payload: transformedChange,
    });

    // Store in D1 for persistence
    this.persistDocument();
  }

  private applyOperationalTransform(change: CodeChange): CodeChange {
    // Simple OT implementation - in production, use a proper OT library
    const concurrentChanges = this.document.changes.filter(
      c => c.timestamp > Date.now() - 5000 // Last 5 seconds
    );

    let transformedChange = { ...change };

    for (const concurrentChange of concurrentChanges) {
      if (concurrentChange.userId === change.userId) continue;

      // Transform based on position
      if (concurrentChange.position < change.position) {
        if (concurrentChange.type === 'insert') {
          transformedChange.position += concurrentChange.text?.length || 0;
        } else if (concurrentChange.type === 'delete') {
          transformedChange.position -= concurrentChange.length || 0;
        }
      }
    }

    return transformedChange;
  }

  private applyChange(content: string, change: CodeChange): string {
    switch (change.type) {
      case 'insert':
        return content.slice(0, change.position) + (change.text || '') + content.slice(change.position);
      case 'delete':
        return content.slice(0, change.position) + content.slice(change.position + (change.length || 0));
      case 'replace':
        return content.slice(0, change.position) + (change.text || '') + content.slice(change.position + (change.length || 0));
      default:
        return content;
    }
  }

  private handleChatMessage(userId: string, message: any): void {
    const participant = this.participants.get(userId);
    if (!participant) return;

    const chatMessage = {
      id: crypto.randomUUID(),
      userId,
      userName: participant.name,
      userColor: participant.color,
      content: message.content,
      timestamp: new Date(),
    };

    // Broadcast to all participants
    this.broadcastToAll({
      type: 'chat_message',
      payload: chatMessage,
    });
  }

  private handlePing(userId: string): void {
    const participant = this.participants.get(userId);
    if (participant) {
      participant.lastSeen = new Date();
      this.sendToParticipant(userId, { type: 'pong' });
    }
  }

  private handleParticipantDisconnect(userId: string): void {
    this.participants.delete(userId);
    this.cursors.delete(userId);

    // Notify other participants
    this.broadcastToAll({
      type: 'participant_left',
      payload: { userId },
    });
  }

  private sendToParticipant(userId: string, message: any): void {
    const participant = this.participants.get(userId);
    if (participant?.isConnected) {
      try {
        participant.webSocket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending message to participant:', error);
        this.handleParticipantDisconnect(userId);
      }
    }
  }

  private broadcastToAll(message: any): void {
    for (const [userId] of this.participants) {
      this.sendToParticipant(userId, message);
    }
  }

  private broadcastToOthers(excludeUserId: string, message: any): void {
    for (const [userId] of this.participants) {
      if (userId !== excludeUserId) {
        this.sendToParticipant(userId, message);
      }
    }
  }

  private async persistDocument(): Promise<void> {
    try {
      await this.state.storage.put('document', this.document);
    } catch (error) {
      console.error('Error persisting document:', error);
    }
  }

  private async getState(): Promise<Response> {
    return new Response(JSON.stringify({
      participants: Array.from(this.participants.values()).map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        isConnected: p.isConnected,
        lastSeen: p.lastSeen,
      })),
      document: this.document,
      cursors: Array.from(this.cursors.values()),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async getParticipants(): Promise<Response> {
    return new Response(JSON.stringify(
      Array.from(this.participants.values()).map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        isConnected: p.isConnected,
        lastSeen: p.lastSeen,
      }))
    ), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 