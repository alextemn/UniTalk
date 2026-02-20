import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/sidebar.css';

const NAV_ITEMS = [
  { path: '/student/dashboard', label: 'Dashboard', icon: '' },
  { path: '/student/practice', label: 'Practice Interview', icon: '' },
  { path: '/student/feedback', label: 'Feedback History', icon: '' },
  { path: '/student/progress', label: 'Progress', icon: '' },
  { path: '/student/appointments', label: 'Book Appointment', icon: '' },
  { path: '/student/add-question', label: 'Add Question', icon: '' },
  { path: '/student/alumni', label: 'Alumni', icon: '' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">PitchPerfect</h1>
        <p className="sidebar-subtitle">Student Portal</p>
      </div>
      
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `sidebar-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.username || 'Alex'}</div>
            <div className="user-role">Student</div>
          </div>
        </div>
        <button className="switch-role-btn" onClick={handleLogout}>
          ← Log Out
        </button>
      </div>
    </aside>
  );
}
