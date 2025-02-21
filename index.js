const express = require("express");
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts')
const path = require("path");
const port = 3000;
const sqlite3 = require('sqlite3').verbose();


// Creating the Express server
const app = express();

// ADD middleware something
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to SQLite database
let db = new sqlite3.Database('MyWebData.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the SQlite database.');
});


// static resourse & templating engine
app.use(express.static('public'));
// Set EJS as templating engine
app.use(expressLayouts)
app.set('layout', './layouts/index')
app.set('view engine', 'ejs');

app.use(session({
  secret: 'idonthaveanysecretlmfao',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use((req, res, next) => {
  if (req.session && req.session.user) {
      req.user = req.session.user;
  }
  next();
});

// routing path
app.get('/', function (req, res) {
  res.render('login', { layout: false, shake: false, formdata: "" });
});


app.get('/manageuser', (req, res) => {
  res.render('manageuser', { role: req.user.role, currentPath: req.path });
});
app.get("/graph", (req, res) => {
  res.render('graph', { role: req.user.role, currentPath: req.path });
});
app.get("/manageroom", (req, res) => {
  res.render('manageroom', { role: req.user.role, currentPath: req.path });
});


//Action
app.post('/home', function (req, res) {
  const { username, password } = req.body;
    console.log(username);

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
      if (err) {
        return res.status(500).send('Error fetching user');
      }
      if (row && row.password === password) {
          req.session.user = {
              id: row.id,
              username: row.username,
              role: row.role
          };

          if (row.role === 2) {
            console.log('login successful');
            res.redirect("manageuser");
          } else if (row.role === 1) {
              console.log('login successful');
              res.redirect("graph");
          }
      } else {
          console.log('login failed');
          res.render('login', { layout: false, shake: true, formdata: username });
      }
  });
});



// Starting the server
app.listen(port, () => {
  console.log("Server started.");
});