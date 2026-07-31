import React, { useState, useEffect } from 'react';
import { 
  IconThumbsUp, 
  IconThumbsDown, 
  IconCheckCircle, 
  IconCpu, 
  IconSparkles, 
  IconUser, 
  IconClock, 
  IconAlertTriangle,
  IconCalendar
} from './Icons';

export default function ResultCard({ result, onFeedback, currentTaskTitle, currentTaskDescription, apiHost }) {
  const [feedbackSent, setFeedbackSent] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [predLoading, setPredLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
  const [saveError, setSaveError] = useState('');

  // Fetch user options when the card is active
  useEffect(() => {
    fetch(`${apiHost}/api/users`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
      })
      .then(setUsers)
      .catch((err) => console.error('Error fetching users:', err));
  }, [apiHost]);

  // Reset assignment state when classification result changes
  useEffect(() => {
    setSelectedUserId('');
    setPrediction(null);
    setSaveStatus('idle');
    setSaveError('');
  }, [result]);

  // Fetch prediction when assigned user changes
  useEffect(() => {
    if (!selectedUserId || !result) {
      setPrediction(null);
      return;
    }

    setPredLoading(true);
    setSaveStatus('idle');
    setSaveError('');

    fetch(`${apiHost}/api/predict-completion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: selectedUserId,
        title: currentTaskTitle,
        description: currentTaskDescription || '',
        planned_start_date: new Date().toISOString()
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to compute prediction');
        return res.json();
      })
      .then((data) => {
        setPrediction(data);
      })
      .catch((err) => {
        console.error(err);
        setSaveError('Error predicting completion time.');
      })
      .finally(() => {
        setPredLoading(false);
      });
  }, [selectedUserId, result, currentTaskTitle, currentTaskDescription, apiHost]);

  if (!result) {
    return (
      <div className="glass-card empty-state">
        <div className="empty-icon-wrapper">
          <IconCpu size={36} />
        </div>
        <h3>No Active Prediction</h3>
        <p style={{ marginTop: '8px', fontSize: '0.88rem' }}>
          Enter a task title and description on the left or select a quick test preset to see AI priority predictions.
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

  const handleAssignAndSave = () => {
    if (!selectedUserId || !prediction) return;

    setSaveStatus('saving');
    setSaveError('');

    fetch(`${apiHost}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: currentTaskTitle,
        description: currentTaskDescription || '',
        priority: result.priority,
        user_id: selectedUserId,
        planned_start_date: prediction.prediction.planned_start,
        predicted_completion: prediction.prediction.predicted_completion,
        hours_required: prediction.prediction.efficiency_adjusted_hours
      })
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Failed to save task.');
        }
        return res.json();
      })
      .then(() => {
        setSaveStatus('saved');
      })
      .catch((err) => {
        console.error(err);
        setSaveStatus('error');
        setSaveError(err.message || 'Error occurred while saving task.');
      });
  };

  return (
    <div className={`glass-card result-card ${priorityLower}`}>
      <div className="result-header">
        <span className={`priority-badge ${priorityLower}`}>
          <span className="badge-dot"></span>
          {result.priority} Priority
        </span>

        <span className="model-tag">
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
        <div className="reason-title">Automated Classification Reason</div>
        <div>{result.reason}</div>
      </div>

      {result.probabilities && (
        <div style={{ marginTop: '18px' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>
            Class Probability Distribution:
          </p>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
            <div><span style={{ color: 'var(--high-red)' }}>High:</span> {(result.probabilities.High * 100).toFixed(1)}%</div>
            <div><span style={{ color: 'var(--med-amber)' }}>Medium:</span> {(result.probabilities.Medium * 100).toFixed(1)}%</div>
            <div><span style={{ color: 'var(--low-green)' }}>Low:</span> {(result.probabilities.Low * 100).toFixed(1)}%</div>
          </div>
        </div>
      )}

      {/* ─── NEW: Task Assignment Flow ─── */}
      <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.92rem', color: 'var(--text-bright)' }}>
          <IconUser size={16} /> Assign Task
        </h4>
        
        <div className="form-group" style={{ marginBottom: '12px' }}>
          <select 
            id="assign-user-select"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-bright)',
              outline: 'none'
            }}
          >
            <option value="">Select team member...</option>
            {users.map(u => (
              <option key={u.user_id} value={u.user_id} style={{ backgroundColor: '#1e1e38' }}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>

        {predLoading && (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', animation: 'pulse 1.5s infinite' }}>
            Predicting completion timeline for assignee...
          </p>
        )}

        {prediction && !predLoading && (
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.02)',
            borderRadius: '8px',
            padding: '14px',
            border: '1px solid rgba(255,255,255,0.05)',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-bright)', marginBottom: '8px' }}>
              <IconClock size={14} /> Completion Prediction
            </div>
            
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
              <div>Adjusted Time:</div>
              <div style={{ color: 'var(--text-bright)', fontWeight: 500 }}>{prediction.prediction.efficiency_adjusted_hours} hrs</div>
              
              <div>Est. Completion:</div>
              <div style={{ color: 'var(--text-bright)', fontWeight: 500 }}>{prediction.prediction.completion_formatted}</div>
            </div>

            {prediction.delay_analysis.delay_warning && (
              <div style={{
                marginTop: '10px',
                padding: '8px 10px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '6px',
                color: '#fca5a5',
                fontSize: '0.78rem',
                display: 'flex',
                gap: '6px',
                alignItems: 'flex-start'
              }}>
                <IconAlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{prediction.delay_analysis.delay_warning}</span>
              </div>
            )}
          </div>
        )}

        {selectedUserId && prediction && (
          <button
            onClick={handleAssignAndSave}
            disabled={saveStatus === 'saving' || saveStatus === 'saved'}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              cursor: (saveStatus === 'saving' || saveStatus === 'saved') ? 'not-allowed' : 'pointer',
              backgroundColor: saveStatus === 'saved' ? 'var(--high-green)' : 'var(--accent-primary)',
              color: '#ffffff',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {saveStatus === 'saving' && 'Saving Assignment...'}
            {saveStatus === 'saved' && (
              <>
                <IconCheckCircle size={16} /> Task Assigned Successfully
              </>
            )}
            {saveStatus === 'idle' && 'Confirm & Assign Task'}
            {saveStatus === 'error' && 'Retry Assignment'}
          </button>
        )}

        {saveError && (
          <p style={{ color: 'var(--high-red)', fontSize: '0.8rem', marginTop: '8px' }}>{saveError}</p>
        )}
      </div>

      {/* Stretch Goal: Feedback Buttons */}
      <div className="feedback-section" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="feedback-label">Is this suggested priority accurate?</span>
        <div className="feedback-btns">
          <button 
            className={`btn-feedback ${feedbackSent === 'thumbs_up' ? 'active' : ''}`}
            onClick={() => handleThumb('thumbs_up')}
            title="Helpful / Accurate"
          >
            <IconThumbsUp size={16} />
          </button>
          <button 
            className={`btn-feedback ${feedbackSent === 'thumbs_down' ? 'active' : ''}`}
            onClick={() => handleThumb('thumbs_down')}
            title="Inaccurate / Misclassified"
          >
            <IconThumbsDown size={16} />
          </button>
        </div>
      </div>
      {feedbackSent && (
        <div style={{ fontSize: '0.78rem', color: '#34d399', textAlign: 'right', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <IconCheckCircle size={14} /> Feedback saved to database for retraining.
        </div>
      )}
    </div>
  );
}
