import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ClassFilter from '../../components/ClassFilter';

const GradeColor = ({ grade }) => {
  let colorClass = '';
  if (grade >= 90) colorClass = 'bg-green-500/20 text-green-300';
  else if (grade >= 75) colorClass = 'bg-yellow-500/20 text-yellow-300';
  else if (grade >= 60) colorClass = 'bg-orange-500/20 text-orange-300';
  else colorClass = 'bg-red-500/20 text-red-300';
  return <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${colorClass}`}>{grade}%</span>;
};

const MarksPage = () => {
  const { user, token } = useAuth();
  const [filter, setFilter] = useState({ year: '', department: '', section: '' });
  const [entries, setEntries] = useState([]); // combined assignment + quiz submissions
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // submissionId being edited
  const [editValue, setEditValue] = useState('');

  const API = import.meta.env.VITE_API_URL || 'http://localhost:7000';

  const numericMarks = entries.filter(e => typeof e.marks === 'number').map(e => Number(e.marks));
  const overallAverage = numericMarks.length ? (numericMarks.reduce((acc, v) => acc + v, 0) / numericMarks.length).toFixed(1) : '0.0';

  useEffect(() => {
    if (!token) return;
    if (filter.year && filter.department && filter.section) {
      fetchClassEntries();
    } else {
      setEntries([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, token]);

  const fetchClassEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = { headers: { Authorization: `Bearer ${token}` } };

      const [assignRes, quizRes] = await Promise.all([
        axios.get(`${API}/api/student-assignments/class/submissions/all?year=${encodeURIComponent(filter.year)}&department=${encodeURIComponent(filter.department)}&section=${encodeURIComponent(filter.section)}`, headers).then(r => r.data),
        axios.get(`${API}/api/student-quizzes/class/submissions/all?year=${encodeURIComponent(filter.year)}&department=${encodeURIComponent(filter.department)}&section=${encodeURIComponent(filter.section)}`, headers).then(r => r.data),
      ]);

      // Normalize entries
      const normalizedAssign = (assignRes || []).map(a => ({
        _id: a._id,
        studentName: a.studentName,
        studentId: a.studentId,
        title: a.assignmentTitle,
        type: 'assignment',
        submittedAt: a.submittedAt,
        marks: a.marks,
        submissionId: a._id,
      }));

      const normalizedQuiz = (quizRes || []).map(q => ({
        _id: q._id,
        studentName: q.studentName,
        studentId: q.studentId,
        title: q.quizTitle,
        type: 'quiz',
        submittedAt: q.submittedAt,
        marks: q.marks,
        submissionId: q._id,
      }));

      const combined = [...normalizedAssign, ...normalizedQuiz].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      setEntries(combined);
    } catch (err) {
      console.error('Failed to load class submissions', err);
      setError('Failed to load submissions for selected class');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (submissionId, currentMarks) => {
    setEditing(submissionId);
    setEditValue(currentMarks !== null && currentMarks !== undefined ? String(currentMarks) : '');
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditValue('');
  };

  const saveMarks = async (entry) => {
    try {
      const val = editValue === '' ? null : Number(editValue);
      if (val !== null && (Number.isNaN(val) || val < 0)) {
        alert('Enter a valid non-negative number for marks');
        return;
      }
      const headers = { headers: { Authorization: `Bearer ${token}` } };
      if (entry.type === 'assignment') {
        const res = await axios.put(`${API}/api/student-assignments/${entry.submissionId}/marks`, { marks: val }, headers).then(r => r.data);
        setEntries(prev => prev.map(e => e.submissionId === entry.submissionId ? { ...e, marks: res.marks } : e));
      } else {
        const res = await axios.put(`${API}/api/student-quizzes/${entry.submissionId}/marks`, { marks: val }, headers).then(r => r.data);
        setEntries(prev => prev.map(e => e.submissionId === entry.submissionId ? { ...e, marks: res.marks } : e));
      }
      cancelEdit();
    } catch (err) {
      console.error('Failed to save marks', err);
      alert('Failed to save marks');
    }
  };



  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-bold mb-6 text-white">Marks & Grades</h1>

      {/* Class Filter */}
      <ClassFilter onFilterChange={setFilter} user={user} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800/50 p-6 rounded-xl border border-cyan-500/20">
          <h3 className="text-gray-400 mb-2">Overall Average</h3>
          <p className="text-4xl font-bold text-cyan-400">{overallAverage}%</p>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-xl border border-cyan-500/20">
          <h3 className="text-gray-400 mb-2">Highest Grade</h3>
          <p className="text-4xl font-bold text-green-400">{numericMarks.length ? Math.max(...numericMarks).toFixed(1) : 'N/A'}</p>
          <p className="text-sm text-gray-400 mt-1 flex items-center"><TrendingUp className="w-4 h-4 mr-1" /> Top Performance</p>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-xl border border-cyan-500/20">
          <h3 className="text-gray-400 mb-2">Lowest Grade</h3>
          <p className="text-4xl font-bold text-red-400">{numericMarks.length ? Math.min(...numericMarks).toFixed(1) : 'N/A'}</p>
          <p className="text-sm text-gray-400 mt-1 flex items-center"><TrendingDown className="w-4 h-4 mr-1" /> Area for Improvement</p>
        </div>
      </div>

      <div className="bg-gray-800/50 p-4 sm:p-6 rounded-xl border border-cyan-500/20">
        <h2 className="text-xl font-bold mb-6">Gradebook</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="py-3 px-4 text-sm font-semibold text-gray-400">Student</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-400">Subject</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-400">Assignment/Quiz</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-400">Date</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-400 text-right">Grade</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.submissionId} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-4 px-4 text-cyan-400 font-medium">{entry.studentName}</td>
                  <td className="py-4 px-4 text-cyan-300">{entry.type === 'assignment' ? 'Assignment' : 'Quiz'}</td>
                  <td className="py-4 px-4">{entry.title}</td>
                  <td className="py-4 px-4 text-gray-400">{entry.submittedAt ? new Date(entry.submittedAt).toLocaleString() : '-'}</td>
                  <td className="py-4 px-4 text-right">
                    {editing === entry.submissionId ? (
                      <div className="flex items-center justify-end gap-2">
                        <input type="number" min="0" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-20 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-white" />
                        <button onClick={() => saveMarks(entry)} className="text-sm bg-green-600 px-3 py-1 rounded text-white">Save</button>
                        <button onClick={cancelEdit} className="text-sm bg-gray-700 px-3 py-1 rounded text-white">Cancel</button>
                      </div>
                    ) : (
                      <span className="font-semibold">{entry.marks !== null && entry.marks !== undefined ? `${entry.marks}` : 'N/A'}</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {editing === entry.submissionId ? null : (
                      <button onClick={() => startEdit(entry.submissionId, entry.marks)} className="text-sm bg-cyan-500/80 px-3 py-1 rounded text-white">Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default MarksPage;
