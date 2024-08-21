// import { cloneDeep } from 'lodash'
import { StatusCodes } from "http-status-codes";
import ApiError from "~/utils/ApiError";

// import { slugify } from '~/utils/formatters'
import { boardModel } from "~/models/boardModel";
import { cardModel } from "~/models/cardModel";
import { columnModel } from "~/models/columnModel";

const createNew = async (columnData) => {
  try {
    const createdColumn = await columnModel.createNew(columnData);

    const getNewColumn = await columnModel.findOneById(
      createdColumn.insertedId.toString()
    );

    if (getNewColumn) {
      // xử lý cấu trúc data trước khi trả data về
      getNewColumn.cards = [];

      // cập nhật mảng columnOrderIds trong collection boards
      await boardModel.pushColumnOrderIds(getNewColumn);
    }

    return getNewColumn;
  } catch (error) {
    throw error;
  }
};

const update = async (columnId, reqBody) => {
  try {
    const updateData = {
      ...reqBody,
      updatedAt: Date.now(),
    };

    // const updatedColumn =
    await columnModel.update(columnId, updateData);

    return { modifyColumnResult: "Column has been modified successfully!" };
  } catch (error) {
    throw error;
  }
};

const deleteColumnItem = async (columnId) => {
  try {
    const targetColumn = await columnModel.findOneById(columnId);
    // console.log('targetColumn:', targetColumn)

    if (!targetColumn) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Column is not found");
    }

    // tương lai xóa nhiều
    // xóa column
    await columnModel.deleteOneById(columnId);

    // tương lai xóa nhiều
    // xóa toàn bộ cards
    await cardModel.deleteManyByColumnId(columnId);

    // xóa columnId trong mảng columnOrderIds của board chứa nó
    await boardModel.pullColumnOrderIds(targetColumn);

    return {
      deleteColumnResult:
        "Column and all cards of this column have been removed successfully!",
    };
  } catch (error) {
    throw error;
  }
};

export const columnService = {
  createNew,
  update,
  deleteColumnItem,
};
