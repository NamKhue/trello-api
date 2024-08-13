import Joi from "joi";
import { StatusCodes } from "http-status-codes";

import ApiError from "~/utils/ApiError";

import { ROLE_TYPES } from "~/utils/constants";

import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "~/utils/validators";

// ================================================================================================================
const createBoardUserSchema = Joi.object({
  boardId: Joi.string().required(),
  userId: Joi.string().required(),
  role: Joi.string()
    .valid(ROLE_TYPES.OWNER, ROLE_TYPES.MEMBER, ROLE_TYPES.CREATOR)
    .required(),
});

const validateCreateBoardUser = async (req, res, next) => {
  try {
    await createBoardUserSchema.validateAsync(req.body, { abortEarly: false });

    next();
  } catch (error) {
    next(
      new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
    );
  }
};

// ================================================================================================================
const updateBoardUserSchema = Joi.object({
  role: Joi.string().valid("owner", "member").required(),
});

const validateUpdateBoardUser = async (req, res, next) => {
  try {
    await updateBoardUserSchema.validateAsync(req.body, { abortEarly: false });

    next();
  } catch (error) {
    next(
      new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
    );
  }
};

// ================================================================================================================
const roleChangeCondition = Joi.object({
  boardId: Joi.string()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE)
    .required(),
  userId: Joi.string()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE)
    .required(),
  role: Joi.string().valid(ROLE_TYPES.OWNER, ROLE_TYPES.MEMBER).required(),
});

const validateRoleChange = async (req, res, next) => {
  try {
    await roleChangeCondition.validateAsync(req.body, { abortEarly: false });

    next();
  } catch (error) {
    next(
      new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
    );
  }
};

export const boardUserValidation = {
  validateCreateBoardUser,
  validateUpdateBoardUser,
  validateRoleChange,
};
