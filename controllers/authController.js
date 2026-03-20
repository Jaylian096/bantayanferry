const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'bantayan_secret';
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

// USER REGISTER
exports.registerUser = async (req, res) => {
  try {
    const { full_name, email, password, contact_number } = req.body;
    if (!full_name || !email || !password) return res.status(400).json({ message: 'Missing required fields' });
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password, contact_number) VALUES (?,?,?,?)',
      [full_name, email, hashed, contact_number || null]
    );
    const token = jwt.sign({ id: result.insertId, email, role: 'user' }, SECRET, { expiresIn: EXPIRES });
    res.status(201).json({ message: 'Registration successful', token, user: { id: result.insertId, full_name, email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// USER LOGIN
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
    if (rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: 'user' }, SECRET, { expiresIn: EXPIRES });
    res.json({ message: 'Login successful', token, user: { id: user.id, full_name: user.full_name, email: user.email, contact_number: user.contact_number } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ADMIN LOGIN
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM admins WHERE email = ? AND is_active = 1', [email]);
    if (rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, SECRET, { expiresIn: EXPIRES });
    res.json({ message: 'Admin login successful', token, admin: { id: admin.id, full_name: admin.full_name, email: admin.email, role: admin.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
