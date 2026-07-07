import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { RefreshCcw, Video } from 'lucide-react';

const ClassTiming = () => {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/meetings/student`);
      setMeetings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load class meetings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleJoinMeeting = (meeting) => {
    if (meeting.status !== 'live') return;

    window.open(meeting.meetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Class Meetings</h1>
        <button
          onClick={fetchMeetings}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
        >
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5">
        {loading ? (
          <p className="text-gray-400">Loading meetings...</p>
        ) : meetings.length === 0 ? (
          <p className="text-gray-400">No meetings for your class section yet.</p>
        ) : (
          <div className="space-y-3">
            {meetings.map((meeting) => (
              <div key={meeting._id} className="bg-gray-900/70 border border-gray-700 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{meeting.title}</h3>
                    <p className="text-sm text-gray-300">
                      {meeting.year}-{meeting.department}-{meeting.section} | {new Date(meeting.startsAt).toLocaleString()} | {meeting.durationMinutes} min
                    </p>
                    <p className="text-xs mt-1 text-cyan-300 uppercase">Status: {meeting.status}</p>
                    {meeting.status !== 'live' ? (
                      <p className="text-xs mt-1 text-amber-300">Teacher has not started this meeting yet.</p>
                    ) : null}
                    {meeting.description ? (
                      <p className="text-sm text-gray-300 mt-2">{meeting.description}</p>
                    ) : null}
                  </div>

                  {meeting.status === 'live' ? (
                    <button
                      onClick={() => handleJoinMeeting(meeting)}
                      className="px-3 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 inline-flex items-center gap-1"
                    >
                      <Video className="w-4 h-4" /> Join Meeting
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-3 py-2 bg-gray-600 rounded-lg opacity-70 cursor-not-allowed inline-flex items-center gap-1"
                    >
                      <Video className="w-4 h-4" /> Waiting for Teacher
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassTiming;