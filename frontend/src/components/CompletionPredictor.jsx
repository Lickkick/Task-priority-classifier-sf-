import React, { useState, useEffect } from 'react';
import { IconClock, IconBrain, IconUser, IconCalendar, IconTrendingUp, IconZap, IconTarget } from './Icons';
import UserProfileCard from './UserProfileCard';

// Helper component to render a user option
function UserOption({ user, selected }) {
  const bgColor = user.efficiency_score >= 0.85 ? 'var(--high-green)' : user.efficiency_score >= 0.7 ? 'var(--med-amber)' : 'var(--low-red)';
  return (
    <option value={user.user_id} style={{ backgroundColor: selected ? bgColor : 'inherit' }}>
      {user.name} – {user.role} ({Math.round(user.efficiency_score * 100)}% efficiency)
    </option>
  );
}

export default function CompletionPredictor({ apiHost }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [plannedStart, setPlannedStart] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load users on mount
  useEffect(() => {
    fetch(`${apiHost}/api/users`)
      .then((res) => res.json())
      .then(setUsers)
      .catch((e) => console.error('Failed to fetch users', e));
  }, [apiHost]);

  const handlePredict = async () => {
    if (!selectedUser || !title || !plannedStart) {
      setError('Select user, enter title and pick a start date.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1️⃣ Predict completion
      const predictRes = await fetch(`${apiHost}/api/predict-completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser,
          title,
          description,
          planned_start_date: plannedStart,
        }),
      });
      if (!predictRes.ok) throw new Error('Prediction request failed');
      const predData = await predictRes.json();
      setPrediction(predData);

      // 2️⃣ Fetch AI insights (optional – after prediction)
      const insightRes = await fetch(`${apiHost}/api/ai-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, priority: predData.classification.priority }),
      });
      if (insightRes.ok) {
        const insightData = await insightRes.json();
        setInsights(insightData);
      }
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="predictor-section glass-card">
      <h2 className="section-title"><IconTarget size={20} /> Smart Predictor</h2>

      {/* User selector */}
      <div className="form-group">
        <label htmlFor="user-select"><IconUser size={16} /> User</label>
        <select
          id="user-select"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">Select a user…</option>
          {users.map((u) => (
            <UserOption key={u.user_id} user={u} selected={u.user_id === selectedUser} />
          ))}
        </select>
      </div>

      {/* Task title */}
      {selectedUser && (
        <UserProfileCard user={users.find(u => u.user_id === selectedUser)} />
      )}
      <div className="form-group">
        <label htmlFor="task-title"><IconZap size={16} /> Title</label>
        <input
          id="task-title"
          type="text"
          placeholder="Enter task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Description */}
      <div className="form-group">
        <label htmlFor="task-desc"><IconBrain size={16} /> Description</label>
        <textarea
          id="task-desc"
          rows={3}
          placeholder="Optional detailed description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Planned start date */}
      <div className="form-group">
        <label htmlFor="start-date"><IconCalendar size={16} /> Planned Start</label>
        <input
          id="start-date"
          type="datetime-local"
          value={plannedStart}
          onChange={(e) => setPlannedStart(e.target.value)}
        />
      </div>

      {/* Predict button */}
      <button className="btn-primary" onClick={handlePredict} disabled={loading}>
        {loading ? 'Predicting…' : 'Predict Completion'}
      </button>

      {/* Error message */}
      {error && <p className="error-msg">{error}</p>}

      {/* Prediction results */}
      {prediction && (
        <div className="prediction-result glass-card">
          <h3><IconTrendingUp size={18} /> Prediction Summary</h3>
          <p><strong>Predicted Completion:</strong> {new Date(prediction.prediction.predicted_completion).toLocaleString()}</p>
          <p><strong>Estimated Work Hours:</strong> {prediction.prediction.efficiency_adjusted_hours} hrs (adjusted for efficiency)</p>
          <p><strong>Priority:</strong> {prediction.classification.priority} ({prediction.classification.confidence_percentage}%)</p>
          {prediction.delay_analysis.delay_warning && (
            <div className="delay-warning">
              {prediction.delay_analysis.delay_warning}
            </div>
          )}
        </div>
      )}

      {/* AI Insights */}
      {insights && (
        <div className="insights-panel glass-card">
          <h3><IconBrain size={18} /> AI Fix Insights</h3>
          {insights.matched_patterns.length === 0 ? (
            <p>No relevant fix patterns found.</p>
          ) : (
            <ul className="insight-list">
              {insights.matched_patterns.map((p) => (
                <li key={p.pattern_id} className="insight-item">
                  <strong>{p.fix_title}</strong> – {p.fix_description}<br />
                  <em>Estimated fix: {p.estimated_fix_hours}h | Severity: {p.severity}</em>
                  <br />
                  <span>Files: {p.files_to_check.join(', ')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
