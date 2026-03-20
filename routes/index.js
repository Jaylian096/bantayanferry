const express = require('express');
const router = express.Router();
const { authenticateUser, authenticateAdmin } = require('../middleware/auth');

const authCtrl = require('../controllers/authController');
const scheduleCtrl = require('../controllers/scheduleController');
const bookingCtrl = require('../controllers/bookingController');
const fareCtrl = require('../controllers/fareController');
const adminCtrl = require('../controllers/adminController');

// ── AUTH ──────────────────────────────────────────────────────────
router.post('/auth/register', authCtrl.registerUser);
router.post('/auth/login', authCtrl.loginUser);
router.post('/auth/admin/login', authCtrl.loginAdmin);

// ── SCHEDULES (Public) ────────────────────────────────────────────
router.get('/schedules', scheduleCtrl.getSchedules);
router.get('/schedules/:id', scheduleCtrl.getScheduleById);

// ── FARES (Public) ────────────────────────────────────────────────
router.get('/fares', fareCtrl.getFares);
router.get('/cargo-rates', fareCtrl.getCargoRates);

// ── SHIPPING LINES (Public) ───────────────────────────────────────
router.get('/shipping-lines', adminCtrl.getShippingLines);
router.get('/routes', adminCtrl.getRoutes);

// ── USER (Protected) ──────────────────────────────────────────────
router.post('/bookings', authenticateUser, bookingCtrl.createBooking);
router.get('/bookings/my', authenticateUser, bookingCtrl.getUserBookings);
router.get('/bookings/my/:id', authenticateUser, bookingCtrl.getBookingById);

// ── ADMIN ─────────────────────────────────────────────────────────
router.get('/admin/dashboard', authenticateAdmin, bookingCtrl.getDashboardStats);
router.get('/admin/bookings', authenticateAdmin, bookingCtrl.getAllBookings);
router.post('/admin/bookings/verify', authenticateAdmin, bookingCtrl.verifyBooking);
router.put('/admin/bookings/:id/cancel', authenticateAdmin, bookingCtrl.cancelBooking);

router.get('/admin/users', authenticateAdmin, adminCtrl.getUsers);
router.put('/admin/users/:id', authenticateAdmin, adminCtrl.updateUser);

router.get('/admin/admins', authenticateAdmin, adminCtrl.getAdmins);
router.post('/admin/admins', authenticateAdmin, adminCtrl.createAdmin);
router.put('/admin/admins/:id', authenticateAdmin, adminCtrl.updateAdmin);
router.delete('/admin/admins/:id', authenticateAdmin, adminCtrl.deleteAdmin);

router.get('/admin/routes', authenticateAdmin, adminCtrl.getRoutes);
router.post('/admin/routes', authenticateAdmin, adminCtrl.createRoute);
router.put('/admin/routes/:id', authenticateAdmin, adminCtrl.updateRoute);
router.delete('/admin/routes/:id', authenticateAdmin, adminCtrl.deleteRoute);

router.get('/admin/ships', authenticateAdmin, adminCtrl.getShips);
router.post('/admin/ships', authenticateAdmin, adminCtrl.createShip);
router.put('/admin/ships/:id', authenticateAdmin, adminCtrl.updateShip);
router.delete('/admin/ships/:id', authenticateAdmin, adminCtrl.deleteShip);

router.get('/admin/schedules', authenticateAdmin, scheduleCtrl.getSchedules);
router.post('/admin/schedules', authenticateAdmin, scheduleCtrl.createSchedule);
router.put('/admin/schedules/:id', authenticateAdmin, scheduleCtrl.updateSchedule);
router.delete('/admin/schedules/:id', authenticateAdmin, scheduleCtrl.deleteSchedule);

router.post('/admin/fares', authenticateAdmin, fareCtrl.upsertFare);
router.delete('/admin/fares/:id', authenticateAdmin, fareCtrl.deleteFare);
router.post('/admin/cargo-rates', authenticateAdmin, fareCtrl.upsertCargoRate);

module.exports = router;
