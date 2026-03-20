const db = require('../config/db');

exports.getFares = async (req, res) => {
  const { shipping_line_id, route_id } = req.query;
  try {
    let q = `SELECT f.*, sl.name AS shipping_line, r.origin, r.destination FROM fares f
             JOIN shipping_lines sl ON f.shipping_line_id=sl.id
             JOIN routes r ON f.route_id=r.id WHERE 1=1`;
    const p = [];
    if (shipping_line_id) { q += ' AND f.shipping_line_id=?'; p.push(shipping_line_id); }
    if (route_id) { q += ' AND f.route_id=?'; p.push(route_id); }
    const [rows] = await db.query(q, p);
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.upsertFare = async (req, res) => {
  const { shipping_line_id, route_id, passenger_type, fare_amount } = req.body;
  try {
    await db.query(
      'INSERT INTO fares (shipping_line_id, route_id, passenger_type, fare_amount) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE fare_amount=?',
      [shipping_line_id, route_id, passenger_type, fare_amount, fare_amount]
    );
    res.json({ message: 'Fare saved' });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.deleteFare = async (req, res) => {
  try {
    await db.query('DELETE FROM fares WHERE id=?', [req.params.id]);
    res.json({ message: 'Fare deleted' });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.getCargoRates = async (req, res) => {
  const { shipping_line_id } = req.query;
  try {
    let q = `SELECT cr.*, sl.name AS shipping_line FROM cargo_rates cr JOIN shipping_lines sl ON cr.shipping_line_id=sl.id WHERE 1=1`;
    const p = [];
    if (shipping_line_id) { q += ' AND cr.shipping_line_id=?'; p.push(shipping_line_id); }
    const [rows] = await db.query(q, p);
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.upsertCargoRate = async (req, res) => {
  const { shipping_line_id, cargo_type, rate_amount } = req.body;
  try {
    await db.query(
      'INSERT INTO cargo_rates (shipping_line_id, cargo_type, rate_amount) VALUES (?,?,?) ON DUPLICATE KEY UPDATE rate_amount=?',
      [shipping_line_id, cargo_type, rate_amount, rate_amount]
    );
    res.json({ message: 'Cargo rate saved' });
  } catch(e) { res.status(500).json({ error: e.message }); }
};
