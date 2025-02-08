import { v2 as cloudinary } from "cloudinary";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { generateToken } from "../utils/jwtToken.js";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
import mongoose from 'mongoose';

const uploadToCloudinary = async (file, folder) => {
  try {
    const response = await cloudinary.uploader.upload(file.tempFilePath, { folder });
    return {
      public_id: response.public_id,
      url: response.secure_url,
    };
  } catch (error) {
    throw new Error("Failed to upload file to Cloudinary");
  }
};

export const register = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Avatar and Resume are Required!", 400));
  }
  const { avatar, resume } = req.files;

  const avatarData = await uploadToCloudinary(avatar, "PORTFOLIO AVATAR");
  const resumeData = await uploadToCloudinary(resume, "PORTFOLIO RESUME");

  const {
    fullName,
    email,
    phone,
    aboutMe,
    password,
    portfolioURL,
    githubURL,
    leetcodeURL,
    twitterURL,
    facebookURL,
    linkedInURL,
  } = req.body;

  const user = await User.create({
    fullName,
    email,
    phone,
    aboutMe,
    password,
    portfolioURL,
    githubURL,
    leetcodeURL,
    twitterURL,
    facebookURL,
    linkedInURL,
    avatar: avatarData,
    resume: resumeData,
  });
  generateToken(user, "Registered!", 201, res);
});


export const login = catchAsyncErrors(async (req, res, next) => {
  // Log the request body for debugging purposes
  console.log(req.body); // This will log the incoming data in the console

  const { email, password } = req.body;

  // Ensure both email and password are provided
  if (!email || !password) {
    return next(new ErrorHandler("Provide Email And Password!", 400));
  }

  // Try to find the user in the database by email
  const user = await User.findOne({ email }).select("+password");

  // If no user is found, return an error
  if (!user) {
    return next(new ErrorHandler("Invalid Email Or Password!", 404));
  }

  // Check if the provided password matches the stored one
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email Or Password!", 401));
  }

  // Generate a token for the user if authentication is successful
  generateToken(user, "Login Successfully!", 200, res);
});


export const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
      sameSite: "None",
      secure: true
    })
    .json({
      success: true,
      message: "Logged Out!",
    });
});

export const getUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    user,
  });
});




export const getUserForPortfolio = catchAsyncErrors(async (req, res, next) => {
  // const id = new mongoose.Types.ObjectId();
  // console.log(id); 
  const id = "67a49cea1a9a7b3533e32844";
  // const id = "67a65cd1b7caabff9d84d28c";
  const user = await User.findById(id);
  res.status(200).json({
    success: true,
    user,
  });
});




export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
    aboutMe: req.body.aboutMe,
    githubURL: req.body.githubURL,
    leetcodeURL: req.body.leetcodeURL,
    portfolioURL: req.body.portfolioURL,
    facebookURL: req.body.facebookURL,
    twitterURL: req.body.twitterURL,
    linkedInURL: req.body.linkedInURL,
  };

  const user = await User.findById(req.user.id);

  if (req.files?.avatar) {
    await cloudinary.uploader.destroy(user.avatar.public_id);
    newUserData.avatar = await uploadToCloudinary(req.files.avatar, "PORTFOLIO AVATAR");
  }

  if (req.files?.resume) {
    if (user.resume?.public_id) {
      await cloudinary.uploader.destroy(user.resume.public_id);
    }
    newUserData.resume = await uploadToCloudinary(req.files.resume, "PORTFOLIO RESUME");
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    message: "Profile Updated!",
    user: updatedUser,
  });
});

export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  const user = await User.findById(req.user.id).select("+password");

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return next(new ErrorHandler("Please Fill All Fields.", 400));
  }
  const isPasswordMatched = await user.comparePassword(currentPassword);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Incorrect Current Password!"));
  }
  if (newPassword !== confirmNewPassword) {
    return next(new ErrorHandler("New Password And Confirm New Password Do Not Match!"));
  }
  user.password = newPassword;
  await user.save();
  res.status(200).json({
    success: true,
    message: "Password Updated!",
  });
});



export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorHandler("User Not Found!", 404));
  }
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${process.env.DASHBOARD_URL}/password/reset/${resetToken}`;

  const message = `Your Reset Password Token is:\n\n${resetPasswordUrl}\n\nIf you've not requested this email, please ignore it.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Personal Portfolio Dashboard Password Recovery",
      message,
    });
    res.status(201).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message, 500));
  }
});

export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.params;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ErrorHandler("Reset password token is invalid or has expired.", 400));
  }
  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password & Confirm Password do not match"));
  }
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  generateToken(user, "Reset Password Successfully!", 200, res);
});
