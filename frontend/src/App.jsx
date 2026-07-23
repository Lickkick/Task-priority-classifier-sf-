import React, { useState } from 'react';
import Header from './components/Header';
import TaskForm from './components/TaskForm';
import ResultCard from './components/ResultCard';
import EvaluationDashboard from './components/EvaluationDashboard';
import DatasetViewer from './components/DatasetViewer';
import Footer from './components/Footer';

// Default API host URL (uses window origin or proxy in dev)
const API_HOST = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [activeTab, setActiveTab] = useState('classifier');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTaskTitle, setCurrentTaskTitle] = useState('');

  const handleClassify = async ({ title, description }) => {
    setIsLoading(true);
    setError(null);
    setCurrentTaskTitle(title);

    try {
      const response = await fetch(`${API_HOST}/api/classify-priority`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to classify task priority.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Classification error:", err);
      setError(err.message || "Could not connect to classification backend service.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (feedbackPayload) => {
    try {
      await fetch(`${API_HOST}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackPayload),
      });
    } catch (err) {
      console.warn("Feedback submission failed:", err);
    }
  };

  return (
    <div className="app-container">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main>
        {activeTab === 'classifier' && (
          <div className="main-grid">
            <TaskForm onClassify={handleClassify} isLoading={isLoading} error={error} />
            <ResultCard 
              result={result} 
              onFeedback={handleFeedback} 
              currentTaskTitle={currentTaskTitle} 
            />
          </div>
        )}

        {activeTab === 'evaluation' && (
          <EvaluationDashboard apiHost={API_HOST} />
        )}

        {activeTab === 'dataset' && (
          <DatasetViewer apiHost={API_HOST} />
        )}
      </main>

      <Footer />
    </div>
  );
}
