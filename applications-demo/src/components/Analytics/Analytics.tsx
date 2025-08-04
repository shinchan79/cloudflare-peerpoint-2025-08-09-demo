import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Code,
  Activity,
  Zap,
  Target
} from 'lucide-react';
import { useAppStore } from '../../store';
import { analyticsService, UserStats, PerformanceMetrics } from '../../services/analytics';

const Analytics: React.FC = () => {
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
  const [realtimeActivity, setRealtimeActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (currentUser) {
        try {
          const [stats, performance, activity] = await Promise.all([
            analyticsService.getUserStats(currentUser.id),
            analyticsService.getPerformanceMetrics(),
            analyticsService.getRealtimeActivity(),
          ]);
          setUserStats(stats);
          setPerformanceMetrics(performance);
          setRealtimeActivity(activity);
        } catch (error) {
          console.error('Failed to load analytics:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadAnalytics();
    // Refresh every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const metrics = [
    {
      name: 'Total Projects',
      value: userStats.totalProjects.toString(),
      change: '+12%',
      changeType: 'positive',
      icon: Code,
    },
    {
      name: 'Active Users',
      value: userStats.activeUsers.toString(),
      change: '+8%',
      changeType: 'positive',
      icon: Users,
    },
    {
      name: 'Hours Coded',
      value: userStats.hoursCoded.toString(),
      change: '+15%',
      changeType: 'positive',
      icon: Clock,
    },
    {
      name: 'Performance',
      value: `${userStats.performance}%`,
      change: '+2.3%',
      changeType: 'positive',
      icon: Zap,
    },
  ];

  const chartData = [
    { month: 'Jan', projects: 12, users: 45, hours: 180 },
    { month: 'Feb', projects: 15, users: 52, hours: 220 },
    { month: 'Mar', projects: 18, users: 61, hours: 280 },
    { month: 'Apr', projects: 22, users: 68, hours: 320 },
    { month: 'May', projects: 24, users: 75, hours: 380 },
    { month: 'Jun', projects: 28, users: 82, hours: 420 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your team's performance and project metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="btn-secondary">
            Export Data
          </button>
          <button className="btn-primary">
            Generate Report
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div key={metric.name} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {metric.name}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metric.value}
                </p>
                <p className={`text-sm ${metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.change} from last month
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <metric.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects Growth */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Projects Growth
          </h3>
          <div className="space-y-4">
            {chartData.map((data, index) => (
              <div key={data.month} className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12">
                  {data.month}
                </span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(data.projects / 30) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                  {data.projects}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* User Activity */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            User Activity
          </h3>
          <div className="space-y-4">
            {chartData.map((data, index) => (
              <div key={data.month} className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12">
                  {data.month}
                </span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(data.users / 100) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                  {data.users}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="85, 100"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900 dark:text-white">85%</span>
              </div>
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Code Quality</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Excellent</p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="92, 100"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900 dark:text-white">92%</span>
              </div>
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Team Velocity</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">High</p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeDasharray="78, 100"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900 dark:text-white">78%</span>
              </div>
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Deployment Success</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Good</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                New project "AI Chat Bot" created
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                2 hours ago • Demo User
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Alice joined "React Todo App" project
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                4 hours ago • Alice Developer
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Performance target achieved for "E-commerce Platform"
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                1 day ago • System
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 