import { matchedData, validationResult } from "express-validator";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import { unlink } from "node:fs/promises";

export async function renderHomepage(req, res) {
  let files = [];
  let folders = [];
  if (req.user) {
    files = await prisma.file.findMany({
      where: { ownerId: req.user.id, folderId: null },
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
  res.render("folder-form", { errors: [], folder: {} });
}

export async function createFolder(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .render("folder-form", { errors: errors.array(), folder: {} });
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

export async function renderFolderDetails(req, res) {
  const folderId = Number(req.params.id);
  if (!Number.isInteger(folderId) || folderId <= 0) {
    return res.status(400).send("Invalid folder Id");
  }

  const folder = await prisma.folder.findFirst({
    where: { id: folderId, ownerId: req.user.id },
    include: { files: { orderBy: { uploadedAt: "desc" } } },
  });

  if (!folder) {
    return res.status(404).send("Folder does not exist");
  }

  res.render("folderDetails", { folder, errors: [] });
}

export async function checkFolderOwnership(req, res, next) {
  const folderId = Number(req.params.id);
  if (!Number.isInteger(folderId) || folderId <= 0) {
    return res.status(400).send("Invalid folder Id");
  }

  const folder = await prisma.folder.findFirst({
    where: { id: folderId, ownerId: req.user.id },
    include: { files: { orderBy: { uploadedAt: "desc" } } },
  });

  if (!folder) {
    return res.status(404).send("You dont have access to this folder");
  }

  req.folder = folder;
  next();
}

export async function uploadFileToFolder(req, res, next) {
  if (!req.file) {
    return res.status(400).render("folderDetails", {
      folder: req.folder,
      errors: [{ msg: "File is missing" }],
    });
  }

  try {
    await prisma.file.create({
      data: {
        name: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        ownerId: req.user.id,
        folderId: req.folder.id,
      },
    });
  } catch (error) {
    try {
      await unlink(req.file.path);
    } catch (cleanupError) {
      console.error("Could not delete uploaded file to folder", cleanupError);
    }
    return next(error);
  }

  return res.redirect(`/folders/${req.folder.id}`);
}

export async function renderFolderEdit(req, res) {
  res.render("folder-form", { errors: [], folder: req.folder });
}

export async function editFolder(req, res) {
  const folderId = Number(req.params.id);
  if (!Number.isInteger(folderId) || folderId <= 0) {
    return res.status(400).send("Invalid folder Id");
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render("folder-form", {
      errors: errors.array(),
      folder: { ...req.folder, name: req.body.name },
    });
  }

  const folderData = matchedData(req);

  await prisma.folder.update({
    where: { id: folderId },
    data: { name: folderData.name },
  });
  res.redirect(`/folders/${folderId}`);
}

export async function deleteFolder(req, res) {
  const folderId = req.folder.id;

  await prisma.$transaction([
    prisma.file.updateMany({
      where: { folderId: folderId },
      data: { folderId: null },
    }),
    prisma.folder.delete({
      where: { id: folderId },
    }),
  ]);

  res.redirect("/");
}
