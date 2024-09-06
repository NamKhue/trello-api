import { Server as SocketIOServer } from "socket.io";

import { corsOptions } from "~/config/cors";

const io = new SocketIOServer({
  cors: corsOptions,
});

const userSocketMap = {};

io.on("connection", (socket) => {
  // ============================================================================
  // ============================================================================
  // WARM UP
  // access the application - access homepage
  socket.on("join", (userId) => {
    userSocketMap[userId] = socket.id;
    console.log(
      "🚀 ~ file: socket.js:18 ~ socket.on ~ userSocketMap:",
      userSocketMap
    );
  });

  // disconnect the application
  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
    // Remove user from the map
    for (const [userId, socketId] of Object.entries(userSocketMap)) {
      if (socketId === socket.id) {
        delete userSocketMap[userId];
        break;
      }
    }
    console.log("");
  });

  // ============================================================================
  // ============================================================================
  // NOTIFICATION
  socket.on("notification", (notification) => {
    const userSocketId = userSocketMap[notification.impactResistantId];

    if (userSocketId) {
      io.to(userSocketId).emit("new-notification", notification);
    }
  });

  socket.on("remove-notification", (notification) => {
    const userSocketId = userSocketMap[notification.impactResistantId];

    if (userSocketId) {
      io.to(userSocketId).emit("remove-notification", notification);
    }
  });

  socket.on("remove-all-notifications", (userId) => {
    const userSocketId = userSocketMap[userId];

    if (userSocketId) {
      io.to(userSocketId).emit("remove-all-notifications");
    }
  });

  // the deleting card - notify to all members of it
  socket.on("list-notis-delete-card", async (listNotisDeleteCard) => {
    for (const noti of listNotisDeleteCard) {
      const userSocketId = userSocketMap[noti.impactResistantId];

      if (userSocketId) {
        io.to(userSocketId).emit("noti-delete-card", noti);
      }
    }
  });

  // ============================================================================
  // ============================================================================
  // COMMENT
  // new-comment
  socket.on("new-comment", (boardId, newComment, listNotiAboutNewComment) => {
    io.to(boardId).emit("new-comment", newComment);

    for (const noti of listNotiAboutNewComment) {
      const userSocketId = userSocketMap[noti.impactResistantId];

      if (userSocketId) {
        io.to(userSocketId).emit("noti-receive-new-comment", noti);
      }
    }
  });

  // new-reply
  socket.on("new-reply", (boardId, newReply, listNotiAboutNewReply) => {
    io.to(boardId).emit("new-reply", newReply);

    for (const noti of listNotiAboutNewReply) {
      const userSocketId = userSocketMap[noti.impactResistantId];

      if (userSocketId) {
        io.to(userSocketId).emit("noti-receive-new-reply", noti);
      }
    }
  });

  // ============================================================================
  // ============================================================================
  // BOARD
  // add new board in homepage
  // socket.on("accept-joining-new-board", (userId, boardId) => {
  socket.on("accept-joining-new-board", (userId) => {
    const userSocketId = userSocketMap[userId];

    if (userSocketId) {
      io.to(userSocketId).emit("accept-joining-new-board");
      // io.to(userSocketId).emit("accept-joining-new-board", boardId);
    }
  });

  // delete board
  socket.on("delete-board", (boardId, userId) => {
    const userSocketId = userSocketMap[userId];

    // // if member is in the deleting board
    // io.to(boardId).emit("delete-board", boardId, userId);

    // if member is in homepage
    io.to(userSocketId).emit("delete-board", boardId, userId);
  });

  // add new user in members component in board page
  socket.on("add-new-user", (boardId) => {
    io.to(boardId).emit("add-new-user");
  });

  // remove user from board when the removing user is in homepage
  socket.on("remove-user", (userId) => {
    io.emit("remove-user", userId);
  });

  // change the role of user in board when the modifying user is in board page
  socket.on("change-role-of-user", (userId) => {
    const userSocketId = userSocketMap[userId];

    if (userSocketId) {
      io.to(userSocketId).emit("change-role-of-user", userId);
    }
  });

  // access board
  socket.on("access-board", (username, boardId) => {
    socket.join(boardId);
    console.log(`User ${username} has joined board ${boardId}`);
    console.log("");
  });

  // update board
  socket.on("update-board", (boardId, newBoard) => {
    io.to(boardId).emit("update-board", newBoard);
  });

  // update column
  socket.on("update-column", (boardId, newColumn) => {
    io.to(boardId).emit("update-column", newColumn);
  });

  // ============================================================================
  // ============================================================================
  // CARD
  // update-card
  socket.on("update-card", (actorId, boardId, modifiedCard) => {
    io.to(boardId).emit("update-card", actorId, modifiedCard);
  });

  // add-user-into-card
  socket.on("add-user-into-card", (boardId, actorId, newFilteredMembers) => {
    io.to(boardId).emit("add-user-into-card", actorId, newFilteredMembers);
  });

  // remove-user-from-card
  socket.on("remove-user-from-card", (boardId, actorId, newFilteredMembers) => {
    io.to(boardId).emit("remove-user-from-card", actorId, newFilteredMembers);
  });
  // ============================================================================
  // ============================================================================
});

export { io, userSocketMap };
