import React, { useState, useEffect } from 'react';
import { FileText, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';

interface FileExplorerProps {
  projectId: string;
  selectedFile: string | null;
  onFileSelect: (fileId: string) => void;
}

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
}

const FileExplorer: React.FC<FileExplorerProps> = ({ projectId, selectedFile, onFileSelect }) => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects/${projectId}/files`);
        const data = await response.json();
        
        if (data.success) {
          setFiles(data.data.files || []);
        }
      } catch (error) {
        console.error('Failed to load files:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFiles();
  }, [projectId]);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileNode = (node: FileNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedFile === node.id;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center px-2 py-1 cursor-pointer hover:bg-gray-700 transition-colors ${
            isSelected ? 'bg-blue-600 text-white' : 'text-gray-300'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.id);
            } else {
              onFileSelect(node.id);
            }
          }}
        >
          {node.type === 'folder' ? (
            <>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 mr-1" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-1" />
              )}
              <FolderOpen className="w-4 h-4 mr-2 text-blue-400" />
            </>
          ) : (
            <FileText className="w-4 h-4 mr-2 text-gray-400" />
          )}
          <span className="text-sm truncate">{node.name}</span>
        </div>
        
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderFileNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {files.length === 0 ? (
        <div className="p-4 text-center text-gray-400">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No files yet</p>
        </div>
      ) : (
        <div className="py-2">
          {files.map(file => renderFileNode(file))}
        </div>
      )}
    </div>
  );
};

export default FileExplorer; 