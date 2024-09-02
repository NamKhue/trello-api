import { commentService } from "~/services/commentService";

// =====================================================================================================
const getComments = async (req, res, next) => {
  const cardId = req.params.id;

  try {
    const allComments = await commentService.getComments(cardId);

    res.status(201).json(allComments);
  } catch (error) {
    next(error);
  }
};

// =====================================================================================================
const createComment = async (req, res, next) => {
  const cardId = req.params.id;
  const commentData = req.body;

  try {
    const newComment = await commentService.createComment(cardId, commentData);

    res.status(200).json(newComment);
  } catch (error) {
    next(error);
  }
};

// =====================================================================================================
const createReply = async (req, res, next) => {
  const cardId = req.params.id;
  const replyData = req.body;

  try {
    const newReply = await commentService.createReply(cardId, replyData);

    res.status(200).json(newReply);
  } catch (error) {
    next(error);
  }
};

// =====================================================================================================
export const commentController = {
  getComments,
  createComment,
  createReply,
};
