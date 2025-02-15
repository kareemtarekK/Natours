const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { type } = require('express/lib/response');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'please provide your name !'],
  },
  email: {
    type: String,
    required: [true, 'please provide your email !'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'please provide valid email !'],
  },
  role: {
    type: String,
    default: 'user',
    enum: {
      values: ['user', 'guide', 'lead-guide', 'admin'],
      message:
        'role should be eighter: user | guide | lead-guide | admin not ({VALUE})',
    },
  },
  password: {
    type: String,
    required: [true, 'please provide your password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'please confirm your password'],
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: 'not passwords are same !',
    },
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  changePasswordAfter: Date,
  randomResetToken: String,
  randomResetTokenExpired: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.changePasswordAfter = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (inputPassword) {
  return await bcrypt.compare(inputPassword, this.password);
};

userSchema.methods.checkChangePasswordAfter = function (issuedAt) {
  if (this.changePasswordAfter) {
    const changePasswordTime = parseInt(
      this.changePasswordAfter.getTime() / 1000,
      10,
    );
    return issuedAt < changePasswordTime;
  }
  return false;
};

userSchema.methods.generateRandomResetToken = function (next) {
  const resetToken = crypto.randomBytes(32).toString('hex');
  const encryptedResetToken = crypto
    .createHash('sha-256')
    .update(resetToken)
    .digest('hex');
  this.randomResetToken = encryptedResetToken;
  this.randomResetTokenExpired = Date.now() + 10 * 60 * 1000;
  return resetToken;
};
const User = mongoose.model('User', userSchema);
module.exports = User;
