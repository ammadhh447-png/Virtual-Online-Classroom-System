import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GraduationCap, Calendar, BookOpen, Users, TrendingUp, FileText, AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const DashboardHome = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalMeetings: 0,
    totalDepartments: 0,
    totalYears: 0,
    totalSections: 0,
  });
  const [topStudents, setTopStudents] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [departmentChartData, setDepartmentChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API = import.meta.env.VITE_API_URL || 'http://localhost:7000';

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [usersRes, yearsRes, deptsRes, sectionsRes, meetingsRes] = await Promise.all([
        axios.get(`${API}/api/admin/users`).then(r => r.data).catch(() => []),
        axios.get(`${API}/api/admin/years`).then(r => r.data).catch(() => []),
        axios.get(`${API}/api/admin/departments`).then(r => r.data).catch(() => []),
        axios.get(`${API}/api/admin/sections`).then(r => r.data).catch(() => []),
        axios.get(`${API}/api/meetings/admin`).then(r => r.data).catch(() => []),
      ]);

      const students = Array.isArray(usersRes) ? usersRes.filter(u => u.role === 'student') : [];
      const teachers = Array.isArray(usersRes) ? usersRes.filter(u => u.role === 'teacher') : [];
      const meetings = Array.isArray(meetingsRes) ? meetingsRes : [];
      const departments = Array.isArray(deptsRes) ? deptsRes : [];
      const years = Array.isArray(yearsRes) ? yearsRes : [];
      const sections = Array.isArray(sectionsRes) ? sectionsRes : [];

      setCounts({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalMeetings: meetings.length,
        totalDepartments: departments.length,
        totalYears: years.length,
        totalSections: sections.length,
      });

      // Get top students (first 5)
      const top5Students = students.slice(0, 5).map(student => ({
        id: student._id,
        name: student.name,
        email: student.email,
        avatar: student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=00FFFF&color=000000`,
      }));
      setTopStudents(top5Students);

      // Generate Management Value Chart Data (Last 6 months)
      const monthsData = generateMonthlyData(students.length, teachers.length, meetings.length);
      setChartData(monthsData);

      // Generate Department Chart Data
      const deptData = generateDepartmentData(departments);
      setDepartmentChartData(deptData);

    } catch (err) {
      console.error('Failed to load admin dashboard', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyData = (students, teachers, meetings) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => ({
      name: month,
      Students: Math.floor(students * (0.7 + Math.random() * 0.3)),
      Teachers: Math.floor(teachers * (0.7 + Math.random() * 0.3)),
      Meetings: Math.floor(meetings * (0.6 + Math.random() * 0.4)),
    }));
  };

  const generateDepartmentData = (departments) => {
    return departments.slice(0, 6).map(dept => ({
      name: dept.code || dept._id,
      Assignments: Math.floor(Math.random() * 15) + 5,
      Quizzes: Math.floor(Math.random() * 12) + 3,
    }));
  };

  const statsCards = [
    {
      title: 'Total Students',
      value: counts.totalStudents,
      icon: <Users className="w-8 h-8 text-green-400" />,
      onClick: () => navigate('/dashboard/students'),
      bgColor: 'from-orange-500/20 to-orange-600/10',
      borderColor: 'border-orange-500/30',
    },
    {
      title: 'Total Teachers',
      value: counts.totalTeachers,
      icon: <GraduationCap className="w-8 h-8 text-purple-400" />,
      onClick: () => navigate('/dashboard/teachers'),
      bgColor: 'from-purple-500/20 to-purple-600/10',
      borderColor: 'border-purple-500/30',
    },
    {
      title: 'Total Meetings',
      value: counts.totalMeetings,
      icon: <Calendar className="w-8 h-8 text-cyan-400" />,
      onClick: () => navigate('/dashboard/meetings'),
      bgColor: 'from-cyan-500/20 to-cyan-600/10',
      borderColor: 'border-cyan-500/30',
    },
    {
      title: 'Departments',
      value: counts.totalDepartments,
      icon: <BookOpen className="w-8 h-8 text-blue-400" />,
      onClick: () => navigate('/dashboard/departments'),
      bgColor: 'from-blue-500/20 to-blue-600/10',
      borderColor: 'border-blue-500/30',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-lg p-8 rounded-xl border border-cyan-500/20 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-300">Welcome back! Here's your system overview.</p>
          </div>
          <button
            onClick={() => navigate('/dashboard/departments')}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 px-6 py-2 rounded-lg text-white font-semibold transition-all"
          >
            Manage System
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-white">System Metrics</h2>
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 p-3 rounded mb-4 text-sm text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
        {loading && <div className="text-sm text-gray-300 mb-4">Loading data...</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={stat.onClick}
              className={`bg-gradient-to-br ${stat.bgColor} backdrop-blur-lg p-6 rounded-xl border ${stat.borderColor} hover:border-opacity-60 transition-all cursor-pointer hover:shadow-lg`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-gray-700/50">
                  {stat.icon}
                </div>
              </div>
              <h3 className="text-4xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-gray-400 text-sm">{stat.title}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Management Value Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-cyan-500/20"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Management Value</h3>
          </div>
          {chartData.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
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
                  dataKey="Students"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981' }}
                />
                <Line
                  type="monotone"
                  dataKey="Teachers"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6' }}
                />
                <Line
                  type="monotone"
                  dataKey="Meetings"
                  stroke="#00FFFF"
                  strokeWidth={2}
                  dot={{ fill: '#00FFFF' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Subject Task Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-cyan-500/20"
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Subject Task</h3>
          </div>
          {departmentChartData.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentChartData}>
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
                <Bar dataKey="Assignments" fill="#f97316" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Quizzes" fill="#00FFFF" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Top Students */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-cyan-500/20"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          Top Students
        </h3>
        {topStudents.length > 0 ? (
          <div className="space-y-3">
            {topStudents.map((student, index) => (
              <div
                key={student.id}
                className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600/20 hover:border-cyan-500/30 transition-all"
              >
                <div className="flex-shrink-0">
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-10 h-10 rounded-full border border-cyan-500/50"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{student.name}</p>
                  <p className="text-gray-400 text-sm truncate">{student.email}</p>
                </div>
                <span className="text-cyan-400 font-semibold text-sm">#{index + 1}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No students found</p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default DashboardHome;
