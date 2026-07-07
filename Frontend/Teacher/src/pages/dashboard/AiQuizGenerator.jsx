import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import html2pdf from 'html2pdf.js';
import { BookOpen, Loader, Plus, Minus, Download, CheckCircle, Brain } from 'lucide-react';

const AiQuizGenerator = () => {
    const { token } = useAuth();
    const [step, setStep] = useState('type'); // type, input, generating, result
    const [quizType, setQuizType] = useState(null); // 'mcq' or 'question'
    const [subjectName, setSubjectName] = useState('');
    const [questionCount, setQuestionCount] = useState(5);
    const [generating, setGenerating] = useState(false);
    const [quizData, setQuizData] = useState(null);

    const API = import.meta.env.VITE_API_URL || 'http://localhost:7000';

    const handleTypeSelect = (type) => {
        setQuizType(type);
        setStep('input');
    };

    const handleGenerate = async () => {
        if (!subjectName.trim()) {
            toast.error('Please enter subject name');
            return;
        }
        if (questionCount < 1 || questionCount > 50) {
            toast.error('Questions must be between 1 and 50');
            return;
        }

        setGenerating(true);
        setStep('generating');

        try {
            let prompt = '';

            if (quizType === 'mcq') {
                prompt = `Generate exactly ${questionCount} multiple choice questions for the subject "${subjectName}". 

For each question, provide ONLY:
1. Question number and text
2. Four options labeled A, B, C, D

Do NOT include the correct answer, explanation, or any answer information.

Format should be:

Q1. [Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

---

Generate exactly ${questionCount} such questions. Remember: ONLY questions and options, NO answers.`;
            } else {
                prompt = `Generate exactly ${questionCount} short answer/essay questions for the subject "${subjectName}".

For each question, provide ONLY:
1. Question number and text
2. Points (suggested marks)

Do NOT include ideal answers, key points, or any answer information.

Format should be:

Q1. [Question text]
Points: [number]

---

Generate exactly ${questionCount} such questions covering different topics in ${subjectName}. Remember: ONLY questions and points, NO answers.`;
            }

            let res;
            let retries = 0;
            const maxRetries = 2;

            while (retries < maxRetries) {
                try {
                    res = await axios.post(
                        `${API}/api/ai/chat`,
                        { message: prompt },
                        {
                            headers: { Authorization: `Bearer ${token}` },
                            timeout: 120000,
                        }
                    );
                    break;
                } catch (err) {
                    retries++;
                    if (retries >= maxRetries || (err.response?.status !== 502 && err.response?.status !== 503)) {
                        throw err;
                    }
                    console.log(`Retry attempt ${retries}...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }

            const response = res.data?.reply || 'No quiz generated';

            setQuizData({
                subject: subjectName,
                type: quizType,
                count: questionCount,
                content: response,
            });

            setStep('result');
            toast.success('✅ Quiz generated successfully!');
        } catch (err) {
            console.error('Error generating quiz:', err);

            let errorMessage = 'Failed to generate quiz. Please try again.';

            if (err.response?.status === 502 || err.response?.status === 503) {
                errorMessage = '⏱️ API timeout - Google\'s servers are slow. Wait a moment and retry!';
            } else if (err.code === 'ECONNABORTED') {
                errorMessage = '⏱️ Request timed out. Try with fewer questions (5-10).';
            } else if (err.response?.status === 500) {
                errorMessage = '❌ Server error. Check console logs.';
            }

            toast.error(errorMessage);
            setStep('input');
        } finally {
            setGenerating(false);
        }
    };

    const downloadPDF = () => {
        const element = document.getElementById('quiz-content');

        const opt = {
            margin: 10,
            filename: `${subjectName.replace(/\s+/g, '_')}_${quizType === 'mcq' ? 'MCQ' : 'Questions'}_${new Date().toLocaleDateString()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        };

        html2pdf().set(opt).from(element).save();
        toast.success('✅ PDF downloaded successfully!');
    };

    const handleReset = () => {
        setStep('type');
        setQuizType(null);
        setSubjectName('');
        setQuestionCount(5);
        setQuizData(null);
    };

    return (
        <div className="min-h-screen bg-gray-900 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                        <Brain className="w-8 h-8 text-purple-400" />
                        AI Quiz Generator
                    </h1>
                    <p className="text-gray-400">Generate customized quizzes with MCQs or short answer questions. Download as PDF.</p>
                </div>

                {/* Step 1: Select Quiz Type */}
                {step === 'type' && (
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 shadow-xl">
                        <h2 className="text-2xl font-bold text-white mb-8">📋 Choose Quiz Type</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* MCQ Option */}
                            <button
                                onClick={() => handleTypeSelect('mcq')}
                                className="p-8 rounded-xl border-2 border-gray-600 bg-gray-800/50 hover:border-purple-400 hover:bg-purple-400/10 transition-all text-left group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Multiple Choice Questions</h3>
                                        <p className="text-gray-400 text-sm">MCQs with 4 options</p>
                                    </div>
                                    <BookOpen className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="space-y-2 text-sm text-gray-300">
                                    <p>✓ Quick to create & evaluate</p>
                                    <p>✓ Perfect for assessments</p>
                                    <p>✓ Option A, B, C, D format</p>

                                </div>
                            </button>

                            {/* Question Option */}
                            <button
                                onClick={() => handleTypeSelect('question')}
                                className="p-8 rounded-xl border-2 border-gray-600 bg-gray-800/50 hover:border-blue-400 hover:bg-blue-400/10 transition-all text-left group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Short Answer Questions</h3>
                                        <p className="text-gray-400 text-sm">Essay/Short answer format</p>
                                    </div>
                                    <Brain className="w-10 h-10 text-blue-400 group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="space-y-2 text-sm text-gray-300">
                                    <p>✓ Tests deeper understanding</p>
                                    <p>✓ Ideal for comprehensive exams</p>
                                    <p>✓ Key points for marking included</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Input Details */}
                {step === 'input' && (
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 shadow-xl">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {quizType === 'mcq' ? '🎯 Generate Multiple Choice Questions' : '📝 Generate Short Answer Questions'}
                        </h2>
                        <p className="text-gray-400 mb-8">Configure your quiz settings</p>

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
                                    placeholder="e.g., Web Technologies, Biology, History"
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/30 transition-all"
                                />
                                <p className="text-xs text-gray-500 mt-1">AI will generate quiz based on this subject</p>
                            </div>

                            {/* Question Count */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-3">
                                    🔢 Number of {quizType === 'mcq' ? 'MCQs' : 'Questions'}
                                </label>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setQuestionCount(Math.max(1, questionCount - 1))}
                                        className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                                    >
                                        <Minus className="w-5 h-5" />
                                    </button>

                                    <div className="px-8 py-3 bg-gray-800 border border-gray-600 rounded-lg text-center">
                                        <p className="text-3xl font-bold text-purple-400">{questionCount}</p>
                                    </div>

                                    <button
                                        onClick={() => setQuestionCount(Math.min(50, questionCount + 1))}
                                        className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>

                                    <div className="ml-auto text-sm text-gray-400">
                                        <p>Min: 1 | Max: 50</p>
                                    </div>
                                </div>
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={handleGenerate}
                                disabled={!subjectName.trim() || generating}
                                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-lg shadow-lg mt-8"
                            >
                                {generating ? (
                                    <>
                                        <Loader className="w-5 h-5 animate-spin" />
                                        Generating Quiz... (this may take 30-60 seconds)
                                    </>
                                ) : (
                                    <>
                                        <Brain className="w-5 h-5" />
                                        Generate Quiz with AI
                                    </>
                                )}
                            </button>

                            {/* Back Button */}
                            <button
                                onClick={() => setStep('type')}
                                className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                            >
                                ← Back
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Generating */}
                {step === 'generating' && (
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-12 shadow-xl text-center">
                        <div className="flex justify-center mb-6">
                            <div className="relative w-24 h-24">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full animate-spin opacity-75"></div>
                                <div className="absolute inset-2 bg-gray-900 rounded-full flex items-center justify-center">
                                    <Brain className="w-12 h-12 text-purple-400 animate-pulse" />
                                </div>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Creating Your Quiz...</h3>
                        <p className="text-gray-400">Our AI is generating {questionCount} {quizType === 'mcq' ? 'MCQs' : 'questions'} for {subjectName}</p>
                        <p className="text-gray-500 text-sm mt-4">This typically takes 30-60 seconds. Please wait...</p>
                    </div>
                )}

                {/* Step 4: Quiz Result */}
                {step === 'result' && quizData && (
                    <div className="space-y-6">
                        {/* Header Card */}
                        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-xl p-6">
                            <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                                <CheckCircle className="w-7 h-7 text-green-400" />
                                Quiz Generated Successfully!
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-400">Subject</p>
                                    <p className="text-white font-semibold">{quizData.subject}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Type</p>
                                    <p className="text-white font-semibold">{quizData.type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Total Questions</p>
                                    <p className="text-white font-semibold">{quizData.count}</p>
                                </div>
                            </div>
                        </div>

                        {/* Quiz Content */}
                        <div id="quiz-content" className="bg-white text-gray-900 rounded-xl p-8 overflow-hidden">
                            {/* PDF Header */}
                            <div className="mb-8 text-center border-b-2 border-gray-300 pb-6">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{quizData.subject} - Quiz</h1>
                                <p className="text-gray-600 mb-1">
                                    Type: {quizData.type === 'mcq' ? 'Multiple Choice Questions' : 'Short Answer Questions'}
                                </p>
                                <p className="text-gray-600 text-sm">Generated: {new Date().toLocaleDateString()}</p>
                            </div>

                            {/* Quiz Content */}
                            <div className="space-y-6 whitespace-pre-wrap text-sm leading-relaxed font-mono">
                                <div className="text-gray-800">{quizData.content}</div>
                            </div>

                            {/* Footer */}
                            <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center text-gray-600 text-xs">
                                <p>Generated by Online Virtual Classroom</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={downloadPDF}
                                className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-lg shadow-lg"
                            >
                                <Download className="w-5 h-5" />
                                Download as PDF
                            </button>

                            <button
                                onClick={handleReset}
                                className="flex-1 px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Create Another Quiz
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AiQuizGenerator;
