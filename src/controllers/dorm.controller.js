import { dormService } from "../services/dorm.service.js";

export const dormController = {
  list: (_, res) => dormService.list().then(r => res.json(r))
};
