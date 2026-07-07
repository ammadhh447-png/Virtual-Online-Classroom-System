import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Clock, Upload, X, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const Assignments = () => {
    const { token } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState({});
    const [loading, setLoading] = useState(false);
    const [submittingId, setSubmittingId] = useState(null);
    const [fileName, setFileName] = useState({});
    const [files, setFiles] = useState({});

    const API = import.meta.env.VITE_API_URL || 'http://localhost:7000';

    // Fetch assignments on mount
    useEffect(() => {
        if (token) {
            fetchAssignments();
        }
    }, [token]);

    const fetchAssignments = async () => {
        try {
            const res = await axios.get(`${API}/api/student-assignments`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAssignments(res.data || []);

            // Fetch submission status for each assignment
            res.data.forEach(assignment => {
                fetchSubmissionStatus(assignment._id);
            });
        } catch (err) {
            console.error('Error fetching assignments:', err);
            toast.error('Failed to fetch assignments');
        }
    };

    const fetchSubmissionStatus = async (assignmentId) => {
        try {
            const res = await axios.get(
                `${API}/api/student-assignments/${assignmentId}/submission-status`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setSubmissions(prev => ({
                ...prev,
                [assignmentId]: res.data,
            }));
        } catch (err) {
            console.error('Error fetching submission status:', err);
        }
    };

    const handleFileChange = (e, assignmentId) => {
        const file = e.target.files[0];
        if (file) {
            const fileType = file.type;
            if (
                fileType === 'application/pdf' ||
                fileType.includes('vnd.openxmlformats-officedocument.wordprocessingml')
            ) {
                setFiles(prev => ({ ...prev, [assignmentId]: file }));
                setFileName(prev => ({ ...prev, [assignmentId]: file.name }));
            } else {
                toast.error('Only PDF and DOCX files are allowed');
            }
        }
    };

    const handleSubmit = async (assignmentId) => {
        if (!files[assignmentId]) {
            toast.error('Please select a file to submit');
            return;
        }

        setSubmittingId(assignmentId);
        try {
            const formData = new FormData();
            formData.append('assignmentId', assignmentId);
            formData.append('file', files[assignmentId]);

            const res = await axios.post(
                `${API}/api/student-assignments/submit`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            toast.success('Assignment submitted successfully!');
            setSubmissions(prev => ({
                ...prev,
                [assignmentId]: res.data.submission,
            }));
            setFiles(prev => ({ ...prev, [assignmentId]: null }));
            setFileName(prev => ({ ...prev, [assignmentId]: '' }));
        } catch (err) {
            console.error('Error submitting assignment:', err);
            toast.error(
                err.response?.data?.message || 'Failed to submit assignment'
            );
        } finally {
            setSubmittingId(null);
        }
    };

    const AssignmentCard = ({ assignment }) => {
        const submission = submissions[assignment._id];
        const isSubmitted = submission?.status === 'submitted';

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-800/50 p-5 rounded-lg border border-cyan-500/20 hover:border-cyan-500/40 transition-all"
            >
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-cyan-400" />
                            <h3 className="text-lg font-bold text-white">{assignment.title}</h3>
                        </div>
                        <p className="text-sm text-gray-400">{assignment.courseName}</p>
                    </div>
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${isSubmitted
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-yellow-500/20 text-yellow-300'
                            }`}
                    >
                        {isSubmitted ? 'Submitted' : 'Pending'}
                    </span>
                </div>

                <div className="text-xs text-gray-500 space-y-1 mb-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>Start: {new Date(assignment.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                </div>

                {assignment.fileUrl && (
                    <a
                        href={assignment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm mb-4"
                    >
                        <Download className="w-4 h-4" />
                        Download {assignment.fileName}
                    </a>
                )}

                {!isSubmitted ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded cursor-pointer hover:border-cyan-500 transition-colors">
                                <Upload className="w-4 h-4 text-cyan-400" />
                                <span className="text-sm text-gray-300">
                                    {fileName[assignment._id] || 'Choose file'}
                                </span>
                                <input
                                    type="file"
                                    accept=".pdf,.docx"
                                    onChange={(e) => handleFileChange(e, assignment._id)}
                                    className="hidden"
                                />
                            </label>
                            {fileName[assignment._id] && (
                                <button
                                    onClick={() => {
                                        setFiles(prev => ({ ...prev, [assignment._id]: null }));
                                        setFileName(prev => ({ ...prev, [assignment._id]: '' }));
                                    }}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => handleSubmit(assignment._id)}
                            disabled={!files[assignment._id] || submittingId === assignment._id}
                            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {submittingId === assignment._id ? 'Submitting...' : 'Submit Assignment'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                            <p className="text-xs text-green-300">
                                <strong>Submitted on:</strong>{' '}
                                {new Date(submission.submittedAt).toLocaleDateString()} at{' '}
                                {new Date(submission.submittedAt).toLocaleTimeString()}
                            </p>
                        </div>
                        {submission.submissionFileUrl && (
                            <a
                                href={submission.submissionFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 text-sm"
                            >
                                <Download className="w-4 h-4" />
                                Download your submission
                            </a>
                        )}
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-white">Assignments</h1>
                <button
                    onClick={fetchAssignments}
                    disabled={loading}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {assignments.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-400 mb-2">No assignments available for your section</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assignments.map(assignment => (
                        <AssignmentCard key={assignment._id} assignment={assignment} />
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default Assignments;
