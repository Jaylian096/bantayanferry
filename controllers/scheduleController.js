const db = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const { shipping_line_id, route_id } = req.query;
    let query = `
      SELECT s.*, sh.name AS ship_name, sh.capacity,
             sl.name AS shipping_line_name,
             CONCAT(r.origin, ' → ', r.destination) AS route_name,
             r.origin, r.destination, r.id AS route_id
      FROM schedules s
      JOIN ships sh ON s.ship_id = sh.id
      JOIN shipping_lines sl ON s.shipping_line_id = sl.id
      JOIN routes r ON s.route_id = r.id
      WHERE s.is_active = 1`;
    const params = [];
    if (shipping_line_id) { query += ' AND s.shipping_line_id = ?'; params.push(shipping_line_id); }
    if (route_id) { query += ' AND s.route_id = ?'; params.push(route_id); }
    query += ' ORDER BY s.departure_time';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, sh.name AS ship_name, sh.capacity,
             sl.name AS shipping_line_name,
             CONCAT(r.origin, ' → ', r.destination) AS route_name,
             r.origin, r.destination
      FROM schedules s
      JOIN ships sh ON s.ship_id = sh.id
      JOIN shipping_lines sl ON s.shipping_line_id = sl.id
      JOIN routes r ON s.route_id = r.id
      WHERE s.id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Schedule not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { ship_id, route_id, shipping_line_id, departure_time, arrival_time, available_days } = req.body;
    const [result] = await db.query(
      'INSERT INTO schedules (ship_id, route_id, shipping_line_id, departure_time, arrival_time, available_days) VALUES (?,?,?,?,?,?)',
      [ship_id, route_id, shipping_line_id, departure_time, arrival_time, available_days || 'daily']
    );
    res.status(201).json({ message: 'Schedule created', id: result.insertId });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { ship_id, route_id, shipping_line_id, departure_time, arrival_time, available_days, is_active } = req.body;
    await db.query(
      'UPDATE schedules SET ship_id=?, route_id=?, shipping_line_id=?, departure_time=?, arrival_time=?, available_days=?, is_active=? WHERE id=?',
      [ship_id, route_id, shipping_line_id, departure_time, arrival_time, available_days, is_active, req.params.id]
    );
    res.json({ message: 'Schedule updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await db.query('UPDATE schedules SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Schedule deactivated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
