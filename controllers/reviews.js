const Review = require('../models/Review');
const Bootcamp = require('../models/Bootcamp');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @Desc    Get all Reviews
// @route   GET /api/v1/reviews
// @route   GET /api/v1/bootcamps/:bootcampId/reviews
// @access  Public
exports.getReviews = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    const reviews = await Review.find({ bootcamp: req.params.bootcampId });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @Desc    Get Single Review
// @route   GET /api/v1/reviews/:id
// @access  Public
exports.getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id).populate({
    path: 'bootcamp',
    select: 'name description',
  });

  if (!review) {
    return next(new ErrorResponse('no review found', 404));
  }

  res.status(200).json({ success: true, data: review });
});

// @Desc    Create Review
// @route   POST /api/v1/bootcamps/:bootcampId/reviews
// @access  Private
exports.CreateReview = asyncHandler(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;

  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  if (!bootcamp) {
    return next(new ErrorResponse('no bootcamp found', 404));
  }

  const review = await Review.create(req.body)

  // use 201 when create a resource
  res.status(201).json({ success: true, data: review });
});



// @Desc    Update a single Review
// @route   PUT /api/v1/reviews/:id
// @access  Private
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse('review not found', 400));
  }

  // make sure user is review owner // user is an admin
  // review.user returns an object id - convert it to string
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User is not authorized to update review`, 401)
    );
  }

  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res
    .status(201)
    .json({ success: true, data: review, msg: 'updated successfully ' });
});

// @Desc    Delete a single Review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findByIdAndRemove(req.params.id);
  if (!review) {
    return next(new ErrorResponse('review not found', 404));
  }

  // make sure user is review owner
  // bootcamp.user returns an object id - convert it to string
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User is not authorized to delete review`, 401)
    );
  }

  res.status(200).json({ success: true, msg: 'deleted successfully ' });
});

