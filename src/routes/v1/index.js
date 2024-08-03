import express from "express";
import { StatusCodes } from "http-status-codes";

import { userRoute } from "~/routes/v1/userRoute";
import { boardRoute } from "~/routes/v1/boardRoute";
import { columnRoute } from "~/routes/v1/columnRoute";
import { cardRoute } from "~/routes/v1/cardRoute";

const Router = express.Router();

// check APIs v1/status
Router.get("/status", (req, res) => {
  res.status(StatusCodes.OK).json({ message: "APIs v1 are ready to use" });
});

// user APIs
Router.use("/user", userRoute);

// board APIs
Router.use("/boards", boardRoute);

// columns APIs
Router.use("/columns", columnRoute);

// cards APIs
Router.use("/cards", cardRoute);

export const APIs_V1 = Router;
