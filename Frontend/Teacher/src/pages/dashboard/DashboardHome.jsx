import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  FileText,
  ClipboardCheck,
  Calendar,
  BookOpen,
  Users,
  CheckCircle,
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowRight,
  Loader,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ClassFilter from '../../components/ClassFilter';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const DashboardHome = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [filter, setFilter] = useState({ year: '', department: '', section: '' });
  const [dashboardData, setDashboardData] = useState({
    classesToday: 0,
    scheduledClasses: 0,
    students: 0,
    pendingGrading: 0,
    materials: 0,
    assignmentsCreated: 0,
  });
  const [quizzesCount, setQuizzesCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [teacherStats, setTeacherStats] = useState({
    totalHours: 0,
    avgRating: 0,
    activeStudents: 0,
  });
  const [formData, setFormData] = useState({
      profileImage: user?.profileImage || null,
    });

  // Static chart data - don't put in state
  const activityData = [
    { time: '8 AM', assignments: 5, quizzes: 3 },
    { time: '9 AM', assignments: 8, quizzes: 5 },
    { time: '10 AM', assignments: 6, quizzes: 4 },
    { time: '11 AM', assignments: 10, quizzes: 7 },
    { time: '12 PM', assignments: 12, quizzes: 6 },
    { time: '1 PM', assignments: 9, quizzes: 5 },
    { time: '2 PM', assignments: 15, quizzes: 8 },
    { time: '3 PM', assignments: 18, quizzes: 9 },
  ];

  const performanceData = [
    { week: 'Mon', performance: 78, engagement: 85 },
    { week: 'Tue', performance: 82, engagement: 87 },
    { week: 'Wed', performance: 75, engagement: 80 },
    { week: 'Thu', performance: 88, engagement: 90 },
    { week: 'Fri', performance: 92, engagement: 93 },
    { week: 'Sat', performance: 85, engagement: 88 },
    { week: 'Sun', performance: 80, engagement: 82 },
  ];

  const API = import.meta.env.VITE_API_URL || 'http://localhost:7000';

  useEffect(() => {
    if (!token) return;
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const opts = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };

      // Fetch teacher resources and meetings
      const [assignResRaw, quizResRaw, lecturesResRaw, meetingsResRaw] = await Promise.all([
        fetch(`${API}/api/assignments`, opts),
        fetch(`${API}/api/quizzes`, opts),
        fetch(`${API}/api/lectures/teacher/all`, opts),
        fetch(`${API}/api/meetings/my`, opts),
      ]);

      const safeJson = async (r) => {
        try {
          if (!r || !r.ok) return [];
          return await r.json();
        } catch (e) {
          return [];
        }
      };

      const assignRes = await safeJson(assignResRaw);
      const quizRes = await safeJson(quizResRaw);
      const lecturesRes = await safeJson(lecturesResRaw);
      const meetingsRes = await safeJson(meetingsResRaw);

      const assignmentsCount = Array.isArray(assignRes) ? assignRes.length : 0;
      const quizzesCount = Array.isArray(quizRes) ? quizRes.length : 0;
      const materialsCount = Array.isArray(lecturesRes) ? lecturesRes.length : 0;

      // Compute classes today and scheduled upcoming classes from meetings
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      let classesToday = 0;
      let scheduledClasses = 0;
      const upcomingMeetings = [];
      if (Array.isArray(meetingsRes)) {
        meetingsRes.forEach(m => {
          const start = m.startsAt ? new Date(m.startsAt) : null;
          if (!start) return;
          if (start >= startOfToday && start < endOfToday) classesToday += 1;
          if (start >= now && upcomingMeetings.length < 3) {
            upcomingMeetings.push({
              id: m._id,
              title: m.title || 'Class',
              time: start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
              date: start.toLocaleDateString(),
              participants: 12, // Mock data
            });
          }
          if (start >= now) scheduledClasses += 1;
        });
      }
      setUpcomingEvents(upcomingMeetings);

      // Students and pending grading depend on class filter
      let studentsCount = 0;
      let pendingGrading = 0;

      if (filter.year && filter.department && filter.section) {
        const studentsResRaw = await fetch(
          `${API}/api/attendance/students?year=${encodeURIComponent(filter.year)}&department=${encodeURIComponent(filter.department)}&section=${encodeURIComponent(filter.section)}`,
          opts,
        );
        const studentsRes = await safeJson(studentsResRaw);
        studentsCount = Array.isArray(studentsRes) ? studentsRes.length : 0;

        const submissionsResRaw = await fetch(
          `${API}/api/student-assignments/class/submissions/all?year=${encodeURIComponent(filter.year)}&department=${encodeURIComponent(filter.department)}&section=${encodeURIComponent(filter.section)}`,
          opts,
        );
        const submissionsRes = await safeJson(submissionsResRaw);
        if (Array.isArray(submissionsRes)) {
          pendingGrading = submissionsRes.filter(s => s.marks === null || s.marks === undefined).length;
        }
      }

      // Get recent assignments
      const recentAssigns = Array.isArray(assignRes)
        ? assignRes.slice(0, 5).map(a => ({
          id: a._id,
          title: a.title,
          dueDate: a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'N/A',
          submissions: 15, // Mock
          status: Math.random() > 0.5 ? 'Active' : 'Closed',
        }))
        : [];
      setRecentAssignments(recentAssigns);

      setDashboardData({
        classesToday,
        scheduledClasses,
        students: studentsCount,
        pendingGrading,
        materials: materialsCount,
        assignmentsCreated: assignmentsCount,
      });

      setTeacherStats({
        totalHours: classesToday * 2,
        avgRating: 4.8,
        activeStudents: studentsCount,
      });

      setQuizzesCount(Array.isArray(quizRes) ? quizRes.length : 0);
    } catch (err) {
      console.error('Error fetching teacher dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Assignments',
      value: dashboardData.assignmentsCreated,
      icon: <FileText className="w-8 h-8 text-orange-400" />,
      onClick: () => navigate('/dashboard/assignments'),
      bgColor: 'from-orange-500/20 to-orange-600/10',
      borderColor: 'border-orange-500/30',
    },
    {
      title: 'Total Quizzes',
      value: quizzesCount,
      icon: <ClipboardCheck className="w-8 h-8 text-purple-400" />,
      onClick: () => navigate('/dashboard/quizzes'),
      bgColor: 'from-purple-500/20 to-purple-600/10',
      borderColor: 'border-purple-500/30',
    },
    {
      title: 'Total Lectures',
      value: dashboardData.materials,
      icon: <BookOpen className="w-8 h-8 text-cyan-400" />,
      onClick: () => navigate('/dashboard/lectures'),
      bgColor: 'from-cyan-500/20 to-cyan-600/10',
      borderColor: 'border-cyan-500/30',
    },
    {
      title: 'Pending Grading',
      value: dashboardData.pendingGrading,
      icon: <CheckCircle className="w-8 h-8 text-red-400" />,
      onClick: () => navigate('/dashboard/marks'),
      bgColor: 'from-red-500/20 to-red-600/10',
      borderColor: 'border-red-500/30',
    },
  ];

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <ClassFilter onFilterChange={setFilter} user={user} />

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-xl mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 backdrop-blur-lg rounded-2xl p-8 border border-cyan-500/30 mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="md:w-1/2">
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome back, <span className="text-cyan-400">{user?.name?.split(' ')[0] || 'Teacher'}</span>!
            </h1>
            <p className="text-gray-300 mb-4">
              You have {dashboardData.pendingGrading} assignments awaiting grading and {upcomingEvents.length} upcoming classes.
            </p>
            <button
              onClick={() => navigate('/dashboard/meetings')}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-6 py-2 rounded-lg text-white font-semibold transition-all flex items-center gap-2 w-auto"
            >
              <Video className="w-4 h-4" /> Start Class
            </button>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center border border-cyan-500/50">
              <img
               src={formData.profileImage}
                alt="Profile"
                className="w-full h-full rounded-full object-cover border-4 border-cyan-500/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-cyan-400" />
          Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={stat.onClick}
              className={`text-left bg-gradient-to-br ${stat.bgColor} backdrop-blur-lg p-6 rounded-xl border ${stat.borderColor} hover:border-opacity-100 transition-all transform hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-gray-700/50">
                  {stat.icon}
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-gray-400 text-sm">{stat.title}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Charts Section - takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Activity Hours Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-cyan-500/20"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-400" />
              Activity Hours
            </h3>
            {activityData.length > 0 && (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #00FFFF',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="assignments" fill="#f97316" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="quizzes" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Performance Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-cyan-500/20"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Performance
            </h3>
            {performanceData.length > 0 && (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #00FFFF',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="performance"
                    stroke="#00FFFF"
                    strokeWidth={2}
                    dot={{ fill: '#00FFFF' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="engagement"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gradient-to-br from-purple-500/20 to-cyan-500/20 backdrop-blur-lg p-6 rounded-xl border border-cyan-500/30 text-center"
          >
            <h3 className="text-xl font-bold text-white mb-4">Profile</h3>
            <div className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-cyan-500/50 overflow-hidden">
              <img
              src={formData.profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-white font-semibold mb-2">{user?.name || 'Teacher'}</p>
            <p className="text-gray-400 text-sm mb-4">{user?.email || 'teacher@example.com'}</p>
            <div className="space-y-2 text-left">
              <div className="bg-gray-700/50 p-3 rounded-lg">
                <p className="text-gray-400 text-xs">Teaching Hours</p>
                <p className="text-cyan-400 font-bold">{teacherStats.totalHours}h</p>
              </div>
              <div className="bg-gray-700/50 p-3 rounded-lg">
                <p className="text-gray-400 text-xs">Avg Rating</p>
                <p className="text-orange-400 font-bold">⭐ {teacherStats.avgRating}</p>
              </div>
              <div className="bg-gray-700/50 p-3 rounded-lg">
                <p className="text-gray-400 text-xs">Active Students</p>
                <p className="text-purple-400 font-bold">{teacherStats.activeStudents}</p>
              </div>
            </div>
          </motion.div>

          {/* Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-cyan-500/20"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              Upcoming Events
            </h3>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event, idx) => (
                  <div key={idx} className="bg-gray-700/50 p-3 rounded-lg border border-cyan-500/20 hover:border-cyan-500/40 transition-all">
                    <p className="text-white font-semibold text-sm truncate">{event.title}</p>
                    <p className="text-gray-400 text-xs mb-1">{event.date}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-400 text-xs font-semibold">{event.time}</span>
                      <span className="text-gray-400 text-xs">{event.participants} attendees</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">No upcoming events</p>
            )}
            <button
              onClick={() => navigate('/dashboard/meetings')}
              className="w-full mt-4 p-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg text-cyan-400 text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </div>

      {/* My Assignments Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-cyan-500/20"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-400" />
          My Assignments
        </h3>
        {recentAssignments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-gray-400">Title</th>
                  <th className="text-left p-3 text-gray-400">Due Date</th>
                  <th className="text-left p-3 text-gray-400">Submissions</th>
                  <th className="text-left p-3 text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAssignments.map((assignment, idx) => (
                  <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-all">
                    <td className="p-3 text-white font-semibold">{assignment.title}</td>
                    <td className="p-3 text-gray-400">{assignment.dueDate}</td>
                    <td className="p-3 text-cyan-400">{assignment.submissions}</td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${assignment.status === 'Active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                        }`}>
                        {assignment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No assignments yet</p>
        )}
        <button
          onClick={() => navigate('/dashboard/assignments')}
          className="w-full mt-4 p-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg text-orange-400 text-sm font-semibold transition-all flex items-center justify-center gap-2"
        >
          View All Assignments <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );
};

export default DashboardHome;
