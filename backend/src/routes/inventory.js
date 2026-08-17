const express = require('express');
const pool = require('../config/db');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// GET /api/inventory - list items, flagged with low_stock when quantity <= reorder_level
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *, (quantity <= reorder_level) AS low_stock
       FROM inventory_items WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// POST /api/inventory - add a new item
router.post('/', async (req, res) => {
  const { name, sku, quantity, unit_price, reorder_level } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const result = await pool.query(
      `INSERT INTO inventory_items (user_id, name, sku, quantity, unit_price, reorder_level)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, name, sku || null, quantity || 0, unit_price || 0, reorder_level || 5]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'SKU already exists' });
    console.error(err.message);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PUT /api/inventory/:id - update an item (e.g. adjust stock)
router.put('/:id', async (req, res) => {
  const { name, quantity, unit_price, reorder_level } = req.body;
  try {
    const result = await pool.query(
      `UPDATE inventory_items SET
         name = COALESCE($1, name),
         quantity = COALESCE($2, quantity),
         unit_price = COALESCE($3, unit_price),
         reorder_level = COALESCE($4, reorder_level),
         updated_at = NOW()
       WHERE id = $5 AND user_id = $6 RETURNING *`,
      [name, quantity, unit_price, reorder_level, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE /api/inventory/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM inventory_items WHERE id = $1 AND user_id = $2 RETURNING id', [
      req.params.id,
      req.user.id,
    ]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router;
