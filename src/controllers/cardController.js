import { StatusCodes } from "http-status-codes";

import { cardService } from "~/services/cardService";

// =============================================================================================================================
const createNew = async (req, res, next) => {
  try {
    const creatorId = req.user.userId;

    const createdNewCard = await cardService.createNew(creatorId, req.body);

    res.status(StatusCodes.CREATED).json(createdNewCard);
  } catch (error) {
    next(error);
  }
};

// =============================================================================================================================
const addUserIntoCard = async (req, res, next) => {
  try {
    const actorId = req.user.userId;
    const cardId = req.params.id;
    const assignee = {
      userId: req.body.userId,
      username: req.body.username,
      email: req.body.email,
    };

    const updatedCard = await cardService.addUserIntoCard(
      actorId,
      cardId,
      assignee
    );

    res.status(StatusCodes.OK).json(updatedCard);
  } catch (error) {
    next(error);
  }
};

// =============================================================================================================================
const removeUserFromCard = async (req, res, next) => {
  try {
    const actorId = req.user.userId;
    const cardId = req.params.id;
    const assignee = req.query.assignee;

    const updatedCard = await cardService.removeUserFromCard(
      actorId,
      cardId,
      assignee
    );

    res.status(StatusCodes.OK).json(updatedCard);
  } catch (error) {
    next(error);
  }
};

// =============================================================================================================================
const updateCard = async (req, res, next) => {
  try {
    // const { userId } = req.user;
    const cardId = req.params.id;

    const updatedCard = await cardService.updateCard(cardId, req.body);

    res.status(StatusCodes.OK).json(updatedCard);
  } catch (error) {
    next(error);
  }
};

// =============================================================================================================================
const deleteCardItem = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const cardId = req.params.id;

    const updatedCard = await cardService.deleteCardItem(userId, cardId);

    res.status(StatusCodes.OK).json(updatedCard);
  } catch (error) {
    next(error);
  }
};

// =============================================================================================================================
export const cardController = {
  createNew,
  addUserIntoCard,
  removeUserFromCard,
  updateCard,
  deleteCardItem,
};
