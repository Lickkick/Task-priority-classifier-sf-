import React, { useEffect, useState } from 'react';
import { IconBarChart, IconAlertTriangle, IconCheckCircle } from './Icons';

export default function EvaluationDashboard({ apiHost }) {
  const [evalData, setEvalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const host = apiHost || 'http://localhost:8000';
    fetch(`${host}/api/evaluation`)
      .then(async res => {
        const contentType = res.headers.get("content-type");
        if (!res.ok || !contentType || !contentType.includes("application/json")) {
          throw new Error("Backend API unavailable. Ensure FastAPI server is running or VITE_API_URL is configured.");
        }
        return res.json();
      })
      .then(data => {
        setEvalData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || "Failed to load evaluation metrics.");
        setLoading(false);
      });
  }, [apiHost]);

  if (loading) {
    return (
      <div className="glass-card empty-state">
        <div className="empty-icon-wrapper">
          <IconBarChart size={36} />
        </div>
        <h3>Loading Evaluation Metrics...</h3>
      </div>
    );
  }

  if (error || !evalData) {
    return (
      <div className="glass-card empty-state">
        <div className="empty-icon-wrapper">
          <IconAlertTriangle size={36} />
        </div>
        <h3>Evaluation Data Unavailable</h3>
        <p style={{ marginTop: '8px', fontSize: '0.88rem', color: '#f87171' }}>
          {error || "Run 'python train.py' on the backend to generate metrics."}
        </p>
      </div>
    );
  }

  const { accuracy, dataset_total, train_size, test_size, confusion_matrix, error_analysis } = evalData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-card">
        <h2 className="card-title">
          <IconBarChart size={20} /> Model Train-Test Evaluation Metrics (45/15 Split)
        </h2>
        
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-val">{dataset_total}</div>
            <div className="stat-label">Total Labelled Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{train_size}</div>
            <div className="stat-label">Training Set (75%)</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{test_size}</div>
            <div className="stat-label">Held-back Test (25%)</div>
          </div>
          <div className="stat-card">
            <div className="stat-val acc">{(accuracy * 100).toFixed(1)}%</div>
            <div className="stat-label">Test Accuracy</div>
          </div>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>
          3x3 Confusion Matrix (True vs Predicted)
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="cm-table">
            <thead>
              <tr>
                <th>True \ Predicted</th>
                <th>High</th>
                <th>Medium</th>
                <th>Low</th>
              </tr>
            </thead>
            <tbody>
              {evalData.labels.map((trueLabel, rIdx) => (
                <tr key={rIdx}>
                  <td style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{trueLabel}</td>
                  {confusion_matrix[rIdx].map((val, cIdx) => {
                    const isMatch = rIdx === cIdx;
                    return (
                      <td key={cIdx} className={isMatch ? 'cm-cell-match' : val > 0 ? 'cm-cell-error' : ''}>
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card">
        <h2 className="card-title">
          <IconAlertTriangle size={20} /> Hardest Class & Error Analysis
        </h2>

        <div style={{ background: 'rgba(20, 20, 20, 0.8)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
          <p style={{ fontSize: '0.9rem', color: '#f59e0b', fontWeight: 700, marginBottom: '6px' }}>
            Hardest Class: {error_analysis.hardest_class} Priority
          </p>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            {error_analysis.hardest_class_explanation}
          </p>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>
          Misclassified Test Cases ({error_analysis.misclassified_count} found)
        </h3>

        {error_analysis.error_cases.length === 0 ? (
          <p style={{ color: '#34d399', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconCheckCircle size={18} /> Zero misclassifications on held-back test set.
          </p>
        ) : (
          error_analysis.error_cases.map((caseItem, idx) => (
            <div key={idx} className="error-item">
              <div className="error-title">#{caseItem.id} — {caseItem.title}</div>
              <div className="error-desc" style={{ marginTop: '4px' }}>
                <span style={{ color: '#34d399', fontWeight: 600 }}>True: {caseItem.true_priority}</span> |{' '}
                <span style={{ color: '#f87171', fontWeight: 600 }}>Predicted: {caseItem.predicted_priority}</span>{' '}
                <span style={{ color: 'var(--text-muted)' }}>(Confidence: {(caseItem.confidence * 100).toFixed(1)}%)</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
                Reason: {caseItem.reason_for_error}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
