import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { GraduationCap, ArrowLeft, Mail, CheckCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:7000';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const res = await axios.post(`${API}/api/auth/forgot-password`, { email });
            toast.success(res.data.message || 'Password reset link sent to your email');
            setSubmitted(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.message || 'Failed to process your request. Please try again.';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-600/5"></div>

            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="bg-gray-800/50 backdrop-blur-lg p-8 rounded-2xl border border-cyan-500/20 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <Link
                            to="/"
                            className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors mb-4"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Back to Sign In
                        </Link>
                        <div className="flex items-center justify-center space-x-2 mb-6">
                            <GraduationCap className="w-8 h-8 text-cyan-400" />
                            <span className="text-2xl font-bold text-white">Virtual CUI</span>
                        </div>

                        {submitted ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                                className="text-center"
                            >
                                <div className="flex justify-center mb-4">
                                    <CheckCircle className="w-16 h-16 text-green-400" />
                                </div>
                                <h1 className="text-3xl font-bold text-white mb-2">Sent Successfully!</h1>
                                <p className="text-gray-300">
                                    Check your email for a link to reset your password. You'll be redirected to login shortly.
                                </p>
                            </motion.div>
                        ) : (
                            <>
                                <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
                                <p className="text-gray-300">
                                    Enter your email address and we'll send you a link to reset your password
                                </p>
                            </>
                        )}
                    </div>

                    {/* Form */}
                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setError('');
                                        }}
                                        className="w-full px-4 py-3 pl-12 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all"
                                        placeholder="Enter your registered email"
                                    />
                                </div>
                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-red-400 text-sm mt-2"
                                    >
                                        {error}
                                    </motion.p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 py-3 px-4 rounded-lg text-white font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
                            </button>
                        </form>
                    ) : null}

                    {/* Footer */}
                    {!submitted && (
                        <div className="mt-8 text-center">
                            <p className="text-gray-400">
                                Remember your password?{' '}
                                <Link to="/" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                                    Sign in here
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
