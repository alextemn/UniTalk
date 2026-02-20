import '../styles/components.css';

function scoreColor(score) {
  if (score >= 85) return 'green';
  if (score >= 70) return 'blue';
  if (score >= 50) return 'orange';
  return 'red';
}

function scoreLabel(score) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Needs Improvement';
  return 'Poor';
}

export default function ScoreBadge({ score }) {
  if (score == null) return null;
  const color = scoreColor(score);
  return (
    <div className="score-banner">
      <div className={`score-circle score-${color}`}>
        <span className="score-number">{score}</span>
        <span className="score-denom">/100</span>
      </div>
      <div className="score-info">
        <p className="score-label">{scoreLabel(score)}</p>
        <div className="score-bar-track">
          <div className={`score-bar-fill score-fill-${color}`} style={{ width: `${score}%` }} />
        </div>
        <p className="score-rubric">
          Content Accuracy (30) · Depth &amp; Detail (25) · Structure &amp; Clarity (25) · Communication (20)
        </p>
      </div>
    </div>
  );
}
