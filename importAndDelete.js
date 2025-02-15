const fs = require('fs');
const mongoose = require('mongoose');
const dotEnv = require('dotenv');
dotEnv.config({ path: './config.env' });
const Tour = require('./models/tourModel');
const User = require('./models/userModel');
const Review = require('./models/reviewModel');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DTABASE_PASSWORD,
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((_) => console.log('connected to mongoDB ✅ '))
  .catch((err) => console.log(err));

const tours = JSON.parse(
  fs.readFileSync('./dev_data/data/tours.json', 'utf-8'),
);
const users = JSON.parse(
  fs.readFileSync('./dev_data/data/users.json', 'utf-8'),
);
const reviews = JSON.parse(
  fs.readFileSync('./dev_data/data/reviews.json', 'utf-8'),
);

// to import data to database
const importData = async (_) => {
  try {
    await Tour.create(tours);
    await User.create(users , { validateBeforeSave : false });
    await Review.create(reviews);

    console.log('imported data to datbase ✅');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// to delete all data from database
const deleteData = async (_) => {
  try {
    await Tour.deleteMany({});
    await User.deleteMany({});
    await Review.deleteMany({});

    console.log('database deleted ✅');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
