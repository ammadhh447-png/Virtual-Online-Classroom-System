import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home, ClipboardCheck, User, LogOut, GraduationCap, X, Bot,
  HelpCircle,
  FileText,
  CalendarCheck,
  BookOpen,
  School,
  Video,
  CheckCircle2,
  BarChart3,
  Wand2
} from 'lucide-react';

const DashboardSidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLinkClick = () => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }

  const navItems = [
    { name: 'Home', path: '/dashboard', icon: Home },
    { name: 'Quizzes', path: '/dashboard/quizzes', icon: HelpCircle },
    { name: 'Assignments', path: '/dashboard/assignments', icon: FileText },
    { name: 'Attendance', path: '/dashboard/attendance', icon: CalendarCheck },
    { name: 'Lectures', path: '/dashboard/lectures', icon: BookOpen },
    { name: 'Ai ChatBot', path: '/dashboard/aichatbot', icon: Bot },
    { name: 'AI Evaluator', path: '/dashboard/aievaluator', icon: Wand2 },
    { name: 'AI Quiz Generator', path: '/dashboard/aiquizgenerator', icon: Wand2 },
    { name: 'Class Meetings', path: '/dashboard/meetings', icon: School },
    { name: 'Assignment Checker', path: '/dashboard/checkassignments', icon: ClipboardCheck },
    { name: 'Quiz Checker', path: '/dashboard/checkquizes', icon: CheckCircle2 },
    { name: 'Marks', path: '/dashboard/marks', icon: BarChart3 },
    { name: 'Profile', path: '/dashboard/profile', icon: User },
  ];

  return (
    <>
      <aside className={`fixed lg:relative inset-y-0 left-0 w-64 bg-gray-800/80 backdrop-blur-lg border-r border-cyan-500/20 flex flex-col transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out z-40`}>
        <div className="p-6 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <GraduationCap className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold text-white">Virtual CUI</span>
          </div>
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  end={item.path === '/dashboard'}
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    `flex items-center p-3 rounded-lg transition-colors ${isActive
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-3 rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      {isSidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/60 z-30" onClick={() => setIsSidebarOpen(false)}></div>}
    </>
  );
};

export default DashboardSidebar;
