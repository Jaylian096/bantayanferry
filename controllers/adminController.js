const db = require('../config/db');
const bcrypt = require('bcryptjs');

// DASHBOARD STATS
exports.getDashboard = async (req, res) => {
  try {
    const [[{ total_bookings }]] = await db.query('SELECT COUNT(*) AS total_bookings FROM bookings');
    const [[{ total_users }]] = await db.query('SELECT COUNT(*) AS total_users FROM users WHERE is_active = 1');
    const [[{ active_schedules }]] = await db.query('SELECT COUNT(*) AS active_schedules FROM schedules WHERE is_active = 1');
    const [[{ pending_bookings }]] = await db.query("SELECT COUNT(*) AS pending_bookings FROM bookings WHERE status = 'pending'");
    const [[{ verified_bookings }]] = await db.query("SELECT COUNT(*) AS verified_bookings FROM bookings WHERE status = 'verified'");
    res.json({ total_bookings, total_users, active_schedules, pending_bookings, verified_bookings });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// USERS CRUD
exports.getUsers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, full_name, email, contact_number, is_active, created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateUser = async (req, res) => {
  try {
    const { full_name, contact_number, is_active } = req.body;
    await db.query('UPDATE users SET full_name=?, contact_number=?, is_active=? WHERE id=?', [full_name, contact_number, is_active, req.params.id]);
    res.json({ message: 'User updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteUser = async (req, res) => {
  try {
    await db.query('UPDATE users SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deactivated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ADMINS CRUD
exports.getAdmins = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, full_name, email, role, is_active, created_at FROM admins ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createAdmin = async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query('INSERT INTO admins (full_name, email, password, role) VALUES (?,?,?,?)', [full_name, email, hashed, role || 'admin']);
    res.status(201).json({ message: 'Admin created', id: result.insertId });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateAdmin = async (req, res) => {
  try {
    const { full_name, email, role, is_active } = req.body;
    await db.query('UPDATE admins SET full_name=?, email=?, role=?, is_active=? WHERE id=?', [full_name, email, role, is_active, req.params.id]);
    res.json({ message: 'Admin updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteAdmin = async (req, res) => {
  try {
    await db.query('DELETE FROM admins WHERE id = ?', [req.params.id]);
    res.json({ message: 'Admin deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// SHIPPING LINES CRUD
exports.getShippingLines = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM shipping_lines ORDER BY name');
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createShippingLine = async (req, res) => {
  try {
    const { name, description } = req.body;
    const [result] = await db.query('INSERT INTO shipping_lines (name, description) VALUES (?,?)', [name, description]);
    res.status(201).json({ message: 'Shipping line created', id: result.insertId });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateShippingLine = async (req, res) => {
  try {
    const { name, description, is_active } = req.body;
    await db.query('UPDATE shipping_lines SET name=?, description=?, is_active=? WHERE id=?', [name, description, is_active, req.params.id]);
    res.json({ message: 'Shipping line updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteShippingLine = async (req, res) => {
  try {
    await db.query('DELETE FROM shipping_lines WHERE id = ?', [req.params.id]);
    res.json({ message: 'Shipping line deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ROUTES CRUD
exports.getRoutes = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM routes WHERE is_active = 1 ORDER BY origin');
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createRoute = async (req, res) => {
  try {
    const { origin, destination, distance_km } = req.body;
    const [result] = await db.query('INSERT INTO routes (origin, destination, distance_km) VALUES (?,?,?)', [origin, destination, distance_km]);
    res.status(201).json({ message: 'Route created', id: result.insertId });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateRoute = async (req, res) => {
  try {
    const { origin, destination, distance_km, is_active } = req.body;
    await db.query('UPDATE routes SET origin=?, destination=?, distance_km=?, is_active=? WHERE id=?', [origin, destination, distance_km, is_active, req.params.id]);
    res.json({ message: 'Route updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteRoute = async (req, res) => {
  try {
    await db.query('UPDATE routes SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Route deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// SHIPS CRUD
exports.getShips = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT sh.*, sl.name AS shipping_line_name 
      FROM ships sh JOIN shipping_lines sl ON sh.shipping_line_id = sl.id 
      WHERE sh.is_active = 1 ORDER BY sl.name, sh.name`);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createShip = async (req, res) => {
  try {
    const { shipping_line_id, name, capacity, description } = req.body;
    const [result] = await db.query('INSERT INTO ships (shipping_line_id, name, capacity, description) VALUES (?,?,?,?)', [shipping_line_id, name, capacity, description]);
    res.status(201).json({ message: 'Ship created', id: result.insertId });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateShip = async (req, res) => {
  try {
    const { shipping_line_id, name, capacity, description, is_active } = req.body;
    await db.query('UPDATE ships SET shipping_line_id=?, name=?, capacity=?, description=?, is_active=? WHERE id=?', [shipping_line_id, name, capacity, description, is_active, req.params.id]);
    res.json({ message: 'Ship updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteShip = async (req, res) => {
  try {
    await db.query('UPDATE ships SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Ship deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// FARES CRUD
exports.getFares = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT f.*, sl.name AS shipping_line_name, 
             CONCAT(r.origin, ' → ', r.destination) AS route_name
      FROM fares f 
      JOIN shipping_lines sl ON f.shipping_line_id = sl.id
      JOIN routes r ON f.route_id = r.id
      ORDER BY sl.name, r.origin, f.passenger_type`);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createFare = async (req, res) => {
  try {
    const { shipping_line_id, route_id, passenger_type, amount } = req.body;
    const [result] = await db.query('INSERT INTO fares (shipping_line_id, route_id, passenger_type, amount) VALUES (?,?,?,?)', [shipping_line_id, route_id, passenger_type, amount]);
    res.status(201).json({ message: 'Fare created', id: result.insertId });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateFare = async (req, res) => {
  try {
    const { shipping_line_id, route_id, passenger_type, amount } = req.body;
    await db.query('UPDATE fares SET shipping_line_id=?, route_id=?, passenger_type=?, amount=? WHERE id=?', [shipping_line_id, route_id, passenger_type, amount, req.params.id]);
    res.json({ message: 'Fare updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteFare = async (req, res) => {
  try {
    await db.query('DELETE FROM fares WHERE id = ?', [req.params.id]);
    res.json({ message: 'Fare deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// CARGO RATES CRUD
exports.getCargoRates = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT cr.*, sl.name AS shipping_line_name 
      FROM cargo_rates cr JOIN shipping_lines sl ON cr.shipping_line_id = sl.id
      ORDER BY sl.name, cr.cargo_type`);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createCargoRate = async (req, res) => {
  try {
    const { shipping_line_id, cargo_type, amount } = req.body;
    const [result] = await db.query('INSERT INTO cargo_rates (shipping_line_id, cargo_type, amount) VALUES (?,?,?)', [shipping_line_id, cargo_type, amount]);
    res.status(201).json({ message: 'Cargo rate created', id: result.insertId });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateCargoRate = async (req, res) => {
  try {
    const { shipping_line_id, cargo_type, amount } = req.body;
    await db.query('UPDATE cargo_rates SET shipping_line_id=?, cargo_type=?, amount=? WHERE id=?', [shipping_line_id, cargo_type, amount, req.params.id]);
    res.json({ message: 'Cargo rate updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteCargoRate = async (req, res) => {
  try {
    await db.query('DELETE FROM cargo_rates WHERE id = ?', [req.params.id]);
    res.json({ message: 'Cargo rate deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
