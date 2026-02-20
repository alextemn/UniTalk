import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios.js';
import '../styles/auth.css';

function flattenErrors(errors) {
  if (typeof errors === 'string') return errors;
  if (Array.isArray(errors)) return errors.join(' ');
  if (typeof errors === 'object') {
    return Object.entries(errors)
      .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(' ') : val}`)
      .join(' | ');
  }
  return 'An error occurred.';
}

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    user_type: 'student',
  });
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const { data } = await api.post('/token/', loginForm);
      const userData = login(data.access, data.refresh);
      if (userData) {
        navigate(userData.user_type === 'faculty' ? '/faculty' : '/student', { replace: true });
      }
    } catch (err) {
      const detail = err.response?.data?.detail || flattenErrors(err.response?.data) || 'Login failed.';
      setLoginError(detail);
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');
    setRegisterLoading(true);
    try {
      await api.post('/register/', registerForm);
      setRegisterSuccess('Account created! You can now log in.');
      setTab('login');
      setLoginForm((prev) => ({ ...prev, username: registerForm.username }));
    } catch (err) {
      const detail = flattenErrors(err.response?.data) || 'Registration failed.';
      setRegisterError(detail);
    } finally {
      setRegisterLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>UniTalk</h1>
        <p className="subtitle">AI-powered academic platform</p>

        <div className="auth-tabs">
          <button className={tab === 'login' ? 'active' : ''} onClick={() => setTab('login')}>
            Login
          </button>
          <button className={tab === 'register' ? 'active' : ''} onClick={() => setTab('register')}>
            Register
          </button>
        </div>

        {tab === 'login' && (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
            </div>
            {loginError && <p className="error-message">{loginError}</p>}
            {registerSuccess && <p className="auth-success">{registerSuccess}</p>}
            <button type="submit" className="btn-primary" disabled={loginLoading}>
              {loginLoading ? 'Logging in…' : 'Log In'}
            </button>
          </form>
        )}

        {tab === 'register' && (
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={registerForm.username}
                onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select
                value={registerForm.user_type}
                onChange={(e) => setRegisterForm({ ...registerForm, user_type: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>
            {registerError && <p className="error-message">{registerError}</p>}
            <button type="submit" className="btn-primary" disabled={registerLoading}>
              {registerLoading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
