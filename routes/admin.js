const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { verifyAdmin, verifySuperAdmin } = require('../middleware/auth');

router.get('/dashboard', verifyAdmin, ctrl.getDashboard);

router.get('/users', verifyAdmin, ctrl.getUsers);
router.put('/users/:id', verifyAdmin, ctrl.updateUser);
router.delete('/users/:id', verifyAdmin, ctrl.deleteUser);

router.get('/admins', verifySuperAdmin, ctrl.getAdmins);
router.post('/admins', verifySuperAdmin, ctrl.createAdmin);
router.put('/admins/:id', verifySuperAdmin, ctrl.updateAdmin);
router.delete('/admins/:id', verifySuperAdmin, ctrl.deleteAdmin);

router.get('/shipping-lines', verifyAdmin, ctrl.getShippingLines);
router.post('/shipping-lines', verifyAdmin, ctrl.createShippingLine);
router.put('/shipping-lines/:id', verifyAdmin, ctrl.updateShippingLine);
router.delete('/shipping-lines/:id', verifyAdmin, ctrl.deleteShippingLine);

router.get('/routes', verifyAdmin, ctrl.getRoutes);
router.post('/routes', verifyAdmin, ctrl.createRoute);
router.put('/routes/:id', verifyAdmin, ctrl.updateRoute);
router.delete('/routes/:id', verifyAdmin, ctrl.deleteRoute);

router.get('/ships', verifyAdmin, ctrl.getShips);
router.post('/ships', verifyAdmin, ctrl.createShip);
router.put('/ships/:id', verifyAdmin, ctrl.updateShip);
router.delete('/ships/:id', verifyAdmin, ctrl.deleteShip);

router.get('/fares', verifyAdmin, ctrl.getFares);
router.post('/fares', verifyAdmin, ctrl.createFare);
router.put('/fares/:id', verifyAdmin, ctrl.updateFare);
router.delete('/fares/:id', verifyAdmin, ctrl.deleteFare);

router.get('/cargo-rates', verifyAdmin, ctrl.getCargoRates);
router.post('/cargo-rates', verifyAdmin, ctrl.createCargoRate);
router.put('/cargo-rates/:id', verifyAdmin, ctrl.updateCargoRate);
router.delete('/cargo-rates/:id', verifyAdmin, ctrl.deleteCargoRate);

module.exports = router;
