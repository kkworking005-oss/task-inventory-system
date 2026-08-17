import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function TasksPanel() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '' });
  const [error, setError] = useState('');

  const loadTasks = async () => {
    try {
      setTasks(await api.getTasks(token));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      await api.createTask(form, token);
      setForm({ title: '', description: '', priority: 'medium', due_date: '' });
      loadTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleStatus = async (task) => {
    const next = task.status === 'completed' ? 'pending' : 'completed';
    await api.updateTask(task.id, { status: next }, token);
    loadTasks();
  };

  const remove = async (id) => {
    await api.deleteTask(id, token);
    loadTasks();
  };

  return (
    <div className="panel">
      <h2>Tasks</h2>
      {error && <p className="error-text">{error}</p>}

      <form className="inline-form" onSubmit={handleAdd}>
        <input
          placeholder="Task title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input
          type="date"
          value={form.due_date}
          onChange={(e) => setForm({ ...form, due_date: e.target.value })}
        />
        <button type="submit">Add Task</button>
      </form>

      <ul className="item-list">
        {tasks.map((t) => (
          <li key={t.id} className={`item-row ${t.status === 'completed' ? 'done' : ''}`}>
            <div>
              <strong>{t.title}</strong>
              <span className={`badge priority-${t.priority}`}>{t.priority}</span>
              {t.due_date && <span className="due">Due {new Date(t.due_date).toLocaleDateString()}</span>}
            </div>
            <div className="row-actions">
              <button onClick={() => toggleStatus(t)}>{t.status === 'completed' ? 'Reopen' : 'Complete'}</button>
              <button className="danger" onClick={() => remove(t.id)}>Delete</button>
            </div>
          </li>
        ))}
        {tasks.length === 0 && <p className="empty-state">No tasks yet — add one above.</p>}
      </ul>
    </div>
  );
}
