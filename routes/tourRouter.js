const express = require('express');
const tourControler = require('./../controlers/tourControler');
const authController = require('./../controlers/authController');
const reviewRouter = require('./../routes/reviewRouter');

const router = express.Router();

router
  .route('/tours-within/distance/:distance/center/:latlng/unit/:unit')
  .get(tourControler.getTourWithin);

router
  .route('/distances/center/:latlng/unit/:unit')
  .get(tourControler.getDistances);

router
  .route('/best-5-tours')
  .get(tourControler.aliseTour, tourControler.getTours);

router.route('/tour-stats').get(tourControler.getTourStats);

router
  .route('/month-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourControler.getMonthPlan,
  );

router.use('/:tourId/reviews', reviewRouter);

router
  .route('/')
  .get(tourControler.getTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourControler.createTour,
  );
router
  .route(`/:id`)
  .get(tourControler.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourControler.uploadMultiablePhoto,
    tourControler.resizeMultiablePhoto,
    tourControler.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourControler.deleteTour,
  );

module.exports = router;
