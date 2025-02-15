const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const catchAsync = require('./../utilities/catchAsync');
const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const factoryController = require('./../controlers/handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // get tour based on id
  const tour = await Tour.findById(req.params.tourId);

  // create stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/api/v1/tours/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: tour.id,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: `${tour.price * 100}`,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://natours.dev/img/tours/${tour.imageCover}`],
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
  });
  res.status(200).json({
    status: 'success',
    message: 'session created successfully',
    data: {
      session,
    },
  });
});

// create booking checkout
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // console.log(req.query);
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);
  next();
});

// get all bookings
exports.getAllBookings = factoryController.getAll(Booking);
// create new booking
exports.createNewBooking = factoryController.createOne(Booking);
// get booking
exports.getBooking = factoryController.getOne(Booking);
// update booking
exports.updateBooking = factoryController.updateOne(Booking);
// delete booking
exports.deleteBooking = factoryController.deleteOne(Booking);
