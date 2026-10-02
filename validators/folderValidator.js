import { body } from "express-validator";

const folderValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("name is required")
    .isLength({ max: 30 })
    .withMessage("name cannot exceed 30 characters"),
];

export default folderValidator;
