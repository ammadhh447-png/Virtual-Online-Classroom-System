import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API = import.meta.env.VITE_API_URL || 'http://localhost:7000';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return toast.error('Enter a valid email');
        setLoading(true);
        try {
            const res = await axios.post(`${API}/api/auth/forgot-password`, { email });
            toast.success(res.data.message || 'Temporary password sent');
            setEmail('');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to send temporary password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-24 bg-gray-900 p-6 rounded-lg border border-cyan-500/20">
            <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>
            <p className="text-gray-400 mb-4">Enter your registered email. A temporary password will be emailed to you.</p>
            <form onSubmit={submit} className="space-y-4">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@example.com"
                    className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white"
                    required
                />
                <button disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded text-white font-semibold">
                    {loading ? 'Sending...' : 'Send Temporary Password'}
                </button>
            </form>
        </div>
    );
}
