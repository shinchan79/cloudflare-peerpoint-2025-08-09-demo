import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  Eye, 
  Settings, 
  Users, 
  MessageSquare, 
  Share, 
  Download, 
  Save, 
  GitBranch, 
  Zap, 
  Code,
  FileText,
  FolderOpen,
  Plus,
  Terminal,
  Bot
} from 'lucide-react';
import { useAppStore } from '../../store';
import { useCollaboration } from '../../contexts/CollaborationContext';
import { useAI } from '../../contexts/AIContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import CollaborationCursors from './CollaborationCursors';
import ChatPanel from './ChatPanel';
import ParticipantsPanel from './ParticipantsPanel';
import AIPanel from './AIPanel';
import FileExplorer from './FileExplorer';
import Preview from './Preview';
import TerminalPanel from './TerminalPanel';

const CodeEditor: React.FC = () => {
  const { projectId } = useParams();
  const { currentUser } = useAppStore();
  const { 
    joinRoom, 
    leaveRoom, 
    sendCodeChange, 
    sendCursorUpdate,
    participants,
    cursors,
    isConnected
  } = useCollaboration();
  const { 
    getCodeCompletion, 
    getErrorDetection, 
    getCodeExplanation,
    isAILoading 
  } = useAI();
  const { startProjectSession, trackFileChange } = useAnalytics();
  
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [editorValue, setEditorValue] = useState<string>('');
  const [language, setLanguage] = useState<string>('javascript');
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  // Join collaboration room
  useEffect(() => {
    if (projectId && currentUser) {
      joinRoom(projectId, currentUser);
      startProjectSession(projectId);
      
      return () => {
        leaveRoom();
      };
    }
  }, [projectId, currentUser]);

  // Load project files
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;
      
      try {
        setIsLoading(true);
        // Load project files from API
        const response = await fetch(`/api/projects/${projectId}/files`);
        const data = await response.json();
        
        if (data.success && data.data.files.length > 0) {
          const firstFile = data.data.files[0];
          setSelectedFile(firstFile.id);
          setFileContent(firstFile.content);
          setLanguage(getLanguageFromExtension(firstFile.name));
          setEditorValue(firstFile.content);
        }
      } catch (error) {
        console.error('Failed to load project:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  // Handle editor changes
  const handleEditorChange = (value: string | undefined) => {
    if (!value || !selectedFile) return;
    
    setEditorValue(value);
    setFileContent(value);
    
    // Send change to other participants
    sendCodeChange({
      fileId: selectedFile,
      content: value,
      timestamp: Date.now(),
    });
    
    // Track file change
    trackFileChange(selectedFile, {
      content: value,
      timestamp: Date.now(),
    });
  };

  // Handle cursor changes
  const handleCursorChange = (event: any) => {
    if (!currentUser) return;
    
    const position = event.position;
    sendCursorUpdate({
      userId: currentUser.id,
      userName: currentUser.name,
      userColor: currentUser.color,
      position,
      timestamp: Date.now(),
    });
  };

  // Save file
  const handleSave = async () => {
    if (!selectedFile || !editorValue) return;
    
    try {
      const response = await fetch(`/api/projects/${projectId}/files/${selectedFile}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editorValue }),
      });
      
      if (response.ok) {
        // Show success message
        console.log('File saved successfully');
      }
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  // Run code
  const handleRun = () => {
    setShowPreview(true);
  };

  // Get language from file extension
  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'jsx': return 'javascript';
      case 'tsx': return 'typescript';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'py': return 'python';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      case 'c': return 'c';
      case 'php': return 'php';
      case 'rb': return 'ruby';
      case 'go': return 'go';
      case 'rs': return 'rust';
      default: return 'javascript';
    }
  };

  // AI Code completion
  const handleAIAssist = async () => {
    if (!editorValue || !currentUser) return;
    
    try {
      const completion = await getCodeCompletion(editorValue);
      if (completion) {
        // Insert AI suggestion
        const currentPosition = editorRef.current?.getPosition();
        if (currentPosition) {
          editorRef.current?.executeEdits('ai-completion', [{
            range: {
              startLineNumber: currentPosition.lineNumber,
              startColumn: currentPosition.column,
              endLineNumber: currentPosition.lineNumber,
              endColumn: currentPosition.column,
            },
            text: completion,
          }]);
        }
      }
    } catch (error) {
      console.error('AI assistance failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Left Sidebar - File Explorer */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-2">Files</h2>
          <button className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            New File
          </button>
        </div>
        
        <FileExplorer 
          projectId={projectId!}
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
        />
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Editor Toolbar */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-white text-sm">
                  {selectedFile ? `Editing: ${selectedFile}` : 'No file selected'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-gray-400 text-sm">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSave}
                className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </button>
              
              <button
                onClick={handleRun}
                className="flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                <Play className="w-4 h-4 mr-1" />
                Run
              </button>
              
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </button>
              
              <button
                onClick={() => setShowTerminal(!showTerminal)}
                className="flex items-center px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                <Terminal className="w-4 h-4 mr-1" />
                Terminal
              </button>
              
              <button
                onClick={handleAIAssist}
                disabled={isAILoading}
                className="flex items-center px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                <Bot className="w-4 h-4 mr-1" />
                {isAILoading ? 'AI...' : 'AI Assist'}
              </button>
            </div>
          </div>
        </div>

        {/* Editor and Panels */}
        <div className="flex-1 flex">
          {/* Main Editor */}
          <div className="flex-1 relative">
            <Editor
              height="100%"
              defaultLanguage={language}
              value={editorValue}
              theme={theme}
              onChange={handleEditorChange}
              onMount={(editor, monaco) => {
                editorRef.current = editor;
                monacoRef.current = monaco;
              }}
              onCursorPositionChanged={handleCursorChange}
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                fontFamily: 'JetBrains Mono, monospace',
                wordWrap: 'on',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
              }}
            />
            
            {/* Collaboration Cursors */}
            <CollaborationCursors cursors={cursors} />
          </div>

          {/* Right Panels */}
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            {/* Panel Tabs */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  showParticipants 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Participants
              </button>
              
              <button
                onClick={() => setShowChat(!showChat)}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  showChat 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </button>
              
              <button
                onClick={() => setShowAIPanel(!showAIPanel)}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  showAIPanel 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Bot className="w-4 h-4 mr-2" />
                AI
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {showParticipants && (
                <ParticipantsPanel participants={participants} />
              )}
              
              {showChat && (
                <ChatPanel projectId={projectId!} />
              )}
              
              {showAIPanel && (
                <AIPanel 
                  code={editorValue}
                  onCodeChange={setEditorValue}
                />
              )}
            </div>
          </div>
        </div>

        {/* Bottom Panels */}
        {showPreview && (
          <div className="h-64 bg-white border-t border-gray-300">
            <Preview code={editorValue} language={language} />
          </div>
        )}
        
        {showTerminal && (
          <div className="h-64 bg-black border-t border-gray-700">
            <TerminalPanel projectId={projectId!} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor; 