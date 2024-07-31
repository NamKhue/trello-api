import { StatusCodes } from "http-status-codes";

import { cardService } from "~/services/cardService";

const createNew = async (req, res, next) => {
  try {
    const createdNewCard = await cardService.createNew(req.body);

    res.status(StatusCodes.CREATED).json(createdNewCard);
  } catch (error) {
    next(error);
  }
};

const deleteItem = async (req, res, next) => {
  try {
    const cardId = req.params.id;
    const updatedCard = await cardService.deleteItem(cardId);

    res.status(StatusCodes.OK).json(updatedCard);
  } catch (error) {
    next(error);
  }
};

const updateCard = async (req, res, next) => {
  try {
    const cardId = req.params.id;
    const updatedCard = await cardService.updateCard(cardId, req.body);

    res.status(StatusCodes.OK).json(updatedCard);
  } catch (error) {
    next(error);
  }
};

export const cardController = {
  createNew,
  deleteItem,
  updateCard,
};
