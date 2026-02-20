import '../../styles/dashboard.css';
import '../../styles/components.css';

export default function CVPage() {
  return (
    <div className="db-page">
      <div className="db-header">
        <h1>My CV</h1>
        <p className="db-subtitle">Your CV — visible to faculty before your meeting</p>
      </div>

      <div className="cv-page-body">
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
    </div>
  );
}
