import React, { useEffect, useMemo, useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { RefreshCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Attendence = () => {
  const { user } = useAuth();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const [summary, setSummary] = useState({
    totalClasses: 0,
    presentClasses: 0,
    absentClasses: 0,
    pendingClasses: 0,
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSummary = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [statsRes, historyRes] = await Promise.all([
        axios.get(`${API}/api/attendance/stats/${user.id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }),
        axios.get(`${API}/api/attendance`, { params: { studentId: user.id }, headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      ]);
      
      const stats = statsRes.data?.stats || {};
      setSummary({
        totalClasses: stats.total || 0,
        presentClasses: stats.present || 0,
        absentClasses: stats.absent || 0,
        pendingClasses: 0,
      });

      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load attendance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [user]);

  const attendancePercent = useMemo(() => {
    if (!summary.totalClasses) return 0;
    return Math.round((summary.presentClasses / summary.totalClasses) * 100);
  }, [summary]);

  return (
    <div className="p-6 text-white">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-3xl font-bold">My Attendance</h1>
        <button
          onClick={fetchSummary}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-60"
        >
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
          <p className="text-sm text-gray-300">Total Classes</p>
          <p className="text-2xl font-semibold">{summary.totalClasses}</p>
        </div>
        <div className="bg-green-900/25 border border-green-700 rounded-xl p-4">
          <p className="text-sm text-gray-300">Present</p>
          <p className="text-2xl font-semibold">{summary.presentClasses}</p>
        </div>
        <div className="bg-red-900/25 border border-red-700 rounded-xl p-4">
          <p className="text-sm text-gray-300">Absent</p>
          <p className="text-2xl font-semibold">{summary.absentClasses}</p>
        </div>
        <div className="bg-blue-900/25 border border-blue-700 rounded-xl p-4">
          <p className="text-sm text-gray-300">Attendance %</p>
          <p className="text-2xl font-semibold">{attendancePercent}%</p>
        </div>
      </div>

      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-4">Class History</h2>
        {loading ? (
          <p className="text-gray-400">Loading attendance history...</p>
        ) : history.length === 0 ? (
          <p className="text-gray-400">No attendance records found.</p>
        ) : (
          <div className="space-y-3">
            {history.slice().reverse().map((item) => (
              <div key={item._id} className="bg-gray-900/70 border border-gray-700 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">Class Attendance</h3>
                    <p className="text-sm text-gray-300">
                      {item.date ? new Date(item.date).toLocaleDateString() : 'Date not available'} | {item.year}-{item.department}-{item.section}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase">Status</p>
                    <p className={`font-semibold uppercase ${item.status === 'present' ? 'text-green-400' : 'text-red-400'}`}>{item.status}</p>
                    <p className="text-xs text-gray-400">Marked on: {new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendence;