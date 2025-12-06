import { chatService } from "../services/chat.service.js";

class ChatController {
  async listRooms(req, res) {
    try {
      const userId = req.user.user_id;
      const chatRooms = await chatService.getUserChatRooms(userId);

      return res.status(200).json({
        success: true,
        data: chatRooms,
      });
    } catch (error) {
      console.error("Error listing chat rooms:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to list chat rooms",
      });
    }
  }

  async getRoomDetail(req, res) {
    try {
      const userId = req.user.user_id;
      const roomId = parseInt(req.params.roomId);

      if (isNaN(roomId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid room ID",
        });
      }

      const chatRoom = await chatService.getChatRoomDetail(roomId, userId);

      return res.status(200).json({
        success: true,
        data: chatRoom,
      });
    } catch (error) {
      console.error("Error getting chat room detail:", error);
      return res.status(error.message.includes("not found") ? 404 : 403).json({
        success: false,
        message: error.message || "Failed to get chat room detail",
      });
    }
  }

  async createRoom(req, res) {
    try {
      const { party_id } = req.body;

      if (!party_id) {
        return res.status(400).json({
          success: false,
          message: "Party ID is required",
        });
      }

      const chatRoom = await chatService.createChatRoom(party_id);

      return res.status(201).json({
        success: true,
        data: chatRoom,
      });
    } catch (error) {
      console.error("Error creating chat room:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to create chat room",
      });
    }
  }

  async getMessages(req, res) {
    try {
      const userId = req.user.user_id;
      const roomId = parseInt(req.params.roomId);
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      if (isNaN(roomId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid room ID",
        });
      }

      const messages = await chatService.getChatMessages(
        roomId,
        userId,
        limit,
        offset
      );

      return res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      console.error("Error getting messages:", error);
      return res.status(error.message.includes("not found") ? 404 : 403).json({
        success: false,
        message: error.message || "Failed to get messages",
      });
    }
  }

  async sendMessage(req, res) {
    try {
      const userId = req.user.user_id;
      const roomId = parseInt(req.params.roomId);
      const { content } = req.body;

      if (isNaN(roomId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid room ID",
        });
      }

      if (!content || content.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Message content is required",
        });
      }

      const message = await chatService.createMessage(
        roomId,
        userId,
        content.trim()
      );

      return res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      return res.status(error.message.includes("not found") ? 404 : 403).json({
        success: false,
        message: error.message || "Failed to send message",
      });
    }
  }

  async getMembers(req, res) {
    try {
      const userId = req.user.user_id;
      const roomId = parseInt(req.params.roomId);

      if (isNaN(roomId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid room ID",
        });
      }

      const members = await chatService.getChatMembers(roomId, userId);

      return res.status(200).json({
        success: true,
        data: members,
      });
    } catch (error) {
      console.error("Error getting members:", error);
      return res.status(error.message.includes("not found") ? 404 : 403).json({
        success: false,
        message: error.message || "Failed to get members",
      });
    }
  }
  async markAsRead(req, res) {
    try {
      const userId = req.user.user_id;
      const roomId = parseInt(req.params.roomId);

      if (isNaN(roomId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid room ID",
        });
      }

      await chatService.markMessagesAsRead(roomId, userId);

      return res.status(200).json({
        success: true,
        message: "Messages marked as read",
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to mark messages as read",
      });
    }
  }
}

export const chatController = new ChatController();
