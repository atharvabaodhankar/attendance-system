import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';
import AppLayout from '../../components/layout/AppLayout';
import { BookOpen, Users, Clock, Plus, Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch classrooms
      const { data: classroomData, error: classError } = await supabase
        .from('classrooms')
        .select('*')
        .eq('teacher_id', user.id);

      if (classError) throw classError;
      setClassrooms(classroomData || []);

      // Fetch active sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from('attendance_sessions')
        .select(`
          *,
          classrooms (
            name,
            subject_code
          )
        `)
        .eq('teacher_id', user.id)
        .is('end_time', null);

      if (sessionError) throw sessionError;
      setActiveSessions(sessionData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your classrooms and attendance sessions</p>
          </div>
          <Link
            to="/teacher/classrooms"
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            New Classroom
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpen className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Classrooms</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{classrooms.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Sessions</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{activeSessions.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Quick Actions</dt>
                    <dd className="mt-1">
                      <Link to="/teacher/classrooms" className="text-sm text-indigo-600 hover:text-indigo-800">
                        View All →
                      </Link>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Active Sessions</h3>
              <div className="space-y-3">
                {activeSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="font-medium text-gray-900">{session.classrooms?.name}</p>
                      <p className="text-sm text-gray-500">{session.classrooms?.subject_code}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Started: {new Date(session.start_time).toLocaleTimeString()}
                      </p>
                    </div>
                    <Link
                      to={`/teacher/classrooms/${session.classroom_id}/session`}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                    >
                      View Session
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Classrooms */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">My Classrooms</h3>
            {classrooms.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No classrooms</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new classroom.</p>
                <div className="mt-6">
                  <Link
                    to="/teacher/classrooms"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    New Classroom
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {classrooms.slice(0, 6).map((classroom) => (
                  <Link
                    key={classroom.id}
                    to={`/teacher/classrooms/${classroom.id}/session`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {classroom.subject_code}
                      </span>
                      {classroom.batch_filter && (
                        <span className="text-xs text-gray-500">Batch {classroom.batch_filter}</span>
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900 truncate">{classroom.name}</h4>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
