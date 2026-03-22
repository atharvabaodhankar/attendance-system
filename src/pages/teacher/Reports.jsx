import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';
import AppLayout from '../../components/layout/AppLayout';
import { BarChart, FileText, Download, Loader2, Users, CheckCircle, AlertTriangle } from 'lucide-react';

const TeacherReports = () => {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    fetchClassrooms();
  }, [user]);

  const fetchClassrooms = async () => {
    try {
      const { data, error } = await supabase
        .from('classrooms')
        .select('id, name, subject_code')
        .eq('teacher_id', user.id);

      if (error) throw error;
      setClassrooms(data || []);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async (classroomId) => {
    if (!classroomId) return;
    try {
      setReportLoading(true);
      
      // Get all sessions for this classroom
      const { data: sessions, error: sessionsError } = await supabase
        .from('attendance_sessions')
        .select(`
          id,
          start_time,
          attendance_records (
            id,
            status,
            student_id
          )
        `)
        .eq('classroom_id', classroomId)
        .order('start_time', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Get all enrolled students
      const { data: students, error: studentsError } = await supabase
        .from('classroom_students')
        .select(`
          student_id,
          profiles!classroom_students_student_id_fkey (
            id,
            full_name,
            prn,
            roll_no
          )
        `)
        .eq('classroom_id', classroomId);

      if (studentsError) throw studentsError;

      // Process data for student-wise summary
      const summary = students.map(s => {
        const studentInfo = s.profiles;
        const studentRecords = sessions.flatMap(sess => 
          sess.attendance_records.filter(r => r.student_id === studentInfo.id)
        );

        const presentCount = studentRecords.filter(r => r.status === 'present' || r.status === 'late').length;
        const totalSessions = sessions.length;
        const percentage = totalSessions > 0 ? (presentCount / totalSessions * 100).toFixed(1) : 0;

        return {
          ...studentInfo,
          presentCount,
          totalSessions,
          percentage
        };
      });

      setReportData({
        sessionsCount: sessions.length,
        studentsCount: students.length,
        summary: summary.sort((a, b) => (a.roll_no || '').localeCompare(b.roll_no || '', undefined, {numeric: true}))
      });
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setReportLoading(false);
    }
  };

  const handleClassroomChange = (e) => {
    const id = e.target.value;
    setSelectedClassroom(id);
    if (id) {
      fetchReport(id);
    } else {
      setReportData(null);
    }
  };

  // Mock CSV export
  const exportCSV = () => {
    if (!reportData) return;
    const header = "Roll No,Name,PRN,Present,Total,Percentage%\n";
    const rows = reportData.summary.map(s => 
      `${s.roll_no},${s.full_name},${s.prn},${s.presentCount},${s.totalSessions},${s.percentage}`
    ).join("\n");
    
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${selectedClassroom}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
            <p className="text-gray-600 mt-1">Generate and export class-wise attendance summary</p>
          </div>
          {reportData && (
            <button
              onClick={exportCSV}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm"
            >
              <Download className="h-5 w-5 mr-2" />
              Export CSV
            </button>
          )}
        </div>

        {/* Selection */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Classroom</label>
          <select
            value={selectedClassroom}
            onChange={handleClassroomChange}
            className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Choose a Classroom --</option>
            {classrooms.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.subject_code})
              </option>
            ))}
          </select>
        </div>

        {/* Report Content */}
        {reportLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-indigo-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.sessionsCount}</p>
                  </div>
                  <FileText className="h-10 w-10 text-indigo-100" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Enrolled Students</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.studentsCount}</p>
                  </div>
                  <Users className="h-10 w-10 text-blue-100" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg. Attendance</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(reportData.summary.reduce((acc, s) => acc + parseFloat(s.percentage), 0) / (reportData.summary.length || 1)).toFixed(1)}%
                    </p>
                  </div>
                  <BarChart className="h-10 w-10 text-green-100" />
                </div>
              </div>
            </div>

            {/* Summary Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Student-wise Attendance</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present / Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.summary.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.roll_no}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{s.full_name}</div>
                          <div className="text-xs text-gray-500">{s.prn}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {s.presentCount} / {s.totalSessions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2 w-24">
                            <div 
                              className={`h-2 rounded-full ${parseFloat(s.percentage) < 75 ? 'bg-red-500' : 'bg-green-500'}`}
                              style={{ width: `${s.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold">{s.percentage}%</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {parseFloat(s.percentage) < 75 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <AlertTriangle className="h-3 w-3 mr-1" /> Shortage
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" /> Eligible
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-lg shadow-sm">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No report generated</h3>
            <p className="mt-1 text-sm text-gray-500">Select a classroom to view attendance summary.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default TeacherReports;
