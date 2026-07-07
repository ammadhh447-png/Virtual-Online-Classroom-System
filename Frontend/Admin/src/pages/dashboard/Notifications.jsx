import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:7000';

export default function NotificationsPage() {
    const { token, user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchNotes = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API}/api/notifications/me`, { headers: { Authorization: `Bearer ${token}` } });
            setItems(res.data || []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNotes(); }, [token]);

    const markRead = async (id) => {
        if (!token) return;
        try {
            await axios.post(`${API}/api/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setItems(prev => prev.map(i => i._id === id ? { ...i, readBy: [...(i.readBy || []), user.id] } : i));
        } catch (err) {
            console.error(err);
        }
    };

    const clearAll = async () => {
        if (!token) return;
        try {
            await axios.post(`${API}/api/notifications/clear`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setItems(prev => prev.map(i => ({ ...i, readBy: [...(i.readBy || []), user.id] })));
            toast.success('Notifications cleared');
        } catch (err) {
            console.error(err);
            toast.error('Failed to clear notifications');
        }
    };

    const open = async (note) => {
        if (!note) return;
        try { await markRead(note._id); } catch (e) { }
        if (note.link) navigate(note.link);
    };

    return (
        <div className="bg-gray-900 p-6 rounded-lg border border-cyan-500/20">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Notifications</h2>
                <div className="flex items-center gap-2">
                    <button onClick={fetchNotes} className="text-sm text-cyan-400">Refresh</button>
                    <button onClick={clearAll} className="text-sm text-red-400">Clear All</button>
                </div>
            </div>

            {loading ? (
                <div className="text-center text-gray-400 py-8">Loading...</div>
            ) : items.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No notifications</div>
            ) : (
                <ul className="space-y-3">
                    {items.map(item => {
                        const isRead = (item.readBy || []).some(r => String(r) === String(user.id));
                        return (
                            <li key={item._id} className={`p-3 rounded border ${isRead ? 'bg-gray-800/40' : 'bg-gray-800/80'} cursor-pointer`} onClick={() => open(item)}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="font-semibold text-white">{item.title}</div>
                                        <div className="text-gray-400 text-sm">{item.body}</div>
                                        {item.type && <div className="text-xs text-gray-500 mt-1">{item.type}</div>}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</div>
                                        {!isRead && (
                                            <button onClick={(e) => { e.stopPropagation(); markRead(item._id); }} className="text-xs text-cyan-400 mt-2">Mark read</button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
