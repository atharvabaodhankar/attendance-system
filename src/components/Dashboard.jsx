import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (!error) setUserData(data);
    };
    getProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (!userData) return <p className="text-center mt-10">Loading user...</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Welcome, {userData.name} ({userData.role})</h1>
        <button
          className="bg-red-500 text-white px-4 py-2 rounded"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      {userData.role === 'student' ? (
        <p>Your student dashboard goes here.</p>
      ) : (
        <p>Teacher dashboard and controls go here.</p>
      )}
    </div>
  );
}
