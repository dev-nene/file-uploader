import express from "express";
const app = express();
// import session from "express-session";
// import passport from "passport";
import indexRouter from "./routes/indexRouter.js";
import "dotenv/config";

app.set("view engine", "ejs");

// app.use(express.urlencoded({ extended: true }));
// app.use(session({ secret: "secret", resave: false, saveUninitialized: false }));
// app.use(passport.session());

app.use("/", indexRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, (err) => {
  if (err) {
    console.log(err);
  }
  console.log(`app is listening on port ${PORT}`);
});
