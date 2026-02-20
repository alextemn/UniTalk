import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import ScoreBadge from '../components/ScoreBadge.jsx';
import '../styles/components.css';

function parseList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value
    .split('\n')
    .map((s) => s.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
}

export default function MyProgress() {
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/student/answers/')
      .then(({ data }) => setAnswers(data))
      .catch(() => setError('Failed to load progress.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="empty-state">Loading progress…</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (answers.length === 0) return <p className="empty-state">No answers submitted yet.</p>;

  return (
    <>
      <h2>My Progress</h2>
      <div className="progress-list">
        {answers.map((a) => (
          <div key={a.id} className="progress-card">
            <p className="question-label">{a.question.category} · {a.question.subcategory} · {a.question.difficulty}</p>
            <p className="question-title">{a.question.question}</p>
            <p className="answer-text">{a.answer}</p>
            <ScoreBadge score={a.score} />
            <div className="evaluation">
              <div className="eval-col strengths">
                <h4>✓ Strengths</h4>
                <ul>
                  {parseList(a.strengths).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="eval-col weaknesses">
                <h4>✗ Weaknesses</h4>
                <ul>
                  {parseList(a.weaknesses).map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="date">{new Date(a.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </>
  );
}
