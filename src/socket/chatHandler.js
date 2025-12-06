import { chatService } from "../services/chat.service.js";

export const setupChatHandlers = (io) => {
  io.on("connection", async (socket) => {
    const user = socket.user;
    console.log(`✅ User connected: ${socket.id} (${user.name})`);

    // 연결 시 사용자의 모든 채팅방에 자동으로 join (알림용)
    try {
      const userRooms = await chatService.getUserChatRooms(user.user_id);
      userRooms.forEach((room) => {
        socket.join(`room_${room.room_id}`);
        console.log(`🔔 ${user.name} auto-joined room ${room.room_id} for notifications`);
      });
    } catch (error) {
      console.error("Error auto-joining rooms:", error);
    }

    socket.on("joinRoom", async ({ roomId }) => {
      try {
        console.log(`🚪 ${user.name} joining room ${roomId}`);

        const roomIdInt = parseInt(roomId);
        if (isNaN(roomIdInt)) {
          socket.emit("error", { message: "Invalid room ID" });
          return;
        }

        const chatRoom = await chatService.getChatRoomDetail(
          roomIdInt,
          user.user_id
        );

        if (!chatRoom) {
          socket.emit("error", { message: "Chat room not found" });
          return;
        }

        socket.join(`room_${roomId}`);

        // 채팅방 입장 시 메시지 읽음 처리
        await chatService.markMessagesAsRead(roomIdInt, user.user_id);

        socket.emit("joinedRoom", {
          roomId,
          message: `Joined room ${roomId}`,
        });

        socket.to(`room_${roomId}`).emit("userJoined", {
          userId: user.user_id,
          userName: user.name,
          roomId,
        });

        console.log(`✅ ${user.name} joined room ${roomId}`);
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", {
          message: error.message || "Failed to join room",
        });
      }
    });

    socket.on("leaveRoom", async ({ roomId }) => {
      try {
        console.log(`🚪 ${user.name} leaving room ${roomId}`);

        const roomIdInt = parseInt(roomId);
        if (!isNaN(roomIdInt)) {
          // 채팅방을 나갈 때 메시지 읽음 처리 (나가는 시점까지의 메시지를 읽음으로 처리)
          await chatService.markMessagesAsRead(roomIdInt, user.user_id);
        }

        socket.leave(`room_${roomId}`);

        socket.to(`room_${roomId}`).emit("userLeft", {
          userId: user.user_id,
          userName: user.name,
          roomId,
        });

        console.log(`✅ ${user.name} left room ${roomId}`);
      } catch (error) {
        console.error("Error leaving room:", error);
      }
    });

    socket.on("sendMessage", async ({ roomId, content }) => {
      try {
        console.log(`💬 ${user.name} sending message to room ${roomId}`);

        const roomIdInt = parseInt(roomId);
        if (isNaN(roomIdInt)) {
          socket.emit("error", { message: "Invalid room ID" });
          return;
        }

        if (!content || content.trim() === "") {
          socket.emit("error", { message: "Message content is required" });
          return;
        }

        const message = await chatService.createMessage(
          roomIdInt,
          user.user_id,
          content.trim()
        );

        io.to(`room_${roomId}`).emit("newMessage", {
          msg_id: message.msg_id,
          room_id: message.room_id,
          sender_id: message.sender_id,
          sender: {
            user_id: message.sender.user_id,
            name: message.sender.name,
          },
          content: message.content,
          timestamp: message.timestamp,
        });

        console.log(`✅ Message sent to room ${roomId}`);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", {
          message: error.message || "Failed to send message",
        });
      }
    });

    socket.on("typing", ({ roomId, isTyping }) => {
      try {
        socket.to(`room_${roomId}`).emit("userTyping", {
          userId: user.user_id,
          userName: user.name,
          roomId,
          isTyping,
        });
      } catch (error) {
        console.error("Error handling typing event:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.id} (${user.name})`);
    });

    socket.on("error", (error) => {
      console.error(`❌ Socket error for ${user.name}:`, error);
    });
  });
};
