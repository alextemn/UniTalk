import '../../styles/dashboard.css';

const ALUMNI = [
  { id: 1, firstName: 'Sarah',   lastName: 'Chen',      company: 'Goldman Sachs',    industry: 'Investment Banking', yearsOfExperience: 8 },
  { id: 2, firstName: 'Marcus',  lastName: 'Williams',  company: 'McKinsey & Co.',   industry: 'Consulting',         yearsOfExperience: 5 },
  { id: 3, firstName: 'Priya',   lastName: 'Patel',     company: 'Morgan Stanley',   industry: 'Investment Banking', yearsOfExperience: 11 },
  { id: 4, firstName: 'James',   lastName: 'O\'Brien',  company: 'Bain & Company',   industry: 'Consulting',         yearsOfExperience: 3 },
  { id: 5, firstName: 'Aisha',   lastName: 'Johnson',   company: 'JP Morgan Chase',  industry: 'Investment Banking', yearsOfExperience: 7 },
];

function industryStyle(industry) {
  if (industry === 'Investment Banking') return { background: '#EEF2FF', color: '#4338CA' };
  return { background: '#F0FDF4', color: '#166534' };
}

export default function AlumniPage() {
  return (
    <div className="db-page">
      <div className="db-header">
        <h1>Alumni Network</h1>
        <p className="db-subtitle">Connect with alumni who have been in your shoes</p>
      </div>

      <div className="db-card" style={{ gridColumn: '1 / -1' }}>
        <div className="db-card-hd">
          <h2>Featured Alumni</h2>
        </div>
        <div className="db-session-list">
          {ALUMNI.map((a) => (
            <div key={a.id} className="db-session-row">
              <div className="db-session-info">
                <p className="db-session-q">{a.firstName} {a.lastName}</p>
                <div className="db-session-meta">
                  <span className="db-chip db-chip-cat">{a.company}</span>
                  <span className="db-chip db-chip-sub" style={industryStyle(a.industry)}>{a.industry}</span>
                </div>
              </div>
              <span className="db-session-score" style={{ color: '#6366F1', fontSize: '1rem' }}>
                {a.yearsOfExperience}<span className="db-score-denom"> yrs exp</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
