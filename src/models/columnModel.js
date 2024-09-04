import Joi from "joi";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "~/utils/validators";
import { ObjectId } from "mongodb";

import { GET_DB } from "~/config/mongodb";

// =============================================================================================================================
// xác định những Fields mà chúng ta không muốn cho phép cập nhật trong hàm update()
const INVALID_UPDATE_FIELDS = ["_id", "createdAt", "boardId"];

// =============================================================================================================================
// Define Collection (name & schema)
const COLUMN_COLLECTION_NAME = "columns";
const COLUMN_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  title: Joi.string().required().min(3).max(50).trim().strict(),

  cardOrderIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),

  createdAt: Joi.date().timestamp("javascript").default(Date.now),
  updatedAt: Joi.date().timestamp("javascript").default(null),
  _destroy: Joi.boolean().default(false),
});

// =============================================================================================================================
const validateBeforeCreating = async (data) => {
  return await COLUMN_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
};

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreating(data);

    // biến đổi dữ liệu từ string sang objectId để lưu vào DB
    const newColumnToAdd = {
      ...validData,
      boardId: new ObjectId(validData.boardId),
    };

    const createdColumn = await GET_DB()
      .collection(COLUMN_COLLECTION_NAME)
      .insertOne(newColumnToAdd);

    return createdColumn;
  } catch (error) {
    throw new Error(error);
  }
};

// =============================================================================================================================
const findOneById = async (columnId) => {
  try {
    const result = await GET_DB()
      .collection(COLUMN_COLLECTION_NAME)
      .findOne({
        _id: new ObjectId(columnId),
      });

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

const findOneByBoardId = async (boardId) => {
  boardId = boardId.toString();

  try {
    const result = await GET_DB()
      .collection(COLUMN_COLLECTION_NAME)
      .find({
        boardId: new ObjectId(boardId),
      })
      .toArray();

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

// =============================================================================================================================
const update = async (columnId, updateData) => {
  try {
    // lọc ra những field khong được phép cập nhật
    Object.keys(updateData).forEach((fieldName) => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        delete updateData[fieldName];
      }
    });

    // đối với những dữ liệu liên quan đến ObjectId, thì biến đổi ở đây
    if (updateData.cardOrderIds) {
      updateData.cardOrderIds = updateData.cardOrderIds.map(
        (_id) => new ObjectId(_id)
      );
    }

    // console.log('updateData:', updateData)

    // đọc findOneAndUpdate
    const result = await GET_DB()
      .collection(COLUMN_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          // 67 - có cần destroy khong?
          _id: new ObjectId(columnId),
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
const deleteOneById = async (columnId) => {
  try {
    const result = await GET_DB()
      .collection(COLUMN_COLLECTION_NAME)
      .deleteOne({
        _id: new ObjectId(columnId),
      });

    // console.log('deleteOneByIdResult:', result)

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

// =============================================================================================================================
// đẩy (push) giá trị cardId vào mảng cardOrderIds
const pushCardOrderIds = async (card) => {
  try {
    // đọc findOneAndUpdate
    const result = await GET_DB()
      .collection(COLUMN_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          // 67 - có cần destroy khong?
          _id: new ObjectId(card.columnId),
        },
        {
          $push: {
            cardOrderIds: new ObjectId(card._id),
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

// =============================================================================================================================
// lấy giá trị cardId ra khỏi mảng cardOrderIds và xóa đi
const pullCardOrderIds = async (card) => {
  try {
    // đọc findOneAndUpdate
    const result = await GET_DB()
      .collection(COLUMN_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          _id: new ObjectId(card.columnId),
        },
        {
          $pull: {
            cardOrderIds: new ObjectId(card._id),
          },
        },
        {
          returnDocument: "after", // bắt buộc cần thì mới trả về DB đã được cập nhật
        }
      );

    // console.log('pullCardOrderIds:', result)

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

// =============================================================================================================================
// =============================================================================================================================
export const columnModel = {
  COLUMN_COLLECTION_NAME,
  COLUMN_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  findOneByBoardId,
  update,
  deleteOneById,
  pushCardOrderIds,
  pullCardOrderIds,
};
