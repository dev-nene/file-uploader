import passport from "passport";
import LocalStrategy from "passport-local";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return done(null, false, { message: "Incorrect email" });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
          return done(null, false, { message: "Incorrect password" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return done(null, false);
    }
    return done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
