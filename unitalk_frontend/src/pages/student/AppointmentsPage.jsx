import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios.js';
import '../../styles/appointments.css';
import '../../styles/components.css';

function statusClass(s) {
  if (s === 'confirmed') return 'status-badge status-confirmed';
  if (s === 'cancelled') return 'status-badge status-cancelled';
  return 'status-badge status-pending';
}

export default function AppointmentsPage() {
  const [faculty, setFaculty] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState({ faculty: '', scheduled_at: '', notes: '' });
  const [loadingFaculty, setLoadingFaculty] = useState(true);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  const loadAppointments = useCallback(() => {
    setLoadingAppts(true);
    api.get('/appointments/')
      .then(({ data }) => setAppointments(data))
      .catch(() => setAppointments([]))
      .finally(() => setLoadingAppts(false));
  }, []);

  useEffect(() => {
    api.get('/faculty/')
      .then(({ data }) => setFaculty(data))
      .catch(() => setFetchError('Failed to load faculty list.'))
      .finally(() => setLoadingFaculty(false));

    loadAppointments();
  }, [loadAppointments]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    setSuccess(false);
    setSubmitting(true);
    try {
      const scheduledAt = new Date(form.scheduled_at).toISOString();
      await api.post('/appointments/', {
        faculty: Number(form.faculty),
        scheduled_at: scheduledAt,
        notes: form.notes,
      });
      setSuccess(true);
      setForm({ faculty: '', scheduled_at: '', notes: '' });
      loadAppointments();
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
      setSubmitting(false);
    }
  }

  return (
    <div className="appointments-page">
      <div className="appointments-header">
        <h1>Book an Appointment</h1>
        <p className="appointments-subtitle">Schedule time with a faculty member for guidance and feedback</p>
      </div>

      <div className="appointments-layout">
        {/* Booking form */}
        <div className="booking-card">
          <h2>New Appointment</h2>
          {fetchError && <p className="error-message">{fetchError}</p>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Faculty Member</label>
              <select
                value={form.faculty}
                onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                required
                disabled={loadingFaculty}
              >
                <option value="">{loadingFaculty ? 'Loading…' : 'Select faculty member…'}</option>
                {faculty.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.username}{f.email ? ` — ${f.email}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Date &amp; Time</label>
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Notes <span className="optional-label">(optional)</span></label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="What would you like to discuss?"
              />
            </div>
            {submitError && <p className="error-message">{submitError}</p>}
            {success && (
              <p className="booking-success">Appointment request sent! Waiting for confirmation.</p>
            )}
            <button type="submit" className="btn-book" disabled={submitting || loadingFaculty}>
              {submitting ? 'Booking…' : 'Book Appointment'}
            </button>
          </form>
        </div>

        {/* Appointment history */}
        <div className="booking-history">
          <h2>My Appointments</h2>
          {loadingAppts ? (
            <p className="empty-state">Loading appointments…</p>
          ) : appointments.length === 0 ? (
            <p className="empty-state">No appointments yet. Book one to get started!</p>
          ) : (
            <div className="appt-list">
              {appointments.map((appt) => (
                <div key={appt.id} className="appt-card">
                  <div className="appt-card-header">
                    <span className="appt-faculty-name">
                      {appt.faculty?.username || 'Faculty'}
                    </span>
                    <span className={statusClass(appt.status)}>{appt.status}</span>
                  </div>
                  {appt.faculty?.email && (
                    <span className="appt-detail">{appt.faculty.email}</span>
                  )}
                  <span className="appt-detail appt-time">
                    {new Date(appt.scheduled_at).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {appt.notes && (
                    <p className="appt-notes-text">{appt.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
