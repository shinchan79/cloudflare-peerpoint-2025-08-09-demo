import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { Cursor, User } from '../types';
import { apiHelpers } from '../services/api';

interface CollaborationContextType {
  isConnected: boolean;
  participants: User[];
  cursors: Cursor[];
  joinRoom: (roomId: string, user: User) => Promise<void>;
  leaveRoom: () => void;
  sendCodeChange: (change: any) => void;
  sendCursorUpdate: (cursor: Partial<Cursor>) => void;
  sendMessage: (message: string) => void;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};

interface CollaborationProviderProps {
  children: React.ReactNode;
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({ children }) => {
  const { currentUser, setParticipants, addCursor, removeCursor, updateCursor, setConnected } = useAppStore();
  
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipantsState] = useState<User[]>([]);
  const [cursors, setCursorsState] = useState<Cursor[]>([]);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);

  const joinRoom = async (roomId: string, user: User) => {
    try {
      const ws = apiHelpers.createWebSocket(
        roomId,
        user.id,
        user.name,
        user.color
      );

      ws.onopen = () => {
        setIsConnected(true);
        setConnected(true);
        console.log('Connected to collaboration room');
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'init':
            setParticipantsState(message.payload.participants);
            setCursorsState(message.payload.cursors);
            break;
          case 'participant_joined':
            setParticipantsState(prev => [...prev, message.payload]);
            break;
          case 'participant_left':
            setParticipantsState(prev => prev.filter(p => p.id !== message.payload.userId));
            removeCursor(message.payload.userId);
            break;
          case 'cursor_update':
            updateCursor(message.payload.id, message.payload);
            break;
          case 'chat_message':
            // Handle chat message
            break;
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setConnected(false);
        console.log('Disconnected from collaboration room');
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        setConnected(false);
      };

      setWebsocket(ws);
    } catch (error) {
      console.error('Failed to connect to collaboration room:', error);
    }
  };

  const leaveRoom = () => {
    if (websocket) {
      websocket.close();
      setWebsocket(null);
    }
    setIsConnected(false);
    setConnected(false);
    setParticipantsState([]);
    setCursorsState([]);
  };

  const sendMessage = (message: string) => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({
        type: 'chat_message',
        payload: { content: message }
      }));
    }
  };

  const sendCodeChange = (change: any) => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({
        type: 'code_change',
        payload: change
      }));
    }
  };

  const sendCursorUpdate = (cursor: Partial<Cursor>) => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({
        type: 'cursor_update',
        payload: cursor
      }));
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const value: CollaborationContextType = {
    isConnected,
    participants,
    cursors,
    joinRoom,
    leaveRoom,
    sendCodeChange,
    sendCursorUpdate,
    sendMessage,
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
}; 