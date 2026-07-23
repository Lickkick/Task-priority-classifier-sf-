import React from 'react';
import { IconCpu, IconBarChart, IconDatabase, IconLayers, IconSparkles } from './Icons';

export default function Header({ activeTab, setActiveTab }) {
  return (
    <header className="header">
      <div className="brand-wrapper" onClick={() => setActiveTab('landing')} style={{ cursor: 'pointer' }}>
        <div className="brand-logo">
          <IconCpu size={22} />
        </div>
        <div>
          <h1 className="brand-title">SFCollab Priority AI</h1>
          <p className="brand-subtitle">Automated Task Priority Intelligence System</p>
        </div>
      </div>

      <nav className="nav-tabs">
        <button 
          className={`nav-btn ${activeTab === 'landing' ? 'active' : ''}`}
          onClick={() => setActiveTab('landing')}
        >
          <IconSparkles size={16} /> Overview
        </button>
        <button 
          className={`nav-btn ${activeTab === 'classifier' ? 'active' : ''}`}
          onClick={() => setActiveTab('classifier')}
        >
          <IconLayers size={16} /> Classifier Workspace
        </button>
        <button 
          className={`nav-btn ${activeTab === 'evaluation' ? 'active' : ''}`}
          onClick={() => setActiveTab('evaluation')}
        >
          <IconBarChart size={16} /> Model Evaluation (45/15)
        </button>
        <button 
          className={`nav-btn ${activeTab === 'dataset' ? 'active' : ''}`}
          onClick={() => setActiveTab('dataset')}
        >
          <IconDatabase size={16} /> Labelled Dataset (60)
        </button>
      </nav>
    </header>
  );
}
