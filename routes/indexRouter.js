import { Router } from "express";
import {
  logoutUser,
  registerUser,
  renderHomepage,
  renderLogin,
  renderRegister,
} from "../controllers/indexController.js";
import validateUser from "../validators/userValidator.js";
import passport from "../config/passport.js";

const indexRouter = Router();

indexRouter.get("/", renderHomepage);

indexRouter.get("/register", renderRegister);
indexRouter.post("/register", validateUser, registerUser);

indexRouter.get("/login", renderLogin);
indexRouter.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    successRedirect: "/",
    failureMessage: true,
  }),
);
indexRouter.post("/logout", logoutUser);

export default indexRouter;
