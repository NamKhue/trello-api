import { boardUserModel } from "~/models/boardUserModel";

import { NOTIFICATION_CONSTANTS } from "~/utils/constants";

import { notificationService } from "./notificationService";

// ================================================================================================================
const getBoardsByOwnerRole = async (userId) => {
  try {
    const ownerBoards = await boardUserModel.getBoardsByOwnerRole(userId);

    return ownerBoards;
  } catch (error) {
    throw new Error(error);
  }
};

const getBoardsByMemberRole = async (userId) => {
  try {
    const ownerBoards = await boardUserModel.getBoardsByMemberRole(userId);

    return ownerBoards;
  } catch (error) {
    throw new Error(error);
  }
};

// ================================================================================================================
const getAllMembers = async (boardId) => {
  try {
    const allMembers = await boardUserModel.getUserFromBoardUsers(boardId);

    return allMembers;
  } catch (error) {
    throw new Error(error);
  }
};

// ================================================================================================================
const createBoardUser = async (boardId, userId, role) => {
  try {
    const newBoardUser = {
      boardId: boardId,
      userId: userId,
      role: role,
    };

    const createdBoard = await boardUserModel.createBoardUser(newBoardUser);

    const getNewBoardUser = await boardUserModel.findOneById(
      createdBoard.insertedId.toString()
    );

    return getNewBoardUser;
  } catch (error) {
    throw new Error(error);
  }
};

// ================================================================================================================
const getRoleOfBoard = async (userId, boardId) => {
  try {
    const roleOfBoardResult = await boardUserModel.getRoleOfBoard(
      userId,
      boardId
    );

    return roleOfBoardResult;
  } catch (error) {
    throw new Error(error);
  }
};

// ================================================================================================================
const removeUserFromBoard = async (removerId, removeData) => {
  try {
    // remove user from board
    await boardUserModel.removeUserFromBoard(removerId, removeData);

    // send the notification to that user
    const newNoti = await notificationService.createNotification({
      actorId: removerId,
      impactResistantId: removeData.userId,
      objectId: removeData.boardId,
      type: NOTIFICATION_CONSTANTS.TYPE.REMOVE,
      from: NOTIFICATION_CONSTANTS.FROM.BOARD,
    });

    return { removeUserResult: "Successfully remove member!", newNoti };
  } catch (error) {
    throw error;
  }
};

// ================================================================================================================
const changeUserRole = async (invokerId, roleChangeData) => {
  try {
    await boardUserModel.changeUserRole(invokerId, roleChangeData);

    // send the notification to that user
    const notiChangedRoleOfMember =
      await notificationService.createNotification({
        actorId: invokerId,
        impactResistantId: roleChangeData.userId,
        objectId: roleChangeData.boardId,
        type: NOTIFICATION_CONSTANTS.TYPE.CHANGE_ROLE,
        role: roleChangeData.role,
      });

    return {
      changedRoleUserResult: "Successfully changed role of member.",
      notiChangedRoleOfMember,
    };
  } catch (error) {
    throw error;
  }
};

// ================================================================================================================
// ================================================================================================================
export const boardUserService = {
  getBoardsByOwnerRole,
  getBoardsByMemberRole,
  getAllMembers,
  createBoardUser,
  getRoleOfBoard,
  removeUserFromBoard,
  changeUserRole,
};
