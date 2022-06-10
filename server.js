import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import { render } from "ejs";
import encrypt from "mongoose-encryption";

const port = process.env.PORT || 3000;
const app = express();

// Express configuration (middleware) 🚅
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
////

// Connecting the database 🚀
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/userDB",
  {
    useNewUrlParser: true,
  }
);

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const secret = "longsecretwordtoYey";
userSchema.plugin(encrypt, {
  secret: secret,
  encryptedFields: ["password"],
});

const User = new mongoose.model("User", userSchema);
////

// Setting up the routes 🪄
app.route("/").get((req, res) => {
  res.render("home");
});

app
  .route("/register")
  .get((req, res) => {
    res.render("register");
  })
  .post((req, res) => {
    const { username, password } = req.body;
    const newUser = new User({ username: username, password: password });
    console.log(newUser);
    newUser.save();
    res.redirect("/");
  });

app
  .route("/login")
  .get((req, res) => {
    res.render("login");
  })
  .post((req, res) => {
    const { password } = req.body;

    User.findOne({ password: password }, (err, user) => {
      if (err) {
        console.log(err);
      } else {
        console.log(user._ac);
        user && user.ac === password
          ? res.render("secrets")
          : console.error([user, user.password, password]);
      }
    });
  });
////

// Setting up the server 🚀
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
