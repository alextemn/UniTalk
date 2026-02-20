import { useState } from 'react';
import api from '../api/axios.js';
import '../styles/components.css';

const CATEGORIES = ['Investment Banking', 'Consulting'];
const SUBCATEGORIES = ['Behavioral', 'Financial', 'Case'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export default function AddQuestion() {
  const [form, setForm] = useState({
    question: '',
    category: 'Investment Banking',
    subcategory: 'Behavioral',
    difficulty: 'Medium',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await api.post('/questions/', form);
      setSuccess(true);
      setForm({ question: '', category: 'Investment Banking', subcategory: 'Behavioral', difficulty: 'Medium' });
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === 'object') {
        const msg = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
          .join(' | ');
        setError(msg);
      } else {
        setError('Failed to add question.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="book-form">
      <h2>Add a Question</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Question</label>
          <textarea
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            rows={3}
            placeholder="Write your question here…"
            required
          />
        </div>
        <div className="form-group">
          <label>Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Subcategory</label>
          <select
            value={form.subcategory}
            onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
          >
            {SUBCATEGORIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Difficulty</label>
          <select
            value={form.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="book-success">Question added successfully!</p>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Adding…' : 'Add Question'}
        </button>
      </form>
    </div>
  );
}
