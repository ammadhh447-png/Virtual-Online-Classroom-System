import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Trash2, Edit2, Save, X, ChevronDown, ChevronUp, Plus } from 'lucide-react';

const DepartmentPage = () => {
  const [years, setYears] = useState([]);
  const [depts, setDepts] = useState([]);
  const [sections, setSections] = useState([]);
  const [newYear, setNewYear] = useState({ code: '', label: '' });
  const [newDept, setNewDept] = useState({ code: '', label: '', yearId: '' });
  const [newSection, setNewSection] = useState({ code: '', departmentId: '' });
  const [expandedYear, setExpandedYear] = useState(null);
  const [expandedDept, setExpandedDept] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [loading, setLoading] = useState(false);

  const API = import.meta.env.VITE_API_URL || 'https://fyp-backend-henna.vercel.app';

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [yearsRes, deptsRes, sectionsRes] = await Promise.all([
        axios.get(`${API}/api/admin/years`),
        axios.get(`${API}/api/admin/departments`),
        axios.get(`${API}/api/admin/sections`)
      ]);
      setYears(yearsRes.data || []);
      setDepts(deptsRes.data || []);
      setSections(sectionsRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Add Year
  const addYear = async () => {
    if (!newYear.code || !newYear.label) return toast.error('Provide year code and label');
    try {
      const res = await axios.post(`${API}/api/admin/years`, newYear);
      setYears(prev => [res.data, ...prev]);
      setNewYear({ code: '', label: '' });
      toast.success('Year added successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add year');
    }
  };

  // Delete Year
  const removeYear = async (id) => {
    if (!window.confirm('Delete this year and all its departments?')) return;
    try {
      await axios.delete(`${API}/api/admin/years/${id}`);
      setYears(prev => prev.filter(y => y._id !== id));
      setDepts(prev => prev.filter(d => d.yearId !== id));
      toast.success('Year deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete year');
    }
  };

  // Add Department
  const addDept = async () => {
    if (!newDept.code || !newDept.label || !newDept.yearId) {
      return toast.error('Select year and provide department code and label');
    }
    try {
      const payload = { code: newDept.code, label: newDept.label, yearId: newDept.yearId };
      const res = await axios.post(`${API}/api/admin/departments`, payload);
      setDepts(prev => [res.data, ...prev]);
      setNewDept({ code: '', label: '', yearId: '' });
      toast.success('Department added successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add department');
    }
  };

  // Delete Department
  const removeDept = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try {
      await axios.delete(`${API}/api/admin/departments/${id}`);
      setDepts(prev => prev.filter(d => d._id !== id));
      setSections(prev => prev.filter(s => {
        if (!s || !s.departmentId) return true;
        // Handle both cases: departmentId can be a string ID or an object with _id
        const sectionDeptId = typeof s.departmentId === 'object' ? s.departmentId._id : s.departmentId;
        return sectionDeptId !== id;
      }));
      toast.success('Department deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete department');
    }
  };

  // Add Section
  const addSection = async () => {
    if (!newSection.code || !newSection.departmentId) {
      return toast.error('Select department and provide section code');
    }
    try {
      const payload = { code: newSection.code.toUpperCase(), departmentId: newSection.departmentId };
      const res = await axios.post(`${API}/api/admin/sections`, payload);
      setSections(prev => [res.data, ...prev]);
      setNewSection({ code: '', departmentId: '' });
      toast.success('Section added successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add section');
    }
  };

  // Delete Section
  const removeSection = async (id) => {
    if (!window.confirm('Delete this section?')) return;
    try {
      await axios.delete(`${API}/api/admin/sections/${id}`);
      setSections(prev => prev.filter(s => s._id !== id));
      toast.success('Section deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete section');
    }
  };

  // Get departments for a specific year
  const getDeptsForYear = (yearId) => {
    return depts.filter(d => {
      if (!d || !d.yearId) return false;
      // Handle both cases: yearId can be a string ID or an object with _id
      const deptYearId = typeof d.yearId === 'object' ? d.yearId._id : d.yearId;
      return deptYearId === yearId;
    });
  };

  // Get sections for a specific department
  const getSectionsForDept = (deptId) => {
    return sections.filter(s => {
      if (!s || !s.departmentId) return false;
      // Handle both cases: departmentId can be a string ID or an object with _id
      const sectionDeptId = typeof s.departmentId === 'object' ? s.departmentId._id : s.departmentId;
      return sectionDeptId === deptId;
    });
  };

  // Resolve year code for department when yearId is either populated object or plain id
  const getDeptYearCode = (dept) => {
    if (!dept || !dept.yearId) return 'N/A';

    if (typeof dept.yearId === 'object') {
      return dept.yearId.code || 'N/A';
    }

    const matchedYear = years.find(y => y && y._id === dept.yearId);
    return matchedYear?.code || 'N/A';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-bold mb-6 text-white">Academic Structure Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Add Year */}
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 p-6 rounded-xl border border-cyan-500/30 h-fit">
          <h3 className="text-lg font-bold mb-4 text-cyan-300">Add New Year</h3>
          <div className="space-y-3">
            <input
              value={newYear.code}
              onChange={e => setNewYear(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="Year Code (e.g., FA24)"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-cyan-500 outline-none"
            />
            <input
              value={newYear.label}
              onChange={e => setNewYear(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Year Label (e.g., Fall 2024)"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-cyan-500 outline-none"
            />
            <button
              onClick={addYear}
              className="w-full bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Year
            </button>
          </div>
        </div>

        {/* Add Department */}
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 p-6 rounded-xl border border-blue-500/30 h-fit">
          <h3 className="text-lg font-bold mb-4 text-blue-300">Add New Department</h3>
          <div className="space-y-3">
            <select
              value={newDept.yearId}
              onChange={e => setNewDept(prev => ({ ...prev, yearId: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-blue-500 outline-none"
            >
              <option value="">Select Year</option>
              {years.map(y => (
                <option key={y._id} value={y._id}>{y.code} - {y.label}</option>
              ))}
            </select>
            <input
              value={newDept.code}
              onChange={e => setNewDept(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="Dept Code (e.g., BCS)"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-blue-500 outline-none"
            />
            <input
              value={newDept.label}
              onChange={e => setNewDept(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Department Name"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-blue-500 outline-none"
            />
            <button
              onClick={addDept}
              className="w-full bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Department
            </button>
          </div>
        </div>

        {/* Add Section */}
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 p-6 rounded-xl border border-purple-500/30 h-fit">
          <h3 className="text-lg font-bold mb-4 text-purple-300">Add New Section</h3>
          <div className="space-y-3">
            <select
              value={newSection.departmentId}
              onChange={e => setNewSection(prev => ({ ...prev, departmentId: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-purple-500 outline-none"
            >
              <option value="">Select Department</option>
              {(depts || []).map(d => {
                if (!d || !d._id) return null;
                const yearCode = getDeptYearCode(d);
                return (
                  <option key={d._id} value={d._id}>{d?.code} ({yearCode})</option>
                );
              })}
            </select>
            <input
              value={newSection.code}
              onChange={e => setNewSection(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="Section Code (e.g., A, B, C)"
              maxLength="1"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-purple-500 outline-none"
            />
            <button
              onClick={addSection}
              className="w-full bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Section
            </button>
          </div>
        </div>
      </div>

      {/* Hierarchical View */}
      <div className="bg-gray-800/50 p-6 rounded-xl border border-cyan-500/20">
        <h2 className="text-2xl font-bold mb-6 text-white">Academic Structure</h2>

        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : (years || []).length === 0 ? (
          <div className="text-gray-400 text-center py-8">No years added yet. Add a year to get started!</div>
        ) : (
          <div className="space-y-4">
            {(years || []).map(year => {
              if (!year || !year._id || !year.code) return null;
              return (
                <div key={year._id} className="border border-gray-700 rounded-lg overflow-hidden">
                  {/* Year Header */}
                  <div
                    onClick={() => setExpandedYear(expandedYear === year._id ? null : year._id)}
                    className="bg-gray-700/50 hover:bg-gray-700/80 cursor-pointer p-4 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedYear === year._id ? (
                        <ChevronUp className="w-5 h-5 text-cyan-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-cyan-400" />
                      )}
                      <div>
                        <div className="font-bold text-white">{year.code}</div>
                        <div className="text-sm text-gray-300">{year.label}</div>
                      </div>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        removeYear(year._id);
                      }}
                      className="text-red-400 hover:text-red-300 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Departments List */}
                  {expandedYear === year._id && (
                    <div className="bg-gray-800/30 p-4 space-y-3">
                      {getDeptsForYear(year._id).length === 0 ? (
                        <div className="text-gray-400 text-sm p-3 bg-gray-700/20 rounded">
                          No departments added for this year
                        </div>
                      ) : (
                        getDeptsForYear(year._id).map(dept => {
                          if (!dept || !dept._id || !dept.code) return null;
                          return (
                            <div key={dept._id} className="border border-gray-600 rounded-lg">
                              {/* Department Header */}
                              <div
                                onClick={() => setExpandedDept(expandedDept === dept._id ? null : dept._id)}
                                className="bg-gray-700/30 hover:bg-gray-700/50 cursor-pointer p-3 flex items-center justify-between transition-colors ml-4"
                              >
                                <div className="flex items-center gap-3">
                                  {expandedDept === dept._id ? (
                                    <ChevronUp className="w-4 h-4 text-blue-400" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-blue-400" />
                                  )}
                                  <div>
                                    <div className="font-semibold text-blue-300">{dept.code}</div>
                                    <div className="text-xs text-gray-400">{dept.label}</div>
                                  </div>
                                </div>
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    removeDept(dept._id);
                                  }}
                                  className="text-red-400 hover:text-red-300 p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Sections List */}
                              {expandedDept === dept._id && (
                                <div className="bg-gray-800/50 p-3 ml-4 space-y-2">
                                  <div className="text-xs font-semibold text-purple-300 mb-2">Sections:</div>
                                  {getSectionsForDept(dept._id).length === 0 ? (
                                    <div className="text-gray-400 text-xs p-2 bg-gray-700/20 rounded">
                                      No sections added yet
                                    </div>
                                  ) : (
                                    <div className="flex flex-wrap gap-2">
                                      {getSectionsForDept(dept._id).map(section => {
                                        if (!section || !section._id || !section.code) return null;
                                        return (
                                          <div key={section._id} className="group relative">
                                            <div className="bg-purple-600/20 border border-purple-400/50 px-3 py-1 rounded text-sm font-semibold text-purple-300 flex items-center gap-2">
                                              Section {section.code}
                                              <button
                                                onClick={() => removeSection(section._id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                <X className="w-3 h-3 text-red-400 hover:text-red-300" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DepartmentPage;
