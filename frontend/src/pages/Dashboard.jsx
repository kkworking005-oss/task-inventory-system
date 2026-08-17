import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TasksPanel from '../components/TasksPanel';
import InventoryPanel from '../components/InventoryPanel';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('tasks');
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Task & Inventory Manager</h1>
        <div className="header-right">
          <span>Hi, {user?.name}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <nav className="tabs">
        <button className={tab === 'tasks' ? 'active' : ''} onClick={() => setTab('tasks')}>
          Tasks
        </button>
        <button className={tab === 'inventory' ? 'active' : ''} onClick={() => setTab('inventory')}>
          Inventory
        </button>
      </nav>

      {tab === 'tasks' ? <TasksPanel /> : <InventoryPanel />}
    </div>
  );
}
