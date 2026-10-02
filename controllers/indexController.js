import { matchedData, validationResult } from "express-validator";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import { unlink } from "node:fs/promises";

export async function renderHomepage(req, res) {
  let files = [];
  let folders = [];
  if (req.user) {
    files = await prisma.file.findMany({
      where: { ownerId: req.user.id },
      orderBy: { uploadedAt: "desc" },
    });
    folders = await prisma.folder.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
  }

  res.render("index", { user: req.user, files, folders });
}

export async function renderRegister(req, res) {
  res.render("register", { errors: [], user: {} });
}

export async function registerUser(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("register", {
      errors: errors.array(),
      user: { name: req.body.name, email: req.body.email },
    });
  }
  const userData = matchedData(req);

  const password_hash = await bcrypt.hash(userData.password, 10);

  try {
    await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password_hash: password_hash,
      },
    });
    res.redirect("/login");
  } catch (error) {
    if (error.code === "P2002") {
      return res.render("register", {
        errors: [{ msg: "Email is already taken" }],
        user: { name: req.body.name, email: req.body.email },
      });
    }
    return next(error);
  }
}

export async function renderLogin(req, res) {
  res.render("login", { errors: [], user: {} });
}

export async function logoutUser(req, res, next) {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
}

export function requireLogin(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  return next();
}

export function renderUpload(req, res) {
  res.render("upload", { errors: [] });
}

export async function uploadFile(req, res) {
  if (!req.file) {
    return res
      .status(400)
      .render("upload", { errors: [{ msg: "File is missing" }] });
  }

  try {
    await prisma.file.create({
      data: {
        name: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        ownerId: req.user.id,
      },
    });
  } catch (error) {
    try {
      await unlink(req.file.path);
    } catch (cleanupError) {
      console.log("Could not delete uploaded file", cleanupError);
    }
    return next(error);
  }
  return res.send("File uploaded");
}

export async function renderFileDetails(req, res) {
  const fileId = Number(req.params.id);
  if (!Number.isInteger(fileId) || fileId <= 0) {
    return res.status(400).send("Invalid file ID");
  }
  const file = await prisma.file.findFirst({
    where: { id: fileId, ownerId: req.user.id },
  });
  if (!file) {
    return res.status(404).send("File does not exist");
  }
  res.render("fileDetails", { file });
}

export async function downloadFile(req, res) {
  const fileId = Number(req.params.id);
  if (!Number.isInteger(fileId) || fileId <= 0) {
    return res.status(400).send("Invalid file ID");
  }
  const file = await prisma.file.findFirst({
    where: { id: fileId, ownerId: req.user.id },
  });
  if (!file) {
    return res.status(404).send("File does not exist");
  }
  res.download(file.path, file.name);
}

export async function renderNewFolderForm(req, res) {
  res.render("folder-form", { errors: [] });
}

export async function createFolder(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render("folder-form", { errors: errors.array() });
  }

  const folderData = matchedData(req);
  await prisma.folder.create({
    data: {
      name: folderData.name,
      ownerId: req.user.id,
    },
  });
  res.redirect("/");
}
