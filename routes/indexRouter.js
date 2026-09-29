import { Router } from "express";
import {
  registerUser,
  renderHomepage,
  renderRegister,
} from "../controllers/indexController.js";
import validateUser from "../validators/userValidator.js";

const indexRouter = Router();

indexRouter.get("/", renderHomepage);

indexRouter.get("/register", renderRegister);
indexRouter.post("/register", validateUser, registerUser);

export default indexRouter;
