import express from "express";
import { StatusCodes } from "http-status-codes";

import { userRoute } from "~/routes/v1/userRoute";
import { invitationRoute } from "~/routes/v1/invitationRoute";
// import { emailRoute } from "~/routes/v1/emailRoute";
import { notificationRoute } from "~/routes/v1/notificationRoute";
import { boardRoute } from "~/routes/v1/boardRoute";
import { boardUserRoute } from "~/routes/v1/boardUserRoute";
import { columnRoute } from "~/routes/v1/columnRoute";
import { cardRoute } from "~/routes/v1/cardRoute";

const Router = express.Router();

// check APIs v1/status
Router.get("/status", (req, res) => {
  res.status(StatusCodes.OK).json({ message: "APIs v1 are ready to use" });
});

// user APIs
Router.use("/user", userRoute);

// invitation APIs
Router.use("/invitations", invitationRoute);

// // email APIs
// Router.use("/emails", emailRoute);

// notification APIs
Router.use("/notifications", notificationRoute);

// board APIs
Router.use("/boards", boardRoute);

// boardUsers APIs
Router.use("/boardUsers", boardUserRoute);

// columns APIs
Router.use("/columns", columnRoute);

// cards APIs
Router.use("/cards", cardRoute);

export const APIs_V1 = Router;
