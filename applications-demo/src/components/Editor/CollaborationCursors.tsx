import React from 'react';
import { Cursor } from '../../types';

interface CollaborationCursorsProps {
  cursors: Cursor[];
}

const CollaborationCursors: React.FC<CollaborationCursorsProps> = ({ cursors }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {cursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute w-2 h-6 bg-opacity-80 rounded-sm animate-pulse"
          style={{
            backgroundColor: cursor.userColor,
            left: `${cursor.position.column * 8}px`,
            top: `${(cursor.position.lineNumber - 1) * 20}px`,
          }}
        >
          <div className="absolute -top-1 -left-1 w-3 h-3 rounded-full border-2 border-white shadow-sm"
               style={{ backgroundColor: cursor.userColor }}>
          </div>
          <div className="absolute top-6 left-0 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap">
            {cursor.userName}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CollaborationCursors; 