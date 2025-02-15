const { type } = require('express/lib/response');
const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utilities/apiFeatures');
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/errorHandling');
const factory = require('./handlerFactory');

// alise tour
exports.aliseTour = catchAsync(async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,duration,summary,ratingsAverage';
  // req.query = {'limit' : 5 , 'sort' : '-ratingsAverage,price' , 'fields' : 'name,price,duration,summary,ratingsAverage'};
  next();
});

// steps to do API Features on get all tours
// // 1) filter & complex filter
// const queryObj = {...req.query};
// const excluted = ['sort' , 'fields' , 'page' , 'limit'];
// excluted.forEach(e => delete queryObj[e]);
// let FilterObj = JSON.stringify(queryObj);
// FilterObj = FilterObj.replace(/\b(gte|gt|lte|lt)\b/g , match => `$${match}` )
// let query = Tour.find(JSON.parse(FilterObj));

// 2) sort
// if(req.query.sort){
//   let sortBy = req.query.sort.split(',').join(' ')

//   console.log(sortBy)
//   query = query.sort(sortBy);
// } else{
//   query = query.sort('-createdAt');
// }

// // 3) fields
// if(req.query.fields){
//   console.log(req.query.fields)
//   const selectedBy = req.query.fields.split(',').join(' ');
//   query = query.select(selectedBy)
// } else{
//   query = query.select('-__v');
// }

// // 4) pagination
// const page = req.query.page * 1 || 1;
// const limit = req.query.limit * 1 || 100;
// const skip = (page - 1) * limit;
// query = query.skip(skip).limit(limit);
// if(req.query.page){
//   const tourCounts = await Tour.countDocuments();
//   console.log(tourCounts)
//   if(skip >= tourCounts){
//     throw new Error('page does not exits ❌');
//   }
// }
// const tours = await query;

// create new tour in file as a database
exports.createTour = factory.createOne(Tour);

// get all tours
exports.getTours = factory.getAll(Tour);

// get tour based on id
exports.getTour = factory.getOne(Tour, { path: 'reviews' });

// update put | patch
exports.updateTour = factory.updateOne(Tour);

// delete tour
exports.deleteTour = factory.deleteOne(Tour);

// get tour stats

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        toursNum: { $sum: 1 },
        ratingsNum: { $sum: '$ratingsQuentity' },
        ratingsAvg: { $avg: '$ratingsAverage' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { toursNum: -1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

// get month plan

exports.getMonthPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        monthCount: { $sum: 1 },
        monthDetail: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { monthCount: -1, month: 1 },
    },
    // ,
    // {
    //   $limit : 5
    // }
  ]);
  res.status(200).json({
    status: 'success',
    res: plan.length,
    data: {
      plan,
    },
  });
});

// get all tours within special geogmetry
exports.getTourWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  console.log(radius);
  if (!lat || !lng) {
    return next(
      new AppError(
        'please provide latitude and longtude as in this format lat,lng',
        400,
      ),
    );
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: {
      data: tours,
    },
  });
});

// get all distances from specific point
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371192 : 0.001;
  if (!lat || !lng) {
    return next(
      new AppError(
        'please provide latitude and longtude as in this format lat,lng',
        400,
      ),
    );
  }
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: { name: 1, distance: 1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    result: distances.length,
    data: {
      data: distances,
    },
  });
});

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  // console.log(file)
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    return cb(new AppError('upload only photos', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadMultiablePhoto = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeMultiablePhoto = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover[0] || !req.files.images[0]) return next();

  // image processing for imageCover
  const filename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  // console.log(filename);
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${filename}`);
  req.body.imageCover = filename;
  // image processing for images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(
      async (file, i) => {
        const photoname = `tours-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
        // console.log(photoname);
        await sharp(file.buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`public/img/tours/${photoname}`);
        req.body.images.push(photoname);
      },
    ),
  );
  next();
});
