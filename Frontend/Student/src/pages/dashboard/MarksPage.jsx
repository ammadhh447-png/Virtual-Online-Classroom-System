import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

const GradeColor = ({ score }) => {
  let colorClass = '';
  if (score >= 90) colorClass = 'bg-green-500/20 text-green-300';
  else if (score >= 75) colorClass = 'bg-yellow-500/20 text-yellow-300';
  else if (score >= 60) colorClass = 'bg-orange-500/20 text-orange-300';
  else colorClass = 'bg-red-500/20 text-red-300';
  return <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${colorClass}`}>{score.toFixed(1)}%</span>;
};

const MarksPage = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const API = import.meta.env.VITE_API_URL || 'http://localhost:7000';

  const fetchMarks = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [assignmentsRes, quizzesRes] = await Promise.all([
        axios.get(`${API}/api/student-assignments`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/student-quizzes`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const assignmentItems = await Promise.all((assignmentsRes.data || []).map(async (assignment) => {
        const statusRes = await axios.get(`${API}/api/student-assignments/${assignment._id}/submission-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const submission = statusRes.data || { status: 'pending' };
        return {
          id: `a-${assignment._id}`,
          type: 'Assignment',
          title: assignment.title,
          courseName: assignment.courseName,
          totalMarks: assignment.marks ?? null,
          obtainedMarks: submission.marks ?? null,
          submittedAt: submission.submittedAt || null,
          feedback: submission.feedback || '',
        };
      }));

      const quizItems = await Promise.all((quizzesRes.data || []).map(async (quiz) => {
        const statusRes = await axios.get(`${API}/api/student-quizzes/${quiz._id}/submission-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const submission = statusRes.data || { status: 'pending' };
        return {
          id: `q-${quiz._id}`,
          type: 'Quiz',
          title: quiz.title,
          courseName: quiz.courseName,
          totalMarks: quiz.marks ?? null,
          obtainedMarks: submission.marks ?? null,
          submittedAt: submission.submittedAt || null,
          feedback: submission.feedback || '',
        };
      }));

      setItems([...quizItems, ...assignmentItems].sort((a, b) => {
        const da = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const db = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return db - da;
      }));
    } catch (err) {
      console.error('Error fetching marks:', err);
      toast.error(err.response?.data?.message || 'Failed to load marks');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarks();
  }, [token]);

  const summary = useMemo(() => {
    const graded = items.filter(item => item.obtainedMarks !== null && item.obtainedMarks !== undefined && item.totalMarks);
    const totalPercent = graded.length
      ? graded.reduce((acc, item) => acc + ((Number(item.obtainedMarks) / Number(item.totalMarks)) * 100), 0) / graded.length
      : 0;
    const highest = graded.length
      ? Math.max(...graded.map(item => (Number(item.obtainedMarks) / Number(item.totalMarks)) * 100))
      : 0;
    const lowest = graded.length
      ? Math.min(...graded.map(item => (Number(item.obtainedMarks) / Number(item.totalMarks)) * 100))
      : 0;

    return { totalPercent, highest, lowest, gradedCount: graded.length };
  }, [items]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-3xl font-bold text-white">Marks & Grades</h1>
        <button
          onClick={fetchMarks}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800/50 p-6 rounded-xl border border-cyan-500/20">
          <h3 className="text-gray-400 mb-2">Overall Average</h3>
          <p className="text-4xl font-bold text-cyan-400">{summary.gradedCount ? summary.totalPercent.toFixed(1) : '0.0'}%</p>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-xl border border-cyan-500/20">
          <h3 className="text-gray-400 mb-2">Highest Grade</h3>
          <p className="text-4xl font-bold text-green-400">{summary.gradedCount ? summary.highest.toFixed(1) : '0.0'}%</p>
          <p className="text-sm text-gray-400 mt-1 flex items-center"><TrendingUp className="w-4 h-4 mr-1" /> Top Performance</p>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-xl border border-cyan-500/20">
          <h3 className="text-gray-400 mb-2">Lowest Grade</h3>
          <p className="text-4xl font-bold text-red-400">{summary.gradedCount ? summary.lowest.toFixed(1) : '0.0'}%</p>
          <p className="text-sm text-gray-400 mt-1 flex items-center"><TrendingDown className="w-4 h-4 mr-1" /> Area for Improvement</p>
        </div>
      </div>

      <div className="bg-gray-800/50 p-4 sm:p-6 rounded-xl border border-cyan-500/20">
        <h2 className="text-xl font-bold mb-6">Detailed Grade Report</h2>

        {loading ? (
          <div className="text-center py-10 text-cyan-400 animate-pulse">Loading marks...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-10 text-gray-400">No graded assignments or quizzes available yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="py-3 px-4 text-sm font-semibold text-gray-400">Type</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-400">Title</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-400">Course</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-400">Date</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-400 text-right">Marks</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-400 text-right">Grade</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-400">Feedback</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const percent = item.totalMarks ? (Number(item.obtainedMarks || 0) / Number(item.totalMarks)) * 100 : null;
                  return (
                    <tr key={item.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="py-4 px-4 text-cyan-400 font-medium">{item.type}</td>
                      <td className="py-4 px-4">{item.title}</td>
                      <td className="py-4 px-4 text-gray-300">{item.courseName}</td>
                      <td className="py-4 px-4 text-gray-400">{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'Not submitted'}</td>
                      <td className="py-4 px-4 text-right text-gray-300">
                        {item.obtainedMarks !== null && item.obtainedMarks !== undefined
                          ? `${item.obtainedMarks}${item.totalMarks ? ` / ${item.totalMarks}` : ''}`
                          : '—'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {percent !== null ? <GradeColor score={percent} /> : <span className="text-gray-500">—</span>}
                      </td>
                      <td className="py-4 px-4 text-gray-400 max-w-[320px] truncate">{item.feedback || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MarksPage;
