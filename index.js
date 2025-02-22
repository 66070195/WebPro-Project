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
app.use(express.json());
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
  if (req.session.sidebarClass === undefined) {
      req.session.sidebarClass = '';
  }
  res.render('login', { layout: false, shake: false, formdata: "" });
});
app.get('/manageuser', (req, res) => {
  res.render('manageuser', { role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass });
});
app.get("/graph", (req, res) => {
  res.render('graph', { role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass });
});
app.get("/manageroom", (req, res) => {
  res.render('manageroom', { role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass });
});
app.get("/managemeter", (req, res) => {
  res.render('managemeter', { role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass });
});
app.get("/editroom", (req, res) => {
  res.render('editroom', { role: req.user.role, currentPath: '/manageroom', sidebarClass: req.session.sidebarClass });
});
app.get("/bookroom", (req, res) => {
  res.render('bookroom', { role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass });
});
app.get('/adduser', (req, res) => {
  res.render('adduser', { role: req.user.role, currentPath: '/manageuser', sidebarClass: req.session.sidebarClass });
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


app.post('/toggle-sidebar', (req, res) => {
  req.session.sidebarClass = req.body.sidebarClass || '';
  res.sendStatus(200);
});


app.post('/adduser-submit', (req, res) => {
  console.log('Submitted Add User:', req.body);
  const { fname, lname, idcard, phone } = req.body;
  // insert ข้อมูลลง database ละ redirect กลับหน้า manage user
  res.redirect('manageuser');
});
app.post('/adduser-cancel', (req, res) => {
  res.redirect('manageuser');
});


app.post('/addroom', (req, res) => {
  console.log('Submitted Add Room:', req.body);
  const { noroom, roomprice, roominfo } = req.body;
  // insert ข้อมูลลง database ละ redirect กลับหน้า manage room
  res.redirect('manageroom');
});


app.post('/editroom-submit', (req, res) => {
  console.log('Submitted Edit Room:', req.body);
  const { noroom, roomprice, roominfo } = req.body;
  // update ข้อมูลลง database ละ redirect กลับหน้า manage room
  res.redirect('manageroom');
});
app.post('/editroom-cancel', (req, res) => {
  res.redirect('manageroom');
});


app.post('/bookroom-submit', (req, res) => {
  console.log('Submitted Book Room:', req.body);
  const { selectroom, selectuser, movein, checkout, invoice, duepayment } = req.body;
  // insert ข้อมูลลง database ละ redirect กลับหน้า book room
  res.redirect('bookroom');
});


app.post('/editmeter', (req, res) => {
  console.log('Edit Elec/Water Meter:', req.body);
  const { selectroom, electricmeter, watermeter } = req.body;
  // Update ข้อมูลลง database ละ redirect กลับหน้า manage meter
  res.redirect('managemeter');
});
app.post('/editprice', (req, res) => {
  console.log('Edit Elec/Water Price:', req.body);
  const { electricprice, waterprice } = req.body;
  // Update ข้อมูลลง database ละ redirect กลับหน้า manage meter
  res.redirect('managemeter');
});


// Starting the server
app.listen(port, () => {
  console.log("Server started.");
});