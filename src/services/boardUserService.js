import { boardUserModel } from "~/models/boardUserModel";
import { invitationModel } from "~/models/invitationModel";
import { INVITATION_STATUS } from "~/utils/constants";

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
    // gọi tới tầng model để xử lý lưu bản ghi newBoardUser vào DB
    const allMembers = await boardUserModel.getUserFromBoardUsers(boardId);

    // const getNewBoardUser = await boardUserModel.findOneById(
    //   createdBoard.insertedId.toString()
    // );

    return allMembers;
  } catch (error) {
    throw new Error(error);
  }
};

// ================================================================================================================
const createBoardUser = async (boardId, userId, role) => {
  try {
    // xử lý logic data tùy đặc thù dự án
    const newBoardUser = {
      boardId: boardId,
      userId: userId,
      role: role,
    };

    // gọi tới tầng model để xử lý lưu bản ghi newBoardUser vào DB
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
const inviteUserToBoard = async (
  pendingInvitationId,
  inviterId,
  inviteData
) => {
  try {
    const createdInvitation = await boardUserModel.inviteUserToBoard(
      inviterId,
      inviteData
    );

    // Update the status of the invitation
    await invitationModel.updatePendingInvitationStatus(
      pendingInvitationId,
      INVITATION_STATUS.ACCEPTED
    );

    const getNewInvitation = await boardUserModel.findOneById(
      createdInvitation.insertedId.toString()
    );

    // gửi email, notification cho người dùng được mời khi tạo lời mời xong

    return getNewInvitation;
  } catch (error) {
    throw error;
  }
};

// ================================================================================================================
const removeUserFromBoard = async (removerId, removeData) => {
  try {
    await boardUserModel.removeUserFromBoard(removerId, removeData);

    return { removeUserResult: "Successfully remove member!" };
  } catch (error) {
    throw error;
  }
};

// ================================================================================================================
const changeUserRole = async (invokerId, roleChangeData) => {
  try {
    await boardUserModel.changeUserRole(invokerId, roleChangeData);

    return { upgradedRoleUserResult: "Successfully upgraded role of member!" };
  } catch (error) {
    throw error;
  }
};

export const boardUserService = {
  getBoardsByOwnerRole,
  getBoardsByMemberRole,
  getAllMembers,
  createBoardUser,
  getRoleOfBoard,
  inviteUserToBoard,
  removeUserFromBoard,
  changeUserRole,
};
