import { useState, useEffect } from 'react';
import api from '../../api/axios.js';
import '../../styles/feedback.css';
import '../../styles/components.css';

function parseList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value
    .split('\n')
    .map((s) => s.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
}

function difficultyBadgeClass(difficulty) {
  if (!difficulty) return 'badge-difficulty';
  const d = difficulty.toLowerCase();
  if (d === 'easy') return 'badge-difficulty badge-easy';
  if (d === 'hard') return 'badge-difficulty badge-hard';
  return 'badge-difficulty badge-medium';
}

function scoreClass(score) {
  if (score >= 80) return 'score-green';
  if (score >= 60) return 'score-blue';
  if (score >= 40) return 'score-orange';
  return 'score-red';
}

function scoreLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Work';
}

function avg(arr) {
  return arr.length ? Math.round(arr.reduce((s, n) => s + n, 0) / arr.length) : null;
}

// ── Detail view ──────────────────────────────────────────────────
function AnswerDetail({ answer, allAnswers, onBack }) {
  const q        = answer.question ?? {};
  const score    = answer.score ?? 0;
  const cls      = scoreClass(score);
  const fillCls  = `score-fill-${cls.replace('score-', '')}`;
  const strengths  = parseList(answer.strengths);
  const weaknesses = parseList(answer.weaknesses);

  // Comparison stats computed from all the student's answers
  const catScores  = allAnswers.filter((a) => a.question?.category    === q.category    && a.score != null).map((a) => a.score);
  const subScores  = allAnswers.filter((a) => a.question?.subcategory === q.subcategory && a.score != null).map((a) => a.score);
  const diffScores = allAnswers.filter((a) => a.question?.difficulty  === q.difficulty  && a.score != null).map((a) => a.score);
  const allScores  = allAnswers.filter((a) => a.score != null).map((a) => a.score);

  const catAvg  = avg(catScores);
  const subAvg  = avg(subScores);
  const diffAvg = avg(diffScores);
  const overallAvg = avg(allScores);

  const delta = overallAvg != null ? score - overallAvg : null;

  return (
    <div className="fh-detail">
      <button className="fh-back-btn" onClick={onBack}>← Back to Feedback History</button>

      {/* Question header */}
      <div className="fh-detail-header">
        <div className="fh-detail-badges">
          {q.category    && <span className="badge-category">{q.category}</span>}
          {q.subcategory && <span className="badge-subcategory fh-badge-sub">{q.subcategory}</span>}
          {q.difficulty  && <span className={difficultyBadgeClass(q.difficulty)}>{q.difficulty}</span>}
        </div>
        <p className="fh-detail-question">{q.question}</p>
        <p className="fh-detail-date">
          Answered {new Date(answer.created_at).toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
          })}
        </p>
      </div>

      {/* Score banner */}
      <div className="score-banner">
        <div className={`score-circle ${cls}`}>
          <span className="score-number">{score}</span>
          <span className="score-denom">/100</span>
        </div>
        <div className="score-info">
          <p className="score-label">{scoreLabel(score)}</p>
          <div className="score-bar-track">
            <div className={`score-bar-fill ${fillCls}`} style={{ width: `${score}%` }} />
          </div>
          <p className="score-rubric">
            Content Accuracy (30) + Depth (25) + Structure (25) + Communication (20)
          </p>
        </div>
      </div>

      {/* Comparison stats */}
      <div className="fh-stats-row">
        {overallAvg != null && (
          <div className="fh-stat-card">
            <span className="fh-stat-num">{overallAvg}</span>
            <span className="fh-stat-lbl">Your overall avg</span>
          </div>
        )}
        {catAvg != null && (
          <div className="fh-stat-card">
            <span className="fh-stat-num">{catAvg}</span>
            <span className="fh-stat-lbl">Avg in {q.category}</span>
          </div>
        )}
        {subAvg != null && (
          <div className="fh-stat-card">
            <span className="fh-stat-num">{subAvg}</span>
            <span className="fh-stat-lbl">Avg in {q.subcategory}</span>
          </div>
        )}
        {diffAvg != null && (
          <div className="fh-stat-card">
            <span className="fh-stat-num">{diffAvg}</span>
            <span className="fh-stat-lbl">Avg for {q.difficulty} questions</span>
          </div>
        )}
        {delta != null && (
          <div className={`fh-stat-card ${delta >= 0 ? 'fh-stat-positive' : 'fh-stat-negative'}`}>
            <span className="fh-stat-num">{delta >= 0 ? '+' : ''}{delta}</span>
            <span className="fh-stat-lbl">vs your average</span>
          </div>
        )}
      </div>

      {/* Student's answer */}
      <div className="fh-answer-section">
        <p className="fh-section-label">Your Answer</p>
        <p className="fh-answer-text">{answer.answer}</p>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="evaluation">
        <div className="eval-col strengths">
          <h4>✓ Strengths</h4>
          <ul>
            {strengths.length > 0
              ? strengths.map((s, i) => <li key={i}>{s}</li>)
              : <li>No specific strengths noted.</li>}
          </ul>
        </div>
        <div className="eval-col weaknesses">
          <h4>✕ Areas to Improve</h4>
          <ul>
            {weaknesses.length > 0
              ? weaknesses.map((w, i) => <li key={i}>{w}</li>)
              : <li>No specific weaknesses noted.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────
export default function FeedbackHistoryPage() {
  const [answers, setAnswers]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  useEffect(() => {
    api.get('/student/answers/')
      .then(({ data }) => setAnswers(data))
      .catch(() => setError('Failed to load feedback history.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="empty-state">Loading feedback history…</p>;
  if (error)   return <p className="error-message">{error}</p>;

  if (selectedAnswer) {
    return (
      <div className="feedback-history-page">
        <AnswerDetail
          answer={selectedAnswer}
          allAnswers={answers}
          onBack={() => setSelectedAnswer(null)}
        />
      </div>
    );
  }

  return (
    <div className="feedback-history-page">
      <h1>Feedback History</h1>

      {answers.length === 0 ? (
        <p className="empty-state">No feedback history yet. Start practicing to see your feedback!</p>
      ) : (
        <div className="feedback-table-container">
          <table className="feedback-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>QUESTION</th>
                <th>CATEGORY</th>
                <th>DIFFICULTY</th>
                <th>SCORE</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {answers.map((answer) => (
                <tr
                  key={answer.id}
                  className="fh-row-clickable"
                  onClick={() => setSelectedAnswer(answer)}
                >
                  <td>{new Date(answer.created_at).toLocaleDateString('en-CA')}</td>
                  <td className="question-cell">
                    {answer.question?.question?.substring(0, 60)}
                    {answer.question?.question?.length > 60 ? '…' : ''}
                  </td>
                  <td>
                    <span className="badge-category">
                      {answer.question?.category || '—'}
                    </span>
                  </td>
                  <td>
                    <span className={difficultyBadgeClass(answer.question?.difficulty)}>
                      {answer.question?.difficulty || '—'}
                    </span>
                  </td>
                  <td className="score-cell">{answer.score ?? '—'}</td>
                  <td className="fh-row-arrow">View →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
