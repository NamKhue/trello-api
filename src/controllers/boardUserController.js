import { StatusCodes } from "http-status-codes";

import { ROLE_TYPES } from "~/utils/constants";

import { boardUserService } from "~/services/boardUserService";

// ================================================================================================================
const getOwnerBoards = async (req, res, next) => {
  const userId = req.user.userId;

  try {
    const ownerBoards = await boardUserService.getBoardsByOwnerRole(userId);

    res.status(StatusCodes.OK).json(ownerBoards);
  } catch (error) {
    next(error);
  }
};

const getMemberBoards = async (req, res, next) => {
  const userId = req.user.userId;

  try {
    const memberBoards = await boardUserService.getBoardsByMemberRole(userId);

    res.status(StatusCodes.OK).json(memberBoards);
  } catch (error) {
    next(error);
  }
};

// ================================================================================================================
const createBoardUser = async (req, res, next) => {
  try {
    const newBoardUser = await boardUserService.createBoardUser(req.body);

    res.status(StatusCodes.OK).json(newBoardUser);
  } catch (error) {
    next(error);
  }
};

// ================================================================================================================
const getAllMembers = async (req, res, next) => {
  try {
    const allMembers = await boardUserService.getAllMembers(req.query.boardId);

    res.status(StatusCodes.OK).json(allMembers);
  } catch (error) {
    next(error);
  }
};

// ================================================================================================================
const getRoleOfBoard = async (req, res, next) => {
  try {
    const roleOfBoardResult = await boardUserService.getRoleOfBoard(
      req.user.userId,
      req.query.boardId
    );

    res.status(StatusCodes.OK).json(roleOfBoardResult);
  } catch (error) {
    next(error);
  }
};

// ================================================================================================================
const addUser = async (req, res, next) => {
  const removeData = req.body;

  try {
    const result = await boardUserService.createBoardUser(
      removeData.boardId,
      removeData.userId,
      ROLE_TYPES.MEMBER
    );

    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

// ================================================================================================================
const removeUser = async (req, res, next) => {
  const removerId = req.user.userId;
  const removeData = req.body;

  try {
    const responseRemoverUser = await boardUserService.removeUserFromBoard(
      removerId,
      removeData
    );

    res.status(StatusCodes.OK).json(responseRemoverUser);
  } catch (error) {
    next(error);
  }
};

// ================================================================================================================
const changeRole = async (req, res, next) => {
  const invokerId = req.user.userId;

  const roleChangeData = {
    boardId: req.body.boardId,
    userId: req.body.userId,
    role: req.body.role,
  };

  try {
    const changedRoleUser = await boardUserService.changeUserRole(
      invokerId,
      roleChangeData
    );

    res.status(StatusCodes.CREATED).json(changedRoleUser);
  } catch (error) {
    next(error);
  }
};

export const boardUserController = {
  getOwnerBoards,
  getMemberBoards,
  createBoardUser,
  getAllMembers,
  getRoleOfBoard,
  addUser,
  removeUser,
  changeRole,
};
