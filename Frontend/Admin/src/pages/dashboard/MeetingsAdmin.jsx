import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { RefreshCcw, Video, Play, Square, Trash2 } from 'lucide-react';

const MeetingsAdmin = () => {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const [year, setYear] = useState('');
    const [department, setDepartment] = useState('');
    const [section, setSection] = useState('');
    const [status, setStatus] = useState('');
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchMeetings = async () => {
        try {
            setLoading(true);
            const params = {};
            if (year.trim()) params.year = year.trim();
            if (department.trim()) params.department = department.trim();
            if (section.trim()) params.section = section.trim();
            if (status) params.status = status;

            const res = await axios.get(`${API}/api/meetings/admin`, { params });
            setMeetings(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to load meetings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeetings();
    }, []);

    const updateStatus = async (meetingId, nextStatus) => {
        try {
            await axios.patch(`${API}/api/meetings/${meetingId}/status`, { status: nextStatus });
            toast.success(`Meeting marked as ${nextStatus}.`);
            fetchMeetings();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update status.');
        }
    };

    const removeMeeting = async (meetingId) => {
        const confirmed = window.confirm('Delete this meeting?');
        if (!confirmed) return;

        try {
            await axios.delete(`${API}/api/meetings/${meetingId}`);
            toast.success('Meeting deleted.');
            fetchMeetings();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete meeting.');
        }
    };

    return (
        <div className="p-6 text-white">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">All Class Meetings</h1>
                <button
                    onClick={fetchMeetings}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
                >
                    <RefreshCcw className="w-4 h-4" /> Refresh
                </button>
            </div>

            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                    value={year}
                    onChange={(e) => setYear(e.target.value.toUpperCase())}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                    placeholder="Year (e.g. FA22)"
                />
                <input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value.toUpperCase())}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                    placeholder="Department (e.g. BCS)"
                />
                <input
                    value={section}
                    onChange={(e) => setSection(e.target.value.toUpperCase())}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                    placeholder="Section (A/B/C...)"
                />
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                >
                    <option value="">All Status</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live</option>
                    <option value="ended">Ended</option>
                </select>
                <div className="md:col-span-4">
                    <button onClick={fetchMeetings} className="px-4 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-500">Apply Filters</button>
                </div>
            </div>

            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5">
                {loading ? (
                    <p className="text-gray-400">Loading meetings...</p>
                ) : meetings.length === 0 ? (
                    <p className="text-gray-400">No meetings found.</p>
                ) : (
                    <div className="space-y-3">
                        {meetings.map((meeting) => (
                            <div key={meeting._id} className="bg-gray-900/70 border border-gray-700 rounded-lg p-4">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                                    <div>
                                        <h3 className="text-lg font-semibold">{meeting.title}</h3>
                                        <p className="text-sm text-gray-300">
                                            {meeting.year}-{meeting.department}-{meeting.section} | {new Date(meeting.startsAt).toLocaleString()} | {meeting.durationMinutes} min
                                        </p>
                                        <p className="text-xs text-cyan-300 uppercase mt-1">Status: {meeting.status}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <a href={meeting.meetUrl} target="_blank" rel="noreferrer" className="px-3 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 inline-flex items-center gap-1">
                                            <Video className="w-4 h-4" /> Join
                                        </a>
                                        <button onClick={() => updateStatus(meeting._id, 'live')} className="px-3 py-2 bg-green-600 rounded-lg hover:bg-green-500 inline-flex items-center gap-1">
                                            <Play className="w-4 h-4" /> Live
                                        </button>
                                        <button onClick={() => updateStatus(meeting._id, 'ended')} className="px-3 py-2 bg-yellow-600 rounded-lg hover:bg-yellow-500 inline-flex items-center gap-1">
                                            <Square className="w-4 h-4" /> End
                                        </button>
                                        <button onClick={() => removeMeeting(meeting._id)} className="px-3 py-2 bg-red-600 rounded-lg hover:bg-red-500 inline-flex items-center gap-1">
                                            <Trash2 className="w-4 h-4" /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MeetingsAdmin;
