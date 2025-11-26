import userService from "../services/user.service.js";

export async function getMe(req, res) {
  try {
    const userId = req.user.user_id;
    const result = await userService.getMe(userId);

    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function updateMe(req, res) {
  try {
    const userId = req.user.user_id;
    const result = await userService.updateMe(userId, req.body);

    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(err.status ?? 500).json({ message: err.message });
  }
}
