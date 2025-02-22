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

app.get('/manageuser', (req, res) => {
  const query = 'SELECT * FROM users';
  db.all(query, (err, rows) => {
    if (err) {
      console.log(err.message);
    }
    // console.log(rows);
    res.render('manageuser', { data : rows, role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount });
  });
});


// app.get('/manageuser', renderPage('manageuser'));
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

app.get('/manageroom', (req, res) => {
  const query = 'SELECT * FROM rooms ORDER BY id;';
  db.all(query, (err, rows) => {
    if (err) {
      console.log(err.message);
    }
    console.log(rows);
    res.render('manageroom', { data : rows, role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount });
  });
});
// app.get('/manageroom', renderPage('manageroom'));


// app.get('/managemeter', renderPage('managemeter'));
app.get('/managemeter', function (req, res) {
  let sql = `SELECT elec_rate, water_rate FROM meters LIMIT 1;`;
  db.all(sql, (err, rows) => {
      if (err) {
        console.log(err.message);
      }
      console.log(rows);
      res.render('managemeter', { data : rows, role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount });
      // res.render('editroom', { data : rows });
    });
});


app.get('/editroom', function (req, res) {
  let sql = `SELECT * FROM rooms WHERE id = '${req.query.id}'`;
  db.all(sql, (err, rows) => {
      if (err) {
        console.log(err.message);
      }
      console.log(rows);
      res.render('editroom', { data : rows, role: req.user.role, currentPath: '/manageroom', sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount });
      // res.render('editroom', { data : rows });
    });
});

app.get('/edituser', function (req, res) {
  let sql = `SELECT * FROM users WHERE id = '${req.query.id}'`;
  db.all(sql, (err, rows) => {
      if (err) {
        console.log(err.message);
      }
      console.log(rows);
      res.render('edituser', { data : rows, role: req.user.role, currentPath: '/manageuser', sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount });
      // res.render('editroom', { data : rows });
    });
});
// app.get('/editroom', renderPage('editroom', '/manageroom'));


app.get('/bookroom', function (req, res) {
  let sql1 = `SELECT * FROM rooms WHERE status = 0 ORDER BY id;`;
  let sql2 = `SELECT id, CONCAT(fname, ' ', lname) AS fullname FROM users WHERE role = 2;`;
  db.all(sql1, (err1, rows1) => {
      if (err1) {
        console.log(err1.message);
      }
      console.log(rows1);
      db.all(sql2, (err2, rows2) => {
        if (err2) {
          console.log(err2.message);
        }
        res.render('bookroom', { data : rows1, user : rows2, role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount });
      });
    });
});
// app.get('/bookroom', renderPage('bookroom'));


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
      console.log(row.role);

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
  // console.log('Submitted Add User:', req.body);
  const { fname, lname, gender, idcard, phone, password } = req.body;
  // insert ข้อมูลลง database ละ redirect กลับหน้า manage user
  db.run('INSERT INTO users (fname, lname, sex, id_card, phone, password) VALUES (?, ?, ?, ?, ?, ?)', [fname, lname, gender, idcard, phone, password], (err) => {
    if (err) {
      return console.error(err.message);
    }
    res.redirect('manageuser');
  });
});

app.post('/edituser-submit/:id', (req, res) => {
  console.log('Submitted Edit user:', req.body);
  const userId = req.params.id;
  const { fname, lname, gender, idcard, phone, password } = req.body;
  // update ข้อมูลลง database ละ redirect กลับหน้า manage room
  const sql = `UPDATE users SET fname = ?, lname = ?, sex = ?, id_card = ?, phone = ?, password = ? WHERE id = ?`;
  
    db.run(sql, [fname, lname, gender, idcard, phone, password, userId], (err) => {
        if (err) {
            return console.error('Error modify data:', err.message);
        }
        console.log('User modified successful');
        res.redirect('/manageuser');
    });
});


app.post('/manageuser/delete/:id', (req, res) => {
  const userId = req.params.id;
  const query = 'DELETE FROM users WHERE id = ?';
  db.run(query, [userId], (err) => {
      if (err) {
          console.error(err.message);
          return res.status(500).send('Error deleting user');
      }
      console.log('User deleted.');
      res.redirect('/manageuser');
  });
});


// Manage Room
app.post('/addroom', (req, res) => {
  console.log('Submitted Add Room:', req.body);
  const { noroom, roomprice, roominfo } = req.body;
  // insert ข้อมูลลง database ละ redirect กลับหน้า manage room
  db.run('INSERT INTO rooms (id, rent, description) VALUES (?, ?, ?)', [noroom, roomprice, roominfo], (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Added room.')
    res.redirect('manageroom');
  });
});

