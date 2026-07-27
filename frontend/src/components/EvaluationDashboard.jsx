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

  const {
    accuracy,
    dataset_total,
    train_size,
    test_size,
    confusion_matrix,
    error_analysis,
    problem_type,
    selected_model_name,
    metrics_summary,
    model_comparison,
  } = evalData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {model_comparison && (
        <div className="glass-card">
          <h2 className="card-title">
            <IconBarChart size={20} /> Logistic Regression vs SVM Comparison
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            {model_comparison.note} Both models are <strong>{problem_type || 'Classification (Multi-class)'}</strong>.
            R² is for regression; this task uses accuracy, precision, recall, and F1-score.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table className="cm-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Type</th>
                  <th>Accuracy</th>
                  <th>Macro Precision</th>
                  <th>Macro Recall</th>
                  <th>Macro F1</th>
                  <th>Weighted F1</th>
                  <th>Errors</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(model_comparison.models).map(([key, model]) => {
                  const isWinner = model_comparison.winner === key;
                  return (
                    <tr key={key}>
                      <td style={{ fontWeight: 700, color: isWinner ? '#34d399' : 'var(--text-secondary)' }}>
                        {model.display_name}{isWinner ? ' ★' : ''}
                      </td>
                      <td>{model.problem_type}</td>
                      <td>{(model.metrics.accuracy * 100).toFixed(1)}%</td>
                      <td>{model.metrics.macro_precision.toFixed(3)}</td>
                      <td>{model.metrics.macro_recall.toFixed(3)}</td>
                      <td>{model.metrics.macro_f1.toFixed(3)}</td>
                      <td>{model.metrics.weighted_f1.toFixed(3)}</td>
                      <td>{model.misclassified_count}/15</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#34d399', marginTop: '12px' }}>
            {model_comparison.winner_reason}
          </p>
        </div>
      )}

      <div className="glass-card">
        <h2 className="card-title">
          <IconBarChart size={20} /> Selected Model: {selected_model_name || 'TF-IDF + Logistic Regression'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          {problem_type || 'Classification (Multi-class)'} · Train/Test split 45/15
        </p>
        
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
          {metrics_summary && (
            <>
              <div className="stat-card">
                <div className="stat-val">{(metrics_summary.macro_precision * 100).toFixed(1)}%</div>
                <div className="stat-label">Macro Precision</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">{(metrics_summary.macro_recall * 100).toFixed(1)}%</div>
                <div className="stat-label">Macro Recall</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">{(metrics_summary.macro_f1 * 100).toFixed(1)}%</div>
                <div className="stat-label">Macro F1-Score</div>
              </div>
            </>
          )}
        </div>

        {metrics_summary?.per_class && (
          <>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', marginTop: '8px' }}>
              Per-Class Precision, Recall & F1
            </h3>
            <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
              <table className="cm-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Precision</th>
                    <th>Recall</th>
                    <th>F1-Score</th>
                    <th>Support</th>
                  </tr>
                </thead>
                <tbody>
                  {evalData.labels.map((label) => {
                    const cls = metrics_summary.per_class[label];
                    return (
                      <tr key={label}>
                        <td style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{label}</td>
                        <td>{(cls.precision * 100).toFixed(1)}%</td>
                        <td>{(cls.recall * 100).toFixed(1)}%</td>
                        <td>{(cls.f1_score * 100).toFixed(1)}%</td>
                        <td>{cls.support}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

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
