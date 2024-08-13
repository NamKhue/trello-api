import { StatusCodes } from "http-status-codes";

import { boardService } from "~/services/boardService";
import { boardUserService } from "~/services/boardUserService";

// ================================================================================================================
const getAllBoards = async (req, res, next) => {
  const { userId } = req.user; // the same as userId = req.user.userId

  try {
    // điều hướng dữ liệu sang tầng service
    const allBoards = await boardService.getAllBoards(userId);

    // có kết quả thì trả về phía client
    res.status(StatusCodes.OK).json(allBoards);
  } catch (error) {
    next(error);
  }
};

// ================================================================================================================
const getCreatorBoards = async (req, res, next) => {
  const userId = req.user.userId;

  try {
    const boards = await boardService.getCreatorBoards(userId);

    res.status(StatusCodes.OK).json(boards);
  } catch (error) {
    next(error);
  }
};

// ================================================================================================================
const createNew = async (req, res, next) => {
  const { userId } = req.user;
  const { title } = req.body;

  try {
    // điều hướng dữ liệu sang tầng Service
    const createdNewBoard = await boardService.createNew(userId, {
      title,
    });

    await boardUserService.createBoardUser(
      createdNewBoard._id,
      userId,
      "creator"
    );

    // có kết quả thì trả về phía client
    res.status(StatusCodes.CREATED).json(createdNewBoard);
  } catch (error) {
    next(error);
  }
};

// ================================================================================================================
const getDetails = async (req, res, next) => {
  try {
    // console.log('req.params:', req.params)

    const boardId = req.params.id;

    const board = await boardService.getDetails(boardId);

    res.status(StatusCodes.OK).json(board);
  } catch (error) {
    next(error);
  }
};

const getBoardById = async (req, res, next) => {
  const { userId } = req.user;
  const { id } = req.params;

  try {
    const board = await boardService.getBoardById(userId, id);

    if (!board) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Board not found or not authorized" });
    }

    res.status(StatusCodes.OK).json(board);
  } catch (error) {
    next(error);
  }
};

// ================================================================================================================
const update = async (req, res, next) => {
  const boardId = req.params.id;

  try {
    const updatedBoard = await boardService.update(boardId, req.body);

    res.status(StatusCodes.OK).json(updatedBoard);
  } catch (error) {
    next(error);
  }
};

const updateBoard = async (req, res, next) => {
  const { userId } = req.user;
  const { id } = req.params;

  try {
    const updateData = {
      ...req.body,
      updatedAt: Date.now(),
    };

    const updatedBoard = await boardService.updateBoard(userId, id, updateData);

    if (!updatedBoard) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Board not found or not authorized" });
    }

    // return { modifyBoardResult: "Board has been modified successfully!" };
    res.status(StatusCodes.OK).json(updatedBoard);
  } catch (error) {
    next(error);
  }
};

// ================================================================================================================
const deleteBoard = async (req, res, next) => {
  const { userId } = req.user;
  const { id } = req.params;

  try {
    const deletedBoard = await boardService.deleteBoard(userId, id);

    if (!deletedBoard) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Board not found or not authorized" });
    }

    res.status(StatusCodes.OK).json(deletedBoard);
  } catch (error) {
    next(error);
  }
};

// ================================================================================================================
const moveCardToDifferentColumn = async (req, res, next) => {
  try {
    const result = await boardService.moveCardToDifferentColumn(req.body);

    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const boardController = {
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
