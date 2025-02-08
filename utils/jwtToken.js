export const generateToken = (user, message, statusCode, res) => {
  // Generate the token using the user's method
  const token = user.generateJsonWebToken();

  // Define the cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000 // Convert COOKIE_EXPIRE days to milliseconds
    ),
    httpOnly: true, // Ensures the cookie is only accessible via HTTP requests (prevents XSS attacks)
    // secure: process.env.NODE_ENV === "production", // Send secure cookies only in production
    // sameSite: "None", // Prevents CSRF attacks by restricting cross-origin usage
    sameSite: "None",
    secure: true
  };

  // Send the token as a cookie and include it in the JSON response
  res
    .status(statusCode)
    .cookie("token", token, cookieOptions)
    .json({
      success: true,
      message,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        // Include only non-sensitive user data
      },
      token,
    });
};
