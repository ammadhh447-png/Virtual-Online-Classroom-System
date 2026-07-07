import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Download, Save, CheckCircle } from 'lucide-react';
import ClassFilter from '../../components/ClassFilter';

const AssignmentChecker = () => {
    const { user, token } = useAuth();
    const [filter, setFilter] = useState({ year: '', department: '', section: '' });
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [marks, setMarks] = useState({});
    const [feedback, setFeedback] = useState({});
    const [savingId, setSavingId] = useState(null);
    const API = import.meta.env.VITE_API_URL || 'http://localhost:7000';

    const handleSearch = async () => {
        if (!filter.year || !filter.department || !filter.section) {
            toast.error('Please select year, department, and section');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.get(`${API}/api/student-assignments/class/submissions/all`, {
                params: {
                    year: filter.year,
                    department: filter.department,
                    section: filter.section,
                },
                headers: { Authorization: `Bearer ${token}` },
            });
            setSubmissions(res.data || []);

            // Initialize marks and feedback
            const initialMarks = {};
            const initialFeedback = {};
            res.data.forEach(sub => {
                initialMarks[sub._id] = sub.marks || '';
                initialFeedback[sub._id] = sub.feedback || '';
            });
            setMarks(initialMarks);
            setFeedback(initialFeedback);
        } catch (err) {
            console.error('Error fetching submissions:', err);
            toast.error('Failed to fetch submissions');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveMarks = async (submissionId) => {
        if (marks[submissionId] === '' || marks[submissionId] === null || marks[submissionId] === undefined) {
            toast.error('Please enter marks');
            return;
        }

        setSavingId(submissionId);
        try {
            const res = await axios.put(
                `${API}/api/student-assignments/${submissionId}/marks`,
                {
                    marks: marks[submissionId],
                    feedback: feedback[submissionId],
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            // Update local state with saved marks and feedback
            setMarks(prev => ({ ...prev, [submissionId]: res.data.marks }));
            setFeedback(prev => ({ ...prev, [submissionId]: res.data.feedback || '' }));

            toast.success('Marks saved successfully');
        } catch (err) {
            console.error('Error saving marks:', err);
            toast.error('Failed to save marks');
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="p-6 text-white min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-white">Check Assignments</h1>

            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">Filter Students</h2>
                <ClassFilter onFilterChange={setFilter} user={user} />
                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="mt-4 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Searching...' : 'Search Submissions'}
                </button>
            </div>

            {submissions.length > 0 ? (
                <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5">
                    <h2 className="text-xl font-semibold mb-4 text-cyan-400">Submissions ({submissions.length})</h2>
                    <div className="overflow-x-auto rounded-lg border border-gray-700">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-900/70 text-gray-300 border-b border-gray-700 uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Student Name</th>
                                    <th className="px-6 py-4 font-semibold">Assignment</th>
                                    <th className="px-6 py-4 font-semibold">Submission Date</th>
                                    <th className="px-6 py-4 font-semibold">File</th>
                                    <th className="px-6 py-4 font-semibold">Marks</th>
                                    <th className="px-6 py-4 font-semibold">Feedback</th>
                                    <th className="px-6 py-4 font-semibold">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {submissions.map((submission) => (
                                    <tr key={submission._id} className="hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4 font-medium">{submission.studentName}</td>
                                        <td className="px-6 py-4">{submission.assignmentTitle}</td>
                                        <td className="px-6 py-4">{new Date(submission.submittedAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            {submission.submissionFileUrl && (
                                                <a
                                                    href={submission.submissionFileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                                                >
                                                    <Download className="w-4 h-4" /> Download
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                value={marks[submission._id] || ''}
                                                onChange={(e) => setMarks(prev => ({ ...prev, [submission._id]: e.target.value }))}
                                                placeholder="Enter marks"
                                                className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="text"
                                                value={feedback[submission._id] || ''}
                                                onChange={(e) => setFeedback(prev => ({ ...prev, [submission._id]: e.target.value }))}
                                                placeholder="Feedback"
                                                className="w-32 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleSaveMarks(submission._id)}
                                                disabled={savingId === submission._id}
                                                className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500 hover:bg-cyan-600 rounded disabled:opacity-50"
                                            >
                                                <Save className="w-4 h-4" /> {savingId === submission._id ? 'Saving...' : 'Save'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-10 bg-gray-900/40 rounded-lg border border-gray-800">
                    <p className="text-gray-400">{loading ? 'Loading...' : 'No submissions found. Apply filters and search to view submissions.'}</p>
                </div>
            )}
        </div>
    );
};

export default AssignmentChecker;