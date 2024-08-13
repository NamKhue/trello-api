// middleware/authorizeRole.js
const { ObjectId } = require("mongodb");

import { StatusCodes } from "http-status-codes";
import { GET_DB } from "~/config/mongodb";

import { boardUserModel } from "~/models/boardUserModel";
import { cardModel } from "~/models/cardModel";
import { columnModel } from "~/models/columnModel";
// import { cardUserModel } from "~/models/cardUserModel";

export const authorizeRoleBoard = (roles) => {
  return async (req, res, next) => {
    const { userId } = req.user;
    const { id } = req.params;

    try {
      const boardUser = await GET_DB()
        .collection(boardUserModel.BOARD_USER_COLLECTION_NAME)
        .findOne({
          boardId: new ObjectId(id),
          userId: new ObjectId(userId),
        });

      if (!boardUser || !roles.includes(boardUser.role)) {
        return res
          .status(StatusCodes.FORBIDDEN)
          .json({ message: "Stop! You don't have enough permission." });
      }

      next();
    } catch (error) {
      console.error("Error authorizing roles:", error);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server error" });
    }
  };
};

export const authorizeRoleBoardForBoardUser = (roles) => {
  return async (req, res, next) => {
    const { userId } = req.user;
    const boardId = req.query.boardId || req.body.boardId || req.params.id;

    try {
      const boardUser = await GET_DB()
        .collection(boardUserModel.BOARD_USER_COLLECTION_NAME)
        .findOne({
          boardId: new ObjectId(boardId),
          userId: new ObjectId(userId),
        });

      if (!boardUser || !roles.includes(boardUser.role)) {
        return res
          .status(StatusCodes.FORBIDDEN)
          .json({ message: "Stop! You don't have enough permission." });
      }

      next();
    } catch (error) {
      console.error("Error authorizing roles:", error);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server error" });
    }
  };
};

export const authorizeRoleColumn = (roles) => {
  return async (req, res, next) => {
    const { userId } = req.user;
    const columnId = req.params.id;

    try {
      const targetColumn = await GET_DB()
        .collection(columnModel.COLUMN_COLLECTION_NAME)
        .findOne({ _id: new ObjectId(columnId) });

      const boardUser = await GET_DB()
        .collection(boardUserModel.BOARD_USER_COLLECTION_NAME)
        .findOne({
          boardId: new ObjectId(targetColumn.boardId),
          userId: new ObjectId(userId),
        });

      if (!boardUser || !roles.includes(boardUser.role)) {
        return res
          .status(StatusCodes.FORBIDDEN)
          .json({ message: "Stop! You don't have enough permission." });
      }

      next();
    } catch (error) {
      console.error("Error authorizing roles:", error);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server error" });
    }
  };
};

export const authorizeRoleCard = () => {
  return async (req, res, next) => {
    const { userId } = req.user;
    const cardId = req.params.id;
    const boardId = req.body.boardId;

    try {
      const targetCard = await GET_DB()
        .collection(cardModel.CARD_COLLECTION_NAME)
        .findOne({
          _id: new ObjectId(cardId),
          boardId: new ObjectId(boardId),
        });

      let isMember = false;
      targetCard.members.map((member) => {
        if (member.userId == userId) {
          isMember = true;
        }
      });

      if (!isMember) {
        return res
          .status(StatusCodes.FORBIDDEN)
          .json({ message: "Stop! You don't have enough permission." });
      }
      next();
    } catch (error) {
      console.error("Error authorizing roles:", error);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server error" });
    }
  };
};
