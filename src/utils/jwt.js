import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;

export function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "2h" });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}
