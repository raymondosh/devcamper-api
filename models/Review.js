const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const ReviewSchema = new Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'Please add a title for the reiew'],
    maxlength: 100,
  },
  text: {
    type: String,
    required: [true, 'Please add some text'],
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: [true, 'Please add a rating between 1 and 10'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: 'Bootcamp',
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
});

// Prevent user from submuitting more than one review per bootcamp
ReviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true });

// static method to get average of review ratings
ReviewSchema.statics.getAverageRating = async function (bootcampId) {
  const obj = await this.aggregate([
    { $match: { bootcamp: bootcampId } },
    { $group: { _id: '$bootcamp', averageRating: { $avg: '$rating' } } },
  ]);

  try {
    await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
      averageRating: obj[0].averageRating,
    });
  } catch (error) {
    console.log(error);
  }
};

// call averageRating after save
ReviewSchema.post('save', function (next) {
  this.constructor.getAverageRating(this.bootcamp);

  // next();
});

// call averageRating before remove
ReviewSchema.pre('remove', function (next) {
  this.constructor.getAverageRating(this.bootcamp);

  // next();
});

module.exports = model('Review', ReviewSchema);
