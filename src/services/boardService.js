import { StatusCodes } from "http-status-codes";
import { cloneDeep } from "lodash";

import { slugify } from "~/utils/formatters";
import ApiError from "~/utils/ApiError";

import { NOTIFICATION_CONSTANTS } from "~/utils/constants";

import { notificationService } from "./notificationService";

import { boardUserModel } from "~/models/boardUserModel";
import { boardModel } from "~/models/boardModel";
import { columnModel } from "~/models/columnModel";
import { cardModel } from "~/models/cardModel";
import { notificationModel } from "~/models/notificationModel";
import { invitationModel } from "~/models/invitationModel";

// ================================================================================================================
const getAllBoards = async (userId) => {
  // lấy dữ liệu của toàn bộ các bảng
  try {
    const allBoards = await boardModel.getAllBoards(userId);
    return allBoards;
  } catch (error) {
    throw error;
  }
};

// ================================================================================================================
const getCreatorBoards = async (userId) => {
  // lấy dữ liệu của toàn bộ các bảng theo role 'creator' - ở giao diện sẽ là mục my board ở trang chủ
  try {
    const allBoards = await boardModel.getCreatorBoards(userId);
    return allBoards;
  } catch (error) {
    throw error;
  }
};

// ================================================================================================================
const createNew = async (userId, boardData) => {
  try {
    // xử lý logic data tùy đặc thù dự án
    const newBoard = {
      ...boardData,
      slug: slugify(boardData.title),
      userId: userId,
      createdAt: Date.now(),
    };

    // gọi tới tầng model để xử lý lưu bản ghi newBoard vào DB
    const createdBoard = await boardModel.createNew(userId, newBoard);

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

// ================================================================================================================
const getDetails = async (boardId) => {
  try {
    const board = await boardModel.getDetails(boardId);

    if (!board) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Board is not found");
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

const getBoardById = async (boardId) => {
  // lấy dữ liệu của toàn bộ các bảng
  try {
    const board = await boardModel.getBoardById(boardId);
    // return board;

    // api column and card then test after
    if (!board) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Board not found");
    }

    const resBoard = cloneDeep(board);

    resBoard.columns.forEach((column) => {
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

// ================================================================================================================
const update = async (boardId, reqBody) => {
  try {
    const updateData = {
      ...reqBody,
      updatedAt: Date.now(),
    };

    // const updatedBoard = await boardModel.update(boardId, updateData);
    // return updatedBoard;

    await boardModel.update(boardId, updateData);
    return { modifyBoardResult: "Board has been modified successfully!" };
  } catch (error) {
    throw error;
  }
};

const updateBoard = async (userId, boardId, reqBody) => {
  try {
    const updateData = {
      ...reqBody,
      updatedAt: Date.now(),
    };

    await boardModel.updateBoard(userId, boardId, updateData);
    return { modifyBoardResult: "Board has been modified successfully!" };
  } catch (error) {
    return new Error(error);
  }
};

// ================================================================================================================
const deleteBoard = async (actorId, boardId) => {
  try {
    // delete all invitations in board (include public or private)
    await invitationModel.deleteAllInvitationsViaBoardId(boardId);

    // find all cardIds via columnIds
    const cardsInBoard = await cardModel.findAllCardsByBoardId(boardId);

    // find all cards have deadline and member to delete all deadline notis
    for (const card of cardsInBoard) {
      if (card.deadlineAt != "" && card.members.length > 0) {
        await notificationService.deleteDeadlineNotifications(
          card._id,
          card.members
        );
      }
    }

    // send noti to the creator of board contains the board
    // find creator of board
    const targetBoardUser = await boardUserModel.findCreatorOfBoard(boardId);

    const responseDeleteBoardNotificationForCreator =
      await notificationService.deleteNotificationForCreator(
        actorId,
        targetBoardUser.userId,
        boardId,
        NOTIFICATION_CONSTANTS.FROM.BOARD
      );

    // send noti to all members of board
    // find all members of board
    const listOfAllMembers = await boardUserModel.getAllMembersFromBoard(
      boardId
    );
    const listOfAllMembersExceptCreatorOfBoard = listOfAllMembers.filter(
      (member) => member.userId.toString() != targetBoardUser.userId.toString()
    );

    await notificationService.deleteNotificationForMembers(
      actorId,
      boardId,
      listOfAllMembersExceptCreatorOfBoard,
      NOTIFICATION_CONSTANTS.FROM.BOARD
    );

    // fetch all deleteBoardNotificationForMembersInBoard
    let listResponseDeleteBoardNotificationForMembersInBoard = [];

    for (const member of listOfAllMembersExceptCreatorOfBoard) {
      const responseDeleteBoardNotificationForMembersInBoard =
        await notificationModel.findOneByActorAndImpactResistantAndObjectBasedOnTypeOfNotiAndTypeOfObject(
          actorId,
          member.userId,
          boardId,
          NOTIFICATION_CONSTANTS.TYPE.DELETE,
          NOTIFICATION_CONSTANTS.FROM.BOARD
        );

      listResponseDeleteBoardNotificationForMembersInBoard.push(
        responseDeleteBoardNotificationForMembersInBoard
      );
    }

    // delete board & columns & cards
    await boardModel.deleteBoard(actorId, boardId);

    return {
      deleteBoardResult: "Board has been removed successfully!",
      listResponseDeleteBoardNotificationForMembersInBoard,
      responseDeleteBoardNotificationForCreator,
    };
  } catch (error) {
    return new Error(error);
  }
};

// ================================================================================================================
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

    return { movingCardResult: "Moved card successfully" };
  } catch (error) {
    throw error;
  }
};

export const boardService = {
  getAllBoards,
  getCreatorBoards,
  createNew,
  getDetails,
  getBoardById,
  update,
  updateBoard,
  deleteBoard,
  moveCardToDifferentColumn,
};
