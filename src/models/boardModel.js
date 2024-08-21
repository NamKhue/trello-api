import Joi from "joi";
import { ObjectId } from "mongodb";

import { GET_DB } from "~/config/mongodb";

import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "~/utils/validators";
import { BOARD_TYPES, ROLE_TYPES } from "~/utils/constants";

import { columnModel } from "~/models/columnModel";
import { cardModel } from "~/models/cardModel";
import { boardUserModel } from "./boardUserModel";
import ApiError from "~/utils/ApiError";
import { StatusCodes } from "http-status-codes";

// ================================================================================================================
// xác định những Fields mà chúng ta không muốn cho phép cập nhật trong hàm update()
const INVALID_UPDATE_FIELDS = ["_id", "createdAt"];

// ================================================================================================================
// define collection (name & schema)
const BOARD_COLLECTION_NAME = "boards";
const BOARD_COLLECTION_SCHEMA = Joi.object({
  title: Joi.string().required().min(3).max(50).trim().strict(),
  slug: Joi.string().required().min(3).trim().strict(),
  // description: Joi.string().required().min(3).max(255).trim().strict(),
  // type: Joi.string().valid(BOARD_TYPES.PUBLIC, BOARD_TYPES.PRIVATE).required(),

  // description: Joi.string().min(3).max(255).trim().strict(),

  userId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),

  type: Joi.string().valid(BOARD_TYPES.PUBLIC, BOARD_TYPES.PRIVATE).default(""),

  columnOrderIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),

  createdAt: Joi.date().timestamp("javascript").default(Date.now),
  updatedAt: Joi.date().timestamp("javascript").default(null),
  _destroy: Joi.boolean().default(false),
});

// ================================================================================================================
// const getAllBoards = async (userId) => {
//   try {
//     const allBoards = await GET_DB()
//       .collection(BOARD_COLLECTION_NAME)
//       .aggregate([
//         {
//           $lookup: {
//             from: boardUserModel.BOARD_USER_COLLECTION_NAME,
//             localField: "_id",
//             foreignField: "boardId",
//             as: "board_users",
//           },
//         },
//         {
//           $match: {
//             "board_users.userId": new ObjectId(userId),
//           },
//         },
//       ])
//       .toArray();

//     return allBoards;
//   } catch (error) {
//     throw new Error(error);
//   }
// };

const getAllBoards = async (userId) => {
  try {
    // Find all board entries where the user is an 'owner' or 'member'
    const userBoards = await GET_DB()
      .collection(boardUserModel.BOARD_USER_COLLECTION_NAME)
      .find({
        userId: new ObjectId(userId),
        role: {
          $in: [ROLE_TYPES.CREATOR, ROLE_TYPES.OWNER, ROLE_TYPES.MEMBER],
        },
      })
      .toArray();

    if (userBoards.length === 0) {
      return [];
    }

    // Extract boardIds from userBoards
    const boardIds = userBoards.map((boardUser) => boardUser.boardId);

    // Retrieve board details using the boardIds
    const allBoards = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .find({
        _id: { $in: boardIds },
        _destroy: false,
      })
      .toArray();

    return allBoards;
  } catch (error) {
    throw new Error(error);
  }
};

// ================================================================================================================
const getCreatorBoards = async (userId) => {
  // Find all boards where the user is a creator
  const boardUserEntries = await GET_DB()
    .collection(boardUserModel.BOARD_USER_COLLECTION_NAME)
    .find({
      userId: new ObjectId(userId),
      role: ROLE_TYPES.CREATOR,
    })
    .toArray();

  const boardIds = boardUserEntries.map((entry) => entry.boardId);

  // Fetch board details
  const boards = await GET_DB()
    .collection(boardModel.BOARD_COLLECTION_NAME)
    .find({
      _id: { $in: boardIds },
    })
    .toArray();

  return boards;
};

// ================================================================================================================
// const validateBoardData = (data) => {
//   const { error, value } = BOARD_COLLECTION_SCHEMA.validate(data, {
//     abortEarly: false,
//   });
//   if (error) {
//     throw new Error(error.details.map((detail) => detail.message).join(", "));
//   }

//   // Convert userId to ObjectId
//   value.userId = new ObjectId(value.userId);

//   return value;
// };

// ================================================================================================================
const createNew = async (creatorId, boardData) => {
  try {
    const { error, value } = BOARD_COLLECTION_SCHEMA.validate(boardData, {
      abortEarly: false,
    });
    if (error) {
      throw new Error(error.details.map((detail) => detail.message).join(", "));
    }

    const validData = {
      ...value,
      userId: new ObjectId(creatorId),
      createdAt: Date.now(),
      // updatedAt: Date.now(),
      _destroy: false,
    };

    const createdBoard = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .insertOne(validData);

    // // Add the creator to the board_users collection with 'creator' role
    // await GET_DB()
    //   .collection(boardUserModel.BOARD_USER_COLLECTION_NAME)
    //   .insertOne({
    //     boardId: createdBoard.insertedId,
    //     userId: new ObjectId(creatorId),
    //     role: "creator",
    //     createdAt: Date.now(),
    //   });

    return createdBoard;
    // return createdBoard.ops[0];
  } catch (error) {
    throw new Error(error);
  }
};

