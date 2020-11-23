const express = require('express');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const xss = require('xss-clean');
// load env vars
dotenv.config({ path: './config/config.env' });
const path = require('path');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// To remove data, use:
app.use(mongoSanitize());

app.use(cookieParser());

app.use(cors());

// set security headers
app.use(helmet());

// prevent xss attacks
app.use(xss());

// rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100,
});
app.use(limiter);

// prevent http param polluter
app.use(hpp());

// set static folder
app.use(express.static(path.join(__dirname, 'Public')));

// connect to database
connectDB();

// file upload
app.use(fileUpload());

// routes files
app.use('/api/v1/bootcamps', require('./routes/bootcamps'));
app.use('/api/v1/courses', require('./routes/courses'));
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/auth/users', require('./routes/users'));
app.use('/api/v1/reviews', require('./routes/reviews'));

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () =>
  console.log(`server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // close server and exit process
  server.close(() => process.exit(1));
});
