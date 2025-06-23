import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import AttendanceForm from './AttendanceForm';
import AttendanceHistory from './AttendanceHistory';

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('attendance');
  const navigate = useNavigate();

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('User from getUser:', user);
      console.log('Error from getUser:', userError);
      if (userError || !user) {
        console.error('Error fetching user:', userError);
        navigate('/'); // Redirect to login if user is not found or session is invalid
        return;
      }
      console.log('User ID for fetching:', user.id);
      const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single();
      console.log('Data from users table:', data);
      console.log('Error from users table:', error);
      if (error && error.code === 'PGRST116') { // PGRST116 means 0 rows returned
        console.warn('User profile not found, creating one...');
        const { error: insertError } = await supabase.from('users').insert({
          id: user.id,
          name: user.email, // Default name, user can update later
          role: 'student', // Default role, user can update later
        });
        if (insertError) {
          console.error('Error creating user profile:', insertError);
          navigate('/'); // Redirect to login if profile creation fails
          return;
        }
        const { data: newUserData } = await supabase.from('users').select('*').eq('id', user.id).single();
        setUserData(newUserData);
      } else if (error) {
        console.error('Error fetching user profile:', error);
        navigate('/'); // Redirect to login for other errors
        return;
      } else {
        setUserData(data);
      }
    };
    getProfile();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/');
      }
    });
  }, []);
  

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (!userData) return <p className="text-center mt-10">Loading user...</p>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome, {userData.name} ({userData.role})</h1>
        <button
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 ${activeTab === 'attendance' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('attendance')}
        >
          {userData.role === 'student' ? 'Mark Attendance' : 'Manage Attendance'}
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'history' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('history')}
        >
          Attendance History
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'attendance' && (
        <AttendanceForm 
          userId={userData.id} 
          userName={userData.name} 
          userRole={userData.role} 
        />
      )}

      {activeTab === 'history' && (
        <AttendanceHistory 
          userId={userData.id} 
          userRole={userData.role} 
        />
      )}
    </div>
  );
}
