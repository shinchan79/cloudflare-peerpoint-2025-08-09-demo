import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Play, Square, Trash2 } from 'lucide-react';

interface TerminalPanelProps {
  projectId: string;
}

interface TerminalCommand {
  id: string;
  command: string;
  output: string;
  timestamp: Date;
  status: 'success' | 'error' | 'running';
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({ projectId }) => {
  const [commands, setCommands] = useState<TerminalCommand[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const executeCommand = async (command: string) => {
    if (!command.trim()) return;

    const newCommand: TerminalCommand = {
      id: Date.now().toString(),
      command: command.trim(),
      output: '',
      timestamp: new Date(),
      status: 'running',
    };

    setCommands(prev => [...prev, newCommand]);
    setIsRunning(true);
    setCurrentCommand('');

    try {
      // Simulate command execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock output based on command
      let output = '';
      if (command.includes('npm')) {
        output = 'npm command executed successfully';
      } else if (command.includes('git')) {
        output = 'git command completed';
      } else if (command.includes('ls') || command.includes('dir')) {
        output = 'index.html\npackage.json\nsrc/\nnode_modules/';
      } else if (command.includes('pwd')) {
        output = `/projects/${projectId}`;
      } else {
        output = `Command '${command}' executed successfully`;
      }

      setCommands(prev => 
        prev.map(cmd => 
          cmd.id === newCommand.id 
            ? { ...cmd, output, status: 'success' as const }
            : cmd
        )
      );
    } catch (error) {
      setCommands(prev => 
        prev.map(cmd => 
          cmd.id === newCommand.id 
            ? { ...cmd, output: `Error: ${error}`, status: 'error' as const }
            : cmd
        )
      );
    } finally {
      setIsRunning(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(currentCommand);
    }
  };

  const clearTerminal = () => {
    setCommands([]);
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="h-full bg-black text-green-400 font-mono text-sm">
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-2 border-b border-gray-700 bg-gray-900">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4" />
          <span className="text-white">Terminal</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearTerminal}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Clear terminal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {commands.length === 0 ? (
          <div className="text-gray-500">
            <p>Welcome to CodeCollab Terminal</p>
            <p>Type 'help' for available commands</p>
          </div>
        ) : (
          commands.map((cmd) => (
            <div key={cmd.id} className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-blue-400">$</span>
                <span>{cmd.command}</span>
                {cmd.status === 'running' && (
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                )}
              </div>
              {cmd.output && (
                <div className={`ml-4 ${cmd.status === 'error' ? 'text-red-400' : 'text-gray-300'}`}>
                  {cmd.output}
                </div>
              )}
            </div>
          ))
        )}
        
        {/* Current Input */}
        <div className="flex items-center space-x-2">
          <span className="text-blue-400">$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isRunning}
            className="flex-1 bg-transparent outline-none text-green-400 disabled:opacity-50"
            placeholder="Enter command..."
          />
        </div>
      </div>

      {/* Quick Commands */}
      <div className="p-2 border-t border-gray-700 bg-gray-900">
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-gray-400">Quick:</span>
          <button
            onClick={() => executeCommand('npm install')}
            disabled={isRunning}
            className="px-2 py-1 bg-gray-700 text-green-400 rounded hover:bg-gray-600 disabled:opacity-50"
          >
            npm install
          </button>
          <button
            onClick={() => executeCommand('npm run dev')}
            disabled={isRunning}
            className="px-2 py-1 bg-gray-700 text-green-400 rounded hover:bg-gray-600 disabled:opacity-50"
          >
            npm run dev
          </button>
          <button
            onClick={() => executeCommand('git status')}
            disabled={isRunning}
            className="px-2 py-1 bg-gray-700 text-green-400 rounded hover:bg-gray-600 disabled:opacity-50"
          >
            git status
          </button>
        </div>
      </div>
    </div>
  );
};

export default TerminalPanel; 