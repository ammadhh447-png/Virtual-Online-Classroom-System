import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Upload, X, FileText, Trash2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import ClassFilter from '../../components/ClassFilter';

const Lectures = () => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const API = import.meta.env.VITE_API_URL || 'http://localhost:7000';

  const [teacherClasses, setTeacherClasses] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    selectedClasses: [],
    isImportant: false,
    file: null,
  });
  const [fileName, setFileName] = useState('');
  const [lectures, setLectures] = useState([]);
  const [filter, setFilter] = useState({ year: '', department: '', section: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.department) {
      const classes = user.department.split(',').map(c => c.trim());
      setTeacherClasses(classes);
    }
  }, [user]);

  useEffect(() => {
    fetchLectures();
  }, []);

  const fetchLectures = async () => {
    try {
      const res = await axios.get(`${API}/api/lectures/teacher/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLectures(res.data || []);
    } catch (err) {
      console.error('Error fetching lectures', err);
      toast.error('Failed to fetch lectures');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF and DOCX files are allowed');
        return;
      }
      setFormData(prev => ({ ...prev, file }));
      setFileName(file.name);
    }
  };

  const toggleClassSelection = (cls) => {
    setFormData(prev => {
      const exists = prev.selectedClasses.includes(cls);
      return {
        ...prev,
        selectedClasses: exists ? prev.selectedClasses.filter(c => c !== cls) : [...prev.selectedClasses, cls],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.subject || formData.selectedClasses.length === 0 || !formData.file) {
      toast.error('Please fill title, subject, choose at least one class and upload a file');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('subject', formData.subject);
      data.append('classes', JSON.stringify(formData.selectedClasses));
      data.append('isImportant', formData.isImportant ? 'true' : 'false');
      data.append('file', formData.file);

      const res = await axios.post(`${API}/api/lectures`, data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Lecture uploaded successfully');
      setFormData({ title: '', subject: '', selectedClasses: [], isImportant: false, file: null });
      setFileName('');
      fetchLectures();
    } catch (err) {
      console.error('Upload error', err);
      toast.error(err.response?.data?.message || 'Failed to upload lecture');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (lectureId) => {
    if (!window.confirm('Are you sure you want to delete this lecture?')) return;
    try {
      await axios.delete(`${API}/api/lectures/${lectureId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Lecture deleted successfully');
      fetchLectures();
    } catch (err) {
      console.error('Delete error', err);
      toast.error('Failed to delete lecture');
    }
  };

  const filteredLectures = lectures.filter(l => {
    // Apply class filter
    const classMatch = !filter.year && !filter.department && !filter.section ? true : (l.classes || []).some(cls => {
      const parts = cls.split('-');
      const y = parts[0] || '';
      const d = parts[1] || '';
      const s = parts[2] || '';
      if (filter.year && y !== filter.year) return false;
      if (filter.department && d !== filter.department) return false;
      if (filter.section && s !== filter.section) return false;
      return true;
    });

    // Apply search filter
    const searchMatch = !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase()) || l.subject.toLowerCase().includes(searchQuery.toLowerCase());

    return classMatch && searchMatch;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <h1 className="text-3xl font-bold mb-6 text-white">Lectures / Notes</h1>

      {/* Create Lecture Form */}
      <div className="bg-gray-800/50 p-6 rounded-xl border border-cyan-500/20 mb-8">
        <h2 className="text-xl font-bold mb-4 text-white">Add Lecture / Notes</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Title *</label>
              <input type="text" value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-cyan-500 focus:outline-none" />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Subject *</label>
              <input type="text" value={formData.subject} onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-cyan-500 focus:outline-none" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-2">Choose Classes / Sections *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {teacherClasses.map(cls => (
                  <label key={cls} className="inline-flex items-center gap-2 text-gray-300">
                    <input type="checkbox" checked={formData.selectedClasses.includes(cls)} onChange={() => toggleClassSelection(cls)} className="w-4 h-4" />
                    <span>{cls}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Select one or more classes/sections to show this note to.</p>
            </div>

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-gray-300">
                <input type="checkbox" checked={formData.isImportant} onChange={e => setFormData(prev => ({ ...prev, isImportant: e.target.checked }))} className="w-4 h-4" />
                <span>Mark as important</span>
              </label>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Upload File (PDF/DOCX) *</label>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 border border-gray-600 rounded cursor-pointer hover:border-cyan-500 transition-colors">
                  <Upload className="w-5 h-5 text-cyan-400" />
                  <span className="text-gray-300">{fileName || 'Choose File'}</span>
                  <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange} className="hidden" />
                </label>
                {fileName && (
                  <button type="button" onClick={() => { setFormData(prev => ({ ...prev, file: null })); setFileName(''); }} className="text-red-400 hover:text-red-300"><X className="w-5 h-5" /></button>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading} className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">{loading ? 'Uploading...' : 'Upload Lecture / Notes'}</button>
          </div>
        </form>
      </div>

      {/* Class Filter and Search for lecture list */}
      <div className="mb-6">
        <ClassFilter onFilterChange={setFilter} user={user} />
        <div className="mt-4 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-cyan-400" />
            <input
              type="text"
              placeholder="Search by title or subject..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Lectures List */}
      <div className="bg-gray-800/50 p-6 rounded-xl border border-cyan-500/20">
        <h2 className="text-xl font-bold mb-4 text-white">Lectures ({filteredLectures.length})</h2>

        {filteredLectures.length === 0 ? (
          <div className="text-gray-400">No lectures found</div>
        ) : (
          <div className="space-y-4">
            {filteredLectures.map(lec => (
              <motion.div key={lec._id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold">{lec.title}</h3>
                    {lec.isImportant && <span className="text-xs bg-red-600/80 text-white px-2 py-1 rounded">Important</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Subject: {lec.subject}</p>
                  <p className="text-xs text-gray-400 mt-1">Classes: {(lec.classes || []).join(', ')}</p>
                  <p className="text-xs text-gray-400 mt-1">Uploaded: {new Date(lec.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  {lec.fileUrl && (
                    <a href={lec.fileUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(lec._id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Lectures;