import { io } from "./socket";

export const setupSocketIO = (server) => {
  io.attach(server);
};

export { io };
