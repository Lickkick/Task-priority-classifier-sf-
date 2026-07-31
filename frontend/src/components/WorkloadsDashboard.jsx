import React, { useState, useEffect } from 'react';
import { IconUser, IconClock, IconAlertTriangle, IconCalendar, IconSparkles, IconLayers, IconZap } from './Icons';

// Custom inline SVG for Delete/Trash icon
function IconTrash({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  );
}

function IconPlus({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}

export default function WorkloadsDashboard({ apiHost }) {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Admin Direct Task Assignment Modal State
  const [showModal, setShowModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [workHours, setWorkHours] = useState('8');
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 16));
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, tasksRes] = await Promise.all([
        fetch(`${apiHost}/api/users`),
        fetch(`${apiHost}/api/tasks`)
      ]);

      if (!usersRes.ok || !tasksRes.ok) {
        throw new Error('Failed to load workload data');
      }

      const usersData = await usersRes.json();
      const tasksData = await tasksRes.json();

      setUsers(usersData);
      setTasks(tasksData);

      if (usersData.length > 0 && !selectedUserId) {
        setSelectedUserId(usersData[0].user_id);
      }
      if (usersData.length > 0 && !assigneeId) {
        setAssigneeId(usersData[0].user_id);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error fetching team workloads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [apiHost]);

  // Adjust default work hours recommendation based on priority & assignee efficiency
  useEffect(() => {
    if (!assigneeId) return;
    const u = users.find(usr => usr.user_id === assigneeId);
    if (!u) return;

    let base = 8;
    if (priority === 'High') base = 14;
    if (priority === 'Low') base = 3;

    const adjusted = Math.round((base / u.efficiency_score) * 10) / 10;
    setWorkHours(adjusted.toString());
  }, [priority, assigneeId, users]);

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to mark this task as completed or remove it?')) {
      return;
    }
    try {
      const res = await fetch(`${apiHost}/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete task');
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error(err);
      alert('Could not complete the request.');
    }
  };

  const handleDirectAssign = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setModalError('Task title is required.');
      return;
    }
    if (!assigneeId) {
      setModalError('Please select a team member.');
      return;
    }
    if (!workHours || parseFloat(workHours) <= 0) {
      setModalError('Please specify valid work hours.');
      return;
    }

    setSubmitting(true);
    setModalError('');

    try {
      const payload = {
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        priority: priority,
        user_id: assigneeId,
        planned_start_date: new Date(startDate).toISOString(),
        hours_required: parseFloat(workHours)
      };

      const res = await fetch(`${apiHost}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to create task.');
      }

      const createdTask = await res.json();
      setTasks(prev => [...prev, createdTask]);
      
      // Reset form & close modal
      setTaskTitle('');
      setTaskDesc('');
      setShowModal(false);
      
      // Focus on assignee
      setSelectedUserId(assigneeId);
    } catch (err) {
      console.error(err);
      setModalError(err.message || 'Failed to assign task.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card empty-state" style={{ padding: '60px 20px' }}>
        <p className="loading-pulse" style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>
          Retrieving team workloads & resource distribution...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card empty-state">
        <IconAlertTriangle size={40} style={{ color: 'var(--high-red)' }} />
        <h3>System Error</h3>
        <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>{error}</p>
        <button onClick={fetchData} className="btn-submit" style={{ marginTop: '16px', maxWidth: '160px' }}>
          Retry Load
        </button>
      </div>
    );
  }

  const totalTasksCount = tasks.length;
  const totalHours = tasks.reduce((sum, t) => sum + t.hours_required, 0);

  const getUserTasks = (userId) => tasks.filter(t => t.user_id === userId);

  const selectedUser = users.find(u => u.user_id === selectedUserId);
  const activeUserTasks = selectedUser ? getUserTasks(selectedUser.user_id) : [];
  const activeUserHours = activeUserTasks.reduce((sum, t) => sum + t.hours_required, 0);

  return (
    <section className="workloads-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Bar with Title & Direct Assign Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconUser size={24} /> Team Resource & Workload Management
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Direct task assignment, workload distribution, and custom work hours allocation
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            transition: 'all 0.2s'
          }}
        >
          <IconPlus size={18} /> Admin: Assign Task Directly
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Team Tasks</span>
          <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-bright)', lineHeight: 1 }}>
            {totalTasksCount}
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Assigned across active team</span>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cumulative Workload</span>
          <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-bright)', lineHeight: 1 }}>
            {totalHours.toFixed(1)} <span style={{ fontSize: '1rem', fontWeight: 500 }}>hrs</span>
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Configured work hours total</span>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Average Team Efficiency</span>
          <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-primary)', lineHeight: 1 }}>
            {(users.reduce((sum, u) => sum + u.efficiency_score, 0) / users.length * 100).toFixed(0)}%
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Productivity rating</span>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="workloads-grid" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Side: Users List */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconUser size={18} /> Team Members
          </h3>

          <div className="custom-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
            {users.map((u) => {
              const userTasks = getUserTasks(u.user_id);
              const userHours = userTasks.reduce((sum, t) => sum + t.hours_required, 0);
              const isSelected = u.user_id === selectedUserId;
              const hasHeavyLoad = userHours >= 30;

              return (
                <div
                  key={u.user_id}
                  onClick={() => setSelectedUserId(u.user_id)}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.05)'}`,
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: u.avatar_color || '#4f46e5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}>
                      {u.name.split(' ').map(n => n[0]).join('')}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: isSelected ? '#ffffff' : 'var(--text-bright)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {u.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {u.role}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-bright)' }}>
                        {userTasks.length} {userTasks.length === 1 ? 'task' : 'tasks'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: hasHeavyLoad ? 'var(--high-red)' : 'var(--text-muted)' }}>
                        {userHours.toFixed(1)}h
                      </div>
                    </div>
                  </div>

                  {hasHeavyLoad && (
                    <div 
                      title="Heavy workload: exceeds 30 estimated hours."
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--high-red)'
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Active User Details & Task List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {selectedUser && (
            <div className="glass-card" style={{ padding: '24px', position: 'relative' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: selectedUser.avatar_color || '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  color: '#ffffff',
                  fontSize: '1.4rem'
                }}>
                  {selectedUser.name.split(' ').map(n => n[0]).join('')}
                </div>

                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-bright)' }}>
                    {selectedUser.name}
                  </h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{selectedUser.role}</p>
                </div>

                <div style={{ display: 'flex', gap: '20px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '12px 18px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Efficiency</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--high-green)' }}>{(selectedUser.efficiency_score * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Work Schedule</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>{selectedUser.work_schedule.work_days.length} days/wk</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Daily Hours</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>{selectedUser.avg_hours_per_day} hrs/day</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Tasks List */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconLayers size={18} /> Assigned Tasks ({activeUserTasks.length})
              </h3>
              {activeUserHours > 0 && (
                <span style={{ fontSize: '0.88rem', color: activeUserHours >= 30 ? 'var(--high-red)' : 'var(--text-muted)', fontWeight: 600 }}>
                  Active Workload: {activeUserHours.toFixed(1)} hrs
                </span>
              )}
            </div>

            {activeUserTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <IconSparkles size={32} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '12px' }} />
                <h4>No Tasks Assigned</h4>
                <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                  Use "Admin: Assign Task Directly" above or the Classifier Workspace to assign a new task to {selectedUser?.name}.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeUserTasks.map((t) => {
                  const priorityLower = t.priority.toLowerCase();

                  return (
                    <div
                      key={t.id}
                      className={`result-card ${priorityLower}`}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        backgroundColor: 'rgba(255,255,255,0.01)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div>
                          <span className={`priority-badge ${priorityLower}`} style={{ marginBottom: '8px', display: 'inline-flex' }}>
                            <span className="badge-dot"></span>
                            {t.priority}
                          </span>
                          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-bright)' }}>{t.title}</h4>
                          {t.description && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                              {t.description}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          title="Complete and remove task"
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#f87171',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                          }}
                        >
                          <IconTrash size={15} />
                        </button>
                      </div>

                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '16px',
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <IconCalendar size={14} />
                          <span>Start: {new Date(t.planned_start_date).toLocaleDateString()}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <IconClock size={14} />
                          <span>Est. Completion: {new Date(t.predicted_completion).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div style={{ marginLeft: 'auto', fontWeight: 600, color: 'var(--text-bright)' }}>
                          Allocated Hours: {t.hours_required} hrs
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Direct Task Assignment Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '520px',
            padding: '28px',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconZap size={20} style={{ color: 'var(--accent-primary)' }} /> Admin: Direct Task Assignment
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDirectAssign} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)', marginBottom: '6px' }}>
                  Task Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Optimize Redis caching layer for API gateway..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'var(--text-bright)',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)', marginBottom: '6px' }}>
                  Task Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Add details or context for the assignee..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'var(--text-bright)',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)', marginBottom: '6px' }}>
                    Assignee <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'var(--text-bright)',
                      outline: 'none'
                    }}
                  >
                    {users.map(u => (
                      <option key={u.user_id} value={u.user_id} style={{ backgroundColor: '#1e1e38' }}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)', marginBottom: '6px' }}>
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'var(--text-bright)',
                      outline: 'none'
                    }}
                  >
                    <option value="High" style={{ backgroundColor: '#1e1e38' }}>High Priority</option>
                    <option value="Medium" style={{ backgroundColor: '#1e1e38' }}>Medium Priority</option>
                    <option value="Low" style={{ backgroundColor: '#1e1e38' }}>Low Priority</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)', marginBottom: '6px' }}>
                    Allocated Work Hours <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={workHours}
                    onChange={(e) => setWorkHours(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'var(--text-bright)',
                      outline: 'none'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)', marginBottom: '6px' }}>
                    Planned Start
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'var(--text-bright)',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {modalError && (
                <div style={{ color: '#f87171', fontSize: '0.82rem' }}>{modalError}</div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-bright)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'var(--accent-primary)',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? 'Assigning Task...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}
