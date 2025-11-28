import dormService from "../services/dorm.service.js";

export async function getDorms(req, res) {
  try {
    const result = await dormService.getAllDorms();
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
