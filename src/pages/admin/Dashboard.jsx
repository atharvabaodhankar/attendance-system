import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import AppLayout from '../../components/layout/AppLayout';
import { UserCheck, UserX, Loader2, CheckCircle, XCircle } from 'lucide-react';

const Dashboard = () => {
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchPendingTeachers();
  }, []);

  const fetchPendingTeachers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingTeachers(data || []);
    } catch (error) {
      console.error('Error fetching pending teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (teacherId, approve) => {
    setProcessing(teacherId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: approve })
        .eq('id', teacherId);

      if (error) throw error;

      // Remove from pending list
      setPendingTeachers(prev => prev.filter(t => t.id !== teacherId));
      
      // Log the action
      await supabase.from('audit_logs').insert([{
        action: approve ? 'TEACHER_APPROVED' : 'TEACHER_REJECTED',
        target_table: 'profiles',
        target_id: teacherId,
        details: { approved: approve }
      }]);

    } catch (error) {
      console.error('Error updating teacher approval:', error);
      alert('Failed to update approval status');
    } finally {
      setProcessing(null);
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage teacher approvals and system settings</p>
        </div>

        {/* Stats Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCheck className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Approvals</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{pendingTeachers.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Teachers */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Teacher Approvals</h3>
            
            {pendingTeachers.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
                <p className="mt-1 text-sm text-gray-500">All teacher accounts have been reviewed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingTeachers.map((teacher) => (
                      <tr key={teacher.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{teacher.full_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{teacher.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(teacher.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproval(teacher.id, true)}
                              disabled={processing === teacher.id}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50"
                            >
                              {processing === teacher.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleApproval(teacher.id, false)}
                              disabled={processing === teacher.id}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50"
                            >
                              {processing === teacher.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Teacher Approval Process</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Teachers must be approved before they can create classrooms and manage attendance sessions. Review each request carefully before approving.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
