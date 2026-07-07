import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CalendarPlus, RefreshCcw, Video, Trash2, Play, Square } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ClassFilter from '../../components/ClassFilter';

const Meetings = () => {
    const { user, refreshUser } = useAuth();
    const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const [filter, setFilter] = useState({ year: '', department: '', section: '' });
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [meetingDate, setMeetingDate] = useState('');
    const [meetingTime, setMeetingTime] = useState('');
    const [durationMinutes, setDurationMinutes] = useState(60);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [blocked, setBlocked] = useState(false);

    const canCreate = useMemo(() => {
        return Boolean(
            filter.year && filter.department && filter.section && title.trim() && meetingDate && meetingTime,
        );
    }, [filter, title, meetingDate, meetingTime]);

    const fetchMeetings = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API}/api/meetings/my`);
            setMeetings(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to load meetings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser?.();
        fetchMeetings();
    }, []);

    useEffect(() => {
        if (user && user.role === 'teacher' && user.isVerified === false) {
            setBlocked(true);
        } else {
            setBlocked(false);
        }
    }, [user]);

    const handleCreate = async (e) => {
        e.preventDefault();

        if (blocked) {
            toast.info('Verification is pending. You cannot create meetings yet.');
            return;
        }

        if (!canCreate) {
            toast.error('Please fill all required fields and class filter.');
            return;
        }

        const startsAt = `${meetingDate}T${meetingTime}`;
        const startDateObj = new Date(startsAt);
        if (Number.isNaN(startDateObj.getTime())) {
            toast.error('Please provide a valid meeting date and time.');
            return;
        }

        try {
            setSubmitting(true);
            await axios.post(`${API}/api/meetings`, {
                title: title.trim(),
                description: description.trim(),
                year: filter.year,
                department: filter.department,
                section: filter.section,
                startsAt,
                durationMinutes: Number(durationMinutes),
            });

            toast.success('Meeting created successfully.');
            setTitle('');
            setDescription('');
            setMeetingDate('');
            setMeetingTime('');
            setDurationMinutes(60);
            fetchMeetings();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create meeting.');
        } finally {
            setSubmitting(false);
        }
    };

    const updateStatus = async (meetingId, status) => {
        try {
            await axios.patch(`${API}/api/meetings/${meetingId}/status`, { status });
            toast.success(`Meeting marked as ${status}.`);
            fetchMeetings();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update meeting status.');
        }
    };

    const handleJoinMeeting = async (meeting) => {
        try {
            if (meeting.status !== 'live') {
                await axios.patch(`${API}/api/meetings/${meeting._id}/status`, { status: 'live' });
            }

            window.open(meeting.meetUrl, '_blank', 'noopener,noreferrer');
            fetchMeetings();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to start/join meeting.');
        }
    };

    const removeMeeting = async (meetingId) => {
        const confirmed = window.confirm('Are you sure you want to delete this meeting?');
        if (!confirmed) return;

        try {
            await axios.delete(`${API}/api/meetings/${meetingId}`);
            toast.success('Meeting deleted successfully.');
            fetchMeetings();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete meeting.');
        }
    };

    const formatDateTime = (value) => {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return 'Invalid date';
        return d.toLocaleString();
    };

    return (
        <div className="p-6 text-white">
            <div className="flex items-center justify-between gap-4 mb-6">
                <h1 className="text-3xl font-bold">Class Meetings</h1>
                <button
                    onClick={fetchMeetings}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
                >
                    <RefreshCcw className="w-4 h-4" /> Refresh
                </button>
            </div>

            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 mb-6">
                <h2 className="text-xl font-semibold mb-4 inline-flex items-center gap-2">
                    <CalendarPlus className="w-5 h-5 text-cyan-400" /> Create Meeting
                </h2>
                <ClassFilter onFilterChange={setFilter} user={user} />

                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Title *</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                            placeholder="Enter meeting title"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Meeting Date *</label>
                        <input
                            type="date"
                            value={meetingDate}
                            onChange={(e) => setMeetingDate(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Meeting Time *</label>
                        <input
                            type="time"
                            value={meetingTime}
                            onChange={(e) => setMeetingTime(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Duration (minutes) *</label>
                        <input
                            type="number"
                            min={15}
                            max={300}
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm text-gray-300 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                            rows={3}
                            placeholder="Optional details for students"
                        />
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                        <button
                            disabled={submitting || blocked}
                            type="submit"
                            className="px-4 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Creating...' : 'Create Meeting'}
                        </button>
                    </div>

                    {!canCreate ? (
                        <div className="md:col-span-2 text-sm text-amber-300">
                            Required: class filter, title, meeting date, and meeting time.
                        </div>
                    ) : null}
                </form>
            </div>

            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5">
                <h2 className="text-xl font-semibold mb-4">My Meetings</h2>
                {loading ? (
                    <p className="text-gray-400">Loading meetings...</p>
                ) : meetings.length === 0 ? (
                    <p className="text-gray-400">No meetings found.</p>
                ) : (
                    <div className="space-y-3">
                        {meetings.map((meeting) => (
                            <div key={meeting._id} className="bg-gray-900/70 border border-gray-700 rounded-lg p-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-semibold">{meeting.title}</h3>
                                        <p className="text-gray-300 text-sm">
                                            {meeting.year}-{meeting.department}-{meeting.section} | {formatDateTime(meeting.startsAt)} | {meeting.durationMinutes} min
                                        </p>
                                        <p className="text-xs mt-1 text-cyan-300 uppercase">Status: {meeting.status}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => handleJoinMeeting(meeting)}
                                            className="px-3 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 inline-flex items-center gap-1"
                                        >
                                            <Video className="w-4 h-4" /> Join
                                        </button>
                                        <button
                                            onClick={() => updateStatus(meeting._id, 'live')}
                                            className="px-3 py-2 bg-green-600 rounded-lg hover:bg-green-500 inline-flex items-center gap-1"
                                        >
                                            <Play className="w-4 h-4" /> Live
                                        </button>
                                        <button
                                            onClick={() => updateStatus(meeting._id, 'ended')}
                                            className="px-3 py-2 bg-yellow-600 rounded-lg hover:bg-yellow-500 inline-flex items-center gap-1"
                                        >
                                            <Square className="w-4 h-4" /> End
                                        </button>
                                        <button
                                            onClick={() => removeMeeting(meeting._id)}
                                            className="px-3 py-2 bg-red-600 rounded-lg hover:bg-red-500 inline-flex items-center gap-1"
                                        >
                                            <Trash2 className="w-4 h-4" /> Delete
                                        </button>
                                    </div>
                                </div>
                                {meeting.description ? <p className="text-gray-300 text-sm mt-2">{meeting.description}</p> : null}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Meetings;
