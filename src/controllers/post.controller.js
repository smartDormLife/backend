import postService from "../services/post.service.js";

export async function createPost(req, res) {
  try {
    const user_id = req.user.user_id;
    const result = await postService.createPost(user_id, req.body);

    return res.status(201).json(result);
  } catch (err) {
    console.error(err);
    return res
      .status(err.status ?? 500)
      .json({ message: err.message ?? "Server error" });
  }
}

export async function getPosts(req, res) {
  try {
    const result = await postService.getPosts(req.query);
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res
      .status(err.status ?? 500)
      .json({ message: err.message ?? "Server error" });
  }
}


export async function getRecentPosts(req, res) {
  try {
    const limit = Number(req.query.limit ?? 5);
    const result = await postService.getRecentPosts(limit);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function updatePost(req, res) {
  try {
    const postId = Number(req.params.postId);
    const userId = req.user.user_id;

    const result = await postService.updatePost(postId, userId, req.body);

    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res
      .status(err.status ?? 500)
      .json({ message: err.message ?? "Server error" });
  }
}

export async function deletePost(req, res) {
  try {
    const postId = Number(req.params.postId);
    const userId = req.user.user_id;

    const result = await postService.deletePost(postId, userId);

    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function getPostDetail(req, res) {
  try {
    const postId = Number(req.params.postId);
    // 로그인 안된 상태일 수도 있으므로 req.user?.user_id
    const userId = req.user?.user_id;
    const result = await postService.getPostDetail(postId, userId);

    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(err.status ?? 500).json({ message: err.message });
  }
}

