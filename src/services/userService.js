import { env } from "~/config/environment";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import crypto from "crypto";

import nodemailer from "nodemailer";

import ApiError from "~/utils/ApiError";

import { userModel } from "~/models/userModel";
import { boardModel } from "~/models/boardModel";
import { invitationModel } from "~/models/invitationModel";

const JWT_SECRET = env.JWT_SECRET;

const register = async (reqBody) => {
  const { username, email, password } = reqBody;

  const existingUser = await userModel.findOneByEmail(email);
  if (existingUser) {
    // throw new Error('Email is already in use');
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      new Error("Email is already in use").message
    );
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = {
    email,
    username,
    password: hashedPassword,
  };

  const createdUser = await userModel.register(newUser);

  // lấy bản ghi board sau khi gọi
  const getNewUser = await userModel.findOneById(
    createdUser.insertedId.toString()
  );

  // Generate a token
  const token = jwt.sign({ email: getNewUser.email }, JWT_SECRET, {
    expiresIn: "1h",
  });

  return { token, user: { username, email } };
};

const authenticateUser = async (reqBody) => {
  const { email, password } = reqBody;

  const user = await userModel.findOneByEmail(email);

  if (!user) throw new Error("User is not found");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid password");

  const token = jwt.sign({ userId: user._id }, JWT_SECRET);
  return { token, user };
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
      throw new ApiError(
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

const sendInvitationEmail = async (
  inviterID,
  inviterEmail,
  recipientEmail,
  boardId,
  token
) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: env.USER_MAILTRAP,
        pass: env.PWD_MAILTRAP,
      },
    });

    const targetBoard = await boardModel.getBoardById(inviterID, boardId);
    const invitationLink = `http://${env.FRONTEND_HOST}:${env.FRONTEND_PORT}/accept-invitation?token=${token}`;
    const messageEmail = `You have been invited to join my board - ${targetBoard.title.toUpperCase()}. Please join and follow this link:\n ${invitationLink}`;
    const subjectTitle = "Board Invitation";

    const emailData = {
      from: inviterEmail,
      to: recipientEmail,
      subject: subjectTitle,
      text: messageEmail,
    };

    await transporter.sendMail(emailData);
  } catch (error) {
    throw error;
  }
};

const generateToken = () => {
  return crypto.randomBytes(16).toString("hex");
};

const storePendingInvitation = async (inviterId, recipientEmail, boardId) => {
  try {
    const token = generateToken();

    await invitationModel.createInvitation(
      inviterId,
      recipientEmail,
      boardId,
      token
    );

    return token;
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
  sendInvitationEmail,
  storePendingInvitation,
};
