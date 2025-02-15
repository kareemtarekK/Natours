const { Model } = require('mongoose');
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/errorHandling');
const APIFeatures = require('./../utilities/apiFeatures');

// delete one
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('no document with this id', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

// update one
exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // console.log(req.files);
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true,
    });
    if (!doc) {
      return next(new AppError('this document not found with this id!', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

// get one
exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    // normal find document based on id
    let query = Model.findOne({ _id: req.params.id });
    // done that as there is populate reviews in tour
    if (populateOptions) query = query.populate(populateOptions);
    // await query after find and populate
    const doc = await query;
    if (!doc) {
      return next(new AppError('no document with this id!', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

// get all
exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // nested routes get all reviews for specific tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const docs = await features.query;
    res.status(200).json({
      status: 'success',
      result: docs.length,
      data: {
        data: docs,
      },
    });
  });

// create one
exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });
