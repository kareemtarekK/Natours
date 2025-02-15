const express = require('express');
const userControler = require('./../controlers/userControler');
const authController = require('./../controlers/authController');
const router = express.Router();

router.post('/signup', authController.signup);

router.post('/login', authController.login);

router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);

router.patch('/resetPassword/:token', authController.resetPassword);

// all middleware after that are protect
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updateMyPassword);

router.patch(
  '/updateMe',
  userControler.uploadUserPhoto,
  userControler.resizeUserPhoto,
  userControler.updateMe,
);

router.delete('/deleteMe', userControler.deleteMe);

router.route('/me').get(userControler.getMe, userControler.getUser);

// all middleware after that done by admin
router.use(authController.restrictTo('admin'));

router.route('/').get(userControler.getAllUsers).post(userControler.createUser);

router
  .route('/:id')
  .get(userControler.getUser)
  .patch(userControler.updateUser)
  .delete(userControler.deleteUser);

module.exports = router;
