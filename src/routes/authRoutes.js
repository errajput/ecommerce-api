import { Router } from "express";
import { ZodError } from "zod";
import User from "../models/UserSchema.js";
import { LoginSchema, RegisterSchema } from "../validations/authvalidation.js";
import { generateJwt, hashPassword, verifyPassword } from "../shared/utils.js";

const router = Router();

// NOTE: For register
router.post("/register", async (req, res) => {
  try {
    const validatedData = RegisterSchema.parse(req.body);
    const user = await UserModel.findOne({ email: validatedData.email });

    if (user) {
      res.status(400).send({ message: "Email already used." });
      return;
    }
    const { email, password, name } = validatedData;
    const hashedPassword = await hashPassword(password);
    const newUser = new User({ email, password: hashedPassword, name });
    await newUser.save();

    res.send({ message: "User Registered" });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).send({ error: "Error", errors: error.issues });
      return;
    }
    console.log(`Error - ${req.method}:${req.path} - `, error);
    res.status(500).send({ error: error.message });
  }
});

// NOTE: For login
router.post("/login", async (req, res) => {
  try {
    const validatedData = LoginSchema.parse(req.body);
    const { email, password } = validatedData;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).send({ message: "Invalid Cred." });
      return;
    }
    if (!(await verifyPassword(password, user.password))) {
      res.status(400).send({ message: "Invalid Cred." });
      return;
    }

    const token = generateJwt({ email, id: user._id });
    res.send({ message: "Login Successful.", data: { token } });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).send({ error: "Error", errors: error.issues });
      return;
    }
    console.log(`Error - ${req.method}:${req.path} - `, error);
    res.status(500).send({ error: error.message });
  }
});

export default router;
