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
          <div className="stat-item">
            <div className="stat-number">100%</div>
            <div className="stat-desc">Zero Frontend Secrets</div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="features-section">
        <h2 className="section-title">Engineered for Transparency and Precision</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <IconCpu size={24} />
            </div>
            <h3>Scikit-Learn Classifier</h3>
            <p>
              Combines TF-IDF unigrams and bigrams with a balanced Logistic Regression model to calculate exact class probabilities.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <IconBarChart size={24} />
            </div>
            <h3>Audited Evaluation Engine</h3>
            <p>
              Features an interactive 3x3 confusion matrix table, classification report, and qualitative error analysis on held-back test cases.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <IconShieldAlert size={24} />
            </div>
            <h3>Pydantic Input Security</h3>
            <p>
              FastAPI backend validates inputs and strictly rejects missing or empty task titles with HTTP 400 Bad Request status codes.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <IconCheckCircle size={24} />
            </div>
            <h3>One-Line Reasoning</h3>
            <p>
              Generates deterministic human-readable explanations based on key technical domain trigger indicators found in task descriptions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
