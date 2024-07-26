import { StatusCodes } from "http-status-codes";
import { cloneDeep } from "lodash";

import { slugify } from "~/utils/formatters";
import { boardModel } from "~/models/boardModel";
import ApiError from "~/utils/ApiError";
import { columnModel } from "~/models/columnModel";
import { cardModel } from "~/models/cardModel";

const createNew = async (reqBody) => {
  try {
    // xử lý logic data tùy đặc thù dự án
    const newBoard = {
      ...reqBody,
      slug: slugify(reqBody.title),
    };

    // gọi tới tầng model để xử lý lưu bản ghi newBoard vào DB
    const createdBoard = await boardModel.createNew(newBoard);

    // lấy bản ghi board sau khi gọi
    const getNewBoard = await boardModel.findOneById(
      createdBoard.insertedId.toString()
    );

    // làm thêm các logic khác với các collection khác tùy từng dự án

    // gửi email, notification cho các admin khi có 1 cái board mới được tạo

    // trả kết quả, trong service này khong thể thiếu return
    return getNewBoard;
  } catch (error) {
    throw error;
  }
};

const getDetails = async (boardId) => {
  try {
    const board = await boardModel.getDetails(boardId);

    if (!board) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Board not found");
    }

    const resBoard = cloneDeep(board);

    // đưa card về đúng vị trí - con của column (xem trực quan trong DB)
    // ban đầu board chứa cả cards và columns
    // sau đó cần đưa cards vào columns cho đúng vị trí
    // đồng thời xóa đi board.cards
    resBoard.columns.forEach((column) => {
      // sol 1 - bớt nghiêm ngặt
      // column.cards = resBoard.cards.filter(
      //   (card) => card.columnId.toString() === column._id.toString()
      // );

      // console.log("column._id ", column._id);

      // resBoard.cards.map((card) => {
      //   console.log("card.columnId ", card.columnId);
      // });

      // sol 2 - nghiêm ngặt hơn
      // equals là func do mongo hỗ trợ
      column.cards = resBoard.cards.filter((card) =>
        card.columnId.equals(column._id)
      );
    });

    delete resBoard.cards;

    return resBoard;
  } catch (error) {
    throw error;
  }
};

const update = async (boardId, reqBody) => {
  try {
    const updateData = {
      ...reqBody,
      updatedAt: Date.now(),
    };

    const updatedBoard = await boardModel.update(boardId, updateData);

    return updatedBoard;
  } catch (error) {
    throw error;
  }
};

// di chuyển card từ col A sang col B
const moveCardToDifferentColumn = async (reqBody) => {
  try {
    // 1: update cardOrderIds và cards của A (xóa _id của card đang kéo)
    await columnModel.update(reqBody.prevColumnId, {
      cardOrderIds: reqBody.prevCardOrderIds,
      updatedAt: Date.now(),
    });

    // 2: update cardOrderIds và cards của B (thêm _id của card đang kéo)
    await columnModel.update(reqBody.nextColumnId, {
      cardOrderIds: reqBody.nextCardOrderIds,
      updatedAt: Date.now(),
    });

    // 3: update columnId của card vừa kéo
    await cardModel.update(reqBody.currentCardId, {
      columnId: reqBody.nextColumnId,
      updatedAt: Date.now(),
    });

    return { movingCardResult: "Moved cards successfully" };
  } catch (error) {
    throw error;
  }
};

export const boardService = {
  createNew,
  getDetails,
  update,
  moveCardToDifferentColumn,
};
