const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const { generateRandomString, checkByEmail, urlsForUser } = require("./helper");
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'session',
  keys: ['minion']
}));

app.set("view engine", "ejs");

function checkPassword(password) {
  for (const key in users) {
    if (bcrypt.compareSync(password, users[key].password)) {
      return key;
    }
  }
  return false;
}

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

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

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Route to the main page where it gets page for URL index
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

app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      user:req.session.user_id
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.redirect("/login");
  }
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
  console.log(req.params);
  console.log(urlDatabase);
  console.log(urlDatabase[req.params.shortURL]);
  if (urlDatabase[req.params.shortURL]) {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    return res.redirect(longURL);
  } else {
    return res.redirect("/urls");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  // user has to login first to be able to create a newURL
  if (!users[req.session.user_id]) {
    return res.redirect("/login");
  }
  if (!urlDatabase[req.params.shortURL]) {
    return res.redirect("/urls");
  }
  const templateVars = {
    user: users[req.session.user_id],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  }; // Use [] to add a value/property of shortURL
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: req.session.user_id
  };
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (!users[req.session.user_id]) {
    return res.redirect("/login");
  }
  if (!urlDatabase[req.params.shortURL]) {
    return res.redirect("/urls");
  }
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  if (users[req.session.user_id]) {
    let userUrl = urlsForUser(req.session.user_id, urlDatabase);
    for (let key in userUrl) {
      if (!req.params.id === key) {
        return res.status(401).send("This URL can not be updated.");
      }
    }
    urlDatabase[req.params.id].longURL = req.body.updatedURL;
    res.redirect("/urls");
  } else {
    return res.status(401).send("You need to login first!");
  }
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
  };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  let password = req.body.password;
  const user = checkByEmail(email, users);
  const isValidPassword = checkPassword(password, users[user]);
  // console.log({user, password, isValidPassword});
  if (isValidPassword) {
    req.session.user_id = user;
    res.redirect("/urls");
  } else {
    return res.status(403).send("Incorrect credentials!");
  }
});

app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
  };
  res.render("register", templateVars);
});

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
  
  req.session.user_id = newUser;
  // checking if password is encrypted
  console.log(users);
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

