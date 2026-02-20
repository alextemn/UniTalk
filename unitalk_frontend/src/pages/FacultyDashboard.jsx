import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import api from '../api/axios.js';
import '../styles/faculty.css';
import '../styles/components.css';

function parseList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value
    .split('\n')
    .map((s) => s.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
}

// ── Colour palette for chart bars ───────────────────────────────
const SUBCAT_COLORS = {
  Behavioral: '#6366F1',
  Financial:  '#10B981',
  Case:       '#F59E0B',
};
const CAT_COLORS = {
  'Investment Banking': '#3B82F6',
  Consulting:           '#EC4899',
};
const DIFF_COLORS = {
  Easy:   '#22C55E',
  Medium: '#F59E0B',
  Hard:   '#EF4444',
};

function ChartBar({ label, score, count, color }) {
  return (
    <div className="fac-bar-row">
      <span className="fac-bar-label">{label}</span>
      <div className="fac-bar-track">
        <div
          className="fac-bar-fill"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="fac-bar-score">{score}</span>
      <span className="fac-bar-count">({count})</span>
    </div>
  );
}

function ChartSection({ title, items, keyName, colorMap }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="fac-chart-section">
      <p className="fac-chart-section-title">{title}</p>
      {items.map((item) => (
        <ChartBar
          key={item[keyName]}
          label={item[keyName]}
          score={item.average_score}
          count={item.count}
          color={colorMap[item[keyName]] || '#94A3B8'}
        />
      ))}
    </div>
  );
}

function buildStudentStats(answers) {
  const subcatMap = {};
  const catMap = {};
  const diffMap = {};

  answers.forEach(({ score, question }) => {
    if (score == null || !question) return;
    const { subcategory, category, difficulty } = question;

    if (!subcatMap[subcategory]) subcatMap[subcategory] = { scores: [], count: 0 };
    subcatMap[subcategory].scores.push(score);
    subcatMap[subcategory].count++;

    if (!catMap[category]) catMap[category] = { scores: [], count: 0 };
    catMap[category].scores.push(score);
    catMap[category].count++;

    if (!diffMap[difficulty]) diffMap[difficulty] = { scores: [], count: 0 };
    diffMap[difficulty].scores.push(score);
    diffMap[difficulty].count++;
  });

  function build(map, key) {
    return Object.entries(map).map(([k, v]) => ({
      [key]: k,
      average_score: Math.round((v.scores.reduce((a, b) => a + b, 0) / v.scores.length) * 10) / 10,
      count: v.count,
    }));
  }

  return {
    by_subcategory: build(subcatMap, 'subcategory'),
    by_category:    build(catMap, 'category'),
    by_difficulty:  build(diffMap, 'difficulty'),
  };
}

const DIFF_BADGE_COLOR = {
  Easy:   { bg: '#DCFCE7', color: '#166534' },
  Medium: { bg: '#FEF9C3', color: '#854D0E' },
  Hard:   { bg: '#FEE2E2', color: '#991B1B' },
};

