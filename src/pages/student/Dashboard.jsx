import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';
import AppLayout from '../../components/layout/AppLayout';
import { Calendar, CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, present: 0, flagged: 0 });
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if profile is complete
  useEffect(() => {
    if (profile && (!profile.prn || !profile.branch || !profile.year || !profile.batch || !profile.roll_no)) {
      navigate('/student/complete-profile');
    }
  }, [profile, navigate]);

  useEffect(() => {
    fetchAttendanceData();
  }, [user]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Fetch all attendance records for this student
      const { data: records, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          attendance_sessions (
            id,
            start_time,
            classrooms (
              name,
              subject_code
            )
          )
        `)
        .eq('student_id', user.id)
        .order('marked_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Calculate stats
      const total = records?.length || 0;
      const present = records?.filter(r => r.status === 'present').length || 0;
      const flagged = records?.filter(r => r.status === 'flagged').length || 0;

      setStats({ total, present, flagged });
      setRecentRecords(records || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'present': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'flagged': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'absent': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      present: 'bg-green-100 text-green-800',
      flagged: 'bg-yellow-100 text-yellow-800',
      absent: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
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

  const attendancePercentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-gray-600 mt-1">Track your attendance across all subjects</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Sessions</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Present</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{stats.present}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="relative pt-1 w-full">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block text-indigo-600">
                          Attendance %
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-semibold inline-block text-indigo-600">
                          {attendancePercentage}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-indigo-200">
                      <div style={{ width: `${attendancePercentage}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Attendance</h3>
            {recentRecords.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No attendance records yet. Scan a QR code to mark your first attendance!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentRecords.map((record) => (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {record.attendance_sessions?.classrooms?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {record.attendance_sessions?.classrooms?.subject_code || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(record.marked_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(record.status)}
                            <span className="ml-2">{getStatusBadge(record.status)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.risk_score?.toFixed(2) || '0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
