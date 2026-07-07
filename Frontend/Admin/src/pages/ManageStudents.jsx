import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Trash2, Edit2, Save, X } from 'lucide-react';

const ManageStudents = () => {
    const [years, setYears] = useState([]);
    const [depts, setDepts] = useState([]);
    const [students, setStudents] = useState([]);
    const [editingStudent, setEditingStudent] = useState(null);
    const [editStudentData, setEditStudentData] = useState({});
    const [loadingYears, setLoadingYears] = useState(false);
    const [loadingDepts, setLoadingDepts] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);

    const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    // Fetch data on mount
    useEffect(() => {
        fetchYears();
        fetchDepts();
        fetchStudents();
    }, []);

    const fetchYears = async () => {
        try {
            setLoadingYears(true);
            const res = await axios.get(`${API}/api/admin/years`);
            setYears(res.data || []);
        } catch (err) {
            console.error('Error fetching years:', err);
            toast.error('Failed to fetch years');
        } finally {
            setLoadingYears(false);
        }
    };

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

    const fetchStudents = async () => {
        try {
            setLoadingStudents(true);
            const res = await axios.get(`${API}/api/admin/users`);
            const filteredStudents = res.data.filter(u => u.role === 'student');
            setStudents(filteredStudents);
        } catch (err) {
            console.error('Error fetching students:', err);
            toast.error('Failed to fetch students');
        } finally {
            setLoadingStudents(false);
        }
    };


    const startEditStudent = (student) => {
        setEditingStudent(student._id);
        setEditStudentData({
            name: student.name,
            email: student.email,
            rollYear: student.rollYear,
            rollDept: student.rollDept,
            rollSerial: student.rollSerial,
            section: student.section,
        });
    };

    const saveStudentEdit = async () => {
        try {
            const res = await axios.put(`${API}/api/admin/users/${editingStudent}`, editStudentData);
            setStudents(prev => prev.map(s => s._id === editingStudent ? res.data.user : s));
            setEditingStudent(null);
            toast.success('Student updated successfully');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update student');
        }
    };

    const deleteStudent = async (id) => {
        if (!window.confirm('Are you sure you want to delete this student?')) return;
        try {
            await axios.delete(`${API}/api/admin/users/${id}`);
            setStudents(prev => prev.filter(s => s._id !== id));
            toast.success('Student deleted');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete student');
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold mb-6 text-white">Students Management</h1>

            {/* Students Management Section */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-cyan-500/20">
                <h2 className="text-xl font-bold mb-4">Manage Students</h2>
                {loadingStudents ? (
                    <div className="text-gray-400">Loading students...</div>
                ) : students.length === 0 ? (
                    <div className="text-gray-400">No students registered yet</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="text-left py-3 px-3 text-cyan-300">Name</th>
                                    <th className="text-left py-3 px-3 text-cyan-300">Email</th>
                                    <th className="text-left py-3 px-3 text-cyan-300">Year</th>
                                    <th className="text-left py-3 px-3 text-cyan-300">Dept</th>
                                    <th className="text-left py-3 px-3 text-cyan-300">Serial</th>
                                    <th className="text-left py-3 px-3 text-cyan-300">Section</th>
                                    <th className="text-left py-3 px-3 text-cyan-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => (
                                    editingStudent === student._id ? (
                                        <tr key={student._id} className="border-b border-gray-700 bg-gray-900">
                                            <td className="py-3 px-3">
                                                <input
                                                    type="text"
                                                    value={editStudentData.name}
                                                    onChange={e => setEditStudentData(prev => ({ ...prev, name: e.target.value }))}
                                                    className="bg-gray-800 rounded px-2 py-1 text-white text-xs w-full"
                                                />
                                            </td>
                                            <td className="py-3 px-3">
                                                <input
                                                    type="email"
                                                    value={editStudentData.email}
                                                    onChange={e => setEditStudentData(prev => ({ ...prev, email: e.target.value }))}
                                                    className="bg-gray-800 rounded px-2 py-1 text-white text-xs w-full"
                                                />
                                            </td>
                                            <td className="py-3 px-3">
                                                <select
                                                    value={editStudentData.rollYear}
                                                    onChange={e => setEditStudentData(prev => ({ ...prev, rollYear: e.target.value }))}
                                                    className="bg-gray-800 rounded px-2 py-1 text-white text-xs w-full"
                                                >
                                                    <option value="">Select</option>
                                                    {years.map(y => (
                                                        <option key={y._id} value={y.code}>{y.code}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="py-3 px-3">
                                                <select
                                                    value={editStudentData.rollDept}
                                                    onChange={e => setEditStudentData(prev => ({ ...prev, rollDept: e.target.value }))}
                                                    className="bg-gray-800 rounded px-2 py-1 text-white text-xs w-full"
                                                >
                                                    <option value="">Select</option>
                                                    {depts.map(d => (
                                                        <option key={d._id} value={d.code}>{d.code}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="py-3 px-3">
                                                <input
                                                    type="text"
                                                    value={editStudentData.rollSerial}
                                                    onChange={e => setEditStudentData(prev => ({ ...prev, rollSerial: e.target.value }))}
                                                    className="bg-gray-800 rounded px-2 py-1 text-white text-xs w-full"
                                                />
                                            </td>
                                            <td className="py-3 px-3">
                                                <select
                                                    value={editStudentData.section}
                                                    onChange={e => setEditStudentData(prev => ({ ...prev, section: e.target.value }))}
                                                    className="bg-gray-800 rounded px-2 py-1 text-white text-xs w-full"
                                                >
                                                    <option value="">Select</option>
                                                    <option value="A">A</option>
                                                    <option value="B">B</option>
                                                    <option value="C">C</option>
                                                </select>
                                            </td>
                                            <td className="py-3 px-3 flex gap-2">
                                                <button onClick={saveStudentEdit} className="text-green-400 hover:text-green-300">
                                                    <Save className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setEditingStudent(null)} className="text-gray-400 hover:text-gray-300">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr key={student._id} className="border-b border-gray-700 hover:bg-gray-900/50">
                                            <td className="py-3 px-3 text-white">{student.name}</td>
                                            <td className="py-3 px-3 text-gray-300">{student.email}</td>
                                            <td className="py-3 px-3 text-gray-400">{student.rollYear}</td>
                                            <td className="py-3 px-3 text-gray-400">{student.rollDept}</td>
                                            <td className="py-3 px-3 text-gray-400">{student.rollSerial}</td>
                                            <td className="py-3 px-3 text-gray-400">{student.section || '-'}</td>
                                            <td className="py-3 px-3 flex gap-3">
                                                <button onClick={() => startEditStudent(student)} className="text-blue-400 hover:text-blue-300">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => deleteStudent(student._id)} className="text-red-400 hover:text-red-300">
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

export default ManageStudents;
