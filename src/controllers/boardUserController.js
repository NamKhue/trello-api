import { StatusCodes } from "http-status-codes";

import { INVITATION_STATUS, ROLE_TYPES } from "~/utils/constants";

import { boardUserService } from "~/services/boardUserService";
import { userService } from "~/services/userService";
import { userModel } from "~/models/userModel";
import { invitationModel } from "~/models/invitationModel";
import { boardUserModel } from "~/models/boardUserModel";

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
const inviteUser = async (req, res, next) => {
  const inviterId = req.user.userId;
  const { boardId, email: recipientEmail } = req.body;

  try {
    // check this invitee is already a member of user or not
    const targetInvitee = await userModel.findOneByEmail(recipientEmail);

    const userAlreadyMember = await boardUserModel.findByUserIdAndBoardId(
      boardId,
      targetInvitee._id
    );

    if (userAlreadyMember) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send("This person is already a member of board");
    }

    const token = await userService.storePendingInvitation(
      inviterId,
      recipientEmail,
      boardId
    );

    const targetInviter = await userModel.findOneById(inviterId);

    await userService.sendInvitationEmail(
      targetInviter._id,
      targetInviter.email,
      recipientEmail,
      boardId,
      token
    );

    res
      .status(StatusCodes.OK)
      .send({ inviteUserResult: "Invitation is sent successfully" });
  } catch (error) {
    next(error);
  }
};

const acceptInvitation = async (req, res, next) => {
  if (!req.user.userId) {
    return res.status(StatusCodes.BAD_REQUEST).send("You need to log in.");
  }

  const { token } = req.query;

  if (!token) {
    return res.status(StatusCodes.BAD_REQUEST).send("Expired token");
  }

  try {
    const invitation = await invitationModel.findInvitationViaToken(token);

    if (!invitation) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send("Invalid or expired token");
    }

    if (invitation.status !== INVITATION_STATUS.PENDING) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send(`Invitation is already ${invitation.status}`);
    }

    // Add user to board_users collection
    await boardUserService.createBoardUser(
      invitation.boardId,
      req.user.userId,
      ROLE_TYPES.MEMBER
    );

    // Update invitation status
    await invitationModel.updateStatusInvitationToAccepted(token);

    res
      .status(StatusCodes.OK)
      .send({ acceptingResult: "The invitation is accepted" });
  } catch (error) {
    next(error);
  }
};

const declineInvitation = async (req, res, next) => {
  if (!req.user.userId) {
    return res.status(StatusCodes.BAD_REQUEST).send("You need to log in.");
  }

  const { token } = req.query;

  if (!token) {
    return res.status(StatusCodes.BAD_REQUEST).send("Expired token");
  }

  try {
    const invitation = await invitationModel.findInvitationViaToken(token);

    if (!invitation) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send("Invalid or expired token");
    }

    if (invitation.status !== INVITATION_STATUS.PENDING) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send(`Invitation is already ${invitation.status}`);
    }

    // Update invitation status
    await invitationModel.updateStatusInvitationToRejected(token);

    res
      .status(StatusCodes.OK)
      .send({ rejectingResult: "The invitation is rejected" });
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

const removeUser = async (req, res, next) => {
  const removerId = req.user.userId;
  const removeData = req.body;

  try {
    const result = await boardUserService.removeUserFromBoard(
      removerId,
      removeData
    );

    res.status(StatusCodes.OK).json(result);
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
    const upgradedRoleUser = await boardUserService.changeUserRole(
      invokerId,
      roleChangeData
    );

    res.status(StatusCodes.CREATED).json(upgradedRoleUser);
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
  inviteUser,
  acceptInvitation,
  declineInvitation,
  addUser,
  removeUser,
  changeRole,
};
