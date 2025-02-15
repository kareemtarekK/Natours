const multer = require('multer');
const sharp = require('sharp');
const catchAsync = require('./../utilities/catchAsync');
const User = require('./../models/userModel');
const AppError = require('./../utilities/errorHandling');
const factory = require('./handlerFactory');
// const multerStorage = multer.diskStorage({
//   destination: (req , file , cb)=>{
//     cb(null , 'public/img/users');
//   },
//   filename: (req , file , cb)=>{
//     const ext = file.mimetype.split('/')[1];
//     cb(null , `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

// const multerFilter = (req , file , cb)=>{
//   if(file.mimetype.startsWith('image')){
//     cb(null , true);
//   } else{
//     cb(new AppError('file is not an image. please upload only image' , 400) , false)
//   }
// }

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError('file is not an image. please upload only image', 400),
      false,
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

// filter object (req.body) body-parser
const filterObj = (obj, ...fields) => {
  let newObj = {};
  Object.keys(obj).forEach((e) => {
    if (fields.includes(e)) newObj[e] = obj[e];
  });
  return newObj;
};

// get me
exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

// update data
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) get error if entered passwords
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'can`t update password from this route. use /updateMyPassword route to do that!',
        400,
      ),
    );
  }
  // 2) update data (email or name)
  const filterBody = filterObj(req.body, 'name', 'email');
  if (req.file) filterBody.photo = req.file.filename;
  // console.log(req.file);
  // console.log(req.body);
  await User.findByIdAndUpdate(req.user._id, filterBody, {
    new: true,
    runValidators: true,
  });
  // 3) send response
  res.status(200).json({
    status: 'success',
    data: {
      message: 'data have updated',
    },
  });
});

// delete my account
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, {
    active: false,
  });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// create user
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not yet defined. please use /signup',
  });
};

// get all users
exports.getAllUsers = factory.getAll(User);

// get user
exports.getUser = factory.getOne(User);

// update user
exports.updateUser = factory.updateOne(User);

// delete user
exports.deleteUser = factory.deleteOne(User);
