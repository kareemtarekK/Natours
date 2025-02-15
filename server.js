const dotenv = require(`dotenv`);
const mongoose = require('mongoose');

// handle uncaught exception
process.on('uncaughtException', (err) => {
  console.log(err.name, ':', err.message);
  console.log('UNCAUGHT EXCEPTION 💥. shutting down.....');
  process.exit(1);
});

dotenv.config({ path: `${__dirname}/config.env` });
const app = require(`${__dirname}/app`);
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DTABASE_PASSWORD,
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((con) => {
    console.log('connected to database ✅');
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, '127.0.0.1', () => {
  console.log('start up server');
});

// handle unhandled promises (connect to database as there is no catch)
process.on('unhandledRejection', (err) => {
  console.log(err.name, ':', err.message);
  console.log('UNHANDLED REJECTION 💥. shuting down.....');
  server.close(() => {
    process.exit(1);
  });
});

/*
  template engine -----> used to create template then fill it up with data from database
  template engine [pug , handlebars , EGS] but pug is most comment one in express
  first set template engine and make engine to know where to find template to inject placeholder with dat come from database
   
*/
