import React from 'react';

export default function Header({ activeTab, setActiveTab }) {
  return (
    <header className="header">
      <div className="brand-wrapper">
        <div className="brand-logo">⚡</div>
        <div>
          <h1 className="brand-title">SFCollab Priority AI</h1>
          <p className="brand-subtitle">Automated Task Priority Classifier (TF-IDF + Logistic Regression)</p>
        </div>
      </div>

      <nav className="nav-tabs">
        <button 
          className={`nav-btn ${activeTab === 'classifier' ? 'active' : ''}`}
          onClick={() => setActiveTab('classifier')}
        >
          🎯 Classifier Workspace
        </button>
        <button 
          className={`nav-btn ${activeTab === 'evaluation' ? 'active' : ''}`}
          onClick={() => setActiveTab('evaluation')}
        >
          📊 Model Evaluation (45/15)
        </button>
        <button 
          className={`nav-btn ${activeTab === 'dataset' ? 'active' : ''}`}
          onClick={() => setActiveTab('dataset')}
        >
          📁 Labelled Dataset (60)
        </button>
      </nav>
    </header>
  );
}
