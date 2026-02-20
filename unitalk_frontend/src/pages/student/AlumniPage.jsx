import { useAuth } from '../../context/AuthContext.jsx';
import '../../styles/dashboard.css';

const ALUMNI = [
  { id: 1, firstName: 'Sarah',  lastName: 'Chen',     email: 'sarah.chen@gmail.com',    company: 'Goldman Sachs',   industry: 'Investment Banking', yearsOfExperience: 8 },
  { id: 2, firstName: 'Marcus', lastName: 'Williams', email: 'marcus.williams@gmail.com', company: 'McKinsey & Co.', industry: 'Consulting',         yearsOfExperience: 5 },
  { id: 3, firstName: 'Priya',  lastName: 'Patel',    email: 'priya.patel@gmail.com',    company: 'Morgan Stanley',  industry: 'Investment Banking', yearsOfExperience: 11 },
  { id: 4, firstName: 'James',  lastName: 'O\'Brien', email: 'james.obrien@gmail.com',   company: 'Bain & Company',  industry: 'Consulting',         yearsOfExperience: 3 },
  { id: 5, firstName: 'Aisha',  lastName: 'Johnson',  email: 'aisha.johnson@gmail.com',  company: 'JP Morgan Chase', industry: 'Investment Banking', yearsOfExperience: 7 },
];

function industryStyle(industry) {
  if (industry === 'Investment Banking') return { background: '#EEF2FF', color: '#4338CA' };
  return { background: '#F0FDF4', color: '#166534' };
}

function gmailLink(alumni, senderUsername) {
  const subject = encodeURIComponent(`Reaching out from UniTalk — ${senderUsername}`);
  const body = encodeURIComponent(
    `Hi ${alumni.firstName},\n\nI found your profile on UniTalk and wanted to reach out.\n\nBest,\n${senderUsername}`
  );
  return `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(alumni.email)}&su=${subject}&body=${body}`;
}

export default function AlumniPage() {
  const { user } = useAuth();

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
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className="db-session-score" style={{ color: '#6366F1', fontSize: '1rem' }}>
                  {a.yearsOfExperience}<span className="db-score-denom"> yrs exp</span>
                </span>
                <a
                  href={gmailLink(a, user?.username || 'a student')}
                  target="_blank"
                  rel="noreferrer"
                  className="db-cta-btn"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem', textDecoration: 'none', whiteSpace: 'nowrap' }}
                >
                  Chat →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
