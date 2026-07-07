import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import ClassFilter from "../../components/ClassFilter";
import { toast } from "react-toastify";
import { Download, Save, CheckCircle, XCircle } from "lucide-react";

const AttendancePage = () => {
    const { user } = useContext(AuthContext);
    const [filters, setFilters] = useState({
        year: "",
        department: "",
        section: "",
    });
    const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (filters.year && filters.department && filters.section) {
            fetchStudents();
        }
    }, [filters]);

    useEffect(() => {
        if (date && students.length > 0) {
            fetchAttendance();
        }
    }, [date, students]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/api/attendance/students`, {
                params: filters,
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            const studentsList = Array.isArray(res.data) ? res.data : [];
            setStudents(studentsList);
            // Initialize attendance state
            const initialAttendance = {};
            studentsList.forEach((student) => {
                initialAttendance[student._id] = "present"; // Default to present
            });
            setAttendance(initialAttendance);
        } catch (error) {
            console.error('fetchStudents error:', error);
            toast.error(error.response?.data?.message || error.message || "Failed to fetch students.");
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/api/attendance`, {
                params: {
                    date,
                    ...filters,
                },
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            const fetchedAttendance = {};
            const records = Array.isArray(res.data) ? res.data : [];
            records.forEach((record) => {
                if (record?.student?._id) fetchedAttendance[record.student._id] = record.status;
            });
            setAttendance((prev) => ({ ...prev, ...fetchedAttendance }));
        } catch (error) {
            toast.error("Failed to fetch attendance records.");
        } finally {
            setLoading(false);
        }
    };

    const handleAttendanceChange = (studentId, status) => {
        setAttendance((prev) => ({ ...prev, [studentId]: status }));
    };

    const handleMarkAll = (status) => {
        const newAttendance = {};
        students.forEach((student) => {
            newAttendance[student._id] = status;
        });
        setAttendance(newAttendance);
    };

    const handleSubmit = async () => {
        if (!date) {
            toast.error("Please select a date.");
            return;
        }

        const attendanceData = Object.keys(attendance).map((studentId) => ({
            student: studentId,
            status: attendance[studentId],
        }));

        try {
            await axios.post(
                `${API}/api/attendance/mark`,
                {
                    date,
                    attendance: attendanceData,
                    ...filters,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                },
            );
            toast.success("Attendance marked successfully!");
        } catch (error) {
            toast.error("Failed to mark attendance.");
        }
    };

    const handleExport = async () => {
        try {
            const className = `${filters.year}-${filters.department}-${filters.section}`;
            const rowsHtml = students
                .map((s) => `
                    <tr>
                        <td style="padding:8px;border:1px solid #ccc">${s.name}</td>
                        <td style="padding:8px;border:1px solid #ccc; text-transform: uppercase;">${attendance[s._id] || 'present'}</td>
                    </tr>
                `)
                .join('');

            const html = `
                <html>
                    <head>
                        <title>Attendance - ${className}</title>
                        <style>body{font-family:Arial,sans-serif;padding:20px} table{border-collapse:collapse;width:100%} th,td{border:1px solid #ccc;padding:8px;text-align:left}</style>
                    </head>
                    <body>
                        <h1>Attendance - ${className}</h1>
                        <div>Date: ${date}</div>
                        <div>Class: ${className}</div>
                        <table style="margin-top:12px">
                            <thead><tr><th>Student</th><th>Status</th></tr></thead>
                            <tbody>
                                ${rowsHtml}
                            </tbody>
                        </table>
                    </body>
                </html>
            `;

            const win = window.open('', '_blank');
            if (!win) {
                toast.error('Popup blocked. Allow popups to export.');
                return;
            }
            win.document.write(html);
            win.document.close();
            win.focus();
            win.print();
        } catch (error) {
            toast.error("Failed to export attendance.");
        }
    };

    return (
        <div className="p-6 text-white min-h-screen">
            <div className="flex items-center justify-between gap-3 mb-6">
                <h1 className="text-3xl font-bold">Manage Attendance</h1>
            </div>

            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">Class Selection</h2>
                <ClassFilter user={user} onFilterChange={setFilters} />
            </div>

            {filters.year && filters.department && filters.section && (
                <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 mb-6">
                    <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <label className="text-gray-300 font-medium">Date:</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>
                        <button
                            onClick={handleExport}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
                        >
                            <Download className="w-4 h-4" /> Export PDF
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-10">
                            <p className="text-cyan-400 text-lg animate-pulse">Loading attendance data...</p>
                        </div>
                    ) : (
                        students.length > 0 ? (
                            <div>
                                <div className="flex gap-4 mb-4 justify-end">
                                    <button
                                        onClick={() => handleMarkAll("present")}
                                        className="inline-flex items-center gap-2 px-3 py-2 bg-green-700 rounded-lg hover:bg-green-600 transition-colors"
                                    >
                                        <CheckCircle className="w-4 h-4" /> Mark All Present
                                    </button>
                                    <button
                                        onClick={() => handleMarkAll("absent")}
                                        className="inline-flex items-center gap-2 px-3 py-2 bg-red-700 rounded-lg hover:bg-red-600 transition-colors"
                                    >
                                        <XCircle className="w-4 h-4" /> Mark All Absent
                                    </button>
                                </div>
                                <div className="overflow-x-auto rounded-lg border border-gray-700">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-gray-900/70 text-gray-300 border-b border-gray-700 uppercase">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold">Student Name</th>
                                                <th className="px-6 py-4 font-semibold text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {students.map((student) => (
                                                <tr key={student._id} className="hover:bg-gray-700/30 transition-colors">
                                                    <td className="px-6 py-4 font-medium">{student.name}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-center gap-6">
                                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                                <input
                                                                    type="radio"
                                                                    name={`attendance-${student._id}`}
                                                                    checked={attendance[student._id] === "present"}
                                                                    onChange={() => handleAttendanceChange(student._id, "present")}
                                                                    className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 focus:ring-cyan-500"
                                                                />
                                                                <span className="text-gray-300 group-hover:text-green-400 transition-colors">Present</span>
                                                            </label>
                                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                                <input
                                                                    type="radio"
                                                                    name={`attendance-${student._id}`}
                                                                    checked={attendance[student._id] === "absent"}
                                                                    onChange={() => handleAttendanceChange(student._id, "absent")}
                                                                    className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 focus:ring-cyan-500"
                                                                />
                                                                <span className="text-gray-300 group-hover:text-red-400 transition-colors">Absent</span>
                                                            </label>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={handleSubmit}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-all font-semibold shadow-lg shadow-cyan-900/50"
                                    >
                                        <Save className="w-5 h-5" /> Save Attendance
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-gray-900/40 rounded-lg border border-gray-800">
                                <p className="text-gray-400">No students found for the selected class.</p>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

export default AttendancePage;