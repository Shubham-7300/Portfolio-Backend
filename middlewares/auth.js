// import { User } from "../models/userSchema.js";
// import { catchAsyncErrors } from "./catchAsyncErrors.js";
// import ErrorHandler from "./error.js";
// import jwt from "jsonwebtoken";

// export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
//   const { token } = req.cookies;
//   if (!token) {
//     return next(new ErrorHandler("User not Authenticated!", 400));
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
//     req.user = await User.findById(decoded.id);
//     next();
//   } catch (error) {
//     return res.status(403).json({ success: false, message: "Invalid Token" });
//   }
// });




import { User } from "../models/userSchema.js";
import { catchAsyncErrors } from "./catchAsyncErrors.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken";

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  // Ensure cookies are available
  if (!req.cookies || !req.cookies.token) {
    return next(new ErrorHandler("Authentication failed! Token not found.", 401));
  }

  const { token } = req.cookies;

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // Find the user from the decoded token
    const user = await User.findById(decoded.id);

    // If user doesn't exist in the database
    if (!user) {
      return next(new ErrorHandler("User not found! Authentication failed.", 404));
    }

    // Attach user information to the request object
    req.user = user;

    // Proceed to the next middleware
    next();
  } catch (error) {
    // Handle invalid or expired token errors
    if (error.name === "JsonWebTokenError") {
      return next(new ErrorHandler("Invalid token! Please log in again.", 401));
    }

    if (error.name === "TokenExpiredError") {
      return next(new ErrorHandler("Session expired! Please log in again.", 401));
    }

    // Handle other unexpected errors
    return next(new ErrorHandler("Authentication error! Please try again later.", 500));
  }
});
