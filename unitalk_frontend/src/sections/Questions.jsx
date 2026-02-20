import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import QuestionDetail from './QuestionDetail.jsx';
import '../styles/components.css';
import '../styles/dashboard.css';

const CATEGORIES = ['All', 'Investment Banking', 'Consulting'];
const SUBCATEGORIES = ['All', 'Behavioral', 'Financial', 'Case'];

function difficultyBadgeClass(difficulty) {
  if (!difficulty) return 'badge';
  const d = difficulty.toLowerCase();
  if (d === 'easy') return 'badge badge-easy';
  if (d === 'hard') return 'badge badge-hard';
  return 'badge badge-medium';
}

export default function Questions({ onSelectQuestion }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [subcategoryFilter, setSubcategoryFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.get('/questions/')
      .then(({ data }) => setQuestions(data))
      .catch(() => setError('Failed to load questions.'))
      .finally(() => setLoading(false));
  }, []);

  if (selectedQuestion && !onSelectQuestion) {
    return (
      <QuestionDetail
        question={selectedQuestion}
        onBack={() => setSelectedQuestion(null)}
      />
    );
  }

  function handleQuestionClick(q) {
    if (onSelectQuestion) {
      onSelectQuestion(q);
    } else {
      setSelectedQuestion(q);
    }
  }

  if (loading) return <p className="empty-state">Loading questions…</p>;
  if (error) return <p className="error-message">{error}</p>;

  const filtered = questions.filter((q) =>
    (categoryFilter === 'All' || q.category === categoryFilter) &&
    (subcategoryFilter === 'All' || q.subcategory === subcategoryFilter) &&
    (difficultyFilter === 'All' || q.difficulty === difficultyFilter) &&
    (searchQuery === '' || q.question.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <h2>Practice Interview</h2>

      <div className="search-filter-bar">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-dropdowns">
          <select 
            className="filter-dropdown"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select 
            className="filter-dropdown"
            value={subcategoryFilter}
            onChange={(e) => setSubcategoryFilter(e.target.value)}
          >
            {SUBCATEGORIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select 
            className="filter-dropdown"
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-state">No questions match the selected filters.</p>
      ) : (
        <div className="question-list">
          {filtered.map((q) => (
            <div
              key={q.id}
              className="question-card"
              onClick={() => handleQuestionClick(q)}
            >
              <div className="question-card-content">
                <h3 className="question-card-title">{q.question}</h3>
                <div className="card-meta">
                  <span className="badge badge-category">{q.category}</span>
                  <span className="badge badge-subcategory">{q.subcategory}</span>
                  <span className={difficultyBadgeClass(q.difficulty)}>{q.difficulty}</span>
                </div>
              </div>
              <span className="question-arrow">▷</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
