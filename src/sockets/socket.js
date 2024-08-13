import { Server } from "socket.io";

const setupSocketIO = (server, corsOptions) => {
  const io = new Server(server, {
    cors: corsOptions,
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    console.log("");

    // access board
    socket.on("access-board", (username, boardId) => {
      socket.join(boardId);
      console.log(`User ${username} has joined board ${boardId}`);
      console.log("");
    });

    // Handle updates and emit to board
    socket.on("update-board", (boardId, newBoard) => {
      io.to(boardId).emit("update-board", newBoard);
      // console.log("newBoard ", newBoard);
      // console.log("");
    });

    // // Handle updates and emit to board
    // socket.on("update-column", (columnId, newColumn) => {
    //   io.to(columnId).emit("update-column", newColumn);
    //   console.log("newColumn ", newColumn);
    //   console.log("");
    // });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      console.log("");
    });
  });

  return io;
};

export default setupSocketIO;
