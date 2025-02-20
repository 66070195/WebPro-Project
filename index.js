const express = require("express");
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


// routing path
app.get('/', function (req, res) {
  let nullForm = {
    id: '',
    password: ''
  };
  res.render('login', { layout: false, shake: false, formdata: nullForm });
});


app.get('/manageuser', (req, res) => {
  res.render('manageuser')
});
app.get("/graph", (req, res) => {
  res.render("graph");
});


//Action
app.post('/Home', function (req, res) {
  let formdata = {
    id: req.body.id,
    password: req.body.password,
  };
  console.log(formdata);
  let sql = `SELECT * FROM users 
  WHERE (username = '${formdata.id}' OR email = '${formdata.id}') 
  AND password = '${formdata.password}'`;
  db.get(sql, (err, row) => {
    if (err) {
      return console.error('Error checking data:', err.message);
    }
    console.log(row);
    if(row){
      if (row.password === formdata.password) {
        if (row.role === 2) {
          console.log('login successful');
          // Redirect to user page or home
          res.render('tenant');
        } else if (row.role === 1) {
          console.log('login successful');
          // Redirect to admin page
          res.render('admin');
        }
    }
    }
    else {
      // res.render('login', { shake: true});
      res.render('login', { layout: false,shake: true, formdata: formdata });


    }
  });
});



// Starting the server
app.listen(port, () => {
  console.log("Server started.");
});