import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/axios.js';
import '../../styles/dashboard.css';

function scoreColor(s) {
  if (s >= 80) return '#15803D';
  if (s >= 60) return '#1D4ED8';
  if (s >= 40) return '#92400E';
  return '#991B1B';
}

function diffStyle(d) {
  if (d === 'Easy') return { background: '#DCFCE7', color: '#166534' };
  if (d === 'Hard') return { background: '#FEE2E2', color: '#991B1B' };
  return { background: '#FEF9C3', color: '#854D0E' };
}

export default function DashboardPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/answers/')
      .then(({ data }) => setAnswers(data))
      .catch(() => setAnswers([]))
      .finally(() => setLoading(false));
  }, []);

  const scored     = answers.filter((a) => a.score != null);
  const avgScore   = scored.length
    ? Math.round(scored.reduce((s, a) => s + a.score, 0) / scored.length)
    : null;
  const bestScore  = scored.length ? Math.max(...scored.map((a) => a.score)) : null;
  const recent     = answers.slice(0, 5);

  return (
    <div className="db-page">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="db-header">
        <h1>Welcome back, {user?.username}</h1>
        <p className="db-subtitle">Here's how your interview prep is going</p>
      </div>

      {/* ── Stats row ───────────────────────────────────────────── */}
      <div className="db-stats">
        <div className="db-stat-card" style={{ '--db-accent': '#6366F1' }}>
          <span className="db-stat-num">{answers.length}</span>
          <span className="db-stat-lbl">Sessions completed</span>
        </div>
        <div className="db-stat-card" style={{ '--db-accent': '#10B981' }}>
          <span className="db-stat-num">{avgScore ?? '—'}</span>
          <span className="db-stat-lbl">Average score</span>
        </div>
        <div className="db-stat-card" style={{ '--db-accent': '#F59E0B' }}>
          <span className="db-stat-num">{bestScore ?? '—'}</span>
          <span className="db-stat-lbl">Best score</span>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="db-body">

        {/* Recent sessions */}
        <div className="db-card">
          <div className="db-card-hd">
            <h2>Recent Sessions</h2>
            {answers.length > 0 && (
              <button className="db-link-btn" onClick={() => navigate('/student/feedback')}>
                View all →
              </button>
            )}
          </div>

          {loading ? (
            <p className="db-empty">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="db-empty">No sessions yet — start practicing to see your history here.</p>
          ) : (
            <div className="db-session-list">
              {recent.map((a) => {
                const q = a.question ?? {};
                const text = q.question ?? '—';
                return (
                  <div key={a.id} className="db-session-row">
                    <div className="db-session-info">
                      <p className="db-session-q">
                        {text.length > 85 ? text.slice(0, 85) + '…' : text}
                      </p>
                      <div className="db-session-meta">
                        {q.category    && <span className="db-chip db-chip-cat">{q.category}</span>}
                        {q.subcategory && <span className="db-chip db-chip-sub">{q.subcategory}</span>}
                        {q.difficulty  && <span className="db-chip" style={diffStyle(q.difficulty)}>{q.difficulty}</span>}
                        <span className="db-session-date">
                          {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    {a.score != null && (
                      <span className="db-session-score" style={{ color: scoreColor(a.score) }}>
                        {a.score}<span className="db-score-denom">/100</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="db-right">

          {/* CTA */}
          <div className="db-cta">
            <p className="db-cta-eyebrow">Ready to practice?</p>
            <h2 className="db-cta-title">Start a new session</h2>
            <p className="db-cta-body">
              Pick a question and get instant AI feedback on your answer.
            </p>
            <button className="db-cta-btn" onClick={() => navigate('/student/practice')}>
              Start practicing →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
