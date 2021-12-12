const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const { generateRandomString, checkByEmail, urlsForUser } = require("./helper");
const PORT = 8080; // default port 8080
const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['minion']
}));

function checkPassword(password) {
  for (const key in users) {
    if (bcrypt.compareSync(password, users[key].password)) {
      return key;
    }
  }
  return false;
}

//Databse
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" },
  m12345: { longURL: "https://www.telus.com", userID: "m123"}
};

//Users
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

// Route to homepage
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// It returns database information in a JSON format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// returns the page for urls_index
app.get("/urls", (req, res) => {
  const user = req.session.user_id;
  const userUrls = urlsForUser(user, urlDatabase);
  const templateVars = {
    user: users[req.session.user_id],
    urls: userUrls
  };
  if (!user) {
    return res.redirect("/login");
  }
  res.render("urls_index", templateVars);
});

// This is where new URL is being created
app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.redirect("/login");
  }

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID
  };

  res.redirect(`/urls/${shortURL}`);
});

// route that creates a new shorturl
app.get("/urls/new", (req, res) => {
  // if user is not logged in it redirects to login
  const templateVars = {
    user: users[req.session.user_id],
  };
  if (users[req.session.user_id]) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// this path handles the shortURL requests
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    return res.redirect(longURL);
  } else {
    return res.redirect("/urls");
  }
});

// returns the page where user can Edit and Delete a URL
app.get("/urls/:shortURL", (req, res) => {
  // user has to login first to be able to create a newURL
  const userID = req.session.user_id;
  if (!userID) {
    return res.status(401).send("<h1> Please login first! </h1>");
  }
  const user = users[userID];
  const shortURL = req.params.shortURL;
  const urlObject = urlDatabase[shortURL];
  if (userID !== urlObject.userID) {
    return res.status(401).send("<h1> This URL does not belong to you. </h1>");
  }
  const templateVars = {
    user,
    shortURL,
    longURL: urlObject.longURL
  };
  res.render("urls_show", templateVars);
});

// only a user who has logged in and created a url can delete that url
// Deletes the URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.redirect("/login");
  }
  const user = users[userID];
  const shortURL = req.params.shortURL;
  const urlObject = urlDatabase[shortURL];
  if (!urlObject) {
    return res.redirect("/urls");
  }
  if (userID !== urlObject.userID) {
    return res.redirect("/urls");
  }
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// checks to see if a user has logged in first and if that shortURL exist only then a user can update the URL
app.post("/urls/:id", (req, res) => {
  const userid = req.session.user_id;
  const currentUser = users[userid];
  const urlid = req.params.id;
  const currentUrlObj = urlDatabase[urlid];

  if (!currentUser) {
    return res.status(401).send("<h1> Please login first! </h1>");
  }

  if (userid !== currentUrlObj.userID) {
    return res.status(401).send("<h1> This URL does not belong to you. </h1>");
  }

  urlDatabase[urlid].longURL = req.body.updatedURL;
});

// Login page rendering
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
  };
  res.render("login", templateVars);
});

//returns login page where it checks for valid email and password using a function
app.post("/login", (req, res) => {
  const email = req.body.email;
  let password = req.body.password;
  const user = checkByEmail(email, users);
  const isValidPassword = checkPassword(password, users[user]);
  if (isValidPassword) {
    req.session.user_id = user;
    res.redirect("/urls");
  } else {
    return res.status(403).send("Incorrect credentials!");
  }
});

//user can logout and redirect them to /urls
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/urls");
});

// register rendering
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
  };
  res.render("register", templateVars);
});

// checks for valid email and password and also to make sure they leave the fields blank
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  //check if user left email or password blank
  if (!email || !password) {
    return res.status(403).send("Sorry can not leave it blank!");
  }
  const user = checkByEmail(email, users);
  if (user) {
    return res.status(403).send("This user already exists!");
  }
  // hash the password before storing to database
  const hashPassword = bcrypt.hashSync(password, 10);
  const newUser = generateRandomString(3);
  users[newUser] = {
    id: newUser,
    email: email,
    password: hashPassword
  };
  // returns encrypted password when you check in commandline
  req.session.user_id = newUser;
  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

