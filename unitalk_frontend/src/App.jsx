import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AuthPage from './pages/AuthPage.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import FacultyDashboard from './pages/FacultyDashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardPage from './pages/student/DashboardPage.jsx';
import PracticeInterviewPage from './pages/student/PracticeInterviewPage.jsx';
import FeedbackHistoryPage from './pages/student/FeedbackHistoryPage.jsx';
import ProgressPage from './pages/student/ProgressPage.jsx';
import AppointmentsPage from './pages/student/AppointmentsPage.jsx';
import AddQuestionPage from './pages/student/AddQuestionPage.jsx';
import AlumniPage from './pages/student/AlumniPage.jsx';

function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner">Loading…</div>;
  if (user) {
    return <Navigate to={user.user_type === 'faculty' ? '/faculty' : '/student/dashboard'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <AuthGuard>
              <AuthPage />
            </AuthGuard>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="practice" element={<PracticeInterviewPage />} />
          <Route path="practice/:questionId" element={<PracticeInterviewPage />} />
          <Route path="feedback" element={<FeedbackHistoryPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="add-question" element={<AddQuestionPage />} />
          <Route path="alumni" element={<AlumniPage />} />
        </Route>
        <Route
          path="/faculty"
          element={
            <ProtectedRoute allowedRole="faculty">
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
