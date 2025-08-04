import React, { useState, useEffect } from 'react';
import { 
  Code, 
  Users, 
  Clock, 
  TrendingUp, 
  Activity,
  FileText,
  GitBranch,
  Zap,
  Plus
} from 'lucide-react';
import { useAppStore } from '../../store';
import { analyticsService, UserStats, PerformanceMetrics } from '../../services/analytics';

const Dashboard: React.FC = () => {
  const { currentUser } = useAppStore();
  const [userStats, setUserStats] = useState<UserStats>({
    totalProjects: 0,
    activeUsers: 0,
    hoursCoded: 0,
    performance: 0,
  });
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    networkUsage: 0,
    responseTime: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (currentUser) {
        try {
          const [stats, performance] = await Promise.all([
            analyticsService.getUserStats(currentUser.id),
            analyticsService.getPerformanceMetrics(),
          ]);
          setUserStats(stats);
          setPerformanceMetrics(performance);
        } catch (error) {
          console.error('Failed to load stats:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadStats();
  }, [currentUser]);

  const stats = [
    {
      name: 'Active Projects',
      value: userStats.totalProjects.toString(),
      change: '+2',
      changeType: 'positive',
      icon: Code,
    },
    {
      name: 'Team Members',
      value: userStats.activeUsers.toString(),
      change: '+1',
      changeType: 'positive',
      icon: Users,
    },
    {
      name: 'Hours Coded',
      value: userStats.hoursCoded.toString(),
      change: '+12',
      changeType: 'positive',
      icon: Clock,
    },
    {
      name: 'Performance',
      value: `${userStats.performance}%`,
      change: '+3%',
      changeType: 'positive',
      icon: TrendingUp,
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'project',
      title: 'React Todo App',
      description: 'Updated main component',
      time: '2 minutes ago',
      user: 'Demo User',
      color: '#3b82f6',
    },
    {
      id: 2,
      type: 'collaboration',
      title: 'Alice joined project',
      description: 'React Todo App',
      time: '5 minutes ago',
      user: 'Alice Developer',
      color: '#ef4444',
    },
    {
      id: 3,
      type: 'deployment',
      title: 'Deployment successful',
      description: 'React Todo App to production',
      time: '10 minutes ago',
      user: 'Demo User',
      color: '#10b981',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <FileText className="w-4 h-4" />;
      case 'collaboration':
        return <Users className="w-4 h-4" />;
      case 'deployment':
        return <GitBranch className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {currentUser?.name}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Here's what's happening with your projects today.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Live</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className={`text-sm ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change} from last week
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <stat.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            View all
          </button>
        </div>
        
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: activity.color }}
              >
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {activity.description}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.time}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.user}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105">
              <Plus className="w-5 h-5 mr-2" />
              Create New Project
            </button>
            <button className="w-full flex items-center justify-center px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Users className="w-5 h-5 mr-2" />
              Invite Team Members
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Performance
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{performanceMetrics.cpuUsage}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${performanceMetrics.cpuUsage}%` }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Memory</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{performanceMetrics.memoryUsage}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full transition-all duration-500" style={{ width: `${performanceMetrics.memoryUsage}%` }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Network</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{performanceMetrics.networkUsage}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full transition-all duration-500" style={{ width: `${performanceMetrics.networkUsage}%` }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Response Time</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{performanceMetrics.responseTime}ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 