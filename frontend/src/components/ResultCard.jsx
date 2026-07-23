import React, { useState } from 'react';

export default function ResultCard({ result, onFeedback, currentTaskTitle }) {
  const [feedbackSent, setFeedbackSent] = useState(null);

  if (!result) {
    return (
      <div className="glass-card empty-state">
        <div className="empty-icon">🎯</div>
        <h3>No Prediction Yet</h3>
        <p style={{ marginTop: '8px', fontSize: '0.88rem' }}>
          Enter a task title and description on the left or select a 1-click test preset to see AI priority predictions.
        </p>
      </div>
    );
  }

  const priorityLower = result.priority.toLowerCase();

  const handleThumb = (type) => {
    setFeedbackSent(type);
    if (onFeedback) {
      onFeedback({
        task_title: currentTaskTitle,
        predicted_priority: result.priority,
        user_feedback: type
      });
    }
  };

  return (
    <div className={`glass-card result-card ${priorityLower}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className={`priority-badge ${priorityLower}`}>
          {priorityLower === 'high' && '🔴'}
          {priorityLower === 'medium' && '🟠'}
          {priorityLower === 'low' && '🟢'}
          {result.priority} Priority
        </span>

        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {result.model_type}
        </span>
      </div>

      <div className="confidence-container">
        <div className="confidence-header">
          <span>AI Prediction Confidence</span>
          <span>{result.confidence_percentage}%</span>
        </div>
        <div className="gauge-track">
          <div 
            className={`gauge-fill ${priorityLower}`} 
            style={{ width: `${Math.max(result.confidence_percentage, 10)}%` }}
          />
        </div>
      </div>

      <div className="reason-box">
        <div className="reason-title">💡 Automated Classification Reason</div>
        <div>{result.reason}</div>
      </div>

      {result.probabilities && (
        <div style={{ marginTop: '18px' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>
            Class Probability Distribution:
          </p>
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
            <div><span style={{ color: 'var(--high-red)' }}>High:</span> {(result.probabilities.High * 100).toFixed(1)}%</div>
            <div><span style={{ color: 'var(--med-amber)' }}>Medium:</span> {(result.probabilities.Medium * 100).toFixed(1)}%</div>
            <div><span style={{ color: 'var(--low-green)' }}>Low:</span> {(result.probabilities.Low * 100).toFixed(1)}%</div>
          </div>
        </div>
      )}

      {/* Stretch Goal: Feedback Buttons */}
      <div className="feedback-section">
        <span className="feedback-label">Is this suggested priority accurate?</span>
        <div className="feedback-btns">
          <button 
            className={`btn-feedback ${feedbackSent === 'thumbs_up' ? 'active' : ''}`}
            onClick={() => handleThumb('thumbs_up')}
            title="Helpful / Accurate"
          >
            👍
          </button>
          <button 
            className={`btn-feedback ${feedbackSent === 'thumbs_down' ? 'active' : ''}`}
            onClick={() => handleThumb('thumbs_down')}
            title="Inaccurate / Misclassified"
          >
            👎
          </button>
        </div>
      </div>
      {feedbackSent && (
        <p style={{ fontSize: '0.75rem', color: '#34d399', textAlign: 'right', marginTop: '6px' }}>
          ✓ Feedback saved to database for model retraining!
        </p>
      )}
    </div>
  );
}
