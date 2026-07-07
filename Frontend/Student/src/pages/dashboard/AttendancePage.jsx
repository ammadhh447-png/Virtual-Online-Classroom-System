import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

const StudentAttendancePage = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        present: 0,
        absent: 0,
        total: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchAttendanceStats();
        }
    }, [user]);

    const fetchAttendanceStats = async () => {
        try {
            const res = await axios.get(`/api/attendance/stats/${user.id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setStats(res.data);
        } catch (error) {
            toast.error("Failed to fetch attendance statistics.");
        } finally {
            setLoading(false);
        }
    };

    const attendancePercentage =
        stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(2) : 0;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">My Attendance</h1>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-800 p-6 rounded-lg text-center">
                        <h2 className="text-xl font-semibold text-gray-400">
                            Total Classes
                        </h2>
                        <p className="text-4xl font-bold text-white">{stats.total}</p>
                    </div>
                    <div className="bg-green-800 p-6 rounded-lg text-center">
                        <h2 className="text-xl font-semibold text-green-300">Present</h2>
                        <p className="text-4xl font-bold text-white">{stats.present}</p>
                    </div>
                    <div className="bg-red-800 p-6 rounded-lg text-center">
                        <h2 className="text-xl font-semibold text-red-300">Absent</h2>
                        <p className="text-4xl font-bold text-white">{stats.absent}</p>
                    </div>
                    <div className="md:col-span-3 bg-blue-800 p-6 rounded-lg text-center">
                        <h2 className="text-xl font-semibold text-blue-300">
                            Attendance Percentage
                        </h2>
                        <p className="text-4xl font-bold text-white">
                            {attendancePercentage}%
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentAttendancePage;