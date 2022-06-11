import express from "express";
import bodyParser from "body-parser";

import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import mongoose from "mongoose";
import findOrCreate from "mongoose-findorcreate";
import bcrypt from "bcrypt";

import "dotenv/config";

//
//

const port = process.env.PORT || 3000;
const app = express();
const saltRounds = 10;

// Express configuration (middleware) 🚅
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(
  session({
    secret: "Teste",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
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

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.REDIRECT_URI,
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

////

// Setting up the homepage 🪄
app.route("/").get((req, res) => {
  res.render("home");
});

app.route("/Auth/Google").get((req, res) => {
  passport.authenticate("google", { scope: ["profile"] });
});

app.get(
  "/Auth/Google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect Secrets.
    res.redirect("/secrets");
  }
);

// Registering a new user 🧑‍🚀
app
  .route("/register")
  .get((req, res) => {
    res.render("register");
  })
  .post((req, res) => {
    const { username, password } = req.body; // Destructuring the body
    User.register(
      {
        username: username,
        password: password,
      },
      password,
      (err, user) => {
        err
          ? console.log(err) && res.redirect("/register")
          : passport.authenticate("local")(req, res, () => {
              res.redirect("/secrets");
            });
      }
    );
  });

// Login route 🔐
app
  .route("/login")
  .get((req, res) => {
    res.render("login"); // Rendering the login page 🏠
  })
  .post((req, res) => {
    const { username, password } = req.body;

    function loginUser() {
      const user = new User({
        username: username,
        password: password,
      });

      req.login(user, (err) => {
        err && console.log(err);
        return passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets");
        });
      });
    }

    // User.findOne({ username: username }, (err, user) => {
    //   err && console.log(err); // Error handling 💩

    //   if (user) {
    //     return bcrypt.compare(password, user.password, (err, result) => {
    //       switch (result) {
    //         case true:
    //           break;
    //         case false:
    //           res.redirect("/login");
    //           break;
    //         default:
    //           console.log("Erro");
    //           break;
    //       }
    //     });
    //   }
    // });
  });

app.route("/logout").get((req, res) => {
  req.logout((err) => console.log(err));
  res.redirect("/");
});

app.route("/secrets").get((req, res) => {
  req.isAuthenticated() ? res.render("secrets") : res.redirect("/login");
});
////

// Setting up the server 🚀
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
