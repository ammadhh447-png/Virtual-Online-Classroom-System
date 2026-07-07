import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { GraduationCap, ArrowLeft, Plus, Trash2, Check } from 'lucide-react';
import axios from 'axios';

const ChooseClasses = () => {
    const [years, setYears] = useState([]);
    const [depts, setDepts] = useState([]);
    const [sections, setSections] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedSections, setSelectedSections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(null);

    const { signup } = useAuth();
    const navigate = useNavigate();
    const API = import.meta.env.VITE_API_URL || 'http://localhost:7000';

    // Fetch data on mount
    useEffect(() => {
        const timestamp = new Date().getTime();
        Promise.all([
            fetch(`${API}/api/admin/years?t=${timestamp}`).then(r => r.json()),
            fetch(`${API}/api/admin/departments?t=${timestamp}`).then(r => r.json()),
            fetch(`${API}/api/admin/sections?t=${timestamp}`).then(r => r.json())
        ]).then(([yearsData, deptsData, sectionsData]) => {
            setYears(yearsData || []);
            setDepts(deptsData || []);
            setSections(sectionsData || []);
        }).catch(err => {
            console.error('Error fetching data:', err);
            toast.error('Failed to fetch academic data');
        });

        // Get stored form data
        const stored = sessionStorage.getItem('teacherFormData');
        if (stored) {
            setFormData(JSON.parse(stored));
        } else {
            navigate('/signup');
        }
    }, [API, navigate]);

    // Get departments for selected year
    const getDeptsForYear = (yearCode) => {
        return depts.filter(d => d.yearId?.code === yearCode);
    };

    // Get selected department object
    const getSelectedDept = (deptCode) => {
        return depts.find(d => d.code === deptCode);
    };

    // Get sections for selected department
    const getSectionsForDept = (deptCode) => {
        const selectedDept = getSelectedDept(deptCode);
        if (!selectedDept) return [];
        return sections.filter(s => s.departmentId?._id === selectedDept._id);
    };

    // Handle section checkbox
    const handleSectionToggle = (sectionCode) => {
        setSelectedSections(prev =>
            prev.includes(sectionCode)
                ? prev.filter(s => s !== sectionCode)
                : [...prev, sectionCode]
        );
    };

    // Add class (year-dept-section combination)
    const addClass = () => {
        if (!selectedYear || !selectedDept || selectedSections.length === 0) {
            toast.error('Please select year, department, and at least one section');
            return;
        }

        selectedSections.forEach(section => {
            const classCode = `${selectedYear}-${selectedDept}-${section}`;
            if (!selectedClasses.some(c => c === classCode)) {
                setSelectedClasses(prev => [...prev, classCode]);
            }
        });

        setSelectedSections([]);
    };

    // Remove class
    const removeClass = (classCode) => {
        setSelectedClasses(prev => prev.filter(c => c !== classCode));
    };

    // Handle create account
    const handleCreateAccount = async (e) => {
        e.preventDefault();

        if (selectedClasses.length === 0) {
            toast.error('Please select at least one class');
            return;
        }

        if (!formData) {
            toast.error('Form data not found');
            return;
        }

        setLoading(true);
        const payload = {
            ...formData,
            role: 'teacher',
            department: selectedClasses.join(',') // Store all classes as comma-separated
        };

        const res = await signup(payload);
        if (res.success) {
            toast.success('Account created successfully');
            sessionStorage.removeItem('teacherFormData');
            navigate('/dashboard');
        } else {
            toast.error(res.message || 'Failed to create account');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 py-8">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-600/5"></div>

            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 w-full max-w-4xl"
            >
                <div className="bg-gray-800/50 backdrop-blur-lg p-8 rounded-2xl border border-cyan-500/20 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <Link to="/signup" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors mb-4">
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Back to Previous Step
                        </Link>
                        <div className="flex items-center justify-center space-x-2 mb-4">
                            <GraduationCap className="w-8 h-8 text-cyan-400" />
                            <span className="text-2xl font-bold text-white">Virtual CUI</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Select Classes</h1>
                        <p className="text-gray-300">Step 2 of 2: Choose classes you want to teach</p>
                    </div>

                    {/* Main Content */}
                    <div className="grid lg:grid-cols-3 gap-6 mb-8">
                        {/* Class Selection Panel */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 p-6 rounded-xl border border-blue-500/30">
                                <h2 className="text-xl font-bold text-blue-300 mb-4">Select Classes</h2>

                                {/* Year Dropdown */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => {
                                            setSelectedYear(e.target.value);
                                            setSelectedDept('');
                                            setSelectedSections([]);
                                        }}
                                        className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="">Select Year</option>
                                        {years.map(y => (
                                            <option key={y._id} value={y.code}>{y.code} - {y.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Department Dropdown */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                                    <select
                                        value={selectedDept}
                                        onChange={(e) => {
                                            setSelectedDept(e.target.value);
                                            setSelectedSections([]);
                                        }}
                                        disabled={!selectedYear}
                                        className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Select Department</option>
                                        {getDeptsForYear(selectedYear).map(d => (
                                            <option key={d._id} value={d.code}>{d.code} - {d.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Sections Checkboxes */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-3">Sections</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {getSectionsForDept(selectedDept).length === 0 ? (
                                            <p className="text-gray-400 text-sm col-span-3">No sections available</p>
                                        ) : (
                                            getSectionsForDept(selectedDept).map(section => (
                                                <label
                                                    key={section._id}
                                                    className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-700/50 transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSections.includes(section.code)}
                                                        onChange={() => handleSectionToggle(section.code)}
                                                        className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                                    />
                                                    <span className="text-gray-300">Section {section.code}</span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Add Button */}
                                <button
                                    onClick={addClass}
                                    disabled={!selectedYear || !selectedDept || selectedSections.length === 0}
                                    className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Class
                                </button>
                            </div>
                        </div>

                        {/* Selected Classes Panel */}
                        <div className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 p-6 rounded-xl border border-purple-500/30">
                            <h2 className="text-xl font-bold text-purple-300 mb-4">Selected Classes ({selectedClasses.length})</h2>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {selectedClasses.length === 0 ? (
                                    <p className="text-gray-400 text-sm">No classes selected yet</p>
                                ) : (
                                    selectedClasses.map((classCode, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between bg-purple-600/20 border border-purple-400/50 p-3 rounded-lg"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-purple-300" />
                                                <span className="text-purple-300 font-semibold">{classCode}</span>
                                            </div>
                                            <button
                                                onClick={() => removeClass(classCode)}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Create Account Button */}
                    <div className="flex gap-4">
                        <Link
                            to="/signup"
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Link>
                        <button
                            onClick={handleCreateAccount}
                            disabled={loading || selectedClasses.length === 0}
                            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ChooseClasses;