import "dotenv/config";

export const env = {
  MONGODB_URI: process.env.MONGODB_URI,
  DATABASE_NAME: process.env.DATABASE_NAME,

  APP_HOST: process.env.APP_HOST,
  APP_PORT: process.env.APP_PORT,

  APP_URL: process.env.APP_URL,

  PUBLISH_APP_HOST: process.env.PUBLISH_APP_HOST,

  FRONTEND_HOST: process.env.FRONTEND_HOST,
  FRONTEND_PORT: process.env.FRONTEND_PORT,

  PORT_MAILTRAP: process.env.PORT_MAILTRAP,
  USER_MAILTRAP: process.env.USER_MAILTRAP,
  PWD_MAILTRAP: process.env.PWD_MAILTRAP,

  JWT_SECRET: process.env.JWT_SECRET,

  BUILD_MODE: process.env.BUILD_MODE,

  AUTHOR: process.env.AUTHOR,
};
