import Joi from "joi";
import { ObjectId } from "mongodb";

import { GET_DB } from "~/config/mongodb";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "~/utils/validators";
import { BOARD_TYPES } from "~/utils/constants";
import { columnModel } from "~/models/columnModel";
import { cardModel } from "~/models/cardModel";

// xác định những Fields mà chúng ta không muốn cho phép cập nhật trong hàm update()
const INVALID_UPDATE_FIELDS = ["_id", "createdAt"];

// define collection (name & schema)
const BOARD_COLLECTION_NAME = "boards";
const BOARD_COLLECTION_SCHEMA = Joi.object({
  userId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  title: Joi.string().required().min(3).max(50).trim().strict(),
  slug: Joi.string().required().min(3).trim().strict(),
  // description: Joi.string().required().min(3).max(255).trim().strict(),
  // type: Joi.string().valid(BOARD_TYPES.PUBLIC, BOARD_TYPES.PRIVATE).required(),

  description: Joi.string().min(3).max(255).trim().strict().default(""),
  type: Joi.string().valid(BOARD_TYPES.PUBLIC, BOARD_TYPES.PRIVATE).default(""),

  columnOrderIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),

  createdAt: Joi.date().timestamp("javascript").default(Date.now),
  updatedAt: Joi.date().timestamp("javascript").default(null),
  _destroy: Joi.boolean().default(false),
});

const getAllBoards = async () => {
  try {
    const allBoards = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .find()
      .toArray();

    return allBoards;
  } catch (error) {
    throw new Error(error);
  }
};

const validateBeforeCreating = async (data) => {
  return await BOARD_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
};

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreating(data);
    const createdBoard = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .insertOne(validData);

    return createdBoard;
  } catch (error) {
    throw new Error(error);
  }
};

const findOneById = async (boardId) => {
  try {
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOne({
        _id: new ObjectId(boardId),
      });

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

const getDetails = async (id) => {
  try {
    // const result = await GET_DB().collection(BOARD_COLLECTION_NAME).findOne({
    //   _id: new ObjectId(id)
    // })

    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .aggregate([
        {
          $match: {
            _id: new ObjectId(id),
            _destroy: false,
          },
        },
        {
          $lookup: {
            from: columnModel.COLUMN_COLLECTION_NAME,
            localField: "_id",
            foreignField: "boardId",
            as: "columns",
          },
        },
        {
          $lookup: {
            from: cardModel.CARD_COLLECTION_NAME,
            localField: "_id",
            foreignField: "boardId",
            as: "cards",
          },
        },
      ])
      .toArray();

    return result[0] || null;
  } catch (error) {
    throw new Error(error);
  }
};

// đẩy (push) giá trị columnId vào mảng columnOrderIds
const pushColumnOrderIds = async (column) => {
  try {
    // đọc findOneAndUpdate
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          // 67 - có cần destroy khong?
          _id: new ObjectId(column.boardId),
        },
        {
          $push: {
            columnOrderIds: new ObjectId(column._id),
          },
        },
        {
          returnDocument: "after", // bắt buộc cần thì mới trả về DB đã được cập nhật
        }
      );

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

const update = async (boardId, updateData) => {
  try {
    // lọc ra những field khong được phép cập nhật
    Object.keys(updateData).forEach((fieldName) => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        delete updateData[fieldName];
      }
    });

    // đối với những dữ liệu liên quan đến ObjectId, thì biến đổi ở đây
    if (updateData.columnOrderIds) {
      updateData.columnOrderIds = updateData.columnOrderIds.map(
        (_id) => new ObjectId(_id)
      );
    }

    // console.log('updateData:', updateData)

    // đọc findOneAndUpdate
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          // 67 - có cần destroy khong?
          _id: new ObjectId(boardId),
        },
        {
          $set: updateData,
        },
        {
          returnDocument: "after", // bắt buộc cần thì mới trả về DB đã được cập nhật
        }
      );

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

// lấy giá trị columnId ra khỏi mảng columnOrderIds và xóa đi
const pullColumnOrderIds = async (column) => {
  try {
    // đọc findOneAndUpdate
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          _id: new ObjectId(column.boardId),
        },
        {
          $pull: {
            columnOrderIds: new ObjectId(column._id),
          },
        },
        {
          returnDocument: "after", // bắt buộc cần thì mới trả về DB đã được cập nhật
        }
      );

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

export const boardModel = {
  BOARD_COLLECTION_NAME,
  BOARD_COLLECTION_SCHEMA,
  getAllBoards,
  createNew,
  findOneById,
  getDetails,
  pushColumnOrderIds,
  update,
  pullColumnOrderIds,
};
