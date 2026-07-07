import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import DepartmentPage from './pages/dashboard/DepartmentPage';
import MarksPage from './pages/dashboard/MarksPage';
import NotificationsPage from './pages/dashboard/Notifications';
import ForgotPassword from './pages/ForgotPassword';
import ProfilePage from './pages/dashboard/ProfilePage';
import ManageStudents from './pages/ManageStudents';
import ManageTeachers from './pages/ManageTeachers';
import MeetingsAdmin from './pages/dashboard/MeetingsAdmin';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="min-h-screen bg-black flex items-center justify-center text-white text-2xl">Something went wrong. Please refresh.</div>;
    }
    return this.props.children;
  }
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-black">
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />


            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="departments" element={<DepartmentPage />} />
              <Route path="teachers" element={<ManageTeachers />} />
              <Route path="students" element={<ManageStudents />} />
              <Route path="meetings" element={<MeetingsAdmin />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