app.post('/manageroom/delete/:id', (req, res) => {
  const roomId = req.params.id;
  const query = 'DELETE FROM rooms WHERE id = ?';
  db.run(query, [roomId], (err) => {
    if (err) {
        console.error(err.message);
        return res.status(500).send('Error deleting room');
    }
    console.log('Rooms deleted.');
    res.redirect('/manageroom');
});
})


app.post('/editroom-submit/:id', (req, res) => {
  console.log('Submitted Edit Room:', req.body);
  const roomId = req.params.id;
  const { noroom, roomprice, roominfo } = req.body;
  // update ข้อมูลลง database ละ redirect กลับหน้า manage room
  const sql = `UPDATE rooms SET id = ?, rent = ?, description = ? WHERE id = ?`;
  
    db.run(sql, [noroom, roomprice, roominfo, roomId], (err) => {
        if (err) {
            return console.error('Error modify data:', err.message);
        }
        console.log('Room modified successful');
        res.redirect('/manageroom');
    });
});


app.post('/bookroom-submit', (req, res) => {
  const { selectroom, selectuser, movein, checkout, invoice, duepayment } = req.body;
  // insert ข้อมูลลง database ละ redirect กลับหน้า book room
  // แปลงค่า date เป็น datetime
  const startDateTime = movein + ' 00:00:00';
  const endDateTime = checkout + ' 00:00:00';
  const invoiceDateTime = invoice + ' 00:00:00';
  const dueDateTime = duepayment + ' 00:00:00';

  db.serialize(() => {
    // ตรวจสอบว่ามีข้อมูลในตาราง meters หรือไม่
    db.get('SELECT water_unit, elec_unit FROM meters WHERE room_id = ? ORDER BY read_date DESC LIMIT 1', [selectroom], (err, row) => {
      if (err) {
        return console.error(err.message);
      }

      let water_amount = 0.0;
      let elec_amount = 0.0;

      if (row) {
        water_amount = row.water_unit;
        elec_amount = row.elec_unit;
      }

      // เพิ่มข้อมูลในตาราง tenants
      db.run('INSERT INTO tenants (user_id, room_id, status) VALUES (?, ?, ?)', [selectuser, selectroom, 1], (err) => {
        if (err) {
          return console.error(err.message);
        }

        // เพิ่มข้อมูลในตาราง booking
        db.run('INSERT INTO booking (room_id, user_id, start_date, end_date, bill_id) VALUES (?, ?, ?, ?, ?)', [selectroom, selectuser, startDateTime, endDateTime, null], (err) => {
          if (err) {
            return console.error(err.message);
          }

          // เพิ่มข้อมูลในตาราง meters
          db.run('INSERT INTO meters (room_id, water_unit, elec_unit, water_rate, elec_rate, read_date) VALUES (?, ?, ?, ?, ?, ?)', [selectroom, water_amount, elec_amount, 10.0, 5.0, startDateTime], function(err) {
            if (err) {
              return console.error(err.message);
            }

            const meter_id = this.lastID;

            // เพิ่มข้อมูลในตาราง bills
            db.run('INSERT INTO bills (user_id, room_id, meter_id, water_amount, elec_amount, total_amount, maintenance_id, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [selectuser, selectroom, meter_id, water_amount, elec_amount, water_amount + elec_amount, null, dueDateTime, 0], function(err) {
              if (err) {
                return console.error(err.message);
              }

              const bill_id = this.lastID;

              // อัปเดตค่า bill_id ในตาราง booking
              db.run('UPDATE booking SET bill_id = ? WHERE room_id = ? AND user_id = ?', [bill_id, selectroom, selectuser], (err) => {
                if (err) {
                  return console.error(err.message);
                }

                // อัปเดตสถานะห้องในตาราง rooms
                db.run('UPDATE rooms SET status = 1 WHERE id = ?', [selectroom], (err) => {
                  if (err) {
                    return console.error(err.message);
                  }
                  res.redirect('/bookroom');
                });
              });
            });
          });
        });
      });
    });
  });
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
  const sql = `UPDATE meters SET elec_rate = ?, water_rate = ?`;
  
    db.run(sql, [electricprice, waterprice], (err) => {
        if (err) {
            return console.error('Error modify data:', err.message);
        }
        console.log('Meter price modified successful');
        res.redirect('/managemeter');
    });
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