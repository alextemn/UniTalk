import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <nav className="navbar">
      <span className="navbar-brand">UniTalk</span>
      <div className="navbar-info">
        <span className="username">{user?.username}</span>
        <span className="role-badge">{user?.user_type}</span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
