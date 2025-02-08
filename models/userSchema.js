import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, "Name is required!"],
  },
  email: {
    type: String,
    required: [true, "Email is required!"],
    unique: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address!"],
  },
  phone: {
    type: String,
    required: [true, "Phone number is required!"],
    match: [/^\d{10}$/, "Phone number must be 10 digits!"]
  },
  aboutMe: {
    type: String,
    required: [true, "About Me section is required!"],
  },
  password: {
    type: String,
    required: [true, "Password is required!"],
    minlength: [8, "Password must contain at least 8 characters!"],
    select: false,
  },
  avatar: {
    public_id: {
      type: String,
      required: [true, "Avatar public ID is required!"],
    },
    url: {
      type: String,
      required: [true, "Avatar URL is required!"],
    },
  },
  resume: {
    public_id: {
      type: String,
      required: [true, "Resume public ID is required!"],
    },
    url: {
      type: String,
      required: [true, "Resume URL is required!"],
    },
  },
  portfolioURL: {
    type: String,
    default: null,
    match: [/^(https?:\/\/)?(www\.)?[a-zA-Z0-9._-]+\.[a-zA-Z]{2,}([a-zA-Z0-9._-]*)?$/, "Invalid Portfolio URL!"],
  },
  githubURL: {
    type: String,
    match: [/^(https?:\/\/)?(www\.)?github\.com\/[^\s]+$/, "Invalid GitHub URL!"],
  },
  leetcodeURL: {
    type: String,
    match: [/^(https?:\/\/)?(www\.)?leetcode\.com\/[^\s]+$/, "Invalid leetcode URL!"],
  },
  twitterURL: {
    type: String,
    match: [/^(https?:\/\/)?(www\.)?twitter\.com\/[^\s]+$/, "Invalid Twitter URL!"],
  },
  linkedInURL: {
    type: String,
    match: [/^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[^\s]+$/, "Invalid LinkedIn URL!"],
  },
  facebookURL: {
    type: String,
    match: [/^(https?:\/\/)?(www\.)?facebook\.com\/[^\s]+$/, "Invalid Facebook URL!"],
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare user password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.generateJsonWebToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

// Generate reset password token
userSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash and set reset password token
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expiration time (15 minutes)
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

export const User = mongoose.model("User", userSchema);
