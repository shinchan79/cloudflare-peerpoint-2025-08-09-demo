import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User, Project, CollaborationState, Cursor, AIChatMessage } from '@/types';

interface AppState {
  // User state
  currentUser: User | null;
  isAuthenticated: boolean;
  
  // Project state
  currentProject: Project | null;
  projects: Project[];
  isLoadingProjects: boolean;
  
  // Collaboration state
  collaboration: CollaborationState;
  cursors: Cursor[];
  participants: User[];
  
  // Editor state
  currentFile: string | null;
  editorContent: string;
  isEditorDirty: boolean;
  
  // AI state
  aiChat: AIChatMessage[];
  isAILoading: boolean;
  aiCompletions: any[];
  
  // WebRTC state
  peerConnections: Map<string, any>;
  localStream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  
  // UI state
  sidebarOpen: boolean;
  chatOpen: boolean;
  settingsOpen: boolean;
  theme: 'light' | 'dark' | 'auto';
  
  // Performance state
  connectionLatency: number;
  isConnected: boolean;
  
  // Actions
  setCurrentUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setCurrentProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  setCollaboration: (collaboration: Partial<CollaborationState>) => void;
  addCursor: (cursor: Cursor) => void;
  removeCursor: (cursorId: string) => void;
  updateCursor: (cursorId: string, updates: Partial<Cursor>) => void;
  setParticipants: (participants: User[]) => void;
  setCurrentFile: (fileId: string | null) => void;
  setEditorContent: (content: string) => void;
  setEditorDirty: (dirty: boolean) => void;
  addAIChatMessage: (message: AIChatMessage) => void;
  setAILoading: (loading: boolean) => void;
  setAIChat: (messages: AIChatMessage[]) => void;
  addPeerConnection: (id: string, peer: any) => void;
  removePeerConnection: (id: string) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setVideoEnabled: (enabled: boolean) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setChatOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setConnectionLatency: (latency: number) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

const initialState = {
  currentUser: null,
  isAuthenticated: false,
  currentProject: null,
  projects: [],
  isLoadingProjects: false,
  collaboration: {
    cursors: [],
    selections: [],
    participants: [],
    isConnected: false,
  },
  cursors: [],
  participants: [],
  currentFile: null,
  editorContent: '',
  isEditorDirty: false,
  aiChat: [],
  isAILoading: false,
  aiCompletions: [],
  peerConnections: new Map(),
  localStream: null,
  isVideoEnabled: false,
  isAudioEnabled: false,
  sidebarOpen: true,
  chatOpen: false,
  settingsOpen: false,
  theme: 'dark' as const,
  connectionLatency: 0,
  isConnected: false,
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        setCurrentUser: (user) => set({ currentUser: user }),
        setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
        setCurrentProject: (project) => set({ currentProject: project }),
        setProjects: (projects) => set({ projects }),
        addProject: (project) => set((state) => ({ 
          projects: [...state.projects, project] 
        })),
        updateProject: (projectId, updates) => set((state) => ({
          projects: state.projects.map(p => 
            p.id === projectId ? { ...p, ...updates } : p
          ),
          currentProject: state.currentProject?.id === projectId 
            ? { ...state.currentProject, ...updates }
            : state.currentProject,
        })),
        setCollaboration: (collaboration) => set((state) => ({
          collaboration: { ...state.collaboration, ...collaboration }
        })),
        addCursor: (cursor) => set((state) => ({
          cursors: [...state.cursors.filter(c => c.id !== cursor.id), cursor]
        })),
        removeCursor: (cursorId) => set((state) => ({
          cursors: state.cursors.filter(c => c.id !== cursorId)
        })),
        updateCursor: (cursorId, updates) => set((state) => ({
          cursors: state.cursors.map(c => 
            c.id === cursorId ? { ...c, ...updates } : c
          )
        })),
        setParticipants: (participants) => set({ participants }),
        setCurrentFile: (fileId) => set({ currentFile: fileId }),
        setEditorContent: (content) => set({ editorContent: content }),
        setEditorDirty: (dirty) => set({ isEditorDirty: dirty }),
        addAIChatMessage: (message) => set((state) => ({
          aiChat: [...state.aiChat, message]
        })),
        setAILoading: (loading) => set({ isAILoading: loading }),
        setAIChat: (messages) => set({ aiChat: messages }),
        addPeerConnection: (id, peer) => set((state) => {
          const newConnections = new Map(state.peerConnections);
          newConnections.set(id, peer);
          return { peerConnections: newConnections };
        }),
        removePeerConnection: (id) => set((state) => {
          const newConnections = new Map(state.peerConnections);
          newConnections.delete(id);
          return { peerConnections: newConnections };
        }),
        setLocalStream: (stream) => set({ localStream: stream }),
        setVideoEnabled: (enabled) => set({ isVideoEnabled: enabled }),
        setAudioEnabled: (enabled) => set({ isAudioEnabled: enabled }),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        setChatOpen: (open) => set({ chatOpen: open }),
        setSettingsOpen: (open) => set({ settingsOpen: open }),
        setTheme: (theme) => set({ theme }),
        setConnectionLatency: (latency) => set({ connectionLatency: latency }),
        setConnected: (connected) => set({ isConnected: connected }),
        reset: () => set(initialState),
      }),
      {
        name: 'codecollab-storage',
        partialize: (state) => ({
          currentUser: state.currentUser,
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
        }),
      }
    ),
    {
      name: 'codecollab-store',
    }
  )
); 