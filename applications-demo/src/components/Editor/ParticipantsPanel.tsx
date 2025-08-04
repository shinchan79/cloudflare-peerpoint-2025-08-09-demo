import React from 'react';
import { Users, User, Crown } from 'lucide-react';
import { User as UserType } from '../../types';

interface ParticipantsPanelProps {
  participants: UserType[];
}

const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({ participants }) => {
  return (
    <div className="flex flex-col h-full bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-gray-400" />
          <h3 className="text-white font-medium">Participants</h3>
          <span className="ml-auto text-sm text-gray-400">
            {participants.length} online
          </span>
        </div>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-4">
        {participants.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No participants</p>
            <p className="text-xs mt-1">Invite team members to collaborate</p>
          </div>
        ) : (
          <div className="space-y-3">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 transition-colors">
                <div className="relative">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: participant.color }}
                  >
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-white truncate">
                      {participant.name}
                    </span>
                    {participant.id === '1' && (
                      <Crown className="w-3 h-3 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {participant.email}
                  </p>
                </div>
                
                <div className="text-xs text-gray-400">
                  {participant.isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Button */}
      <div className="p-4 border-t border-gray-700">
        <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <User className="w-4 h-4 mr-2" />
          Invite Team Member
        </button>
      </div>
    </div>
  );
};

export default ParticipantsPanel; 