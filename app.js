const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const tourRouter = require('./routes/tourRouter');
const userRouter = require('./routes/userRouter');
const reviewRouter = require('./routes/reviewRouter');
const bookingRouter = require('./routes/bookingRouter');
const ErrorHandling = require('./utilities/errorHandling');
const globalErrorHandling = require('./controlers/errorController');
const viewRouter = require('./routes/viewRouter');

const app = express();

// set type engine
app.set('view engine', 'pug');

// set where views or pug templates
app.set('views', path.join(__dirname, 'views'));

// serve static files
app.use(express.static(path.join(__dirname, 'public')));

// body-barser with body payload (10-kilo-bytes as max prevent DOS attack)
app.use(express.json({ limit: '10kb' }));

// encode url encoded form
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// parse cookies 
app.use(cookieParser());

// helmet to set security http headers
app.use(helmet());

// limiter
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'too many requests from same ip. please try again in an hour',
});
app.use('/api', limiter);

// data sanitization aganist NOSQL query injection attack
app.use(mongoSanitize());

// data sanitization aganist corss-site scripting attack xss attack
app.use(xss());

// prevent http parameter polution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuentity',
      'maxGroupSize',
      'price',
    ],
  }),
);

// development loggining
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use((req, res, next) => {
  console.log(req.headers);
  next();
});

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// middleware to send message tell that route not on the server
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status : 'fail',
  //   message : `Route ${req.originalUrl} not found on this server !`
  // });
  // const err = new Error(`Route ${req.originalUrl} not found on this server !`);
  // err.statusCode = 404;
  // err.status = 'fail';
  next(
    new ErrorHandling(
      `Route ${req.originalUrl} not found on this server !`,
      404,
    ),
  );
});

// global error handling middleware
app.use(globalErrorHandling);

module.exports = app;
