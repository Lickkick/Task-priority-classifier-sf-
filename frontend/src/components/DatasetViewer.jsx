import React, { useEffect, useState } from 'react';

export default function DatasetViewer({ apiHost }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const host = apiHost || 'http://localhost:8000';
    fetch(`${host}/api/dataset`)
      .then(async res => {
        const contentType = res.headers.get("content-type");
        if (!res.ok || !contentType || !contentType.includes("application/json")) {
          throw new Error("Invalid response format");
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setTasks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [apiHost]);


  const filteredTasks = tasks.filter(t => {
    const matchesPriority = filterPriority === 'ALL' || t.priority === filterPriority;
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          t.description.toLowerCase().includes(search.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <h2 className="card-title" style={{ margin: 0 }}>
          📁 Labelled Task Dataset ({tasks.length} tasks)
        </h2>

        <div style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search tasks..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '220px', padding: '8px 14px' }}
          />

          <select 
            className="form-input"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{ width: '140px', padding: '8px 14px' }}
          >
            <option value="ALL">All Priorities</option>
            <option value="High">High Only</option>
            <option value="Medium">Medium Only</option>
            <option value="Low">Low Only</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="empty-icon">⌛</div>
          <p>Loading dataset...</p>
        </div>
      ) : (
        <div className="dataset-table-container">
          <table className="dataset-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Task Title & Description</th>
                <th style={{ width: '120px' }}>Priority</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t) => {
                const priorityLower = t.priority.toLowerCase();
                return (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>#{t.id}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.title}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {t.description}
                      </div>
                    </td>
                    <td>
                      <span className={`priority-badge ${priorityLower}`} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                        {t.priority}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
