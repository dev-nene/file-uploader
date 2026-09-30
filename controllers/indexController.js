import { matchedData, validationResult } from "express-validator";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";

export async function renderHomepage(req, res) {
  res.render("index", { user: req.user });
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
