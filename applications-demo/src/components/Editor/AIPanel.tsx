import React, { useState } from 'react';
import { Bot, Zap, Lightbulb, AlertCircle, CheckCircle } from 'lucide-react';
import { useAI } from '../../contexts/AIContext';

interface AIPanelProps {
  code: string;
  onCodeChange: (code: string) => void;
}

const AIPanel: React.FC<AIPanelProps> = ({ code, onCodeChange }) => {
  const { getCodeCompletion, getErrorDetection, getCodeExplanation, isAILoading } = useAI();
  const [activeTab, setActiveTab] = useState<'completion' | 'errors' | 'explain'>('completion');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [explanation, setExplanation] = useState<string>('');

  const handleCodeCompletion = async () => {
    if (!code.trim()) return;
    
    try {
      const completion = await getCodeCompletion(code);
      if (completion) {
        setSuggestions([completion]);
      }
    } catch (error) {
      console.error('AI completion failed:', error);
    }
  };

  const handleErrorDetection = async () => {
    if (!code.trim()) return;
    
    try {
      const detectedErrors = await getErrorDetection(code);
      setErrors(detectedErrors || []);
    } catch (error) {
      console.error('Error detection failed:', error);
    }
  };

  const handleCodeExplanation = async () => {
    if (!code.trim()) return;
    
    try {
      const explanationText = await getCodeExplanation(code);
      setExplanation(explanationText || '');
    } catch (error) {
      console.error('Code explanation failed:', error);
    }
  };

  const applySuggestion = (suggestion: string) => {
    onCodeChange(code + '\n' + suggestion);
  };

  const tabs = [
    { id: 'completion', name: 'Code Completion', icon: Zap },
    { id: 'errors', name: 'Error Detection', icon: AlertCircle },
    { id: 'explain', name: 'Code Explanation', icon: Lightbulb },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-gray-400" />
          <h3 className="text-white font-medium">AI Assistant</h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'completion' && (
          <div className="space-y-4">
            <button
              onClick={handleCodeCompletion}
              disabled={isAILoading || !code.trim()}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Zap className="w-4 h-4 mr-2" />
              {isAILoading ? 'AI Thinking...' : 'Get Code Suggestions'}
            </button>
            
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white">Suggestions:</h4>
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-300 mb-2">{suggestion}</p>
                    <button
                      onClick={() => applySuggestion(suggestion)}
                      className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="space-y-4">
            <button
              onClick={handleErrorDetection}
              disabled={isAILoading || !code.trim()}
              className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              {isAILoading ? 'Analyzing...' : 'Detect Errors'}
            </button>
            
            {errors.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white">Detected Issues:</h4>
                {errors.map((error, index) => (
                  <div key={index} className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-300">{error.message}</p>
                        <p className="text-xs text-red-400 mt-1">Line {error.line}</p>
                        {error.suggestion && (
                          <p className="text-xs text-gray-300 mt-1">Suggestion: {error.suggestion}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-4">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No errors detected</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'explain' && (
          <div className="space-y-4">
            <button
              onClick={handleCodeExplanation}
              disabled={isAILoading || !code.trim()}
              className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              {isAILoading ? 'Analyzing...' : 'Explain Code'}
            </button>
            
            {explanation && (
              <div className="p-3 bg-gray-700 rounded-lg">
                <h4 className="text-sm font-medium text-white mb-2">Explanation:</h4>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{explanation}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPanel; 