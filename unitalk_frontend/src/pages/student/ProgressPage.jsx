import { useState, useEffect } from 'react';
import api from '../../api/axios.js';
import '../../styles/progress.css';
import '../../styles/components.css';

const CATEGORIES = ['All', 'Investment Banking', 'Consulting'];
const SUBCATEGORIES = ['All', 'Behavioral', 'Financial', 'Case'];

const ALL_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Chart geometry (all in SVG user units)
const CM   = { top: 12, right: 12, bottom: 28, left: 34 };
const SVG_W = 700;
const SVG_H = 240;
const CW    = SVG_W - CM.left - CM.right;
const CH    = SVG_H - CM.top  - CM.bottom;
const xCol   = (i) => CM.left + (i / 11) * CW;          // month index 0–11 → x
const yScore = (s) => CM.top  + CH - (s / 100) * CH;    // score 0–100 → y
const mIdx   = (str) => parseInt(str.split('-')[1], 10) - 1; // "2026-02" → 1

export default function ProgressPage() {
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [categoryPerformance, setCategoryPerformance] = useState([]);
  const [subcategoryPerformance, setSubcategoryPerformance] = useState([]);

  useEffect(() => {
    api.get('/student/answers/')
      .then(({ data }) => setAnswers(data))
      .catch(() => setAnswers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Fetch performance over time
    const params = {};
    if (selectedCategory !== 'All') params.category = selectedCategory;
    if (selectedSubcategory !== 'All') params.subcategory = selectedSubcategory;
    
    api.get('/student/performance/over-time/', { params })
      .then(({ data }) => setPerformanceData(data.performance_data ?? []))
      .catch(() => setPerformanceData([]));

    // Fetch performance by category
    api.get('/student/performance/by-category/')
      .then(({ data }) => setCategoryPerformance(data))
      .catch(() => setCategoryPerformance([]));

    // Fetch performance by subcategory
    const subcatParams = selectedCategory !== 'All' ? { category: selectedCategory } : {};
    api.get('/student/performance/by-subcategory/', { params: subcatParams })
      .then(({ data }) => setSubcategoryPerformance(data))
      .catch(() => setSubcategoryPerformance([]));
  }, [selectedCategory, selectedSubcategory]);


  const weeklyGoal = 7;
  const weeklyProgress = Math.min(answers.length, weeklyGoal);

  // Sort data by month so the polyline draws left-to-right
  const sortedData = [...performanceData].sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div className="progress-page">
      <h1>Progress</h1>

      <div className="performance-filters">
        <div className="filter-group">
          <label>Category:</label>
          <select 
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubcategory('All'); // Reset subcategory when category changes
            }}
            className="filter-select"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Subcategory:</label>
          <select 
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
            className="filter-select"
          >
            {SUBCATEGORIES.map(subcat => (
              <option key={subcat} value={subcat}>{subcat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="progress-grid">
        <div className="progress-widget performance-trend-full">
          <h3>Overall Performance Trend</h3>
          <svg
            className="trend-chart"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {/* Horizontal grid lines + y-axis labels */}
            {[0, 20, 40, 60, 80, 100].map((s) => {
              const y = yScore(s);
              return (
                <g key={s}>
                  <line x1={CM.left} y1={y} x2={SVG_W - CM.right} y2={y}
                    stroke="#F1F5F9" strokeWidth="1" />
                  <text x={CM.left - 6} y={y + 4} textAnchor="end"
                    fontSize="11" fill="#94A3B8">{s}</text>
                </g>
              );
            })}

            {/* X-axis month labels */}
            {ALL_MONTHS.map((m, i) => (
              <text key={m} x={xCol(i)} y={SVG_H - 6} textAnchor="middle"
                fontSize="11" fill="#94A3B8">{m}</text>
            ))}

            {/* Data line */}
            {sortedData.length > 1 && (
              <polyline
                points={sortedData.map((d) =>
                  `${xCol(mIdx(d.month))},${yScore(d.average_score)}`
                ).join(' ')}
                fill="none"
                stroke="#FCD34D"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}

            {/* Data dots */}
            {sortedData.map((d) => (
              <circle
                key={d.month}
                cx={xCol(mIdx(d.month))}
                cy={yScore(d.average_score)}
                r="4"
                fill="#FCD34D"
                stroke="#F59E0B"
                strokeWidth="1.5"
              />
            ))}

            {/* Empty state */}
            {sortedData.length === 0 && (
              <text x={SVG_W / 2} y={SVG_H / 2} textAnchor="middle"
                fontSize="13" fill="#94A3B8">
                No performance data available for selected filters
              </text>
            )}
          </svg>
        </div>

        <div className="progress-widget">
          <h3>Performance by Category</h3>
          <div className="category-bars">
            {categoryPerformance.length > 0 ? (
              categoryPerformance.map(item => {
                const maxScore = Math.max(...categoryPerformance.map(i => i.average_score), 100);
                return (
                  <div key={item.category} className="category-bar-item">
                    <div className="category-label">{item.category}</div>
                    <div className="category-bar-container">
                      <div 
                        className="category-bar" 
                        style={{ width: `${(item.average_score / maxScore) * 100}%` }}
                      />
                      <span className="category-count">{item.average_score.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="empty-state">No performance data available</p>
            )}
          </div>
        </div>

        <div className="progress-widget">
          <h3>Performance by Subcategory</h3>
          <div className="difficulty-bars">
            {subcategoryPerformance.length > 0 ? (
              subcategoryPerformance.map(item => {
                const maxScore = Math.max(...subcategoryPerformance.map(i => i.average_score), 100);
                return (
                  <div key={item.subcategory} className="difficulty-bar-item">
                    <div className="difficulty-label">{item.subcategory}</div>
                    <div className="difficulty-bar-container">
                      <div 
                        className="difficulty-bar" 
                        style={{ width: `${(item.average_score / maxScore) * 100}%` }}
                      />
                      <span className="difficulty-count">{item.average_score.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="empty-state">No performance data available</p>
            )}
          </div>
        </div>

        <div className="progress-widget weekly-goal">
          <h3>Weekly Goal</h3>
          <div className="weekly-goal-content">
            <p className="goal-text">
              {weeklyGoal - weeklyProgress > 0 
                ? `${weeklyGoal - weeklyProgress} more sessions to reach your weekly goal!`
                : 'Weekly goal achieved! 🎉'}
            </p>
            <div className="goal-progress-bar">
              <div 
                className="goal-progress-fill"
                style={{ width: `${(weeklyProgress / weeklyGoal) * 100}%` }}
              />
            </div>
            <div className="goal-progress-text">
              {weeklyProgress}/{weeklyGoal}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
