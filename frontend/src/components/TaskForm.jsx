import React, { useState } from 'react';
import { IconCpu, IconSparkles, IconAlertTriangle } from './Icons';

const PRESETS = [
  {
    label: "Production DB Outage (High)",
    title: "Production database connection dropping under heavy traffic load",
    description: "Postgres database drops active connections when traffic spikes above 500 req/s. Users receive HTTP 500 errors."
  },
  {
    label: "Keyset Pagination (Medium)",
    title: "Optimize task list pagination query performance using cursor pagination",
    description: "Replace OFFSET pagination with keyset cursor pagination to improve query response time on large task boards."
  },
  {
    label: "Documentation Typos (Low)",
    title: "Update README installation steps and developer prerequisites",
    description: "Fix minor typos in developer setup guide documentation and update Node version requirement in docs."
  }
];

export default function TaskForm({ onClassify, isLoading, error }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onClassify({ title: title.trim(), description: description.trim() });
  };

  const applyPreset = (preset) => {
    setTitle(preset.title);
    setDescription(preset.description);
  };

  return (
    <div className="glass-card">
      <h2 className="card-title">
        <IconCpu size={20} /> Submit Task for AI Classification
      </h2>

      <div className="presets-section">
        <p className="presets-label">Quick Test Presets:</p>
        <div className="presets-grid">
          {PRESETS.map((p, idx) => (
            <button key={idx} className="preset-chip" type="button" onClick={() => applyPreset(p)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="task-title">
            Task Title <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            id="task-title"
            type="text"
            className="form-input"
            placeholder="e.g., Fix JWT authentication token expiration loop..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="task-description">
            Task Description (Optional)
          </label>
          <textarea
            id="task-description"
            className="form-textarea"
            placeholder="Provide context, stack trace, error logs, or impact details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {error && (
          <div className="error-banner">
            <IconAlertTriangle size={18} /> {error}
          </div>
        )}

        <button type="submit" className="btn-submit" disabled={isLoading || !title.trim()}>
          {isLoading ? (
            <>Processing Classification...</>
          ) : (
            <>Predict Priority Class</>
          )}
        </button>
      </form>
    </div>
  );
}
