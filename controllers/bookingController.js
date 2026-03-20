const db = require('../config/db');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const generateBookingCode = () => 'BF-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();

exports.createBooking = async (req, res) => {
  try {
    const { schedule_id, travel_date, full_name, contact_number, passenger_type } = req.body;
    const user_id = req.user.id;

    // Get fare
    const [schedRows] = await db.query('SELECT shipping_line_id, route_id FROM schedules WHERE id = ?', [schedule_id]);
    if (schedRows.length === 0) return res.status(404).json({ message: 'Schedule not found' });
    const { shipping_line_id, route_id } = schedRows[0];

    const [fareRows] = await db.query(
      'SELECT amount FROM fares WHERE shipping_line_id = ? AND route_id = ? AND passenger_type = ?',
      [shipping_line_id, route_id, passenger_type]
    );
    if (fareRows.length === 0) return res.status(404).json({ message: 'Fare not found for this combination' });
    const total_fare = fareRows[0].amount;

    const booking_code = generateBookingCode();
    const qrData = JSON.stringify({ booking_code, user_id, schedule_id, travel_date, passenger_type });
    const qr_code = await QRCode.toDataURL(qrData);

    const [result] = await db.query(
      'INSERT INTO bookings (booking_code, user_id, schedule_id, travel_date, full_name, contact_number, passenger_type, total_fare, qr_code) VALUES (?,?,?,?,?,?,?,?,?)',
      [booking_code, user_id, schedule_id, travel_date, full_name, contact_number, passenger_type, total_fare, qr_code]
    );
    res.status(201).json({ message: 'Booking created', booking_id: result.insertId, booking_code, total_fare, qr_code });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getUserBookings = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT b.*, s.departure_time, s.arrival_time,
             CONCAT(r.origin, ' → ', r.destination) AS route_name,
             sl.name AS shipping_line_name, sh.name AS ship_name
      FROM bookings b
      JOIN schedules s ON b.schedule_id = s.id
      JOIN routes r ON s.route_id = r.id
      JOIN shipping_lines sl ON s.shipping_line_id = sl.id
      JOIN ships sh ON s.ship_id = sh.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC`, [req.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getBookingById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT b.*, s.departure_time, s.arrival_time,
             CONCAT(r.origin, ' → ', r.destination) AS route_name,
             sl.name AS shipping_line_name, sh.name AS ship_name
      FROM bookings b
      JOIN schedules s ON b.schedule_id = s.id
      JOIN routes r ON s.route_id = r.id
      JOIN shipping_lines sl ON s.shipping_line_id = sl.id
      JOIN ships sh ON s.ship_id = sh.id
      WHERE b.id = ? AND b.user_id = ?`, [req.params.id, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Booking not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ADMIN: get all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const { status, shipping_line_id, date } = req.query;
    let query = `
      SELECT b.*, s.departure_time, s.arrival_time,
             CONCAT(r.origin, ' → ', r.destination) AS route_name,
             sl.name AS shipping_line_name, sh.name AS ship_name,
             u.full_name AS user_name, u.email AS user_email
      FROM bookings b
      JOIN schedules s ON b.schedule_id = s.id
      JOIN routes r ON s.route_id = r.id
      JOIN shipping_lines sl ON s.shipping_line_id = sl.id
      JOIN ships sh ON s.ship_id = sh.id
      JOIN users u ON b.user_id = u.id
      WHERE 1=1`;
    const params = [];
    if (status) { query += ' AND b.status = ?'; params.push(status); }
    if (shipping_line_id) { query += ' AND s.shipping_line_id = ?'; params.push(shipping_line_id); }
    if (date) { query += ' AND b.travel_date = ?'; params.push(date); }
    query += ' ORDER BY b.created_at DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ADMIN: verify booking by QR code
exports.verifyBooking = async (req, res) => {
  try {
    const { booking_code } = req.body;
    const [rows] = await db.query('SELECT * FROM bookings WHERE booking_code = ?', [booking_code]);
    if (rows.length === 0) return res.status(404).json({ message: 'Booking not found' });
    const booking = rows[0];
    if (booking.status === 'verified') return res.status(400).json({ message: 'Booking already verified' });
    if (booking.status === 'cancelled') return res.status(400).json({ message: 'Booking is cancelled' });
    await db.query('UPDATE bookings SET status = ? WHERE booking_code = ?', ['verified', booking_code]);
    res.json({ message: 'Booking verified successfully', booking_code });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ADMIN: cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    await db.query('UPDATE bookings SET status = ? WHERE id = ?', ['cancelled', req.params.id]);
    res.json({ message: 'Booking cancelled' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
