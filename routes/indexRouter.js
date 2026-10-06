import { Router } from "express";
import {
  checkFolderOwnership,
  createFolder,
  createFolderShare,
  deleteFolder,
  downloadFile,
  downloadSharedFile,
  editFolder,
  logoutUser,
  registerUser,
  renderFileDetails,
  renderFolderDetails,
  renderFolderEdit,
  renderHomepage,
  renderLogin,
  renderNewFolderForm,
  renderRegister,
  renderSharedFolder,
  renderUpload,
  requireLogin,
  requireValidShare,
  uploadFile,
  uploadFileToFolder,
} from "../controllers/indexController.js";
import validateUser from "../validators/userValidator.js";
import passport from "../config/passport.js";
import multer from "multer";
import folderValidator from "../validators/folderValidator.js";

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

indexRouter.get("/folders/new", requireLogin, renderNewFolderForm);
indexRouter.post("/folders", requireLogin, folderValidator, createFolder);
indexRouter.get("/folders/:id", requireLogin, renderFolderDetails);
indexRouter.post(
  "/folders/:id/upload",
  requireLogin,
  checkFolderOwnership,
  upload.single("file"),
  uploadFileToFolder,
);
indexRouter.get(
  "/folders/:id/edit",
  requireLogin,
  checkFolderOwnership,
  renderFolderEdit,
);
indexRouter.post(
  "/folders/:id/edit",
  requireLogin,
  checkFolderOwnership,
  folderValidator,
  editFolder,
);
indexRouter.post(
  "/folders/:id/delete",
  requireLogin,
  checkFolderOwnership,
  deleteFolder,
);

indexRouter.post(
  "/folders/:id/share",
  requireLogin,
  checkFolderOwnership,
  createFolderShare,
);
indexRouter.get("/share/:token", requireValidShare, renderSharedFolder);
indexRouter.get(
  "/share/:token/files/:id/download",
  requireValidShare,
  downloadSharedFile,
);

export default indexRouter;
