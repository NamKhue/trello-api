import Joi from "joi";
import { StatusCodes } from "http-status-codes";

import ApiError from "~/utils/ApiError";
// import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "~/utils/validators";

const validateUser = async (req, res, next) => {
  const correctCondition = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required().disallow(""),
  });

  try {
    // abortEarly: false  phục vụ cho trường hợp có nhiều lỗi validation thì trả về tất cả lỗi
    await correctCondition.validateAsync(req.body, { abortEarly: false });

    // validate dữ liệu hợp lệ thì đi tiếp sang controller/middleware
    next();
  } catch (error) {
    next(
      new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
    );
  }
};

const validateEmail = async (req, res, next) => {
  const correctCondition = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required().disallow(""),
  });

  try {
    // abortEarly: false  phục vụ cho trường hợp có nhiều lỗi validation thì trả về tất cả lỗi
    await correctCondition.validateAsync(req.body, { abortEarly: false });

    // validate dữ liệu hợp lệ thì đi tiếp sang controller/middleware
    next();
  } catch (error) {
    next(
      new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
    );
  }
};

const validateUserUpdate = async (req, res, next) => {
  const correctCondition = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(6).required().disallow(""),
  });

  try {
    // khi update data, allowUnknown cho phép khong cần đẩy lên DB 1 số field khong cần thiết
    await correctCondition.validateAsync(req.body, {
      abortEarly: false,
      allowUnknown: true,
    });

    if (req.body.email) {
      throw new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        new Error({ message: "Email cannot be modified" }).message
      );
      // return res.status(StatusCodes.BAD_REQUEST).send({ message: "Email cannot be modified" });
    }

    next();
  } catch (error) {
    next(
      new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
    );
  }
};

export const userValidation = {
  validateUser,
  validateEmail,
  validateUserUpdate,
};
