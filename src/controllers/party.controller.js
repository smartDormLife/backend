import partyService from "../services/party.service.js";

export async function joinParty(req, res) {
  try {
    const partyId = Number(req.params.partyId);
    const userId = req.user.user_id;

    const result = await partyService.joinParty(partyId, userId);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function leaveParty(req, res) {
  try {
    const partyId = Number(req.params.partyId);
    const userId = req.user.user_id;

    const result = await partyService.leaveParty(partyId, userId);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status ?? 500).json({ message: err.message });
  }
}
