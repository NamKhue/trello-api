const jwt = require("jsonwebtoken");
import { env } from "~/config/environment";

const JWT_SECRET = env.JWT_SECRET;

export const authenticateJWT = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;

    next();
  });
};
