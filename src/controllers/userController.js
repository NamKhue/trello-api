import { StatusCodes } from "http-status-codes";

import { userService } from "~/services/userService";

const register = async (req, res, next) => {
  try {
    const createdUser = await userService.register(req.body);
    res.status(StatusCodes.OK).json(createdUser);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const token = await userService.authenticateUser(req.body);
    res.json({ token });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();

    res.status(StatusCodes.OK).json(users);
  } catch (error) {
    next(error);
  }
};

const getDetails = async (req, res, next) => {
  const userId = req.user.userId; // Extract userId from JWT payload

  try {
    const user = await userService.getUserById(userId);

    res.status(StatusCodes.OK).json(user);
  } catch (error) {
    console.error("Error getting user details:", error.message);
    res.status(500).send("Internal server error");
  }
};

const updateUserDetails = async (req, res, next) => {
  const userId = req.user.userId;

  try {
    const updateUser = await userService.update(userId, req.body);

    res.status(StatusCodes.OK).json(updateUser);
  } catch (error) {
    next(error);
  }
};

export const userController = {
  register,
  login,
  getDetails,
  updateUserDetails,
  getAllUsers,
};
