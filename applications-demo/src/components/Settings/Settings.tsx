import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Palette,
  Monitor,
  Moon,
  Sun,
  Globe,
  Key,
  Trash2
} from 'lucide-react';
import { useAppStore } from '../../store';
import { useAuth } from '../../contexts/AuthContext';

const Settings: React.FC = () => {
  const { currentUser } = useAppStore();
  const { updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'preferences', name: 'Preferences', icon: SettingsIcon },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'appearance', name: 'Appearance', icon: Palette },
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // await updateProfile(profileData);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account preferences and settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Profile Information
              </h3>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0">
                    <div 
                      className="w-20 h-20 rounded-full flex items-center justify-center text-white text-xl font-medium"
                      style={{ backgroundColor: currentUser?.color || '#3b82f6' }}
                    >
                      {currentUser?.name?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1">
                    <button type="button" className="btn-secondary">
                      Change Avatar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue={currentUser?.name}
                      className="form-input"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue={currentUser?.email}
                      className="form-input"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    rows={4}
                    className="form-input"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Preferences
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Auto-save
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automatically save your work every 30 seconds
                    </p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Live collaboration
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Show real-time cursors and changes from other users
                    </p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      AI suggestions
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Enable AI-powered code completion and suggestions
                    </p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-5"></span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Notification Settings
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Email notifications
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive email notifications for important events
                    </p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Browser notifications
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Show browser notifications for real-time updates
                    </p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Sound alerts
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Play sound when someone joins or leaves your project
                    </p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-5"></span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Security Settings
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Key className="w-5 h-5 text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Change Password
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Update your account password
                      </p>
                    </div>
                  </div>
                  <button className="btn-secondary">
                    Change
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Two-Factor Authentication
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                  </div>
                  <button className="btn-secondary">
                    Enable
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Trash2 className="w-5 h-5 text-red-400" />
                    <div>
                      <h4 className="font-medium text-red-900 dark:text-red-100">
                        Delete Account
                      </h4>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Permanently delete your account and all data
                      </p>
                    </div>
                  </div>
                  <button className="px-4 py-2 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Appearance
              </h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                    Theme
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <button className="flex items-center justify-center p-4 border-2 border-blue-500 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <Sun className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      <span className="ml-2 text-sm font-medium text-blue-600 dark:text-blue-400">Light</span>
                    </button>
                    <button className="flex items-center justify-center p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500">
                      <Moon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400">Dark</span>
                    </button>
                    <button className="flex items-center justify-center p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500">
                      <Monitor className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400">Auto</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                    Language
                  </h4>
                  <select className="form-input w-full md:w-64">
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                    <option>Chinese</option>
                  </select>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                    Time Zone
                  </h4>
                  <select className="form-input w-full md:w-64">
                    <option>UTC-8 (Pacific Time)</option>
                    <option>UTC-5 (Eastern Time)</option>
                    <option>UTC+0 (GMT)</option>
                    <option>UTC+1 (Central European Time)</option>
                    <option>UTC+7 (Indochina Time)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings; 