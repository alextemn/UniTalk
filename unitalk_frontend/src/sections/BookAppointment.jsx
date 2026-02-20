import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import '../styles/components.css';

export default function BookAppointment() {
  const [faculty, setFaculty] = useState([]);
  const [form, setForm] = useState({ faculty: '', scheduled_at: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get('/faculty/')
      .then(({ data }) => setFaculty(data))
      .catch(() => setFetchError('Failed to load faculty list.'));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    setSuccess(false);
    setLoading(true);
    try {
      const scheduledAt = new Date(form.scheduled_at).toISOString();
      await api.post('/appointments/', {
        faculty: Number(form.faculty),
        scheduled_at: scheduledAt,
        notes: form.notes,
      });
      setSuccess(true);
      setForm({ faculty: '', scheduled_at: '', notes: '' });
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === 'object') {
        const msg = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
          .join(' | ');
        setSubmitError(msg);
      } else {
        setSubmitError('Failed to book appointment.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="book-form">
      <h2>Book Appointment</h2>
      {fetchError && <p className="error-message">{fetchError}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Faculty Member</label>
          <select
            value={form.faculty}
            onChange={(e) => setForm({ ...form, faculty: e.target.value })}
            required
          >
            <option value="">Select faculty…</option>
            {faculty.map((f) => (
              <option key={f.id} value={f.id}>
                {f.username} {f.email ? `(${f.email})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Date & Time</label>
          <input
            type="datetime-local"
            value={form.scheduled_at}
            onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Notes (optional)</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Any notes for the faculty member…"
          />
        </div>
        {submitError && <p className="error-message">{submitError}</p>}
        {success && <p className="book-success">Appointment booked successfully!</p>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Booking…' : 'Book Appointment'}
        </button>
      </form>
    </div>
  );
}
