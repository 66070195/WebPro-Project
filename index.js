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

//Middleware กำหนด user
app.use((req, res, next) => {
  if (req.session && req.session.user) {
      req.user = req.session.user;
  }
  next();
});

// Middleware กำหนด Notification badge
app.use((req, res, next) => {
  // เดะ Query จำนวนแถวแจ้งซ่อมที่ สถานะแจ้งเรื่อง ไปโชว์ตรง Notification
  db.get('SELECT COUNT(*) AS count FROM users', (err, row) => {
      if (err) {
          return next(err);
      }
      // console.log(row.count)
      res.locals.rowCount = row.count;
      // res.locals.role = req.user.role;
      res.locals.role = req.user ? req.user.role : 2;
      res.locals.currentPath = req.path;
      res.locals.sidebarClass = req.session.sidebarClass;
      next();
  });
});

function renderPage(page, customPath) {
  return (req, res) => {
      res.render(page, {
          role: res.locals.role,
          currentPath: customPath || res.locals.currentPath,
          sidebarClass: res.locals.sidebarClass,
          rowCount: res.locals.rowCount
      });
  };
}

// routing path
app.get('/', function (req, res) {
  if (req.session.sidebarClass === undefined) {
      req.session.sidebarClass = '';
  }
  res.render('login', { layout: false, shake: false, formdata: "" });
});

app.get('/manageuser', renderPage('manageuser'));
// app.get('/graph', renderPage('graph'));
app.get('/graph', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) {
      return res.status(500).send('Error fetching users');
    }

    // แยกข้อมูล
    const maleUsers = rows.filter(user => user.sex === 'M');
    const femaleUsers = rows.filter(user => user.sex === 'F');
    const otherUsers = rows.filter(user => user.sex === 'O');
    const adminRole = rows.filter(user => user.role === 1);
    const userRole = rows.filter(user => user.role === 2);

    res.render('graph', {
      maleUsers: maleUsers,
      femaleUsers: femaleUsers,
      otherUsers: otherUsers,
      adminRole: adminRole,
      userRole: userRole,
    });
  });
});




app.get('/manageroom', renderPage('manageroom'));
app.get('/managemeter', renderPage('managemeter'));
app.get('/editroom', renderPage('editroom', '/manageroom'));
app.get('/bookroom', renderPage('bookroom'));
app.get('/adduser', renderPage('adduser', '/manageuser'));
app.get('/fixpage', renderPage('fixpage'));
// InvoicePage
app.get('/invoice', renderPage('invoice'));
app.get('/showinvoice', renderPage('showinvoice', '/invoice'));
app.get('/showreceipt', renderPage('showreceipt', '/invoice'));
app.get('/addinvoice', renderPage('addinvoice', '/invoice'));
app.get('/addreceipt', renderPage('addreceipt', '/invoice'));


//Action
app.post('/home', function (req, res) {
  const { username, password } = req.body;
    console.log(username);

  db.get('SELECT * FROM users WHERE phone = ?', [username], (err, row) => {
      if (err) {
        return res.status(500).send('Error fetching user');
      }
      if (row && row.password === password) {
          req.session.user = {
              id: row.id,
              username: row.phone,
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


app.post('/receipt-submit', (req, res) => {
  console.log('Receipt Submitted:', req.body);
  const { selectPayment, amount } = req.body;
  // insert ข้อมูลลง database ละ redirect กลับหน้า book room
  res.redirect('showreceipt');
});

// test
app.get('/test', renderPage('exportReciept'));

// Invoices
// app.get("/createinvoice", (req, res) => {
//   res.render('invoice', { role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass });
// });
// app.get('/showinvoice', (req, res) => {
//   res.render('showinvoice', { role: req.user.role, currentPath: '/createinvoice', sidebarClass: req.session.sidebarClass });
// });
// app.get('/showreceipt', (req, res) => {
//   res.render('showreceipt', { role: req.user.role, currentPath: '/createinvoice', sidebarClass: req.session.sidebarClass });
// });
// ต้องลองเอา database มา
// app.get('/addInvoice', (req, res) => {
//   res.render('addinvoice', { role: req.user.role, currentPath: '/createinvoice', sidebarClass: req.session.sidebarClass });
// });
// app.get('/addReceipt', (req, res) => {
//   res.render('addreceipt', { role: req.user.role, currentPath: '/createinvoice', sidebarClass: req.session.sidebarClass });
// });


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


app.post('/managefix', (req, res) => {
  console.log('Manage fix:', req.body);
  const { selectroom, extrapayment, description, fixStatus } = req.body;
  // Update ข้อมูลลง database ละ redirect กลับหน้า fixpage
  res.redirect('fixpage');
});


// Starting the server
app.listen(port, () => {
  console.log("Server started.");
});