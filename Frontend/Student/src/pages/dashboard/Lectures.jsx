import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download, AlertCircle, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const Lectures = () => {
  const { token, user } = useAuth();
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API = import.meta.env.VITE_API_URL || 'http://localhost:7000';

  useEffect(() => {
    fetchLectures();
  }, [token]);

  const fetchLectures = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/lectures/student/my-lectures`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLectures(res.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching lectures:', err);
      setError('Failed to fetch lectures. Please try again.');
      setLectures([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Lecture Notes</h1>
        <button
          onClick={fetchLectures}
          disabled={loading}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border b-4 border-cyan-500 border-t-cyan-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading lectures...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-200">{error}</p>
        </div>
      ) : lectures.length === 0 ? (
        <div className="bg-gray-800/50 p-8 rounded-xl border border-cyan-500/20 text-center">
          <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
          <p className="text-gray-400 text-lg">No lecture notes available yet</p>
          <p className="text-gray-500 text-sm mt-2">Your teachers will share lecture notes here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {lectures.map((lecture, index) => (
            <motion.div
              key={lecture._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-800/50 p-6 rounded-xl border border-cyan-500/20 hover:border-cyan-500/50 transition-all hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="p-3 bg-cyan-500/20 rounded-lg">
                      <FileText className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white">{lecture.title}</h3>
                        {lecture.isImportant && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-900/50 border border-red-600/50 rounded text-xs text-red-200">
                            <Bookmark className="w-3 h-3" />
                            Important
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-cyan-300 font-medium">{lecture.subject}</p>
                      <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-400">
                        <span>📅 {new Date(lecture.createdAt).toLocaleDateString()}</span>
                        <span>📄 {lecture.fileType.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <a
                  href={lecture.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors flex-shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Lectures;
