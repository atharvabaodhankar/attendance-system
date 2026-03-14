import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold text-red-600 mb-4">403 - Unauthorized</h1>
      <p className="text-gray-600 mb-8">You do not have permission to view this page.</p>
      <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
        Go back to Login
      </Link>
    </div>
  );
};

export default Unauthorized;
