import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import AppLayout from '../../components/layout/AppLayout';
import { Users, Loader2, ArrowLeft, Trash2 } from 'lucide-react';

const ClassroomStudents = () => {
  const { classroomId } = useParams();
  const [classroom, setClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassroomAndStudents();
  }, [classroomId]);

  const fetchClassroomAndStudents = async () => {
    try {
      setLoading(true);
      
      // Fetch classroom details
      const { data: classroomData, error: classroomError } = await supabase
        .from('classrooms')
        .select('*')
        .eq('id', classroomId)
        .single();

      if (classroomError) throw classroomError;
      setClassroom(classroomData);

      // Fetch enrolled students
      const { data: studentsData, error: studentsError } = await supabase
        .from('classroom_students')
        .select(`
          student_id,
          joined_at,
          profiles!classroom_students_student_id_fkey (
            id,
            full_name,
            email,
            prn,
            batch,
            roll_no
          )
        `)
        .eq('classroom_id', classroomId);

      if (studentsError) throw studentsError;
      
      const enrolledStudents = studentsData.map(item => ({
        ...item.profiles,
        joined_at: item.joined_at
      }));
      
      setStudents(enrolledStudents);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!confirm('Are you sure you want to remove this student from the classroom?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('classroom_students')
        .delete()
        .eq('classroom_id', classroomId)
        .eq('student_id', studentId);

      if (error) throw error;

      // Refresh students list
      setStudents(students.filter(s => s.id !== studentId));
    } catch (error) {
      alert('Error removing student: ' + error.message);
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
        <div>
          <Link
            to="/teacher/classrooms"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Classrooms
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{classroom?.name}</h1>
          <p className="text-gray-600 mt-1">
            {classroom?.subject_code} {classroom?.batch_filter && `• Batch ${classroom.batch_filter}`}
          </p>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Enrolled Students</p>
              <p className="text-3xl font-bold text-gray-900">{students.length}</p>
            </div>
            <Users className="h-12 w-12 text-indigo-600" />
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Enrolled Students</h2>
          </div>
          
          {students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No students enrolled</h3>
              <p className="mt-1 text-sm text-gray-500">
                Students will appear here once they join using the classroom code.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PRN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roll No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.prn || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.batch || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.roll_no || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(student.joined_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleRemoveStudent(student.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ClassroomStudents;
