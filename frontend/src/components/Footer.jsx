import React from 'react';

export default function Footer() {
  return (
    <footer style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
      <p>
        <strong>SFCollab Task Priority Classifier</strong> — Built with FastAPI, Scikit-Learn (TF-IDF + Logistic Regression), and React (Vite).
      </p>
      <p style={{ marginTop: '6px', fontSize: '0.78rem' }}>
        Designed for Free-Tier Deployment on Render and Vercel. 100% Zero Client Secrets.
      </p>
    </footer>
  );
}
