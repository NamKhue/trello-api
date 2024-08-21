import express from "express";

import { authenticateJWT } from "~/middlewares/authenticateJWT";
import {
  authorizeRoleBoardForBoardUser,
  authorizeRoleCardAndBoard,
} from "~/middlewares/authorizeRole";

import { ROLE_TYPES } from "~/utils/constants";

import { cardValidation } from "~/validations/cardValidation";
import { cardController } from "~/controllers/cardController";

const Router = express.Router();

Router.post(
  "/",
  authenticateJWT,
  authorizeRoleBoardForBoardUser([ROLE_TYPES.CREATOR, ROLE_TYPES.OWNER]),
  cardValidation.createNew,
  cardController.createNew
);

Router.post(
  "/addUserIntoCard/:id",
  authenticateJWT,
  authorizeRoleCardAndBoard,
  cardController.addUserIntoCard
);
Router.delete(
  "/removeUserFromCard/:id",
  authenticateJWT,
  authorizeRoleCardAndBoard,
  cardController.removeUserFromCard
);

Router.put(
  "/:id",
  authenticateJWT,
  authorizeRoleCardAndBoard,
  cardValidation.updateCard,
  cardController.updateCard
);

Router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoleCardAndBoard,
  cardValidation.deleteCardItem,
  cardController.deleteCardItem
);

export const cardRoute = Router;
