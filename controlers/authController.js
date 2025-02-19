const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/errorHandling');
const Email = require('./../utilities/email');
const { status } = require('express/lib/response');
const { updateUser } = require('./userControler');

// createToken
const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// create Send Token Response
const createSendTokenAndResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  // cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };
  // prodyction use https
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  user.password = undefined;

  // send token via cookie
  res.cookie('JWT', token, cookieOptions);
  console.log(token);
  res.status(statusCode).json({
    status: 'success',
    data: {
      newUser: user,
      token,
    },
  });
};

// sign up
exports.signup = catchAsync(async (req, res, next) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    changePasswordAfter: req.body.changePasswordAfter,
    role: req.body.role,
  });
  createSendTokenAndResponse(user, 201, res);
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(user, url).sendWelcome();
});

// log in
exports.login = catchAsync(async (req, res, next) => {
  // 1) check if email , password exits
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('please provide email and password !', 401));
  }
  // 2) check if user exist with email
  const user = await User.findOne({ email }).select('+password');
  // 3) check if password is correct
  if (!user || !(await user.correctPassword(password))) {
    return next(new AppError('email or password are not correct', 401));
  }
  // 4) sign token
  createSendTokenAndResponse(user, 200, res);
});

// logout
exports.logout = (req, res, next) => {
  res.cookie('JWT', 'kareemtarek', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    // secure: true
  });
  res.status(200).json({
    status: 'success',
    message: 'loggedout',
  });
};

// protect routes
exports.protect = catchAsync(async (req, res, next) => {
  // 1) check if token exist
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.JWT) {
    // console.log(req.cookies.JWT);
    token = req.cookies.JWT;
    if (!token) {
      return next(
        new AppError('please log in again. you don`t have any token', 401),
      );
    }
  }
  // 2) verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // 3) check if user exist
  const user = await User.findOne({ _id: decoded.id });
  if (!user) {
    return next(new AppError('user beloning to token does not exits', 401));
  }
  // 4) check if pasword changed after token has issued
  const changePassword = user.checkChangePasswordAfter(decoded.iat);
  if (changePassword) {
    return next(
      new AppError(
        'user recently change password, please try log in again !',
        401,
      ),
    );
  }
  req.user = user;
  res.locals.user = user;
  next();
});

// isloggedIn
exports.isloggedIn = async (req, res, next) => {
  try {
    // 1) check if token exist
    if (req.cookies.JWT) {
      // 2) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.JWT,
        process.env.JWT_SECRET,
      );
      // 3) check if user exist
      const user = await User.findOne({ _id: decoded.id });
      if (!user) {
        return next();
      }
      // 4) check if pasword changed after token has issued
      const changePassword = user.checkChangePasswordAfter(decoded.iat);
      if (changePassword) {
        return next();
      }
      res.locals.user = user;
      // console.log(user);
      return next();
    }
    next();
  } catch (err) {
    next();
  }
};

// restrictTo to give permission
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you don`t have permission to do that action !', 403),
      );
    }
    next();
  };
};

// forgot password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('this email not found', 400));
  }
  // 2) generate random  password rest token
  const resetToken = user.generateRandomResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) send token to email to reset password
  const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  const message = `forgot your password? if so send patch request with your new password and passwordConfirm on this link ${resetUrl}. if you not forgot your password ignore this email`;

  try {
    await new Email(user, resetUrl).sendResetPassword();
    res.status(200).json({
      status: 'success',
      message: 'email has been sent !',
    });
  } catch (err) {
    user.randomResetToken = undefined;
    user.randomResetTokenExpired = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500).json({
      status: 'error',
      message: 'error sending email. try it later',
    });
  }
});

// reset password
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on token
  const encryptedToken = crypto
    .createHash('sha-256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    randomResetToken: encryptedToken,
    randomResetTokenExpired: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError('invalid token or has expired', 401));
  }
  // 2) update passwords
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.randomResetToken = undefined;
  user.randomResetTokenExpired = undefined;
  await user.save();
  // 3) update password change at properity done with (pre save hock)
  // 4) create token and send to user as a response
  createSendTokenAndResponse(user, 200, res);
});

// update password
exports.updateMyPassword = catchAsync(async (req, res, next) => {
  // 1) check if current password is correct
  const user = await User.findById(req.user._id).select('+password');
  console.log(user);
  if (!(await user.correctPassword(req.body.currentPassword))) {
    return next(new AppError('current password is wrong!', 401));
  }
  // 2) update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 3) send response and send token
  createSendTokenAndResponse(user, 200, res);
});

// update data using urlencoded
exports.updateMe = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
      // photo: req.body.photo.name
    },
    {
      new: true,
      runValidators: true,
    },
  );
  // console.log(updatedUser);
  res
    .status(200)
    .set('Content-Security-Policy', 'frame-src "self"')
    .render('account', {
      title: 'Your Account',
      user: updatedUser,
    });
});
