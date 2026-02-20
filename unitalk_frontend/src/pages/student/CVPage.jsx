import { useState, useEffect } from 'react';
import api from '../../api/axios.js';
import '../../styles/dashboard.css';
import '../../styles/components.css';

export default function CVPage() {
  const [cv, setCv]           = useState(undefined); // undefined=loading, null=no CV, object=has CV
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    api.get('/student/cv/')
      .then(({ data }) => setCv(data))   // null if no CV, object if exists
      .catch(() => setCv(null));
  }, []);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('pdf', file);
      const { data } = await api.post('/student/cv/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCv(data);
    } catch {
      setError('Upload failed. Make sure the file is a PDF under 10 MB.');
    } finally {
      setUploading(false);
      // reset input so the same file can be re-selected after error
      e.target.value = '';
    }
  }

  async function handleDelete() {
    if (!window.confirm('Remove your CV?')) return;
    setDeleting(true);
    try {
      await api.delete('/student/cv/');
      setCv(null);
    } finally {
      setDeleting(false);
    }
  }

  async function handleView() {
    setError('');
    try {
      const res = await api.get('/student/cv/pdf/', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank');
    } catch {
      setError('Failed to open PDF.');
    }
  }

  if (cv === undefined) return <p className="empty-state">Loading your CV…</p>;

  return (
    <div className="db-page">
      <div className="db-header">
        <h1>My CV</h1>
        <p className="db-subtitle">Upload your CV — faculty can view it before your meeting</p>
      </div>

      <div className="cv-page-body">
        {cv ? (
          <div className="cv-uploaded-card">
            <div className="cv-uploaded-info">
              <span className="cv-file-icon">PDF</span>
              <div>
                <p className="cv-uploaded-name">{cv.filename}</p>
                <p className="cv-uploaded-date">
                  Uploaded {new Date(cv.uploaded_at).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="cv-uploaded-actions">
              <button className="btn-primary" onClick={handleView}>View PDF</button>

              <label className="btn-secondary cv-upload-label">
                Replace
                <input
                  type="file"
                  accept="application/pdf"
                  hidden
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>

              <button className="cv-delete-exp-btn" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Removing…' : 'Remove'}
              </button>
            </div>

            {error && <p className="error-message" style={{ marginTop: '0.75rem' }}>{error}</p>}
          </div>
        ) : (
          <div className="cv-upload-area">
            <p className="cv-upload-hint">No CV uploaded yet.</p>
            <label className="btn-primary cv-upload-label">
              {uploading ? 'Uploading…' : 'Upload PDF'}
              <input
                type="file"
                accept="application/pdf"
                hidden
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
            {error && <p className="error-message" style={{ marginTop: '0.75rem' }}>{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
