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
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (!error) setUserData(data);
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