function AnswerCard({ ans }) {
  const q = ans.question ?? {};
  const diff = DIFF_BADGE_COLOR[q.difficulty] ?? { bg: '#F1F5F9', color: '#475569' };
  return (
    <div className="fac-answer-card">
      <div className="fac-answer-header">
        <div className="fac-answer-badges">
          {q.category    && <span className="fac-badge fac-badge-cat">{q.category}</span>}
          {q.subcategory && <span className="fac-badge fac-badge-subcat">{q.subcategory}</span>}
          {q.difficulty  && (
            <span className="fac-badge" style={{ background: diff.bg, color: diff.color }}>
              {q.difficulty}
            </span>
          )}
        </div>
        <div className="fac-answer-header-right">
          <span className="fac-answer-date">
            {new Date(ans.created_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </span>
          {ans.score != null && (
            <span className="fac-answer-score-badge">{ans.score}<span>/100</span></span>
          )}
        </div>
      </div>

      <p className="fac-answer-question">{q.question}</p>
      <p className="fac-answer-text">{ans.answer}</p>

      {(ans.strengths || ans.weaknesses) && (
        <div className="fac-answer-feedback">
          {ans.strengths && (
            <div className="fac-feedback-col fac-feedback-strengths">
              <p className="fac-feedback-label">Strengths</p>
              <ul className="fac-feedback-list">
                {parseList(ans.strengths).map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {ans.weaknesses && (
            <div className="fac-feedback-col fac-feedback-weaknesses">
              <p className="fac-feedback-label">Weaknesses</p>
              <ul className="fac-feedback-list">
                {parseList(ans.weaknesses).map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StudentCVView() {
  return (
    <div style={{ marginTop: '1rem' }}>
      <div className="cv-uploaded-card">
        <div className="cv-uploaded-info">
          <span className="cv-file-icon">PDF</span>
          <div>
            <p className="cv-uploaded-name">Temnorod Resume.pdf</p>
          </div>
        </div>
        <div className="cv-uploaded-actions">
          <a className="btn-primary" href="/resume.pdf" target="_blank" rel="noreferrer">
            View PDF
          </a>
        </div>
      </div>
    </div>
  );
}

function StudentDetailView({ appt, onBack, onStatusUpdate, updating }) {
  const [answers, setAnswers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filterCat, setFilterCat] = useState('All');
  const [filterSub, setFilterSub] = useState('All');
  const [activeTab, setActiveTab] = useState('performance');

  useEffect(() => {
    api.get(`/faculty/student/${appt.student.id}/answers/`)
      .then(({ data }) => setAnswers(data))
      .catch(() => setAnswers([]))
      .finally(() => setLoading(false));
  }, [appt.student.id]);

  // Derive filter options from fetched data
  const allCats = ['All', ...new Set(answers.map((a) => a.question?.category).filter(Boolean))];
  const allSubs = ['All', ...new Set(
    answers
      .filter((a) => filterCat === 'All' || a.question?.category === filterCat)
      .map((a) => a.question?.subcategory)
      .filter(Boolean)
  )];

  const filtered = answers.filter((a) => {
    if (filterCat !== 'All' && a.question?.category    !== filterCat) return false;
    if (filterSub !== 'All' && a.question?.subcategory !== filterSub) return false;
    return true;
  });

  const stats   = buildStudentStats(filtered);
  const hasData = filtered.some((a) => a.score != null);

  const statusCls =
    appt.status === 'confirmed' ? 'fac-status confirmed'
    : appt.status === 'cancelled' ? 'fac-status cancelled'
    : 'fac-status pending';

  function handleCatChange(cat) {
    setFilterCat(cat);
    setFilterSub('All'); // reset subcategory when category changes
  }

  return (
    <div>
      <button className="fac-back-btn" onClick={onBack}>← Back to Appointments</button>

      <div className="fac-detail-header">
        <div>
          <h2 className="fac-detail-student">{appt.student?.username}</h2>
          <span className="fac-appt-time">
            {new Date(appt.scheduled_at).toLocaleString('en-US', {
              weekday: 'long', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
        </div>
        <span className={statusCls}>{appt.status}</span>
      </div>

      {appt.notes && <p className="fac-detail-notes">{appt.notes}</p>}

      {appt.status === 'pending' && (
        <div className="fac-appt-actions fac-detail-actions">
          <button className="fac-btn-accept" disabled={updating}
            onClick={() => onStatusUpdate(appt.id, 'confirmed')}>
            {updating ? '…' : 'Accept'}
          </button>
          <button className="fac-btn-decline" disabled={updating}
            onClick={() => onStatusUpdate(appt.id, 'cancelled')}>
            {updating ? '…' : 'Decline'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="fac-tabs">
        <button
          className={`fac-tab ${activeTab === 'performance' ? 'fac-tab-active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
        <button
          className={`fac-tab ${activeTab === 'cv' ? 'fac-tab-active' : ''}`}
          onClick={() => setActiveTab('cv')}
        >
          CV
        </button>
      </div>

      {activeTab === 'cv' && <StudentCVView studentId={appt.student.id} />}

      {/* Filters */}
      {activeTab === 'performance' && !loading && answers.length > 0 && (
        <div className="fac-filters">
          <select className="fac-filter-select" value={filterCat} onChange={(e) => handleCatChange(e.target.value)}>
            {allCats.map((c) => <option key={c} value={c}>{c === 'All' ? 'All categories' : c}</option>)}
          </select>
          <select className="fac-filter-select" value={filterSub} onChange={(e) => setFilterSub(e.target.value)}>
            {allSubs.map((s) => <option key={s} value={s}>{s === 'All' ? 'All subcategories' : s}</option>)}
          </select>
          <span className="fac-filter-count">
            {filtered.length} answer{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Score chart */}
      {activeTab === 'performance' && (
        <div className="fac-card" style={{ marginBottom: '1.5rem' }}>
          <div className="fac-card-header">
            <h2>Scores by Question Type</h2>
            <p className="fac-card-sub">Average across {appt.student?.username}'s submissions</p>
          </div>

          {loading ? (
            <p className="fac-empty">Loading…</p>
          ) : !hasData ? (
            <p className="fac-empty">No scored answers yet.</p>
          ) : (
            <>
              <ChartSection title="By subcategory" items={stats.by_subcategory} keyName="subcategory" colorMap={SUBCAT_COLORS} />
              <ChartSection title="By category"    items={stats.by_category}    keyName="category"    colorMap={CAT_COLORS} />
              <ChartSection title="By difficulty"  items={stats.by_difficulty}  keyName="difficulty"  colorMap={DIFF_COLORS} />
              <p className="fac-chart-note">
                Score out of 100 — Content Accuracy (30) + Depth (25) + Structure (25) + Communication (20)
              </p>
            </>
          )}
        </div>
      )}

      {/* Answer list */}
      {activeTab === 'performance' && !loading && (
        <div className="fac-card">
          <div className="fac-card-header">
            <h2>Practice Answers</h2>
            <p className="fac-card-sub">{filtered.length} answer{filtered.length !== 1 ? 's' : ''} shown</p>
          </div>

          {filtered.length === 0 ? (
            <p className="fac-empty">No answers match the selected filters.</p>
          ) : (
            <div className="fac-answer-list">
              {filtered.map((ans) => <AnswerCard key={ans.id} ans={ans} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FacultyDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [selectedAppt, setSelectedAppt] = useState(null);

  useEffect(() => {
    api.get('/faculty/appointments/')
      .then(({ data }) => {
        const sorted = data
          .filter((a) => a.status !== 'cancelled')
          .sort((a, b) => {
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            return new Date(a.scheduled_at) - new Date(b.scheduled_at);
          });
        setAppointments(sorted);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleStatusUpdate(apptId, newStatus) {
    setStatusUpdating(apptId);
    try {
      const { data } = await api.patch(`/appointments/${apptId}/status/`, { status: newStatus });
      setAppointments((prev) => {
        const updated = prev.map((a) => (a.id === apptId ? data : a));
        if (newStatus === 'cancelled') return updated.filter((a) => a.id !== apptId);
        return updated;
      });
      if (selectedAppt?.id === apptId) {
        if (newStatus === 'cancelled') setSelectedAppt(null);
        else setSelectedAppt(data);
      }
    } finally {
      setStatusUpdating(null);
    }
  }

  return (
    <>
      <Navbar />
      <main className="fac-main">

        {selectedAppt ? (
          <StudentDetailView
            appt={selectedAppt}
            onBack={() => setSelectedAppt(null)}
            onStatusUpdate={handleStatusUpdate}
            updating={statusUpdating === selectedAppt.id}
          />
        ) : (
          <>
            <div className="fac-header">
              <h1>Faculty Dashboard</h1>
              <p className="fac-subtitle">Upcoming appointments</p>
            </div>

            {loading ? (
              <p className="fac-empty">Loading…</p>
            ) : appointments.length === 0 ? (
              <p className="fac-empty">No upcoming appointments.</p>
            ) : (
              <div className="fac-appt-list">
                {appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className={`fac-appt-card fac-appt-clickable ${appt.status === 'pending' ? 'fac-appt-pending' : ''}`}
                    onClick={() => setSelectedAppt(appt)}
                  >
                    <div className="fac-appt-header">
                      <span className="fac-appt-student">{appt.student?.username}</span>
                      <span className={
                        appt.status === 'confirmed' ? 'fac-status confirmed'
                        : appt.status === 'cancelled' ? 'fac-status cancelled'
                        : 'fac-status pending'
                      }>{appt.status}</span>
                    </div>
                    <span className="fac-appt-time">
                      {new Date(appt.scheduled_at).toLocaleString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    {appt.notes && <p className="fac-appt-notes">{appt.notes}</p>}
                    <span className="fac-appt-cta">View performance →</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </main>
    </>
  );
}
