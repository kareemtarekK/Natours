const { type } = require('express/lib/response');
const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'tour must have a name'],
      unique: [true, 'name should be unique ❎'],
      trim: true,
      minlength: [10, 'a tour name must be up 10 characters'],
      maxlength: [50, 'a tour name must be below 50 characters'],
      // validate : [validator.isAlpha , 'tour name must contain only letters']
    },
    secretTour: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      required: true,
    },
    discountPrice: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'discountPrice ({VALUE}) should be below regular price',
      },
    },
    duration: {
      type: Number,
      required: true,
    },
    maxGroupSize: {
      type: Number,
      required: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message:
          'difficulty should be either: easy | medium | difficult not ({VALUE})',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating must start from 1.0'],
      max: [5, 'rating must below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuentity: {
      type: Number,
      default: 0,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: true,
    },
    images: [String],
    startDates: [Date],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    slug: String,
    startLocation: {
      // geoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        // geoJSON
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// geospatial index
tourSchema.index({ startLocation: '2dsphere' });

// tourSchema.index({ price: 1 });

// compund index on price and ratingsAverage
tourSchema.index({ price: 1, ratingsAverage: -1 });

// single type index on slug
tourSchema.index({ slug: 1 });

// virtuals properity
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// virtual populate reviews
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// document middleware to add slugs before creating or saving document in database called (pre save shook)
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// embeding guides in tour
// tourSchema.pre('save', async function (next) {
//   const guidePromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidePromises);
//   next();
// });

// document middleware to get document after save into database called (post save shook)
tourSchema.post('save', function (doc, next) {
  // console.log(doc);
  next();
});

// query middleware to populate guides in tours
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -changePasswordAfter -email',
  });
  next();
});

// query middleware to hide secret tours from public for only VIP group
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

// query middleware to get docs after hide secret
tourSchema.post(/^find/, function (docs, next) {
  console.log(`time taken : ${Date.now() - this.start}`);
  next();
});

// // aggregate middleware to hide secret from stats and month plan
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
