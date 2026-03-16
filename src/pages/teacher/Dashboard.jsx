import React from 'react';
import AppLayout from '../../components/layout/AppLayout';

const Dashboard = () => {
  return (
    <AppLayout>
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
           <h1 className="text-2xl font-bold text-gray-900 mb-4">Teacher Dashboard</h1>
           <p className="text-gray-600">Manage your classrooms and sessions here.</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
