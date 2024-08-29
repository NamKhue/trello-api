import crypto from "crypto";
import nodemailer from "nodemailer";

import { env } from "~/config/environment";
import { INVITATION_STATUS, NOTIFICATION_CONSTANTS } from "~/utils/constants";

import { invitationModel } from "~/models/invitationModel";
import { boardModel } from "~/models/boardModel";
import { notificationService } from "./notificationService";
import { userModel } from "~/models/userModel";
import { notificationModel } from "~/models/notificationModel";

// =====================================================================================================
const findInvitation = async (invitationData) => {
  try {
    const resInvitation =
      await invitationModel.findInvitationViaInviterAndRecipientAndBoard(
        invitationData.inviterId,
        invitationData.recipientId,
        invitationData.boardId
      );

    return resInvitation;
  } catch (error) {
    throw error;
  }
};

// =====================================================================================================
const findPublicInvitationViaBoardId = async (boardId) => {
  try {
    const resInvitation = await invitationModel.findPublicInvitationViaBoardId(
      boardId
    );

    return resInvitation;
  } catch (error) {
    throw error;
  }
};

// ================================================================================================================
const generateInvitationLinkForPublic = async (boardId, inviterId) => {
  try {
    // create new invitation
    const newInvitation = await storePendingInvitation(
      inviterId,
      null,
      boardId,
      true
    );
    const invitationLink = newInvitation.invitationLink;

    return invitationLink;
  } catch (error) {
    throw error;
  }
};

// ================================================================================================================
const deleteInvitationLinkForPublic = async (token) => {
  try {
    await invitationModel.deleteInvitationLinkForPublic(token);

    return { message: "Successfully remove link" };
  } catch (error) {
    throw error;
  }
};

// ================================================================================================================
const inviteUserToBoard = async (
  inviterId,
  recipientId,
  recipientEmail,
  boardId
) => {
  try {
    // create new invitation
    const newInvitation = await storePendingInvitation(
      inviterId,
      recipientId,
      boardId,
      false
    );

    const targetInviter = await userModel.findOneById(inviterId);

    // await sendInvitationEmail(
    //   targetInviter.email,
    //   recipientEmail,
    //   boardId,
    //   newInvitation.token
    // );

    // send the notification to that user
    const notiInviteUserIntoBoard =
      await notificationService.createNotification({
        actorId: inviterId,
        impactResistantId: recipientId,
        objectId: boardId,
        type: NOTIFICATION_CONSTANTS.TYPE.INVITE,
        response: NOTIFICATION_CONSTANTS.RESPONSE.PENDING,
        invitationId: newInvitation._id.toString(),
      });

    return {
      inviteUserResult: "Successfully sent the invitation",
      notiInviteUserIntoBoard,
    };
  } catch (error) {
    throw error;
  }
};

// ================================================================================================================
const sendInvitationEmail = async (
  inviterEmail,
  recipientEmail,
  boardId,
  token
) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: env.PORT_MAILTRAP,
      auth: {
        user: env.USER_MAILTRAP,
        pass: env.PWD_MAILTRAP,
      },
    });

    const targetBoard = await boardModel.getBoardById(boardId);
    const invitationLink = `http://${env.FRONTEND_HOST}:${env.FRONTEND_PORT}/accept-invitation?token=${token}`;
    const messageEmail = `You have been invited to join my board - ${targetBoard.title.toUpperCase()}. Please join and follow this link:\n ${invitationLink}`;
    const subjectTitle = "Board Invitation";

    const emailData = {
      from: inviterEmail,
      to: recipientEmail,
      subject: subjectTitle,
      text: messageEmail,
    };

    await transporter.sendMail(emailData);
  } catch (error) {
    throw error;
  }
};

// ================================================================================================================
const generateToken = () => {
  return crypto.randomBytes(16).toString("hex");
};

