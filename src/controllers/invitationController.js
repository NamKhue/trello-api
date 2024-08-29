import { StatusCodes } from "http-status-codes";
import { boardUserModel } from "~/models/boardUserModel";
import { invitationModel } from "~/models/invitationModel";
import { userModel } from "~/models/userModel";
import { boardUserService } from "~/services/boardUserService";

import { invitationService } from "~/services/invitationService";
import { INVITATION_STATUS, ROLE_TYPES } from "~/utils/constants";

// ================================================================================================================
const findInvitation = async (req, res, next) => {
  try {
    //
    const targetInvitation = await invitationModel.findInvitationViaId(
      req.params.id
    );

    // check the user is already member of board or not
    const userAlreadyMember = await boardUserModel.findByUserIdAndBoardId(
      targetInvitation.boardId,
      targetInvitation.recipientId
    );

    if (userAlreadyMember) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send({ message: "You are already a member of this board!" });
    }

    return res.status(StatusCodes.OK).json(targetInvitation);
  } catch (error) {
    next(error);
  }
};

// ================================================================================================================
const findPublicInvitation = async (req, res, next) => {
  try {
    const targetInvitation =
      await invitationModel.findPublicInvitationViaBoardId(req.params.id);

    return res.status(StatusCodes.OK).json(targetInvitation);
  } catch (error) {
    next(error);
  }
};

// ================================================================================================================
const generateInvitationLinkForPublic = async (req, res, next) => {
  const inviterId = req.user.userId;

  let boardId = req.params.id;
  boardId = boardId.toString();

  try {
    const resInvitationLink =
      await invitationService.generateInvitationLinkForPublic(
        boardId,
        inviterId
      );

    res.status(StatusCodes.OK).send(resInvitationLink);
  } catch (error) {
    next(error);
  }
};

// ================================================================================================================
const deleteInvitationLinkForPublic = async (req, res, next) => {
  let token = req.params.id;
  token = token.toString();

  try {
    const resDeleteInvitationLink =
      await invitationService.deleteInvitationLinkForPublic(token);

    res.status(StatusCodes.OK).send(resDeleteInvitationLink);
  } catch (error) {
    next(error);
  }
};

// ================================================================================================================
const inviteUserIntoBoard = async (req, res, next) => {
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
        .send({ message: "This person is already a member of board" });
    }

    const resInviteUserIntoBoard = await invitationService.inviteUserToBoard(
      inviterId,
      targetInvitee._id.toString(),
      recipientEmail,
      boardId
    );

    res.status(StatusCodes.OK).send(resInviteUserIntoBoard);
  } catch (error) {
    next(error);
  }
};

// ================================================================================================================
const acceptInvitation = async (req, res, next) => {
  const recipientId = req.user.userId;
  if (!recipientId) {
    return res.status(StatusCodes.BAD_REQUEST).send("You need to log in.");
  }

  const tokenInvitation = req.query.tokenInvitation;
  // console.log(
  //   "🚀 ~ file: invitationController.js:76 ~ acceptInvitation ~ tokenInvitation:",
  //   tokenInvitation
  // );

  if (!tokenInvitation) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .send({ message: "This invitation is expired." });
  }

  try {
    const targetInvitation = await invitationModel.findInvitationViaToken(
      tokenInvitation
    );

    if (!targetInvitation.isPublic) {
      if (targetInvitation.recipientId.toString() !== recipientId) {
        return res.status(StatusCodes.BAD_REQUEST).send({
          message: `Sorry. This invitation is not for you`,
        });
      }
    }

    const targetBoardUser = await boardUserModel.findByUserIdAndBoardId(
      targetInvitation.boardId,
      recipientId
    );

    if (targetBoardUser) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send({ message: "You are already a member of this board." });
    }

    if (!targetInvitation) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send({ message: "This invitation is invalid or expired." });
    }

    if (!targetInvitation.isPublic) {
      if (targetInvitation.status !== INVITATION_STATUS.PENDING) {
        return res.status(StatusCodes.BAD_REQUEST).send({
          message: `The status of this invitation is already ${targetInvitation.status}`,
        });
      }
    }

    // Add user to board_users collection
    await boardUserService.createBoardUser(
      targetInvitation.boardId,
      recipientId,
      ROLE_TYPES.MEMBER
    );

    // handle accept
    let notiAcceptInvitation;
    if (!targetInvitation.isPublic) {
      notiAcceptInvitation = await invitationService.acceptInvitation(
        targetInvitation
      );
    } else {
      notiAcceptInvitation = await invitationService.acceptInvitationViaLink(
        targetInvitation,
        recipientId
      );
    }

    res.status(StatusCodes.OK).send(notiAcceptInvitation);
  } catch (error) {
    next(error);
  }
};

// ================================================================================================================
const declineInvitation = async (req, res, next) => {
  if (!req.user.userId) {
    return res.status(StatusCodes.BAD_REQUEST).send("You need to log in.");
  }

  const tokenInvitation = req.query.tokenInvitation;
  // const { token } = req.query;

  if (!tokenInvitation) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .send({ message: "This invitation is expired." });
  }

  try {
    const targetInvitation = await invitationModel.findInvitationViaToken(
      tokenInvitation
    );

    if (!targetInvitation) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send({ message: "This invitation is invalid or expired." });
    }

    if (targetInvitation.status !== INVITATION_STATUS.PENDING) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: `The status of this invitation is already ${targetInvitation.status}`,
      });
    }

    // handle decline
    const notiDeclineInvitation = await invitationService.declineInvitation(
      targetInvitation
    );

    res.status(StatusCodes.OK).send(notiDeclineInvitation);
  } catch (error) {
    next(error);
  }
};

// ================================================================================================================
export const invitationController = {
  findInvitation,
  findPublicInvitation,
  generateInvitationLinkForPublic,
  deleteInvitationLinkForPublic,
  inviteUserIntoBoard,
  acceptInvitation,
  declineInvitation,
};
