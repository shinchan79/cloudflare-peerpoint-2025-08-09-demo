import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from './store';
import { AuthProvider } from './contexts/AuthContext';
import { CollaborationProvider } from './contexts/CollaborationContext';
import { AIProvider } from './contexts/AIContext';
import { useAnalytics } from './hooks/useAnalytics';

// Components
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import Editor from './components/Editor/Editor';
import ProjectList from './components/Projects/ProjectList';
import ProjectSettings from './components/Projects/ProjectSettings';
import Analytics from './components/Analytics/Analytics';
import Settings from './components/Settings/Settings';

// Styles
import './styles/globals.css';

function App() {
  const { theme } = useAppStore();
  const analytics = useAnalytics();

  React.useEffect(() => {
    // Apply theme
    document.documentElement.classList.remove('light', 'dark');
    if (theme === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.add(isDark ? 'dark' : 'light');
    } else {
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  return (
    <AuthProvider>
      <CollaborationProvider>
        <AIProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected routes */}
                <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="projects" element={<ProjectList />} />
                  <Route path="projects/:projectId" element={<Editor />} />
                  <Route path="projects/:projectId/settings" element={<ProjectSettings />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
              
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: theme === 'dark' ? '#374151' : '#fff',
                    color: theme === 'dark' ? '#f9fafb' : '#111827',
                    border: theme === 'dark' ? '1px solid #4b5563' : '1px solid #e5e7eb',
                  },
                }}
              />
            </div>
          </Router>
        </AIProvider>
      </CollaborationProvider>
    </AuthProvider>
  );
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, currentUser } = useAppStore();

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default App; 