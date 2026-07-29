import React from 'react';

export default function LandingPage({ onLaunchClassifier, onLaunchEvaluation, onLaunchPredictor }) {
  return (
    <div className="lp-root">

      {/* ── TOP BAR ── */}
      <header className="lp-topbar">
        <span className="lp-topbar-left">SFCOLLAB / AI</span>
        <span className="lp-topbar-right">TASK PRIORITY CLASSIFIER</span>
      </header>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <p className="lp-eyebrow">TF-IDF + Logistic Regression · ML classifier</p>
        <h1 className="lp-headline">
          STOP GUESSING.<br />
          CLASSIFY WITH<br />
          <span className="lp-headline-accent">CONFIDENCE.</span>
        </h1>

        <div className="lp-hero-bottom">
          <p className="lp-hero-desc">
            Predicts High, Medium, or Low priority<br />
            from your task title and description.<br />
            Audited on a 45 / 15 stratified split.
          </p>

          {/* accent box top right */}
          <button className="lp-accent-box" onClick={onLaunchClassifier} aria-label="Launch classifier">
            <span className="lp-accent-arrow">↗</span>
          </button>
        </div>
      </section>

      {/* ── BENTO GRID ── */}
      <section className="lp-bento">
        <div className="lp-bento-header">
          <span className="lp-section-label">01 — FEATURES</span>
          <h2 className="lp-bento-title">THREE CORE MODULES.</h2>
        </div>

        <div className="lp-bento-grid">
          {/* Card 1 — Accent */}
          <div className="lp-card lp-card--accent" onClick={onLaunchClassifier} style={{cursor:'pointer'}}>
            <span className="lp-card-num">01</span>
            <span className="lp-card-tag">ML CLASSIFIER</span>
            <h3 className="lp-card-name">PRIORITY ENGINE</h3>
          </div>

          {/* Card 2 — Lime */}
          <div className="lp-card lp-card--lime" onClick={onLaunchEvaluation} style={{cursor:'pointer'}}>
            <span className="lp-card-num">02</span>
            <span className="lp-card-tag">EVALUATION</span>
            <h3 className="lp-card-name">TEST METRICS</h3>
          </div>

          {/* Card 3 — Ghost */}
          <div className="lp-card lp-card--ghost" onClick={onLaunchPredictor} style={{cursor:'pointer'}}>
            <span className="lp-card-num">03</span>
            <span className="lp-card-tag">SMART PREDICTOR</span>
            <h3 className="lp-card-name">COMPLETION FORECAST</h3>
          </div>
        </div>
      </section>

      {/* ── ABOUT STRIP ── */}
      <section className="lp-about">
        <span className="lp-section-label lp-section-label--dark">02 — ABOUT</span>
        <div className="lp-about-right">
          <h2 className="lp-about-title">
            A SHARP MODEL.<br />MADE VISIBLE.
          </h2>
          <p className="lp-about-desc">
            Built on scikit-learn, trained on 60 hand-labelled engineering tasks.
            TF-IDF extracts vocabulary signals. Logistic Regression maps them to
            High, Medium, or Low. Every prediction includes a confidence score and
            a one-line human-readable explanation.
          </p>
          <p className="lp-about-tags">PYTHON · FASTAPI · SCIKIT-LEARN · REACT</p>
        </div>
      </section>

      {/* ── CTA STRIP ── */}
      <section className="lp-cta">
        <span className="lp-section-label">03 — GET STARTED</span>
        <h2 className="lp-cta-title">
          HAVE A TASK IN MIND?<br />
          LET'S CLASSIFY IT.
        </h2>
        <div className="lp-cta-actions">
          <button className="lp-cta-btn lp-cta-btn--primary" onClick={onLaunchClassifier}>
            LAUNCH CLASSIFIER ↗
          </button>
          <button className="lp-cta-btn lp-cta-btn--secondary" onClick={onLaunchEvaluation}>
            VIEW EVAL METRICS
          </button>
        </div>
      </section>

    </div>
  );
}
