const Bootcamp = require('../models/Bootcamp');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');
const { geoSearch } = require('../models/Bootcamp');
const path = require('path');

// @Desc    Get all Bootcamps
// @route   GET /api/v1/bootcamps
// @access  Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @Desc    Get single Bootcamp
// @route   GET /api/v1/bootcamps/:id
// @access  Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    return next(new ErrorResponse('Bootcamp not found', 404));
  }
  res.status(200).json({ success: true, data: bootcamp });
});

// @Desc    Create new Bootcamp
// @route   POST /api/v1/bootcamps/:id
// @access  Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
  // add user id to req.body
  req.body.user = req.user.id;

  // check for published bootcamps
  const publishedBootcamps = await Bootcamp.findOne({ user: req.user.id });

  // if user is not admin, they can only add one bootcamp
  if (publishedBootcamps && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User with ${req.user.id} has already publish a botcamp`,
        400
      )
    );
  }

  const bootcamp = await Bootcamp.create(req.body);

  res
    .status(201)
    .json({ success: true, data: bootcamp, msg: 'created successfully ' });
});

// @Desc    Update a single Bootcamp
// @route   PUT /api/v1/bootcamps/:id
// @access  Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  let bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(new ErrorResponse('Bootcamp not found', 400));
  }

  // make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
    // bootcamp.user returns an object id - convert it to string
    return next(
      new ErrorResponse(`User is not authorized to update botcamp`, 401)
    );
  }

  bootcamp = await Bootcamp.findById(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res
    .status(201)
    .json({ success: true, data: bootcamp, msg: 'updated successfully' });
});

// @Desc    Delete a single Bootcamp
// @route   DELETE /api/v1/bootcamps/:id
// @access  Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    return next(new ErrorResponse('Bootcamp not found', 404));
  }

  // make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
    // bootcamp.user returns an object id - convert it to string
    return next(
      new ErrorResponse(`User is not authorized to delete botcamp`, 401)
    );
  }

  await bootcamp.remove();

  res.status(200).json({ success: true, msg: 'deleted successfully ' });
});

// @Desc    Get bootcamps within a radus
// @route   GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access  Private
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // get lat and lng from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // calculate radius using radians
  // divide distance by radius of the earth - earth radius = 3963 mi/ 6378 kns
  const radius = distance / 3963;
  const bootcamps = await Bootcamp.find({
    location: {
      $geoWithin: { $centerSphere: [[lng, lat], radius] },
    },
  });

  res
    .status(200)
    .json({ success: true, count: bootcamps.length, data: bootcamps });
});

// @Desc    Upload Photo for single Bootcamp
// @route   PUT /api/v1/bootcamps/:id/photo
// @access  Private
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    return next(new ErrorResponse('Bootcamp not found', 404));
  }

  // make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
    // bootcamp.user returns an object id - convert it to string
    return next(
      new ErrorResponse(`User is not authorized to update botcamp`, 401)
    );
  }

  if (!req.files) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  const file = req.files.file;

  // ensure the image is a photo
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse('Please upload an image file', 400));
  }

  // check file size
  if (file.size > process.env.MAX_SIZE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload an image less than ${process.env.MAX_SIZE_UPLOAD}`,
        400
      )
    );
  }

  // create custom filename
  file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.group(err);
      new ErrorResponse('Problem with file upload', 500);
    }

    await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });
  });

  res.status(200).json({ success: true, data: file.name });
});
