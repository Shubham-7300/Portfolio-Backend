class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorMiddleware = (err, req, res, next) => {
  // Set default values for message and statusCode
  err.message = err.message || "Internal Server Error";
  err.statusCode = err.statusCode || 500;

  // Handle duplicate key error (MongoDB unique constraint)
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} Entered`;
    err = new ErrorHandler(message, 400); // Update err with a new ErrorHandler instance
  }

  // Handle invalid JWT error
  if (err.name === "JsonWebTokenError") {
    const message = `Json Web Token is invalid, Try again!`;
    err = new ErrorHandler(message, 400);
  }

  // Handle expired JWT error
  if (err.name === "TokenExpiredError") {
    const message = `Json Web Token is expired, Try again!`;
    err = new ErrorHandler(message, 400);
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    const message = `Invalid ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // Handle Mongoose validation errors (optional, for better error messages)
  const errorMessage = err.errors
    ? Object.values(err.errors)
        .map((error) => error.message)
        .join(" ")
    : err.message;

  // Return the error response
  return res.status(err.statusCode).json({
    success: false,
    message: errorMessage,
  });
};

export default ErrorHandler;
