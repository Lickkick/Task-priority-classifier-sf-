import React from 'react';
import { IconSparkles, IconCpu, IconBarChart, IconDatabase, IconArrowRight, IconShieldAlert, IconCheckCircle } from './Icons';

export default function LandingPage({ onLaunchClassifier, onLaunchEvaluation }) {
  return (
    <div className="landing-container">
      {/* Hero Section with Integrated Left-Aligned Stat Cards */}
      <section className="hero-section">
        <div className="hero-badge">
          <IconSparkles size={16} /> SFCollab Enterprise AI Platform
        </div>
        <h1 className="hero-title">
          Automated Task Priority Intelligence for Engineering Teams
        </h1>
        <p className="hero-subtitle">
          Eliminate task board clutter where everything defaults to Medium. Predict High, Medium, or Low priority instantly using an audited TF-IDF + Logistic Regression machine learning model.
        </p>

        <div className="hero-cta-group">
          <button className="btn-primary-lg" onClick={onLaunchClassifier}>
            Launch Classifier Workspace <IconArrowRight size={18} />
          </button>
          <button className="btn-secondary-lg" onClick={onLaunchEvaluation}>
            View Evaluation Metrics (45/15 Split)
          </button>
        </div>

        {/* Compact Left-Anchored Stats Row */}
        <div className="stats-bar">
          <div className="stat-item">
            <div className="stat-number">60</div>
            <div className="stat-desc">Self-Labelled Tasks</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">45 / 15</div>
            <div className="stat-desc">Stratified Train / Test Split</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">66.7%</div>
            <div className="stat-desc">Measured Test Accuracy</div>
          </div>
        </div>
      </section>
    </div>
  );
}
