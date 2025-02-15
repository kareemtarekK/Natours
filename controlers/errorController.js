const AppError = require('./../utilities/errorHandling');

// handle invalid id
const handleInvalidIdDB = (err) => {
  const message = `invalid id. ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

//handle duplicate fields
const handelDuplicateFieldsDB = (err) => {
  const value = err.keyValue.name;
  const message = `duplicate field with this ${value}. please use another value`;
  return new AppError(message, 400);
};

// handle validation error
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((e) => e.message);
  const message = errors.join('. ');
  return new AppError(message, 400);
};

// json wen token error
const handleJsonWebTokenError = (_) => {
  return new AppError('invalid token, please log in again', 401);
};

// token expired error
const handleExpiredError = (_) => {
  return new AppError('token has been expired, please login again', 401);
};
// send error development
const sendErrorDev = (req, err, res) => {
  // development in API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }
  // development in rendered website
  res
    .status(err.statusCode)
    .set('Content-Security-Policy', "frame-src 'self'")
    .render('error', {
      title: 'something went wrong',
      msg: err.message,
    });
};

// send error production
const sendErrorProd = (req, err, res) => {
  // production in API
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'something went very wrong !',
    });
    // production in rendered website
  } else {
    if (err.isOperational) {
      return res
        .status(err.statusCode)
        .set('Content-Security-Policy', "frame-src 'self'")
        .render('error', {
          title: 'something went wrong',
          msg: err.message,
        });
    }
    res
      .status(err.statusCode)
      .set('Content-Security-Policy', "frame-src 'self'")
      .render('error', {
        title: 'something went wrong',
        msg: 'something went very wrong, please try later.',
      });
  }
};

// global error handling middleware
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(req, err, res);
  } else if (process.env.NODE_ENV === 'production') {
    if (err.name === 'CastError') {
      err = handleInvalidIdDB(err);
    }
    if (err.code === 11000) {
      err = handelDuplicateFieldsDB(err);
    }
    if (err.name === 'ValidationError') {
      err = handleValidationErrorDB(err);
    }
    if (err.name === 'JsonWebTokenError') {
      err = handleJsonWebTokenError();
    }
    if (err.name === 'TokenExpiredError') {
      err = handleExpiredError();
    }
    sendErrorProd(req, err, res);
  }
};
