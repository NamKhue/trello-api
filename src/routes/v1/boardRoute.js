import express from "express";

import { authenticateJWT } from "~/middlewares/authenticateJWT";
import {
  authorizeRoleBoard,
  authorizeRoleBoardForBoardUser,
} from "~/middlewares/authorizeRole";

import { ROLE_TYPES } from "~/utils/constants";

import { boardValidation } from "~/validations/boardValidation";
import { boardController } from "~/controllers/boardController";

const Router = express.Router();

Router.get("/", authenticateJWT, boardController.getAllBoards);
Router.get("/myBoards", authenticateJWT, boardController.getCreatorBoards);

Router.post(
  "/",
  authenticateJWT,
  boardValidation.createNew,
  boardController.createNew
);

// Router.get("/old/:id", authenticateJWT, boardController.getDetails); // old
Router.get(
  "/:id",
  authenticateJWT,
  authorizeRoleBoardForBoardUser([
    ROLE_TYPES.CREATOR,
    ROLE_TYPES.OWNER,
    ROLE_TYPES.MEMBER,
  ]),
  boardController.getBoardById
); // new

Router.put(
  "/:id",
  authenticateJWT,
  authorizeRoleBoard([ROLE_TYPES.CREATOR, ROLE_TYPES.OWNER]),
  boardValidation.update,
  boardController.update
);
// Router.delete("/:id", authenticateJWT, boardController.deleteBoard);
Router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoleBoard([ROLE_TYPES.CREATOR, ROLE_TYPES.OWNER]),
  boardController.deleteBoard
);

// API hỗ trợ việc di chuyển card giữa 2 columns
// Router.route("/supports/moving_card").put(
//   boardValidation.moveCardToDifferentColumn,
//   boardController.moveCardToDifferentColumn
// );

Router.put(
  "/supports/moving_card",
  authenticateJWT,
  boardValidation.moveCardToDifferentColumn,
  boardController.moveCardToDifferentColumn
);

// boardRoute == boardAPI (tuy là một nhưng vì dùng express nên đổi tên thành routes thay vì là apis)
export const boardRoute = Router;
