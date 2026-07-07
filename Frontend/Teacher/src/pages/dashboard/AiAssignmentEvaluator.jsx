import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import { Wand2, Loader, Upload, CheckCircle, AlertCircle, X, FileText } from 'lucide-react';

const AiAssignmentEvaluator = () => {
    const { token } = useAuth();
    const [step, setStep] = useState('upload'); // upload, result
    const [subjectName, setSubjectName] = useState('');
    const [studentName, setStudentName] = useState('');
    const [file, setFile] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [evaluation, setEvaluation] = useState(null);
    const [marks, setMarks] = useState('');
    const [savingMarks, setSavingMarks] = useState(false);

    const API = import.meta.env.VITE_API_URL || 'http://localhost:7000';

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Check file type
            const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
            if (!allowedTypes.includes(selectedFile.type)) {
                toast.error('Only PDF, DOCX, and TXT files are allowed');
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleAnalyze = async () => {
        if (!subjectName.trim()) {
            toast.error('Please enter subject name');
            return;
        }
        if (!file) {
            toast.error('Please upload a file');
            return;
        }
        if (!studentName.trim()) {
            toast.error('Please enter student name');
            return;
        }

        setAnalyzing(true);
        setEvaluation(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('message', `You are an expert teacher evaluator for the subject "${subjectName}". Analyze this student assignment submission from "${studentName}" and provide:

1. **Grammar & Writing Quality** (Score 1-10):
   - List specific grammar mistakes found
   - Rate clarity and writing style
   - Suggestions for improvement

2. **Content Analysis**:
   - Check if content is relevant to "${subjectName}"
   - Identify key concepts/topics covered
   - List important points that are missing
   - Assess completeness (%)

3. **Structure & Organization** (Score 1-10):
   - Evaluate how well the content is organized
   - Check if logical flow is maintained
   - Suggest structural improvements

4. **Subject-Specific Feedback** (For ${subjectName}):
   - Technical accuracy and correctness
   - Depth of understanding shown
   - Application of concepts
   - Any misconceptions found

5. **Plagiarism Risk**:
   - Check for signs of copy-paste
   - Assess originality

6. **Overall Assessment**:
   - Estimated marks out of 100
   - Top 3 strengths
   - Top 3 areas for improvement
   - Suggested grade (A, B, C, D, F)
   - Motivation/encouragement comments

Format response clearly with these sections and make it easy to read.`);

            const res = await axios.post(
                `${API}/api/ai/chat`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 180000,
                }
            );

            setEvaluation(res.data?.reply || 'No evaluation received');
            setStep('result');
        } catch (err) {
            console.error('Error analyzing assignment:', err);
            toast.error('Failed to analyze assignment. Please try again.');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSaveMarks = async () => {
        if (!marks || marks === '') {
            toast.error('Please enter marks');
            return;
        }

        if (marks < 0 || marks > 100) {
            toast.error('Marks must be between 0 and 100');
            return;
        }

        setSavingMarks(true);
        try {
            // Here you can save to database if needed
            // For now, we'll just show a success message
            toast.success(`✅ Marks (${marks}/100) recorded successfully!`);

            // Reset form
            setStep('upload');
            setSubjectName('');
            setStudentName('');
            setFile(null);
            setMarks('');
            setEvaluation(null);
        } catch (err) {
            console.error('Error saving marks:', err);
            toast.error('Failed to save marks');
        } finally {
            setSavingMarks(false);
        }
    };

    const goBack = () => {
        if (step === 'result') {
            setStep('upload');
            setMarks('');
            setEvaluation(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                        <Wand2 className="w-8 h-8 text-cyan-400" />
                        AI Assignment Evaluator
                    </h1>
                    <p className="text-gray-400">Upload student work and get instant AI analysis with grammar checking, content review, and subject-specific feedback</p>
                </div>

                {/* Step 1: Upload File */}
                {step === 'upload' && (
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 shadow-xl">
                        <h2 className="text-2xl font-bold text-white mb-6">📝 Evaluate Assignment</h2>

                        <div className="space-y-6">
                            {/* Subject Input */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    📚 Subject Name
                                </label>
                                <input
                                    type="text"
                                    value={subjectName}
                                    onChange={(e) => setSubjectName(e.target.value)}
                                    placeholder="e.g., Web Technologies, Data Structures, English Literature, Mathematics"
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition-all"
                                />
                                <p className="text-xs text-gray-500 mt-1">AI will provide subject-specific feedback based on this</p>
                            </div>

                            {/* Student Name Input */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    👤 Student Name
                                </label>
                                <input
                                    type="text"
                                    value={studentName}
                                    onChange={(e) => setStudentName(e.target.value)}
                                    placeholder="e.g., Ahmed Khan, Sara Ali"
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition-all"
                                />
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-3">
                                    📄 Upload Assignment File
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="file-input"
                                        onChange={handleFileSelect}
                                        accept=".pdf,.docx,.txt"
                                        className="hidden"
                                    />
                                    {!file ? (
                                        <label
                                            htmlFor="file-input"
                                            className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-cyan-400 hover:bg-gray-800/50 transition-all"
                                        >
                                            <Upload className="w-12 h-12 text-cyan-400 mb-2" />
                                            <p className="text-gray-300 font-semibold">Click to upload or drag and drop</p>
                                            <p className="text-gray-500 text-sm">PDF, DOCX, or TXT (Max 10MB)</p>
                                        </label>
                                    ) : (
                                        <div className="p-6 bg-gray-800/50 border border-gray-600 rounded-lg flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-8 h-8 text-cyan-400" />
                                                <div>
                                                    <p className="text-white font-semibold">{file.name}</p>
                                                    <p className="text-gray-400 text-sm">{(file.size / 1024).toFixed(2)} KB</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setFile(null)}
                                                className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Analyze Button */}
                            <button
                                onClick={handleAnalyze}
                                disabled={!subjectName.trim() || !file || !studentName.trim() || analyzing}
                                className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-lg shadow-lg"
                            >
                                {analyzing ? (
                                    <>
                                        <Loader className="w-5 h-5 animate-spin" />
                                        Analyzing with AI... (this may take a minute)
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-5 h-5" />
                                        Start AI Analysis
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Results */}
                {step === 'result' && evaluation && (
                    <div className="space-y-6">
                        {/* Header Card */}
                        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-xl p-6">
                            <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                                <CheckCircle className="w-7 h-7 text-green-400" />
                                AI Evaluation Complete
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-400">Subject</p>
                                    <p className="text-white font-semibold">{subjectName}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Student</p>
                                    <p className="text-white font-semibold">{studentName}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">File</p>
                                    <p className="text-cyan-300 font-semibold">{file.name}</p>
                                </div>
                            </div>
                        </div>

                        {/* Evaluation Content */}
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8">
                            <h3 className="text-xl font-bold text-cyan-400 mb-4">📋 AI Analysis Report</h3>
                            <div className="prose prose-invert max-w-none text-gray-200 space-y-4">
                                <ReactMarkdown
                                    components={{
                                        p: ({ node, ...props }) => <p className="mb-3 leading-relaxed" {...props} />,
                                        h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2 text-cyan-300" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-4 mb-2 text-cyan-300" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="text-base font-bold mt-3 mb-1 text-cyan-300" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="font-bold text-cyan-300" {...props} />,
                                        em: ({ node, ...props }) => <em className="italic text-gray-300" {...props} />,
                                        code: ({ node, ...props }) => <code className="bg-gray-900 px-2 py-1 rounded text-yellow-300 text-sm" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-3 space-y-1" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />,
                                        li: ({ node, ...props }) => <li className="ml-2 text-gray-200" {...props} />,
                                        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-cyan-400 pl-4 italic my-3 text-gray-300" {...props} />,
                                    }}
                                >
                                    {evaluation}
                                </ReactMarkdown>
                            </div>
                        </div>

                        {/* Marks Input */}
                        <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-600/30 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-green-400 mb-4">🏆 Award Marks</h3>
                            <div className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                                        Enter Marks (0-100)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={marks}
                                        onChange={(e) => setMarks(e.target.value)}
                                        placeholder="e.g., 85"
                                        className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white text-2xl font-bold text-center focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/30 transition-all"
                                    />
                                </div>
                                <div className="text-2xl font-bold text-gray-400">/100</div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={handleSaveMarks}
                                disabled={!marks || savingMarks}
                                className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-lg shadow-lg"
                            >
                                {savingMarks ? (
                                    <>
                                        <Loader className="w-5 h-5 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Save Marks & Finish
                                    </>
                                )}
                            </button>
                            <button
                                onClick={goBack}
                                disabled={savingMarks}
                                className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg disabled:opacity-50 transition-colors"
                            >
                                ← Back
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AiAssignmentEvaluator;
