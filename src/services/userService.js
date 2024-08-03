import { env } from "~/config/environment";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

import ApiError from "~/utils/ApiError";

import { userModel } from "~/models/userModel";

const JWT_SECRET = env.JWT_SECRET;

const register = async (reqBody) => {
  const { username, email, password } = reqBody;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { username, email, password: hashedPassword };

  const createdUser = await userModel.register(newUser);

  // lấy bản ghi board sau khi gọi
  const getNewUser = await userModel.findOneById(
    createdUser.insertedId.toString()
  );

  return getNewUser;
};

const authenticateUser = async (reqBody) => {
  const { email, password } = reqBody;

  const user = await userModel.findOneByEmail(email);

  if (!user) throw new Error("User not found");

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error("Invalid password");

  const token = jwt.sign({ userId: user._id }, JWT_SECRET);
  return token;
};

const getAllUsers = async () => {
  try {
    const allUsers = await userModel.getAllUsers();
    return allUsers;
  } catch (error) {
    throw error;
  }
};

const getUserById = async (userId) => {
  try {
    const user = await userModel.findOneById(userId);

    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }

    return user;
  } catch (error) {
    throw error;
  }
};

const update = async (userId, reqBody) => {
  const { username, password } = reqBody;

  try {
    // const hashedPassword = await bcrypt.hash(password, 10);
    // // const hashedUser = { username, password: hashedPassword };

    // const updateData = {
    //   // ...reqBody,
    //   username: username,
    //   password: hashedPassword,
    //   updatedAt: Date.now(),
    // };

    let updateData = {};

    if (username) {
      updateData.username = username;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateData.password = hashedPassword;
    }

    if (Object.keys(updateData).length === 0) {
      // return res.status(400).send('No valid fields provided for update');
      return new ApiError(
        StatusCodes.BAD_REQUEST,
        new Error("No valid fields provided for update").message
      );
    }

    await userModel.update(userId, updateData);
    return {
      modifyUserResult: "User's information has been modified successfully!",
    };
  } catch (error) {
    throw error;
  }
};

export const userService = {
  register,
  authenticateUser,
  getAllUsers,
  getUserById,
  update,
};
