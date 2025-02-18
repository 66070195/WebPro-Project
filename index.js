const express = require("express");
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
app.set('view engine', 'ejs');


// routing path
//test
app.get('/', function (req, res) {
  // res.render('login');
  res.render('login', { shake: false });
  // res.render('login', { errorMessage: null });
});

app.post('/Home', function (req, res) {
  let formdata = {
    id: req.body.id,
    password: req.body.password,
  };
  console.log(formdata);
  let sql = `SELECT * FROM Users WHERE username = ${formdata.id} OR  AND password = ${formdata.password}`;
  db.get(sql, (err, row) => {
    if (err) {
      return console.error('Error checking data:', err.message);
    }
    console.log(row);
    if (row) {
      if (row.role_id === 2) {
        console.log('login successful');
        // Redirect to user page or home
        res.render('user');
      } else if (row.role_id === 1) {
        console.log('login successful');
        // Redirect to admin page
        res.render('admin');
      }
    }
    else {
      res.render('login', { shake: true });
    }
  });
});



// Starting the server
app.listen(port, () => {
  console.log("Server started.");
});