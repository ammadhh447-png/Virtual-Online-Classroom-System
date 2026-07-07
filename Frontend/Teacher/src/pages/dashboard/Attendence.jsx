import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Download, RefreshCcw } from 'lucide-react';

const Attendence = () => {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const [meetings, setMeetings] = useState([]);
  const [year, setYear] = useState('');
  const [department, setDepartment] = useState('');
  const [section, setSection] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [report, setReport] = useState(null);
  const [draftStatuses, setDraftStatuses] = useState({});
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [submittingManual, setSubmittingManual] = useState(false);

  const fetchMeetings = async () => {
    try {
      setLoadingMeetings(true);
      const res = await axios.get(`${API}/api/attendance/teacher/meetings`);
      const list = Array.isArray(res.data) ? res.data : [];
      setMeetings(list);

      if (!year && list.length) setYear(list[0].year || '');
      if (!department && list.length) setDepartment(list[0].department || '');
      if (!section && list.length) setSection(list[0].section || '');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load meetings.');
    } finally {
      setLoadingMeetings(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((meeting) => {
      const byYear = year ? meeting.year === year : true;
      const byDept = department ? meeting.department === department : true;
      const bySection = section ? meeting.section === section : true;
      return byYear && byDept && bySection;
    });
  }, [meetings, year, department, section]);

  useEffect(() => {
    if (!filteredMeetings.length) {
      setMeetingId('');
      return;
    }

    if (!filteredMeetings.some((meeting) => meeting._id === meetingId)) {
      setMeetingId(filteredMeetings[0]._id);
    }
  }, [filteredMeetings, meetingId]);

  const years = useMemo(() => [...new Set(meetings.map((m) => m.year))], [meetings]);
  const departments = useMemo(() => {
    return [...new Set(meetings.filter((m) => (!year ? true : m.year === year)).map((m) => m.department))];
  }, [meetings, year]);
  const sections = useMemo(() => {
    return [
      ...new Set(
        meetings
          .filter((m) => (!year ? true : m.year === year) && (!department ? true : m.department === department))
          .map((m) => m.section),
      ),
    ];
  }, [meetings, year, department]);

  const fetchReport = async (selectedMeetingId) => {
    if (!selectedMeetingId) {
      setReport(null);
      return;
    }

    try {
      setLoadingReport(true);
      const res = await axios.get(`${API}/api/attendance/teacher/report`, {
        params: { meetingId: selectedMeetingId },
      });
      setReport(res.data);

      const nextDraft = {};
      (res.data?.rows || []).forEach((row) => {
        nextDraft[row.studentId] = row.manualStatus || 'auto';
      });
      setDraftStatuses(nextDraft);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load attendance report.');
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    if (meetingId) fetchReport(meetingId);
  }, [meetingId]);

  const updateManualStatus = (studentId, status) => {
    setDraftStatuses((prev) => ({ ...prev, [studentId]: status }));
  };

  const setAllStatus = (status) => {
    if (!report?.rows?.length) return;

    const nextDraft = {};
    report.rows.forEach((row) => {
      nextDraft[row.studentId] = status;
    });
    setDraftStatuses(nextDraft);
  };

  const submitManualAttendance = async () => {
    if (!meetingId || !report?.rows?.length) return;

    try {
      setSubmittingManual(true);
      const updates = report.rows.map((row) => ({
        studentId: row.studentId,
        status: draftStatuses[row.studentId] || 'auto',
      }));

      await axios.patch(`${API}/api/attendance/teacher/manual/bulk`, {
        meetingId,
        updates,
      });

      toast.success('Attendance submitted successfully.');
      await fetchReport(meetingId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit attendance.');
    } finally {
      setSubmittingManual(false);
    }
  };

  const downloadPdf = () => {
    if (!report?.rows?.length || !report?.meeting) {
      toast.error('No attendance data available to export.');
      return;
    }

    const meeting = report.meeting;
    const summary = report.summary;

    const rowsHtml = report.rows
      .map(
        (row, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${row.rollNumber || '-'}</td>
            <td>${row.name || '-'}</td>
            <td>${row.email || '-'}</td>
            <td>${row.manualStatus || 'pending'}</td>
            <td>${row.status}</td>
          </tr>
        `,
      )
      .join('');

    const html = `
      <html>
        <head>
          <title>Attendance Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1, h2 { margin: 0 0 10px 0; }
            .meta { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #999; padding: 8px; font-size: 12px; }
            th { background: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Attendance Report</h1>
          <h2>${meeting.title}</h2>
          <div class="meta">
            <div>Class: ${meeting.year}-${meeting.department}-${meeting.section}</div>
            <div>Start: ${new Date(meeting.startsAt).toLocaleString()}</div>
            <div>Duration: ${meeting.durationMinutes} minutes</div>
            <div>Status: ${meeting.status}</div>
            <div>Total Students: ${summary.totalStudents} | Present: ${summary.present} | Absent: ${summary.absent} | Pending: ${summary.pending}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Roll Number</th>
                <th>Name</th>
                <th>Email</th>
                <th>Manual Status</th>
                <th>Final Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups and try again.');
      return;
    }

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="p-6 text-white">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-3xl font-bold">Attendance Management</h1>
        <button
          onClick={fetchMeetings}
          disabled={loadingMeetings}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-60"
        >
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 mb-6">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setDepartment('');
                setSection('');
              }}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
            >
              <option value="">All Years</option>
              {years.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setSection('');
              }}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
            >
              <option value="">All Departments</option>
              {departments.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Section</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
            >
              <option value="">All Sections</option>
              {sections.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Meeting</label>
            <select
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
            >
              <option value="">Select Meeting</option>
              {filteredMeetings.map((meeting) => (
                <option key={meeting._id} value={meeting._id}>
                  {meeting.title} ({new Date(meeting.startsAt).toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold">Class Attendance</h2>
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              onClick={() => setAllStatus('present')}
              disabled={!report?.rows?.length}
              className="px-3 py-2 bg-green-700 rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              All Present
            </button>
            <button
              onClick={() => setAllStatus('absent')}
              disabled={!report?.rows?.length}
              className="px-3 py-2 bg-red-700 rounded-lg hover:bg-red-600 disabled:opacity-50"
            >
              All Absent
            </button>
            <button
              onClick={() => setAllStatus('auto')}
              disabled={!report?.rows?.length}
              className="px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50"
            >
              Clear Manual
            </button>
            <button
              onClick={submitManualAttendance}
              disabled={!report?.rows?.length || submittingManual}
              className="px-4 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-500 disabled:opacity-50"
            >
              {submittingManual ? 'Submitting...' : 'Submit Attendance'}
            </button>
            <button
              onClick={downloadPdf}
              disabled={!report?.rows?.length}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
        </div>

        {loadingReport ? (
          <p className="text-gray-400">Loading report...</p>
        ) : !report ? (
          <p className="text-gray-400">Select a meeting to view attendance.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 text-sm">
              <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-700">Total: {report.summary.totalStudents}</div>
              <div className="bg-green-900/30 p-3 rounded-lg border border-green-700">Present: {report.summary.present}</div>
              <div className="bg-red-900/30 p-3 rounded-lg border border-red-700">Absent: {report.summary.absent}</div>
              <div className="bg-yellow-900/30 p-3 rounded-lg border border-yellow-700">Pending: {report.summary.pending}</div>
              <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-700">Manual Marking</div>
            </div>

            <div className="overflow-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead>
                  <tr className="text-left bg-gray-900/70 border-b border-gray-700">
                    <th className="p-3">Roll #</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Manual Status</th>
                    <th className="p-3">Auto/Final</th>
                    <th className="p-3">Present</th>
                    <th className="p-3">Absent</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((row) => {
                    const currentStatus = draftStatuses[row.studentId] || 'auto';
                    const isPresent = currentStatus === 'present';
                    const isAbsent = currentStatus === 'absent';

                    return (
                      <tr key={row.studentId} className="border-b border-gray-800 hover:bg-gray-900/40">
                        <td className="p-3">{row.rollNumber || '-'}</td>
                        <td className="p-3">{row.name}</td>
                        <td className="p-3">{row.email}</td>
                        <td className="p-3 uppercase">{currentStatus}</td>
                        <td className="p-3 uppercase">{row.status}</td>
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={isPresent}
                            onChange={(e) => updateManualStatus(row.studentId, e.target.checked ? 'present' : 'auto')}
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={isAbsent}
                            onChange={(e) => updateManualStatus(row.studentId, e.target.checked ? 'absent' : 'auto')}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Attendence;