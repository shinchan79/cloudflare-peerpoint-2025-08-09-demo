import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  FolderOpen, 
  Code, 
  BarChart3, 
  Settings, 
  Users, 
  MessageSquare,
  Plus,
  Menu,
  X
} from 'lucide-react';
import { useAppStore } from '../../store';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { currentUser, sidebarOpen, setSidebarOpen } = useAppStore();
  const { logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Projects', href: '/projects', icon: FolderOpen },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sidebar-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                CodeCollab
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Live
              </p>
            </div>
          </div>
          
          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* User info */}
      {currentUser && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: currentUser.color }}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {currentUser.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-content">
        <div className="px-4 py-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Quick actions */}
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <ul className="space-y-2">
            <li>
              <button className="nav-item w-full justify-start">
                <Plus className="w-5 h-5 mr-3" />
                New Project
              </button>
            </li>
            <li>
              <button className="nav-item w-full justify-start">
                <Users className="w-5 h-5 mr-3" />
                Invite Team
              </button>
            </li>
            <li>
              <button className="nav-item w-full justify-start">
                <MessageSquare className="w-5 h-5 mr-3" />
                Support Chat
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="status-online"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Online
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 