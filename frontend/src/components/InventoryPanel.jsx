import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function InventoryPanel() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', sku: '', quantity: 0, unit_price: 0, reorder_level: 5 });
  const [error, setError] = useState('');

  const loadItems = async () => {
    try {
      setItems(await api.getInventory(token));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      await api.createItem(form, token);
      setForm({ name: '', sku: '', quantity: 0, unit_price: 0, reorder_level: 5 });
      loadItems();
    } catch (err) {
      setError(err.message);
    }
  };

  const adjustQuantity = async (item, delta) => {
    const nextQty = Math.max(0, item.quantity + delta);
    await api.updateItem(item.id, { quantity: nextQty }, token);
    loadItems();
  };

  const remove = async (id) => {
    await api.deleteItem(id, token);
    loadItems();
  };

  return (
    <div className="panel">
      <h2>Inventory</h2>
      {error && <p className="error-text">{error}</p>}

      <form className="inline-form" onSubmit={handleAdd}>
        <input placeholder="Item name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        <input
          type="number"
          placeholder="Qty"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Unit price"
          value={form.unit_price}
          onChange={(e) => setForm({ ...form, unit_price: Number(e.target.value) })}
        />
        <button type="submit">Add Item</button>
      </form>

      <ul className="item-list">
        {items.map((item) => (
          <li key={item.id} className={`item-row ${item.low_stock ? 'low-stock' : ''}`}>
            <div>
              <strong>{item.name}</strong>
              {item.sku && <span className="badge">{item.sku}</span>}
              {item.low_stock && <span className="badge warning">Low stock</span>}
              <span className="due">Qty: {item.quantity} · ${Number(item.unit_price).toFixed(2)}</span>
            </div>
            <div className="row-actions">
              <button onClick={() => adjustQuantity(item, -1)}>-1</button>
              <button onClick={() => adjustQuantity(item, 1)}>+1</button>
              <button className="danger" onClick={() => remove(item.id)}>Delete</button>
            </div>
          </li>
        ))}
        {items.length === 0 && <p className="empty-state">No inventory items yet — add one above.</p>}
      </ul>
    </div>
  );
}
