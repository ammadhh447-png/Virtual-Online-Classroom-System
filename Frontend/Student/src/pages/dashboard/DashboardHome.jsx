import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  GraduationCap,
  Video,
  FileText,
  ClipboardCheck,
  Calendar,
  BookOpen,
  Award,
  AlertCircle,
  Loader,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

import useNotifications from '../../hooks/useNotifications';

const DashboardHome = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  useNotifications(user);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completionData, setCompletionData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
    const [formData, setFormData] = useState({
  
      profileImage: user?.profileImage || null,
    });

  const API = import.meta.env.VITE_API_URL || 'http://localhost:7000';

  useEffect(() => {
    fetchDashboardData();
  }, [token, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [attendanceRes, assignmentsRes, quizzesRes, lecturesRes] = await Promise.all([
        axios.get(`${API}/api/attendance/stats/${user._id || user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: { stats: { present: 0, total: 0 } } })),
        axios.get(`${API}/api/student-assignments`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: [] })),
        axios.get(`${API}/api/student-quizzes`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: [] })),
        axios.get(`${API}/api/lectures/student/my-lectures`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: [] })),
      ]);

      const attendanceBody = attendanceRes.data || {};
      const attendanceStats = attendanceBody.stats || { present: 0, total: 0 };
      const attendancePercentage = attendanceStats.total > 0
        ? Math.round((attendanceStats.present / attendanceStats.total) * 100)
        : 0;

      const assignments = assignmentsRes.data || [];
      const quizzes = quizzesRes.data || [];
      const lectures = lecturesRes.data || [];

      // Fetch submission statuses
      const assignmentIds = assignments.map(a => a._id);
      const quizIds = quizzes.map(q => q._id);

      const assignmentSubmissionPromises = assignmentIds.map(id =>
        axios
          .get(`${API}/api/student-assignments/${id}/submission-status`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then(res => res.data)
          .catch(() => null),
      );

      const quizSubmissionPromises = quizIds.map(id =>
        axios
          .get(`${API}/api/student-quizzes/${id}/submission-status`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then(res => res.data)
          .catch(() => null),
      );

      const assignmentSubs = await Promise.all(assignmentSubmissionPromises);
      const quizSubs = await Promise.all(quizSubmissionPromises);

      // Calculate marks
      const percents = [];
      assignments.forEach((assignment, idx) => {
        const submission = assignmentSubs[idx] || null;
        const total = assignment.marks ?? null;
        const obtained = submission && submission.marks != null ? Number(submission.marks) : null;
        if (total && obtained != null) {
          percents.push((obtained / Number(total)) * 100);
        }
      });
      quizzes.forEach((quiz, idx) => {
        const submission = quizSubs[idx] || null;
        const total = quiz.marks ?? null;
        const obtained = submission && submission.marks != null ? Number(submission.marks) : null;
        if (total && obtained != null) {
          percents.push((obtained / Number(total)) * 100);
        }
      });

      const averageMarks = percents.length > 0
        ? Math.round(percents.reduce((sum, p) => sum + p, 0) / percents.length)
        : 0;

      // Calculate completion stats
      const completedAssignments = assignments.filter((a, idx) => assignmentSubs[idx]?.marks != null).length;
      const completedQuizzes = quizzes.filter((q, idx) => quizSubs[idx]?.marks != null).length;
      const assignmentCompletion = assignments.length > 0
        ? Math.round((completedAssignments / assignments.length) * 100)
        : 0;
      const quizCompletion = quizzes.length > 0
        ? Math.round((completedQuizzes / quizzes.length) * 100)
        : 0;

      setDashboardData({
        assignments: assignments.length,
        quizzes: quizzes.length,
        attendance: attendancePercentage,
        averageMarks: averageMarks,
        lectureNotes: lectures.length,
        lectureVideos: 0,
        subjects: new Set([
          ...assignments.map(a => a.courseName),
          ...quizzes.map(q => q.courseName),
        ]).size,
        assignmentCompletion,
        quizCompletion,
      });

      // Set completion data for chart
      setCompletionData([
        { name: 'Assignments', value: assignmentCompletion, fill: '#f97316' },
        { name: 'Incomplete', value: 100 - assignmentCompletion, fill: '#374151' },
      ].filter(d => d.value > 0));

      // Set performance data for pie chart
      setPerformanceData([
        { name: 'Excellent', value: Math.max(0, averageMarks - 20) || 5, fill: '#10b981' },
        { name: 'Good', value: Math.abs(averageMarks - 15) || 15, fill: '#3b82f6' },
        { name: 'Average', value: Math.max(0, 80 - averageMarks) || 20, fill: '#f59e0b' },
      ]);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      setDashboardData({
        assignments: 0,
        quizzes: 0,
        attendance: 0,
        averageMarks: 0,
        lectureNotes: 0,
        lectureVideos: 0,
        subjects: 0,
        assignmentCompletion: 0,
        quizCompletion: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#00FFFF', '#8b5cf6', '#10b981', '#f97316', '#3b82f6', '#ec4899'];

  const statsCards = [
    {
      title: 'Total Assignments',
      value: dashboardData?.assignments || 0,
      icon: <FileText className="w-8 h-8 text-orange-400" />,
      onClick: () => navigate('/dashboard/assignments'),
      bgColor: 'from-orange-500/20 to-orange-600/10',
      borderColor: 'border-orange-500/30',
    },
    {
      title: 'Total Quizzes',
      value: dashboardData?.quizzes || 0,
      icon: <ClipboardCheck className="w-8 h-8 text-purple-400" />,
      onClick: () => navigate('/dashboard/quizez'),
      bgColor: 'from-purple-500/20 to-purple-600/10',
      borderColor: 'border-purple-500/30',
    },
    {
      title: 'Attendance',
      value: `${dashboardData?.attendance || 0}%`,
      icon: <Calendar className="w-8 h-8 text-cyan-400" />,
      onClick: () => navigate('/dashboard/attendence'),
      bgColor: 'from-cyan-500/20 to-cyan-600/10',
      borderColor: 'border-cyan-500/30',
    },
    {
      title: 'Average Score',
      value: `${dashboardData?.averageMarks || 0}%`,
      icon: <Award className="w-8 h-8 text-blue-400" />,
      onClick: () => navigate('/dashboard/marks'),
      bgColor: 'from-blue-500/20 to-blue-600/10',
      borderColor: 'border-blue-500/30',
    },
  ];

  const quickLinks = [
    {
      title: 'Assignments',
      icon: <FileText className="w-6 h-6" />,
      onClick: () => navigate('/dashboard/assignments'),
      color: 'from-orange-500 to-orange-600',
    },
    {
      title: 'Quizzes',
      icon: <ClipboardCheck className="w-6 h-6" />,
      onClick: () => navigate('/dashboard/quizez'),
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Attendance',
      icon: <Calendar className="w-6 h-6" />,
      onClick: () => navigate('/dashboard/attendence'),
      color: 'from-cyan-500 to-blue-600',
    },
    {
      title: 'Marks',
      icon: <Award className="w-6 h-6" />,
      onClick: () => navigate('/dashboard/marks'),
      color: 'from-emerald-500 to-emerald-600',
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 backdrop-blur-lg rounded-2xl p-8 border border-cyan-500/30">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="md:w-1/2">
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome back, <span className="text-cyan-400">{user?.name?.split(' ')[0]}</span>!
            </h1>
            <p className="text-gray-300 mb-4">
              You're doing great! Keep up with your assignments and quizzes to maintain your academic performance.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/dashboard/classtimings')}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-6 py-2 rounded-lg text-white font-semibold transition-all flex items-center gap-2"
              >
                <Video className="w-4 h-4" /> Join Class
              </button>
              <button
                onClick={() => navigate('/dashboard/aichatbot')}
                className="bg-gray-700/50 hover:bg-gray-700 px-6 py-2 rounded-lg text-white font-semibold transition-all flex items-center gap-2 border border-cyan-500/30"
              >
                <Zap className="w-4 h-4" /> Ask AI
              </button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flexitems-center justify-center border border-cyan-500/50">
              <img
                src={formData.profileImage}
                alt="Profile"
                className="w-full h-full rounded-full object-cover border-4 border-cyan-500/50"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Key Metrics */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-cyan-400" />
          Your Academic Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={stat.onClick}
              className={`text-left bg-gradient-to-br ${stat.bgColor} backdrop-blur-lg p-6 rounded-xl border ${stat.borderColor} hover:border-opacity-100 transition-all transform hover:scale-105 hover:shadow-lg`}
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignment Completion Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-cyan-500/20"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-400" />
            Assignment Completion
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-300 text-sm">Progress</span>
                <span className="text-orange-400 font-semibold">{dashboardData?.assignmentCompletion || 0}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${dashboardData?.assignmentCompletion || 0}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="bg-gradient-to-r from-orange-400 to-orange-600 h-full rounded-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-gray-700/50 p-3 rounded-lg">
                <p className="text-gray-400 text-xs mb-1">Completed</p>
                <p className="text-orange-400 text-xl font-bold">{dashboardData?.assignments || 0}</p>
              </div>
              <div className="bg-gray-700/50 p-3 rounded-lg">
                <p className="text-gray-400 text-xs mb-1">Pending</p>
                <p className="text-red-400 text-xl font-bold">{Math.max(0, (dashboardData?.assignments || 0) - Math.round((dashboardData?.assignments || 0) * (dashboardData?.assignmentCompletion || 0) / 100))}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quiz Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-cyan-500/20"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-purple-400" />
            Quiz Performance
          </h3>
          {performanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={performanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #00FFFF',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : null}
          <div className="flex justify-center gap-6 mt-4 flex-wrap">
            {performanceData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-gray-300 text-sm">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Attendance Gauge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-cyan-500/20"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400" />
          Attendance Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeDasharray={`${(dashboardData?.attendance || 0) * 3.4} 340`}
                  initial={{ strokeDasharray: '0 340' }}
                  animate={{ strokeDasharray: `${(dashboardData?.attendance || 0) * 3.4} 340` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00FFFF" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-cyan-400">{dashboardData?.attendance || 0}%</span>
                <span className="text-gray-400 text-sm">Attendance</span>
              </div>
            </div>
          </div>
          <div className="md:col-span-2 flex flex-col justify-center">
            <div className="space-y-4">
              <div className="bg-gray-700/50 p-4 rounded-lg border border-cyan-500/20">
                <p className="text-gray-400 text-sm mb-2">Attendance Status</p>
                <p className="text-cyan-400 text-lg font-semibold">
                  {dashboardData?.attendance >= 75 ? '✓ Good Standing' : dashboardData?.attendance >= 50 ? '⚠ At Risk' : '✗ Critical'}
                </p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg border border-cyan-500/20">
                <p className="text-gray-400 text-sm mb-2">Next Class</p>
                <button
                  onClick={() => navigate('/dashboard/classtimings')}
                  className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold flex items-center gap-2"
                >
                  View Schedule <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Shortcuts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-cyan-500/20"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-400" />
          Quick Access
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickLinks.map((link, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.8 + idx * 0.05 }}
              onClick={link.onClick}
              className={`bg-gradient-to-br ${link.color} p-4 rounded-lg text-white font-semibold hover:shadow-lg transition-all transform hover:scale-105 flex flex-col items-center justify-center gap-2 aspect-square`}
            >
              {link.icon}
              <span className="text-xs text-center">{link.title}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardHome;
