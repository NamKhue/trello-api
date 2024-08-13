import express from "express";

import { authenticateJWT } from "~/middlewares/authenticateJWT";
import {
  authorizeRoleBoardForBoardUser,
  authorizeRoleCard,
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

Router.put(
  "/:id",
  authenticateJWT,
  // authorizeRoleCard,
  cardValidation.updateCard,
  cardController.updateCard
);

Router.delete(
  "/:id",
  authenticateJWT,
  // authorizeRoleCard([ROLE_TYPES.CREATOR, ROLE_TYPES.OWNER]),
  cardValidation.deleteItem,
  cardController.deleteItem
);

export const cardRoute = Router;
