const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const User = require('../models/User');

// load all controllers
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/users');

// This sill mean I don't have to manually add the middleware to the routes, as long as I want to use the same in all the routes
// router.use(protect);
// router.use(authorize('admin'));

// router.route('/').get(advancedResults(User), getUsers).post(createUser);
// router.route('/:id').get(getUser).put(updateUser).delete(deleteUser);

router
  .route('/')
  .get(protect, authorize('admin'), advancedResults(User), getUsers)
  .post(protect, authorize('admin'), createUser);
router
  .route('/:id')
  .get(protect, authorize('admin'), getUser)
  .put(protect, authorize('admin'), updateUser)
  .delete(protect, authorize('admin'), deleteUser);

module.exports = router;
