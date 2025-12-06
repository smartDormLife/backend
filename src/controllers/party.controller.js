import { partyService } from "../services/party.service.js";

export const partyController = {
  join: (req, res) =>
    partyService.join(req.user.user_id, Number(req.params.partyId)).then(r => res.json(r)),

  leave: (req, res) =>
    partyService.leave(req.user.user_id, Number(req.params.partyId)).then(r => res.json(r)),

  detail: (req, res) =>
    partyService.detail(Number(req.params.partyId)).then(r => res.json(r)),

  close: (req, res) =>
    partyService.close(req.user.user_id, Number(req.params.partyId)).then(r => res.json(r))
};
