import { body } from "express-validator";

const validateUser = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("first name is required")
    .isLength({ max: 20 })
    .withMessage("name cannot exceed 20 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("must be email"),
  body("password").notEmpty().withMessage("password is required"),
  body("confirmPassword")
    .notEmpty()
    .withMessage("confirm password is required")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("password must match"),
];

export default validateUser;
