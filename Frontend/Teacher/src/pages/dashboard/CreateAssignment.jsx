import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Trash2, Edit2, Save, X, FileText, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import ClassFilter from '../../components/ClassFilter';

const CreateAssignment = () => {
    const { user, refreshUser } = useAuth();
    const [filter, setFilter] = useState({ year: '', department: '', section: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        courseName: '',
        marks: '',
        year: '',
        department: '',
        section: '',
        startDate: '',
        dueDate: '',
        file: null,
    });
    const [assignments, setAssignments] = useState([]);
    const [years, setYears] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [sections, setSections] = useState([]);
    const [teacherClasses, setTeacherClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [fileName, setFileName] = useState('');
    const [blocked, setBlocked] = useState(false);

    const API = import.meta.env.VITE_API_URL || 'http://localhost:7000';
    const token = localStorage.getItem('token');

    // Parse teacher's classes from user.department field
    useEffect(() => {
        if (user?.department) {
            const classes = user.department.split(',').map(c => c.trim());
            setTeacherClasses(classes);

            // Extract unique years from teacher's classes
            const uniqueYears = [...new Set(classes.map(c => c.split('-')[0]))];
            setYears(uniqueYears.map(y => ({ code: y, _id: y })));
        }
    }, [user]);

    useEffect(() => {
        if (user && user.role === 'teacher' && user.isVerified === false) {
            setBlocked(true);
        } else {
            setBlocked(false);
        }
    }, [user]);

    // Fetch assignments on mount
    useEffect(() => {
        refreshUser?.();
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const res = await axios.get(`${API}/api/assignments`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAssignments(res.data || []);
        } catch (err) {
            console.error('Error fetching assignments:', err);
            toast.error('Failed to fetch assignments');
        }
    };

    // Update departments based on selected year
    useEffect(() => {
        if (formData.year && teacherClasses.length > 0) {
            const deptsForYear = [...new Set(
                teacherClasses
                    .filter(c => c.split('-')[0] === formData.year)
                    .map(c => c.split('-')[1])
            )];
            setDepartments(deptsForYear.map(d => ({ code: d, _id: d })));
            setFormData(prev => ({ ...prev, department: '', section: '' }));
        }
    }, [formData.year, teacherClasses]);

    const handleYearChange = (e) => {
        const year = e.target.value;
        setFormData(prev => ({ ...prev, year, department: '', section: '' }));

        if (year && teacherClasses.length > 0) {
            const deptsForYear = [...new Set(
                teacherClasses
                    .filter(c => c.split('-')[0] === year)
                    .map(c => c.split('-')[1])
            )];
            setDepartments(deptsForYear.map(d => ({ code: d, _id: d })));
        } else {
            setDepartments([]);
        }
    };

    const handleDepartmentChange = (e) => {
        const department = e.target.value;
        setFormData(prev => ({ ...prev, department, section: '' }));

        if (department && formData.year && teacherClasses.length > 0) {
            const sectionsForDept = [...new Set(
                teacherClasses
                    .filter(c => {
                        const parts = c.split('-');
                        return parts[0] === formData.year && parts[1] === department;
                    })
                    .map(c => c.split('-')[2])
            )];
            setSections(sectionsForDept.map(s => ({ code: s, _id: s })));
        } else {
            setSections([]);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileType = file.type;
            if (fileType === 'application/pdf' || fileType.includes('vnd.openxmlformats-officedocument.wordprocessingml')) {
                setFormData(prev => ({ ...prev, file }));
                setFileName(file.name);
            } else {
                toast.error('Only PDF and DOCX files are allowed');
                setFileName('');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (blocked) {
            toast.info('Verification is pending. You cannot create assignments yet.');
            return;
        }

        if (!formData.title || !formData.courseName || !formData.marks || !formData.section || !formData.startDate || !formData.dueDate) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('courseName', formData.courseName);
            data.append('marks', formData.marks);
            data.append('year', formData.year);
            data.append('department', formData.department);
            data.append('section', formData.section);
            data.append('startDate', formData.startDate);
            data.append('dueDate', formData.dueDate);
            if (formData.file) {
                data.append('file', formData.file);
            }

            let res;
            if (editingId) {
                res = await axios.put(`${API}/api/assignments/${editingId}`, data, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                });
                toast.success('Assignment updated successfully');
                setEditingId(null);
            } else {
                res = await axios.post(`${API}/api/assignments`, data, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                });
                toast.success('Assignment created successfully');
            }

            setFormData({
                title: '',
                courseName: '',
                marks: '',
                year: '',
                department: '',
                section: '',
                startDate: '',
                dueDate: '',
                file: null,
            });
            setFileName('');
            fetchAssignments();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create/update assignment');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (assignment) => {
        setEditingId(assignment._id);
        setFormData({
            title: assignment.title,
            courseName: assignment.courseName,
            marks: assignment.marks?.toString() || '',
            year: assignment.year || '',
            department: assignment.department || '',
            section: assignment.section,
            startDate: assignment.startDate.split('T')[0],
            dueDate: assignment.dueDate.split('T')[0],
            file: null,
        });
        setFileName(assignment.fileName || '');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this assignment?')) return;

        try {
            await axios.delete(`${API}/api/assignments/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Assignment deleted successfully');
            fetchAssignments();
        } catch (err) {
            toast.error('Failed to delete assignment');
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({
            title: '',
            courseName: '',
            marks: '',
            year: '',
            department: '',
            section: '',
            startDate: '',
            dueDate: '',
            file: null,
        });
        setFileName('');
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold mb-6 text-white">Manage Assignments</h1>

            {/* Create/Edit Form */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-cyan-500/20 mb-8">
                <h2 className="text-xl font-bold mb-4 text-white">
                    {editingId ? 'Edit Assignment' : 'Create New Assignment'}
                </h2>

                {blocked && (
                    <div className="mb-4 p-3 rounded bg-amber-900/40 text-amber-200">Verification is pending — limited features until admin verifies your profile.</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-cyan-500 focus:outline-none"
                                placeholder="Assignment title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Course Name *</label>
                            <input
                                type="text"
                                name="courseName"
                                value={formData.courseName}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-cyan-500 focus:outline-none"
                                placeholder="e.g., Web Development"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Total Marks *</label>
                            <input
                                type="number"
                                name="marks"
                                value={formData.marks}
                                onChange={handleChange}
                                min="1"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-cyan-500 focus:outline-none"
                                placeholder="e.g., 10"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Year</label>
                            <select
                                name="year"
                                value={formData.year}
                                onChange={handleYearChange}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-cyan-500 focus:outline-none"
                            >
                                <option value="">Select Year</option>
                                {years.map(year => (
                                    <option key={year._id} value={year.code}>
                                        {year.code}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Department</label>
                            <select
                                name="department"
                                value={formData.department}
                                onChange={handleDepartmentChange}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-cyan-500 focus:outline-none"
                            >
                                <option value="">Select Department</option>
                                {departments.map(dept => (
                                    <option key={dept._id} value={dept.code}>
                                        {dept.code}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Section *</label>
                            <select
                                name="section"
                                value={formData.section}
                                onChange={handleChange}
                                disabled={!formData.department}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">Select Section</option>
                                {sections.map(section => (
                                    <option key={section._id} value={section.code}>
                                        {section.code}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Start Date *</label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-cyan-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Due Date *</label>
                            <input
                                type="date"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-cyan-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm text-gray-300 mb-2">Upload File (PDF/DOCX)</label>
                        <div className="flex items-center gap-3">
                            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 border border-gray-600 rounded cursor-pointer hover:border-cyan-500 transition-colors">
                                <Upload className="w-5 h-5 text-cyan-400" />
                                <span className="text-gray-300">{fileName || 'Choose file'}</span>
                                <input
                                    type="file"
                                    accept=".pdf,.docx"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                            {fileName && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, file: null }));
                                        setFileName('');
                                    }}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={loading || blocked}
                            className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Saving...' : editingId ? 'Update Assignment' : 'Create Assignment'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Class Filter and Search for assignments list */}
            <div className="mb-6">
                <ClassFilter onFilterChange={setFilter} user={user} />
                <div className="mt-4 flex gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-cyan-400" />
                        <input
                            type="text"
                            placeholder="Search by title or course name..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded text-white focus:border-cyan-500 focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Assignments List */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-cyan-500/20">
                <h2 className="text-xl font-bold mb-4 text-white">Assignments ({assignments.filter(a => {
                    const matchesSearch = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.courseName.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesFilter = (!filter.year && !filter.department && !filter.section) || (
                        (!filter.year || a.year === filter.year) &&
                        (!filter.department || a.department === filter.department) &&
                        (!filter.section || a.section === filter.section)
                    );
                    return matchesSearch && matchesFilter;
                }).length})</h2>

                {assignments.length === 0 ? (
                    <div className="text-gray-400">No assignments created yet</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {assignments.filter(a => {
                            const matchesSearch = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.courseName.toLowerCase().includes(searchQuery.toLowerCase());
                            const matchesFilter = (!filter.year && !filter.department && !filter.section) || (
                                (!filter.year || a.year === filter.year) &&
                                (!filter.department || a.department === filter.department) &&
                                (!filter.section || a.section === filter.section)
                            );
                            return matchesSearch && matchesFilter;
                        }).map(assignment => (
                            <motion.div
                                key={assignment._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-cyan-500/50 transition-all"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="text-lg font-bold text-white flex-1">{assignment.title}</h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(assignment)}
                                            className="text-blue-400 hover:text-blue-300"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(assignment._id)}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-400 mb-2">{assignment.courseName}</p>
                                <p className="text-xs text-cyan-400 font-semibold mb-2">Section: {assignment.section} | Marks: {assignment.marks ?? 'N/A'}</p>

                                <div className="text-xs text-gray-500 space-y-1 mb-3">
                                    <p>Start: {new Date(assignment.startDate).toLocaleDateString()}</p>
                                    <p>Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                                </div>

                                {assignment.fileUrl && (
                                    <a
                                        href={assignment.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm"
                                    >
                                        <FileText className="w-4 h-4" />
                                        {assignment.fileName}
                                    </a>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default CreateAssignment;
