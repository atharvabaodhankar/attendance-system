import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AttendanceForm({ userId, userName, userRole }) {
  const [students, setStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState({});

  // Fetch students (only if current user is a teacher)
  useEffect(() => {
    if (userRole === 'teacher') {
      fetchStudents();
    }
  }, [userRole]);

  // Fetch attendance records for the selected date
  useEffect(() => {
    if (userRole === 'teacher' && students.length > 0) {
      fetchAttendanceForDate();
    } else if (userRole === 'student') {
      fetchStudentAttendance();
    }
  }, [selectedDate, students, userRole]);

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

  const fetchAttendanceForDate = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', selectedDate);

      if (error) throw error;

      // Convert array to object with user_id as keys for easier access
      const records = {};
      data.forEach(record => {
        records[record.user_id] = record;
      });

      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching attendance:', error.message);
    }
  };

  const fetchStudentAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('date', selectedDate)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is fine
        throw error;
      }

      const records = {};
      if (data) {
        records[userId] = data;
      }
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching student attendance:', error.message);
    }
  };

  const markAttendance = async (studentId, status) => {
    setLoading(true);
    setMessage('');

    try {
      const existingRecord = attendanceRecords[studentId];

      if (existingRecord) {
        // Update existing record
        const { error } = await supabase
          .from('attendance')
          .update({ 
            status, 
            marked_by: userId 
          })
          .eq('id', existingRecord.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('attendance')
          .insert({
            user_id: studentId,
            date: selectedDate,
            status,
            marked_by: userId
          });

        if (error) throw error;
      }

      setMessage(`Attendance marked as ${status} successfully!`);
      // Refresh attendance records
      if (userRole === 'teacher') {
        fetchAttendanceForDate();
      } else {
        fetchStudentAttendance();
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // For students to mark their own attendance
  const markSelfAttendance = () => {
    markAttendance(userId, 'present');
  };

  // Render different views based on user role
  if (userRole === 'student') {
    const attendanceRecord = attendanceRecords[userId];
    const attendanceStatus = attendanceRecord ? attendanceRecord.status : null;

    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Mark Your Attendance</h2>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <p className="mb-2">Current Status: 
            <span className={`font-bold ${attendanceStatus === 'present' ? 'text-green-600' : attendanceStatus === 'absent' ? 'text-red-600' : 'text-gray-600'}`}>
              {attendanceStatus ? attendanceStatus.toUpperCase() : 'Not Marked'}
            </span>
          </p>
        </div>

        {!attendanceStatus && (
          <button
            onClick={markSelfAttendance}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Processing...' : 'Mark Present'}
          </button>
        )}

        {message && (
          <p className="mt-4 text-center text-green-600">{message}</p>
        )}
      </div>
    );
  }

  // Teacher view
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Attendance Management</h2>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Select Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      {message && (
        <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
          {message}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Student Name</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const attendanceRecord = attendanceRecords[student.id];
              const status = attendanceRecord ? attendanceRecord.status : null;
              
              return (
                <tr key={student.id}>
                  <td className="py-2 px-4 border-b">{student.name}</td>
                  <td className="py-2 px-4 border-b">
                    <span className={`font-medium ${status === 'present' ? 'text-green-600' : status === 'absent' ? 'text-red-600' : 'text-gray-500'}`}>
                      {status ? status.toUpperCase() : 'Not Marked'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => markAttendance(student.id, 'present')}
                        disabled={loading}
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:bg-green-300"
                      >
                        Present
                      </button>
                      <button
                        onClick={() => markAttendance(student.id, 'absent')}
                        disabled={loading}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:bg-red-300"
                      >
                        Absent
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}