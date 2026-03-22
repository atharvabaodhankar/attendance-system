import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';
import AppLayout from '../../components/layout/AppLayout';
import { BookOpen, Plus, Users, Loader2, CheckCircle, XCircle } from 'lucide-react';

const Classrooms = () => {
  const { user, profile } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchEnrolledClassrooms();
  }, [user]);

  const fetchEnrolledClassrooms = async () => {
    try {
      setLoading(true);
      // Get classrooms the student is enrolled in
      const { data, error } = await supabase
        .from('classroom_students')
        .select(`
          classroom_id,
          joined_at,
          classrooms (
            id,
            name,
            subject_code,
            batch_filter,
            join_code,
            teacher_id,
            profiles!classrooms_teacher_id_fkey (
              full_name
            )
          )
        `)
        .eq('student_id', user.id);

      if (error) throw error;
      
      // Extract classroom data
      const enrolledClassrooms = data.map(item => ({
        ...item.classrooms,
        joined_at: item.joined_at,
        teacher_name: item.classrooms.profiles?.full_name || 'Unknown'
      }));
      
      setClassrooms(enrolledClassrooms);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClassroom = async (e) => {
    e.preventDefault();
    setJoining(true);
    setMessage(null);

    try {
      // Find classroom by join code
      const { data: classroom, error: classroomError } = await supabase
        .from('classrooms')
        .select('*')
        .eq('join_code', joinCode.toUpperCase())
        .single();

      if (classroomError || !classroom) {
        throw new Error('Invalid join code');
      }

      // Check batch filter
      if (classroom.batch_filter && classroom.batch_filter !== profile.batch) {
        throw new Error(`This classroom is only for Batch ${classroom.batch_filter}`);
      }

      // Check if already enrolled
      const { data: existing } = await supabase
        .from('classroom_students')
        .select('*')
        .eq('classroom_id', classroom.id)
        .eq('student_id', user.id)
        .single();

      if (existing) {
        throw new Error('You are already enrolled in this classroom');
      }

      // Enroll student
      const { error: enrollError } = await supabase
        .from('classroom_students')
        .insert([{
          classroom_id: classroom.id,
          student_id: user.id
        }]);

      if (enrollError) throw enrollError;

      setMessage({ type: 'success', text: 'Successfully joined classroom!' });
      setJoinCode('');
      setShowJoinModal(false);
      
      // Refresh classrooms list
      fetchEnrolledClassrooms();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setJoining(false);
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
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Classrooms</h1>
            <p className="text-gray-600 mt-1">View and join your enrolled classrooms</p>
          </div>
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Join Classroom
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-3 rounded-lg flex items-center ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 mr-2" />
            )}
            {message.text}
          </div>
        )}

        {/* Classrooms Grid */}
        {classrooms.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No classrooms</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by joining a classroom using the join code.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowJoinModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Join Classroom
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map((classroom) => (
              <div key={classroom.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white">{classroom.name}</h3>
                  <p className="text-indigo-100 text-sm">{classroom.subject_code}</p>
                </div>
                <div className="px-6 py-4 space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Teacher: {classroom.teacher_name}</span>
                  </div>
                  {classroom.batch_filter && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Batch:</span> {classroom.batch_filter}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Joined: {new Date(classroom.joined_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Join Classroom Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Join Classroom</h2>
              
              <form onSubmit={handleJoinClassroom} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Classroom Join Code
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-character code"
                    maxLength={6}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ask your teacher for the classroom join code
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinModal(false);
                      setJoinCode('');
                      setMessage(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={joining || joinCode.length !== 6}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                  >
                    {joining ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Joining...
                      </>
                    ) : (
                      'Join Classroom'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Classrooms;