// ================================================================================================================
const storePendingInvitation = async (
  inviterId,
  recipientId,
  boardId,
  isPublic
) => {
  try {
    const token = generateToken();

    const invitationLink = `http://${env.FRONTEND_HOST}:${env.FRONTEND_PORT}/accept-invitation?token=${token}`;

    const createdInvitation = await invitationModel.createInvitation(
      inviterId,
      recipientId,
      boardId,
      token,
      isPublic,
      invitationLink
    );

    // lấy bản ghi board sau khi gọi
    const newInvitation = await invitationModel.findInvitationViaId(
      createdInvitation.insertedId.toString()
    );

    return newInvitation;
  } catch (error) {
    throw error;
  }
};

// ================================================================================================================
const acceptInvitation = async (invitation) => {
  try {
    // create new noti to send to the inviter
    const notiAcceptInvitation = await notificationService.createNotification({
      actorId: invitation.recipientId,
      impactResistantId: invitation.inviterId,
      objectId: invitation.boardId,
      type: NOTIFICATION_CONSTANTS.TYPE.RESPONSE_INVITATION,
      response: NOTIFICATION_CONSTANTS.RESPONSE.ACCEPTED,
    });

    // update the old noti
    await notificationModel.updateResponseInvitation(
      {
        actorId: invitation.inviterId,
        impactResistantId: invitation.recipientId,
        objectId: invitation.boardId,
        type: NOTIFICATION_CONSTANTS.TYPE.INVITE,
        response: NOTIFICATION_CONSTANTS.RESPONSE.PENDING,
      },
      NOTIFICATION_CONSTANTS.RESPONSE.ACCEPTED
    );

    // Update invitation status
    await invitationModel.updateStatusInvitation(
      invitation.token,
      INVITATION_STATUS.ACCEPTED
    );

    return { notiAcceptInvitation };
  } catch (error) {
    throw error;
  }
};

// ================================================================================================================
const acceptInvitationViaLink = async (invitation, recipientId) => {
  try {
    // create new noti to send to the inviter
    const notiAcceptInvitationViaLink =
      await notificationService.createNotification({
        actorId: recipientId,
        impactResistantId: invitation.inviterId,
        objectId: invitation.boardId,
        type: NOTIFICATION_CONSTANTS.TYPE.RESPONSE_INVITATION,
        via: NOTIFICATION_CONSTANTS.VIA.LINK,
      });

    return { notiAcceptInvitationViaLink };
  } catch (error) {
    throw error;
  }
};

// ================================================================================================================
const declineInvitation = async (invitation) => {
  try {
    // create new noti to send to the inviter
    const notiDeclineInvitation = await notificationService.createNotification({
      actorId: invitation.recipientId,
      impactResistantId: invitation.inviterId,
      objectId: invitation.boardId,
      type: NOTIFICATION_CONSTANTS.TYPE.RESPONSE_INVITATION,
      response: NOTIFICATION_CONSTANTS.RESPONSE.REJECTED,
    });

    // update the old noti
    await notificationModel.updateResponseInvitation(
      {
        actorId: invitation.inviterId,
        impactResistantId: invitation.recipientId,
        objectId: invitation.boardId,
        type: NOTIFICATION_CONSTANTS.TYPE.INVITE,
        response: NOTIFICATION_CONSTANTS.RESPONSE.PENDING,
      },
      NOTIFICATION_CONSTANTS.RESPONSE.REJECTED
    );

    // Update invitation status
    await invitationModel.updateStatusInvitation(
      invitation.token,
      INVITATION_STATUS.REJECTED
    );

    return { notiDeclineInvitation };
  } catch (error) {
    throw error;
  }
};

// =====================================================================================================
export const invitationService = {
  findInvitation,
  findPublicInvitationViaBoardId,
  generateInvitationLinkForPublic,
  deleteInvitationLinkForPublic,
  inviteUserToBoard,
  sendInvitationEmail,
  storePendingInvitation,
  acceptInvitation,
  acceptInvitationViaLink,
  declineInvitation,
};
