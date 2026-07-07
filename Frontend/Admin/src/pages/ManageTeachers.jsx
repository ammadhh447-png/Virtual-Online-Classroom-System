import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Trash2, Edit2, Save, X } from 'lucide-react';

const ManageTeachers = () => {
    const [depts, setDepts] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [editTeacherData, setEditTeacherData] = useState({});
    const [loadingDepts, setLoadingDepts] = useState(false);
    const [loadingTeachers, setLoadingTeachers] = useState(false);

    const API = import.meta.env.VITE_API_URL || 'http://localhost:7000';

    // Fetch data on mount
    useEffect(() => {
        fetchDepts();
        fetchTeachers();
    }, []);

    const fetchDepts = async () => {
        try {
            setLoadingDepts(true);
            const res = await axios.get(`${API}/api/admin/departments`);
            setDepts(res.data || []);
        } catch (err) {
            console.error('Error fetching departments:', err);
            toast.error('Failed to fetch departments');
        } finally {
            setLoadingDepts(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            setLoadingTeachers(true);
            const res = await axios.get(`${API}/api/admin/users`);
            const filteredTeachers = res.data.filter(u => u.role === 'teacher');
            setTeachers(filteredTeachers);
        } catch (err) {
            console.error('Error fetching teachers:', err);
            toast.error('Failed to fetch teachers');
        } finally {
            setLoadingTeachers(false);
        }
    };

    const startEditTeacher = (teacher) => {
        setEditingTeacher(teacher._id);
        setEditTeacherData({
            name: teacher.name,
            email: teacher.email,
            department: teacher.department,
            profileImage: teacher.profileImage || '',
            isVerified: !!teacher.isVerified,
        });
    };

    const saveTeacherEdit = async () => {
        try {
            const payload = { ...editTeacherData };
            // send only fields that exist
            const res = await axios.put(`${API}/api/admin/users/${editingTeacher}`, payload);
            setTeachers(prev => prev.map(t => t._id === editingTeacher ? res.data.user : t));
            setEditingTeacher(null);
            toast.success('Teacher updated successfully');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update teacher');
        }
    };

    const deleteTeacher = async (id) => {
        if (!window.confirm('Are you sure you want to delete this teacher?')) return;
        try {
            await axios.delete(`${API}/api/admin/users/${id}`);
            setTeachers(prev => prev.filter(t => t._id !== id));
            toast.success('Teacher deleted');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete teacher');
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold mb-6 text-white">Teachers Management</h1>

            {/* Teachers Management Section */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-cyan-500/20">
                <h2 className="text-xl font-bold mb-4">Manage Teachers</h2>
                {loadingTeachers ? (
                    <div className="text-gray-400">Loading teachers...</div>
                ) : teachers.length === 0 ? (
                    <div className="text-gray-400">No teachers registered yet</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="text-left py-3 px-3 text-cyan-300">Name</th>
                                    <th className="text-left py-3 px-3 text-cyan-300">Email</th>
                                    <th className="text-left py-3 px-3 text-cyan-300">Department</th>
                                    <th className="text-left py-3 px-3 text-cyan-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teachers.map(teacher => (
                                    editingTeacher === teacher._id ? (
                                        <tr key={teacher._id} className="border-b border-gray-700 bg-gray-900">
                                            <td className="py-3 px-3">
                                                <input
                                                    type="text"
                                                    value={editTeacherData.name}
                                                    onChange={e => setEditTeacherData(prev => ({ ...prev, name: e.target.value }))}
                                                    className="bg-gray-800 rounded px-2 py-1 text-white text-xs w-full"
                                                />
                                            </td>
                                            <td className="py-3 px-3">
                                                <input
                                                    type="email"
                                                    value={editTeacherData.email}
                                                    onChange={e => setEditTeacherData(prev => ({ ...prev, email: e.target.value }))}
                                                    className="bg-gray-800 rounded px-2 py-1 text-white text-xs w-full"
                                                />
                                            </td>
                                            <td className="py-3 px-3">
                                                <div className="space-y-2">
                                                    <select
                                                        value={editTeacherData.department}
                                                        onChange={e => setEditTeacherData(prev => ({ ...prev, department: e.target.value }))}
                                                        className="bg-gray-800 rounded px-2 py-1 text-white text-xs w-full"
                                                    >
                                                        <option value="">Select</option>
                                                        {depts.map(d => (
                                                            <option key={d._id} value={d.code}>{d.code} </option>
                                                        ))}
                                                    </select>

                                                    <input
                                                        type="text"
                                                        placeholder="Profile image URL"
                                                        value={editTeacherData.profileImage}
                                                        onChange={e => setEditTeacherData(prev => ({ ...prev, profileImage: e.target.value }))}
                                                        className="bg-gray-800 rounded px-2 py-1 text-white text-xs w-full"
                                                    />

                                                    <label className="flex items-center gap-2 text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!editTeacherData.isVerified}
                                                            onChange={e => setEditTeacherData(prev => ({ ...prev, isVerified: e.target.checked }))}
                                                        />
                                                        <span className="text-gray-300">Verified</span>
                                                    </label>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 flex gap-2">
                                                <button onClick={saveTeacherEdit} className="text-green-400 hover:text-green-300">
                                                    <Save className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setEditingTeacher(null)} className="text-gray-400 hover:text-gray-300">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr key={teacher._id} className="border-b border-gray-700 hover:bg-gray-900/50">
                                            <td className="py-3 px-3 text-white">{teacher.name}</td>
                                            <td className="py-3 px-3 text-gray-300">{teacher.email}</td>
                                            <td className="py-3 px-3 text-gray-400 flex items-center justify-between">
                                                <div>
                                                    {depts.find(d => d.code === teacher.department)?.label || teacher.department || '-'}
                                                </div>
                                                <div>
                                                    {teacher.isVerified ? (
                                                        <span className="text-green-400 text-xs font-semibold">Verified</span>
                                                    ) : (
                                                        <span className="text-amber-300 text-xs font-semibold">Pending</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 flex gap-3">
                                                <button onClick={() => startEditTeacher(teacher)} className="text-blue-400 hover:text-blue-300">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => deleteTeacher(teacher._id)} className="text-red-400 hover:text-red-300">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ManageTeachers;