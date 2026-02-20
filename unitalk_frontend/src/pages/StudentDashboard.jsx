import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import '../styles/dashboard.css';
import '../styles/sidebar.css';

export default function StudentDashboard() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}
