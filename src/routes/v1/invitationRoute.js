import express from "express";

import { authenticateJWT } from "~/middlewares/authenticateJWT";

import { invitationController } from "~/controllers/invitationController";
import { authorizeRoleBoardForBoardUser } from "~/middlewares/authorizeRole";
import { ROLE_TYPES } from "~/utils/constants";

const Router = express.Router();

Router.get("/:id", authenticateJWT, invitationController.findInvitation);
Router.get(
  "/public-invitation/:id",
  authenticateJWT,
  invitationController.findPublicInvitation
);

Router.get(
  "/generate-invitation-link/:id",
  authenticateJWT,
  authorizeRoleBoardForBoardUser([ROLE_TYPES.CREATOR, ROLE_TYPES.OWNER]),
  invitationController.generateInvitationLinkForPublic
);

Router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoleBoardForBoardUser([ROLE_TYPES.CREATOR, ROLE_TYPES.OWNER]),
  invitationController.deleteInvitationLinkForPublic
);

Router.post(
  "/invite",
  authenticateJWT,
  authorizeRoleBoardForBoardUser([ROLE_TYPES.CREATOR, ROLE_TYPES.OWNER]),
  invitationController.inviteUserIntoBoard
);

Router.post(
  "/accept-invitation",
  authenticateJWT,
  invitationController.acceptInvitation
);
Router.post(
  "/decline-invitation",
  authenticateJWT,
  invitationController.declineInvitation
);

export const invitationRoute = Router;
