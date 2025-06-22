import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AttendanceHistory({ userId, userRole }) {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1); // Current month (1-12)
  const [year, setYear] = useState(new Date().getFullYear());
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    if (userRole === 'teacher') {
      fetchStudents();
    }
  }, [userRole]);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [month, year, selectedStudent, userId, userRole]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'student');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error.message);
    }
  };

  const fetchAttendanceRecords = async () => {
    setLoading(true);
    try {
      // Calculate start and end dates for the selected month
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate(); // Get last day of month
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;

      let query = supabase
        .from('attendance')
        .select(`
          id,
          date,
          status,
          users!attendance_user_id_fkey(name),
          marked_by_user:users!attendance_marked_by_fkey(name)
        `)
        .gte('date', startDate)
        .lte('date', endDate);

      // Filter by user ID if student or if teacher has selected a specific student
      if (userRole === 'student') {
        query = query.eq('user_id', userId);
      } else if (selectedStudent) {
        query = query.eq('user_id', selectedStudent);
      }

      // Order by date
      query = query.order('date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setAttendanceRecords(data || []);
    } catch (error) {
      console.error('Error fetching attendance records:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (monthNum) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNum - 1];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Attendance History</h2>
      
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Month and Year Selection */}
        <div className="flex-1">
          <label className="block text-gray-700 mb-2">Month:</label>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="w-full p-2 border rounded"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{getMonthName(m)}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1">
          <label className="block text-gray-700 mb-2">Year:</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="w-full p-2 border rounded"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Student Selection (for teachers only) */}
        {userRole === 'teacher' && (
          <div className="flex-1">
            <label className="block text-gray-700 mb-2">Student:</label>
            <select
              value={selectedStudent || ''}
              onChange={(e) => setSelectedStudent(e.target.value || null)}
              className="w-full p-2 border rounded"
            >
              <option value="">All Students</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-center py-4">Loading attendance records...</p>
      ) : attendanceRecords.length === 0 ? (
        <p className="text-center py-4">No attendance records found for the selected period.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Date</th>
                {userRole === 'teacher' && !selectedStudent && (
                  <th className="py-2 px-4 border-b">Student</th>
                )}
                <th className="py-2 px-4 border-b">Status</th>
                <th className="py-2 px-4 border-b">Marked By</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.map((record) => (
                <tr key={record.id}>
                  <td className="py-2 px-4 border-b">{formatDate(record.date)}</td>
                  {userRole === 'teacher' && !selectedStudent && (
                    <td className="py-2 px-4 border-b">{record.users.name}</td>
                  )}
                  <td className="py-2 px-4 border-b">
                    <span className={`font-medium ${record.status === 'present' ? 'text-green-600' : 'text-red-600'}`}>
                      {record.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">{record.marked_by_user?.name || 'System'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}