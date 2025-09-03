import { ZodError } from "zod";

export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      console.log("error", error);
      return res.status(400).json({
        errors: error,
      });
    }

    // fallback for other unexpected errors
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
