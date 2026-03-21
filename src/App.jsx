import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import TeacherDashboard from './pages/teacher/Dashboard';
import Classrooms from './pages/teacher/Classrooms';
import SessionManager from './pages/teacher/SessionManager';
import StudentDashboard from './pages/student/Dashboard';
import ScanAttendance from './pages/student/ScanAttendance';
import CompleteProfile from './pages/student/CompleteProfile';
import StudentProfile from './pages/student/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Unauthorized from './pages/auth/Unauthorized';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Routes */}
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <Routes>
                 <Route path="/" element={<TeacherDashboard />} />
                 <Route path="/classrooms" element={<Classrooms />} />
                 <Route path="/classrooms/:classroomId/session" element={<SessionManager />} />
              </Routes>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Routes>
                 <Route path="/" element={<StudentDashboard />} />
                 <Route path="/scan" element={<ScanAttendance />} />
                 <Route path="/complete-profile" element={<CompleteProfile />} />
                 <Route path="/profile" element={<StudentProfile />} />
              </Routes>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
