import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CheckSquare, Square, Plus, Trash2, 
  Save, FileText, ClipboardList 
} from 'lucide-react';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export const Workspace: React.FC = () => {
  useApp();
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('opportunity_os_workspace_tasks');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', text: 'Tailor resume CV to target international standards', completed: false },
      { id: '2', text: 'Clean up GitHub profile landing page & pinning projects', completed: false },
      { id: '3', text: 'Optimize LinkedIn profile summary with current major & GPA', completed: false },
      { id: '4', text: 'Draft outreach messages for recommended alumni mentors', completed: false },
      { id: '5', text: 'Prepare reference list for scholarship & fellowship submissions', completed: false }
    ];
  });

  const [newTaskText, setNewTaskText] = useState('');
  const [notes, setNotes] = useState(() => {
    return localStorage.getItem('opportunity_os_workspace_notes') || '';
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    localStorage.setItem('opportunity_os_workspace_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false
    };
    setTasks([...tasks, newTask]);
    setNewTaskText('');
  };

  const handleToggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleSaveNotes = () => {
    localStorage.setItem('opportunity_os_workspace_notes', notes);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="page-body">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="hero-heading" style={{ fontSize: '28px', marginBottom: '6px' }}>
          Workspace & Planner
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0 }}>
          Manage your application preparation checklist and write cover letter notes.
        </p>
      </div>

      <div className="dashboard-grid">
        {/* Left Column: Tasks */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={18} /> My Application Prep Tasks
          </h3>

          <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Add a new preparation task..."
              value={newTaskText}
              onChange={e => setNewTaskText(e.target.value)}
              className="input-clean"
              style={{ flex: 1, fontSize: '13px', padding: '10px 14px' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '10px 14px', borderRadius: '12px' }}>
              <Plus size={16} />
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {tasks.map(task => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-card)',
                  background: task.completed ? 'var(--bg-tag)' : 'var(--bg-card)',
                  opacity: task.completed ? 0.65 : 1,
                  transition: 'all 0.15s ease'
                }}
              >
                <div
                  onClick={() => handleToggleTask(task.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}
                >
                  <span style={{ color: task.completed ? '#22c55e' : 'var(--text-muted)' }}>
                    {task.completed ? <CheckSquare size={16} /> : <Square size={16} />}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)', textDecoration: task.completed ? 'line-through' : 'none' }}>
                    {task.text}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="btn-ghost"
                  style={{ padding: '6px', border: 'none', background: 'none', color: 'var(--text-muted)' }}
                  title="Delete task"
                >
                  <Trash2 size={14} style={{ color: '#ef4444' }} />
                </button>
              </div>
            ))}

            {tasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                All caught up! Add a task above to get started.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Scratchpad notes */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} /> Essay & CV Scratchpad
            </h3>
            <button
              onClick={handleSaveNotes}
              className="btn-primary"
              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}
            >
              <Save size={13} /> {isSaved ? 'Saved!' : 'Save'}
            </button>
          </div>

          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Type your application ideas, rough drafts, cover letter points or notes here..."
            className="input-clean"
            style={{
              flex: 1,
              minHeight: '280px',
              fontFamily: 'inherit',
              fontSize: '13px',
              lineHeight: 1.6,
              resize: 'none',
              padding: '14px'
            }}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
            Saved automatically in browser local storage.
          </span>
        </div>
      </div>
    </div>
  );
};
export default Workspace;
