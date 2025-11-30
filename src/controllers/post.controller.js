import { postService } from "../services/post.service.js";

export const postController = {
  // 목록 조회
  getPosts: async (req, res, next) => {
    try {
      const posts = await postService.getPosts(req.query, req.user);
      return res.json(posts);
    } catch (e) {
      next(e);
    }
  },

  // 상세조회
  getPost: async (req, res, next) => {
    try {
      const postId = Number(req.params.postId);
      const post = await postService.getPost(postId, req.user);
      return res.json(post);
    } catch (e) {
      next(e);
    }
  },

  // 게시글 생성
  createPost: async (req, res, next) => {
    try {
      const newPost = await postService.createPost(req.user, req.body);
      return res.status(201).json(newPost);
    } catch (e) {
      next(e);
    }
  },

  // 게시글 수정
  updatePost: async (req, res, next) => {
    try {
      const postId = Number(req.params.postId);
      const updated = await postService.updatePost(postId, req.user, req.body);
      return res.json(updated);
    } catch (e) {
      next(e);
    }
  },

  // 게시글 삭제
  deletePost: async (req, res, next) => {
    try {
      const postId = Number(req.params.postId);
      const deleted = await postService.deletePost(postId, req.user);
      return res.json(deleted);
    } catch (e) {
      next(e);
    }
  }
};
