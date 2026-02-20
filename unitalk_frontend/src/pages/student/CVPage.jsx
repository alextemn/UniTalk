import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios.js';
import '../../styles/dashboard.css';
import '../../styles/components.css';

// ── Bullet row ────────────────────────────────────────────────────
function BulletRow({ bullet, expId, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/student/cv/experiences/${expId}/bullets/${bullet.id}/`);
      onDeleted(bullet.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <li className="cv-bullet-row">
      <span className="cv-bullet-dot">•</span>
      <span className="cv-bullet-text">{bullet.text}</span>
      <button className="cv-delete-btn" onClick={handleDelete} disabled={deleting} title="Remove bullet">
        ×
      </button>
    </li>
  );
}

// ── Add bullet inline form ────────────────────────────────────────
function AddBulletForm({ expId, onAdded }) {
  const [open, setOpen]     = useState(false);
  const [text, setText]     = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { data } = await api.post(`/student/cv/experiences/${expId}/bullets/`, { text, order: 0 });
      onAdded(data);
      setText('');
      setOpen(false);
    } catch {
      setError('Failed to add bullet.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button className="cv-add-bullet-btn" onClick={() => setOpen(true)}>
        + Add bullet
      </button>
    );
  }

  return (
    <form className="cv-bullet-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. Led a team of 5 engineers to deliver a product on time"
        required
        autoFocus
      />
      {error && <p className="error-message">{error}</p>}
      <div className="cv-bullet-form-actions">
        <button type="submit" className="btn-primary" disabled={saving || !text.trim()}>
          {saving ? 'Adding…' : 'Add'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => { setOpen(false); setText(''); }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Experience card ───────────────────────────────────────────────
function ExperienceCard({ exp, onDeleted, onBulletAdded, onBulletDeleted }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm('Delete this experience and all its bullets?')) return;
    setDeleting(true);
    try {
      await api.delete(`/student/cv/experiences/${exp.id}/`);
      onDeleted(exp.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="cv-exp-card">
      <div className="cv-exp-header">
        <div className="cv-exp-info">
          <p className="cv-exp-title">{exp.title}</p>
          <p className="cv-exp-company">{exp.company}</p>
          <p className="cv-exp-dates">
            {exp.start_date} — {exp.is_current ? 'Present' : exp.end_date || '—'}
          </p>
        </div>
        <button className="cv-delete-exp-btn" onClick={handleDelete} disabled={deleting} title="Delete experience">
          Delete
        </button>
      </div>

      {exp.bullets.length > 0 && (
        <ul className="cv-bullets">
          {exp.bullets.map((b) => (
            <BulletRow
              key={b.id}
              bullet={b}
              expId={exp.id}
              onDeleted={(bulletId) => onBulletDeleted(exp.id, bulletId)}
            />
          ))}
        </ul>
      )}

      <AddBulletForm expId={exp.id} onAdded={(bullet) => onBulletAdded(exp.id, bullet)} />
    </div>
  );
}

// ── Add experience form ───────────────────────────────────────────
function AddExperienceForm({ onAdded }) {
  const [open, setOpen]     = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [form, setForm]     = useState({
    title: '', company: '', start_date: '', end_date: '', is_current: false,
  });

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { data } = await api.post('/student/cv/experiences/', {
        ...form,
        end_date: form.is_current ? '' : form.end_date,
      });
      onAdded({ ...data, bullets: [] });
      setForm({ title: '', company: '', start_date: '', end_date: '', is_current: false });
      setOpen(false);
    } catch (err) {
      const d = err.response?.data;
      setError(d ? Object.values(d).flat().join(' ') : 'Failed to add experience.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button className="cv-add-exp-btn" onClick={() => setOpen(true)}>
        + Add Experience
      </button>
    );
  }

  return (
    <div className="cv-add-exp-form-wrap">
      <h3>New Experience</h3>
      <form className="cv-exp-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Job Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Investment Banking Analyst"
            required
          />
        </div>
        <div className="form-group">
          <label>Company</label>
          <input
            type="text"
            value={form.company}
            onChange={(e) => set('company', e.target.value)}
            placeholder="e.g. Goldman Sachs"
            required
          />
        </div>
        <div className="cv-dates-row">
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="text"
              value={form.start_date}
              onChange={(e) => set('start_date', e.target.value)}
              placeholder="e.g. Jun 2022"
              required
            />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input
              type="text"
              value={form.end_date}
              onChange={(e) => set('end_date', e.target.value)}
              placeholder="e.g. Aug 2023"
              disabled={form.is_current}
            />
          </div>
        </div>
        <div className="form-group cv-current-row">
          <label className="cv-checkbox-label">
            <input
              type="checkbox"
              checked={form.is_current}
              onChange={(e) => set('is_current', e.target.checked)}
            />
            Currently working here
          </label>
        </div>
        {error && <p className="error-message">{error}</p>}
        <div className="cv-exp-form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Experience'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main CV page ──────────────────────────────────────────────────
export default function CVPage() {
  const [cv, setCV]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const loadCV = useCallback(() => {
    api.get('/student/cv/')
      .then(({ data }) => setCV(data))
      .catch(() => setError('Failed to load your CV.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadCV(); }, [loadCV]);

  function handleExpAdded(exp) {
    setCV((prev) => ({ ...prev, experiences: [exp, ...prev.experiences] }));
  }

  function handleExpDeleted(expId) {
    setCV((prev) => ({ ...prev, experiences: prev.experiences.filter((e) => e.id !== expId) }));
  }

  function handleBulletAdded(expId, bullet) {
    setCV((prev) => ({
      ...prev,
      experiences: prev.experiences.map((e) =>
        e.id === expId ? { ...e, bullets: [...e.bullets, bullet] } : e
      ),
    }));
  }

  function handleBulletDeleted(expId, bulletId) {
    setCV((prev) => ({
      ...prev,
      experiences: prev.experiences.map((e) =>
        e.id === expId ? { ...e, bullets: e.bullets.filter((b) => b.id !== bulletId) } : e
      ),
    }));
  }

  if (loading) return <p className="empty-state">Loading your CV…</p>;
  if (error)   return <p className="error-message">{error}</p>;

  return (
    <div className="db-page">
      <div className="db-header">
        <h1>My CV</h1>
        <p className="db-subtitle">Build your professional experience — faculty can view this before your meeting</p>
      </div>

      <div className="cv-page-body">
        <div className="cv-section-header">
          <h2>Experience</h2>
          <AddExperienceForm onAdded={handleExpAdded} />
        </div>

        {cv.experiences.length === 0 ? (
          <p className="empty-state">No experiences yet — add one to get started.</p>
        ) : (
          <div className="cv-exp-list">
            {cv.experiences.map((exp) => (
              <ExperienceCard
                key={exp.id}
                exp={exp}
                onDeleted={handleExpDeleted}
                onBulletAdded={handleBulletAdded}
                onBulletDeleted={handleBulletDeleted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
