import { Router } from "express";
import {
  downloadFile,
  logoutUser,
  registerUser,
  renderFileDetails,
  renderHomepage,
  renderLogin,
  renderRegister,
  renderUpload,
  requireLogin,
  uploadFile,
} from "../controllers/indexController.js";
import validateUser from "../validators/userValidator.js";
import passport from "../config/passport.js";
import multer from "multer";

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 },
});

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

indexRouter.get("/upload", requireLogin, renderUpload);
indexRouter.post("/upload", requireLogin, upload.single("file"), uploadFile);

indexRouter.get("/files/:id", requireLogin, renderFileDetails);
indexRouter.get("/files/:id/download", requireLogin, downloadFile);

export default indexRouter;
