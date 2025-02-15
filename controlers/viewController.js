const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utilities/catchAsync');
const appError = require('./../utilities/errorHandling');

exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();
  res
    .status(200)
    .set('Content-Security-Policy', "frame-src 'self'")
    .render('overview', {
      title: 'All Tours',
      tours,
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    select: 'review rating user',
  });

  if (!tour) {
    return next(new appError('There is no tour with that name.', 404));
  }

  res
    .status(200)
    // .set('Content-Security-Policy', "frame-src 'self'")
    .set(
      'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com https://*.stripe.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com https://js.stripe.com/v3/ 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;",
    )
    .render('tour', {
      title: `${tour.name}`,
      tour,
    });
});

exports.login = catchAsync((req, res, next) => {
  res
    .status(200)
    .set('Content-Security-Policy', "frame-src 'self'")
    .render('login', {
      title: `Log into your account`,
    });
});

exports.signup = catchAsync((req, res, next) => {
  res
    .status(200)
    .set('Content-Security-Policy', "frame-src 'self'")
    .render('signup', {
      title: `Create your account`,
    });
});

exports.getAccount = (req, res, next) => {
  res
    .status(200)
    .set('Content-Security-Policy', "frame-src 'self'")
    .render('account', {
      title: 'Your Account',
    });
};

// get my tours in bookings
exports.getMyTours = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id });
  const bookingIds = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: bookingIds } });
  res
    .status(200)
    .set('Content-Security-Policy', "frame-src 'self'")
    .render('overview', {
      title: 'My-Tours',
      tours,
    });
});
