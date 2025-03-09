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
let db = new sqlite3.Database('HavenHub.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the database.');
    db.run('PRAGMA foreign_keys = ON;', (err) => {
      if (err) {
        console.error('Error enabling foreign keys:', err.message);
      } else {
        console.log('Foreign keys enabled.');
      }
    });
  }
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

function isAdmin(req, res, next) {
  if (req.user && req.user.role === 1) {
    return next();
  } else {
    res.status(403).send('Access denied');
  }
}

function isValidCardID(id) {
  const isValid = /^\d{13}$/.test(id);
  return isValid;
}

function isPhoneNumber(phone) {
  const phoneRegex = /^0\d{9}$/.test(phone);
  return phoneRegex;
}

//Middleware กำหนด user
app.use((req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
});

// Middleware กำหนด Notification badge
// app.use((req, res, next) => {
//   // เดะ Query จำนวนแถวแจ้งซ่อมที่ สถานะแจ้งเรื่อง ไปโชว์ตรง Notification
//   db.get('SELECT COUNT(*) AS count FROM users', (err, row) => {
//     if (err) {
//       return next(err);
//     }
//     // console.log(row.count)
//     res.locals.rowCount = row.count;
//     // res.locals.role = req.user.role;
//     res.locals.role = req.user ? req.user.role : 2;
//     res.locals.currentPath = req.path;
//     res.locals.sidebarClass = req.session.sidebarClass;
//     next();
//   });
// });
app.use((req, res, next) => {
  const role = req.user ? req.user.role : 2;
  const userId = req.user ? req.user.id : 0;
  let query;

  if (role === 1) {
    query = 'SELECT COUNT(*) FROM maintenance WHERE status < 2';
  } else if (role === 2) {
    query = `SELECT COUNT(*) FROM parcels
                  WHERE status = 0 AND room_id IN (
                  SELECT room_id FROM tenants
                  WHERE user_id = (SELECT id FROM users WHERE id = ${userId})
                );`;
  }

  db.get(query, (err, row) => {
    if (err) {
      return next(err);
    }
    res.locals.rowCount = row['COUNT(*)'];
    res.locals.role = role;
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
      rowCount: res.locals.rowCount,
      shake: false,
      err: ''
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

app.get('/manageuser', isAdmin, (req, res) => {
  // const query = "SELECT users.*, tenants.*, CONCAT(users.fname, ' ', users.lname) AS fullname FROM user LEFT JOIN tenants ON users.id = tenants.user_id";
  // const query = "SELECT *, CONCAT(users.fname, ' ', users.lname) AS fullname FROM users LEFT JOIN tenants ON users.id = tenants.user_id";
  const query = "SELECT *, CONCAT(users.fname, ' ', users.lname) AS fullname FROM users WHERE users.phone NOT IN ('admin', 'test')";
  db.all(query, (err, rows) => {
    if (err) {
      console.log(err.message);
    }
    console.log(rows);
    res.render('manageuser', { data: rows, role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount, shake: false });
  });
});


// app.get('/manageuser', renderPage('manageuser'));
// app.get('/graph', renderPage('graph'));

app.get('/graph', async (req, res) => {
  try {
    const getUsers = new Promise((resolve, reject) => {
      db.all('SELECT sex, COUNT(*) as count FROM users GROUP BY sex', [], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    const getRooms = new Promise((resolve, reject) => {
      db.all('SELECT status, COUNT(*) as count FROM rooms GROUP BY status', [], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    const [userStats, roomStats] = await Promise.all([getUsers, getRooms]);


    let maleUsers = 0, femaleUsers = 0, otherUsers = 0;
    let roomsAvailable = 0, roomsRented = 0;

    userStats.forEach(row => {
      if (row.sex === 'M') maleUsers = row.count;
      else if (row.sex === 'F') femaleUsers = row.count;
      else if (row.sex === 'O') otherUsers = row.count;
    });

    roomStats.forEach(row => {
      if (row.status === 0) roomsAvailable = row.count;
      else if (row.status === 1) roomsRented = row.count;
    });

    res.render('graph', {
      maleUsers,
      femaleUsers,
      otherUsers,
      roomsAvailable,
      roomsRented
    });

  } catch (error) {
    res.status(500).send('Error fetching data');
  }
});

app.get('/manageroom', isAdmin, (req, res) => {
  const query = 'SELECT * FROM rooms ORDER BY id;';
  db.all(query, (err, rows) => {
    if (err) {
      console.log(err.message);
    }
    console.log(rows);
    res.render('manageroom', { data: rows, role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount, shake: false });
  });
});
// app.get('/manageroom', renderPage('manageroom'));


// app.get('/managemeter', renderPage('managemeter'));
app.get('/managemeter', isAdmin, function (req, res) {
  let sql = `SELECT elec_rate, water_rate FROM rate LIMIT 1;`;
  let sql2 = `SELECT id FROM rooms`;
  db.all(sql, (err, rows) => {
    if (err) {
      console.log(err.message);
    }
    db.all(sql2, (err, rows2) => {
      if (err) {
        console.log(err.message);
      }
      // console.log(rows);
      res.render('managemeter', { data: rows, room: rows2, role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount });
    });
    // res.render('editroom', { data : rows });
  });
  // res.render('managemeter', {  role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount });
});

app.get('/get-latest-meter/:roomId', (req, res) => {
  const roomId = req.params.roomId;

  db.get('SELECT water_unit, elec_unit, strftime("%d-%m-%Y", read_date) AS get_date FROM meters WHERE room_id = ? ORDER BY read_date DESC LIMIT 1', [roomId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row) {
      res.json({
        water_unit: row.water_unit,
        elec_unit: row.elec_unit,
        water_date: row.get_date,
        elec_date: row.get_date
      });
    } else {
      res.json({
        water_unit: 0,
        elec_unit: 0,
        water_date: 'N/A',
        elec_date: 'N/A'
      });
    }
  });
});


app.get('/editroom', isAdmin, function (req, res) {
  let sql = `SELECT * FROM rooms WHERE id = '${req.query.id}'`;
  db.all(sql, (err, rows) => {
    if (err) {
      console.log(err.message);
    }
    console.log(rows);
    res.render('editroom', { data: rows, role: req.user.role, currentPath: '/manageroom', sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount });
    // res.render('editroom', { data : rows });
  });
});


app.get('/getBillInfo', function (req, res) {
  const roomId = req.query.room_id;

  if (!roomId) {
    return res.status(400).send('Room ID is required');
  }

  let sql = `
      SELECT 
          b.water_amount,
          b.elec_amount,
          b.total_amount,
          b.addon_cost,
          b.maintenance_cost,
          m.water_unit,
          m.elec_unit,
          b.billinfo
      FROM 
          bills b
      JOIN 
          meters m ON b.meter_id = m.id
      WHERE 
          b.room_id = ?;
  `;

  db.get(sql, [roomId], (err, row) => {
    if (err) {
      console.log(err.message);
      return res.status(500).send('Error querying the database');
    }

    if (row) {
      return res.json({
        water_unit: row.water_unit,
        elec_unit: row.elec_unit,
        billinfo: row.billinfo,
        water_amount: row.water_amount,
        elec_amount: row.elec_amount,
        total_amount: row.total_amount,
        addon_cost: row.addon_cost,
        maintenance_cost: row.maintenance_cost
      });
    } else {
      return res.status(404).send('Bill information not found');
    }
  });
});

// แก้ main.status = 2
app.get('/invoice', isAdmin, function (req, res) {
  let sql = `WITH maintenance_summary AS (
    SELECT 
        room_id,
        SUM(CASE WHEN status = 2 THEN cost ELSE 0 END) AS maintenance_cost_filtered,
        SUM(cost) AS maintenance_cost_total
    FROM maintenance
    GROUP BY room_id
)
SELECT 
    rooms.id AS room_id, 
    MAX(meters.id) AS meter_id,
    users.fname || ' ' || users.lname AS owner_name,
    users.id AS user_id,
    rooms.rent,
    COALESCE(ms.maintenance_cost_filtered, 0) AS maintenance_cost_filtered,
    COALESCE(ms.maintenance_cost_total, 0) AS maintenance_cost_total
FROM rooms
JOIN tenants ON rooms.id = tenants.room_id
JOIN users ON tenants.user_id = users.id
JOIN meters ON rooms.id = meters.room_id
LEFT JOIN maintenance_summary ms ON rooms.id = ms.room_id
WHERE rooms.status = 1
GROUP BY rooms.id, users.fname, users.lname, users.id, rooms.rent, ms.maintenance_cost_filtered, ms.maintenance_cost_total;

`;

  let sql2 = `SELECT * from bills`;


  db.all(sql, (err, rows) => {
    if (err) {
      console.log(err.message);
      return res.status(500).send('Error querying the database');
    }


    if (!rows || rows.length === 0) {
      return res.status(404).send('No data found');
    }


    db.all(sql2, (err, rows2) => {
      if (err) {
        console.log(err.message);
        return res.status(500).send('Error querying the database');
      }


      console.log(rows), console.log(rows2)
      res.render('invoice', {
        data: rows,
        bills: rows2,
        role: req.user.role,
        currentPath: '/invoice',
        sidebarClass: req.session.sidebarClass,
        rowCount: res.locals.rowCount
      });
    });
  });
});

// app.post('/insertbill', isAdmin, function (req, res) {

//   const { room_id, rent, meter_id, createDay, paidDay, user_id, cost_id } = req.body;

//   console.log(room_id, rent, meter_id, createDay, paidDay, user_id, cost_id);

//   const sql = `INSERT INTO bills (user_id, room_id, meter_id, created_at, due_date,maintenance_cost,water_amount,elec_amount,total_amount,status,addon_cost,addon_details)
// VALUES (?, ?, ?, ?, ?,?,0,0,0,0,0,0);`;
//   const params = [user_id, room_id, meter_id, createDay, paidDay, cost_id];

//   db.run(sql, params, function (err) {
//     if (err) {
//       console.log(err.message);
//       res.status(500).send('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
//       return;
//     }
//     res.redirect('/invoice');
//   });

// });

app.post('/insertbill', isAdmin, function (req, res) {
  const { room_id, rent, meter_id, createDay, paidDay, user_id, cost_id } = req.body;

  console.log(room_id, rent, meter_id, createDay, paidDay, user_id, cost_id);

  const sqlInsertBill = `
      INSERT INTO bills (user_id, room_id, meter_id, created_at, due_date, maintenance_cost, water_amount, elec_amount, total_amount, status, addon_cost, addon_details)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0);
  `;
  const paramsInsert = [user_id, room_id, meter_id, createDay, paidDay, cost_id];

  db.run(sqlInsertBill, paramsInsert, function (err) {
    if (err) {
      console.log("Error inserting bill:", err.message);
      return res.status(500).send('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }


    const sqlGetLatestBill = `SELECT id FROM bills WHERE room_id = ? ORDER BY id DESC LIMIT 1;`;

    db.get(sqlGetLatestBill, [room_id], function (err, row) {
      if (err) {
        console.log("Error fetching latest bill:", err.message);
        return res.status(500).send('เกิดข้อผิดพลาดในการดึงข้อมูลบิลล่าสุด');
      }

      if (!row) {
        return res.status(404).send('ไม่พบบิลล่าสุดสำหรับห้องนี้');
      }

      const latestBillId = row.id;


      const sqlUpdateBooking = `UPDATE booking SET bill_id = ? WHERE room_id = ?;`;

      db.run(sqlUpdateBooking, [latestBillId, room_id], function (err) {
        if (err) {
          console.log("Error updating booking:", err.message);
          return res.status(500).send('เกิดข้อผิดพลาดในการอัปเดต booking');
        }

        res.redirect('/invoice');
      });
    });
  });
});

app.get('/addinvoice', isAdmin, function (req, res) {
  let sql = `SELECT
    r.water_rate,
    r.elec_rate,
    m.water_unit,
    m.elec_unit,
    rm.rent,
    m.room_id,
    m.id AS meter_id,
    m.read_date,
    COALESCE(SUM(mn.cost), 0) AS maintenance_cost
FROM
    meters m
JOIN rate r ON r.id = m.rate_id
JOIN rooms rm ON m.room_id = rm.id
LEFT JOIN maintenance mn ON mn.room_id = m.room_id
    AND mn.status = 2
LEFT JOIN bills b ON b.room_id = m.room_id 
    AND b.id = (SELECT MAX(b2.id) FROM bills b2 WHERE b2.room_id = m.room_id)
WHERE
    m.id = (SELECT MAX(m2.id) FROM meters m2 WHERE m2.room_id = m.room_id)
    AND m.room_id = '${req.query.id}'
GROUP BY
    r.water_rate, r.elec_rate, m.water_unit, m.elec_unit, rm.rent, m.room_id, m.id, m.read_date
`;
  db.all(sql, (err, rows) => {
    if (err) {
      console.log(err.message);
    }
    console.log(rows);
    res.render('addinvoice', { data: rows, role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount });
  });
});

app.get('/addreceipt', isAdmin, function (req, res) {
  let sql = `SELECT
    r.water_rate,
    r.elec_rate,
    m.water_unit,
    m.elec_unit,
    rm.rent,  -- เพิ่มค่าเช่าห้อง
    m.room_id,
    m.id AS meter_id,
    m.read_date,
    COALESCE(SUM(mn.cost), 0) AS maintenance_cost,
    b.addon_cost AS addon_cost,
    b.id as bill_id,
    b.addon_details as addon_details,
    COALESCE(b.total_amount, 0) AS total_amount  -- ดึง total_amount จากตาราง bills
FROM
    meters m
JOIN rate r ON r.id = m.rate_id
JOIN rooms rm ON m.room_id = rm.id
LEFT JOIN maintenance mn ON mn.room_id = m.room_id
    AND mn.status = 2  -- ใช้ข้อมูลที่ status ไม่เท่ากับ 3
LEFT JOIN bills b ON b.room_id = m.room_id 
    AND b.id = (SELECT MAX(b2.id) FROM bills b2 WHERE b2.room_id = m.room_id)  -- ดึงข้อมูล bill ล่าสุด
WHERE
    m.id = (SELECT MAX(m2.id) FROM meters m2 WHERE m2.room_id = m.room_id)
    AND m.room_id = '${req.query.id}'
GROUP BY
    r.water_rate, r.elec_rate, m.water_unit, m.elec_unit, rm.rent, m.room_id, m.id, m.read_date, b.total_amount
`;
  db.all(sql, (err, rows) => {
    if (err) {
      console.log(err.message);
    }
    console.log(rows);
    res.render('addreceipt', { data: rows, role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount });
  });
});

app.get('/exportInvoice', isAdmin, function (req, res) {
  let sql = `SELECT DISTINCT u.fname, u.lname, b.*, m.elec_unit, m.water_unit, r.elec_rate, r.water_rate, rm.rent,
       b.maintenance_cost / 2 AS maintenance_cost_half
FROM bills b
JOIN users u ON b.user_id = u.id
JOIN meters m ON b.room_id = m.room_id
JOIN rate r ON m.rate_id = r.id
JOIN rooms rm ON b.room_id = rm.id  -- Get rent from rooms
WHERE b.id = '${req.query.id}'
AND m.id = (
    SELECT MAX(id)
    FROM meters
    WHERE room_id = b.room_id
);
`


  db.all(sql, (err, rows) => {
    if (err) {
      console.log(err.message);
    }
    console.log(rows);
    res.render('exportInvoice', { data: rows, role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount });
  });
});

app.get('/exportReceipt', isAdmin, function (req, res) {
  let sql = `SELECT DISTINCT u.fname, u.lname, b.*, m.elec_unit, m.water_unit, r.elec_rate, r.water_rate, rm.rent,
       b.maintenance_cost / 2 AS maintenance_cost_half
FROM bills b
JOIN users u ON b.user_id = u.id
JOIN meters m ON b.room_id = m.room_id
JOIN rate r ON m.rate_id = r.id
JOIN rooms rm ON b.room_id = rm.id  -- Get rent from rooms
WHERE b.id = '${req.query.id}'
AND m.id = (
    SELECT MAX(id)
    FROM meters
    WHERE room_id = b.room_id
);`


  db.all(sql, (err, rows) => {
    if (err) {
      console.log(err.message);
    }
    console.log(rows);
    res.render('exportReciept', { data: rows, role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount });
  });
});

app.post('/insertBill/:id', (req, res) => {
  const roomId = req.params.id;
  const { water_amount, elec_amount, rent_amount, maintenance_amount, total_amount, extraID, numExtra } = req.body;
  // Log ค่าที่ได้รับจากฟอร์ม
  const pkq = `SELECT id 
              FROM bills 
              WHERE room_id = '${roomId}' 
              ORDER BY id DESC 
              LIMIT 1;`;

  console.log('Received data:', {
    roomId,
    water_amount,
    elec_amount,
    rent_amount,
    maintenance_amount,
    extraID,
    total_amount,
    numExtra
  });

  const sql = `
    UPDATE bills
    SET 
      water_amount = ?, 
      elec_amount = ?, 
      total_amount = ?,  
      addon_cost = ?,
      addon_details = ?,
      status = 1
    WHERE id = ?
  `;

  const values = [water_amount, elec_amount, rent_amount, extraID, total_amount, roomId, numExtra];


  console.log('SQL Query:', sql);
  console.log('Values to update:', values);

  db.all(pkq, (err, rows1) => {
    if (err) {
      console.error('Error updating data:', err.message);
    }
    const billId = rows1[0].id;
    console.log(rows1);
    db.run(sql, [water_amount, elec_amount, total_amount, numExtra, extraID, billId], (err) => {
      if (err) {
        console.error('Error updating data:', err.message);
        return res.status(500).send('Error updating data');
      }
      console.log('Bill updated successfully');
      res.redirect('/showinvoice');
    });
  });
});





app.post('/insertPayment/:id', (req, res) => {
  const roomId = req.params.id;
  const { selectPayment } = req.body;
  const { bill_id } = req.body;
  console.log(selectPayment, bill_id);

  if (!selectPayment) {
    return res.status(400).send('Payment method is required');
  }

  db.serialize(() => {
    const sqlInsert = `
      INSERT INTO payments (bill_id, method, paid_date)
      SELECT ?, ?, CURRENT_TIMESTAMP
      FROM bills
      WHERE room_id = ?
      ORDER BY created_at DESC LIMIT 1;
    `;

    db.run(sqlInsert, [bill_id, selectPayment, roomId], function (err) {
      if (err) {
        console.error('Error inserting payment:', err.message);
        return res.status(500).send('Error inserting payment');
      }
      console.log('Payment inserted successfully');

      const sqlUpdateBill = `
        UPDATE bills
        SET status = 2
        WHERE room_id = ? AND id = (
          SELECT id FROM bills WHERE room_id = ? AND status IN (0, 1) ORDER BY created_at DESC LIMIT 1
        );
      `;

      db.run(sqlUpdateBill, [roomId, roomId], function (err) {
        if (err) {
          console.error('Error updating bill status:', err.message);
          return res.status(500).send('Error updating bill status');
        }

        console.log('Bill status updated to 2');

        // อัปเดตสถานะของ maintenance เป็น 3
        const sqlUpdateMaintenance = `
          UPDATE maintenance
          SET status = 3
          WHERE room_id = ? and status = 2;
        `;

        db.run(sqlUpdateMaintenance, [roomId], function (err) {
          if (err) {
            console.error('Error updating maintenance status:', err.message);
            return res.status(500).send('Error updating maintenance status');
          }

          console.log('Maintenance status updated to 3');
          res.redirect('/showreceipt');
        });
      });
    });
  });
});



app.get('/showinvoice', isAdmin, function (req, res) {
  let sql = `SELECT u.fname, u.lname, b.*
FROM bills b
JOIN users u ON b.user_id = u.id
WHERE b.status >= 1;

;
`;
  db.all(sql, (err, rows) => {
    if (err) {
      console.log(err.message);
    }
    console.log(rows);
    res.render('showinvoice', { data: rows, role: req.user.role, currentPath: 'req.path', sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount });
  });
});

app.get('/showreceipt', isAdmin, function (req, res) {
  let sql = `SELECT u.fname, u.lname, b.*
FROM bills b
JOIN users u ON b.user_id = u.id
WHERE b.status = 2;
`;
  db.all(sql, (err, rows) => {
    if (err) {
      console.log(err.message);
    }
    console.log(rows);
    res.render('showreceipt', { data: rows, role: req.user.role, currentPath: 'req.path', sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount });
  });
});
app.get('/edituser', isAdmin, function (req, res) {
  let sql = `SELECT * FROM users WHERE id = '${req.query.id}'`;
  db.all(sql, (err, rows) => {
    if (err) {
      console.log(err.message);
    }
    console.log(rows);
    res.render('edituser', { data: rows, role: req.user.role, currentPath: '/manageuser', sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount, shake: false, err: '' });
    // res.render('editroom', { data : rows });
  });
});
// app.get('/editroom', renderPage('editroom', '/manageroom'));


app.get('/bookroom', isAdmin, function (req, res) {
  let sql1 = `SELECT * FROM rooms WHERE status = 0 ORDER BY id;`;
  // let sql2 = `SELECT id, CONCAT(fname, ' ', lname) AS fullname FROM users WHERE role = 2;`;
  // let sql2 = `SELECT id, CONCAT(fname, ' ', lname) AS fullname FROM users LEFT JOIN tenants ON users.id = tenants.user_id WHERE users.role = 2 AND tenants.user_id IS NULL`;
  let sql2 = `SELECT id, CONCAT(fname, ' ', lname) AS fullname FROM users WHERE users.role = 2 AND users.id NOT IN (SELECT user_id FROM tenants);`;
  db.all(sql1, (err1, rows1) => {
    if (err1) {
      console.log(err1.message);
    }
    console.log(rows1);
    db.all(sql2, (err2, rows2) => {
      if (err2) {
        console.log(err2.message);
      }
      res.render('bookroom', { data: rows1, user: rows2, role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount });
    });
  });
});
// app.get('/bookroom', renderPage('bookroom'));


app.get('/adduser', isAdmin, renderPage('adduser', '/manageuser'));
// app.get('/fixpage', isAdmin, renderPage('fixpage'));
// InvoicePage
// app.get('/invoice', isAdmin, renderPage('invoice'));
// app.get('/showinvoice', isAdmin, renderPage('showinvoice', '/invoice'));
// app.get('/showreceipt', isAdmin, renderPage('showreceipt', '/invoice'));
// app.get('/addinvoice', isAdmin, renderPage('addinvoice', '/invoice'));
// app.get('/addreceipt', isAdmin, renderPage('addreceipt', '/invoice'));


app.get('/repairs', function (req, res) {
  const userRole = req.session.user.role;
  if (userRole == 1) {
    let sql = `SELECT * FROM maintenance WHERE status < 2`;
    let sql2 = `SELECT * FROM maintenance WHERE status = 2 or status = 3`;
    db.all(sql, (err, rows) => {
      if (err) {
        console.log(err.message);
      }
      db.all(sql2, (err, rows2) => {
        if (err) {
          console.log(err.message);
        }
        res.render('fixpage', { data: rows, data3: rows2, role: req.user.role, currentPath: '/fixpage', sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount });
      });
      // res.render('editroom', { data : rows });
    });
    // res.render('fixpage', { role: req.user.role, currentPath: '/fixpage', sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount });
  } else {
    res.redirect('parcel');
  }
});


app.get('/parcelpage', isAdmin, function (req, res) {
  let sql1 = `SELECT * FROM parcels`;
  let sql2 = `SELECT id FROM rooms`;
  db.all(sql1, (err1, rows1) => {
    if (err1) {
      console.log(err1.message);
    }
    console.log(rows1);
    db.all(sql2, (err2, rows2) => {
      if (err2) {
        console.log(err2.message);
      }
      res.render('parcelpage', { data: rows1, room: rows2, role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount });
    });
  });
});
// app.get('/parcelpage', renderPage('parcelpage'));


//Action
app.post('/welcome', function (req, res) {
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
        res.redirect("/home");
      } else if (row.role === 1) {
        console.log('login successful');
        res.redirect("/admin");
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
  const query = 'SELECT * FROM users;';
  db.all(query, (err, rows) => {
    if (err) {
      console.log(err.message);
    }
    else if(isValidCardID(idcard) == false){
      res.render('adduser', {shake: true, err: 'หมายเลขบัตรประชาชนไม่ถูกต้อง'});
    }
    else if(isPhoneNumber(phone) == false){
      res.render('adduser', {shake: true, err: 'เบอร์โทรศัพท์ไม่ถูกต้อง'});
    }
    else if(rows.some(row => (row.phone == phone || row.id_card == idcard))){
      res.render('adduser', {shake: true, err: 'มีผู้ใช้นี้แล้ว'});
    }
    else{
      db.run('INSERT INTO users (fname, lname, sex, id_card, phone, password) VALUES (?, ?, ?, ?, ?, ?)', [fname, lname, gender, idcard, phone, password], (err) => {
        if (err) {
          return console.error(err.message);
        }
        res.redirect('manageuser');
      });
    }
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
  const query = 'SELECT * FROM rooms;';
  db.all(query, (err, rows) => {
    if (err) {
      console.log(err.message);
    }
    else if(rows.some(row => row.id == noroom)){
      res.render('manageroom', { data: rows, role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount, shake: true });
    }
    else{
      db.run('INSERT INTO rooms (id, rent, description) VALUES (?, ?, ?)', [noroom, roomprice, roominfo], (err) => {
        if (err) {
          return console.error(err.message);
        }
        console.log('Added room.')
        res.redirect('manageroom');
      });
    }
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
  const startDateTime = `${movein} 00:00:00`;
  const endDateTime = `${checkout} 00:00:00`;
  const invoiceDateTime = `${invoice} 00:00:00`;
  const dueDateTime = `${duepayment} 00:00:00`;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.get('SELECT water_unit, elec_unit FROM meters WHERE room_id = ? ORDER BY read_date DESC LIMIT 1', [selectroom], (err, row) => {
      if (err) {
        db.run('ROLLBACK');
        return console.error(err.message);
      }

      const water_amount = row ? row.water_unit : 0.0;
      const elec_amount = row ? row.elec_unit : 0.0;

      db.get('SELECT water_rate, elec_rate FROM rate WHERE id = 1', (err, rateRow) => {
        if (err) {
          db.run('ROLLBACK');
          return console.error(err.message);
        }

        const water_rate = rateRow.water_rate;
        const elec_rate = rateRow.elec_rate;

        db.run('INSERT INTO tenants (user_id, room_id, status) VALUES (?, ?, ?)', [selectuser, selectroom, 1], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return console.error(err.message);
          }

          db.run('INSERT INTO booking (room_id, user_id, start_date, end_date, bill_id) VALUES (?, ?, ?, ?, ?)', [selectroom, selectuser, startDateTime, endDateTime, null], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return console.error(err.message);
            }

            db.run('INSERT INTO meters (room_id, water_unit, elec_unit, rate_id, read_date) VALUES (?, ?, ?, ?, ?)', [selectroom, water_amount, elec_amount, 1, startDateTime], function (err) {
              if (err) {
                db.run('ROLLBACK');
                return console.error(err.message);
              }

              const meter_id = this.lastID;

              // db.run('INSERT INTO bills (user_id, room_id, meter_id, water_amount, elec_amount, total_amount, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [selectuser, selectroom, meter_id, 0, 0, 0, dueDateTime, 0], function (err) {
              //   if (err) {
              //     db.run('ROLLBACK');
              //     return console.error(err.message);
              //   }

              //   const bill_id = this.lastID;

              // db.run('UPDATE booking SET bill_id = ? WHERE room_id = ? AND user_id = ?', [bill_id, selectroom, selectuser], (err) => {
              //   if (err) {
              //     db.run('ROLLBACK');
              //     return console.error(err.message);
              //   }

              db.run('UPDATE rooms SET status = 1 WHERE id = ?', [selectroom], (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return console.error(err.message);
                }

                db.run('COMMIT');
                res.redirect('/bookroom');
              });
              // });
              // });
            });
          });
        });
      });
    });
  });
});


// app.post('/receipt-submit', (req, res) => {
//   console.log('Receipt Submitted:', req.body);
//   const { selectPayment, amount } = req.body;
//   // insert ข้อมูลลง database ละ redirect กลับหน้า showreceipt
//   res.redirect('showreceipt');
// });


app.post('/notifyparcel', (req, res) => {
  console.log('Parcel Sent:', req.body);
  const { room_id, receiver_name, size } = req.body;
  // insert ข้อมูลลง database ละ redirect กลับหน้า parcelpage
  db.run('INSERT INTO parcels (room_id, receiver_name, size) VALUES (?, ?, ?)', [room_id, receiver_name, size], (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Added parcel.')
    res.redirect('/parcelpage');
  });
});

// test
// app.get('/test', renderPage('exportReciept'));

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
  db.run('INSERT INTO meters (room_id, water_unit, elec_unit, rate_id) VALUES (?, ?, ?, ?)', [selectroom, watermeter, electricmeter, 1], (err) => {
    if (err) {
      return console.error(err.message);
    }
    res.redirect('managemeter');
  });
});
app.post('/editprice', (req, res) => {
  console.log('Edit Elec/Water Price:', req.body);
  const { electricprice, waterprice } = req.body;
  // Update ข้อมูลลง database ละ redirect กลับหน้า manage meter
  const sql = `UPDATE rate SET elec_rate = ?, water_rate = ?`;

  db.run(sql, [electricprice, waterprice], (err) => {
    if (err) {
      return console.error('Error modify data:', err.message);
    }
    console.log('Rate price modified successful');
    res.redirect('/managemeter');
  });
});


app.post('/managefix', (req, res) => {
  console.log('Manage fix:', req.body);
  const { id, cost, description, fixStatus } = req.body;
  // Update ข้อมูลลง database ละ redirect กลับหน้า fixpage
  const sql = `UPDATE maintenance SET status = ?, cost = ? WHERE id = ?`;

  db.run(sql, [fixStatus, cost, id], (err) => {
    if (err) {
      return console.error('Error modify data:', err.message);
    }
    console.log('Request repair modified successful');
    res.redirect('repairs');
  });
});


app.post('/getuserdetails', (req, res) => {
  const userId = req.body.id;
  // const query = 'SELECT * FROM tenants RIGHT JOIN users ON users.id = tenants.user_id WHERE users.id = ?';
  const query = `
    SELECT users.*, GROUP_CONCAT(tenants.room_id) AS room_ids
    FROM users
    LEFT JOIN tenants ON users.id = tenants.user_id
    WHERE users.id = ?
    GROUP BY users.id
  `;
  db.get(query, [userId], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Error retrieving user details');
    }
    res.json(row);
  });
});

app.get('/testquery', (req, res) => {
  const userId = req.session.user.id;
  const query = `SELECT * FROM tenants RIGHT JOIN users ON users.id = tenants.user_id WHERE users.id = ${userId}`
  // const query = 'SELECT * FROM tenants RIGHT JOIN users ON users.id = tenants.user_id ';
  db.all(query, (err, rows) => {
    if (err) {
      console.log(err.message);
    }
    console.log(rows);
    res.send(JSON.stringify(rows));
  });
});

// test
app.get('/count-parcels', (req, res) => {
  const query = `
      SELECT 
          DATE(arrival_date) AS arrival_day,
          SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS received_count,
          SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) AS not_received_count
      FROM parcels
      GROUP BY arrival_day
      ORDER BY arrival_day;
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      throw err;
    }
    res.json(rows);
  });
});


// NORMAL USER ROUTING
app.get('/parcel', function (req, res) {
  const userId = req.session.user.id;
  // const query = 'SELECT * FROM parcels WHERE;';
  const query1 = `SELECT * FROM parcels
                  WHERE status = 0 AND room_id IN (
                  SELECT room_id FROM tenants
                  WHERE user_id = (SELECT id FROM users WHERE id = ${userId})
                );`;
  const query2 = `SELECT * FROM parcels
                  WHERE status = 1 AND room_id IN (
                  SELECT room_id FROM tenants
                  WHERE user_id = (SELECT id FROM users WHERE id = ${userId})
                ) ORDER BY receive_date DESC;`;
  const query3 = `SELECT room_id FROM tenants WHERE user_id = ${userId} `
  db.all(query1, (err, rows1) => {
    if (err) {
      console.log(err.message);
    }
    db.all(query2, (err, rows2) => {
      if (err) {
        console.log(err.message);
      }
      db.all(query3, (err, rows3) => {
        if (err) {
          console.log(err.message);
        }
        res.render('parcel', { data1: rows1, data2: rows2, data3: rows3, role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount });
      });
    });
  });
});
// app.get('/parcel', function (req, res) {
//   const userId = req.session.user.id;

//   const query1 = `SELECT parcels.*, tenants.room_id FROM parcels
//                   LEFT JOIN tenants ON parcels.room_id = tenants.room_id
//                   LEFT JOIN users ON tenants.user_id = users.id
//                   WHERE parcels.status = 0 AND (users.id = ${userId} OR tenants.user_id IS NULL);`;

//   const query2 = `SELECT parcels.*, tenants.room_id FROM parcels
//                   LEFT JOIN tenants ON parcels.room_id = tenants.room_id
//                   LEFT JOIN users ON tenants.user_id = users.id
//                   WHERE parcels.status = 1 AND (users.id = ${userId} OR tenants.user_id IS NULL);`;

//   db.all(query1, (err, rows1) => {
//     if (err) {
//       console.log(err.message);
//     }
//     db.all(query2, (err, rows2) => {
//       if (err) {
//         console.log(err.message);
//       }
//       console.log(rows2);
//       res.render('parcel', { data1: rows1, data2: rows2, role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount });
//     });
//   });
// });

app.post('/accept-parcel/:id', (req, res) => {
  const parcelId = req.params.id;
  console.log(parcelId);
  const query = `UPDATE parcels SET status = 1, receive_date = CURRENT_TIMESTAMP WHERE id = ?`;
  db.run(query, [parcelId], (err) => {
    if (err) {
      return console.error('Error modify data:', err.message);
    }
    console.log('Parcel update successful');
    res.redirect('/parcel');
  });
});

// app.get('/some-route', function (req, res) {
//   const userId = req.session.user.id;
//   console.log('User ID:', userId);
//   res.send('User ID is ' + userId);
// });

app.get('/api/item/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT detail, cost, status FROM maintenance WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).send('Error fetching item');
    }
    res.json(row);
  });
});

app.get('/repair', function (req, res) {
  const userId = req.session.user.id;
  const query = `SELECT room_id FROM tenants WHERE user_id = ${userId} `
  const query2 = `SELECT maintenance.*
                FROM maintenance
                JOIN tenants ON maintenance.room_id = tenants.room_id
                JOIN users ON tenants.user_id = users.id
                WHERE users.id = ${userId};`;
  db.all(query, (err, rows1) => {
    if (err) {
      console.log(err.message);
    }
    db.all(query2, (err, rows2) => {
      if (err) {
        console.log(err.message);
      }
      console.log(rows1);
      res.render('repair', { room: rows1, data: rows2, role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount });
    });
  });
});

app.post('/request-repair', (req, res) => {
  const { room_id, type, detail } = req.body;
  db.run('INSERT INTO maintenance (room_id, type, detail) VALUES (?, ?, ?)', [room_id, type, detail], (err) => {
    if (err) {
      return console.error(err.message);
    }
    res.redirect('repair');
  });
});

app.get('/home', function (req, res) {
  const userId = req.session.user.id;
  sql_user = `SELECT users.*, 
    booking.room_id AS room_id,
    bills.status AS bill_status,
    count(parcels.id) AS parcel_count 
    FROM users
    LEFT JOIN booking ON users.id = booking.user_id
    LEFT JOIN parcels ON booking.room_id = parcels.room_id
    LEFT JOIN bills ON booking.bill_id = bills.id
    WHERE users.id = ${userId} AND (parcels.status = 0 OR parcels.id is null)`;
  db.all(sql_user, (err, rows_user) => {
    console.log(rows_user);
    if (err) {
      return console.error(err.message);
    }
    sql_maintenance = `SELECT * FROM maintenance WHERE room_id = '${rows_user[0].room_id}' AND (status = 0 OR status = 1)`;
    db.all(sql_maintenance, (err, rows_maintenance) => {
      if (err) {
        return console.error(err.message);
      }
      sql_bill = `SELECT * FROM bills WHERE user_id = '${rows_user[0].id}' AND status = 2`;
      db.all(sql_bill, (err, rows_bill) => {
        if (err) {
          return console.error(err.message);
        }
        res.render('home', { data: rows_user, maintenance: rows_maintenance, bill: rows_bill });
      });
    });
  });
});

// app.get('/admin', function (req, res) {
// const userId = req.session.user.id;
// const currentTime = new Date();
// const currentDate = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()).padStart(2, '0')} `;
// const yesterDate = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()-1).padStart(2, '0')} `;
//   db.all(`SELECT * FROM users WHERE id = ${userId} AND role = 1`, (err, rows_admin) => {
//     if (err) {
//       return console.error(err.message);
//     }
//     db.all("SELECT * FROM rooms", (err, rows_room) => {
//       if (err) {
//         return console.error(err.message);
//       }
//       const availableRooms = rows_room.filter(room => room.status === 0).length;
//       const occupiedRooms = rows_room.filter(room => room.status === 1).length;
//       db.all(`SELECT booking.*, bills.created_at FROM booking 
//         LEFT JOIN bills ON booking.bill_id = bills.id`, (err, rows_bill) => {
//           if (err) {
//           return console.error(err.message);
//         }
//         db.all(`SELECT * FROM bills
//           WHERE status != 3`, (err, rows_notyet) => {
//             if (err) {
//             return console.error(err.message);
//           }
//           console.log(rows_notyet);
//           db.all(`SELECT * FROM booking 
//             LEFT JOIN users ON users.id = booking.user_id
//             WHERE booking.start_date LIKE '${currentDate}%' `, (err, rows_user_checkin) => {
//               if (err) {
//               return console.error(err.message);
//             }
//             db.all(`SELECT * FROM booking 
//               LEFT JOIN users ON users.id = booking.user_id
//               WHERE booking.end_date LIKE '${currentDate}%' `, (err, rows_user_checkout) => {
//                 if (err) {
//                 return console.error(err.message);
//               }
//               db.all(`SELECT * FROM bills 
//                 WHERE (status = 0) AND due_date < '${yesterDate}' `, (err, rows_overdue) => {
//                   if (err) {
//                   return console.error(err.message);
//                 }
//                 res.render('admin', { data: rows_admin, bill: rows_bill, notyet: rows_notyet, checkin: rows_user_checkin, checkout: rows_user_checkout, overdue: rows_overdue, availableRooms, occupiedRooms, currentDate, currentTime });
//               });
//             });
//           });
//         });
//       });
//     });  
//   });
// });

app.get('/admin', function (req, res) {
  const userId = req.session.user.id;
  const currentTime = new Date();
  const currentDate = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()).padStart(2, '0')} `;
  const yesterDate = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate() - 1).padStart(2, '0')} `;

  db.all("SELECT * FROM users WHERE id = ? AND role = 1", [userId], (err, rows_admin) => {
    if (err) return console.error(err.message);

    db.all("SELECT * FROM rooms", (err, rows_room) => {
      if (err) return console.error(err.message);

      const availableRooms = rows_room.filter(room => room.status === 0).length;
      const occupiedRooms = rows_room.filter(room => room.status === 1).length;

      db.all(`SELECT booking.*, bills.created_at FROM booking 
              LEFT JOIN bills ON booking.bill_id = bills.id`, (err, rows_bill) => {
        if (err) return console.error(err.message);

        db.all("SELECT * FROM bills WHERE status = 1", (err, rows_notyet) => {
          if (err) return console.error(err.message);

          db.all(`SELECT * FROM booking 
                  LEFT JOIN users ON users.id = booking.user_id
                  WHERE booking.start_date LIKE '${currentDate}%' `, (err, rows_user_checkin) => {
            if (err) return console.error(err.message);

            db.all(`SELECT * FROM booking 
                    LEFT JOIN users ON users.id = booking.user_id
                    WHERE booking.end_date LIKE '${currentDate}%' `, (err, rows_user_checkout) => {
              if (err) return console.error(err.message);

              db.all(`SELECT * FROM bills 
                      WHERE (status = 1) AND due_date < '${yesterDate}' `, (err, rows_overdue) => {
                if (err) return console.error(err.message);

                db.all("SELECT sex, COUNT(*) as count FROM users WHERE users.role = 2 GROUP BY sex ", (err, rows_sex) => {
                  if (err) return console.error(err.message);

                  console.log("time: ", currentTime);

                  res.render('admin', {
                    data: rows_admin,
                    bill: rows_bill,
                    notyet: rows_notyet,
                    checkin: rows_user_checkin,
                    checkout: rows_user_checkout,
                    overdue: rows_overdue,
                    availableRooms,
                    occupiedRooms,
                    currentDate,
                    currentTime,
                    sexData: rows_sex,
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

app.get('/meter', function (req, res) {
  // res.render('meter');
  const userId = req.session.user.id;
  // const query = `SESELECT water_unit, elec_unit, strftime("%d-%m-%Y", read_date) AS read_date FROM meters WHERE room_id = ? ORDER BY read_date DESC LIMIT 1 `
  const sql = `SELECT room_id FROM tenants WHERE user_id = ${userId} `;
  const sql2 = `SELECT water_rate, elec_rate FROM rate LIMIT 1`;
  db.all(sql, (err, rows1) => {
    if (err) {
      console.log(err.message);
    }
    db.all(sql2, (err, rows2) => {
      if (err) {
        console.log(err.message);
      }
      res.render('meter', { room: rows1, data: rows2, role: req.user.role, currentPath: req.path, sidebarClass: req.session.sidebarClass, rowCount: res.locals.rowCount });
    });
  });
});

app.post('/manageroom/removerenter/:id', (req, res) => {
  const roomId = req.params.id;
  const { moveOutDate, note, returnDeposit, depositAmount } = req.body;

  console.log('กำลังย้ายผู้เช่าออกจากห้อง:', roomId);
  console.log('ข้อมูลการย้ายออก:', { moveOutDate, note, returnDeposit, depositAmount });

  // ทำ transaction เพื่อให้แน่ใจว่าการอัพเดตทุกตารางทำงานพร้อมกัน
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // 1. อัพเดตสถานะห้องเป็นว่าง
    db.run('UPDATE rooms SET status = 0 WHERE id = ?', [roomId], function (err) {
      if (err) {
        console.error('เกิดข้อผิดพลาดในการอัพเดตสถานะห้องพัก:', err.message);
        db.run('ROLLBACK');
        return res.status(500).send('เกิดข้อผิดพลาดในการอัพเดตสถานะห้องพัก');
      }

      console.log('อัพเดตสถานะห้องพักเป็นว่างสำเร็จ');

      // 2. อัพเดตตาราง booking ให้มี end_date เป็นวันที่ย้ายออก
      db.run('UPDATE booking SET end_date = ? WHERE room_id = ? AND end_date IS NULL', [moveOutDate, roomId], function (err) {
        if (err) {
          console.error('เกิดข้อผิดพลาดในการอัพเดต booking:', err.message);
          db.run('ROLLBACK');
          return res.status(500).send('เกิดข้อผิดพลาดในการอัพเดต booking');
        }

        // 3. ลบข้อมูลผู้เช่าออกจากตาราง tenants
        db.run('DELETE FROM tenants WHERE room_id = ?', [roomId], function (err) {
          if (err) {
            console.error('เกิดข้อผิดพลาดในการลบข้อมูลผู้เช่า:', err.message);
            db.run('ROLLBACK');
            return res.status(500).send('เกิดข้อผิดพลาดในการลบข้อมูลผู้เช่า');
          }

          console.log('ลบข้อมูลผู้เช่าสำเร็จ');
          // ทำ Commit เมื่อทุกอย่างเสร็จสมบูรณ์
          db.run('COMMIT');
          res.redirect('/manageroom');
        });
      });
    });
  });
});

// Starting the server
app.listen(port, () => {
  console.log("Server started.");
});
