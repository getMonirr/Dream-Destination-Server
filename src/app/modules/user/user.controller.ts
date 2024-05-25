import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { UserService } from "./user.service";

const createUser = catchAsync(async (req, res) => {
  console.log({ req: req.body });

  const user = await UserService.createUserIntoDB(req.body);

  if (!user) {
    return sendResponse(res, {
      success: false,
      statusCode: httpStatus.BAD_REQUEST,
      message: "User not registered",
      data: null,
    });
  }

  return sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "User registered successfully",
    data: user,
  });
});

// login a user into the system
const loginUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await UserService.loginUser(email, password);

  if (!user) {
    return sendResponse(res, {
      success: false,
      statusCode: httpStatus.UNAUTHORIZED,
      message: "Invalid email or password",
      data: null,
    });
  }

  return sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User logged in successfully",
    data: user,
  });
});

// get user profile
const getUserProfile = catchAsync(async (req, res) => {
  const userId = req.user?.id;

  const user = await UserService.getUserProfile(userId);

  return sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User profile retrieved successfully",
    data: user,
  });
});

// update user profile
const updateUserProfile = catchAsync(async (req, res) => {
  const userId = req.user?.id;

  const user = await UserService.updateUserProfile(userId, req.body);

  return sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User profile updated successfully",
    data: user,
  });
});

// export user controller
export const UserController = {
  createUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
};