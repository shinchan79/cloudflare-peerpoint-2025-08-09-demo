import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Code, Users, Clock, Star } from 'lucide-react';
import { useAppStore } from '../../store';

const ProjectList: React.FC = () => {
  const { currentUser } = useAppStore();

  const projects = [
    {
      id: '1',
      name: 'React Todo App',
      description: 'A modern todo application built with React and TypeScript',
      language: 'TypeScript',
      collaborators: 3,
      lastUpdated: '2 minutes ago',
      isStarred: true,
      color: '#3b82f6',
    },
    {
      id: '2',
      name: 'E-commerce Platform',
      description: 'Full-stack e-commerce solution with payment integration',
      language: 'JavaScript',
      collaborators: 5,
      lastUpdated: '1 hour ago',
      isStarred: false,
      color: '#ef4444',
    },
    {
      id: '3',
      name: 'AI Chat Bot',
      description: 'Intelligent chatbot powered by OpenAI GPT',
      language: 'Python',
      collaborators: 2,
      lastUpdated: '3 hours ago',
      isStarred: true,
      color: '#10b981',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Projects
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your collaborative coding projects
          </p>
        </div>
        <Link
          to="/projects/new"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Link>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="card hover:shadow-lg transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: project.color }}
                  >
                    <Code className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {project.language}
                    </p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-yellow-500 transition-colors">
                  <Star className={`w-5 h-5 ${project.isStarred ? 'fill-current text-yellow-500' : ''}`} />
                </button>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {project.description}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{project.collaborators}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{project.lastUpdated}</span>
                </div>
              </div>
              
              <Link
                to={`/projects/${project.id}`}
                className="w-full btn-secondary text-center"
              >
                Open Project
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <div className="text-center py-12">
          <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No projects yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Create your first project to start coding with your team. Collaborate in real-time with live cursors and instant updates.
          </p>
          <Link to="/projects/new" className="btn-primary">
            Create Your First Project
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProjectList; 