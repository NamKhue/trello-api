import Joi from "joi";
import { ObjectId } from "mongodb";

import { GET_DB } from "~/config/mongodb";

const INVALID_UPDATE_FIELDS = ["_id", "createdAt", "email"];

// define collection (name & schema)
const USER_COLLECTION_NAME = "users";
const USER_COLLECTION_SCHEMA = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required().disallow(""),

  createdAt: Joi.date().timestamp("javascript").default(Date.now),
  updatedAt: Joi.date().timestamp("javascript").default(null),
  _destroy: Joi.boolean().default(false),
});

const getAllUsers = async () => {
  try {
    const users = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .find()
      .toArray();

    return users;
  } catch (error) {
    throw new Error(error);
  }
};

const findOneById = async (userId) => {
  try {
    const user = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOne({
        _id: new ObjectId(userId),
      });

    return user;
  } catch (error) {
    throw new Error(error);
  }
};

const findOneByEmail = async (email) => {
  try {
    const result = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOne({ email: email });

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

const validateBeforeCreating = async (data) => {
  return await USER_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
};

const register = async (data) => {
  try {
    const validData = await validateBeforeCreating(data);
    const createdUser = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .insertOne(validData);

    return createdUser;
  } catch (error) {
    throw new Error(error);
  }
};

const update = async (userId, updateData) => {
  try {
    // lọc ra những field khong được phép cập nhật
    Object.keys(updateData).forEach((fieldName) => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        delete updateData[fieldName];
      }
    });

    updateData = { ...updateData, updatedAt: Date.now() };

    const result = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { $set: updateData },
        {
          returnDocument: "after", // bắt buộc cần thì mới trả về DB đã được cập nhật
        }
      );

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

export const userModel = {
  USER_COLLECTION_NAME,
  USER_COLLECTION_SCHEMA,
  getAllUsers,
  findOneById,
  findOneByEmail,
  register,
  update,
};
