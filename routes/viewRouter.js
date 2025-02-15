const express = require('express');
const viewController = require('./../controlers/viewController');
const authController = require('./../controlers/authController');
const bookingController = require('./../controlers/bookingController');

const router = express.Router();

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isloggedIn,
  viewController.getOverview,
);

router.get('/bookings', authController.protect, viewController.getMyTours);
router.get('/tour/:slug', authController.isloggedIn, viewController.getTour);

router.get('/login', authController.isloggedIn, viewController.login);

router.get('/signup', authController.isloggedIn, viewController.signup);

router.get('/me', authController.protect, viewController.getAccount);

// router.post(
//   '/submited-user-form',
//   authController.protect,
//   authController.updateMe,
// );

module.exports = router;
