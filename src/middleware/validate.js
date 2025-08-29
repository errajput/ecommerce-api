export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body); // parse + validate
    next();
  } catch (error) {
    return res.status(400).json({
      errors: error.errors.map((err) => ({
        path: err.path.join("."),
        message: err.message,
      })),
    });
  }
};
