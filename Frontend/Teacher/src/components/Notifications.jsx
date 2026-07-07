import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Notifications = () => {
    const { token } = useAuth();
    const [open, setOpen] = useState(false);
    const [notes, setNotes] = useState([]);

    const API = import.meta.env.VITE_API_URL || 'http://localhost:7000';

    const fetchNotes = async () => {
        if (!token) return;
        try {
            const res = await axios.get(`${API}/api/notifications/me`, { headers: { Authorization: `Bearer ${token}` } });
            setNotes(res.data || []);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    const clearAll = async () => {
        if (!token) return;
        try {
            await axios.post(`${API}/api/notifications/clear`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setNotes([]);
        } catch (err) {
            console.error('Failed to clear notifications', err);
        }
    };

    useEffect(() => {
        if (open) fetchNotes();
    }, [open]);

    return (
        <div className="relative">
            <button onClick={() => setOpen(o => !o)} className="p-2 bg-gray-800 rounded-lg">
                <Bell className="w-5 h-5 text-white" />
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg p-3 z-50">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Notifications</h4>
                        <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-300">Clear All</button>
                    </div>
                    {notes.length === 0 && <p className="text-sm text-gray-400">No notifications yet.</p>}
                    <ul className="space-y-2 max-h-64 overflow-y-auto">
                        {notes.map(n => (
                            <li key={n._id} className="p-2 rounded hover:bg-gray-700">
                                <div className="font-medium">{n.title}</div>
                                <div className="text-xs text-gray-400">{n.body}</div>
                                <div className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Notifications;
