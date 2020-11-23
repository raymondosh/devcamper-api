const Course = require('../models/Course');
const Bootcamp = require('../models/Bootcamp');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @Desc    Get all Courses
// @route   GET /api/v1/courses
// @route   GET /api/v1/bootcamps/:bootcampId/courses
// @access  Public

exports.getCourses = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    const courses = await Course.find({ bootcamp: req.params.bootcampId });

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }

  // let query;

  // if (req.params.bootcampId) {
  //   query = Course.find({ bootcamp: req.params.bootcampId });
  // } else {
  //   query = Course.find().populate({
  //     path: 'bootcamp',
  //     select: 'name description',
  //   });
  // }

  // const courses = await query;

  // res.status(200).json({
  //   success: true,
  //   count: courses.length,
  //   data: courses,
  // });
});

// @Desc    Get single Course
// @route   GET /api/v1/courses/:id
// @access  Public
exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate({
    path: 'bootcamp',
    select: 'name description',
  });

  if (!course) {
    return next(new ErrorResponse('Course not found', 404));
  }

  res.status(200).json({ success: true, data: course });
});

// @Desc    Create new Course
// @route   POST /api/v1/bootcamps/:bootcampId/courses
// @access  Private
exports.createCourse = asyncHandler(async (req, res, next) => {
  // add user id to req.body
  req.body.user = req.user.id;

  req.body.bootcamp = req.params.bootcampId;

  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  if (!bootcamp) {
    return next(new ErrorResponse('Bootcamp not found', 404));
  }

  // if user is not admin, they can only add one bootcamp
  if (bootcamp.user.toString() && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User with ${req.user.id} cannot add a course to botcamp`,
        401
      )
    );
  }

  const course = await Course.create(req.body);

  res
    .status(201)
    .json({ success: true, data: course, msg: 'created successfully ' });
});

// @Desc    Update a single Course
// @route   PUT /api/v1/courses/:id
// @access  Private
exports.updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse('Course not found', 400));
  }

  // make sure user is course owner
  if (course.user.toString() !== req.user.id && req.role !== 'admin') {
    // bootcamp.user returns an object id - convert it to string
    return next(
      new ErrorResponse(`User is not nauthorized to update course`, 401)
    );
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res
    .status(201)
    .json({ success: true, data: course, msg: 'updated successfully ' });
});

// @Desc    Delete a single course
// @route   DELETE /api/v1/courses/:id
// @access  Private
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findByIdAndRemove(req.params.id);
  if (!course) {
    return next(new ErrorResponse('Course not found', 404));
  }

  // make sure user is course owner
  if (course.user.toString() !== req.user.id && req.role !== 'admin') {
    // bootcamp.user returns an object id - convert it to string
    return next(
      new ErrorResponse(`User is not nauthorized to delete course`, 401)
    );
  }

  res.status(200).json({ success: true, msg: 'deleted successfully ' });
});
