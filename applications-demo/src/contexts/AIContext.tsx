import React, { createContext, useContext, useState } from 'react';
import { AICompletion, AIError, AIChatMessage } from '../types';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface AIContextType {
  isAILoading: boolean;
  getCodeCompletion: (code: string) => Promise<string | null>;
  getErrorDetection: (code: string) => Promise<any[]>;
  getCodeExplanation: (code: string) => Promise<string | null>;
  chatWithAI: (message: string, code?: string, language?: string) => Promise<AIChatMessage | null>;
  explainCode: (code: string, language: string) => Promise<string | null>;
  optimizeCode: (code: string, language: string) => Promise<string | null>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

interface AIProviderProps {
  children: React.ReactNode;
}

export const AIProvider: React.FC<AIProviderProps> = ({ children }) => {
  const [isAILoading, setIsAILoading] = useState(false);

  const getCodeCompletion = async (code: string): Promise<string | null> => {
    try {
      setIsAILoading(true);
      const response = await api.post('/api/ai/completion', {
        code,
      });

      if (response.data.success) {
        return response.data.data.completion;
      }
      return null;
    } catch (error) {
      console.error('AI completion error:', error);
      toast.error('Failed to get AI completion');
      return null;
    } finally {
      setIsAILoading(false);
    }
  };

  const getErrorDetection = async (code: string): Promise<any[]> => {
    try {
      setIsAILoading(true);
      const response = await api.post('/api/ai/errors', {
        code,
      });

      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('AI error detection error:', error);
      toast.error('Failed to detect errors');
      return [];
    } finally {
      setIsAILoading(false);
    }
  };

  const chatWithAI = async (message: string, code?: string, language?: string): Promise<AIChatMessage | null> => {
    try {
      setIsAILoading(true);
      const response = await api.post('/api/ai/chat', {
        message,
        code,
        language,
      });

      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('AI chat error:', error);
      toast.error('Failed to chat with AI');
      return null;
    } finally {
      setIsAILoading(false);
    }
  };

  const explainCode = async (code: string, language: string): Promise<string | null> => {
    try {
      setIsAILoading(true);
      const response = await api.post('/api/ai/explain', {
        code,
        language,
      });

      if (response.data.success) {
        return response.data.data.explanation;
      }
      return null;
    } catch (error) {
      console.error('AI explanation error:', error);
      toast.error('Failed to explain code');
      return null;
    } finally {
      setIsAILoading(false);
    }
  };

  const getCodeExplanation = async (code: string): Promise<string | null> => {
    try {
      setIsAILoading(true);
      const response = await api.post('/api/ai/explain', {
        code,
      });

      if (response.data.success) {
        return response.data.data.explanation;
      }
      return null;
    } catch (error) {
      console.error('AI explanation error:', error);
      toast.error('Failed to explain code');
      return null;
    } finally {
      setIsAILoading(false);
    }
  };

  const optimizeCode = async (code: string, language: string): Promise<string | null> => {
    try {
      setIsAILoading(true);
      const response = await api.post('/api/ai/optimize', {
        code,
        language,
      });

      if (response.data.success) {
        return response.data.data.suggestions;
      }
      return null;
    } catch (error) {
      console.error('AI optimization error:', error);
      toast.error('Failed to optimize code');
      return null;
    } finally {
      setIsAILoading(false);
    }
  };

  const value: AIContextType = {
    isAILoading,
    getCodeCompletion,
    getErrorDetection,
    getCodeExplanation,
    chatWithAI,
    explainCode,
    optimizeCode,
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
}; 