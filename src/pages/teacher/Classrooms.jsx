import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../components/layout/AppLayout';
import { Plus, Book, Trash2, Loader2 } from 'lucide-react';

const Classrooms = () => {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [newClass, setNewClass] = useState({ name: '', subject_code: '', batch_filter: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchClassrooms();
  }, [user]);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .eq('teacher_id', user.id) // Only my classrooms
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClassrooms(data || []);
    } catch (error) {
      console.error('Error fetching classrooms:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('classrooms')
        .insert([
          {
            name: newClass.name,
            subject_code: newClass.subject_code,
            batch_filter: newClass.batch_filter || null,
            teacher_id: user.id
          }
        ])
        .select();

      if (error) throw error;
      
      setClassrooms([data[0], ...classrooms]);
      setShowModal(false);
      setNewClass({ name: '', subject_code: '', batch_filter: '' });
    } catch (error) {
      alert('Error creating classroom: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Classrooms</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Create Classroom
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
          </div>
        ) : classrooms.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
             <Book className="mx-auto h-12 w-12 text-gray-400" />
             <h3 className="mt-2 text-sm font-medium text-gray-900">No classrooms</h3>
             <p className="mt-1 text-sm text-gray-500">Get started by creating a new classroom.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {classrooms.map((classroom) => (
              <div key={classroom.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between">
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {classroom.subject_code}
                     </span>
                     {classroom.batch_filter && (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Batch {classroom.batch_filter}
                         </span>
                     )}
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900 truncate">{classroom.name}</h3>
                  <div className="mt-4 flex space-x-3">
                     <Link 
                        to={`/teacher/classrooms/${classroom.id}/session`}
                        className="flex-1 bg-indigo-50 text-indigo-700 px-4 py-2 rounded text-center text-sm font-medium hover:bg-indigo-100"
                     >
                        Attendance Session
                     </Link>
                     {/* Potentially add edit/delete here */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Create New Classroom</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Class Name</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    placeholder="e.g. Data Structures"
                    value={newClass.name}
                    onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject Code</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    placeholder="e.g. CS201"
                    value={newClass.subject_code}
                    onChange={(e) => setNewClass({...newClass, subject_code: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Batch Filter (Optional)</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    placeholder="e.g. A"
                    value={newClass.batch_filter}
                    onChange={(e) => setNewClass({...newClass, batch_filter: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">If set, only students from this batch can join.</p>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50 flex items-center"
                  >
                    {creating && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                    Create
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
