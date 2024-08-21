// import Joi from "joi";
// // const { body, validationResult } = require("express-validator");

// import { NOTIFICATION_CONSTANTS } from "~/utils/constants";

// // =====================================================================================================
// const notificationSchema = Joi.object({
//   actorId: Joi.string().required(),
//   impactResistantId: Joi.string().required(),
//   objectId: Joi.string().required(),

//   type: Joi.string()
//     .valid(
//       NOTIFICATION_CONSTANTS.TYPE.REMOVE,
//       NOTIFICATION_CONSTANTS.TYPE.INVITE,
//       NOTIFICATION_CONSTANTS.TYPE.ADD,
//       NOTIFICATION_CONSTANTS.TYPE.DEADLINE
//     )
//     .required(),
//   from: Joi.string()
//     .valid(NOTIFICATION_CONSTANTS.FROM.BOARD, NOTIFICATION_CONSTANTS.FROM.CARD)
//     .allow(null),
//   response: Joi.string()
//     .valid(
//       NOTIFICATION_CONSTANTS.RESPONSE.PENDING,
//       NOTIFICATION_CONSTANTS.RESPONSE.ACCEPTED,
//       NOTIFICATION_CONSTANTS.RESPONSE.REJECTED
//     )
//     .allow(null),
// });

// // =====================================================================================================
// const validateNotification = (req, res, next) => {
//   const { error } = notificationSchema.validate(req.body);
//   if (error) {
//     return res.status(400).json({ error: error.details[0].message });
//   }

//   next();
// };

// // =====================================================================================================
// export const notificationValidation = {
//   validateNotification,
// };
