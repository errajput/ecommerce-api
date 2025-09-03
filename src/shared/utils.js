import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "MY_SECRET";
const SALT_ROUND = 10;

export const hashPassword = (password) => {
  return bcrypt.hash(password, SALT_ROUND);
};

export const verifyPassword = (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateJwt = (data) => {
  return jwt.sign(data, JWT_SECRET);
};

export const verifyJwt = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
