// User types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  isOnline: boolean;
  lastSeen: Date;
}

// Project types
export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  collaborators: string[];
  files: FileStructure[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  domain?: string;
}

export interface FileStructure {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  children?: FileStructure[];
}

// Collaboration types
export interface Cursor {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  position: {
    lineNumber: number;
    column: number;
  };
  selection?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
}

export interface CollaborationState {
  cursors: Cursor[];
  selections: Cursor[];
  participants: User[];
  isConnected: boolean;
}

// AI types
export interface AICompletion {
  text: string;
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  confidence: number;
}

export interface AIError {
  message: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  codeBlocks?: string[];
}

// WebRTC types
export interface PeerConnection {
  id: string;
  peer: any; // SimplePeer instance
  isConnected: boolean;
  stream?: MediaStream;
}

// Analytics types
export interface AnalyticsEvent {
  type: string;
  userId: string;
  projectId?: string;
  data: Record<string, any>;
  timestamp: Date;
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// WebSocket message types
export interface WSMessage {
  type: string;
  payload: any;
  userId?: string;
  timestamp: Date;
}

export interface CodeChange {
  type: 'insert' | 'delete' | 'replace';
  position: number;
  text?: string;
  length?: number;
  userId: string;
  timestamp: Date;
}

// Performance metrics
export interface PerformanceMetrics {
  latency: number;
  throughput: number;
  errorRate: number;
  activeUsers: number;
  globalRegions: string[];
}

// Deployment types
export interface Deployment {
  id: string;
  projectId: string;
  status: 'pending' | 'building' | 'deployed' | 'failed';
  url?: string;
  customDomain?: string;
  createdAt: Date;
  buildLogs?: string[];
} 