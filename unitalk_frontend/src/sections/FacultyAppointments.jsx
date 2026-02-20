import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import ScoreBadge from '../components/ScoreBadge.jsx';
import '../styles/components.css';

function statusClass(s) {
  if (s === 'confirmed') return 'status-badge status-confirmed';
  if (s === 'cancelled') return 'status-badge status-cancelled';
  return 'status-badge status-pending';
}

function parseList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value.split('\n').map((s) => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
}

function StudentAnswersPanel({ student, onBack }) {
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/faculty/student/${student.id}/answers/`)
      .then(({ data }) => setAnswers(data))
      .catch(() => setError("Failed to load student's answers."))
      .finally(() => setLoading(false));
  }, [student.id]);

   const scoredAnswers = answers.filter((a) => typeof a.score === 'number');
   const averageScore = scoredAnswers.length
     ? Math.round(scoredAnswers.reduce((sum, a) => sum + a.score, 0) / scoredAnswers.length)
     : null;

   const subcategoryStats = {};
   scoredAnswers.forEach((a) => {
     const key = a.question?.subcategory || 'Unknown';
     if (!subcategoryStats[key]) {
       subcategoryStats[key] = { total: 0, count: 0 };
     }
     subcategoryStats[key].total += a.score;
     subcategoryStats[key].count += 1;
   });

   const problemAreas = Object.entries(subcategoryStats)
     .map(([name, { total, count }]) => ({
       name,
       average: total / count,
       count,
     }))
     .sort((a, b) => a.average - b.average)
     .slice(0, 3);

  return (
    <div>
      <div className="panel-header">
        <button className="btn-secondary panel-back-btn" onClick={onBack}>
          ← Back
        </button>
        <h2 style={{ margin: 0 }}>{student.username}&rsquo;s Answers</h2>
      </div>

      {loading && <p className="empty-state">Loading answers…</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && answers.length === 0 && (
        <p className="empty-state">This student hasn&rsquo;t submitted any answers yet.</p>
      )}

      {!loading && !error && answers.length > 0 && (
        <div className="faculty-student-summary">
          <div className="summary-card">
            <h3>Average Score</h3>
            <p className="summary-score">
              {averageScore != null ? `${averageScore}/100` : '–'}
            </p>
            <p className="summary-caption">
              Based on {scoredAnswers.length} evaluated {scoredAnswers.length === 1 ? 'answer' : 'answers'}
            </p>
          </div>
          <div className="summary-card">
            <h3>Problem Areas</h3>
            {problemAreas.length === 0 ? (
              <p className="summary-caption">No clear problem areas yet.</p>
            ) : (
              <ul className="summary-list">
                {problemAreas.map((area) => (
                  <li key={area.name}>
                    <span className="summary-area-name">{area.name}</span>
                    <span className="summary-area-score">
                      {area.average.toFixed(1)} / 100 ({area.count})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="progress-list" style={{ marginTop: '1.25rem' }}>
        {answers.map((a) => (
          <div key={a.id} className="progress-card">
            <p className="question-label">
              {a.question.category} · {a.question.subcategory} · {a.question.difficulty}
            </p>
            <p className="question-title">{a.question.question}</p>
            <p className="answer-text">{a.answer}</p>
            <ScoreBadge score={a.score} />
            <div className="evaluation">
              <div className="eval-col strengths">
                <h4>✓ Strengths</h4>
                <ul>
                  {parseList(a.strengths).map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div className="eval-col weaknesses">
                <h4>✗ Weaknesses</h4>
                <ul>
                  {parseList(a.weaknesses).map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            </div>
            <p className="date">{new Date(a.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FacultyAppointments({ showUpcomingOnly = false }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewingStudent, setViewingStudent] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(null);

  useEffect(() => {
    api.get('/faculty/appointments/')
      .then(({ data }) => {
        let filtered = data;
        if (showUpcomingOnly) {
          // Show all non-cancelled appointments:
          //   pending first (needs action), then by scheduled date ascending
          filtered = data.filter((appt) => appt.status !== 'cancelled');
          filtered.sort((a, b) => {
            // pending always floats to top
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            return new Date(a.scheduled_at) - new Date(b.scheduled_at);
          });
        }
        setAppointments(filtered);
      })
      .catch(() => setError('Failed to load appointments.'))
      .finally(() => setLoading(false));
  }, [showUpcomingOnly]);

  async function handleStatusUpdate(apptId, newStatus) {
    setStatusUpdating(apptId);
    try {
      const { data } = await api.patch(`/appointments/${apptId}/status/`, { status: newStatus });
      setAppointments((prev) => {
        const updated = prev.map((a) => (a.id === apptId ? data : a));
        // In dashboard view, remove cancelled appointments so they don't linger
        if (showUpcomingOnly && newStatus === 'cancelled') {
          return updated.filter((a) => a.id !== apptId);
        }
        return updated;
      });
    } finally {
      setStatusUpdating(null);
    }
  }

  if (viewingStudent) {
    return (
      <StudentAnswersPanel
        student={viewingStudent}
        onBack={() => setViewingStudent(null)}
      />
    );
  }

  if (loading) return <p className="empty-state">Loading appointments…</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (appointments.length === 0) {
    return (
      <>
        <h2>{showUpcomingOnly ? 'Upcoming Appointments' : 'My Appointments'}</h2>
        <p className="empty-state">
          {showUpcomingOnly ? 'No upcoming appointments.' : 'No appointments yet.'}
        </p>
      </>
    );
  }

  return (
    <>
      <h2>{showUpcomingOnly ? 'Upcoming Appointments' : 'My Appointments'}</h2>
      <p className="dashboard-subtitle" style={{ marginBottom: '1.5rem' }}>
        Click on a student's name to view their practice history and performance
      </p>
      <div className="appointments-list">
        {appointments.map((appt) => (
          <div key={appt.id} className="appointment-card">
            <div className="appt-header">
              <button
                className="student-name-btn"
                onClick={() => setViewingStudent(appt.student)}
                title="View this student's answers"
              >
                {appt.student?.username || 'Unknown student'}
              </button>
              <span className={statusClass(appt.status)}>{appt.status}</span>
            </div>

            {appt.student?.email && (
              <span className="appt-time" style={{ fontSize: '0.8rem' }}>
                {appt.student.email}
              </span>
            )}
            <span className="appt-time">
              {new Date(appt.scheduled_at).toLocaleString()}
            </span>
            {appt.notes && <p className="appt-notes">{appt.notes}</p>}

            {appt.status === 'pending' && (
              <div className="appt-actions">
                <button
                  className="btn-accept"
                  disabled={statusUpdating === appt.id}
                  onClick={() => handleStatusUpdate(appt.id, 'confirmed')}
                >
                  {statusUpdating === appt.id ? '…' : 'Accept'}
                </button>
                <button
                  className="btn-decline"
                  disabled={statusUpdating === appt.id}
                  onClick={() => handleStatusUpdate(appt.id, 'cancelled')}
                >
                  {statusUpdating === appt.id ? '…' : 'Decline'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
