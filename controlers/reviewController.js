const catchAsync = require('./../utilities/catchAsync');
const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');

// setTourUserIds
exports.setTourUserIds = (req, res, next) => {
  // nested routes reviews on specific tour
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};
// create review
exports.createReview = factory.createOne(Review);

// get all reviews
exports.getAllReviews = factory.getAll(Review);

// update review
exports.updateReview = factory.updateOne(Review);

// delete review
exports.deleteReview = factory.deleteOne(Review);

// get review
exports.getReview = factory.getOne(Review);
