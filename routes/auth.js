const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// load all controllers
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
  logout
} = require('../controllers/auth');

router.route('/register').post(register);
router.route('/login').post(login);
router.route('/me').get(protect, getMe);
router.route('/logout').get(logout);
router.route('/forgot-password').post(forgotPassword);
router.route('/update-details').put(protect, updateDetails);
router.route('/update-password').put(protect, updatePassword);
router.route('/reset-password/:resetToken').put(resetPassword);

module.exports = router;
