const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const path = require('path');
const { token } = require('morgan');
const sendMail = require('../utils/sendMail');
const crypto = require('crypto');

// @Desc    Register User
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;
  console.log(req.body);
  const user = await User.findOne({ email });
  if (user) {
    return next(new ErrorResponse('Email already exists', 400));
  }

  const newUser = await User.create({ email, name, password, role });

  // res.status(200).json({ success: true, data: newUser, token });

  sendTokenResponse(newUser, 200, res);
});

// @Desc    Login User
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password -__v');

  if (!user) {
    return next(new ErrorResponse('Invalid login details', 400));
  }

  const isPassword = await user.comparePassword(password);

  if (!isPassword) {
    return next(new ErrorResponse('Invalid login details', 400));
  }

  sendTokenResponse(user, 200, res);
});

// @Desc    Forgot password
// @route   GET /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('Email does not exist', 400));
  }

  // get reset token
  const resetToken = user.getResetToken();

  await user.save({ validateBeforeSave: false });

  // create reset url
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/forgot-password/${resetToken}`;

  const message = `you are receiving this mail because you (or someone) has requested for reset of password. Please make request to ${resetUrl}`;

  try {
    await sendMail({
      email: user.email,
      subject: 'Password reset token',
      message,
    });
    res.status(200).json({ success: true, msg: 'email sent' });
  } catch (error) {
    console.log(error);
    // reset db fields if something goes wrong
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @Desc    reset password
// @route   PUT /api/v1/auth/reset-password/:resetToken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  user.password = req.body.password;

  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  sendTokenResponse(user, 200, res);
});

// @Desc    Get Current LoggedIn User
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ succes: true, data: user });
});

// @Desc    Logout User
// @route   GET /api/v1/auth/logut
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ succes: true, data: {} });
});

// @Desc    Update User Details
// @route   PUT /api/v1/auth/update-details
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const { name, email } = req.body;
  const fieldsToUpdate = {
    name,
    email,
  };
  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ succes: true, data: user });
});

// @Desc    Update User Password
// @route   PUT /api/v1/auth/update-password
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, password } = req.body;
  const user = await User.findById(req.user.id).select('+password');

  console.log(user.password);
  if (!user) {
    return next(new ErrorResponse('Not found', 404));
  }

  // const isPasswordValid = await user.comparePassword(currentPassword);

  // if (!isPasswordValid) {
  if (!(await user.comparePassword(currentPassword))) {
    return next(new ErrorResponse('password is incorrect', 401));
  }

  user.password = password;
  await user.save();

  // const fieldsToUpdate = {
  //   password: password
  // };

  // const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
  //   new: true,
  //   runValidators: true,
  // });

  sendTokenResponse(user, 200, res);
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // create token
  const token = user.getSignedJtwToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 3600 * 1000 * 24
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({ success: true, data: token });
};
