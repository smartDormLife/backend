import { postService } from "../services/post.service.js";

export const postController = {
  // ---------------------------
  // 게시판 목록
  // ---------------------------
  async list(req, res) {
    try {
      const userId = req.user?.user_id;   // ★ 핵심
      const data = await postService.list(req.query, userId);
      return res.json(data);
    } catch (err) {
      console.error(err);
      const status = err.status || 500;
      return res.status(status).json({ message: err.message || "Server error" });
    }
  },

  // ---------------------------
  // 최신 게시글
  // ---------------------------
  async recent(req, res) {
    try {
      const userId = req.user?.user_id;
      const data = await postService.recent(5, userId);
      return res.json(data);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ message: err.message || "Server error" });
    }
  },


  // ---------------------------
  // 상세 조회
  // ---------------------------
  async detail(req, res) {
    try {
      const userId = req.user?.user_id;   // ★ 핵심
      const postId = Number(req.params.postId);

      const data = await postService.detail(postId, userId);
      return res.json(data);
    } catch (err) {
      console.error(err);
      const status = err.status || 500;
      return res.status(status).json({ message: err.message || "Server error" });
    }
  },

  // ---------------------------
  // 생성
  // ---------------------------
  async create(req, res) {
    try {
      const userId = req.user?.user_id;
      const data = await postService.create(userId, req.body);
      return res.json(data);
    } catch (err) {
      console.error(err);
      const status = err.status || 500;
      return res.status(status).json({ message: err.message || "Server error" });
    }
  },

  // ---------------------------
  // 수정
  // ---------------------------
  async update(req, res) {
    try {
      const userId = req.user?.user_id;
      const postId = Number(req.params.postId);
      const data = await postService.update(userId, postId, req.body);
      return res.json(data);
    } catch (err) {
      console.error(err);
      const status = err.status || 500;
      return res.status(status).json({ message: err.message || "Server error" });
    }
  },

  // ---------------------------
  // 삭제
  // ---------------------------
  async remove(req, res) {
    try {
      const userId = req.user?.user_id;
      const postId = Number(req.params.postId);
      await postService.remove(userId, postId);
      return res.json({ success: true });
    } catch (err) {
      console.error(err);
      const status = err.status || 500;
      return res.status(status).json({ message: err.message || "Server error" });
    }
  },

  // ---------------------------
  // 댓글 목록
  // ---------------------------
  async listComments(req, res) {
    try {
      const postId = Number(req.params.postId);
      const data = await postService.listComments(postId);
      return res.json(data);
    } catch (err) {
      console.error(err);
      const status = err.status || 500;
      return res.status(status).json({ message: err.message || "Server error" });
    }
  },

  // ---------------------------
  // 댓글 추가
  // ---------------------------
  async addComment(req, res) {
    try {
      const userId = req.user?.user_id;
      const postId = Number(req.params.postId);
      const content = req.body.content;

      const data = await postService.addComment(userId, postId, content);
      return res.json(data);
    } catch (err) {
      console.error(err);
      const status = err.status || 500;
      return res.status(status).json({ message: err.message || "Server error" });
    }
  },
};
