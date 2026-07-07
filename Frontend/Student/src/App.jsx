import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ClassroomMeeting from './pages/ClassroomMeeting';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import NotificationsPage from './pages/dashboard/Notifications';
import ForgotPassword from './pages/ForgotPassword';
import MarksPage from './pages/dashboard/MarksPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import Assignments from './pages/dashboard/Assignments';
import Quizez from './pages/dashboard/Quizez';
import ClassTiming from './pages/dashboard/ClassTiming';
import Attendence from './pages/dashboard/Attendence';
import Recordings from './pages/dashboard/Recordings';
import AiChatBot from './pages/dashboard/AiChatBot';
import Lectures from './pages/dashboard/Lectures';

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
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={true} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        <div className="min-h-screen bg-black">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
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
              <Route path="assignments" element={<Assignments />} />
              <Route path="quizez" element={<Quizez />} />
              <Route path="marks" element={<MarksPage />} />
              <Route path="classtimings" element={<ClassTiming />} />
              <Route path="attendence" element={<Attendence />} />
              <Route path="recording" element={<Recordings />} />
              <Route path="lectures" element={<Lectures />} />
              <Route path="aichatbot" element={<AiChatBot />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            <Route
              path="/classroom"
              element={
                <ProtectedRoute>
                  <ClassroomMeeting />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