// ================================================================================================================
// old ver of get details of board
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

// new ver of get details of board
const getBoardById = async (boardId) => {
  try {
    const board = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .aggregate([
        { $match: { _id: new ObjectId(boardId) } },
        // {
        //   $lookup: {
        //     from: boardUserModel.BOARD_USER_COLLECTION_NAME,
        //     localField: "_id",
        //     foreignField: "boardId",
        //     as: "boardUsers",
        //   },
        // },
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
        // {
        //   $match: { "boardUsers.userId": new ObjectId(userId) },
        // },
      ])
      .toArray();

    return board[0];
  } catch (error) {
    throw new Error(error);
  }
};

// ================================================================================================================
// purpose is find the created one to return result in service layer
const findOneById = async (boardId) => {
  boardId = boardId.toString();

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

// ================================================================================================================
// old ver of update board
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

// new ver of update board
const updateBoard = async (userId, boardId, updateData) => {
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

  try {
    const boardUser = await GET_DB()
      .collection(boardUserModel.BOARD_USER_COLLECTION_NAME)
      .findOne({
        boardId: new ObjectId(boardId),
        userId: new ObjectId(userId),
        role: ROLE_TYPES.CREATOR || ROLE_TYPES.OWNER,
      });

    if (!boardUser) {
      throw ApiError(
        StatusCodes.UNAUTHORIZED,
        new Error("Not authorized to update this board").message
      );
      // throw new Error("Not authorized to update this board");
    }

    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(boardId) },
        { $set: updateData },
        { returnOriginal: false, returnDocument: "after" }
      );

    return result.value;
  } catch (error) {
    throw new Error(error);
  }
};

// ================================================================================================================
// const deleteBoard = async (userId, boardId) => {
//   try {
//     const boardUser = await GET_DB()
//       .collection(boardUserModel.BOARD_USER_COLLECTION_NAME)
//       .findOne({
//         boardId: new ObjectId(boardId),
//         userId: new ObjectId(userId),
//         role: { $in: [ROLE_TYPES.OWNER, ROLE_TYPES.CREATOR] },
//       });

//     if (!boardUser) {
//       throw ApiError(
//         StatusCodes.UNAUTHORIZED,
//         new Error("Not authorized to delete this board").message
//       );
//       // throw new Error('Not authorized to delete this board');
//     }

//     await GET_DB()
//       .collection(BOARD_COLLECTION_NAME)
//       .deleteOne({ _id: new ObjectId(boardId) });
//     await GET_DB()
//       .collection(boardUserModel.BOARD_USER_COLLECTION_NAME)
//       .deleteMany({ boardId: new ObjectId(boardId) });

//     return true;
//   } catch (error) {
//     throw new Error(error);
//   }
// };

const deleteBoard = async (userId, boardId) => {
  try {
    // Find all columns related to the board
    const columns = await GET_DB()
      .collection(columnModel.COLUMN_COLLECTION_NAME)
      .find({ boardId: new ObjectId(boardId) })
      .toArray();

    // Delete all cards in each column
    for (const column of columns) {
      await GET_DB()
        .collection(cardModel.CARD_COLLECTION_NAME)
        .deleteMany({ columnId: column._id });
    }

    // Delete all columns related to the board
    await GET_DB()
      .collection(columnModel.COLUMN_COLLECTION_NAME)
      .deleteMany({ boardId: new ObjectId(boardId) });

    // Delete the board itself
    await GET_DB()
      .collection(boardModel.BOARD_COLLECTION_NAME)
      .deleteOne({ _id: new ObjectId(boardId) });

    const boardUser = await GET_DB()
      .collection(boardUserModel.BOARD_USER_COLLECTION_NAME)
      .findOne({
        boardId: new ObjectId(boardId),
        userId: new ObjectId(userId),
        role: { $in: [ROLE_TYPES.OWNER, ROLE_TYPES.CREATOR] },
      });

    if (!boardUser) {
      throw ApiError(
        StatusCodes.UNAUTHORIZED,
        new Error("Not authorized to delete this board").message
      );
      // throw new Error('Not authorized to delete this board');
    }

    await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .deleteOne({ _id: new ObjectId(boardId) });
    await GET_DB()
      .collection(boardUserModel.BOARD_USER_COLLECTION_NAME)
      .deleteMany({ boardId: new ObjectId(boardId) });

    // await session.commitTransaction();
    return true;
  } catch (error) {
    throw new Error("Error deleting board and its related columns and cards");
  }
};

// ================================================================================================================
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

// ================================================================================================================
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

// ================================================================================================================
export const boardModel = {
  BOARD_COLLECTION_NAME,
  BOARD_COLLECTION_SCHEMA,
  getAllBoards,
  getCreatorBoards,
  createNew,
  findOneById,
  getDetails,
  getBoardById,
  update,
  updateBoard,
  deleteBoard,
  pushColumnOrderIds,
  pullColumnOrderIds,
};
