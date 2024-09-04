/* eslint-disable indent */
import Joi from "joi";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "~/utils/validators";
import { ObjectId } from "mongodb";

import { GET_DB } from "~/config/mongodb";
import { CARD_CONSTANTS } from "~/utils/constants";
// import { notificationService } from "~/services/notificationService";

// xác định những Fields mà chúng ta không muốn cho phép cập nhật trong hàm update()
const INVALID_UPDATE_FIELDS = ["_id", "createdAt", "boardId"];

// Define Collection (name & schema)
const CARD_COLLECTION_NAME = "cards";
const CARD_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  columnId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  creatorId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),

  title: Joi.string().required().min(3).max(50).trim().strict(),
  description: Joi.string().default(""),

  status: Joi.string().default(""),
  statusTextColor: Joi.string().default(""),
  statusBgColor: Joi.string().default(""),

  priority: Joi.string().default(""),
  priorityTextColor: Joi.string().default(""),
  priorityBgColor: Joi.string().default(""),

  deadlineAt: Joi.string().default(""),
  notifyBefore: Joi.number().integer().min(0).default(0),
  notifyUnit: Joi.string()
    .valid(
      CARD_CONSTANTS.NOTIFY_UNIT.DAY,
      CARD_CONSTANTS.NOTIFY_UNIT.HOUR,
      CARD_CONSTANTS.NOTIFY_UNIT.MINUTE,
      CARD_CONSTANTS.NOTIFY_UNIT.WEEK
    )
    .default(CARD_CONSTANTS.NOTIFY_UNIT.MINUTE),

  members: Joi.array()
    .items(
      Joi.object({
        userId: Joi.string()
          .required()
          .pattern(OBJECT_ID_RULE)
          .message(OBJECT_ID_RULE_MESSAGE),
        username: Joi.string().min(3).max(30).required(),
        email: Joi.string().email().required(),
        joinedAt: Joi.date().timestamp("javascript").default(null),
        updatedAt: Joi.date().timestamp("javascript").default(null),
      })
    )
    .default([]),

  createdAt: Joi.date()
    .timestamp("javascript")
    .default(() => Date.now()),
  updatedAt: Joi.date().timestamp("javascript").default(null),
  _destroy: Joi.boolean().default(false),
});

// =============================================================================================================================
const validateBeforeCreating = async (data) => {
  return await CARD_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
};

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreating(data);

    // biến đổi dữ liệu từ string sang objectId để lưu vào DB
    let newCardToAdd = {
      ...validData,
      boardId: new ObjectId(validData.boardId),
      columnId: new ObjectId(validData.columnId),
      creatorId: new ObjectId(validData.creatorId),
    };

    const createdCard = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .insertOne(newCardToAdd);

    return createdCard;
  } catch (error) {
    throw new Error(error);
  }
};

// =============================================================================================================================
const findOneById = async (cardId) => {
  try {
    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .findOne({
        _id: new ObjectId(cardId),
      });

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

// =============================================================================================================================
const update = async (cardId, updateData) => {
  try {
    // lọc ra những field khong được phép cập nhật
    Object.keys(updateData).forEach((fieldName) => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        delete updateData[fieldName];
      }
    });

    // console.log("updateData.columnId:", updateData.columnId);

    // đối với những dữ liệu liên quan đến ObjectId, thì biến đổi ở đây
    if (updateData.columnId) {
      updateData.columnId = new ObjectId(updateData.columnId);
    }

    // console.log("updateData:", updateData);

    // đọc findOneAndUpdate
    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          // 67 - có cần destroy khong?
          _id: new ObjectId(cardId),
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

// const convertToMinutes = (value, unit) => {
//   switch (unit) {
//     case "hour":
//       return value * 60;
//     case "day":
//       return value * 60 * 24;
//     case "week":
//       return value * 60 * 24 * 7;
//     case "minute":
//     default:
//       return value;
//   }
// };

const updateCard = async (cardId, updateData) => {
  try {
    // lọc ra những field khong được phép cập nhật
    Object.keys(updateData).forEach((fieldName) => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        delete updateData[fieldName];
      }
    });

    // console.log("updateData.columnId:", updateData.columnId);

    // đối với những dữ liệu liên quan đến ObjectId, thì biến đổi ở đây
    if (updateData.columnId) {
      updateData.columnId = new ObjectId(updateData.columnId);
    }
    if (updateData.members) {
      updateData.members = updateData.members.map((member) => {
        member.userId = new ObjectId(member.userId);
        return member;
      });
    }
    // if (updateData.cardOrderIds) {
    //   updateData.cardOrderIds = updateData.cardOrderIds.map(
    //     (_id) => new ObjectId(_id)
    //   );
    // }

    // console.log("updateData:", updateData);

    // đọc findOneAndUpdate
    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          // 67 - có cần destroy khong?
          _id: new ObjectId(cardId),
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

// =============================================================================================================================
const addUserIntoCard = async (cardId, assigneeData) => {
  try {
    assigneeData = {
      ...assigneeData,
      userId: new ObjectId(assigneeData.userId),
    };

    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(cardId) },
        { $push: { members: assigneeData }, $set: { updatedAt: Date.now() } },
        {
          returnDocument: "after",
        }
      );

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

// =============================================================================================================================
const removeUserFromCard = async (cardId, assigneeId) => {
  try {
    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(cardId) },
        {
          $pull: { members: { userId: new ObjectId(assigneeId) } },
          $set: { updatedAt: Date.now() },
        },
        {
          returnDocument: "after",
        }
      );

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

// =============================================================================================================================
const deleteOneById = async (cardId) => {
  try {
    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .deleteOne({
        _id: new ObjectId(cardId),
      });

    // console.log('deleteOneByIdResult:', result)

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

// =============================================================================================================================
const deleteManyByColumnId = async (columnId) => {
  try {
    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .deleteMany({
        columnId: new ObjectId(columnId),
      });

    // console.log('deleteManyByColumnIdResult:', result)

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

// =============================================================================================================================
const findAllCardsByBoardId = async (boardId) => {
  boardId = boardId.toString();

  try {
    const allCardsOfBoard = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .find({ boardId: new ObjectId(boardId) })
      .toArray();

    return allCardsOfBoard;
  } catch (error) {
    throw error;
  }
};

// =============================================================================================================================
// =============================================================================================================================
export const cardModel = {
  CARD_COLLECTION_NAME,
  CARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  update,
  updateCard,
  addUserIntoCard,
  removeUserFromCard,
  deleteOneById,
  deleteManyByColumnId,
  findAllCardsByBoardId,
};
