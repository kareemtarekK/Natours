const mongoose = require('mongoose');
const Tour = require('./../models/tourModel');
const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: [true, 'Review must not be empty!'],
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Review must belong to a tour!'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Review must belong to a user!'],
  },
});

// unique compound index on tour and user
reviewSchema.index({ tour: 1, user: -1 }, { unique: true });

// populate tourId , userId
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// static method to update ratingsQuentity and ratingsAverage when creating review
reviewSchema.statics.getRatingAverageQuantity = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  // console.log(stats);

  // check if stats length > 0 so in delete review
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuentity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuentity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// after create review call statics method
reviewSchema.post('save', async function () {
  await this.constructor.getRatingAverageQuantity(this.tour);
});

// excute query to get document updated but before updating done
reviewSchema.pre(/findOneAnd/, async function (next) {
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});

// after update or delete review call statics method
reviewSchema.post(/findOneAnd/, async function () {
  await this.r.constructor.getRatingAverageQuantity(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
