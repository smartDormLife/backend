import authService from "../services/auth.service.js";

export async function register(req, res) {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json(result);
  } catch (err) {
    return res
      .status(err.status ?? 500)
      .json({ message: err.message ?? "Server error" });
  }
}

export async function login(req, res) {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res
      .status(err.status ?? 500)
      .json({ message: err.message ?? "Server error" });
  }
}

export async function getMe(req, res) {
  try {
    const result = await authService.getMe(req.user.user_id);
    return res.status(200).json(result);
  } catch (err) {
    return res
      .status(err.status ?? 500)
      .json({ message: err.message ?? "Server error" });
  }
}

export async function updateMe(req, res) {
  try {
    const result = await authService.updateMe(req.user.user_id, req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res
      .status(err.status ?? 500)
      .json({ message: err.message ?? "Server error" });
  }
}

export async function logout(req, res) {
  // Client side clears the token. Server just responds OK.
  return res.status(200).json({ message: "Logged out successfully" });
}
