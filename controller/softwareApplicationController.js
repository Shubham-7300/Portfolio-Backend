import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { SoftwareApplication } from "../models/softwareApplicationSchema.js";
import { v2 as cloudinary } from "cloudinary";

// Add a new software application
export const addNewApplication = catchAsyncErrors(async (req, res, next) => {
  // Check if a file is uploaded
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(
      new ErrorHandler("Software Application Icon/Image is required!", 400)
    );
  }

  const { svg } = req.files;
  const { name } = req.body;

  // Validate the name field
  if (!name) {
    return next(new ErrorHandler("Please provide the software application's name!", 400));
  }

  try {
    // Upload the file to Cloudinary
    const cloudinaryResponse = await cloudinary.uploader.upload(svg.tempFilePath, {
      folder: "PORTFOLIO_SOFTWARE_APPLICATION_IMAGES",
    });

    if (!cloudinaryResponse || cloudinaryResponse.error) {
      return next(
        new ErrorHandler(
          `Failed to upload image to Cloudinary: ${
            cloudinaryResponse.error?.message || "Unknown error"
          }`,
          500
        )
      );
    }

    // Save application details in the database
    const softwareApplication = await SoftwareApplication.create({
      name,
      svg: {
        public_id: cloudinaryResponse.public_id,
        url: cloudinaryResponse.secure_url,
      },
    });

    // Send success response
    res.status(201).json({
      success: true,
      message: "New Software Application added successfully!",
      softwareApplication,
    });
  } catch (error) {
    return next(new ErrorHandler("An error occurred while adding the application.", 500));
  }
});

// Delete an existing software application
export const deleteApplication = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  // Find the software application by ID
  const softwareApplication = await SoftwareApplication.findById(id);

  if (!softwareApplication) {
    return next(new ErrorHandler("Software application not found or already deleted!", 404));
  }

  try {
    // Delete the associated image from Cloudinary
    const softwareApplicationSvgId = softwareApplication.svg.public_id;
    await cloudinary.uploader.destroy(softwareApplicationSvgId);

    // Remove the software application from the database
    await softwareApplication.deleteOne();

    res.status(200).json({
      success: true,
      message: "Software application deleted successfully!",
    });
  } catch (error) {
    return next(
      new ErrorHandler("An error occurred while deleting the application.", 500)
    );
  }
});

// Get all software applications
export const getAllApplications = catchAsyncErrors(async (req, res, next) => {
  try {
    const softwareApplications = await SoftwareApplication.find();

    res.status(200).json({
      success: true,
      softwareApplications,
    });
  } catch (error) {
    return next(
      new ErrorHandler("An error occurred while fetching applications.", 500)
    );
  }
});
