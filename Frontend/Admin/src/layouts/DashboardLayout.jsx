import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardSidebar from '../components/DashboardSidebar';
import { useAuth } from '../context/AuthContext';
import { Bell, Settings, Menu,  } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Notifications from '../components/Notifications';

const DashboardLayout = () => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-gray-900 text-white">
      <DashboardSidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <main className="flex-1 flex flex-col">
        <header className="bg-gray-800/50 backdrop-blur-lg border-b border-cyan-500/20 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  className="lg:hidden p-2 -ml-2 mr-2 text-gray-300 hover:text-white"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold hidden sm:block">Welcome, {user?.name.split(' ')[0]}!</h1>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
               <div className="hidden sm:block">
            {/* Notifications dropdown */}
            <Notifications />
          </div>
              
                <button onClick={() => navigate('/dashboard/profile')} title="View profile" className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold hover:scale-105 transition-transform">
                  {user?.name.charAt(0)}
                </button>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
