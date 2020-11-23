const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  role: {
    type: String,
    enum: ['user', 'publisher'],
    default: 'user',
  },
  password: {
    type: String,
    trim: true,
    // required: [true, 'Please add a password'],
    minlength: 6,
    select: false, // don't return password field when a user is returned via an endpoint
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.pre('update', async function (next) {
  const password = this.getUpdate().$set.password;
  console.log(password);
  if (!password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSaltSync();
    const hash = await bcrypt.hashSync(password, salt);
    this.getUpdate().$set.password = hash;
    next();
  } catch (error) {
    return next(error);
  }
});

// compare password - check if user password is same as password in db
UserSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password); // true
};

// sign JWT and return
UserSchema.methods.getSignedJtwToken = function () {
  return jwt.sign(
    {
      id: this._id,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// generate and hash password token: set reset token in db and return
UserSchema.methods.getResetToken = function () {
  // generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // hash the token and set to db
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // set token expires - 10mins
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = model('User', UserSchema);
