const express = require("express");
const crypto = require("crypto");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const mysql = require("mariadb");
const jwt = require("express-jwt");
const jsonwebtoken = require("jsonwebtoken");
const cors = require("cors");
const multer = require("multer");
const mime = require("mime");
const path = require("path");
const fs = require("fs");
const util = require("util");
const sharp = require("sharp");
const readFile = util.promisify(fs.readFile);
const axios = require("axios");
const https = require("https");
const fetch = require("node-fetch");
const app = express();

let jamTutup = 22;
// const redisStore = require("redis").createClient();

// redisStore.connect();
// Install middleware
app.use(cookieParser());
/* app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: false }));
app.use(
  cors({
    credentials: true,
  })
);
const dbConf = require("./dbConfig.json");
const { response } = require("express");
// const { date } = require('quasar')
// const { send } = require('process')
// const { promises } = require('dns')

const dbuse = mysql.createPool(dbConf.cfg1);

// upload poto
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "www/statics/photo");
  },
  filename: function (req, file, cb) {
    //      let customFileName = crypto.randomBytes(18).toString('hex')
    // get file extension from original file name
    //      let fileExtension = path.extname(file.originalname).split('.')[1];
    cb(null, req.user.dtAkun.akun + ".png");
  },
});

const storageProduk = multer.diskStorage({
  destination: function (req, file, cb) {
    // console.log(req)
    cb(null, path.join(__dirname, "www/statics"));
  },
  filename: function (req, file, cb) {
    // console.log(req)
    console.log(file);
    cb(
      null,
      `${req.user.dtAkun.kodeCab}__${new Date().getTime()}.${
        file.originalname.split(".")[1]
      }`
    );
  },
});

const unggahProduk = multer({ storage: storageProduk });
//  const unggah =  multer({ dest:'./src/unggah', limits: { fileSize: 200000 }, })
const unggah = multer({ storage: storage });
const storageSket = multer.diskStorage({
  destination: function (req, file, cb) {
    // console.log(req)
    cb(null, path.join(__dirname, "/sketsa"));
  },
  filename: function (req, file, cb) {
    // console.log(req)
    cb(null, file.originalname);
  },
});
const unggahSket = multer({ storage: storageSket });

const storageAkunting = multer.diskStorage({
  destination: function (req, file, cb) {
    // console.log(req)
    cb(null, path.join(__dirname, "/buktiAkunting"));
  } /* ,
  filename: function (req, file, cb) {
    // console.log(req)
    console.log(file)
    cb(null, `${req.user.dtAkun[0].NPSN}__${new Date().getTime()}.${file.originalname.split('.')[1]}`)
  } */,
});
const uploadAkunting = multer({ storage: storageAkunting });
// async function hore() {
//   // await rrd.connect()
//   // console.log("hore ", await redisStore.get("jamTutup"));
// }
const storageBukti = multer.diskStorage({
  destination: function (req, file, cb) {
    // console.log(req)
    cb(null, path.join(__dirname, "/buktiTransaksi"));
  },
  filename: function (req, file, cb) {
    // console.log(req)
    // console.log(req.body)
    cb(
      null,
      `${req.body.nomorBukti}__${new Date().getTime()}.${
        file.originalname.split(".")[1]
      }`
    );
  },
});
const unggahBukti = multer({ storage: storageBukti });
// hore();
app.use(
  jwt({
    secret: "unfaillingFather",
    algorithms: ["HS256"],
  }).unless({
    path: [
      "/login",
      "/auth/login",
      "/api/login",
      "/logout",
      "/api/logout",
      "/spkFile",
    ],
  })
);
function akt(req, res, next) {
  let user = req.user.dtAkun;
  if (user.userType == "acc") {
    next();
  } else {
    res.status(401).send({ st: "Tidak diijinkan..." });
  }
}

function man(req, res, next) {
  let user = req.user.dtAkun;
  if (["MAN", "purchase", "acc", "mitra"].some((a) => a == user.userType)) {
    next();
  } else {
    res.status(401).send({ st: "Tidak diijinkan..." });
  }
}

function admin(req, res, next) {
  let user = req.user.dtAkun;
  console.log(user.userType);
  // [] find
  if (
    ["MAN", "purchase", "acc", "admin", "mitra", "investor"].some(
      (a) => a == user.userType
    )
  ) {
    next();
  } else {
    res.status(401).send({ st: "Tidak diijinkan..." });
  }
}

function mitra(req, res, next) {
  let user = req.user.dtAkun;
  console.log(user.userType);
  // [] find
  if (["MAN", "purchase", "acc", "mitra"].some((a) => a == user.userType)) {
    next();
  } else {
    res.status(401).send({ st: "Tidak diijinkan..." });
  }
}

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const valid = username.length;
  const tglStokOp = new Date()
    .toLocaleString("sv", { timeZoneName: "short" })
    .slice(0, 10);
  // jamTutup = await redisStore.get("jamTutup");
  let jam = new Date();
  let pass = crypto
    .createHmac("sha256", username)
    .update(password)
    .digest("hex");
  console.log("iki ", pass);
  try {
    let [dtAkun] = await dbuse.query(
      `SELECT u.userAkun AS akun, u.password,u.userType,u.lastLogin,
      e.namaKaryawan AS nama, e.jabatan, e.kodeKar AS eID,e.kodeCab,e.photo, comp.compCode, c.namaCabang,c.telp, JSON_QUERY(e.cabGrup, '$') AS cabGrup,
      d.divisiCode, d.divisiName, c.alamatCabang, e.ecommerce
      FROM userAkun u LEFT JOIN karyawan e ON u.eID=e.kodeKar
        LEFT JOIN cabang c ON e.kodeCab=c.kodeCab
        LEFT JOIN divisi d ON c.divisiCode= d.divisiCode
        LEFT JOIN Company comp ON d.compCode=comp.compCode
      WHERE u.userAkun=? AND u.active='Y'`,
      [username]
    );
    if (pass === dtAkun.password) {
      let [cekSO] = await dbuse.query(
        `SELECT COUNT(kodeCab) AS cek FROM stokOpname WHERE kodeCab = ? AND status ='Open'`,
        [dtAkun.kodeCab]
      );
      let [cekSOt] = await dbuse.query(
        `SELECT COUNT(kodeCab) AS cek FROM stokOpname WHERE kodeCab = ? AND tgl LIKE '${tglStokOp}%'`,
        [dtAkun.kodeCab]
      );
      delete dtAkun.password;
      //    console.log(dtAkun)
      if (
        cekSO.cek > 0 &&
        ["acc", "MAN", "mitra", "admin", "investor"].every(
          (s) => s !== dtAkun.userType
        )
      ) {
        res.status(410).send(`${dtAkun.namaCabang} sedang Stok Opname...`);
      } else if (
        cekSOt.cek > 0 &&
        jam.getHours() > 22 &&
        ["acc", "MAN", "mitra", "investor"].every((s) => s !== dtAkun.userType)
      ) {
        res
          .status(410)
          .send(
            `${dtAkun.namaCabang} setelah Stok Opname maksimal jam 23.00 ...`
          );
      } else if (
        jam.getHours() > Number(jamTutup) &&
        ["acc", "MAN", "mitra", "investor"].every((s) => s !== dtAkun.userType)
      ) {
        res
          .status(410)
          .send(`${dtAkun.namaCabang} cut off jam ${jamTutup}.00 ...`);
      } else {
        let logU = await dbuse.query(
          "UPDATE userAkun SET lastLogin=NOW() WHERE userAkun=?",
          [username]
        );
        const accessToken = jsonwebtoken.sign({ dtAkun }, "unfaillingFather", {
          expiresIn: 60 * 60 * 180,
        });
        res.send({
          token: accessToken,
          user: dtAkun,
        });
        res.cookie("token", accessToken, { sameSite: "none", secure: false });
      }
    } else {
      res.status(410).send("Salah password");
    }
  } catch (err) {
    console.log(err);
    res.status(410).send("Perlu login...");
  }
});
app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  console.log(req.body);
  const valid = username.length;
  let pass = crypto
    .createHmac("sha256", username)
    .update(password)
    .digest("hex");
  console.log(pass);
  try {
    let [dtAkun] = await dbuse.query(
      `SELECT e.email AS akun, e.password,e.userType,e.lastLogin,
    e.namaKaryawan AS nama, e.jabatan, e.kodeKar AS eID ,e.kodeCab,e.photo, comp.compCode
    FROM karyawan e LEFT JOIN cabang c ON e.kodeCab=c.kodeCab
      LEFT JOIN divisi d ON c.divisiCode= d.divisiCode
      LEFT JOIN Company comp ON d.compCode=comp.compCode
    WHERE e.email=? AND e.active='Y'`,
      [username]
    );
    if (pass === dtAkun.password) {
      delete dtAkun.password;
      //    console.log(dtAkun)
      const accessToken = jsonwebtoken.sign({ dtAkun }, "unfaillingFather", {
        expiresIn: 60 * 60 * 180,
      });
      res.send({
        token: accessToken,
        user: dtAkun,
      });
      console.log(accessToken);
      res.cookie("token", accessToken, { sameSite: "none", secure: false });
      let lgn = new Date();
      dbuse.query("UPDATE userAkun SET lastLogin=?", [lgn]).catch((err) => {
        console.log(err);
      });
    } else {
      //       console.log(err)
      res.status(410).send("Salah password");
    }
  } catch (err) {
    console.log(err);
    res.status(410).send("Perlu login...");
  }
});
// [GET] /user
app.get("/user", async (req, res) => {
  // console.log(req.headers, req.body.token)
  /* let token = req.headers.authorization.split(' ')[1]
  jsonwebtoken.verify(token, 'unfaillingFather', function (err, decoded) {
    if (err) {
      res.status(401).send('Belum login...')
    } else {
      console.log(decoded)
      res.json({ user: req.user })
    }
  }) */
  const dtAkun = req.user.dtAkun;
  let jam = new Date();
  const tglStokOp = new Date()
    .toLocaleString("sv", { timeZoneName: "short" })
    .slice(0, 10);
  try {
    let [jamToko] = await dbuse.query(
      `SELECT ADDTIME(CURDATE(), jamBuka) AS jamBuka, ADDTIME(CURDATE(), jamTutup) AS jamTutup FROM cabang WHERE kodeCab = ?`,
      [dtAkun.kodeCab]
    );
    let [cekSOt] = await dbuse.query(
      `SELECT COUNT(kodeCab) AS cek FROM stokOpname WHERE kodeCab = ? AND tgl LIKE '${tglStokOp}%'`,
      [dtAkun.kodeCab]
    );
    console.log(jamToko, jam.getHours());
    if (
      cekSOt.cek > 0 &&
      jam.getHours() > 22 &&
      ["acc", "MAN", "mitra", "investor"].every((s) => s !== dtAkun.userType)
    ) {
      res
        .status(401)
        .send(
          `${dtAkun.namaCabang} setelah Stok Opname maksimal jam 23.00 ...`
        );
    } else if (
      (jam < jamToko.jamBuka || jam > jamToko.jamTutup) &&
      ["acc", "MAN", "mitra", "investor"].every((s) => s !== dtAkun.userType)
    ) {
      //  && ['acc', 'MAN', 'mitra', 'investor'].every(s => s !== dtAkun.userType)
      res.status(401).send(
        `${dtAkun.namaCabang} Operasional dari ${new Intl.DateTimeFormat(
          "id-ID",
          { timeStyle: "long" }
        ).format(jamToko.jamBuka)} s/d ${new Intl.DateTimeFormat("id-ID", {
          timeStyle: "long",
        }).format(jamToko.jamTutup)}`
      );
    } else {
      res.json({ user: req.user });
    }
  } catch (error) {
    console.log(error);
    res.status(401).send("Perlu login...");
  }
});
app.post("/jamTutup", async (req, res) => {
  let { x } = req.body;
  try {
    // await redisStore.set("jamTutup", x.jamTutup);
    res.send({ st: `Operasional sampai ${x.jamTutup}:00` });
  } catch (error) {
    console.log(error);
    res.status(410).send("Belum tersimpan...");
  }
});
app.get("/api/user", (req, res) => {
  res.json({ user: req.user });
});
app.get("/auth/user", (req, res) => {
  res.json({ user: req.user });
});

app.post("/upass", (req, res) => {
  let { x } = req.body;
  x.sandi = crypto
    .createHmac("sha256", x.akun)
    .update(x.password)
    .digest("hex");
  dbuse
    .query(
      {
        namedPlaceholders: true,
        sql: `UPDATE userAkun SET password=:sandi WHERE userAkun=:akun`,
      },
      x
    )
    .then((rows) => {
      res.send({ st: "sukses..." });
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "tidak nemu..." });
    });
});

app.get("/dtuser", (req, res) => {
  dbuse
    .query(
      `SELECT e.eID,e.kodeKar,e.namaKaryawan,e.kodeCab,e.ktp,e.jabatan,e.alamat,e.telp, JSON_QUERY(e.cabGrup, '$') AS cabGrup,
      c.namaCabang,u.userAkun, u.userType, u.active, u.lastLogin
    FROM karyawan e LEFT JOIN cabang c ON e.kodeCab=c.kodeCab
      LEFT JOIN userAkun u ON e.kodeKar=u.eID
    ORDER BY e.kodeCab ASC`
    )
    .then((rows) => {
      delete rows[0].password;
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "tidak nemu..." });
    });
});

app.post("/carikar", (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  let filter = ["MAN", "acc", "purchase"].some((a) => a == user.userType)
    ? ""
    : `WHERE e.kodeCab ='${user.kodeCab}' OR e.kodeCab='MP01'`;
  dbuse
    .query(
      `SELECT e.namaKaryawan, e.kodeKar AS salesID,e.kodeCab, c.namaCabang, e.userType, e.jabatan
    FROM karyawan e LEFT JOIN cabang c ON e.kodeCab=c.kodeCab
    ${filter}
    ORDER BY e.kodeCab,e.namaKaryawan ASC`
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "tidak nemu..." });
    });
});

app.post("/photo", unggah.single("photo"), (req, res) => {
  let usr = req.user.dtAkun.eID;
  dbuse
    .query("UPDATE karyawan SET photo = ? WHERE kodeKar = ? ", [
      req.file.filename,
      usr,
    ])
    .then((rows) => {
      res.send({ photo: req.file.filename });
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "tidak nemu..." });
    });
});

app.post("/inuser", man, (req, res) => {
  let { x } = req.body;
  /* x.password = crypto.createHmac('sha256', x.email)
    .update('salesAston')
    .digest('hex') */
  dbuse
    .query(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO karyawan (kodeKar,namaKaryawan,kodeCab,ktp,jabatan,alamat,telp, cabGrup)
      VALUES (:kodeKar,:namaKaryawan,:kodeCab,:ktp,:jabatan,:alamat,:telp, :cabGrup)
      ON DUPLICATE KEY UPDATE
      kodeKar=:kodeKar,namaKaryawan=:namaKaryawan,kodeCab=:kodeCab,ktp=:ktp,jabatan=:jabatan,alamat=:alamat,telp=:telp, cabGrup= :cabGrup`,
      },
      x
    )
    .then((rows) => res.send({ st: "Tersimpan..." }))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Tidak ditemukan..." });
    });
});

app.post("/inakun", man, (req, res) => {
  let { x } = req.body;
  x.password = crypto
    .createHmac("sha256", x.akun)
    .update("salesAston")
    .digest("hex");
  dbuse
    .query(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO userAkun (userAkun,password,userType,active,eID)
      VALUES (:akun,:password,:userType,:active,:kodeKar)
      ON DUPLICATE KEY UPDATE
      password=:password,userType=:userType,active=:active,eID=:kodeKar`,
      },
      x
    )
    .then((rows) => res.send({ st: "Tersimpan..." }))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Tidak ditemukan..." });
    });
});

app.post("/upuser", (req, res) => {
  let { x } = req.body;
  let akun = req.user.dtAkun.userType === "MAN" ? x.akun : req.user.dtAkun.akun;
  let pass = crypto.createHmac("sha256", akun).update(x.password).digest("hex");
  dbuse
    .query(`UPDATE userAkun SET password=? WHERE userAkun=?`, [pass, akun])
    .then((rows) => res.send({ st: "Tersimpan..." }))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "gagal..." });
    });
});

app.get("/cabang", (req, res) => {
  dbuse
    .query("SELECT * FROM cabang ORDER BY kodeCab ASC")
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "gagal..." });
    });
});
app.get("/dtcabang", (req, res) => {
  dbuse
    .query(
      "SELECT c.*,d.divisiName, d.compCode, k.spk FROM cabang c LEFT JOIN divisi d ON c.divisiCode=d.divisiCode LEFT JOIN Company k ON d.compCode = k.compCode ORDER BY c.kodeCab ASC"
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "gagal..." });
    });
});

app.post("/getBankCab", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(`SELECT * FROM Bank WHERE kodeCab = ?`, [x])
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Tidak ada data..." });
    });
});

app.post("/cabang", man, async (req, res) => {
  let { x } = req.body;
  try {
    let urt = await dbuse.query(
      "SELECT COUNT(kodeCab) AS nom FROM cabang WHERE divisiCode=?",
      [x.divisiCode]
    );
    x.kodeCab =
      x.kodeCab ||
      x.divisiCode + String(parseInt(urt[0].nom) + 1).padStart(2, "0");
    // insert into cabang dan update data cabang
    let incab = await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO cabang (kodeCab,divisiCode,namaCabang,alamatCabang,email,telp, noteNota, jamBuka, jamTutup) VALUES (:kodeCab,:divisiCode,:namaCabang,:alamatCabang,:email,:telp, :noteNota, :jamBuka, :jamTutup)
        ON DUPLICATE KEY UPDATE
        divisiCode=:divisiCode,namaCabang=:namaCabang,alamatCabang=:alamatCabang,email=:email,telp=:telp, lokasi= :lokasi, noteNota= :noteNota, jamBuka = :jamBuka, jamTutup =:jamTutup`,
      },
      x
    );
    // alter hpp dan stok cabID belum didefinisikan (add cab baru)
    if (!x.cabID) {
      let alterStock = await dbuse.query(
        `ALTER TABLE stock ADD COLUMN ${x.kodeCab} decimal(30,8) NOT NULL DEFAULT 0`,
        [x.kodeCab]
      );
      let alterHpp = await dbuse.query(
        `ALTER TABLE hpp ADD COLUMN ${x.kodeCab} decimal(30,8) NOT NULL DEFAULT 0`,
        [x.kodeCab]
      );
      let hargaRetail = await dbuse.query(
        `ALTER TABLE hargaRetail ADD COLUMN ${x.kodeCab} decimal(30,8) NOT NULL DEFAULT 0`,
        [x.kodeCab]
      );
      let hargaGrosir = await dbuse.query(
        `ALTER TABLE hargaGrosir ADD COLUMN ${x.kodeCab} decimal(30,8) NOT NULL DEFAULT 0`,
        [x.kodeCab]
      );
    }
  } catch (err) {
    console.log(err);
    res.status(410).send({ st: "Gagal simpan..." });
  } finally {
    res.send({ st: "Data tersimpan..." });
  }
});

app.get("/divcode", async (req, res) => {
  dbuse
    .query("SELECT * FROM divisi ORDER BY divisiID")
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "gagal..." });
    });
});
app.get("/company", async (req, res) => {
  dbuse
    .query("SELECT * FROM Company ORDER BY compCode")
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "gagal..." });
    });
});
// [POST] /logout
app.get("/logout", (req, res) => {
  res.send({ status: "OK" });
});

app.post("/dtproducts", (req, res) => {
  let user = req.user.dtAkun;
  let { x } = req.body;
  let comp = x.compCode || user.compCode;
  let kodeCab = ["MAN", "acc", "purchase", "mitra"].some(
    (a) => a == user.userType
  )
    ? x.kodeCab
    : user.kodeCab;
  dbuse
    .query(
      `SELECT p.*, c.produkCategory, c.pencapaian, c.promoPoint, c.device,m.namaMerk, CONCAT(c.produkCategory,' ',m.namaMerk,' ',p.namaProduk) AS namaBarang,
      hp.${kodeCab} AS hpp, hg.${kodeCab} AS hargaGrosir, hr.${kodeCab} AS hargaRetail, JSON_QUERY(p.konversi, '$') AS konversi, JSON_QUERY(p.shareToGrup, '$') AS shareToGrup
    FROM produk p
    LEFT JOIN produkCat c ON p.kodeCat=c.kodeCat
    LEFT JOIN merk m ON p.kodeMerk=m.kodeMerk
    LEFT JOIN hpp hp ON p.kodeProduk=hp.kodeProduk
    LEFT JOIN hargaGrosir hg ON p.kodeProduk=hg.kodeProduk
    LEFT JOIN hargaRetail hr ON p.kodeProduk=hr.kodeProduk
    WHERE p.shareToGrup like '%${comp}%'`,
      [comp, user.kodeCab, user.kodeCab]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(500).send({ st: "Tidak ditemukan..." });
    });
});

app.post("/dtproductsPublish", async (req, res) => {
  let user = req.user.dtAkun;
  let { x } = req.body;
  let comp = x.compCode || user.compCode;
  try {
    let ASI = await dbuse.query(`SELECT c.*, comp.compCode FROM cabang c
      LEFT JOIN divisi comp ON comp.divisiCode = c.divisiCode
      WHERE comp.compCode = 'ASI'`);
    let kodeCab = ASI.map((a) => `s.${a.kodeCab}`);
    let rows = await dbuse.query(
      `SELECT p.*, nb.*, ${kodeCab.toString()},
      hr.MP01 AS hargaRetail, JSON_QUERY(p.konversi, '$') AS konversi
      FROM produk p
      LEFT JOIN namaBarang nb ON nb.kodeProduk = p.kodeProduk
      LEFT JOIN stock s ON s.kodeProduk= p.kodeProduk      
      LEFT JOIN hargaRetail hr ON p.kodeProduk=hr.kodeProduk
      WHERE p.shareToGrup like '%ASI%' AND p.publish = 'Y'`,
      [comp, user.kodeCab, user.kodeCab]
    );
    res.send(rows);
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "gagal..." });
  }
});
app.post("/dtproductsPublishHpp", async (req, res) => {
  let user = req.user.dtAkun;
  let { x } = req.body;
  let comp = x.compCode || user.compCode;
  try {
    let ASI = await dbuse.query(`SELECT c.*, comp.compCode FROM cabang c
      LEFT JOIN divisi comp ON comp.divisiCode = c.divisiCode
      WHERE comp.compCode = 'ASI'`);
    let kodeCab = ASI.map((a) => `s.${a.kodeCab}`);
    let rows = await dbuse.query(
      `SELECT p.*, nb.*, ${kodeCab.toString()},
      hr.MP01 AS hargaRetail, hp.${x.kodeCab} AS hpp, hg.${
        x.kodeCab
      } AS hargaGrosir, hr.${
        x.kodeCab
      } AS hargaRetail, JSON_QUERY(p.konversi, '$') AS konversi
      FROM produk p
      LEFT JOIN namaBarang nb ON nb.kodeProduk = p.kodeProduk
      LEFT JOIN stock s ON s.kodeProduk= p.kodeProduk
      LEFT JOIN hpp hp ON p.kodeProduk=hp.kodeProduk
      LEFT JOIN hargaGrosir hg ON p.kodeProduk=hg.kodeProduk
      LEFT JOIN hargaRetail hr ON p.kodeProduk=hr.kodeProduk
      WHERE p.shareToGrup like '%ASI%' AND p.publish = 'Y'`,
      [comp, user.kodeCab, user.kodeCab]
    );
    res.send(rows);
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "gagal..." });
  }
});
/* app.post('/dtproductsPublishHpp', async (req, res) => {
  let user = req.user.dtAkun
  let { x } = req.body
  let comp = x.compCode || user.compCode
  try {
    let ASI = await dbuse.query(`SELECT c.*, comp.compCode FROM cabang c
      LEFT JOIN divisi comp ON comp.divisiCode = c.divisiCode
      WHERE comp.compCode = 'ASI'`)
    let kodeCab = ASI.map(a => `s.${a.kodeCab}`)
    let rows = await dbuse.query(`SELECT p.*, nb.*, ${kodeCab.toString()},
      hr.MP01 AS hargaRetail, hp.${x.kodeCab} AS hpp, JSON_QUERY(p.konversi, '$') AS konversi
      FROM produk p
      LEFT JOIN namaBarang nb ON nb.kodeProduk = p.kodeProduk
      LEFT JOIN stock s ON s.kodeProduk= p.kodeProduk
      LEFT JOIN hpp hp ON p.kodeProduk=hp.kodeProduk
      LEFT JOIN hargaRetail hr ON p.kodeProduk=hr.kodeProduk
      WHERE p.shareToGrup like '%ASI%' AND p.publish = 'Y'`, [comp, user.kodeCab, user.kodeCab])
    res.send(rows)
  } catch (error) {
    console.log(error)
    res.status(410).send({ st: 'gagal...' })
  }
}) */

app.post("/photoProduk", unggahProduk.single("Produk"), async (req, res) => {
  const user = req.user.dtAkun;
  let x = { ...user, ...req.body, ...req.file };
  try {
    await sharp(req.file.path)
      .resize(800)
      .png()
      .toFile(path.resolve(req.file.destination + `/${x.kodeProduk}.png`));
    fs.unlinkSync(req.file.path);
    res.send({ st: "Photo tersimpan..." });
    /* dbuse.query({
      namedPlaceholders: true,
      sql: `UPDATE produk SET namaFile = :fileName WHERE kodeProduk = :kodeProduk`
    }, x)
      .then(rows => {
        res.send({ st: 'Photo tersimpan...' })
      })
      .catch(err => {
        console.log(err)
        res.status(410).send({ st: 'Belum ada data' })
      }) */
    /* await sharp(req.file.path)
      .resize(150)
      .png()
      .toFile(
        path.resolve(req.file.destination + `/${user.akun}.png`)
      )
    fs.unlinkSync(req.file.path) */
  } catch (error) {
    console.log(error);
    res.status(410).send("Harus file gambar...");
  }
});

app.post("/products", async (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  let kodeCab = ["MAN", "acc", "purchase", "mitra"].some(
    (a) => a === user.userType
  )
    ? x.kodeCab
    : user.kodeCab;
  let hsl;
  x.konversi = x.konversi || [];
  x.shareToGrup = x.shareToGrup || [user.compCode];
  try {
    let cekode = user.compCode === "ASI" ? x.kodeCat : user.kodeCab + x.kodeCat;
    let urut = await dbuse.query(
      `SELECT COUNT(kodeProduk) AS nom FROM produk WHERE kodeProduk like '${cekode}%'`
    );
    let kode = cekode + String(parseInt(urut[0].nom) + 1).padStart(6, "0");
    x.kodeProduk = x.kodeProduk ? x.kodeProduk : kode;
    x.compID = user.compCode;
    let produk = await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO produk (kodeProduk,namaProduk,kodeMerk,kodeCat,sku,deskripsi,kodeCab,compID, pointMember, cashBack, satuan, jnsDevice, konversi, shareToGrup, publish, dimensi, berat)
        VALUES (:kodeProduk,:namaProduk,:kodeMerk,:kodeCat,:sku,:deskripsi,'${kodeCab}',:compID, :pointMember, :cashBack, :satuan, :jnsDevice, :konversi, :shareToGrup, :publish, :dimensi, :berat)
        ON DUPLICATE KEY UPDATE
        namaProduk=:namaProduk,kodeMerk=:kodeMerk,kodeCat=:kodeCat,sku=:sku,deskripsi=:deskripsi, pointMember=:pointMember,
        cashback=:cashBack, satuan=:satuan, aktif=:aktif, jnsDevice=:jnsDevice, konversi= :konversi, shareToGrup = :shareToGrup, publish= :publish, dimensi= :dimensi, berat= :berat`,
      },
      x
    );
    if (produk.insertId > 0) {
      let hpp = await dbuse.query(
        {
          namedPlaceholders: true,
          sql: `INSERT INTO hpp (kodeProduk) VALUES (:kodeProduk)
          ON DUPLICATE KEY UPDATE
          kodeProduk=:kodeProduk`,
        },
        x
      );
      let stock = await dbuse.query(
        {
          namedPlaceholders: true,
          sql: `INSERT INTO stock (kodeProduk) VALUES (:kodeProduk)
          ON DUPLICATE KEY UPDATE
          kodeProduk=:kodeProduk`,
        },
        x
      );
      let hargaGrosir = await dbuse.query(
        {
          namedPlaceholders: true,
          sql: `INSERT INTO hargaGrosir (kodeProduk) VALUES (:kodeProduk)
          ON DUPLICATE KEY UPDATE
          kodeProduk=:kodeProduk`,
        },
        x
      );
      let hargaRetail = await dbuse.query(
        {
          namedPlaceholders: true,
          sql: `INSERT INTO hargaRetail (kodeProduk) VALUES (:kodeProduk)
          ON DUPLICATE KEY UPDATE
          kodeProduk=:kodeProduk`,
        },
        x
      );
    }
  } catch (err) {
    console.log(err);
    res.status(410).send({ st: "Belum tersimpan..." });
  } finally {
    res.send({ st: "Tersimpan..." });
  }
});

app.post("/uphrg", (req, res) => {
  let user = req.user.dtAkun;
  let { x } = req.body;
  let kodeCab = ["MAN", "acc", "purchase"].some((a) => a == user.userType)
    ? x.kodeCab
    : user.kodeCab;
  dbuse
    .query(`UPDATE ${x.jns} SET ${kodeCab}='${x[x.jns]}' WHERE kodeProduk=?`, [
      x.kodeProduk,
    ])
    .then((rows) => res.send({ st: "Harga updated..." }))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Tidak ditemukan..." });
    });
});

app.get("/dtProdukCat", (req, res) => {
  dbuse
    .query(
      `SELECT c.*,cp.namaAkun AS Persediaan, cj.namaAkun AS Penjualan, ch.namaAkun AS Hpp
    FROM produkCat c
    LEFT JOIN COA cp ON c.akunPersediaan=cp.kodeAkun
    LEFT JOIN COA cj ON c.akunPenjualan=cj.kodeAkun
    LEFT JOIN COA ch ON c.akunHpp=ch.kodeAkun
    ORDER BY c.kodeCat ASC`
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Tidak ditemukan..." });
    });
});

app.get("/getprodukcat", (req, res) => {
  dbuse
    .query("SELECT kodeCat, produkCategory FROM produkCat ORDER BY kodeCat ASC")
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Tidak ditemukan..." });
    });
});

app.post("/addProdukCat", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO produkCat (kodeCat,produkCategory,akunPersediaan,akunPenjualan,akunHpp, pencapaian, promoPoint, pointMember, device, jasa)
      VALUES (:kodeCat,:produkCategory,:akunPersediaan,:akunPenjualan,:akunHpp, :pencapaian, :promoPoint, :pointMember, :device, :jasa)
      ON DUPLICATE KEY UPDATE kodeCat=:kodeCat, produkCategory=:produkCategory,akunPersediaan=:akunPersediaan,akunPenjualan=:akunPenjualan,
        akunHpp=:akunHpp, pencapaian=:pencapaian, promoPoint=:promoPoint, pointMember=:pointMember, device = :device, jasa = :jasa`,
      },
      x
    )
    .then((rows) => res.send({ st: "Tersimpan..." }))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Tidak ditemukan..." });
    });
});
app.get("/merk", (req, res) => {
  dbuse
    .query("SELECT kodeMerk, namaMerk FROM merk ORDER BY namaMerk ASC")
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Tidak ditemukan..." });
    });
});
app.post("/inMerk", admin, (req, res) => {
  let { x } = req.body;
  dbuse
    .query(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO merk (kodeMerk, namaMerk) VALUES (:kodeMerk, :namaMerk)
      ON DUPLICATE KEY UPDATE namaMerk= :namaMerk`,
      },
      x
    )
    .then((rows) => {
      res.send({ st: "Berhasil tersimpan... ", id: rows.insertId });
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Gagal input..." });
    });
});

app.get("/crproduk?", (req, res) => {
  let a = req.query.key;
  let b = `%${a}%`;
  let user = req.user.dtAkun;
  let ss = ["MAN", "purchase", "acc"].some(
    (a) => a === req.user.dtAkun.userType
  )
    ? ""
    : ` AND p.shareToGrup like '%${user.compCode}%'`;
  dbuse
    .query(
      `SELECT p.kodeProduk,p.sku,p.kodeCat,p.kodeMerk,h.${user.kodeCab} AS hpp,
      h.${user.kodeCab} AS price1,
      nb.namaBarang, nb.shareToGrup,
      hr.${user.kodeCab} AS hargaRetail, hg.${user.kodeCab} AS hargaGrosir,p.compID,p.kodeCab,
      nb.konversi, nb.jasa
    FROM produk p
    LEFT JOIN namaBarang nb ON nb.kodeProduk=p.kodeProduk
    LEFT JOIN hpp h ON p.kodeProduk=h.kodeProduk
    LEFT JOIN hargaRetail hr ON p.kodeProduk=hr.kodeProduk
    LEFT JOIN hargaGrosir hg ON p.kodeProduk=hg.kodeProduk
    WHERE p.aktif = 'Y' AND (nb.namaBarang like ? OR p.kodeProduk like ? OR p.sku LIKE ?)
    ${ss}
    LIMIT 10`,
      [b, b, b, user.kodeCab]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Tidak ditemukan..." });
    });
});

app.get("/crstok?", (req, res) => {
  const a = JSON.parse(req.query.key);
  const b = `%${a.text}%`;
  const user = req.user.dtAkun;
  const kodeCab = a.kodeCab || user.kodeCab;
  let ss = ["MAN", "purchase", "acc"].some(
    (a) => a === req.user.dtAkun.userType
  )
    ? ""
    : ` AND p.shareToGrup like '%${user.compCode}%'`;
  dbuse
    .query(
      `SELECT p.kodeProduk,p.sku,h.${kodeCab} AS hpp, p.kodeCat,
      h.${kodeCab} AS price1,
      nb.*,
      s.${kodeCab} AS stok,
      hr.${kodeCab} AS hargaRetail, hg.${kodeCab} AS hargaGrosir,p.compID,p.kodeCab
    FROM produk p
    LEFT JOIN namaBarang nb ON nb.kodeProduk=p.kodeProduk
    LEFT JOIN hpp h ON p.kodeProduk=h.kodeProduk
    LEFT JOIN stock s ON s.kodeProduk= p.kodeProduk
    LEFT JOIN hargaRetail hr ON p.kodeProduk=hr.kodeProduk
    LEFT JOIN hargaGrosir hg ON p.kodeProduk=hg.kodeProduk
    WHERE p.aktif = 'Y' AND (nb.namaBarang like ? OR p.kodeProduk like ? OR p.sku LIKE ?)
    ${ss}
    HAVING stok > 0 || nb.jasa = 'Y'
    LIMIT 10`,
      [b, b, b, kodeCab]
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Tidak ditemukan..." });
    });
});

app.get("/crpartner?", (req, res) => {
  let { key, jns } = req.query;
  let a = `%${key}%`;
  let user = req.user.dtAkun;
  let compCode = user.compCode;
  let sql =
    compCode === "ASI"
      ? `SELECT p.*, c.point, c.spk FROM partner p LEFT JOIN CustCat c ON p.catPartner = c.idCustCat WHERE p.${jns}='Y' AND (p.namaPartner like ? OR p.tlp LIKE ?) AND p.kodeCab='${user.kodeCab}'`
      : `SELECT p.*, c.point, c.spk FROM partner p LEFT JOIN CustCat c ON p.catPartner = c.idCustCat WHERE p.${jns}='Y' AND (p.namaPartner like ? OR p.tlp LIKE ?) AND p.kodeCab=?`;
  dbuse
    .query(sql, [a, a, user.kodeCab])
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Tidak ditemukan..." });
    });
});

app.post("/jenisCust", (req, res) => {
  const { x } = req.body;
  dbuse
    .query(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO CustCat (jenisCust) VALUES (:jenisCust)
      ON DUPLICATE KEY UPDATE point = :point`,
      },
      x
    )
    .then((rows) => res.send({ st: "Tersimpan..." }))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Belum tersimpan..." });
    });
});
app.post("/delJenisCust", (req, res) => {
  const { x } = req.body;
  dbuse
    .query("DELETE FROM CustCat WHERE idCustCat = ?", [x.idCustCat])
    .then((rows) => res.send({ st: "Tersimpan... " }))
    .catch((err) => {
      console.log(err);
      res.status(401).send({ st: "Tidak diijinkan..." });
      // throw new error(err)
    });
});

/* app.get('/stok?', async (req, res) => {
  let user = req.user.dtAkun
  let { key } = req.query
  try {
    let kodeCab = ['MAN', 'acc', 'purchase'].some(a => a === user.userType) ? key : user.kodeCab
    let [compID] = await dbuse.query('SELECT d.compCode FROM cabang c LEFT JOIN divisi d ON c.divisiCode = d.divisiCode WHERE c.kodeCab = ?', [kodeCab])
    let compCode = ['MAN', 'acc', 'purchase'].some(a => a === user.userType) ? compID.compCode : user.compCode
    // console.log(compID)
    dbuse.query(`SELECT s.kodeProduk, s.${kodeCab} AS saldo, nm.sku,
        nm.namaBarang,h.${kodeCab} AS hpp, hr.${kodeCab} AS hargaRetail,nm.compID,nm.kodeCab,nm.kodeCat,
        hg.${kodeCab} AS hargaGrosir, COALESCE(wt.tunggu,0) AS tunggu, nm.akunPersediaan, nm.jasa,
        nm.konversi, nm.pointMember
      FROM stock s
        LEFT JOIN namaBarang nm ON s.kodeProduk=nm.kodeProduk
        LEFT JOIN hpp h ON s.kodeProduk=h.kodeProduk
        LEFT JOIN hargaRetail hr ON s.kodeProduk=hr.kodeProduk
        LEFT JOIN hargaGrosir hg ON s.kodeProduk=hg.kodeProduk
        LEFT JOIN (
          SELECT SUM(dt.qty) AS tunggu, dt.kodeProduk
          FROM detTrans dt LEFT JOIN transaksi t ON dt.nomorBukti=t.nomorBukti
          WHERE t.status ='W' AND t.asal='${kodeCab}'
          GROUP BY dt.kodeProduk
        ) wt ON wt.kodeProduk=s.kodeProduk
        WHERE nm.shareToGrup LIKE '%${compCode}%'`, [kodeCab, kodeCab])
      .then(rows => {
        res.send(rows)
        console.log('kene')
      })
      .catch(err => {
        console.log(err)
        res.status(500).send({ st: 'error...' })
      })
  } catch (error) {
    console.log(error)
    res.status(500).send({ st: 'error...' })
  }
}) */

app.get("/stok?", (req, res) => {
  let user = req.user.dtAkun;
  let { key } = req.query;
  let x = {
    cabID: ["MAN", "acc", "purchase"].some((a) => a === user.userType)
      ? key
      : [user.kodeCab],
  };
  // let nol = x.stKos ? '' : 'HAVING saldo != 0'
  let sql = `SELECT s.kodeProduk, COALESCE(s.saldot,0) AS saldo, COALESCE(s.saldoHpp,0) AS total,
  (COALESCE(s.saldoHpp,0) / COALESCE(s.saldot,0)) AS hpp, s.kodeCabang, hr.${x.cabID} AS hargaRetail,
  hg.${x.cabID} AS hargaGrosir, COALESCE(wt.tunggu,0) AS tunggu, nm.kodeProduk, 
  nm.akunPersediaan, nm.jasa, nm.sku, nm.namaBarang,
  nm.konversi, nm.pointMember, nm.compID,nm.kodeCab,nm.kodeCat
  FROM namaBarang nm
    LEFT JOIN (SELECT SUM(CASE
      WHEN t.tujuan IN (:cabID) AND (t.asal NOT IN (:cabID) OR t.asal IS NULL) AND t.status = 'T' AND t.jnsTrx != 'RJ' THEN d.dpp + d.ongkir
      WHEN t.tujuan IN (:cabID) AND (t.asal NOT IN (:cabID) OR t.asal IS NULL) AND t.status = 'T' AND t.jnsTrx = 'RJ' THEN d.hpp
      WHEN t.asal IN (:cabID) AND (t.tujuan NOT IN (:cabID) OR t.tujuan IS NULL) AND t.status IN ('D', 'T') THEN -d.hpp
      ELSE 0
      END) AS saldoHpp,
      SUM(CASE
        WHEN t.tujuan IN (:cabID) AND (t.asal NOT IN (:cabID) OR t.asal IS NULL) AND t.status = 'T' THEN d.qty
        WHEN t.asal IN (:cabID) AND (t.tujuan NOT IN (:cabID) OR t.tujuan IS NULL) AND t.status IN ('D', 'T') THEN -d.qty
        ELSE 0
        END) AS saldot,
      d.kodeProduk,
      CASE WHEN t.asal IN (:cabID) AND t.tujuan NOT IN (:cabID) THEN t.asal
        WHEN (t.asal IS NULL OR t.asal NOT IN (:cabID)) AND t.tujuan IN (:cabID) THEN t.tujuan
        ELSE ''
      END AS kodeCabang
    FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
      LEFT JOIN namaBarang nm ON nm.kodeProduk=d.kodeProduk
    WHERE t.status NOT IN ('W', 'B') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID))
      AND nm.jasa != 'Y'
    GROUP BY d.kodeProduk
    HAVING saldot != 0) s ON s.kodeProduk = nm.kodeProduk
  LEFT JOIN hargaRetail hr ON hr.kodeProduk = nm.kodeProduk
  LEFT JOIN hargaGrosir hg ON hg.kodeProduk = nm.kodeProduk
  LEFT JOIN (
    SELECT SUM(dt.qty) AS tunggu, dt.kodeProduk
    FROM detTrans dt LEFT JOIN transaksi t ON dt.nomorBukti=t.nomorBukti
    WHERE t.status ='W' AND t.asal='${x.cabID}'
    GROUP BY dt.kodeProduk
  ) wt ON wt.kodeProduk=nm.kodeProduk`;
  dbuse
    .query(
      {
        namedPlaceholders: true,
        sql: sql,
      },
      x
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Tidak diijinkan..." });
      // throw new error(err)
    });
});

app.post("/stokAllBaru", async (req, res) => {
  let cabGrup = req.body.x;
  let dts = [];
  try {
    for (let i in cabGrup) {
      let aa = { cabID: cabGrup[i] };
      let dt = await dbuse.query(
        {
          namedPlaceholders: true,
          sql: `SELECT s.kodeProduk, COALESCE(s.saldot,0) AS saldo, COALESCE(s.saldoHpp,0) AS total,
        (COALESCE(s.saldoHpp,0) / COALESCE(s.saldot,0)) AS hpp, '${cabGrup[i]}' AS kodeCab, hr.${cabGrup[i]} AS hargaRetail,
        hg.${cabGrup[i]} AS hargaGrosir, COALESCE(wt.tunggu,0) AS tunggu, nm.kodeProduk, 
        nm.akunPersediaan, nm.jasa, nm.sku, nm.namaBarang,nm.kodeCat,
        nm.konversi, nm.pointMember, nm.compID
        FROM namaBarang nm
          LEFT JOIN (SELECT SUM(CASE
            WHEN t.tujuan IN (:cabID) AND (t.asal NOT IN (:cabID) OR t.asal IS NULL) AND t.status = 'T' AND t.jnsTrx != 'RJ' THEN d.dpp + d.ongkir
            WHEN t.tujuan IN (:cabID) AND (t.asal NOT IN (:cabID) OR t.asal IS NULL) AND t.status = 'T' AND t.jnsTrx = 'RJ' THEN d.hpp
            WHEN t.asal IN (:cabID) AND (t.tujuan NOT IN (:cabID) OR t.tujuan IS NULL) AND t.status IN ('D', 'T') THEN -d.hpp
            ELSE 0
            END) AS saldoHpp,
            SUM(CASE
              WHEN t.tujuan IN (:cabID) AND (t.asal NOT IN (:cabID) OR t.asal IS NULL) AND t.status = 'T' THEN d.qty
              WHEN t.asal IN (:cabID) AND (t.tujuan NOT IN (:cabID) OR t.tujuan IS NULL) AND t.status IN ('D', 'T') THEN -d.qty
              ELSE 0
              END) AS saldot,
            d.kodeProduk,
            CASE WHEN t.asal IN (:cabID) AND t.tujuan NOT IN (:cabID) THEN t.asal
              WHEN (t.asal IS NULL OR t.asal NOT IN (:cabID)) AND t.tujuan IN (:cabID) THEN t.tujuan
              ELSE ''
            END AS kodeCabang
          FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
            LEFT JOIN namaBarang nm ON nm.kodeProduk=d.kodeProduk
          WHERE t.status NOT IN ('W', 'B') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID))
            AND nm.jasa != 'Y'
          GROUP BY d.kodeProduk
          HAVING saldot != 0) s ON s.kodeProduk = nm.kodeProduk
        LEFT JOIN hargaRetail hr ON hr.kodeProduk = nm.kodeProduk
        LEFT JOIN hargaGrosir hg ON hg.kodeProduk = nm.kodeProduk
        LEFT JOIN (
          SELECT SUM(dt.qty) AS tunggu, dt.kodeProduk
          FROM detTrans dt LEFT JOIN transaksi t ON dt.nomorBukti=t.nomorBukti
          WHERE t.status ='W' AND t.asal='${cabGrup[i]}'
          GROUP BY dt.kodeProduk
        ) wt ON wt.kodeProduk=nm.kodeProduk
        HAVING saldo != 0`,
        },
        aa
      );
      dts.push(...dt);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ st: "error..." });
  } finally {
    let pd = [...new Set(dts.map((a) => a.kodeProduk))];
    let dtap = [];
    for (let i in pd) {
      let dta = {
        ...dts.find((a) => a.kodeProduk === pd[i]),
        totalSaldo: dts
          .filter((a) => a.kodeProduk === pd[i])
          .reduce((a, b) => jumlah([a, b.saldo]), 0),
      };
      for (let cb in cabGrup) {
        dta[cabGrup[cb]] = dts.find(
          (a) => a.kodeCab === cabGrup[cb] && a.kodeProduk === pd[i]
        )
          ? dts.find((a) => a.kodeCab === cabGrup[cb] && a.kodeProduk === pd[i])
              .saldo
          : 0;
        dta["hpp" + cabGrup[cb]] = dts.find(
          (a) => a.kodeCab === cabGrup[cb] && a.kodeProduk === pd[i]
        )
          ? dts.find((a) => a.kodeCab === cabGrup[cb] && a.kodeProduk === pd[i])
              .hpp
          : 0;
      }
      dtap.push(dta);
    }
    res.send(dtap);
  }
});

app.post("/cekStok", async (req, res) => {
  let { x } = req.body;
  x.kodePartner = x.kodePartner || "";
  x.cabID = x.kodeCab;
  try {
    let [cekKongsi] = await dbuse.query(
      `SELECT SUM(d.qty) AS jmlQty, COALESCE(k.kirim, 0) AS kirim,
    (SUM(d.qty)-COALESCE(k.kirim, 0)) AS sisa
      FROM detKongsi d
      LEFT JOIN kongsi p ON d.nomorKongsi=p.nomorKongsi
      LEFT JOIN (
        SELECT d.kodeProduk, SUM(d.qty) AS kirim
        FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
        WHERE t.cabID IN (?) AND t.status != 'B' AND t.pjKongsi = 'Y' AND d.kodeProduk = ? AND t.kodePartner =?
        GROUP BY d.kodeProduk, t.kodePartner
      ) k ON k.kodeProduk=d.kodeProduk
      WHERE p.cabID IN (?) AND d.kodeProduk = ? AND p.kodePartner =?
      GROUP BY d.kodeProduk, p.kodePartner
      HAVING jmlQty > kirim`,
      [
        x.kodeCab,
        x.kodeProduk,
        x.kodePartner,
        x.kodeCab,
        x.kodeProduk,
        x.kodePartner,
      ]
    );
    dbuse
      .query(
        {
          namedPlaceholders: true,
          sql: `SELECT s.kodeProduk, (COALESCE(s.saldot,0) - COALESCE(wt.tunggu, 0) - COALESCE(k.sisa, 0)) AS saldo, SUM(COALESCE(s.saldoHpp,0)) AS total,
        (SUM(COALESCE(s.saldoHpp,0)) / SUM(COALESCE(s.saldot,1))) AS hpp, s.kodeCabang, hr.${x.cabID} AS hargaRetail,
        hg.${x.cabID} AS hargaGrosir, COALESCE(wt.tunggu,0) AS tunggu, s.*, k.sisa AS kongsi
        FROM (
          SELECT SUM(CASE
            WHEN t.tujuan IN (:cabID) AND (t.asal NOT IN (:cabID) OR t.asal IS NULL) AND t.status = 'T' AND t.jnsTrx != 'RJ' THEN d.dpp + d.ongkir
            WHEN t.tujuan IN (:cabID) AND (t.asal NOT IN (:cabID) OR t.asal IS NULL) AND t.status = 'T' AND t.jnsTrx = 'RJ' THEN d.hpp
            WHEN t.asal IN (:cabID) AND (t.tujuan NOT IN (:cabID) OR t.tujuan IS NULL) AND t.status IN ('D', 'T') THEN -d.hpp
            ELSE 0
            END) AS saldoHpp,
            SUM(CASE
              WHEN t.tujuan IN (:cabID) AND (t.asal NOT IN (:cabID) OR t.asal IS NULL) AND t.status = 'T' THEN d.qty
              WHEN t.asal IN (:cabID) AND (t.tujuan NOT IN (:cabID) OR t.tujuan IS NULL) AND t.status IN ('D', 'T') THEN -d.qty
              ELSE 0
              END) AS saldot,
            d.kodeProduk,
            CASE WHEN t.asal IN (:cabID) AND t.tujuan NOT IN (:cabID) THEN t.asal
              WHEN (t.asal IS NULL OR t.asal NOT IN (:cabID)) AND t.tujuan IN (:cabID) THEN t.tujuan
              ELSE ''
            END AS kodeCabang,
            nm.akunPersediaan, nm.jasa, nm.sku, nm.namaBarang,
            nm.konversi, nm.pointMember, nm.compID,nm.kodeCab,nm.kodeCat
          FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
            LEFT JOIN namaBarang nm ON nm.kodeProduk=d.kodeProduk
          WHERE t.status NOT IN ('W', 'B') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID))
            AND nm.jasa != 'Y' AND d.kodeProduk = :kodeProduk
          GROUP BY d.kodeProduk) s
        LEFT JOIN hargaRetail hr ON hr.kodeProduk = s.kodeProduk
        LEFT JOIN hargaGrosir hg ON hg.kodeProduk = s.kodeProduk
        LEFT JOIN (
          SELECT SUM(dt.qty) AS tunggu, dt.kodeProduk
          FROM detTrans dt LEFT JOIN transaksi t ON dt.nomorBukti=t.nomorBukti
          WHERE t.status ='W' AND t.asal='${x.cabID}' AND dt.kodeProduk = :kodeProduk
          GROUP BY dt.kodeProduk
        ) wt ON wt.kodeProduk=s.kodeProduk
        LEFT JOIN (
          SELECT (SUM(d.qty) - COALESCE(k.kirim, 0)) AS sisa, d.kodeProduk
            FROM detKongsi d
            LEFT JOIN kongsi p ON d.nomorKongsi=p.nomorKongsi
            LEFT JOIN (
              SELECT d.kodeProduk, SUM(d.qty) AS kirim
              FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
              WHERE t.cabID IN (:cabID) AND t.status != 'B' AND t.pjKongsi = 'Y' AND d.kodeProduk = :kodeProduk
              GROUP BY d.kodeProduk
            ) k ON k.kodeProduk=d.kodeProduk
            WHERE p.cabID IN (:cabID) AND d.kodeProduk = :kodeProduk
            GROUP BY d.kodeProduk
            HAVING sisa > 0
        ) k ON k.kodeProduk= s.kodeProduk
        WHERE s.kodeProduk = :kodeProduk`,
        },
        x
      )
      .then((rows) => {
        let a = [...rows, cekKongsi];
        res.send(a);
      });
  } catch (error) {
    console.log(error);
    res.status(500).send({ st: "error..." });
  }
});

app.post("/stokall", admin, async (req, res) => {
  let { x } = req.body;
  console.log(x);
  try {
    let kodeCab = x.map((a) => `s.${a}`);
    let rows =
      await dbuse.query(`SELECT nb.kodeProduk,nb.namaBarang, nb.kodeCat, ${kodeCab.toString()}
      FROM stock s LEFT JOIN namaBarang nb ON s.kodeProduk=nb.kodeProduk`);
    res.send(rows);
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "tidak tersedia..." });
  }
});

app.post("/dtpo", (req, res) => {
  let user = req.user.dtAkun;
  let { x } = req.body;
  let kodeCab = ["MAN", "acc", "purchase"].some((a) => a == user.userType)
    ? x.kodeCab
    : [user.kodeCab];
  dbuse
    .query(
      `SELECT p.*,DATE_FORMAT(p.tglRequest,'%Y-%m-%d') AS tglRequest,
      cl.namaPartner, cl.alamat, cl.tlp, COALESCE(det.totalHarga,0) AS totalHarga,
      PR.nomorPR, k.namaKaryawan AS namaSales
    FROM PO p
      LEFT JOIN partner cl ON p.kodePartner=cl.kodePartner
      LEFT JOIN (
        SELECT SUM(dp.hargaJual * dp.qty) AS totalHarga, dp.nomorPO
          FROM detPO dp LEFT JOIN PO on dp.nomorPO= PO.nomorPO
          WHERE PO.cabID IN (?)
          GROUP BY PO.nomorPO
      ) det ON det.nomorPO = p.nomorPO
      LEFT JOIN PR ON PR.nomorPO = p.nomorPO
      LEFT JOIN karyawan k ON k.kodeKar = p.salesID
      WHERE p.cabID IN (?)
      ORDER BY p.tglRequest DESC`,
      [kodeCab, kodeCab]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      //      throw new Error(err)
      res.status(500).send({ st: "ndak nemu..." });
    });
});

app.post("/dtpr", (req, res) => {
  let user = req.user.dtAkun;
  let { x } = req.body;
  let kodeCab = ["MAN", "acc", "purchase"].some((a) => a == user.userType)
    ? x.kodeCab
    : [user.kodeCab];
  dbuse
    .query(
      `SELECT p.*,DATE_FORMAT(p.tglRequest,'%Y-%m-%d') AS tglRequest, cb.namaCabang,cl.namaCabang AS partner
    FROM PR p
      LEFT JOIN cabang cb ON p.cabID=cb.kodeCab
      LEFT JOIN cabang cl ON p.cabLain=cl.kodeCab
      WHERE p.cabID IN (?)
      ORDER BY p.tglRequest DESC`,
      [kodeCab]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      //      throw new Error(err)
      res.status(500).send({ st: "ndak nemu..." });
    });
});
app.post("/rekapPesanan", (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  let kodeCab = ["MAN", "purchase", "acc"].some((a) => a == user.userType)
    ? x.kodeCab
    : user.kodeCab;
  dbuse
    .query(
      `SELECT d.kodeProduk, SUM(d.qty) AS qty, s.${kodeCab} AS stok, nb.namaBarang,
      b.kodeBOM, nb.akunPersediaan, nb.akunHpp
    FROM detPO d LEFT JOIN stock s ON d.kodeProduk=s.kodeProduk
      LEFT JOIN namaBarang nb ON d.kodeProduk=nb.kodeProduk
      LEFT JOIN PO po ON po.nomorPO=d.nomorPO
      LEFT JOIN BOM b ON d.kodeProduk=b.kodeProduk
    WHERE  po.statusPO != 'closed' AND po.cabID= ?
    GROUP BY d.kodeProduk`,
      [kodeCab]
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Tidak ditemukan data..." });
    });
});

app.get("/dtpesanan", (req, res) => {
  let user = req.user.dtAkun;
  let b = ["MAN", "purchase", "acc"].some((a) => a == user.userType)
    ? ""
    : "WHERE p.cabLain=?";
  dbuse
    .query(
      {
        dateStrings: true,
        sql: `SELECT p.nomorPR,p.statusPR, p.keterangan,p.kodePartner,tglRequest,p.cabLain, p.cabID, cb.namaCabang ,cl.namaCabang AS partner, p.oleh, p.ac
   FROM PR p
    LEFT JOIN cabang cb ON p.cabID=cb.kodeCab
    LEFT JOIN cabang cl ON p.cabLain=cl.kodeCab ${b}
    ORDER BY p.tglRequest DESC`,
      },
      [user.kodeCab]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      //      throw new Error(err)
      console.log(err);
      res.status(500).send({ st: "ndak nemu..." });
    });
});

app.post("/addPR", async (req, res) => {
  let { hd, det } = req.body.x;
  let user = req.user.dtAkun;
  let hPR = {};
  hPR.nomorPO = hd.nomorPO || null;
  hPR.tglRequest = hd.tglRequest;
  hPR.cabID = ["MAN", "purchase", "acc"].some((a) => a == user.userType)
    ? hd.kodeCab
    : req.user.dtAkun.kodeCab; // nko diambil soko session user e
  // hPR.oleh = req.user.dtAkun.akun
  try {
    let urt = hd.tglRequest.replace(/-/gi, "");
    let cr = hPR.cabID + "52" + urt.slice(4, 6) + urt.slice(2, 4);
    let nomPR = await dbuse.query(
      `SELECT COUNT(t.nomorPR) AS nom FROM PR t WHERE t.nomorPR like '${cr}%'`,
      [cr]
    );
    hPR.nomorPR = cr + String(parseInt(nomPR[0].nom) + 1).padStart(6, "0");
    let trxID = await dbuse.query(
      `INSERT INTO PR (cabID,tglRequest,nomorPR,ac,cabLain, keterangan, oleh, nomorPO) VALUES (?,?,?,?,?,?,?,?)`,
      [
        hPR.cabID,
        hd.tglRequest,
        hPR.nomorPR,
        hd.ac,
        hd.cabLain,
        hd.keterangan,
        user.eID,
        hPR.nomorPO,
      ]
    );
    let col = await det.map((a) => {
      let u = a;
      u.nomorPR = hPR.nomorPR;
      return u;
    });
    let st = ["kodeProduk", "qty", "nomorPR"];
    //  let val = await col.map(a => Object.values(a))
    let val = col.map((a) => {
      let u = [];
      for (let i in st) {
        a[st[i]] == undefined ? u.push("0") : u.push(a[st[i]]);
      }
      return u;
    });
    dbuse
      .batch(`INSERT INTO detPR (kodeProduk,qty,nomorPR) VALUES (?,?,?)`, val)
      .then((rows) => res.send({ st: "Sukses..." }))
      .catch((err) => {
        console.log(err);
        res.status(401).send({ st: "Tidak diijinkan..." });
        // throw new error(err)
      });
  } catch (err) {
    console.log(err);
    res.status(500).send({ st: "cek data..." });
  }
});

app.post("/detpr", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(
      `SELECT d.*, nb.namaBarang, s.${x.cabID} AS stok, nb.satuan, nb.pointMember
  FROM detPR d LEFT JOIN namaBarang nb ON d.kodeProduk=nb.kodeProduk
  LEFT JOIN hpp h ON d.kodeProduk=h.kodeProduk
  LEFT JOIN stock s ON s.kodeProduk=d.kodeProduk
  WHERE d.nomorPR=?`,
      [x.nomorPR]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(401).send({ st: "Tidak diijinkan..." });
      // throw new error(err)
    });
});

app.post("/upPricing", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(
      {
        namedPlaceholders: true,
        sql: `UPDATE pricing SET status= :status, note = :note WHERE nomorPricing= :nomorPricing`,
      },
      x
    )
    .then((rows) =>
      res.send({ st: `Nomor Penawaran ${x.nomorPricing} tersimpan...` })
    )
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Belum tersimpan..." });
      // throw new error(err)
    });
});

app.post("/addPricing", async (req, res) => {
  let { hd, det } = req.body.x;
  let hPR = {};
  const user = req.user.dtAkun;
  hPR.tglRequest = hd.tglRequest;
  hPR.cabID = ["MAN", "acc", "purchase"].some((a) => a == user.userType)
    ? hd.cabID
    : req.user.dtAkun.kodeCab; // nko diambil soko session user e
  hPR.oleh = req.user.dtAkun.akun;
  let salesID = req.user.dtAkun.eID;
  try {
    let urt = hd.tglRequest.replace(/-/gi, "");
    let cr = hPR.cabID + "62" + urt.slice(4, 6) + urt.slice(2, 4);
    let nomPR = await dbuse.query(
      `SELECT COUNT(t.nomorPricing) AS nom FROM pricing t WHERE t.nomorPricing like '${cr}%'`,
      [cr]
    );
    hPR.nomorPricing = cr + String(parseInt(nomPR[0].nom) + 1).padStart(6, "0");
    let trxID = await dbuse.query(
      `INSERT INTO pricing (cabID,tglRequest,nomorPricing,kodePartner,oleh, salesID) VALUES (?,?,?,?,?,?)`,
      [
        hPR.cabID,
        hd.tglRequest,
        hPR.nomorPricing,
        hd.kodePartner,
        hPR.oleh,
        salesID,
      ]
    );
    let col = await det.map((a) => {
      let u = a;
      u.idPrice = trxID.insertId;
      u.nomorPricing = hPR.nomorPricing;
      return u;
    });
    let st = [
      "kodeProduk",
      "qty",
      "hpp",
      "nomorPricing",
      "hargaJual",
      "jmlKemasan",
      "hargaKemasan",
      "kemasan",
    ];
    //  let val = await col.map(a => Object.values(a))
    let val = col.map((a) => {
      let u = [];
      for (let i in st) {
        a[st[i]] == undefined ? u.push("0") : u.push(a[st[i]]);
      }
      return u;
    });

    dbuse
      .batch(
        `INSERT INTO detPricing (kodeProduk,qty, hpp,nomorPricing, hargaJual, jmlKemasan, hargaKemasan, kemasan ) VALUES (?,?,?,?,?,? ,? ,?)`,
        val
      )
      .then((rows) => res.send({ st: "Sukses..." }))
      .catch((err) => {
        console.log(err);
        res.status(401).send({ st: "Tidak diijinkan..." });
        // throw new error(err)
      });
  } catch (err) {
    console.log(err);
    res.status(500).send({ st: "cek data..." });
  }
});

app.post("/dtpricing", (req, res) => {
  let user = req.user.dtAkun;
  let { x } = req.body;
  let kodeCab = ["MAN", "acc", "purchase"].some((a) => a == user.userType)
    ? x.kodeCab
    : [user.kodeCab];
  dbuse
    .query(
      {
        dateStrings: true,
        sql: `SELECT p.*, cl.namaPartner, cl.alamat, cl.tlp, cl.namaPIC, COALESCE(det.totalHarga,0) AS totalHarga,
    u.namaKaryawan AS namaSales, u.email, u.telp, cc.point
    FROM pricing p
      LEFT JOIN partner cl ON p.kodePartner=cl.kodePartner
      LEFT JOIN CustCat cc ON cl.catPartner = cc.idCustCat
      LEFT JOIN karyawan u ON u.kodeKar = p.salesID
      LEFT JOIN (
        SELECT SUM(dp.hargaJual * dp.jmlKemasan) AS totalHarga, dp.nomorPricing
          FROM detPricing dp LEFT JOIN pricing on dp.nomorPricing= pricing.nomorPricing
          WHERE pricing.cabID IN (?)
          GROUP BY pricing.nomorPricing
      ) det ON det.nomorPricing = p.nomorPricing
      WHERE p.cabID IN (?)
      ORDER BY p.tglRequest DESC`,
      },
      [kodeCab, kodeCab]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      //      throw new Error(err)
      console.log(err);
      res.status(500).send({ st: "ndak nemu..." });
    });
});

app.post("/rkpPricing", (req, res) => {
  let user = req.user.dtAkun;
  let { x } = req.body;
  let kodeCab = ["MAN", "acc", "purchase"].some((a) => a == user.userType)
    ? x.kodeCab
    : [user.kodeCab];
  dbuse
    .query(
      {
        dateStrings: true,
        sql: `SELECT p.nomorPricing, t.nomorBukti, p.status
    FROM pricing p
      LEFT JOIN transaksi t ON t.nomorPricing = p.nomorPricing AND t.status != 'B'
      WHERE p.cabID IN (?) AND p.tglRequest BETWEEN ? AND ? AND p.status != 'Batal'
      ORDER BY p.tglRequest DESC`,
      },
      [kodeCab, x.tgla, x.tglb]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      //      throw new Error(err)
      console.log(err);
      res.status(500).send({ st: "ndak nemu..." });
    });
});
app.get("/detPricing", (req, res) => {
  const x = JSON.parse(req.query.key);
  dbuse
    .query(
      {
        namedPlaceholders: true,
        sql: `SELECT d.*, nb.*, (IF(d.hpp > 0, d.hpp, IF(s.${x.cabID} > 0, s.${x.cabID}, hg.${x.cabID})) * d.qty) AS jmlHPP, s.${x.cabID} AS stok,
      pc.produkCategory, m.namaMerk, nm.*, COALESCE(k.kirim, 0) AS kirim FROM detPricing d
      LEFT JOIN produk nb ON d.kodeProduk= nb.kodeProduk
      LEFT JOIN hargaGrosir hg on hg.kodeProduk= d.kodeProduk
      LEFT JOIN merk m ON nb.kodeMerk=m.kodeMerk
      LEFT JOIN produkCat pc ON nb.kodeCat = pc.kodeCat
      LEFT JOIN namaBarang nm ON nm.kodeProduk=d.kodeProduk
      LEFT JOIN stock s ON s.kodeProduk=d.kodeProduk
      LEFT JOIN (
        SELECT d.kodeProduk, SUM(d.jmlKemasan) AS kirim, JSON_QUERY(kemasan, '$') AS kemasan
        FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
        WHERE t.nomorPricing=:nomorPricing AND t.status != 'B'
        GROUP BY d.kodeProduk
      ) k ON k.kodeProduk=d.kodeProduk
    WHERE nomorPricing = :nomorPricing
    ORDER BY pc.device DESC, nb.kodeCat, m.namaMerk`,
      },
      x
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(401).send({ st: "Tidak diijinkan..." });
      // throw new error(err)
    });
});

app.post("/editpricedet", (req, res) => {
  let { x } = req.body;
  x.kemasan = JSON.stringify(x.kemasan) || '{"isi":"1","kemasan":"Pcs"}';
  dbuse
    .query(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO detPricing (nomorPricing, kodeProduk, qty, hpp, hargaJual, iddetPricing, kemasan, jmlKemasan, hargaKemasan)
      VALUES (:nomorPricing, :kodeProduk, :qty, :hpp, :hargaJual, :iddetPricing, :kemasan, :jmlKemasan, :hargaKemasan)
    ON DUPLICATE KEY UPDATE qty= :qty, hpp= :hpp, hargaJual= :hargaJual, setuju = :setuju, ket= :ket, kemasan = :kemasan, jmlKemasan= :jmlKemasan, hargaKemasan= :hargaKemasan`,
      },
      x
    )
    .then((rows) => res.send({ st: "Sukses...", id: rows.insertId }))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Tidak diijinkan..." });
    });
});

app.post("/delpricedet", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(`DELETE FROM detPricing WHERE iddetPricing=?`, [x.iddetPricing])
    .then((rows) => res.send({ st: "Sukses..." }))
    .catch((err) => {
      console.log(err);
      res.status(401).send({ st: "Tidak diijinkan..." });
      // throw new error(err)
    });
});

// Kongsi
app.post("/addKongsi", async (req, res) => {
  let { hd, det } = req.body.x;
  let user = req.user.dtAkun;
  let hPR = {};
  hPR.tglKirim = hd.tglKirim || new Date();
  hPR.cabID = req.user.dtAkun.kodeCab; // nko diambil soko session user e
  hPR.oleh = req.user.dtAkun.akun;
  let salesID = req.user.dtAkun.eID;
  try {
    let urt = hd.tglKirim.replace(/-/gi, "");
    let cr = hPR.cabID + "KG" + urt.slice(4, 6) + urt.slice(2, 4);
    let [nomPR] = await dbuse.query(
      `SELECT COUNT(t.nomorKongsi) AS nom FROM kongsi t WHERE t.nomorKongsi like '${cr}%'`,
      [cr]
    );
    hPR.nomorKongsi = cr + String(parseInt(nomPR.nom) + 1).padStart(6, "0");
    let trxID = await dbuse.query(
      `INSERT INTO kongsi (cabID,tglKirim,nomorKongsi,kodePartner,oleh, salesID) VALUES (?,?,?,?,?,?)`,
      [
        req.user.dtAkun.kodeCab,
        hd.tglKirim,
        hPR.nomorKongsi,
        hd.kodePartner,
        hPR.oleh,
        salesID,
      ]
    );
    let col = await det.map((a) => {
      let u = a;
      u.idKongsi = trxID.insertId;
      u.nomorKongsi = hPR.nomorKongsi;
      return u;
    });
    let st = ["kodeProduk", "qty", "hargaJual", "hpp", "nomorKongsi"];
    //  let val = await col.map(a => Object.values(a))
    let val = col.map((a) => {
      let u = [];
      for (let i in st) {
        a[st[i]] == undefined ? u.push("0") : u.push(a[st[i]]);
      }
      return u;
    });
    dbuse
      .batch(
        `INSERT INTO detKongsi (kodeProduk,qty, hargaJual, hpp,nomorKongsi) VALUES (?,?,?,?,?)`,
        val
      )
      .then((rows) => res.send({ st: "Sukses..." }))
      .catch((err) => {
        console.log(err);
        res.status(401).send({ st: "Tidak diijinkan..." });
        // throw new error(err)
      });
  } catch (err) {
    console.log(err);
    res.status(500).send({ st: "cek data..." });
  } finally {
    let a = await dbuse.query(
      `INSERT INTO userLog (nomorBukti, jnsLog, akun, deskripsi) VALUES 
      (?, 'addKongsi', ?, 'Kirim kongsi ke ${hd.kodePartner}')`,
      [hPR.nomorKongsi, user.akun]
    );
  }
});

app.post("/rkpKongsi", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(
      `SELECT d.*, h.${x.kodeCab} AS hpp, SUM(d.qty) AS jmlQty, nb.namaBarang,COALESCE(k.kirim, 0) AS kirim,p.kodePartner,
    p.cabID, cust.namaPartner, nb.akunPersediaan, nb.akunHpp, cc.point, nb.pointMember
  FROM detKongsi d LEFT JOIN namaBarang nb ON d.kodeProduk=nb.kodeProduk
  LEFT JOIN kongsi p ON d.nomorKongsi=p.nomorKongsi
  LEFT JOIN partner cust ON cust.kodePartner=p.kodePartner
  LEFT JOIN CustCat cc ON cc.idCustCat = cust.catPartner
  LEFT JOIN hpp h ON h.kodeProduk=d.kodeProduk
  LEFT JOIN (
    SELECT d.kodeProduk, SUM(d.qty) AS kirim, t.kodePartner
    FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
    WHERE t.asal IN (?) AND t.status != 'B' AND t.pjKongsi = 'Y'
    GROUP BY d.kodeProduk, t.kodePartner
  ) k ON k.kodeProduk=d.kodeProduk AND k.kodePartner = p.kodePartner
  WHERE p.cabID IN (?)
  GROUP BY d.kodeProduk, p.kodePartner`,
      [x.kodeCab, x.kodeCab]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Belum ada data..." });
      // throw new error(err)
    });
});

app.post("/dataKongsi", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT k.*, c.namaPartner, e.namaKaryawan
    FROM kongsi k LEFT JOIN partner c ON k.kodePartner = c.kodePartner
      LEFT JOIN karyawan e ON e.kodeKar = k.salesID
    WHERE k.cabID IN (:kodeCab)`,
      },
      x
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Belum ada data..." });
      // throw new error(err)
    });
});

app.get("/detKongsi?", (req, res) => {
  let x = req.query.key;
  dbuse
    .query(
      `SELECT d.*, nb.namaBarang FROM detKongsi d
    LEFT JOIN namaBarang nb ON d.kodeProduk = nb.kodeProduk
  WHERE d.nomorKongsi = ?`,
      [x]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Belum ada data..." });
      // throw new error(err)
    });
});

app.post("/addPO", async (req, res) => {
  let { hd, det } = req.body.x;
  let user = req.user.dtAkun;
  let hPR = {};
  hPR.tglRequest = hd.tglRequest;
  hPR.cabID = hd.cabID || req.user.dtAkun.kodeCab; // nko diambil soko session user e
  hPR.oleh = hPR.salesID ? hPR.salesID : req.user.dtAkun.eID;
  let salesID = hPR.salesID ? hPR.salesID : req.user.dtAkun.eID;
  try {
    let urt = hd.tglRequest.replace(/-/gi, "");
    let cr = hPR.cabID + "52" + urt.slice(4, 6) + urt.slice(2, 4);
    let nomPR = await dbuse.query(
      `SELECT COUNT(t.nomorPO) AS nom FROM PO t WHERE t.nomorPO like '${cr}%'`,
      [cr]
    );
    hPR.nomorPO = cr + String(parseInt(nomPR[0].nom) + 1).padStart(6, "0");
    let trxID = await dbuse.query(
      `INSERT INTO PO (cabID,tglRequest,nomorPO,kodePartner,oleh, salesID) VALUES (?,?,?,?,?,?)`,
      [hPR.cabID, hd.tglRequest, hPR.nomorPO, hd.kodePartner, hPR.oleh, salesID]
    );
    let col = await det.map((a) => {
      let u = a;
      u.idPO = trxID.insertId;
      u.nomorPO = hPR.nomorPO;
      return u;
    });
    let st = ["kodeProduk", "qty", "nomorPO", "hargaJual"];
    //  let val = await col.map(a => Object.values(a))
    let val = col.map((a) => {
      let u = [];
      for (let i in st) {
        a[st[i]] == undefined ? u.push("0") : u.push(a[st[i]]);
      }
      return u;
    });
    dbuse
      .batch(
        `INSERT INTO detPO (kodeProduk,qty,nomorPO, hargaJual) VALUES (?,?,?,?)`,
        val
      )
      .then((rows) => res.send({ st: "Sukses...", nomorPO: hPR.nomorPO }))
      .catch((err) => {
        console.log(err);
        res.status(401).send({ st: "Tidak diijinkan..." });
        // throw new error(err)
      });
  } catch (err) {
    console.log(err);
    res.status(500).send({ st: "cek data..." });
  } finally {
    let a = await dbuse.query(
      `INSERT INTO userLog (nomorBukti, jnsLog, akun, deskripsi) VALUES 
      (?, 'addPO', ?, 'Buat Pesanan')`,
      [hPR.nomorPO, user.akun]
    );
  }
});

app.post("/detpo", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(
      `SELECT d.*, nb.namaBarang, nb.satuan, nb.kodeCat
  FROM detPO d LEFT JOIN namaBarang nb ON d.kodeProduk=nb.kodeProduk
  LEFT JOIN hpp h ON d.kodeProduk=h.kodeProduk
  WHERE d.nomorPO=?`,
      [x.nomorPO]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(401).send({ st: "Tidak diijinkan..." });
      // throw new error(err)
    });
});
app.post("/delpodet", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(`DELETE FROM detPO WHERE iddetPO=?`, [x.iddetPO])
    .then((rows) => res.send({ st: "Sukses..." }))
    .catch((err) => {
      console.log(err);
      res.status(401).send({ st: "Tidak diijinkan..." });
      // throw new error(err)
    });
});

app.post("/editpodet", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO detPO (nomorPO, kodeProduk, qty, hargaJual, iddetPO) VALUES (:nomorPO, :kodeProduk, :qty, :hargaJual, :iddetPO)
    ON DUPLICATE KEY UPDATE qty=:qty, hargaJual=:hargaJual`,
      },
      x
    )
    .then((rows) => res.send({ st: "Sukses...", id: rows.insertId }))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Tidak diijinkan..." });
    });
});
app.post("/rekpo", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(
      `SELECT d.*, nb.namaBarang,k.kirim,p.kodePartner, p.cabID, cust.namaPartner,nb.kodeCat,
    s.${x.cabID} AS stok, b.kodeBOM, nb.akunPersediaan, nb.akunHpp, cc.point, nb.pointMember
  FROM detPO d LEFT JOIN namaBarang nb ON d.kodeProduk=nb.kodeProduk
  LEFT JOIN PO p ON d.nomorPO=p.nomorPO
  LEFT JOIN stock s ON d.kodeProduk=s.kodeProduk
  LEFT JOIN BOM b ON d.kodeProduk=b.kodeProduk
  LEFT JOIN partner cust ON cust.kodePartner=p.kodePartner
  LEFT JOIN CustCat cc ON cc.idCustCat = cust.catPartner
  LEFT JOIN (
    SELECT d.kodeProduk, SUM(d.qty) AS kirim
    FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
    WHERE t.nomorPO=? AND t.status != 'B'
    GROUP BY d.kodeProduk
  ) k ON k.kodeProduk=d.kodeProduk
  WHERE d.nomorPO=?
  GROUP BY d.kodeProduk`,
      [x.nomorPO, x.nomorPO]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(401).send({ st: "Tidak diijinkan..." });
      // throw new error(err)
    });
});

app.post("/upPO", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(`UPDATE PO SET statusPO=? WHERE nomorPO=?`, [x.statusPO, x.nomorPO])
    .then((rows) => res.send({ st: `Nomor PO ${x.nomorPO} updated...` }))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Belum tersimpan..." });
      // throw new error(err)
    });
});

app.post("/rekpr", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(
      `SELECT d.*, nb.namaBarang,k.kirim,p.kodePartner,
    p.cabLain AS cabID, p.cabID AS cabLain
  FROM detPR d LEFT JOIN namaBarang nb ON d.kodeProduk=nb.kodeProduk
  LEFT JOIN PR p ON d.nomorPR=p.nomorPR
  LEFT JOIN (
    SELECT d.kodeProduk, SUM(d.qty) AS kirim
    FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
    WHERE t.nomorPR=? AND t.status != 'B'
    GROUP BY d.kodeProduk
  ) k ON k.kodeProduk=d.kodeProduk
  WHERE d.nomorPR=?`,
      [x.nomorPR, x.nomorPR]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(401).send({ st: "Tidak diijinkan..." });
      // throw new error(err)
    });
});

app.post("/cekPR", admin, (req, res) => {
  let { x } = req.body;
  dbuse
    .query(
      `SELECT d.iddetTrans,d.nomorBukti, d.kodeProduk, d.qty, DATE_FORMAT(t.tglKirim,'%Y-%m-%d') AS tglKirim,
    t.kodePartner,t.status,p.namaPartner, pd.namaProduk,t.nomorPR
    FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
      LEFT JOIN partner p ON p.kodePartner=t.kodePartner
      LEFT JOIN produk pd ON d.kodeProduk=pd.kodeProduk
    WHERE t.nomorPR=?`,
      [x.nomorPR]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(401).send({ st: "Tidak diijinkan..." });
      // throw new error(err)
    });
});

app.post("/cekPR", admin, (req, res) => {
  let { x } = req.body;
  dbuse
    .query(
      `SELECT d.iddetTrans,d.nomorBukti, d.kodeProduk, d.qty, DATE_FORMAT(t.tglKirim,'%Y-%m-%d') AS tglKirim,
    t.kodePartner,t.status,p.namaPartner, pd.namaProduk,t.nomorPR
    FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
      LEFT JOIN partner p ON p.kodePartner=t.kodePartner
      LEFT JOIN produk pd ON d.kodeProduk=pd.kodeProduk
    WHERE t.nomorPR=?`,
      [x.nomorPR]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(401).send({ st: "Tidak diijinkan..." });
      // throw new error(err)
    });
});

app.post("/delprdet", (req, res) => {
  let { x } = req.body;
  dbuse
    .query("DELETE FROM detPR WHERE iddetPR=?", [x.iddetPR])
    .then((rows) =>
      res.send({ st: `Detail ${x.kodeProduk} dihapus dari PR : ${x.nomorPR}` })
    )
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Tidak ditemukan..." });
    });
});

app.post("/editprdet", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO detPR (nomorPR, kodeProduk, qty, iddetPR)
    VALUES (:nomorPR, :kodeProduk, :qty, :iddetPR)
    ON DUPLICATE KEY UPDATE qty= :qty`,
      },
      x
    )
    .then((rows) => {
      res.send({ st: "Tersimpan", id: rows.insertId });
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Gagal... " });
    });
});
app.post("/upPR", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(`UPDATE PR SET statusPR=?, cabLain=?, ac = ? WHERE nomorPR=?`, [
      x.statusPR,
      x.cabLain,
      x.ac,
      x.nomorPR,
    ])
    .then((rows) => res.send({ st: `Nomor PR ${x.nomorPR} updated...` }))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Belum tersimpan..." });
      // throw new error(err)
    });
});

app.get("/expartner", (req, res) => {
  dbuse
    .query("SELECT * FROM partner WHERE jnsPartner='Exp' Order By namaPartner")
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(401).send({ st: "Tidak diijinkan..." });
      // throw new error(err)
    });
});

const storageSPK = multer.diskStorage({
  destination: function (req, file, cb) {
    // console.log(req)
    cb(null, path.join(__dirname, "/SPK"));
  } /* ,
  filename: function (req, file, cb) {
    // console.log(req)
    console.log(file)
    cb(null, `${req.user.dtAkun[0].NPSN}__${new Date().getTime()}.${file.originalname.split('.')[1]}`)
  } */,
});
const uploadSPKfile = multer({ storage: storageSPK });

app.get("/spkFile?", (req, res) => {
  const x = req.query.key;
  console.log(req.query);
  const logo = path.join(__dirname, "SPK");
  if (fs.existsSync(`${logo}/${x}`)) {
    // res.download(`${logo}/${x.fileName}`)
    res.sendFile(`${x}`, {
      root: path.join(__dirname, "SPK"),
    });
  } else {
    res.status(410).send({ st: "Belum ada lampiran... " });
  }
});
app.post("/uploadBukti", uploadSPKfile.single("spkFile"), async (req, res) => {
  let hd = req.body.x ? req.body.x.hd : JSON.parse(req.body.hd);
  hd.filename = req.file.filename;
  hd.mimetype = req.file.mimetype;
  hd.originalname = req.file.originalname;
  try {
    await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `UPDATE transaksi SET spkFile = :filename, mimetype = :mimetype, originalname= :originalname
      WHERE nomorBukti = :nomorBukti`,
      },
      hd
    );
    res.send({ st: "Bukti tersimpan..." });
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum ada lampiran... " });
  }
});

app.post("/jualbeli", uploadSPKfile.single("spkFile"), async (req, res) => {
  let spkFile = req.file
    ? req.file
    : { filename: null, originalname: null, mimetype: null };
  // console.log(req.file)
  let hd = req.body.x ? req.body.x.hd : JSON.parse(req.body.hd);
  let det = req.body.x ? req.body.x.det : JSON.parse(req.body.det);
  let exp = req.body.x ? req.body.x.exp : JSON.parse(req.body.exp);
  let pot = req.body.x ? req.body.x.pot : JSON.parse(req.body.pot);
  let logBukti;
  det.map((a) => {
    a.SN = a.SN || [];
    return a;
  });
  hd.nomorPricing = hd.nomorPricing || null;
  hd.judulTransaksi = hd.judulTransaksi || null;
  hd.note = hd.note || null;
  let eID = req.user.dtAkun.eID;
  let tempo = hd.tempo ? hd.tempo : 0;
  let biaya = exp.biaya || 0;
  let totalDPP = det.reduce((s, m) => jumlah([s, m.dpp]), 0);
  if (totalDPP <= 0) {
    totalDPP = 1;
  }
  hd.cabID = ["MAN", "purchase", "acc"].some(
    (a) => a === req.user.dtAkun.userType
  )
    ? hd.cabID
    : req.user.dtAkun.kodeCab;
  let cabID = hd.ac === "Y" && hd.jnsTrx === "B" ? hd.cabLain : hd.cabID;
  let cabLain = hd.ac === "Y" && hd.jnsTrx === "B" ? hd.cabID : hd.cabLain;
  //  hd.salesID = req.user.dtAkun.eID
  // console.log(hd.cabID,cabID)
  let nomorPO = hd.nomorPO || "";
  hd.noreffRetur = hd.noBukti ? hd.noBukti : "";
  hd.ppn = hd.ppn || "no";
  let dpp, ppn;
  switch (hd.ppn) {
    case "in":
      dpp = ":jmlKemasan * :hargaKemasan / 1.11";
      ppn =
        ":jmlKemasan * :hargaKemasan - (:jmlKemasan * :hargaKemasan / 1.11)";
      break;
    case "ex":
      ppn = ":jmlKemasan * :hargaKemasan * 0.11";
      dpp = ":jmlKemasan * :hargaKemasan";
      break;
    default:
      ppn = 0;
      dpp = ":jmlKemasan * :hargaKemasan";
  }
  let point = hd.jnstrx === "J" && hd.point === "Y" ? 0.01 : 0;
  if (hd.jnsTrx === "J" || hd.jnsTrx === "RB") {
    hd.asal = ["MAN", "purchase", "acc"].some(
      (a) => a === req.user.dtAkun.userType
    )
      ? cabID
      : req.user.dtAkun.kodeCab;
    hd.tujuan = hd.cabLain ? hd.cabLain : "";
  } else if (hd.jnsTrx === "B" || hd.jnsTrx === "RJ") {
    hd.tujuan = ["MAN", "purchase", "acc"].some(
      (a) => a === req.user.dtAkun.userType
    )
      ? hd.cabID
      : req.user.dtAkun.kodeCab;
    hd.asal = hd.ac === "Y" ? hd.cabLain : "";
  }
  let nomorPR = hd.nomorPR ? hd.nomorPR : "";
  hd.tglKirim = hd.tgl;
  hd.pjKongsi = hd.pjKongsi || null;
  hd.ecommerce = hd.ecommerce || null;
  hd.tokoOnline = hd.tokoOnline || "";
  try {
    let urt = hd.tglKirim.replace(/-/gi, "");
    let jn = hd.jnsTrx === "J" || hd.jnsTrx === "RB" ? "44" : "53";
    let cr = cabID + jn + urt.slice(4, 6) + urt.slice(2, 4);
    let nomJB = await dbuse.query(
      `SELECT COUNT(t.nomorBukti) AS nom FROM transaksi t WHERE ISNULL(t.jn) AND t.nomorBukti like '${cr}%'`,
      [cr]
    );
    hd.nomorBukti = cr + String(parseInt(nomJB[0].nom) + 1).padStart(6, "0");
    if (hd.ac === "Y") {
      // antar cabang
      let trxac = hd.jnsTrx === "B" ? "J" : hd.jnsTrx;
      var trxID = await dbuse.query(
        `INSERT INTO transaksi (cabID,tglKirim,nomorBukti,salesID,asal,tujuan,jnsTrx,status,ac,ct,tempo,nomorPR,noreffRetur,ongkir,akunBayar,kurir,ppn,pot,judulTransaksi, ancab, note)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          cabID,
          hd.tglKirim,
          hd.nomorBukti,
          hd.salesID,
          hd.asal,
          hd.tujuan,
          trxac,
          hd.status,
          "N",
          hd.ct,
          tempo,
          nomorPR,
          hd.noreffRetur,
          hd.ongkir,
          hd.akunBayar,
          hd.kurir,
          hd.ppn,
          hd.pot,
          hd.judulTransaksi,
          "Y",
          hd.note,
        ]
      );
    } else {
      // vendor / cust 24
      var trxID = await dbuse.query(
        `INSERT INTO transaksi (cabID,tglKirim,nomorBukti,salesID,kodePartner,jnsTrx,status,asal,tujuan,ct,tempo,nomorPR,noreffRetur,ongkir,akunBayar,kurir,ppn,pot,nomorPO, note, nomorPricing, judulTransaksi, pjKongsi, spkFile, mimetype, originalname, ecommerce, tokoOnline)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, ?,?,?,?,?)`,
        [
          cabID,
          hd.tglKirim,
          hd.nomorBukti,
          hd.salesID,
          hd.kodePartner,
          hd.jnsTrx,
          hd.status,
          hd.asal,
          hd.tujuan,
          hd.ct,
          tempo,
          nomorPR,
          hd.noreffRetur,
          hd.ongkir,
          hd.akunBayar,
          hd.kurir,
          hd.ppn,
          hd.pot,
          nomorPO,
          hd.note,
          hd.nomorPricing,
          hd.judulTransaksi,
          hd.pjKongsi,
          spkFile.filename,
          spkFile.mimetype,
          spkFile.originalname,
          hd.ecommerce,
          hd.tokoOnline,
        ]
      );
    }
    let col = await det.map((a) => {
      let u = a;
      u.trxID = trxID.insertId;
      u.nomorBukti = hd.nomorBukti;
      return u;
    });
    let st =
      hd.jnsTrx === "B"
        ? [
            "trxID",
            "nomorBukti",
            "kodeProduk",
            "qty",
            "jmlHarga",
            "ppn",
            "dpp",
            "dpp",
            "keterangan",
            "jmlKemasan",
            "kemasan",
            "hargaKemasan",
          ]
        : [
            "trxID",
            "nomorBukti",
            "kodeProduk",
            "qty",
            "jmlHarga",
            "ppn",
            "dpp",
            "dpp",
            "keterangan",
            "hpp",
            "jmlPoint",
            "jmlKemasan",
            "kemasan",
            "hargaKemasan",
            "SN",
          ];
    //  let val = await col.map(a => Object.values(a))
    /* let val = col.map(a => {
      let u = []
      for (let i in st) {
        a[st[i]] == undefined ? u.push('0') : u.push(a[st[i]])
      }
      return u
    }) */
    exp.nomorBukti = hd.nomorBukti;
    exp.kodeCab = cabID;
    if (exp.biaya > 0) {
      dbuse.query(
        {
          namedPlaceholders: true,
          sql: "INSERT INTO expedisi (kodeCab, partnerID,biaya,nomorBukti) VALUES (:kodeCab, :partnerID,:biaya,:nomorBukti)",
        },
        exp
      );
    }
    if (hd.pot === "Y") {
      let inPot = await dbuse.query(
        `INSERT INTO potonganHarga (nomorBukti, akunDiskon, diskon, jnsTrx)
          VALUES (?,?,?,?)`,
        [hd.nomorBukti, pot.akunDiskon, pot.diskon, hd.jnsTrx]
      );
    }
    /* let inDet = hd.jnsTrx === 'B' ? `INSERT INTO detTrans
    (trxID,nomorBukti,kodeProduk,qty,jmlHarga,ppn,dpp,ongkir,keterangan, jmlKemasan, kemasan, hargaKemasan, hpp)
      VALUES (?,?,?,?,?,?,?,?/${totalDPP} * ${biaya} ,?,?,?,?,dpp + ongkir)`
      : `INSERT INTO detTrans (trxID,nomorBukti,kodeProduk,qty,jmlHarga,ppn,dpp,ongkir,keterangan, hpp, jmlPoint, jmlKemasan, kemasan, hargaKemasan, SN)
      VALUES (?,?,?,?,?,?,?,?/${totalDPP} * ${biaya} ,?,?,?,?,?,?, ?)`
    dbuse.batch(inDet, val) */
    let inDet =
      hd.jnsTrx === "B"
        ? `INSERT INTO detTrans
    (trxID,nomorBukti,kodeProduk,qty,jmlHarga,ppn,dpp,ongkir,keterangan, jmlKemasan, kemasan, hargaKemasan, hpp)
      VALUES (:trxID,:nomorBukti,:kodeProduk,:jmlKemasan * JSON_VALUE(:kemasan, '$.isi'),:jmlKemasan * :hargaKemasan, ${ppn},
      ${dpp}, :jmlHarga / ${totalDPP} * ${biaya},:keterangan,:jmlKemasan,:kemasan,:hargaKemasan, dpp + ongkir)`
        : `INSERT INTO detTrans (trxID,nomorBukti,kodeProduk,qty,jmlHarga,ppn,dpp,ongkir,keterangan, hpp, jmlPoint, jmlKemasan, kemasan, hargaKemasan, SN)
      VALUES (:trxID,:nomorBukti,:kodeProduk,:jmlKemasan * JSON_VALUE(:kemasan, '$.isi'),:jmlKemasan * :hargaKemasan, ${ppn},
      ${dpp}, :jmlHarga / ${totalDPP} * ${biaya},:keterangan,qty * :hp, ${point} * (:jmlHarga * :pointMember), :jmlKemasan, :kemasan, :hargaKemasan, :SN)`;
    dbuse
      .batch(
        {
          namedPlaceholders: true,
          sql: inDet,
        },
        col
      )
      .then((rows) => {
        hd.cabID = cabID;
        hd.cabLain = cabLain;
        if (hd.status == "T") {
          trxTerima(hd, col, exp, pot);
          res.send({ st: "Sukses...", nomorBukti: hd.nomorBukti });
        } else {
          res.send({ st: "Sukses..." });
        }
      })
      .catch((err) => {
        console.log(err);
        // throw new error(err)
      });
    logBukti = hd.nomorBukti;
  } catch (err) {
    res.status(500).send({ st: "belum tersimpan..." });
    console.log(err);
  } finally {
    dbuse
      .query(
        `INSERT INTO userLog (jnsLog, waktu,akun,nomorBukti,deskripsi)
      VALUES ('${hd.jnsTrx}',NOW(),'${req.user.dtAkun.akun}','${logBukti}','Input transaksi')`
      )
      .catch((err) => {
        console.log(err);
      });
  }
});

app.post("/editDetJB", async (req, res) => {
  let { x } = req.body;
  let hasil;
  try {
    let sql;
    switch (x.act) {
      case "hps":
        sql = `DELETE FROM detTrans WHERE iddetTrans=:iddetTrans`;
        break;
      default:
        sql = `INSERT INTO detTrans (nomorBukti,kodeProduk,qty,jmlHarga,dpp,ppn,ongkir,hpp,keterangan, jmlPoint, kemasan, jmlKemasan, hargaKemasan)
          VALUES (:nomorBukti,:kodeProduk,:jmlKemasan * JSON_VALUE(:kemasan, '$.isi'), :jmlKemasan * :hargaKemasan,:dpp,:ppn,:ongkir,qty * :hp,:keterangan, :jmlPoint, :kemasan, :jmlKemasan, :hargaKemasan)`;
    }
    dbuse
      .query(
        {
          namedPlaceholders: true,
          sql: sql,
        },
        x
      )
      .then((rows) => {
        hasil = rows;
      });
  } catch (err) {
    console.log(err);
    res.status(410).send({ st: "Belum tersimpan..." });
  } finally {
    res.send({ st: "Tersimpan...", hasil });
    dbuse
      .query(
        `INSERT INTO userLog (jnsLog, waktu,akun,nomorBukti,deskripsi)
      VALUES ('ED',NOW(),'${req.user.dtAkun.akun}','${x.nomorBukti}','Edit ${x.act} detail transaksi')`
      )
      .catch((err) => {
        console.log(err);
      });
  }
});

app.post("/editjualbeli", async (req, res) => {
  let { hd, det, exp, pot } = req.body.x;
  // console.log(hd)
  let logBukti;
  let eID = req.user.dtAkun.eID;
  let tempo = hd.tempo ? hd.tempo : 0;
  let biaya = exp.biaya || 0;
  let totalDPP = det.reduce((s, m) => jumlah([s, m.dpp]), 0);
  hd.cabID = ["MAN", "purchase", "acc"].some(
    (a) => a === req.user.dtAkun.userType
  )
    ? hd.cabID
    : req.user.dtAkun.kodeCab;
  let cabID = hd.ac === "Y" && hd.jnsTrx === "B" ? hd.cabLain : hd.cabID;
  let cabLain = hd.ac === "Y" && hd.jnsTrx === "B" ? hd.cabID : hd.cabLain;
  //  hd.salesID = req.user.dtAkun.eID
  // console.log(hd.cabID,cabID)
  hd.noreffRetur = hd.noBukti ? hd.noBukti : "";
  hd.ppn = hd.ppn || "no";
  hd.ppn = hd.ppn || "no";
  let ppn, dpp;
  switch (hd.ppn) {
    case "in":
      dpp = ":jmlKemasan * :hargaKemasan / 1.11";
      ppn =
        ":jmlKemasan * :hargaKemasan - (:jmlKemasan * :hargaKemasan / 1.11)";
      break;
    case "ex":
      ppn = ":jmlKemasan * :hargaKemasan * 0.11";
      dpp = ":jmlKemasan * :hargaKemasan";
      break;
    default:
      ppn = 0;
      dpp = ":jmlKemasan * :hargaKemasan";
  }
  // let ppn = hd.ppn === 'in' ? 0.0991 : hd.ppn === 'ex' ? 0.11 : 0
  // let dpp = hd.ppn === 'in' ? 'jmlHarga - ppn' : 'jmlHarga'
  let point = hd.jnsTrx === "J" && hd.point === "Y" ? 0.01 : 0;
  hd.note = hd.note || null;
  if (hd.jnsTrx === "J" || hd.jnsTrx === "RB") {
    hd.asal = ["MAN", "purchase", "acc"].some(
      (a) => a === req.user.dtAkun.userType
    )
      ? cabID
      : req.user.dtAkun.kodeCab;
    hd.tujuan = hd.cabLain ? hd.cabLain : "";
  } else if (hd.jnsTrx === "B" || hd.jnsTrx === "RJ") {
    hd.tujuan = ["MAN", "purchase", "acc"].some(
      (a) => a === req.user.dtAkun.userType
    )
      ? hd.cabID
      : req.user.dtAkun.kodeCab;
    hd.asal = hd.ac === "Y" ? hd.cabLain : "";
  }
  let nomorPR = hd.nomorPR ? hd.nomorPR : "";
  hd.tglKirim = hd.tgl;
  try {
    // let urt = hd.tglKirim.replace(/-/gi,'')
    // let jn = (hd.jnsTrx ==='J' || hd.jnsTrx==='RB') ? '44' : '53'
    // let cr = cabID+jn+urt.slice(4,6)+urt.slice(2,4)
    // let nomJB = await dbuse.query(`SELECT COUNT(t.nomorBukti) AS nom FROM transaksi t WHERE ISNULL(t.jn) AND t.nomorBukti like '${cr}%'`,[cr])
    // hd.nomorBukti = cr+String(parseInt(nomJB[0].nom)+1).padStart(6,'0')
    if (hd.ac === "Y") {
      // antar cabang
      let trxac = hd.jnsTrx === "B" ? "J" : hd.jnsTrx;
      var trxID = await dbuse.query(
        `UPDATE transaksi SET tglKirim=?,asal=?,tujuan=?,ac=?,ct=?,tempo=?,akunBayar=?,ongkir=?,kurir=?,ppn=?, pot=?, salesID=?, note= ? WHERE nomorBukti=?`,
        [
          hd.tglKirim,
          hd.asal,
          hd.tujuan,
          "Y",
          hd.ct,
          tempo,
          hd.akunBayar,
          hd.ongkir,
          hd.kurir,
          hd.ppn,
          hd.pot,
          hd.salesID,
          hd.note,
          hd.nomorBukti,
        ]
      );
    } else {
      // vendor / cust
      var trxID = await dbuse.query(
        `UPDATE transaksi SET tglKirim=?,kodePartner=?,asal=?,tujuan=?,ct=?,tempo=?,akunBayar=?,ongkir=?,kurir=?,ppn=?, pot=?, salesID=?, walkIn= ?, note= ?  WHERE nomorBukti=?`,
        [
          hd.tglKirim,
          hd.kodePartner,
          hd.asal,
          hd.tujuan,
          hd.ct,
          tempo,
          hd.akunBayar,
          hd.ongkir,
          hd.kurir,
          hd.ppn,
          hd.pot,
          hd.salesID,
          hd.walkIn,
          hd.note,
          hd.nomorBukti,
        ]
      );
    }
    if (exp.biaya > 0) {
      dbuse
        .query(
          `INSERT INTO expedisi (kodeCab,nomorBukti,partnerID,biaya)
         VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE partnerID=?,biaya=?`,
          [
            cabID,
            hd.nomorBukti,
            exp.partnerID,
            exp.biaya,
            exp.partnerID,
            exp.biaya,
          ]
        )
        .catch((err) => {
          console.log(err);
        });
    }
    if (hd.pot === "Y") {
      dbuse
        .query(
          `INSERT INTO potonganHarga (diskon, akunDiskon,nomorBukti,jnsTrx)
        VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE diskon=?, akunDiskon=? `,
          [
            pot.diskon,
            pot.akunDiskon,
            hd.nomorBukti,
            hd.jnsTrx,
            pot.diskon,
            pot.akunDiskon,
          ]
        )
        .catch((err) => {
          console.log(err);
        });
    }
    for (let i in det) {
      let inDet;
      det[i].jmlPoint = hd.jnsTrx === "J" ? det[i].jmlPoint : 0;
      if (det[i].iddetTrans) {
        inDet =
          hd.jnsTrx === "B"
            ? `UPDATE detTrans SET qty=:jmlKemasan * JSON_VALUE(:kemasan, '$.isi'),jmlHarga=:jmlKemasan * :hargaKemasan,ppn=${ppn},
        dpp= ${dpp},ongkir= dpp/${totalDPP} * ${biaya},keterangan=:keterangan, hpp=dpp + ongkir,
          jmlKemasan = :jmlKemasan, hargaKemasan = :hargaKemasan, kemasan = :kemasan
            WHERE nomorBukti=:nomorBukti AND iddetTrans=:iddetTrans`
            : `UPDATE detTrans SET qty=:jmlKemasan * JSON_VALUE(:kemasan, '$.isi'),jmlHarga=:jmlKemasan * :hargaKemasan,ppn=${ppn},
          dpp= ${dpp} ,ongkir= dpp/${totalDPP} * ${biaya},keterangan=:keterangan, hpp= :jmlKemasan * JSON_VALUE(:kemasan, '$.isi') * :hp, jmlPoint= ${point} * (:jmlHarga * :pointMember),
            jmlKemasan = :jmlKemasan, hargaKemasan = :hargaKemasan, kemasan = :kemasan
            WHERE nomorBukti=:nomorBukti AND iddetTrans=:iddetTrans`;
      } else {
        inDet =
          hd.jnsTrx === "B"
            ? `INSERT INTO detTrans (nomorBukti,kodeProduk,qty,jmlHarga,ppn,dpp,ongkir,keterangan, hpp,
          jmlKemasan, hargaKemasan, kemasan)
              VALUES (:nomorBukti,:kodeProduk,:jmlKemasan * JSON_VALUE(:kemasan, '$.isi'),:jmlKemasan * :hargaKemasan, ${ppn},
              ${dpp}, jmlHarga /${totalDPP} * ${biaya},:keterangan,dpp + ongkir,
                :jmlKemasan, :hargaKemasan, :kemasan)`
            : `INSERT INTO detTrans (nomorBukti,kodeProduk,qty,jmlHarga,ppn,dpp,ongkir,keterangan, hpp, jmlPoint,
            jmlKemasan, hargaKemasan, kemasan)
                VALUES (:nomorBukti,:kodeProduk,:jmlKemasan * JSON_VALUE(:kemasan, '$.isi'),:jmlKemasan * :hargaKemasan, ${ppn},
                ${dpp}, :ongkir,:keterangan, qty * :hp,${point} * (:jmlHarga * :pointMember),
                  :jmlKemasan, :hargaKemasan, :kemasan)`;
      }
      dbuse
        .query(
          {
            namedPlaceholders: true,
            sql: inDet,
          },
          det[i]
        )
        .catch((err) => {
          console.log(err);
        });
    }
    logBukti = hd.nomorBukti;
  } catch (err) {
    res.status(500).send({ st: "belum tersimpan..." });
    console.log(err);
  } finally {
    res.send({ st: "Sukses..." });
    dbuse
      .query(
        `INSERT INTO userLog (jnsLog, waktu,akun,nomorBukti,deskripsi)
      VALUES ('${hd.jnsTrx}',NOW(),'${req.user.dtAkun.akun}','${logBukti}','Edit transaksi')`
      )
      .catch((err) => {
        console.log(err);
      });
  }
});
app.post("/gantiSales", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(
      {
        namedPlaceholders: true,
        sql: `UPDATE transaksi SET salesID = :salesBaru WHERE nomorBukti = :nomorBukti`,
      },
      x
    )
    .then((rows) =>
      res.send({
        st: `Ubah sales ${x.namaSales} menjadi ${x.namaSalesBaru} tersimpan...`,
      })
    )
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Ubah sales belum tersimpan..." });
    });
});
/* app.post('/jualbeli',async (req,res)=>{
  let { hd,det,exp } = req.body.x
  // console.log(hd)
  let logBukti
  let eID = req.user.dtAkun.eID
  let tempo = hd.tempo ? hd.tempo : 0
  hd.cabID = ['MAN','purchase'].some(a=> a===req.user.dtAkun.userType) ? hd.cabID : req.user.dtAkun.kodeCab
  let cabID = (hd.ac === 'Y' && hd.jnsTrx === 'B') ? hd.cabLain : hd.cabID
  let cabLain = (hd.ac === 'Y' && hd.jnsTrx === 'B') ? hd.cabID : hd.cabLain
//  hd.salesID = req.user.dtAkun.eID
  // console.log(hd.cabID,cabID)
  hd.noreffRetur = hd.noBukti ? hd.noBukti : ''
  if(hd.jnsTrx === 'J' || hd.jnsTrx === 'RB'){
    hd.asal = ['MAN','purchase'].some(a=> a===req.user.dtAkun.userType) ? cabID : req.user.dtAkun.kodeCab
    hd.tujuan = hd.cabLain ? hd.cabLain : ''
  } else if(hd.jnsTrx === 'B' || hd.jnsTrx === 'RJ'){
    hd.tujuan = ['MAN','purchase'].some(a=> a===req.user.dtAkun.userType) ? hd.cabID : req.user.dtAkun.kodeCab
    hd.asal = hd.ac==='Y' ? hd.cabLain : ''
  }
  nomorPR =  hd.nomorPR ? hd.nomorPR : ''
  hd.tglKirim = hd.tgl
  try{
    let urt = hd.tglKirim.replace(/-/gi,'')
    let jn = (hd.jnsTrx ==='J' || hd.jnsTrx==='RB') ? '44' : '53'
    let cr = cabID+jn+urt.slice(4,6)+urt.slice(2,4)
    let nomJB = await dbuse.query(`SELECT COUNT(t.nomorBukti) AS nom FROM transaksi t WHERE ISNULL(t.jn) AND t.nomorBukti like '${cr}%'`,[cr])
    hd.nomorBukti = cr+String(parseInt(nomJB[0].nom)+1).padStart(6,'0')
    if(hd.ac === 'Y'){
      // antar cabang
      let trxac = hd.jnsTrx === 'B' ? 'J' : hd.jnsTrx
      var trxID = await dbuse.query(`INSERT INTO transaksi (cabID,tglKirim,nomorBukti,salesID,asal,tujuan,jnsTrx,status,ac,ct,tempo,nomorPR,noreffRetur,ongkir,akunBayar,kurir) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [cabID,hd.tglKirim,hd.nomorBukti,hd.salesID,hd.asal,hd.tujuan,trxac,hd.status,'Y',hd.ct,tempo,nomorPR,hd.noreffRetur,hd.ongkir,hd.akunBayar,hd.kurir])
    }else{
      // vendor / cust
      var trxID = await dbuse.query(`INSERT INTO transaksi (cabID,tglKirim,nomorBukti,salesID,kodePartner,jnsTrx,status,asal,tujuan,ct,tempo,nomorPR,noreffRetur,ongkir,akunBayar,kurir) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [cabID,hd.tglKirim,hd.nomorBukti,hd.salesID,hd.kodePartner,hd.jnsTrx,hd.status,hd.asal,hd.tujuan,hd.ct,tempo,nomorPR,hd.noreffRetur,hd.ongkir,hd.akunBayar,hd.kurir])
    }
    let col = await det.map(a=>{
      let u = a
      u.trxID = trxID.insertId
      u.nomorBukti = hd.nomorBukti
      return u
    })
    let st = ['trxID','nomorBukti','kodeProduk','qty','jmlHarga','hpp','ppn','dpp','ongkir','keterangan']
  //  let val = await col.map(a => Object.values(a))
    let val = col.map(a =>{
      let u =[]
      for(let i in st){
        a[st[i]]==undefined ? u.push('0') : u.push(a[st[i]])
      }
      return u
    })
    console.log(val)
    exp.nomorBukti = hd.nomorBukti
    exp.kodeCab = cabID
    if( exp.biaya >0)
      dbuse.query({ namedPlaceholders: true, sql: "INSERT INTO expedisi (kodeCab, partnerID,biaya,nomorBukti) VALUES (:kodeCab, :partnerID,:biaya,:nomorBukti)" },exp)
    dbuse.batch(`INSERT INTO detTrans (trxID,nomorBukti,kodeProduk,qty,jmlHarga,hpp,ppn,dpp,ongkir,keterangan) VALUES (?,?,?,?,?,?,?,?,?,?)`,val)
      .then(rows=>{
        hd.cabID = cabID
        hd.cabLain = cabLain
        if(hd.status=='T'){
          trxTerima(hd,col,exp)
          res.send({st:'Sukses...'})
        }else{
          res.send({st:'Sukses...'})
        }
      })
      .catch(err=>{
        console.log(err)
        //throw new error(err)
      })
    logBukti = hd.nomorBukti
  }
  catch(err){
    res.status(500).send({st:'belum tersimpan...'})
    console.log(err)
  }
  finally{
    dbuse.query(`INSERT INTO userLog (jnsLog, waktu,akun,nomorBukti,deskripsi)
      VALUES ('${hd.jnsTrx}',NOW(),'${req.user.dtAkun.akun}','${logBukti}','Input transaksi')`)
      .catch(err =>{
        console.log(err)
      })
  }
}) */

app.post("/updetTrans", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(
      {
        namedPlaceholders: true,
        sql: `UPDATE detTrans SET keterangan=:keterangan WHERE iddetTrans=:iddetTrans`,
      },
      x
    )
    .then((rows) => {
      res.send({ st: "Sukses..." });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({ st: "belum tersimpan..." });
    });
});

app.post("/dtRetur", (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  let a = x.jnsTrx === "RB" ? "AND t.asal=?" : "AND t.tujuan=?"; // antar cabang
  let b =
    x.jnsTrx === "RB"
      ? "LEFT JOIN cabang ct ON t.tujuan = ct.kodeCab"
      : "LEFT JOIN cabang ct ON t.asal = ct.kodeCab";
  let cabID;
  switch (user.userType) {
    case "purchase":
    case "acc":
    case "MAN":
      cabID = x.kodeCab;
      break;
    case "admin":
      cabID = user.kodeCab;
      break;
    default:
      cabID = user.kodeCab;
      a =
        x.jnsTrx === "RB"
          ? "AND t.asal=? AND t.salesID=?"
          : "AND t.tujuan=? AND t.salesID=?";
  }

  dbuse
    .query(
      `SELECT t.*,DATE_FORMAT(t.tglKirim,'%Y-%m-%d') AS tglKirim, cb.kodeCab,
      cb.namaCabang,IF(t.ac='N',p.namaPartner, ct.namaCabang) AS namaPartner, e.biaya
    FROM transaksi t
    LEFT JOIN cabang cb ON t.cabID=cb.kodeCab
    ${b}
    LEFT JOIN expedisi e ON t.nomorBukti=e.nomorBukti
    LEFT JOIN partner p ON t.kodePartner=p.kodePartner
    WHERE (t.tglKirim BETWEEN ? AND ? OR t.status='W') ${a} AND (t.jnsTrx='RB' OR t.jnsTrx='RJ')
    ORDER BY t.tglKirim ASC`,
      [x.tgla, x.tglb, cabID, user.eID]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      //      throw new Error(err)
      console.log(err);
      res.status(500).send({ st: "ndak nemu..." });
    });
});

app.post("/dtTrx", (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  let kodeCab = ["MAN", "purchase", "acc"].some(
    (a) => a === req.user.dtAkun.userType
  )
    ? x.kodeCab
    : [user.kodeCab];
  let a = x.jnsTrx === "J" ? "AND t.asal IN (?)" : "AND t.tujuan IN (?)"; // antar cabang
  let b =
    x.jnsTrx === "J"
      ? "LEFT JOIN cabang ct ON t.tujuan = ct.kodeCab"
      : "LEFT JOIN cabang ct ON t.asal = ct.kodeCab";
  // let namaPartner = ['MAN', 'purchase', 'acc'].some(a => a === req.user.dtAkun.userType) || x.jnsTrx === 'J' ? `IF(t.ac='N',p.namaPartner, ct.namaCabang) AS namaPartner` : 'Pembelian'
  let cabID;
  switch (user.userType) {
    case "purchase":
    case "acc":
    case "MAN":
      cabID = x.kodeCab;
      break;
    case "admin":
    case "mitra":
    case "gudang":
      cabID = user.kodeCab;
      break;
    default:
      cabID = user.kodeCab;
      a =
        x.jnsTrx === "J"
          ? "AND t.asal IN (?) AND t.salesID= ?"
          : "AND t.tujuan IN (?) AND t.salesID=?";
  }
  dbuse
    .query(
      {
        dateStrings: true,
        sql: `SELECT SUM(d.dpp + d.ppn - COALESCE(rtr.hrgRetur,0)) AS totalHarga, SUM(d.jmlPoint) AS totalPoint, t.*,
      cb.kodeCab,
      cb.namaCabang,
      IF(p.namaPartner IS NOT NULL, p.namaPartner, ct.namaCabang) AS namaPartner, e.biaya,e.partnerID,
      IF(NOW() >= DATE_ADD(t.tglTerima, INTERVAL 7 DAY),'N','Y') AS garansi,
      pot.diskon, pot.akunDiskon, c.namaAkun AS namaAkunBayar,
      c.pembayaran,
      ep.namaPartner AS namaExpedisi, cb.telp, cb.alamatCabang,
      IF(t.ac='N',p.alamat, ct.alamatCabang) AS alamat,
      IF(t.ac='N',p.tlp, ct.telp) AS tlp,
      COALESCE(p.telpPIC, NULL) AS telpPIC,
      IF(t.ac = 'Y', 'ASI', cust.jenisCust) AS kategoriCust,
      pr.keterangan AS ketPR, kr.namaKaryawan AS namaSales,
      (SUM(d.dpp + d.ppn + (IF(t.ongkir = 'Y', d.ongkir, 0))) - COALESCE(pot.diskon,0) - COALESCE(rtr.hrgRetur,0)) AS totalAkhir,
      COALESCE(rtr.qty, 0) AS jmlRetur, COALESCE(rtr.hrgRetur,0) AS hrgRetur,
      IF(t.status IN ('W','D'), 'A', 'T') AS urt,
      cust.point,
      t.nomorPO, t.nomorPR, DATE_ADD(t.tglKirim, INTERVAL t.tempo DAY) AS tglTempo, t.spkFile, t.note, DATE_FORMAT(t.tglKirim, '%Y-%m') AS Monthly, CONCAT(YEAR(t.tglKirim), ' Q',QUARTER(t.tglKirim)) AS Quarter, CONCAT(YEAR(t.tglKirim), ' S',IF(MONTH(t.tglKirim) < 7, 1, 2)) AS Semester
    FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
    LEFT JOIN cabang cb ON t.cabID=cb.kodeCab
    ${b}
    LEFT JOIN expedisi e ON t.nomorBukti=e.nomorBukti
    LEFT JOIN partner ep ON e.partnerID=ep.kodePartner
    LEFT JOIN partner p ON t.kodePartner=p.kodePartner
    LEFT JOIN CustCat cust ON cust.idCustCat = p.catPartner
    LEFT JOIN karyawan kr ON kr.kodeKar=t.salesID
    LEFT JOIN potonganHarga pot ON t.nomorBukti=pot.nomorBukti
    LEFT JOIN COA c ON c.kodeAkun=t.akunBayar
    LEFT JOIN PR pr ON pr.nomorPR=t.nomorPR
    LEFT JOIN (
      SELECT d.kodeProduk, SUM(d.qty) AS qty, SUM(d.jmlHarga) AS hrgRetur, t.noreffRetur FROM detTrans d
        LEFT JOIN transaksi t ON t.nomorBukti= d.nomorBukti
      WHERE t.status IN ('T', 'W') and t.noreffRetur != ''
      GROUP BY d.kodeProduk, t.noreffRetur
    ) rtr ON rtr.kodeProduk = d.kodeProduk AND rtr.noreffRetur=d.nomorBukti
    WHERE (t.tglKirim BETWEEN ? AND ? OR t.status='W') ${a}  AND (t.jnsTrx='B' OR t.jnsTrx='J') AND t.status != 'B'
    GROUP BY t.nomorBukti
    ORDER BY urt ASC, t.status DESC, t.tglKirim DESC, t.nomorBukti DESC`,
      },
      [x.tgla, x.tglb, kodeCab, user.eID]
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      //      throw new Error(err)
      console.log(err);
      res.status(500).send({ st: "ndak nemu..." });
    });
});

app.post("/pertrans", async (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  let a =
    x.jnsTrx === "J" ? "AND t.asal IN (:cabID)" : "AND t.tujuan IN (:cabID)"; // antar cabang
  let b =
    x.jnsTrx === "J"
      ? "LEFT JOIN cabang ct ON t.tujuan = ct.kodeCab"
      : "LEFT JOIN cabang ct ON t.asal = ct.kodeCab";
  // let namaPartner = ['MAN', 'purchase', 'acc'].some(a => a === req.user.dtAkun.userType) || x.jnsTrx === 'J' ? `IF(t.ac='N',p.namaPartner, ct.namaCabang) AS namaPartner` : 'Pembelian'
  let cabID;
  switch (user.userType) {
    case "purchase":
    case "acc":
    case "MAN":
      cabID = x.kodeCab;
      break;
    case "admin":
    case "mitra":
    case "gudang":
      cabID = user.kodeCab;
      break;
    default:
      cabID = user.kodeCab;
  }
  try {
    let rows = await dbuse.query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT SUM(d.dpp + d.ppn - COALESCE(rtr.hrgRetur,0)) AS totalHarga, SUM(d.jmlPoint) AS totalPoint, t.*,
        cb.kodeCab,
        cb.namaCabang,
        IF(p.namaPartner IS NOT NULL, p.namaPartner, ct.namaCabang) AS namaPartner, e.biaya,e.partnerID,
        IF(NOW() >= DATE_ADD(t.tglTerima, INTERVAL 7 DAY),'N','Y') AS garansi,
        pot.diskon, pot.akunDiskon, IF(t.tempo = 0,c.namaAkun,'tempo') AS namaAkunBayar,
        c.pembayaran,
        ep.namaPartner AS namaExpedisi, cb.telp, cb.alamatCabang,
        IF(t.ac='N',p.alamat, ct.alamatCabang) AS alamat,
        IF(t.ac='N',p.tlp, ct.telp) AS tlp,
        COALESCE(p.telpPIC, NULL) AS telpPIC,
        IF(t.ac = 'Y', 'ASI', cust.jenisCust) AS kategoriCust,
        pr.keterangan AS ketPR, kr.namaKaryawan AS namaSales,
        (SUM(d.dpp + d.ppn + (IF(t.ongkir = 'Y', d.ongkir, 0))) - COALESCE(pot.diskon,0) - COALESCE(rtr.hrgRetur,0)) AS totalAkhir,
        COALESCE(rtr.qty, 0) AS jmlRetur, COALESCE(rtr.hrgRetur,0) AS hrgRetur,
        IF(t.status IN ('W','D'), 'A', 'T') AS urt,
        cust.point,
        t.nomorPO, t.nomorPR
      FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
      LEFT JOIN cabang cb ON t.cabID=cb.kodeCab
      ${b}
      LEFT JOIN expedisi e ON t.nomorBukti=e.nomorBukti
      LEFT JOIN partner ep ON e.partnerID=ep.kodePartner
      LEFT JOIN partner p ON t.kodePartner=p.kodePartner
      LEFT JOIN CustCat cust ON cust.idCustCat = p.catPartner
      LEFT JOIN karyawan kr ON kr.kodeKar=t.salesID
      LEFT JOIN potonganHarga pot ON t.nomorBukti=pot.nomorBukti
      LEFT JOIN COA c ON c.kodeAkun=t.akunBayar
      LEFT JOIN PR pr ON pr.nomorPR=t.nomorPR
      LEFT JOIN (
        SELECT d.kodeProduk, SUM(d.qty) AS qty, SUM(d.jmlHarga) AS hrgRetur, t.noreffRetur FROM detTrans d
          LEFT JOIN transaksi t ON t.nomorBukti= d.nomorBukti
        WHERE t.status IN ('T', 'W') and t.noreffRetur != ''
        GROUP BY d.kodeProduk, t.noreffRetur
      ) rtr ON rtr.kodeProduk = d.kodeProduk AND rtr.noreffRetur=d.nomorBukti
      WHERE t.nomorBukti = :nomorBukti
      GROUP BY t.nomorBukti
      ORDER BY urt ASC, t.status DESC, t.tglKirim DESC, t.nomorBukti DESC`,
      },
      x
    );
    res.send(rows);
  } catch (error) {
    console.log(error);
    res.status(500).send({ st: "ndak nemu..." });
  }
});

app.post("/transaksi", async (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  let a = x.jnsTrx === "J" ? "AND t.asal IN (?)" : "AND t.tujuan IN (?)"; // antar cabang
  let b =
    x.jnsTrx === "J"
      ? "LEFT JOIN cabang ct ON t.tujuan = ct.kodeCab"
      : "LEFT JOIN cabang ct ON t.asal = ct.kodeCab";
  try {
    let [dt] = await dbuse.query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT t.*,
        cb.kodeCab,
        cb.namaCabang,
        IF(p.namaPartner IS NOT NULL, p.namaPartner, ct.namaCabang) AS namaPartner, e.biaya,e.partnerID,
        pot.diskon, pot.akunDiskon, IF(t.tempo = 0,c.namaAkun,'tempo') AS namaAkunBayar,
        c.pembayaran,
        ep.namaPartner AS namaExpedisi, cb.telp, cb.alamatCabang,
        IF(t.ac='N',p.alamat, ct.alamatCabang) AS alamat,
        IF(t.ac='N',p.tlp, ct.telp) AS tlp,
        COALESCE(p.telpPIC, NULL) AS telpPIC,
        IF(t.ac = 'Y', 'ASI', cust.jenisCust) AS kategoriCust,
        pr.keterangan AS ketPR, kr.namaKaryawan AS namaSales,
        IF(t.status IN ('W','D'), 'A', 'T') AS urt,
        cust.point,
        (d.tHarga - COALESCE(pot.diskon,0)) AS totalAkhir
      FROM transaksi t
      LEFT JOIN cabang cb ON t.cabID=cb.kodeCab
      ${b}
      LEFT JOIN expedisi e ON t.nomorBukti=e.nomorBukti
      LEFT JOIN partner ep ON e.partnerID=ep.kodePartner
      LEFT JOIN partner p ON t.kodePartner=p.kodePartner
      LEFT JOIN CustCat cust ON cust.idCustCat = p.catPartner
      LEFT JOIN karyawan kr ON kr.kodeKar=t.salesID
      LEFT JOIN potonganHarga pot ON t.nomorBukti=pot.nomorBukti
      LEFT JOIN COA c ON c.kodeAkun=t.akunBayar
      LEFT JOIN PR pr ON pr.nomorPR=t.nomorPR
      LEFT JOIN (
        SELECT d.nomorBukti, SUM(d.dpp + d.ppn + (IF(t.ongkir = 'Y', d.ongkir, 0))) AS tHarga
          FROM detTrans d
          LEFT JOIN transaksi t on t.nomorBukti=d.nomorBukti
          WHERE d.nomorBukti = :nomorBukti
          GROUP by d.nomorBukti
      ) d ON d.nomorBukti = t.nomorBukti
      WHERE t.nomorBukti = :nomorBukti`,
      },
      x
    );
    res.send(dt);
  } catch (error) {
    console.log(error);
    res.status(500).send({ st: "ndak nemu..." });
  }
});
app.post("/detTrx", (req, res) => {
  let { x } = req.body;
  let kodeCab = x.cabID || req.user.dtAkun.kodeCab;
  dbuse
    .query(
      `SELECT d.*, JSON_QUERY(d.kemasan, '$') AS kemasan, IF(t.ppn='in', d.jmlHarga + d.ppn, d.jmlHarga) AS jmlHarga, IF(t.jnsTrx= 'J' AND t.status='W', hpp.${kodeCab} * d.qty, d.hpp ) AS hpp,
    nb.*, hpp.${kodeCab} AS hp,h.${kodeCab} AS price1, s.${kodeCab} AS stok, IF(t.ppn='in', d.jmlHarga + d.ppn, d.jmlHarga)/d.qty AS hargaSat,
    COALESCE(retur.qty, 0) AS jmlRetur, COALESCE(retur.hrgRetur, 0) AS hrgRetur, t.nomorJurnal
    FROM detTrans d LEFT JOIN namaBarang nb ON d.kodeProduk=nb.kodeProduk
      LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
      LEFT JOIN hpp hpp ON d.kodeProduk=hpp.kodeProduk
      LEFT JOIN hargaGrosir h ON d.kodeProduk=h.kodeProduk
      LEFT JOIN stock s ON d.kodeProduk=s.kodeProduk
      LEFT JOIN (
        SELECT d.kodeProduk, SUM(d.qty) AS qty, SUM(d.jmlHarga) AS hrgRetur FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti= t.nomorBukti
        WHERE t.noreffRetur = ? AND t.status = 'T'
        GROUP BY d.kodeProduk
      ) retur ON retur.kodeProduk= d.kodeProduk
    WHERE d.nomorBukti=?`,
      [x.nomorBukti, x.nomorBukti]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(401).send({ st: "Tidak diijinkan..." });
      // throw new error(err)
    });
});

app.post("/detTrxR", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(
      `SELECT d.*, nb.*, COALESCE(r.jmlRetur,0) AS jmlRetur, j.status,j.nomorJurnal
    FROM detTrans d LEFT JOIN namaBarang nb ON d.kodeProduk = nb.kodeProduk
      LEFT JOIN jurnal j ON d.nomorBukti = j.nomorSuratJalan
      LEFT JOIN (
        SELECT SUM(d.qty) AS jmlRetur, d.kodeProduk
        FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti = t.nomorBukti
        WHERE t.noreffRetur = ? AND t.status ='T'
        GROUP BY d.kodeProduk
      ) r ON d.kodeProduk = r.kodeProduk
    WHERE d.nomorBukti = ? AND ISNULL(j.jn)`,
      [x.nomorBukti, x.nomorBukti]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(401).send({ st: "Tidak diijinkan..." });
      // throw new error(err)
    });
});
app.get("/cariSN?", async (req, res) => {
  let x = {
    serialNo: req.query.key,
  };
  try {
    let data = await dbuse.query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT d.*, JSON_QUERY(SN, '$') AS SN, t.tglKirim, t.asal, t.tujuan, t.kodePartner, t.status, t.nomorJurnal,
      IF(t.ac = 'Y', c.namaCabang, p.namaPartner) AS namaPartner, c.namaCabang, nm.namaBarang
      FROM detTrans d 
      LEFT JOIN namaBarang nm ON d.kodeProduk = nm.kodeProduk
      LEFT JOIN transaksi t ON t.nomorBukti = d.nomorBukti
      LEFT JOIN cabang c ON t.tujuan = c.kodeCab
      LEFT JOIN partner p ON t.kodePartner = p.kodePartner
      WHERE JSON_SEARCH(d.SN, 'all', :serialNo) IS NOT NULL`,
      },
      x
    );
    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(401).send({ st: "Tidak diijinkan..." });
  }
});

app.post("/trxSN", async (req, res) => {
  let { x } = req.body;
  x.kodeCab = x.kodeCab || req.user.dtAkun.kodeCab;
  try {
    let data = await dbuse.query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT d.nomorBukti, d.kodeProduk, d.qty, d.jmlHarga, d.hargaKemasan, d.jmlKemasan, JSON_query(kemasan, '$') AS kemasan, dsn.SN,
      t.tglKirim, t.tglTerima, t.status, t.kodePartner, t.nomorJurnal, t.ct, t.akunBayar,
      CASE 
        WHEN t.ancab = 'Y' THEN cb.namaCabang
        ELSE p.namaPartner
      END AS namaPartner,
      t.ancab, IF(t.ancab = 'Y', t.tujuan, t.kodePartner) AS kodePartner, t.salesID, k.namaKaryawan AS namaSales,
      nb.produkCategory, nb.namaBarang, nb.kodeMerk, nb.namaMerk
      FROM detTrans d LEFT JOIN transaksi t ON t.nomorBukti= d.nomorBukti
      LEFT JOIN namaBarang nb ON nb.kodeProduk = d.kodeProduk
      LEFT JOIN cabang cb ON t.tujuan = cb.kodeCab
      LEFT JOIN partner p ON t.kodePartner = p.kodePartner
      LEFT JOIN karyawan k ON t.salesID = k.kodeKar,
      JSON_TABLE(d.SN, '$[*]' COLUMNS( SN TEXT path '$')) AS dsn
      WHERE t.tglKirim BETWEEN :tgla AND :tglb AND t.asal = :kodeCab AND t.status != 'B'`,
      },
      x
    );
    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(401).send({ st: "Tidak diijinkan..." });
  }
});

app.post("/mutasi", (req, res) => {
  let user = req.user.dtAkun;
  let { x } = req.body;
  x.Cab = ["MAN", "acc", "purchase"].some((a) => a == user.userType)
    ? [x.kodeCab]
    : [user.kodeCab];
  dbuse
    .query(
      {
        namedPlaceholders: true,
        sql: `SELECT COALESCE(sw.sawal,0) AS sawal,
      nb.kodeProduk,nb.namaBarang, nb.kodeCat, pc.produkCategory AS namaKategori,
      COALESCE(sa.masuk,0) AS masuk,COALESCE(sa.keluar,0) AS keluar
    FROM namaBarang nb LEFT JOIN (
      SELECT SUM(IF(t.tujuan IN (:Cab),d.qty,-d.qty)) AS sawal, d.kodeProduk
        FROM detTrans d
          LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
        WHERE (t.asal IN (:Cab) OR t.tujuan IN (:Cab)) AND t.tglTerima < :tgla  AND t.status='T'
        GROUP BY d.kodeProduk
      ) AS sw ON nb.kodeProduk=sw.kodeProduk
      LEFT JOIN (
        SELECT SUM(IF(t.tujuan IN (:Cab),d.qty,0)) AS masuk, SUM(IF(t.asal IN (:Cab),d.qty,0)) AS keluar, d.kodeProduk
          FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
          WHERE (t.asal IN (:Cab) OR t.tujuan IN (:Cab)) AND t.tglTerima BETWEEN :tgla AND :tglb AND t.status='T'
          GROUP BY d.kodeProduk
      ) AS sa ON nb.kodeProduk=sa.kodeProduk
      LEFT JOIN produkCat pc ON pc.kodeCat=nb.kodeCat
    HAVING sawal>0 OR masuk>0 OR keluar>0`,
      },
      x
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(401).send({ st: "Tidak diijinkan..." });
      // throw new error(err)
    });
});
/* let sql = `SELECT s.kodeProduk, SUM(COALESCE(s.saldo,0)) AS saldo, SUM(COALESCE(s.saldoHpp,0)) AS total,
  (SUM(COALESCE(s.saldoHpp,0)) / SUM(COALESCE(s.saldo,0))) AS hpp, s.kodeCabang,
  SUM(IF(COALESCE(s.saldo,0) >= COALESCE(bln1.tb,0), COALESCE(bln1.tb,0), COALESCE(s.saldo,0))) AS u30,
  SUM(CASE WHEN s.saldo - COALESCE(bln1.tb,0) >= COALESCE(bln2.tb,0) THEN COALESCE(bln2.tb,0)
    WHEN s.saldo - COALESCE(bln1.tb,0) BETWEEN 0 AND COALESCE(bln2.tb,0) THEN s.saldo - COALESCE(bln1.tb,0)
    ELSE 0
  END) AS u60,
  SUM(CASE WHEN s.saldo - COALESCE(bln1.tb,0) - COALESCE(bln2.tb,0) >= COALESCE(bln3.tb,0) THEN COALESCE(bln3.tb,0)
    WHEN s.saldo - COALESCE(bln1.tb,0) -COALESCE(bln2.tb,0) BETWEEN 0 AND COALESCE(bln3.tb,0) THEN s.saldo - COALESCE(bln1.tb,0) -COALESCE(bln2.tb,0)
    ELSE 0
  END) AS u90,
  SUM(CASE WHEN s.saldo - COALESCE(bln1.tb,0) - COALESCE(bln2.tb,0) - COALESCE(bln3.tb,0) >= COALESCE(bln4.tb,0) THEN s.saldo - COALESCE(bln1.tb,0) - COALESCE(bln2.tb,0) - COALESCE(bln3.tb,0)
    WHEN s.saldo - COALESCE(bln1.tb,0) -COALESCE(bln2.tb,0) - COALESCE(bln3.tb,0) BETWEEN 0 AND COALESCE(bln4.tb,0) THEN s.saldo - COALESCE(bln1.tb,0) -COALESCE(bln2.tb,0) - COALESCE(bln3.tb,0)
    ELSE 0
  END) AS u91, nb.kodeCat, nb.namaBarang, nb.produkCategory AS namaKategori
  FROM (SELECT SUM(CASE
      WHEN t.tujuan IN (:cabID) AND (t.asal NOT IN (:cabID) OR t.asal IS NULL) AND t.status = 'T' AND t.jnsTrx != 'RJ' THEN d.dpp + d.ongkir
      WHEN t.tujuan IN (:cabID) AND (t.asal NOT IN (:cabID) OR t.asal IS NULL) AND t.status = 'T' AND t.jnsTrx = 'RJ' THEN d.hpp
      WHEN t.asal IN (:cabID) AND t.tujuan NOT IN (:cabID) THEN -d.hpp
      ELSE 0
      END) + COALESCE(st.saldoHpp,0) - COALESCE(sa.saldoHpp,0) AS saldoHpp,
      SUM(CASE
        WHEN t.tujuan IN (:cabID) AND (t.asal NOT IN (:cabID) OR t.asal IS NULL) AND t.status = 'T' THEN d.qty
        WHEN t.asal IN (:cabID) AND t.tujuan NOT IN (:cabID) THEN -d.qty
        ELSE 0
        END) + COALESCE(st.saldo,0) - COALESCE(sa.saldo,0) AS saldo,
      d.kodeProduk,
      CASE WHEN t.asal IN (:cabID) AND t.tujuan NOT IN (:cabID) THEN t.asal
        WHEN (t.asal IS NULL OR t.asal NOT IN (:cabID)) AND t.tujuan IN (:cabID) THEN t.tujuan
        WHEN st.kodeCabang IN (:cabID) THEN st.kodeCabang
        WHEN sa.kodeCabang IN (:cabID) THEN sa.kodeCabang
        ELSE ''
      END AS kodeCabang
    FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
    LEFT JOIN (
      
      SELECT SUM(CASE
        WHEN t.tujuan IN (:cabID) AND (t.asal NOT IN (:cabID) OR t.asal is null) AND t.status = 'T' AND t.jnsTrx != 'RJ' THEN d.dpp + d.ongkir
        WHEN t.tujuan IN (:cabID) AND (t.asal NOT IN (:cabID) OR t.asal is null) AND t.status = 'T' AND t.jnsTrx = 'RJ' THEN d.hpp
        WHEN t.asal IN (:cabID) AND t.status IN ('D', 'T') THEN -d.hpp
      ELSE 0
      END) AS saldoHpp,
      SUM(CASE
        WHEN t.tujuan IN (:cabID) AND (t.asal IN (:cabID) OR t.asal IS NULL) AND t.status = 'T' THEN d.qty
        ELSE 0
        END) AS saldo, d.kodeProduk,
      CASE
        WHEN t.asal IN (:cabID) AND t.tujuan IN (:cabID) THEN t.tujuan
        ELSE ''
      END AS kodeCabang
      FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti

      WHERE t.tglKirim <= :tgla AND t.status NOT IN ('W', 'B') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID))

      GROUP BY kodeCabang, d.kodeProduk) st ON st.kodeProduk=d.kodeProduk AND st.kodeCabang = t.tujuan
    LEFT JOIN (
      
      SELECT SUM(CASE
      WHEN t.tujuan IN (:cabID) AND (t.asal IN (:cabID) OR t.asal IS NULL) AND t.status = 'T' THEN d.hpp
      ELSE 0
      END) AS saldoHpp,
      SUM(CASE
        WHEN t.tujuan IN (:cabID) AND (t.asal IN (:cabID) OR t.asal IS NULL) AND t.status = 'T' THEN d.qty
        ELSE 0
        END) AS saldo, d.kodeProduk,
      CASE
        WHEN t.asal IN (:cabID) AND t.tujuan IN (:cabID) THEN t.asal
        ELSE ''
      END AS kodeCabang
      FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti

      WHERE t.tglKirim < :tgla AND t.status NOT IN ('W', 'B') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID))

      GROUP BY kodeCabang, d.kodeProduk) sa ON sa.kodeProduk=d.kodeProduk AND sa.kodeCabang = t.tujuan
    WHERE t.tglKirim <= :tgla AND t.status NOT IN ('W', 'B') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID))
    GROUP BY d.kodeProduk, kodeCabang) s
  LEFT JOIN
  (SELECT SUM(IF(t.tujuan IN (:cabID),d.dpp + d.ongkir,0)) AS tbHpp,
    SUM(IF(t.tujuan IN (:cabID),d.qty,0)) AS tb, d.kodeProduk,
    CASE WHEN t.asal IN (:cabID) THEN t.asal
      WHEN t.tujuan IN (:cabID) THEN t.tujuan
      ELSE '' END AS kodeCabang FROM detTrans d
    LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
    WHERE t.status NOT IN ('W', 'B') AND t.tglKirim BETWEEN DATE_ADD(:tgla, INTERVAL -30 DAY) AND DATE_ADD(:tgla, INTERVAL -1 DAY) AND t.jnsTrx IN ('SA', 'B','RB','RJ', 'H', 'J') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID))
    GROUP BY d.kodeProduk, kodeCabang) bln1 ON s.kodeProduk=bln1.kodeProduk AND s.kodeCabang = bln1.kodeCabang
  LEFT JOIN
  (SELECT SUM(IF(t.tujuan IN (:cabID),d.dpp + d.ongkir,0)) AS tbHpp,
    SUM(IF(t.tujuan IN (:cabID),d.qty,0)) AS tb, d.kodeProduk,
    CASE WHEN t.asal IN (:cabID) THEN t.asal
      WHEN t.tujuan IN (:cabID) THEN t.tujuan
      ELSE '' END AS kodeCabang FROM detTrans d
    LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
    WHERE t.status NOT IN ('W', 'B') AND t.tglKirim BETWEEN DATE_ADD(:tgla, INTERVAL -60 DAY) AND DATE_ADD(:tgla, INTERVAL -31 DAY) AND t.jnsTrx IN ('SA', 'B','RB','RJ', 'H', 'J') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID))
    GROUP BY d.kodeProduk, kodeCabang) bln2 ON s.kodeProduk=bln2.kodeProduk AND s.kodeCabang = bln2.kodeCabang
  LEFT JOIN
  (SELECT SUM(IF(t.tujuan IN (:cabID),d.dpp + d.ongkir,0)) AS tbHpp,
    SUM(IF(t.tujuan IN (:cabID),d.qty,0)) AS tb, d.kodeProduk,
    CASE WHEN t.asal IN (:cabID) THEN t.asal
      WHEN t.tujuan IN (:cabID) THEN t.tujuan
      ELSE '' END AS kodeCabang FROM detTrans d
    LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
    WHERE t.status NOT IN ('W', 'B') AND t.tglKirim BETWEEN DATE_ADD(:tgla, INTERVAL -90 DAY) AND DATE_ADD(:tgla, INTERVAL -61 DAY) AND t.jnsTrx IN ('SA', 'B','RB','RJ', 'H', 'J') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID))
    GROUP BY d.kodeProduk, kodeCabang) bln3 ON s.kodeProduk=bln3.kodeProduk AND s.kodeCabang = bln3.kodeCabang
  LEFT JOIN
  (SELECT SUM(IF(t.tujuan IN (:cabID),d.dpp + d.ongkir,0)) AS tbHpp,
    SUM(IF(t.tujuan IN (:cabID),d.qty,0)) AS tb, d.kodeProduk,
    CASE WHEN t.asal IN (:cabID) THEN t.asal
      WHEN t.tujuan IN (:cabID) THEN t.tujuan
      ELSE '' END AS kodeCabang FROM detTrans d
    LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
    WHERE t.status NOT IN ('W', 'B') AND t.jnsTrx IN ('SA', 'B','RB','RJ', 'H', 'J') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID)) AND t.tglKirim < DATE_ADD(:tgla, INTERVAL -90 DAY)
    GROUP BY d.kodeProduk, kodeCabang) bln4 ON s.kodeProduk=bln4.kodeProduk AND s.kodeCabang = bln4.kodeCabang
  LEFT JOIN namaBarang nb ON nb.kodeProduk=s.kodeProduk
  GROUP BY s.kodeProduk
  HAVING total != 0` */
app.post("/umurstok", (req, res) => {
  let user = req.user.dtAkun;
  let { x } = req.body;
  x.cabID = ["MAN", "acc", "purchase"].some((a) => a == user.userType)
    ? x.kodeCab
    : [user.kodeCab];
  let sql = `SELECT s.kodeProduk, SUM(COALESCE(s.saldo,0)) AS saldo, SUM(COALESCE(s.saldoHpp,0)) AS total,
  (SUM(COALESCE(s.saldoHpp,0)) / SUM(COALESCE(s.saldo,0))) AS hpp, s.kodeCabang,
  SUM(IF(COALESCE(s.saldo,0) >= COALESCE(bln1.tb,0), COALESCE(bln1.tb,0), COALESCE(s.saldo,0))) AS u30,
  SUM(CASE WHEN s.saldo - COALESCE(bln1.tb,0) >= COALESCE(bln2.tb,0) THEN COALESCE(bln2.tb,0)
    WHEN s.saldo - COALESCE(bln1.tb,0) BETWEEN 0 AND COALESCE(bln2.tb,0) THEN s.saldo - COALESCE(bln1.tb,0)
    ELSE 0
  END) AS u60,
  SUM(CASE WHEN s.saldo - COALESCE(bln1.tb,0) - COALESCE(bln2.tb,0) >= COALESCE(bln3.tb,0) THEN COALESCE(bln3.tb,0)
    WHEN s.saldo - COALESCE(bln1.tb,0) -COALESCE(bln2.tb,0) BETWEEN 0 AND COALESCE(bln3.tb,0) THEN s.saldo - COALESCE(bln1.tb,0) -COALESCE(bln2.tb,0)
    ELSE 0
  END) AS u90,
  SUM(CASE WHEN s.saldo - COALESCE(bln1.tb,0) - COALESCE(bln2.tb,0) - COALESCE(bln3.tb,0) >= COALESCE(bln4.tb,0) THEN s.saldo - COALESCE(bln1.tb,0) - COALESCE(bln2.tb,0) - COALESCE(bln3.tb,0)
    WHEN s.saldo - COALESCE(bln1.tb,0) -COALESCE(bln2.tb,0) - COALESCE(bln3.tb,0) BETWEEN 0 AND COALESCE(bln4.tb,0) THEN s.saldo - COALESCE(bln1.tb,0) -COALESCE(bln2.tb,0) - COALESCE(bln3.tb,0)
    ELSE 0
  END) AS u91, nb.kodeCat, nb.namaBarang, nb.produkCategory AS namaKategori
  FROM (SELECT SUM(CASE
      WHEN t.tujuan IN (:cabID) AND (t.asal NOT IN (:cabID) OR t.asal IS NULL) AND t.status = 'T' AND t.jnsTrx != 'RJ' THEN d.dpp + d.ongkir
      WHEN t.tujuan IN (:cabID) AND (t.asal NOT IN (:cabID) OR t.asal IS NULL) AND t.status = 'T' AND t.jnsTrx = 'RJ' THEN d.hpp
      WHEN t.asal IN (:cabID) AND (t.tujuan NOT IN (:cabID) OR t.tujuan IS NULL) AND t.status IN ('D', 'T') THEN -d.hpp
      ELSE 0
      END) AS saldoHpp,
      SUM(CASE
        WHEN t.tujuan IN (:cabID) AND (t.asal NOT IN (:cabID) OR t.asal IS NULL) AND t.status = 'T' THEN d.qty
        WHEN t.asal IN (:cabID) AND (t.tujuan NOT IN (:cabID) OR t.tujuan IS NULL) THEN -d.qty
        ELSE 0
        END) AS saldo,
      d.kodeProduk,
      CASE WHEN t.asal IN (:cabID) AND t.tujuan NOT IN (:cabID) THEN t.asal
        WHEN (t.asal IS NULL OR t.asal NOT IN (:cabID)) AND t.tujuan IN (:cabID) THEN t.tujuan
        ELSE ''
      END AS kodeCabang
    FROM detTrans d 
      LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
    WHERE t.tglKirim <= :tgla AND t.status NOT IN ('W', 'B') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID))
    GROUP BY d.kodeProduk, kodeCabang) s
  LEFT JOIN
  (SELECT SUM(IF(t.tujuan IN (:cabID),d.dpp + d.ongkir,0)) AS tbHpp,
    SUM(IF(t.tujuan IN (:cabID),d.qty,0)) AS tb, d.kodeProduk,
    CASE WHEN t.asal IN (:cabID) THEN t.asal
      WHEN t.tujuan IN (:cabID) THEN t.tujuan
      ELSE '' END AS kodeCabang FROM detTrans d
    LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
    WHERE t.status NOT IN ('W', 'B') AND t.tglKirim BETWEEN DATE_ADD(:tgla, INTERVAL -30 DAY) AND DATE_ADD(:tgla, INTERVAL -1 DAY) AND t.jnsTrx IN ('SA', 'B','RB','RJ', 'H', 'J') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID))
    GROUP BY d.kodeProduk, kodeCabang) bln1 ON s.kodeProduk=bln1.kodeProduk AND s.kodeCabang = bln1.kodeCabang
  LEFT JOIN
  (SELECT SUM(IF(t.tujuan IN (:cabID),d.dpp + d.ongkir,0)) AS tbHpp,
    SUM(IF(t.tujuan IN (:cabID),d.qty,0)) AS tb, d.kodeProduk,
    CASE WHEN t.asal IN (:cabID) THEN t.asal
      WHEN t.tujuan IN (:cabID) THEN t.tujuan
      ELSE '' END AS kodeCabang FROM detTrans d
    LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
    WHERE t.status NOT IN ('W', 'B') AND t.tglKirim BETWEEN DATE_ADD(:tgla, INTERVAL -60 DAY) AND DATE_ADD(:tgla, INTERVAL -31 DAY) AND t.jnsTrx IN ('SA', 'B','RB','RJ', 'H', 'J') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID))
    GROUP BY d.kodeProduk, kodeCabang) bln2 ON s.kodeProduk=bln2.kodeProduk AND s.kodeCabang = bln2.kodeCabang
  LEFT JOIN
  (SELECT SUM(IF(t.tujuan IN (:cabID),d.dpp + d.ongkir,0)) AS tbHpp,
    SUM(IF(t.tujuan IN (:cabID),d.qty,0)) AS tb, d.kodeProduk,
    CASE WHEN t.asal IN (:cabID) THEN t.asal
      WHEN t.tujuan IN (:cabID) THEN t.tujuan
      ELSE '' END AS kodeCabang FROM detTrans d
    LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
    WHERE t.status NOT IN ('W', 'B') 
      AND t.tglKirim BETWEEN DATE_ADD(:tgla, INTERVAL -90 DAY) 
      AND DATE_ADD(:tgla, INTERVAL -61 DAY) 
      AND t.jnsTrx IN ('SA', 'B','RB','RJ', 'H', 'J') 
      AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID))
    GROUP BY d.kodeProduk, kodeCabang) bln3 ON s.kodeProduk=bln3.kodeProduk AND s.kodeCabang = bln3.kodeCabang
  LEFT JOIN
  (SELECT SUM(IF(t.tujuan IN (:cabID),d.dpp + d.ongkir,0)) AS tbHpp,
    SUM(IF(t.tujuan IN (:cabID),d.qty,0)) AS tb, d.kodeProduk,
    CASE WHEN t.asal IN (:cabID) THEN t.asal
      WHEN t.tujuan IN (:cabID) THEN t.tujuan
      ELSE '' END AS kodeCabang FROM detTrans d
    LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
    WHERE t.status NOT IN ('W', 'B') AND t.jnsTrx IN ('SA', 'B','RB','RJ', 'H', 'J') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID)) AND t.tglKirim < DATE_ADD(:tgla, INTERVAL -90 DAY)
    GROUP BY d.kodeProduk, kodeCabang) bln4 ON s.kodeProduk=bln4.kodeProduk AND s.kodeCabang = bln4.kodeCabang
  LEFT JOIN namaBarang nb ON nb.kodeProduk=s.kodeProduk
  GROUP BY s.kodeProduk
  HAVING total != 0`;
  dbuse
    .query(
      {
        namedPlaceholders: true,
        sql: sql,
      },
      x
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Tidak diijinkan..." });
      // throw new error(err)
    });
});

app.post("/hisbar", async (req, res) => {
  let user = req.user.dtAkun;
  let { x } = req.body;
  let kodeCab = ["MAN", "acc", "purchase"].some((a) => a === user.userType)
    ? x.kodeCab
    : user.kodeCab;
  try {
    let dtHis = await dbuse.query(
      `SELECT dt.nomorBukti,dt.kodeProduk,dt.qty, dt.jmlHarga, dt.dpp, 
      IF(t.tujuan ='${kodeCab}' AND t.jnsTrx != 'RJ', dt.jmlHarga,dt.hpp) AS hpp, dt.jmlHarga AS harga, nb.namaBarang,
        DATE_FORMAT(t.tglKirim,'%Y-%m-%d') AS tglKirim, h.${kodeCab} AS hppA,
        t.status,t.tujuan,t.asal,t.cabID, IF(t.tujuan='${kodeCab}','M','K') AS jns,
        CASE
          WHEN t.tujuan = '${kodeCab}' AND (t.ancab = 'Y' OR t.ac = 'Y') THEN cab.namaCabang
          WHEN t.asal = '${kodeCab}' AND (t.ancab = 'Y' OR t.ac = 'Y') THEN cba.namaCabang
          WHEN pt.namaPartner IS NOT NULL THEN  pt.namaPartner
          WHEN t.jnsTrx = 'ADJ' OR t.jnsTrx = 'SA' THEN t.jnsTrx
          ELSE 'Rakit'
        END AS namaPartner, t.nomorJurnal, nb.kodeCat, t.status
      FROM detTrans dt LEFT JOIN transaksi t ON dt.nomorBukti=t.nomorBukti
        LEFT JOIN namaBarang nb ON dt.kodeProduk=nb.kodeProduk
        LEFT JOIN hpp h ON h.kodeProduk=dt.kodeProduk
        LEFT JOIN partner pt ON pt.kodePartner=t.kodePartner
        LEFT JOIN cabang cab ON cab.kodeCab=t.asal
        LEFT JOIN cabang cba ON cba.kodeCab=t.tujuan
      WHERE t.tglKirim BETWEEN ? AND ? AND dt.kodeProduk=?
        AND (t.asal='${kodeCab}' OR t.tujuan='${kodeCab}')
      ORDER BY t.tglKirim, t.jnsTrx ASC`,
      [x.tgla, x.tglb, x.kodeProduk]
    );
    let sawal = await dbuse.query(
      `SELECT SUM(
      CASE
        WHEN t.tujuan='${kodeCab}' AND t.status = 'T' THEN dt.qty
        WHEN t.asal = '${kodeCab}' AND t.status IN ('T', 'D') THEN -dt.qty
        ELSE 0
      END) AS awal, 'M' AS jns,
        dt.kodeProduk, 'Saldo Awal' AS nomorBukti, '${x.tgla}' AS tglKirim, h.${kodeCab} AS hpp
          FROM detTrans dt LEFT JOIN transaksi t ON dt.nomorBukti=t.nomorBukti
          LEFT JOIN hpp h ON h.kodeProduk=dt.kodeProduk
        WHERE t.tglKirim < ? AND t.status IN ('T', 'D') AND dt.kodeProduk=? AND (t.asal='${kodeCab}' OR t.tujuan='${kodeCab}')
        GROUP BY dt.kodeProduk`,
      [x.tgla, x.kodeProduk]
    );
    !sawal.length &&
      sawal.push({
        nomorBukti: "Saldo Awal",
        jns: "M",
        awal: 0,
        qty: 0,
        saldo: 0,
        tglTerima: x.tgla,
        hpp: 0,
      });
    res.send([...sawal, ...dtHis]);
  } catch (err) {
    console.log(err);
    res.status(500).send({ st: "gagal..." });
  }
});

app.get("/dtpartner", (req, res) => {
  let user = req.user.dtAkun;
  // let kodeCab = ['MAN', 'acc', 'purchase'].some(a => a === user.userType) ? x.kodeCab : user.kodeCab
  let aa = ["MAN", "acc", "purchase"].some((a) => a === user.userType)
    ? ""
    : "WHERE p.kodeCab=?";
  dbuse
    .query(
      `SELECT p.*, k.jenisCust, k.spk FROM partner p
    LEFT JOIN CustCat k ON p.catPartner= k.idCustCat
    ${aa}
    ORDER BY p.kodePartner ASC`,
      [user.kodeCab]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(401).send({ st: "Tidak diijinkan..." });
      // throw new error(err)
    });
});

app.post("/addPartner", async (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  x.compID = user.compCode;
  let kodeCab = user.kodeCab;
  try {
    let urut = await dbuse.query(
      `SELECT COUNT(kodePartner) AS nom FROM partner WHERE kodePartner LIKE '${kodeCab}${x.jnsPartner.slice(
        0,
        1
      )}B%'`
    );
    x.kodePartner = x.idPartner
      ? x.kodePartner
      : kodeCab +
        x.jnsPartner.slice(0, 1) +
        "B" +
        (urut[0].nom + 1).toString().padStart(10, "0");
    let sql = x.idPartner
      ? `UPDATE partner SET
    namaPartner=:namaPartner,jnsPartner=:jnsPartner,alamat=:alamat,
    catPartner=:catPartner,tlp=:tlp,namaPIC=:namaPIC,telpPIC=:telpPIC,email=:email,cust=:cust,ven=:ven
    WHERE idPartner =:idPartner`
      : `INSERT INTO partner (kodePartner,namaPartner,jnsPartner,alamat,catPartner,tlp,compID,kodeCab,namaPIC,telpPIC,email,cust,ven)
      VALUES (:kodePartner,:namaPartner,:jnsPartner,:alamat,:catPartner,:tlp,:compID,'${kodeCab}',:namaPIC,:telpPIC,:email,:cust,:ven)`;
    dbuse
      .query({ namedPlaceholders: true, sql: sql }, x)
      .then((rows) => {
        // console.log(rows)
        let a =
          rows.affectedRows === 2
            ? `Anda melakukan perubahan ${x.kodePartner} ${x.namaPartner}`
            : "Tambah partner baru tersimpan...";
        res.send({ st: a });
      })
      .catch((err) => {
        console.log(err);
        res.status(401).send({ st: "Tidak diijinkan..." });
        // throw err
      });
  } catch (err) {
    res.status(500).send({ st: "gagal..." });
  }
});

app.get("/jnscust", (req, res) => {
  dbuse
    .query("SELECT * FROM CustCat ORDER BY jenisCust ASC")
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(401).send({ st: "Tidak diijinkan..." });
      // throw new error(err)
    });
});

app.post("/konfirm", async (req, res) => {
  let x = req.body.x;
  let telp = x.telpPIC || x.tlp;
  let wa = x.wa || false;
  try {
    let [cSt] = await dbuse.query(
      "SELECT status, nomorBukti FROM transaksi WHERE nomorBukti=?",
      [x.nomorBukti]
    );
    if (cSt.status === "W" || cSt.status === "D") {
      let stat = await dbuse.query(
        "UPDATE transaksi SET status=? WHERE nomorBukti=?",
        [x.status, x.nomorBukti]
      );
      let [hd] = await dbuse.query(
        `SELECT t.*, DATE_FORMAT(t.tglKirim,'%Y-%m-%d') AS tglKirim, p.namaPartner
        FROM transaksi t
          LEFT JOIN partner p ON t.kodePartner=p.kodePartner
        WHERE nomorBukti=?`,
        [x.nomorBukti]
      );
      let det = await dbuse.query(
        `SELECT d.*,p.kodeCat FROM detTrans d
          LEFT JOIN produk p ON d.kodeProduk=p.kodeProduk
          LEFT JOIN produkCat c ON p.kodeCat=c.kodeCat WHERE d.nomorBukti = ?`,
        [x.nomorBukti]
      );
      let [exp] = await dbuse.query(
        "SELECT * FROM expedisi WHERE nomorBukti=?",
        [x.nomorBukti]
      );
      let [pot] = await dbuse.query(
        "SELECT * FROM potonganHarga WHERE nomorBukti=?",
        [x.nomorBukti]
      );
      if (["T", "D"].some((a) => a === x.status)) {
        if (
          x.jnsTrx === "J" &&
          x.ac === "N" &&
          x.ancab !== "Y" &&
          telp.length > 9 &&
          x.totalPoint > 0 &&
          wa
        ) {
          /* console.log(x.wa)
          fetch('https://sawit.wablas.com/api/send-message', {
            method: 'POST',
            body: JSON.stringify({
              'phone': telp,
              'message': `Terimakasih telah mempercayakan PT. Aston Sistem Indonesia
  kunjungi www.amazinkprint.com/info untuk memperoleh promo dan hadiah menarik
  Hubungi kami di 082138290017 untuk membantu kebutuhan kantor anda
  Tetap jaga diri dan keluarga dari COVID-19 dengan menjalankan Prokes..
  *Stay Safe and Healthy AMAZiNK People.*`
            }),
            headers: { 'Content-Type': 'application/json', 'Authorization': '3QmxBDQ8rcBkEnoa8Ebi5MHfmMefjujOsugJ6DdzEACvcXbsdz02U9H5j5GRrN7w' }
          }).then(ok => {
            console.log(ok)
          }) */
        }
        Promise.all([hd, det, exp, pot])
          .then(async (data) => {
            delete det.meta;
            // delete hd.meta
            // delete exp.meta
            // delete pot.meta
            await trxTerima(hd, det, exp, pot);
            return data;
          })
          .then((data) => {
            res.send({ st: "tersimpan..." });
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        res.send({ st: "transaksi dibatalkan..." });
      }
    } else {
      res.send({ st: "transaksi sudah diterima..." });
    }
  } catch (err) {
    console.log(err);
    res.status(501).send({ st: "Cek ulang..." });
  } finally {
    let ss = await dbuse.query(
      `INSERT INTO userLog (jnsLog, akun, nomorBukti, deskripsi) VALUES ('Approve',?,?,?)`,
      [req.user.dtAkun.akun, x.nomorBukti, `status ${x.status}`]
    );
  }
});
app.get("/rkpsales?", (req, res) => {
  let x = req.query.key;
  let tgl =
    new Date().toLocaleString("sv", { timeZoneName: "short" }).slice(0, 7) +
    "%";
  dbuse
    .query(
      `SELECT SUM(dt.qty-COALESCE(rt.qty,0)) AS qty,SUM(dt.jmlHarga-COALESCE(rt.jmlHarga,0)) AS jmlHarga,
    SUM(dt.hpp-COALESCE(rt.hpp,0)) AS hpp, SUM(dt.dpp-COALESCE(rt.dpp,0)) AS dpp
    FROM detTrans dt
      LEFT JOIN transaksi t ON dt.nomorBukti=t.nomorBukti
      LEFT JOIN (
        SELECT SUM(dt.qty) AS qty,SUM(dt.jmlHarga) AS jmlHarga,SUM(dt.hpp) AS hpp, SUM(dt.dpp) AS dpp,
          t.noreffRetur
          FROM detTrans dt
          LEFT JOIN transaksi t ON dt.nomorBukti=t.nomorBukti
          WHERE t.jnsTrx='RJ' AND t.status = 'T'
          GROUP BY t.noreffRetur
      ) rt ON t.nomorBukti=rt.noreffRetur
    WHERE salesID=? AND t.status IN ('T', 'D') AND t.jnsTrx='J' AND t.tglKirim like ?`,
      [x, tgl]
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(501).send({ st: "tidak ditemukan..." });
    });
});

// dashboard marketing
// omset per sales
app.post("/salesomzet", async (req, res) => {
  let { x } = req.body;
  let ancab = x.ancab
    ? ""
    : "AND (divi.compCode != divt.compCode OR divt.compCode IS NULL)";
  x.tgl = x.tgla.slice(0, 4) + "-01-01";
  let grup;
  switch (x.jnsGrup) {
    case "namaCabang":
      grup = ", c.kodeCab";
      break;
    case "produkCategory":
      grup = ", nb.produkCategory";
      break;
    case "namaPartner":
      grup = ", p.kodePartner";
      break;
    default:
      grup = ", c.kodeCab, t.salesID";
  }
  try {
    let a = await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `SELECT
          SUM(IF(MONTH(t.tglKirim) = 1, d.jmlHarga,0)) AS Januari,
          SUM(IF(MONTH(t.tglKirim) = 2, d.jmlHarga,0)) AS Februari,
          SUM(IF(MONTH(t.tglKirim) = 3, d.jmlHarga,0)) AS Maret,
          SUM(IF(MONTH(t.tglKirim) = 4, d.jmlHarga,0)) AS April,
          SUM(IF(MONTH(t.tglKirim) = 5, d.jmlHarga,0)) AS Mei,
          SUM(IF(MONTH(t.tglKirim) = 6, d.jmlHarga,0)) AS Juni,
          SUM(IF(MONTH(t.tglKirim) = 7, d.jmlHarga,0)) AS Juli,
          SUM(IF(MONTH(t.tglKirim) = 8, d.jmlHarga,0)) AS Agustus,
          SUM(IF(MONTH(t.tglKirim) = 9, d.jmlHarga,0)) AS September,
          SUM(IF(MONTH(t.tglKirim) = 10, d.jmlHarga,0)) AS Oktober,
          SUM(IF(MONTH(t.tglKirim) = 11, d.jmlHarga,0)) AS November,
          SUM(IF(MONTH(t.tglKirim) = 12, d.jmlHarga,0)) AS Desember,
          SUM(d.jmlHarga) AS totalOmzet,
           t.salesID, t.asal, s.namaKaryawan, c.namaCabang, nb.produkCategory,
           t.kodePartner, p.namaPartner
        FROM detTrans d
          LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
          LEFT JOIN namaBarang nb ON nb.kodeProduk = d.kodeProduk
          LEFT JOIN cabang c ON t.asal = c.kodeCab
          LEFT JOIN divisi divi ON divi.divisiCode= c.divisiCode
          LEFT JOIN cabang ct ON t.tujuan = ct.kodeCab
          LEFT JOIN divisi divt ON divt.divisiCode =  ct.divisiCode
          LEFT JOIN karyawan s ON s.kodeKar = t.salesID
          LEFT JOIN partner p ON p.kodePartner = t.kodePartner
        WHERE YEAR(t.tglKirim) = YEAR(:tgl) AND t.status IN ('T', 'D') AND t.asal IN (:kodeCab) AND t.jnsTrx = 'J' ${ancab}
        GROUP BY c.divisiCode ${grup}
        ORDER BY c.divisiCode, c.kodeCab, s.namaKaryawan ASC`,
      },
      x
    );
    res.send(a);
  } catch (error) {
    console.log(error);
    res.status(501).send({ st: "tidak ditemukan..." });
  }
});

// rekap penjualan untuk report all sales performance => olah di UI untuk gruping sales
app.post("/rkpAllsales", async (req, res) => {
  let user = req.user.dtAkun;
  let { x } = req.body;
  let kodeCab = ["MAN", "acc", "purchase"].some((a) => a === user.userType)
    ? x.kodeCab
    : [user.kodeCab];
  let lap = `AND t.asal IN (?)`;
  let ancab = x.ancab
    ? ""
    : "AND (divi.compCode != divt.compCode OR divt.compCode IS NULL)";
  let grupBy = x.grupBy !== "salesID" ? `p.${x.grupBy}` : "t.salesID";
  try {
    /* SELECT SUM((d.qty - COALESCE(k.kirim, 0)) * d.hargaJual) AS jmlHargaP,
      SUM((d.qty - COALESCE(k.kirim, 0))) AS qtyP
      LEFT JOIN (
      SELECT d.kodeProduk, SUM(d.qty) AS kirim, t.nomorPO
      FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
      WHERE t.nomorPO is not null AND t.status NOT IN ('B', 'W')
      GROUP BY t.nomorPO, d.kodeProduk
    ) k ON k.kodeProduk=d.kodeProduk AND k.nomorPO = p.nomorPO */
    let blmPos =
      []; /* await dbuse.query(`SELECT SUM((d.qty) * d.hargaJual) AS jmlHargaP,
      SUM(d.qty) AS qtyP, p.kodeCat, p.produkCategory AS kategoriProduk, p.namaBarang, d.kodeProduk,
        t.salesID, e.namaKaryawan, c.kodePartner, c.namaPartner AS namaCust
      FROM detPO d
      LEFT JOIN namaBarang p ON d.kodeProduk=p.kodeProduk
      LEFT JOIN PO t ON d.nomorPO=t.nomorPO
      LEFT JOIN partner c ON t.kodePartner = c.kodePartner
      LEFT JOIN karyawan e ON t.salesID=e.kodeKar
          WHERE t.statusPO NOT IN ('Open', 'Batal') AND t.tglRequest BETWEEN ? AND ? AND t.cabID IN (?)
      GROUP BY ${grupBy}`, [x.tgla, x.tglb, kodeCab]) */
    let dtSales = await dbuse.query(
      `SELECT SUM(dt.qty-COALESCE(rt.qtyR,0)) AS qty,SUM(dt.jmlHarga-COALESCE(rt.jmlHargaR,0)) AS jmlHarga,
      SUM(dt.jmlPoint - COALESCE(rt.jmlPointR,0)) AS pointMember, SUM(dt.cashback) AS cashBack,
      SUM(dt.hpp-COALESCE(rt.hppR,0)) AS hpp, SUM(dt.dpp-COALESCE(rt.dppR,0)) AS dpp, SUM(dt.ppn-COALESCE(rt.ppnR,0)) AS ppn,
      SUM((cat.pencapaian/100) * (dt.jmlHarga-COALESCE(rt.jmlHargaR,0))) AS nilaiPencapaian,
      dt.kodeProduk,p.namaBarang,e.namaKaryawan,c.namaPartner AS Customers,t.salesID,cat.produkCategory AS kategoriProduk,
      pcat.jenisCust AS kategoriCustomer, m.namaMerk, divi.compCode AS compID, t.asal, p.kodeCat, cb.namaCabang, DATE_FORMAT(t.tglKirim, '%Y-%m') AS Monthly, CONCAT(YEAR(t.tglKirim), ' Q',QUARTER(t.tglKirim)) AS Quarter, CONCAT(YEAR(t.tglKirim), ' S',IF(MONTH(t.tglKirim) < 7, 1, 2)) AS Semester
    FROM detTrans dt
      LEFT JOIN transaksi t ON dt.nomorBukti=t.nomorBukti
      LEFT JOIN cabang cb ON t.asal = cb.kodeCab
      LEFT JOIN divisi divi ON divi.divisiCode= cb.divisiCode
      LEFT JOIN cabang ct ON t.tujuan = ct.kodeCab
      LEFT JOIN divisi divt ON divt.divisiCode =  ct.divisiCode
      LEFT JOIN namaBarang p ON dt.kodeProduk=p.kodeProduk
      LEFT JOIN produkCat cat ON p.kodeCat=cat.kodeCat
      LEFT JOIN merk m ON p.kodeMerk=m.kodeMerk
      LEFT JOIN karyawan e ON t.salesID=e.kodeKar
      LEFT JOIN partner c ON t.kodePartner = c.kodePartner
      LEFT JOIN CustCat pcat ON pcat.idCustCat=c.catPartner
      LEFT JOIN (
          SELECT d.kodeProduk, sum(d.qty) AS qtyR, sum(d.jmlHarga) AS jmlHargaR, sum(d.hpp) AS hppR,
            sum(d.dpp) AS dppR, sum(d.ppn) AS ppnR, SUM(d.jmlPoint) AS jmlPointR, t.noreffRetur
            FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
            WHERE t.noreffRetur != '' AND t.status = 'T' ${lap}
            GROUP BY d.kodeProduk, t.noreffRetur
        ) rt ON dt.kodeProduk= rt.kodeProduk AND t.nomorBukti=rt.noreffRetur
    WHERE t.status IN ('T', 'D') AND t.jnsTrx='J' AND t.tglKirim BETWEEN ?  AND ? ${lap}
    ${ancab}
    GROUP BY ${grupBy}
    ORDER BY qty DESC`,
      [kodeCab, x.tgla, x.tglb, kodeCab]
    );
    res.send([...blmPos, ...dtSales]);
  } catch (error) {
    console.log(error);
    res.status(501).send({ st: "tidak ditemukan..." });
  }
});

app.post("/rkpPerKategori", (req, res) => {
  let user = req.user.dtAkun;
  let { x } = req.body;
  let kodeCab = ["MAN", "acc", "purchase"].some((a) => a == user.userType)
    ? x.kodeCab
    : [user.kodeCab];
  let lap = `AND t.asal IN (?)`;
  let ancab = x.ancab
    ? ""
    : "AND (divi.compCode != divt.compCode OR divt.compCode IS NULL)";
  dbuse
    .query(
      `SELECT SUM(dt.qty-COALESCE(rt.qtyR,0)) AS qty,SUM(dt.jmlHarga-COALESCE(rt.jmlHargaR,0)) AS jmlHarga,
      SUM(dt.jmlPoint - COALESCE(rt.jmlPointR,0)) AS pointMember, SUM(dt.cashback) AS cashBack,
      SUM(dt.hpp-COALESCE(rt.hppR,0)) AS hpp, SUM(dt.dpp-COALESCE(rt.dppR,0)) AS dpp,
      SUM((cat.pencapaian/100) * (dt.jmlHarga-COALESCE(rt.jmlHargaR,0))) AS nilaiPencapaian,
      dt.kodeProduk,p.namaBarang,e.namaKaryawan,c.namaPartner AS Customers,t.salesID,cat.produkCategory AS kategoriProduk,
      pcat.jenisCust AS kategoriCustomer, m.namaMerk,
      divi.compCode AS compID, t.asal, DATE_FORMAT(t.tglKirim, '%Y-%m') AS Monthly, CONCAT(YEAR(t.tglKirim), ' Q',QUARTER(t.tglKirim)) AS Quarter, CONCAT(YEAR(t.tglKirim), ' S',IF(MONTH(t.tglKirim) < 7, 1, 2)) AS Semester  
    FROM detTrans dt
      LEFT JOIN transaksi t ON dt.nomorBukti=t.nomorBukti
      LEFT JOIN cabang cb ON t.asal = cb.kodeCab
      LEFT JOIN divisi divi ON divi.divisiCode= cb.divisiCode
      LEFT JOIN cabang ct ON t.tujuan = ct.kodeCab
      LEFT JOIN divisi divt ON divt.divisiCode = ct.divisiCode
      LEFT JOIN namaBarang p ON dt.kodeProduk=p.kodeProduk
      LEFT JOIN produkCat cat ON p.kodeCat=cat.kodeCat
      LEFT JOIN merk m ON p.kodeMerk=m.kodeMerk
      LEFT JOIN karyawan e ON t.salesID=e.kodeKar
      LEFT JOIN partner c ON t.kodePartner = c.kodePartner
      LEFT JOIN CustCat pcat ON pcat.idCustCat=c.catPartner
      LEFT JOIN (
        SELECT d.kodeProduk, sum(d.qty) AS qtyR, sum(d.jmlHarga) AS jmlHargaR, sum(d.hpp) AS hppR,
          sum(d.dpp) AS dppR, SUM(d.jmlPoint) AS jmlPointR, t.noreffRetur
          FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
          WHERE t.noreffRetur != '' AND t.status = 'T' ${lap}
          GROUP BY d.kodeProduk, t.noreffRetur
      ) rt ON dt.kodeProduk= rt.kodeProduk AND t.nomorBukti=rt.noreffRetur
    WHERE t.status IN ('T', 'D') AND t.jnsTrx='J' AND t.tglKirim BETWEEN ?  AND ? ${lap} ${ancab}
    GROUP BY p.kodeCat
    ORDER BY qty DESC
    LIMIT 10`,
      [kodeCab, x.tgla, x.tglb, kodeCab]
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(501).send({ st: "tidak ditemukan..." });
    });
});

app.post("/rkpTransaksiS", (req, res) => {
  let user = req.user.dtAkun;
  let { x } = req.body;
  let kodeCab = ["MAN", "acc", "purchase"].some((a) => a === user.userType)
    ? x.kodeCab
    : [user.kodeCab];
  let a = user.userType === "sales" ? "AND t.salesID= ?" : "";
  // console.log(kodeCab)
  dbuse
    .query(
      `SELECT d.iddetTrans, d.qty,d.jmlHarga, d.jmlPoint,d.dpp,d.ppn,d.ongkir,d.hpp,d.diskon,d.kodeProduk,d.nomorBukti, COALESCE(d.jmlPoint,0) AS pointMember, d.cashback,
    t.status, t.asal,t.tujuan, DATE_FORMAT(t.tglKirim,'%Y-%m-%d') AS tglKirim,t.kodePartner, t.salesID, rt.qtyR,
    COALESCE(rt.jmlHargaR,0) AS jmlHargaR, rt.hppR, nm.namaBarang, k.namaKaryawan, pc.produkCategory AS kategoriProduk,
    IF(t.ac = 'Y', cb.namaCabang, prt.namaPartner) AS namaCust,
    IF(t.ac = 'Y', 'ASI', cust.jenisCust) AS kategoriCust,
    m.namaMerk, prt.*, pc.pencapaian, ((pc.pencapaian/100) * (d.jmlHarga - COALESCE(rt.jmlHargaR,0))) AS nilaiPencapaian
    FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
      LEFT JOIN (
        SELECT d.kodeProduk, sum(d.qty) AS qtyR, sum(d.jmlHarga) AS jmlHargaR, sum(d.hpp) AS hppR,
          sum(d.dpp) AS dppR, t.noreffRetur
          FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
          WHERE t.noreffRetur != '' AND t.status !='B' AND t.cabID IN (?)
          GROUP BY d.kodeProduk, t.noreffRetur
      ) rt ON d.kodeProduk= rt.kodeProduk AND t.nomorBukti=rt.noreffRetur
      LEFT JOIN namaBarang nm ON d.kodeProduk = nm.kodeProduk
      LEFT JOIN karyawan k ON t.salesID=k.kodeKar
      LEFT JOIN produkCat pc ON pc.kodeCat= nm.kodeCat
      LEFT JOIN merk m ON nm.kodeMerk=m.kodeMerk
      LEFT JOIN partner prt ON prt.kodePartner=t.kodePartner
      LEFT JOIN cabang cb ON cb.kodeCab=t.tujuan
      LEFT JOIN CustCat cust ON cust.idCustCat=prt.catPartner
    WHERE t.status != 'B' AND t.jnsTrx = ? AND t.tglKirim BETWEEN ? AND ? AND t.cabID IN (?) ${a}`,
      [kodeCab, x.jnsTrx, x.tgla, x.tglb, kodeCab, user.eID]
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "tidak ditemukan..." });
    });
});

app.post("/rkpPOnew", async (req, res) => {
  let { x } = req.body;
  x.awalTahun = x.tgla.slice(0, 5) + "01-01";
  try {
    let sqq = `SELECT SUM((d.qty - COALESCE(k.kirim, 0)) * d.hargaJual) AS jmlHarga, SUM(d.qty - COALESCE(k.kirim, 0)) AS qty, nb.namaBarang,
      p.kodePartner, p.cabID, cust.namaPartner,nb.kodeCat, cc.point, nb.pointMember,
      p.salesID
    FROM detPO d LEFT JOIN namaBarang nb ON d.kodeProduk=nb.kodeProduk
    LEFT JOIN PO p ON d.nomorPO=p.nomorPO
    LEFT JOIN partner cust ON cust.kodePartner=p.kodePartner
    LEFT JOIN CustCat cc ON cc.idCustCat = cust.catPartner
    LEFT JOIN (
      SELECT d.kodeProduk, SUM(d.qty) AS kirim, t.nomorPO
      FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
      WHERE t.nomorPO is not null AND t.status NOT IN ('B', 'W')
      GROUP BY t.nomorPO, d.kodeProduk
    ) k ON k.kodeProduk=d.kodeProduk AND k.nomorPO = p.nomorPO
        WHERE p.statusPO NOT IN ('Closed', 'Batal', 'Open') AND p.tglRequest BETWEEN :tgla AND :tglb AND p.cabID IN (:kodeCab)
    GROUP BY p.salesID`;
    let periode = await dbuse.query(
      {
        namedPlaceholders: true,
        sql: sqq,
      },
      x
    );
    let [tahun] = await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `SELECT SUM((d.qty - COALESCE(k.kirim, 0)) * d.hargaJual) AS jmlHarga, SUM(d.qty - COALESCE(k.kirim, 0)) AS qty
    FROM detPO d
    LEFT JOIN PO p ON d.nomorPO=p.nomorPO
    LEFT JOIN (
      SELECT d.kodeProduk, SUM(d.qty) AS kirim, t.nomorPO
      FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
      WHERE t.nomorPO is not null AND t.status NOT IN ('B', 'W')
      GROUP BY t.nomorPO, d.kodeProduk
    ) k ON k.kodeProduk=d.kodeProduk AND k.nomorPO = p.nomorPO
        WHERE p.statusPO NOT IN ('Closed', 'Batal', 'Open') AND p.tglRequest BETWEEN :awalTahun AND :tglb AND p.cabID IN (:kodeCab)`,
      },
      x
    );
    res.send({ periode, tahun });
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "tidak ditemukan..." });
  }
});

app.post("/rkpTransaksi", (req, res) => {
  let user = req.user.dtAkun;
  let { x } = req.body;
  x.kodeCabfilt = ["MAN", "acc", "purchase"].some((a) => a === user.userType)
    ? x.kodeCab
    : [user.kodeCab];
  let ancab = x.ancab
    ? ""
    : "AND (dv.compCode != divt.compCode OR divt.compCode IS NULL)";
  let lap = `AND t.cabID IN (:kodeCabfilt)`;
  // console.log(kodeCab)
  let sqla =
    x.jnsTrx === "J"
      ? `SELECT d.iddetTrans, d.qty,d.jmlHarga, d.jmlPoint,d.dpp,d.ppn,d.ongkir,d.hpp,d.diskon,d.kodeProduk,
    d.nomorBukti, (d.jmlPoint - COALESCE(rt.jmlPointR,0)) AS pointMember, d.cashback,
    t.status, t.asal,t.tujuan, DATE_FORMAT(t.tglKirim,'%Y-%m-%d') AS tglKirim,t.kodePartner, t.salesID, COALESCE(rt.qtyR,0) AS qtyR,
    COALESCE(rt.jmlHargaR,0) AS jmlHargaR, COALESCE(rt.hppR,0) AS hppR, COALESCE(rt.jmlPointR, 0) AS jmlPointR,
    nm.namaBarang, k.namaKaryawan, pc.produkCategory AS kategoriProduk,
    IF(cb.namaCabang IS NOT NULL, cb.namaCabang, prt.namaPartner) AS namaCust,
    IF(cb.namaCabang IS NOT NULL, dv.compCode, cust.jenisCust) AS kategoriCust,
    m.namaMerk, pc.pencapaian, ((pc.pencapaian/100) * (d.jmlHarga - COALESCE(rt.jmlHargaR,0))) AS nilaiPencapaian,
    dv.compCode AS compID, cabid.namaCabang,
    CASE
      WHEN dv.compCode = divt.compCode THEN 'Ya'
      ELSE 'Tidak'
    END AS antarCabang, DATE_FORMAT(t.tglKirim, '%Y-%m') AS Monthly, CONCAT(YEAR(t.tglKirim), ' Q',QUARTER(t.tglKirim)) AS Quarter, CONCAT(YEAR(t.tglKirim), ' S',IF(MONTH(t.tglKirim) < 7, 1, 2)) AS Semester  
    FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
      LEFT JOIN (
        SELECT d.kodeProduk, sum(d.qty) AS qtyR, sum(d.jmlHarga) AS jmlHargaR, sum(d.hpp) AS hppR,
          sum(d.dpp) AS dppR, SUM(d.jmlPoint) AS jmlPointR, t.noreffRetur
          FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
          WHERE t.noreffRetur != '' AND t.status = 'T' ${lap}
          GROUP BY d.kodeProduk, t.noreffRetur
      ) rt ON d.kodeProduk= rt.kodeProduk AND t.nomorBukti=rt.noreffRetur
      LEFT JOIN namaBarang nm ON d.kodeProduk = nm.kodeProduk
      LEFT JOIN karyawan k ON t.salesID=k.kodeKar
      LEFT JOIN produkCat pc ON pc.kodeCat= nm.kodeCat
      LEFT JOIN merk m ON nm.kodeMerk=m.kodeMerk
      LEFT JOIN partner prt ON prt.kodePartner=t.kodePartner
      LEFT JOIN cabang cb ON cb.kodeCab=t.tujuan
      LEFT JOIN divisi divt ON cb.divisiCode = divt.divisiCode
      LEFT JOIN CustCat cust ON cust.idCustCat=prt.catPartner
      LEFT JOIN cabang cabid ON cabid.kodeCab = t.cabID
      LEFT JOIN divisi dv ON dv.divisiCode = cabid.divisiCode
    WHERE t.status IN ('T', 'D') AND t.jnsTrx = :jnsTrx AND t.tglKirim BETWEEN :tgla AND :tglb AND t.asal IN (:kodeCabfilt) ${ancab}`
      : `SELECT d.iddetTrans, d.qty,d.jmlHarga, d.jmlPoint,d.dpp,d.ppn,d.ongkir,d.hpp,d.diskon,d.kodeProduk,
      d.nomorBukti, d.cashback,
      t.status, t.asal,t.tujuan, DATE_FORMAT(t.tglKirim,'%Y-%m-%d') AS tglKirim,t.kodePartner, t.salesID, COALESCE(rt.qtyR,0) AS qtyR,
      COALESCE(rt.jmlHargaR,0) AS jmlHargaR, COALESCE(rt.hppR,0) AS hppR, COALESCE(rt.jmlPointR, 0) AS jmlPointR,
      nm.namaBarang, k.namaKaryawan, pc.produkCategory AS kategoriProduk,
      IF(cb.namaCabang IS NOT NULL, cb.namaCabang, prt.namaPartner) AS namaPemasok,
      IF(cb.namaCabang IS NOT NULL, dv.compCode, cust.jenisCust) AS kategoriPemasok,
      m.namaMerk, cabid.namaCabang,
      dv.compCode AS compID, DATE_FORMAT(t.tglKirim, '%Y-%m') AS Monthly, CONCAT(YEAR(t.tglKirim), ' Q',QUARTER(t.tglKirim)) AS Quarter, CONCAT(YEAR(t.tglKirim), ' S',IF(MONTH(t.tglKirim) < 7, 1, 2)) AS Semester  
      FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
        LEFT JOIN (
          SELECT d.kodeProduk, sum(d.qty) AS qtyR, sum(d.jmlHarga) AS jmlHargaR, sum(d.hpp) AS hppR,
            sum(d.dpp) AS dppR, SUM(d.jmlPoint) AS jmlPointR, t.noreffRetur
            FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
            WHERE t.noreffRetur != '' AND t.status = 'T' ${lap}
            GROUP BY d.kodeProduk, t.noreffRetur
        ) rt ON d.kodeProduk= rt.kodeProduk AND t.nomorBukti=rt.noreffRetur
        LEFT JOIN namaBarang nm ON d.kodeProduk = nm.kodeProduk
        LEFT JOIN karyawan k ON t.salesID=k.kodeKar
        LEFT JOIN produkCat pc ON pc.kodeCat= nm.kodeCat
        LEFT JOIN merk m ON nm.kodeMerk=m.kodeMerk
        LEFT JOIN partner prt ON prt.kodePartner=t.kodePartner
        LEFT JOIN cabang cb ON cb.kodeCab=t.asal
        LEFT JOIN divisi divt ON cb.divisiCode = divt.divisiCode
        LEFT JOIN CustCat cust ON cust.idCustCat=prt.catPartner
        LEFT JOIN cabang cabid ON cabid.kodeCab = t.tujuan
        LEFT JOIN divisi dv ON dv.divisiCode = cabid.divisiCode
      WHERE t.status IN ('T', 'D') AND t.jnsTrx IN ('J', 'B') AND t.tglKirim BETWEEN :tgla AND :tglb AND t.tujuan IN (:kodeCabfilt) ${ancab}`;
  dbuse
    .query(
      {
        namedPlaceholders: true,
        sql: sqla,
      },
      x
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "tidak ditemukan..." });
    });
});

app.post("/cekHPP", (req, res) => {
  let user = req.user.dtAkun;
  let { x } = req.body;
  x.kodeCabfilt = ["MAN", "acc", "purchase"].some((a) => a === user.userType)
    ? x.kodeCab
    : [user.kodeCab];
  let lap = `AND t.cabID IN (:kodeCabfilt)`;
  // console.log(kodeCab)
  let sqla =
    x.jnsTrx === "J"
      ? `SELECT d.iddetTrans, d.qty,d.jmlHarga, d.dpp,d.ppn,d.ongkir,d.hpp,d.diskon,d.kodeProduk,
    d.nomorBukti, d.cashback,
    t.status, t.asal,t.tujuan, DATE_FORMAT(t.tglKirim,'%Y-%m-%d') AS tglKirim,t.kodePartner, t.salesID, COALESCE(rt.qtyR,0) AS qtyR,
    COALESCE(rt.jmlHargaR,0) AS jmlHargaR, COALESCE(rt.hppR,0) AS hppR,
    nm.namaBarang, k.namaKaryawan,
    IF(cb.namaCabang IS NOT NULL, cb.namaCabang, prt.namaPartner) AS namaCust,
    dv.compCode AS compID, cabid.namaCabang
    FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
      LEFT JOIN (
        SELECT d.kodeProduk, sum(d.qty) AS qtyR, sum(d.jmlHarga) AS jmlHargaR, sum(d.hpp) AS hppR,
          sum(d.dpp) AS dppR, SUM(d.jmlPoint) AS jmlPointR, t.noreffRetur
          FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
          WHERE t.noreffRetur != '' AND t.status = 'T' ${lap}
          GROUP BY d.kodeProduk, t.noreffRetur
      ) rt ON d.kodeProduk= rt.kodeProduk AND t.nomorBukti=rt.noreffRetur
      LEFT JOIN namaBarang nm ON d.kodeProduk = nm.kodeProduk
      LEFT JOIN karyawan k ON t.salesID=k.kodeKar
      LEFT JOIN produkCat pc ON pc.kodeCat= nm.kodeCat
      LEFT JOIN partner prt ON prt.kodePartner=t.kodePartner
      LEFT JOIN cabang cb ON cb.kodeCab=t.tujuan
      LEFT JOIN cabang cabid ON cabid.kodeCab = t.cabID
      LEFT JOIN divisi dv ON dv.divisiCode = cabid.divisiCode
    WHERE t.status IN ('T', 'D') AND t.jnsTrx = :jnsTrx AND t.tglKirim BETWEEN :tgla AND :tglb AND t.asal IN (:kodeCabfilt) AND d.hpp <= 0 AND nm.jasa != 'Y'`
      : `SELECT d.iddetTrans, d.qty,d.jmlHarga, d.jmlPoint,d.dpp,d.ppn,d.ongkir,d.hpp,d.diskon,d.kodeProduk,
      d.nomorBukti, d.cashback,
      t.status, t.asal,t.tujuan, DATE_FORMAT(t.tglKirim,'%Y-%m-%d') AS tglKirim,t.kodePartner, t.salesID, COALESCE(rt.qtyR,0) AS qtyR,
      COALESCE(rt.jmlHargaR,0) AS jmlHargaR, COALESCE(rt.hppR,0) AS hppR, COALESCE(rt.jmlPointR, 0) AS jmlPointR,
      nm.namaBarang, k.namaKaryawan, pc.produkCategory AS kategoriProduk,
      IF(cb.namaCabang IS NOT NULL, cb.namaCabang, prt.namaPartner) AS namaPemasok,
      IF(cb.namaCabang IS NOT NULL, 'ASI', cust.jenisCust) AS kategoriPemasok,
      m.namaMerk, cabid.namaCabang,
      dv.compCode AS compID
      FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
        LEFT JOIN (
          SELECT d.kodeProduk, sum(d.qty) AS qtyR, sum(d.jmlHarga) AS jmlHargaR, sum(d.hpp) AS hppR,
            sum(d.dpp) AS dppR, SUM(d.jmlPoint) AS jmlPointR, t.noreffRetur
            FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
            WHERE t.noreffRetur != '' AND t.status = 'T' ${lap}
            GROUP BY d.kodeProduk, t.noreffRetur
        ) rt ON d.kodeProduk= rt.kodeProduk AND t.nomorBukti=rt.noreffRetur
        LEFT JOIN namaBarang nm ON d.kodeProduk = nm.kodeProduk
        LEFT JOIN karyawan k ON t.salesID=k.kodeKar
        LEFT JOIN produkCat pc ON pc.kodeCat= nm.kodeCat
        LEFT JOIN merk m ON nm.kodeMerk=m.kodeMerk
        LEFT JOIN partner prt ON prt.kodePartner=t.kodePartner
        LEFT JOIN cabang cb ON cb.kodeCab=t.asal
        LEFT JOIN CustCat cust ON cust.idCustCat=prt.catPartner
        LEFT JOIN cabang cabid ON cabid.kodeCab = t.cabID
        LEFT JOIN divisi dv ON dv.divisiCode = cabid.divisiCode
      WHERE t.status IN ('T', 'D') AND t.jnsTrx = :jnsTrx AND t.tglKirim BETWEEN :tgla AND :tglb AND t.tujuan IN (:kodeCabfilt)`;
  dbuse
    .query(
      {
        namedPlaceholders: true,
        sql: sqla,
      },
      x
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "tidak ditemukan..." });
    });
});

app.get("/kassales", (req, res) => {
  let salesID = req.user.dtAkun.eID;
  let bln =
    new Date().toLocaleString("sv", { timeZoneName: "short" }).slice(0, 7) +
    "%";
  // transaksi belum setor => setoran ='N' AND ct='sales' AND salesID= salesID,  add hasil bulan ini
  dbuse
    .query(
      `SELECT sisa.sisa,SUM(dt.qty) AS qty,SUM(dt.jmlHarga) AS jmlHarga,SUM(dt.hpp) AS hpp,
      SUM(dt.dpp) AS dpp, t.salesID, e.namaKaryawan,e.photo,c.namaCabang,e.email AS sales
    FROM detTrans dt LEFT JOIN transaksi t ON dt.nomorBukti=t.nomorBukti
    LEFT JOIN karyawan e ON t.salesID=e.kodeKar
    LEFT JOIN cabang c ON e.kodeCab=c.kodeCab
    LEFT JOIN (SELECT (SUM(d.jmlHarga)+IF(t.ongkir='Y',COALESCE(ex.biaya,0),0)) AS sisa, t.salesID
      FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti= t.nomorBukti
        LEFT JOIN expedisi ex ON t.nomorBukti=ex.nomorBukti
      WHERE t.ct='sales' AND t.setoran='N' AND t.salesID=? AND t.jnsTrx='J'
      GROUP BY t.salesID) sisa ON t.salesID= sisa.salesID
    WHERE t.salesID=? AND t.tglTerima like ?  AND t.jnsTrx='J'`,
      [salesID, salesID, bln]
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(501).send({ st: "tidak ditemukan..." });
    });
});

app.post("/kasSalesAll", (req, res) => {
  // transaksi belum setor => setoran ='N' AND ct='sales' AND salesID= salesID
  let { x } = req.body;
  let user = req.user.dtAkun;
  console.log(x);
  let kodeCab = ["MAN", "acc", "purchase"].some((a) => a === user.userType)
    ? x.kodeCab
    : [user.kodeCab];
  // let bln = new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 7) + '%'
  dbuse
    .query(
      `SELECT sisa.sisa,SUM(dt.qty) AS qty,SUM(dt.jmlHarga) AS jmlHarga,SUM(dt.hpp) AS hpp,
      SUM(dt.dpp) AS dpp, t.salesID, e.namaKaryawan,e.photo,c.namaCabang,e.email AS sales
    FROM detTrans dt LEFT JOIN transaksi t ON dt.nomorBukti=t.nomorBukti
    LEFT JOIN karyawan e ON t.salesID=e.kodeKar
    LEFT JOIN cabang c ON e.kodeCab=c.kodeCab
    LEFT JOIN (SELECT (SUM(d.jmlHarga)+IF(t.ongkir='Y',COALESCE(ex.biaya,0),0)) AS sisa, t.salesID
      FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti= t.nomorBukti
        LEFT JOIN expedisi ex ON t.nomorBukti=ex.nomorBukti
      WHERE t.ct='sales' AND t.setoran='N' AND t.jnsTrx='J'
      GROUP BY t.salesID) sisa ON t.salesID= sisa.salesID
    WHERE t.tglTerima like ?  AND t.jnsTrx='J' AND t.asal IN (?)
    GROUP BY t.salesID
    ORDER BY t.cabID ASC`,
      [x.bln + "%", kodeCab]
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(501).send({ st: "tidak ditemukan..." });
    });
});

app.get("/sisaSales?", (req, res) => {
  let salesID = req.query.key;
  let bln =
    new Date().toLocaleString("sv", { timeZoneName: "short" }).slice(0, 7) +
    "%";
  // transaksi belum setor => setoran ='N' AND ct='sales' AND salesID= salesID,  add hasil bulan ini
  dbuse
    .query(
      `SELECT SUM(dt.jmlHarga) AS jmlHarga, t.salesID,t.nomorBukti,DATE_FORMAT(t.tglTerima,'%Y-%m-%d') AS tgl, t.setoran,
      IF(t.ongkir='Y',COALESCE(ex.biaya,0),0) AS ongkir
    FROM detTrans dt LEFT JOIN transaksi t ON dt.nomorBukti=t.nomorBukti
      LEFT JOIN expedisi ex ON t.nomorBukti=ex.nomorBukti
    WHERE t.ct='sales' AND t.setoran='N' AND t.salesID=? AND t.jnsTrx='J'
    GROUP BY dt.nomorBukti
    ORDER BY t.tglTerima ASC`,
      [salesID]
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(501).send({ st: "tidak ditemukan..." });
    });
});

// expedisi

app.post("/biayaPaket", (req, res) => {
  let user = req.user.dtAkun;
  let { x } = req.body;
  let kodeCab = ["MAN", "acc", "purchase"].some((a) => a == user.userType)
    ? x.kodeCab
    : [user.kodeCab];
  dbuse
    .query(
      {
        dateStrings: true,
        sql: `SELECT exp.nomorBukti, exp.idExp,exp.noresi, exp.biaya, exp.partnerID, exp.kodeCab,exp.alamatTujuan,
      t.tglKirim, p.namaPartner AS namaExpedisi, j.nomorJurnal
    FROM expedisi exp LEFT JOIN transaksi t ON exp.nomorBukti=t.nomorBukti
      LEFT JOIN partner p ON p.kodePartner=exp.partnerID
      LEFT JOIN (
        SELECT j.nomorJurnal, j.nomorSuratJalan FROM
          jurnal j WHERE j.jn='e') j ON j.nomorSuratJalan=exp.nomorBukti
    WHERE exp.kodeCab in (?) AND t.status !='B'
    ORDER BY tglKirim ASC`,
      },
      kodeCab
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(501).send({ st: "tidak ditemukan..." });
    });
});

app.post("/addTrxpaket", (req, res) => {
  let user = req.user.dtAkun;
  let { x } = req.body;
  x.kodeCab = ["MAN", "acc", "purchase"].some((a) => a == user.userType)
    ? x
    : user.kodeCab;
  dbuse
    .query(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO expedisi (kodeCab,partnerID,tglKirim,alamatTujuan,noresi,biaya,nomorBukti)
      VALUES (:kodeCab,:partnerID,:tglKirim,:alamatTujuan,:noresi,:biaya,:nomorBukti)
      ON DUPLICATE KEY UPDATE
      partnerID=:partnerID,tglKirim=:tglKirim,alamatTujuan=:alamatTujuan,noresi=:noresi,biaya=:biaya,nomorBukti=:nomorBukti`,
      },
      x
    )
    .then((rows) => {
      res.send({ st: "tersimpan..." });
    })
    .catch((err) => {
      console.log(err);
      res.status(501).send({ st: "tidak ditemukan..." });
    });
});

// akunting

app.post("/salesSetor", async (req, res) => {
  let { x } = req.body;
  console.log(x);
  let tgl = new Date();
  let hd = {
    uraian: `Setoran sales no Inv ${x.nomorBukti}`,
    nomorSuratJalan: x.nomorBukti,
  };
  let det = [
    {
      kodeAkun: "110100002",
      DK: "D",
      nilai: jumlah([x.jmlHarga, x.ongkir]),
      desk: `Setoran sales no Inv ${x.nomorBukti}`,
    },
    {
      kodeAkun: "110100003",
      DK: "K",
      nilai: jumlah([x.jmlHarga, x.ongkir]),
      desk: `Setoran sales no Inv ${x.nomorBukti}`,
    },
  ];
  let user = req.user.dtAkun;
  let noreff = hd.noreff ? hd.noreff : "";
  try {
    let judul = hd.uraian;
    //    let cabLain = (hd.ac ==='Y' && hd.jnsTrx ==='J') ? hd.tujuan : (hd.ac ==='Y' && hd.jnsTrx ==='B') ? hd.asal : ''
    //    let jhp = (hd.ct ==='tempo' && hd.jnsTrx ==='B') ? 'H' : (hd.ct ==='tempo' && hd.jnsTrx ==='J') ? 'P' : 'L'

    let status = "W",
      jnsTrx = "S";
    let urt = `${(tgl.getMonth() + 1).toString().padStart(2, "0")}${tgl
      .getFullYear()
      .toString()
      .slice(2)}`;
    let cr = user.kodeCab + "99" + urt;
    let urut = await dbuse.query(
      `SELECT COUNT(nomorJurnal) AS nom FROM jurnal WHERE ISNULL(jn) AND nomorJurnal like '${cr}%'`,
      [cr]
    );
    let nojur = cr + String(parseInt(urut[0].nom) + 1).padStart(6, "0");
    let nomerJurnal = await dbuse.query(
      `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,judulJurnal,noreff,status,nomorSuratJalan, oleh)
      VALUES (?,?,NOW(),?,?,?,?,?,?)`,
      [
        user.kodeCab,
        nojur,
        jnsTrx,
        judul,
        noreff,
        status,
        hd.nomorSuratJalan,
        user.eID,
      ]
    );
    // add detail jurnal penjualan, hpp per kategori produk
    let upstat = await dbuse.query(
      "UPDATE transaksi SET setoran='W' WHERE nomorBukti=?",
      [x.nomorBukti]
    );
    let st = ["nomorJurnal", "kodeAkun", "DK", "nilai", "desk"];
    //  let val = await col.map(a => Object.values(a))
    let val = det.map((a) => {
      let u = [];
      for (let i in st) {
        a[st[i]] == undefined ? u.push(nojur) : u.push(a[st[i]]);
      }
      return u;
    });
    dbuse
      .batch(
        `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,desk) VALUES (?,?,?,?,?)`,
        val
      )
      .then((rows) => {
        res.send({ st: "tersimpan..." });
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    console.log(err);
    res.status(410).send({ st: "gagal simpan..." });
  } finally {
    res.send({ st: "Tersimpan..." });
  }
});

app.post("/terimasetoran", admin, async (req, res) => {
  let x = req.body.x;
  console.log(x);
  if (x.setoran === "N") {
    let tgl = new Date();
    let hd = {
      uraian: `Setoran sales no Inv ${x.nomorBukti}`,
      nomorSuratJalan: x.nomorBukti,
    };
    let det = [
      {
        kodeAkun: "110100002",
        DK: "D",
        nilai: x.nilai,
        desk: `Setoran sales no Inv ${x.nomorBukti}`,
      },
      {
        kodeAkun: "110100003",
        DK: "K",
        nilai: x.nilai,
        desk: `Setoran sales no Inv ${x.nomorBukti}`,
      },
    ];
    let user = req.user.dtAkun;
    let noreff = hd.noreff ? hd.noreff : "";
    try {
      let judul = hd.uraian;
      //    let cabLain = (hd.ac ==='Y' && hd.jnsTrx ==='J') ? hd.tujuan : (hd.ac ==='Y' && hd.jnsTrx ==='B') ? hd.asal : ''
      //    let jhp = (hd.ct ==='tempo' && hd.jnsTrx ==='B') ? 'H' : (hd.ct ==='tempo' && hd.jnsTrx ==='J') ? 'P' : 'L'

      let status = "T",
        jnsTrx = "S";
      let urt = `${(tgl.getMonth() + 1).toString().padStart(2, "0")}${tgl
        .getFullYear()
        .toString()
        .slice(2)}`;
      let cr = user.kodeCab + "99" + urt;
      let urut = await dbuse.query(
        `SELECT COUNT(nomorJurnal) AS nom FROM jurnal WHERE ISNULL(jn) AND nomorJurnal like '${cr}%'`,
        [cr]
      );
      let nojur = cr + String(parseInt(urut[0].nom) + 1).padStart(6, "0");
      let nomerJurnal = await dbuse.query(
        `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,judulJurnal,noreff,status,nomorSuratJalan, oleh)
        VALUES (?,?,NOW(),?,?,?,?,?,?)`,
        [
          user.kodeCab,
          nojur,
          jnsTrx,
          judul,
          noreff,
          status,
          hd.nomorSuratJalan,
          user.eID,
        ]
      );
      // add detail jurnal penjualan, hpp per kategori produk
      let upstat = await dbuse.query(
        "UPDATE transaksi SET setoran='T' WHERE nomorBukti=?",
        [x.nomorBukti]
      );
      let st = ["nomorJurnal", "kodeAkun", "DK", "nilai", "desk"];
      //  let val = await col.map(a => Object.values(a))
      let val = det.map((a) => {
        let u = [];
        for (let i in st) {
          a[st[i]] == undefined ? u.push(nojur) : u.push(a[st[i]]);
        }
        return u;
      });
      dbuse
        .batch(
          `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,desk) VALUES (?,?,?,?,?)`,
          val
        )
        .then((rows) => {
          res.send({ st: "tersimpan..." });
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (err) {
      console.log(err);
      res.status(410).send({ st: "gagal simpan..." });
    } finally {
      res.send({ st: "Setoran diterima admin..." });
    }
  } else {
    try {
      let ju = await dbuse.query(
        "UPDATE jurnal SET status=? WHERE nomorJurnal=?",
        [x.stat, x.nomorJurnal]
      );
      let trx = await dbuse.query(
        "UPDATE transaksi SET setoran=? WHERE nomorBukti=?",
        [x.stat, x.nomorBukti]
      );
    } catch (err) {
      console.log(err);
      res.status(410).send({ st: "Gagal simpan..." });
    } finally {
      res.send({ st: "Setoran diterima admin..." });
    }
  }
});

app.post("/salesSetorAll", (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  let kodeCab = ["MAN", "acc"].some((a) => a == user.userType)
    ? x.kodeCab
    : [user.kodeCab];
  dbuse
    .query(
      `SELECT (SUM(d.jmlHarga)+IF(t.ongkir='Y',COALESCE(ex.biaya,0),0)) AS nilai,j.nomorJurnal,DATE_FORMAT(j.tglJurnal,'%Y-%m-%d') AS tglSetor,
      t.setoran,t.nomorBukti, t.salesID,DATE_FORMAT(t.tglTerima,'%Y-%m-%d') AS tglTrx, e.namaKaryawan,
      IF(t.ongkir='Y',COALESCE(ex.biaya,0),0) AS ongkir
    FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
      LEFT JOIN expedisi ex ON t.nomorBukti=ex.nomorBukti
      LEFT JOIN (SELECT * FROM jurnal WHERE jnsJurnal='S') j ON j.nomorSuratJalan=t.nomorBukti
      LEFT JOIN karyawan e ON t.salesID=e.kodeKar
    WHERE t.jnsTrx='J' AND t.ct='sales' AND t.status='T' AND t.setoran=? AND t.cabID IN (?)
    GROUP BY t.nomorBukti`,
      [x.status, kodeCab]
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send("err mas");
    });
});

app.post("/aruskass", async (req, res) => {
  let { tgla, tglb } = req.body.x;
  let { x } = req.body;
  let user = req.user.dtAkun;
  let kodeCab = ["MAN", "acc", "purchase"].some((a) => a == user.userType)
    ? x.kodeCab
    : [user.kodeCab];
  let sawal = {};
  // pilih msAC if ac Y...
  try {
    let dt = await dbuse.query(
      `SELECT
      CASE
        WHEN (trx.ac='Y' AND dt.DK='D' AND dt.msAC='M' AND trx.cabID IN (?)) OR (trx.ac='Y' AND dt.DK='D' AND dt.msAC='S' AND trx.cabLain IN (?)) THEN dt.nilai
        WHEN trx.ac='N' AND dt.DK='D' THEN dt.nilai
        ELSE 0
      END AS masuk,
      CASE
        WHEN (trx.ac='Y' AND dt.DK='K' AND dt.msAC='M' AND trx.cabID IN (?)) OR (trx.ac='Y' AND dt.DK='K' AND dt.msAC='S' AND trx.cabLain IN (?)) THEN dt.nilai
        WHEN trx.ac='N' AND dt.DK='K' THEN dt.nilai
        ELSE 0
      END AS keluar, dt.desk,
          DATE_FORMAT(trx.tglJurnal,'%Y-%m-%d') AS tgl, trx.nomorJurnal,trx.judulJurnal,dt.iddetJur,dt.msAC,trx.ac,
          IF(dt.msAC='M',trx.cabID,trx.cabLain) AS kodeCab,
          dt.kodeAkun,COA.namaAkun
      FROM detJur dt LEFT JOIN jurnal trx ON dt.nomorJurnal=trx.nomorJurnal
        LEFT JOIN COA ON COA.kodeAkun= dt.kodeAkun
        LEFT JOIN subAkun sb ON sb.kodeSubAkun=COA.subAkun
      WHERE (trx.tglJurnal BETWEEN ? AND ?)
        AND (trx.status !='B' AND trx.status !='W')
        AND (trx.cabID IN (?) OR trx.cabLain IN (?) )
        AND sb.aruskas='Y'
      ORDER BY trx.tglJurnal,trx.nomorJurnal `,
      [kodeCab, kodeCab, kodeCab, kodeCab, tgla, tglb, kodeCab, kodeCab]
    );
    dbuse
      .query(
        `SELECT COALESCE(SUM(IF(dt.DK='D',dt.nilai,-dt.nilai)),0) AS sawalIDR, dt.kodeAkun
        FROM detJur dt LEFT JOIN jurnal trx ON dt.nomorJurnal=trx.nomorJurnal
          LEFT JOIN COA ON COA.kodeAkun= dt.kodeAkun
          LEFT JOIN subAkun sb ON sb.kodeSubAkun=COA.subAkun
        WHERE trx.tglJurnal < ? AND sb.aruskas='Y' AND (trx.status !='B' AND trx.status !='W') AND (trx.cabID IN (?) OR trx.cabLain IN (?))`,
        [tgla, kodeCab, kodeCab]
      )
      .then((rows) => {
        sawal = rows[0].sawalIDR;
        res.send({ sawal: sawal, dt: dt });
      })
      .catch((err) => {
        console.log(err);
        res.status(410).send("err mas");
      });
  } catch (err) {
    console.log(err);
    res.status(410).send("err mas");
  }
});

app.post("/aruskas", async (req, res) => {
  let { tgla, tglb } = req.body.x;
  let { x } = req.body;
  let user = req.user.dtAkun;
  let kodeCab = ["MAN", "acc", "purchase"].some((a) => a === user.userType)
    ? x.kodeCab
    : [user.kodeCab];
  // let sawal = {}
  // pilih msAC if ac Y...
  try {
    let pjTunai = await dbuse.query(
      `SELECT t.nomorBukti, t.kodePartner, t.asal, t.tujuan, t.akunBayar, c.subAkun, ju.nilai, 'Penjualan Tunai' AS jenis, ju.judulJurnal, ju.desk,
      ju.nomorJurnal, ju.tglJurnal, IF(t.ac='Y', cb.namaCabang, pt.namaPartner) AS namaPartner, t.asal AS milik
      FROM transaksi t
        LEFT JOIN (
          SELECT SUM(
            CASE
              WHEN (j.ac='Y' AND dj.DK='D' AND dj.msAC='M' AND j.cabID IN (?)) OR (j.ac='Y' AND dj.DK='D' AND dj.msAC='S' AND j.cabLain IN (?)) THEN dj.nilai
              WHEN j.ac='N' AND dj.DK='D' THEN dj.nilai
              ELSE 0
            END
          ) AS nilai, dj.nomorJurnal, dj.kodeAkun, DATE_FORMAT(j.tglJurnal, '%Y-%m-%d') AS tglJurnal, dj.desk, j.judulJurnal FROM detJur dj
            LEFT JOIN jurnal j ON dj.nomorJurnal=j.nomorJurnal
            LEFT JOIN COA c ON dj.kodeAkun= c.kodeAkun
          WHERE j.tglJurnal BETWEEN ? AND ? AND j.status != 'B' AND c.subAkun IN ('11010', '11020') AND ( j.cabID IN (?) OR j.cabLain IN (?))
          GROUP BY dj.nomorJurnal) ju ON t.nomorJurnal=ju.nomorJurnal
      LEFT JOIN COA c ON t.akunBayar=c.kodeAkun
      LEFT JOIN partner pt ON pt.kodePartner = t.kodePartner
      LEFT JOIN cabang cb ON cb.kodeCab = t.tujuan
      WHERE t.asal IN (?) AND c.subAkun IN ('11010', '11020') AND ju.tglJurnal BETWEEN ? AND ? AND t.status != 'B'
      HAVING nilai != 0`,
      [kodeCab, kodeCab, tgla, tglb, kodeCab, kodeCab, kodeCab, tgla, tglb]
    ); // penjualan tunai
    let blTunai = await dbuse.query(
      `SELECT t.nomorBukti, t.kodePartner, t.asal, t.tujuan, t.akunBayar, c.subAkun, ju.nilai, 'Beli Tunai' AS jenis, ju.judulJurnal, ju.desk,
      ju.nomorJurnal, ju.tglJurnal, IF(t.ac='Y', cb.namaCabang, pt.namaPartner) AS namaPartner, t.tujuan AS milik
      FROM transaksi t
        LEFT JOIN (
          SELECT SUM(
            CASE
              WHEN (j.ac='Y' AND dj.DK='K' AND dj.msAC='M' AND j.cabID IN (?)) OR (j.ac='Y' AND dj.DK='K' AND dj.msAC='S' AND j.cabLain IN (?)) THEN dj.nilai
              WHEN j.ac='N' AND dj.DK='K' THEN dj.nilai
              ELSE 0
            END
          ) AS nilai, dj.nomorJurnal, dj.kodeAkun, DATE_FORMAT(j.tglJurnal, '%Y-%m-%d') AS tglJurnal, dj.desk, j.judulJurnal FROM detJur dj
            LEFT JOIN jurnal j ON dj.nomorJurnal=j.nomorJurnal
            LEFT JOIN COA c ON dj.kodeAkun= c.kodeAkun
          WHERE j.tglJurnal BETWEEN ? AND ? AND j.status != 'B' AND c.subAkun IN ('11010', '11020') AND ( j.cabID IN (?) OR j.cabLain IN (?))
          GROUP BY dj.nomorJurnal) ju ON t.nomorJurnal=ju.nomorJurnal
      LEFT JOIN COA c ON t.akunBayar=c.kodeAkun
      LEFT JOIN partner pt ON pt.kodePartner = t.kodePartner
      LEFT JOIN cabang cb ON cb.kodeCab = t.tujuan
      WHERE t.tujuan IN (?) AND c.subAkun IN ('11010', '11020') AND ju.tglJurnal BETWEEN ? AND ? AND t.status != 'B'
      HAVING nilai != 0`,
      [kodeCab, kodeCab, tgla, tglb, kodeCab, kodeCab, kodeCab, tgla, tglb]
    );
    /* let pitUsaha = await dbuse.query(`
      SELECT SUM(IF(dj.DK='D',dj.nilai, -dj.nilai)) AS nilai, dj.nomorJurnal, dj.kodeAkun, DATE_FORMAT(j.tglJurnal, '%Y-%m-%d') AS tglJurnal,
        IF(dj.desk= '',j.judulJurnal, dj.desk) AS judulJurnal, 'Penerimaan dari Piutang Usaha' AS jenis, IF(j.ac='Y', cb.namaCabang, pt.namaPartner) AS namaPartner, j.kodePartner
      FROM detJur dj
        LEFT JOIN jurnal ju ON ju.nomorJurnal=dj.nomorReff
        LEFT JOIN jurnal j ON j.nomorJurnal= dj.nomorJurnal
        LEFT JOIN COA c ON dj.kodeAkun= c.kodeAkun
        LEFT JOIN partner pt ON pt.kodePartner = j.kodePartner
        LEFT JOIN cabang cb ON cb.kodeCab = j.cabLain
      WHERE j.tglJurnal BETWEEN ? AND ? AND j.status != 'B' AND c.subAkun IN ('11010', '11020') AND dj.DK = 'D' AND ( j.cabID IN (?) OR j.cabLain IN (?)) AND ju.nomorSuratJalan !=''
      GROUP BY dj.nomorJurnal
      HAVING nilai != 0`, [tgla, tglb, kodeCab, kodeCab, tgla, tglb, kodeCab, kodeCab, kodeCab]) */
    let pitUsaha = await dbuse.query(
      `
          SELECT SUM(CASE
            WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN dj.nilai
            WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN dj.nilai
            ELSE 0
          END) AS nilai, dj.nomorJurnal, dj.kodeAkun, DATE_FORMAT(j.tglJurnal, '%Y-%m-%d') AS tglJurnal,
            IF(dj.desk= '',j.judulJurnal, dj.desk) AS judulJurnal, 'Penerimaan dari Piutang Usaha' AS jenis, IF(j.ac='Y',
            cb.namaCabang, pt.namaPartner) AS namaPartner, j.kodePartner,
          CASE
            WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN j.cabLain
            WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN j.cabID
            ELSE ''
          END AS milik
            FROM detJur dj
            LEFT JOIN (SELECT distinct j.* from detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
              LEFT JOIN COA c ON c.kodeAkun = d.kodeAkun
              WHERE c.subAkun IN ('11010', '11020') AND j.tglJurnal BETWEEN ? AND ? AND ( j.cabID IN (?) OR j.cabLain IN (?)) ) j ON dj.nomorJurnal=j.nomorJurnal
            LEFT JOIN COA c ON dj.kodeAkun= c.kodeAkun
            LEFT JOIN partner pt ON pt.kodePartner = j.kodePartner
            LEFT JOIN cabang cb ON cb.kodeCab = j.cabLain
          WHERE j.tglJurnal BETWEEN ? AND ? AND j.status != 'B' AND dj.kodeAkun= '110500001' AND dj.DK = 'K' AND ( j.cabID IN (?) OR (j.cabLain IN (?) AND dj.msAC='S'))
          GROUP BY dj.nomorJurnal
          HAVING nilai != 0`,
      [
        kodeCab,
        kodeCab,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        kodeCab,
      ]
    );
    // penerimaan non Usaha
    let pdNonUsaha = await dbuse.query(
      `SELECT SUM(IF(dj.DK='K',dj.nilai, -dj.nilai)) AS nilai, dj.nomorJurnal,
      dj.kodeAkun, DATE_FORMAT(j.tglJurnal, '%Y-%m-%d') AS tglJurnal,
      IF(dj.desk= '',j.judulJurnal, dj.desk) AS judulJurnal,
        CASE
          WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN j.cabLain
          WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN j.cabID
          ELSE ''
        END AS milik,
        c.namaAkun, 'Penerimaan Non Usaha' AS jenis, IF(j.ac='Y', cb.namaCabang, pt.namaPartner) AS namaPartner
        FROM detJur dj
            LEFT JOIN (SELECT distinct j.* from detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
              LEFT JOIN COA c ON c.kodeAkun = d.kodeAkun
              WHERE c.subAkun IN ('11010', '11020') AND j.tglJurnal BETWEEN ? AND ? AND ( j.cabID IN (?) OR j.cabLain IN (?)) ) j ON dj.nomorJurnal=j.nomorJurnal
            LEFT JOIN COA c ON dj.kodeAkun= c.kodeAkun
            LEFT JOIN subAkun s ON c.subAkun= s.kodeSubAkun
            LEFT JOIN partner pt ON pt.kodePartner = j.kodePartner
            LEFT JOIN cabang cb ON cb.kodeCab = j.cabLain
          WHERE j.tglJurnal BETWEEN ? AND ? AND j.status != 'B' AND s.kodeSubAkun != '11050' AND
            c.midSub NOT IN ('230', '130', '140') AND c.subAkun NOT IN ('11010', '11020', '61010')  AND j.nomorSuratJalan = '' AND c.kodeAkun !='610100007' AND c.kodeAkun !='610100008'
            AND dj.DK='K' AND ( j.cabID IN (?) OR j.cabLain IN (?))
            GROUP BY dj.nomorJurnal
            HAVING nilai != 0`,
      [
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
      ]
    );
    let pdpLain = await dbuse.query(
      `SELECT SUM(IF(dj.DK=c.jnsAkun,dj.nilai, -dj.nilai)) AS nilai,
      dj.nomorJurnal, dj.kodeAkun, DATE_FORMAT(j.tglJurnal, '%Y-%m-%d') AS tglJurnal,
      IF(dj.desk= '',j.judulJurnal, dj.desk) AS judulJurnal, 'Penerimaan Lain-lain' AS jenis,
      c.namaAkun, IF(j.ac='Y', cb.namaCabang, pt.namaPartner) AS namaPartner,
      CASE
        WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN j.cabLain
        WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN j.cabID
        ELSE ''
      END AS milik
        FROM detJur dj
        LEFT JOIN (SELECT distinct j.* from detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
              LEFT JOIN COA c ON c.kodeAkun = d.kodeAkun
              WHERE c.subAkun IN ('11010', '11020') AND j.tglJurnal BETWEEN ? AND ? AND ( j.cabID IN (?) OR j.cabLain IN (?)) ) j ON dj.nomorJurnal=j.nomorJurnal
        LEFT JOIN COA c ON dj.kodeAkun= c.kodeAkun
        LEFT JOIN subAkun s ON c.subAkun= s.kodeSubAkun
        LEFT JOIN partner pt ON pt.kodePartner = j.kodePartner
        LEFT JOIN cabang cb ON cb.kodeCab = j.cabLain
      WHERE j.tglJurnal BETWEEN ? AND ? AND j.status != 'B' AND (c.jnsAkun = 'K' AND s.kodeSubAkun = '61010') AND dj.kodeAkun != '610100007' AND ( j.cabID IN (?) OR j.cabLain IN (?))
      GROUP BY dj.nomorJurnal
      HAVING nilai != 0`,
      [
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        kodeCab,
      ]
    );
    let pdpBunga = await dbuse.query(
      `SELECT SUM(IF(dj.DK=c.jnsAkun,dj.nilai, -dj.nilai)) AS nilai, dj.nomorJurnal,
      dj.kodeAkun, DATE_FORMAT(j.tglJurnal, '%Y-%m-%d') AS tglJurnal,
      CASE
        WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN j.cabLain
        WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN j.cabID
        ELSE ''
      END AS milik,
      IF(dj.desk= '',j.judulJurnal, dj.desk) AS judulJurnal, 'Bunga Bank' AS jenis, IF(j.ac='Y', cb.namaCabang, pt.namaPartner) AS namaPartner
      FROM detJur dj
      LEFT JOIN (SELECT distinct j.* from detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
            LEFT JOIN COA c ON c.kodeAkun = d.kodeAkun
            WHERE c.subAkun IN ('11010', '11020') AND j.tglJurnal BETWEEN ? AND ? AND ( j.cabID IN (?) OR j.cabLain IN (?)) ) j ON dj.nomorJurnal=j.nomorJurnal
      LEFT JOIN COA c ON dj.kodeAkun= c.kodeAkun
      LEFT JOIN subAkun s ON c.subAkun= s.kodeSubAkun
      LEFT JOIN partner pt ON pt.kodePartner = j.kodePartner
      LEFT JOIN cabang cb ON cb.kodeCab = j.cabLain
    WHERE j.tglJurnal BETWEEN ? AND ? AND j.status != 'B' AND (c.jnsAkun = 'K' AND s.kodeSubAkun = '61010') AND dj.kodeAkun = '610100007' AND ( j.cabID IN (?) OR j.cabLain IN (?))
    GROUP BY dj.nomorJurnal
    HAVING nilai != 0`,
      [
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        kodeCab,
      ]
    );
    let biayaLain = await dbuse.query(
      `SELECT SUM(
      CASE
        WHEN dj.DK=c.jnsAkun THEN IF(c.subAkun != '61020', -dj.nilai, dj.nilai)
        WHEN dj.DK != c.jnsAkun THEN  IF(c.subAkun != '61020', dj.nilai, -dj.nilai)
        ELSE 0
      END) AS nilai,
      dj.nomorJurnal, dj.kodeAkun, DATE_FORMAT(j.tglJurnal, '%Y-%m-%d') AS tglJurnal,
      IF(dj.desk= '',j.judulJurnal, dj.desk) AS judulJurnal, 'Biaya Lain-lain' AS jenis,
      c.namaAkun, IF(j.ac='Y', cb.namaCabang, pt.namaPartner) AS namaPartner,
      CASE
        WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN j.cabLain
        WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN j.cabID
        ELSE ''
      END AS milik
      FROM detJur dj
        LEFT JOIN (SELECT distinct j.* from detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
              LEFT JOIN COA c ON c.kodeAkun = d.kodeAkun
              WHERE c.subAkun IN ('11010', '11020') AND j.tglJurnal BETWEEN ? AND ? AND ( j.cabID IN (?) OR j.cabLain IN (?)) ) j ON dj.nomorJurnal=j.nomorJurnal
        LEFT JOIN COA c ON dj.kodeAkun= c.kodeAkun
        LEFT JOIN subAkun s ON c.subAkun= s.kodeSubAkun
        LEFT JOIN partner pt ON pt.kodePartner = j.kodePartner
        LEFT JOIN cabang cb ON cb.kodeCab = j.cabLain
      WHERE j.tglJurnal BETWEEN ? AND ? AND j.status != 'B' AND (c.subAkun = '61020' AND c.kodeAkun != '610200005') AND ( j.cabID IN (?) OR j.cabLain IN (?))
      GROUP BY dj.nomorJurnal
      HAVING nilai != 0`,
      [
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        kodeCab,
      ]
    );
    let BoP = await dbuse.query(
      `
      SELECT SUM(CASE
        WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN dj.nilai
        WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN dj.nilai
        ELSE 0
      END) AS nilai,
      CASE
        WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN j.cabLain
        WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN j.cabID
        ELSE ''
      END AS milik, dj.nomorJurnal, dj.kodeAkun, DATE_FORMAT(j.tglJurnal, '%Y-%m-%d') AS tglJurnal, IF(dj.desk= '',j.judulJurnal, dj.desk) AS judulJurnal,
       'Biaya Operasional' AS jenis, c.namaAkun, IF(j.ac='Y', cb.namaCabang, pt.namaPartner) AS namaPartner
      FROM detJur dj
        LEFT JOIN (SELECT distinct j.* from detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
          LEFT JOIN COA c ON c.kodeAkun = d.kodeAkun
          WHERE (c.subAkun IN ('11010', '11020'))AND j.tglJurnal BETWEEN ? AND ? AND ( j.cabID IN (?) OR j.cabLain IN (?)) ) j ON dj.nomorJurnal=j.nomorJurnal
        LEFT JOIN COA c ON dj.kodeAkun= c.kodeAkun
        LEFT JOIN partner pt ON pt.kodePartner = j.kodePartner
        LEFT JOIN cabang cb ON cb.kodeCab = j.cabLain
      WHERE j.tglJurnal BETWEEN ? AND ? AND j.status != 'B' AND
        (c.midSub= '510' OR c.subAkun IN ('21070', '11060', '11065', '15010'))
        AND dj.kodeAkun NOT IN ('150100001','110600001', '110650005') AND j.jnsJurnal NOT IN ('J', 'B') AND dj.DK = 'D' AND ( j.cabID IN (?) OR (j.cabLain IN (?) AND dj.msAC='S'))
      GROUP BY dj.nomorJurnal
      HAVING nilai != 0`,
      [
        kodeCab,
        kodeCab,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        kodeCab,
      ]
    );
    // '110600001', '110650005', '150100001','510100005'
    //  OR c.kodeAkun ='110510001'
    // OR dj.kodeAkun='110600001'
    let hutUsaha = await dbuse.query(
      `
      SELECT dj.nomorJurnal, dj.kodeAkun,
      SUM(CASE
        WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN dj.nilai
        WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN dj.nilai
        ELSE 0
      END) AS nilai,
      CASE
        WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN j.cabLain
        WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN j.cabID
        ELSE ''
      END AS milik,
      DATE_FORMAT(j.tglJurnal, '%Y-%m-%d') AS tglJurnal, IF(dj.desk= '',j.judulJurnal, dj.desk) AS judulJurnal,
       'Pembayaran ke Supplier' AS jenis,
        CASE
          WHEN j.ac='Y' THEN cb.namaCabang
          WHEN pt.namaPartner IS NOT NULL THEN pt.namaPartner
          ELSE k.namaKaryawan END AS namaPartner,
        CASE
          WHEN j.ac='Y' THEN cb.kodeCab
          WHEN pt.namaPartner IS NOT NULL THEN pt.kodePartner
          ELSE k.kodeKar END AS kodePartner
      FROM detJur dj
        LEFT JOIN (SELECT distinct j.* from detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
          LEFT JOIN COA c ON c.kodeAkun = d.kodeAkun
          WHERE c.subAkun IN ('11010', '11020') AND j.tglJurnal BETWEEN ? AND ? AND ( j.cabID IN (?) OR j.cabLain IN (?)) ) j ON dj.nomorJurnal=j.nomorJurnal
        LEFT JOIN COA c ON dj.kodeAkun= c.kodeAkun
        LEFT JOIN partner pt ON pt.kodePartner = j.kodePartner
        LEFT JOIN cabang cb ON cb.kodeCab = j.cabLain
        LEFT JOIN karyawan k ON j.salesID= k.kodeKar
      WHERE j.tglJurnal BETWEEN ? AND ? AND j.status != 'B' AND (dj.kodeAkun= '210100001') AND dj.DK = 'D' AND ( j.cabID IN (?) OR (j.cabLain IN (?) AND dj.msAC ='S'))
      GROUP BY dj.nomorJurnal
      HAVING nilai != 0`,
      [
        kodeCab,
        kodeCab,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        kodeCab,
      ]
    );
    let dpBeli = await dbuse.query(
      `
      SELECT SUM(IF(dj.DK='K',-dj.nilai, dj.nilai)) AS nilai, dj.nomorJurnal, dj.kodeAkun, DATE_FORMAT(j.tglJurnal, '%Y-%m-%d') AS tglJurnal, IF(dj.desk= '',j.judulJurnal, dj.desk) AS judulJurnal,
       'Pembelian Tunai/ DP' AS jenis,
        CASE
          WHEN j.ac='Y' THEN cb.namaCabang
          WHEN pt.namaPartner IS NOT NULL THEN pt.namaPartner
          ELSE k.namaKaryawan END AS namaPartner,
        CASE
          WHEN j.ac='Y' THEN cb.kodeCab
          WHEN pt.namaPartner IS NOT NULL THEN pt.kodePartner
          ELSE k.kodeKar END AS kodePartner,
        CASE
          WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN j.cabLain
          WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN j.cabID
          ELSE ''
        END AS milik
      FROM detJur dj
        LEFT JOIN (SELECT distinct j.* from detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
          LEFT JOIN COA c ON c.kodeAkun = d.kodeAkun
          WHERE c.subAkun IN ('11010', '11020') AND j.tglJurnal BETWEEN ? AND ? AND ( j.cabID IN (?) OR j.cabLain IN (?)) ) j ON dj.nomorJurnal=j.nomorJurnal
        LEFT JOIN COA c ON dj.kodeAkun= c.kodeAkun
        LEFT JOIN partner pt ON pt.kodePartner = j.kodePartner
        LEFT JOIN cabang cb ON cb.kodeCab = j.cabLain
        LEFT JOIN karyawan k ON j.salesID= k.kodeKar
      WHERE j.tglJurnal BETWEEN ? AND ? AND j.status != 'B' AND (dj.kodeAkun= '110600001') AND dj.DK = 'D' AND ( j.cabID IN (?) OR j.cabLain IN (?))
      GROUP BY dj.nomorJurnal
      HAVING nilai != 0`,
      [
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        kodeCab,
      ]
    );
    let hutNonUsaha = await dbuse.query(
      `
      SELECT SUM(CASE
        WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN dj.nilai
        WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN dj.nilai
        ELSE 0
      END) AS nilai,
      CASE
        WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN j.cabLain
        WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN j.cabID
        ELSE ''
      END AS milik, dj.nomorJurnal, dj.kodeAkun, DATE_FORMAT(j.tglJurnal, '%Y-%m-%d') AS tglJurnal, IF(dj.desk= '',j.judulJurnal, dj.desk) AS judulJurnal,
       'Pengeluaran dari Hutang Non Usaha' AS jenis, IF(j.ac='Y', cb.namaCabang, pt.namaPartner) AS namaPartner, j.kodePartner, c.namaAkun
      FROM detJur dj
        LEFT JOIN (SELECT distinct j.* from detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
          LEFT JOIN COA c ON c.kodeAkun = d.kodeAkun
          WHERE c.subAkun IN ('11010', '11020') AND j.tglJurnal BETWEEN ? AND ? AND ( j.cabID IN (?) OR j.cabLain IN (?)) ) j ON dj.nomorJurnal=j.nomorJurnal
        LEFT JOIN COA c ON dj.kodeAkun= c.kodeAkun
        LEFT JOIN partner pt ON pt.kodePartner = j.kodePartner
        LEFT JOIN cabang cb ON cb.kodeCab = j.cabLain
      WHERE j.tglJurnal BETWEEN ? AND ? AND j.status != 'B' AND (dj.kodeAkun != '210100001' AND dj.kodeAkun !='110600001' AND dj.kodeAkun !='110560001') AND (c.midSub NOT IN ('510', '130', '140', '610', '230')) AND c.subAkun NOT IN ('11010', '11020', '21070', '11060', '11065', '15010') AND j.nomorSuratJalan = ''
        AND dj.DK = 'D' AND ( j.cabID IN (?) OR j.cabLain IN (?))
      GROUP BY dj.nomorJurnal
      HAVING nilai != 0
      ORDER BY dj.kodeAkun, dj.nomorJurnal`,
      [
        kodeCab,
        kodeCab,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        kodeCab,
      ]
    );
    let biayaPjkBagiHasil = await dbuse.query(
      `SELECT SUM(
      CASE
        WHEN dj.DK=c.jnsAkun THEN IF(c.subAkun != '61020', -dj.nilai, dj.nilai)
        WHEN dj.DK != c.jnsAkun THEN  IF(c.subAkun != '61020', dj.nilai, -dj.nilai)
        ELSE 0
      END) AS nilai,
     dj.nomorJurnal, dj.kodeAkun, DATE_FORMAT(j.tglJurnal, '%Y-%m-%d') AS tglJurnal,
     IF(dj.desk= '',j.judulJurnal, dj.desk) AS judulJurnal,
     'Biaya Pajak Bagi Hasil' AS jenis, IF(j.ac='Y', cb.namaCabang, pt.namaPartner) AS namaPartner,
      CASE
        WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN j.cabLain
        WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN j.cabID
        ELSE ''
      END AS milik
     FROM detJur dj
      LEFT JOIN (SELECT distinct j.*
      from detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
            LEFT JOIN COA c ON c.kodeAkun = d.kodeAkun
            WHERE c.subAkun IN ('11010', '11020') AND j.tglJurnal BETWEEN ? AND ? AND ( j.cabID IN (?) OR j.cabLain IN (?)) ) j ON dj.nomorJurnal=j.nomorJurnal
      LEFT JOIN COA c ON dj.kodeAkun= c.kodeAkun
      LEFT JOIN subAkun s ON c.subAkun= s.kodeSubAkun
      LEFT JOIN partner pt ON pt.kodePartner = j.kodePartner
      LEFT JOIN cabang cb ON cb.kodeCab = j.cabLain
    WHERE j.tglJurnal BETWEEN ? AND ? AND j.status != 'B' AND c.kodeAkun = '610200005' AND ( j.cabID IN (?) OR j.cabLain IN (?))
    GROUP BY dj.nomorJurnal
    HAVING nilai != 0`,
      [
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        kodeCab,
      ]
    );
    let balikModal = await dbuse.query(
      `
      SELECT SUM(CASE
        WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN dj.nilai
        WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN dj.nilai
        ELSE 0
      END) AS nilai,
      CASE
        WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN j.cabLain
        WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN j.cabID
        ELSE ''
      END AS milik, dj.nomorJurnal, dj.kodeAkun, DATE_FORMAT(j.tglJurnal, '%Y-%m-%d') AS tglJurnal, IF(dj.desk= '',j.judulJurnal, dj.desk) AS judulJurnal,
       'Pengembalian Modal' AS jenis, IF(j.ac='Y', cb.namaCabang, pt.namaPartner) AS namaPartner, j.kodePartner, c.namaAkun
      FROM detJur dj
        LEFT JOIN (SELECT distinct j.* from detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
          LEFT JOIN COA c ON c.kodeAkun = d.kodeAkun
          WHERE c.subAkun IN ('11010', '11020') AND j.tglJurnal BETWEEN ? AND ? AND ( j.cabID IN (?) OR j.cabLain IN (?)) ) j ON dj.nomorJurnal=j.nomorJurnal
        LEFT JOIN COA c ON dj.kodeAkun= c.kodeAkun
        LEFT JOIN partner pt ON pt.kodePartner = j.kodePartner
        LEFT JOIN cabang cb ON cb.kodeCab = j.cabLain
      WHERE j.tglJurnal BETWEEN ? AND ? AND j.status != 'B' AND (c.subAkun IN ('23010'))
        AND dj.DK = 'D' AND ( j.cabID IN (?) OR (j.cabLain IN (?) AND dj.msAC='S'))
      GROUP BY dj.nomorJurnal
      HAVING nilai != 0
      ORDER BY dj.kodeAkun, dj.nomorJurnal`,
      [
        kodeCab,
        kodeCab,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        kodeCab,
      ]
    );
    let sawal = await dbuse.query(
      `
      SELECT SUM(CASE
        WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN dj.nilai
        WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN dj.nilai
        ELSE 0
      END) AS nilai,
      CASE
        WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN j.cabLain
        WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN j.cabID
        ELSE ''
      END AS milik, dj.nomorJurnal, dj.kodeAkun, DATE_FORMAT(j.tglJurnal, '%Y-%m-%d') AS tglJurnal, IF(dj.desk= '',j.judulJurnal, dj.desk) AS judulJurnal,
       'Balancing Saldo Awal' AS jenis, IF(j.ac='Y', cb.namaCabang, pt.namaPartner) AS namaPartner
      FROM detJur dj
        LEFT JOIN (SELECT distinct j.* from detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
          LEFT JOIN COA c ON c.kodeAkun = d.kodeAkun
          WHERE (c.subAkun IN ('11010', '11020'))AND j.tglJurnal BETWEEN ? AND ? AND ( j.cabID IN (?) OR j.cabLain IN (?)) ) j ON dj.nomorJurnal=j.nomorJurnal
        LEFT JOIN COA c ON dj.kodeAkun= c.kodeAkun
        LEFT JOIN partner pt ON pt.kodePartner = j.kodePartner
        LEFT JOIN cabang cb ON cb.kodeCab = j.cabLain
      WHERE j.tglJurnal BETWEEN ? AND ? AND j.status != 'B' AND (c.midSub= '230') AND dj.DK = 'K' AND ( j.cabID IN (?) OR (j.cabLain IN (?) AND dj.msAC='S'))
      GROUP BY dj.nomorJurnal
      HAVING nilai != 0`,
      [
        kodeCab,
        kodeCab,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        kodeCab,
      ]
    );
    let pitDireksi = await dbuse.query(
      `
      SELECT SUM(IF(dj.DK='K',-dj.nilai, dj.nilai)) AS nilai, dj.nomorJurnal, dj.kodeAkun,
        DATE_FORMAT(j.tglJurnal, '%Y-%m-%d') AS tglJurnal, IF(dj.desk= '',j.judulJurnal, dj.desk) AS judulJurnal,
       'Piutang Direksi' AS jenis, IF(j.ac='Y', cb.namaCabang, pt.namaPartner) AS namaPartner,
       CASE
        WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN j.cabLain
        WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN j.cabID
        ELSE ''
      END AS milik
      FROM detJur dj
        LEFT JOIN (SELECT distinct j.* from detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
          LEFT JOIN COA c ON c.kodeAkun = d.kodeAkun
          WHERE (c.subAkun IN ('11010', '11020'))AND j.tglJurnal BETWEEN ? AND ? AND ( j.cabID IN (?) OR j.cabLain IN (?)) ) j ON dj.nomorJurnal=j.nomorJurnal
        LEFT JOIN COA c ON dj.kodeAkun= c.kodeAkun
        LEFT JOIN partner pt ON pt.kodePartner = j.kodePartner
        LEFT JOIN cabang cb ON cb.kodeCab = j.cabLain
      WHERE j.tglJurnal BETWEEN ? AND ? AND j.status != 'B' AND (c.kodeAkun= '110560001') AND dj.DK = 'D' AND ( j.cabID IN (?) OR j.cabLain IN (?))
      GROUP BY dj.nomorJurnal
      HAVING nilai != 0`,
      [
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        kodeCab,
      ]
    );
    let deviden = await dbuse.query(
      `
      SELECT SUM(IF(dj.DK='K',-dj.nilai, dj.nilai)) AS nilai, dj.nomorJurnal, dj.kodeAkun, DATE_FORMAT(j.tglJurnal, '%Y-%m-%d') AS tglJurnal, IF(dj.desk= '',j.judulJurnal, dj.desk) AS judulJurnal,
       'Deviden' AS jenis, IF(j.ac='Y', cb.namaCabang, pt.namaPartner) AS namaPartner,
       CASE
        WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN j.cabLain
        WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN j.cabID
        ELSE ''
      END AS milik
      FROM detJur dj
        LEFT JOIN (SELECT distinct j.* from detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
          LEFT JOIN COA c ON c.kodeAkun = d.kodeAkun
          WHERE (c.subAkun IN ('11010', '11020'))AND j.tglJurnal BETWEEN ? AND ? AND ( j.cabID IN (?) OR j.cabLain IN (?)) ) j ON dj.nomorJurnal=j.nomorJurnal
        LEFT JOIN COA c ON dj.kodeAkun= c.kodeAkun
        LEFT JOIN partner pt ON pt.kodePartner = j.kodePartner
        LEFT JOIN cabang cb ON cb.kodeCab = j.cabLain
      WHERE j.tglJurnal BETWEEN ? AND ? AND j.status != 'B' AND (c.kodeAkun= '230200006') AND dj.DK = 'D' AND ( j.cabID IN (?) OR j.cabLain IN (?))
      GROUP BY dj.nomorJurnal
      HAVING nilai != 0`,
      [
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        kodeCab,
      ]
    );
    let prive = await dbuse.query(
      `
      SELECT SUM(IF(dj.DK='K',-dj.nilai, dj.nilai)) AS nilai, dj.nomorJurnal, dj.kodeAkun, DATE_FORMAT(j.tglJurnal, '%Y-%m-%d') AS tglJurnal, IF(dj.desk= '',j.judulJurnal, dj.desk) AS judulJurnal,
       'Prive' AS jenis, IF(j.ac='Y', cb.namaCabang, pt.namaPartner) AS namaPartner,
       CASE
        WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN j.cabLain
        WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN j.cabID
        ELSE ''
      END AS milik
      FROM detJur dj
        LEFT JOIN (SELECT distinct j.* from detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
          LEFT JOIN COA c ON c.kodeAkun = d.kodeAkun
          WHERE (c.subAkun IN ('11010', '11020'))AND j.tglJurnal BETWEEN ? AND ? AND ( j.cabID IN (?) OR j.cabLain IN (?)) ) j ON dj.nomorJurnal=j.nomorJurnal
        LEFT JOIN COA c ON dj.kodeAkun= c.kodeAkun
        LEFT JOIN partner pt ON pt.kodePartner = j.kodePartner
        LEFT JOIN cabang cb ON cb.kodeCab = j.cabLain
      WHERE j.tglJurnal BETWEEN ? AND ? AND j.status != 'B' AND (c.kodeAkun= '230200007') AND dj.DK = 'D' AND ( j.cabID IN (?) OR j.cabLain IN (?))
      GROUP BY dj.nomorJurnal
      HAVING nilai != 0`,
      [
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        kodeCab,
      ]
    );
    let pinjamBank = await dbuse.query(
      `
      SELECT SUM(IF(dj.DK='K',-dj.nilai, dj.nilai)) AS nilai, dj.nomorJurnal, dj.kodeAkun, DATE_FORMAT(j.tglJurnal, '%Y-%m-%d') AS tglJurnal,
        IF(dj.desk= '',j.judulJurnal, dj.desk) AS judulJurnal,
       'Pinjaman Bank' AS jenis, IF(j.ac='Y', cb.namaCabang, pt.namaPartner) AS namaPartner, c.namaAkun,
       CASE
        WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN j.cabLain
        WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN j.cabID
        ELSE ''
      END AS milik
      FROM detJur dj
        LEFT JOIN (SELECT distinct j.* from detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
          LEFT JOIN COA c ON c.kodeAkun = d.kodeAkun
          WHERE (c.subAkun IN ('11010', '11020'))AND j.tglJurnal BETWEEN ? AND ? AND ( j.cabID IN (?) OR j.cabLain IN (?)) ) j ON dj.nomorJurnal=j.nomorJurnal
        LEFT JOIN COA c ON dj.kodeAkun= c.kodeAkun
        LEFT JOIN partner pt ON pt.kodePartner = j.kodePartner
        LEFT JOIN cabang cb ON cb.kodeCab = j.cabLain
      WHERE j.tglJurnal BETWEEN ? AND ? AND j.status != 'B' AND (c.subAkun= '22010') AND dj.DK = 'K' AND ( j.cabID IN (?) OR j.cabLain IN (?))
      GROUP BY dj.nomorJurnal
      HAVING nilai != 0`,
      [
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        kodeCab,
      ]
    );
    let bayarBank = await dbuse.query(
      `
      SELECT SUM(IF(dj.DK='D',-dj.nilai, dj.nilai)) AS nilai, dj.nomorJurnal, dj.kodeAkun, DATE_FORMAT(j.tglJurnal, '%Y-%m-%d') AS tglJurnal,
        IF(dj.desk= '',j.judulJurnal, dj.desk) AS judulJurnal,
       'Bayar Pinjaman Bank' AS jenis, IF(j.ac='Y', cb.namaCabang, pt.namaPartner) AS namaPartner, c.namaAkun,
       CASE
        WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN j.cabLain
        WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN j.cabID
        ELSE ''
      END AS milik
      FROM detJur dj
        LEFT JOIN (SELECT distinct j.* from detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
          LEFT JOIN COA c ON c.kodeAkun = d.kodeAkun
          WHERE (c.subAkun IN ('11010', '11020'))AND j.tglJurnal BETWEEN ? AND ? AND ( j.cabID IN (?) OR j.cabLain IN (?)) ) j ON dj.nomorJurnal=j.nomorJurnal
        LEFT JOIN COA c ON dj.kodeAkun= c.kodeAkun
        LEFT JOIN partner pt ON pt.kodePartner = j.kodePartner
        LEFT JOIN cabang cb ON cb.kodeCab = j.cabLain
      WHERE j.tglJurnal BETWEEN ? AND ? AND j.status != 'B' AND (c.subAkun= '22010') AND dj.DK = 'K' AND ( j.cabID IN (?) OR j.cabLain IN (?))
      GROUP BY dj.nomorJurnal
      HAVING nilai != 0`,
      [
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        kodeCab,
      ]
    );
    let jualAktivaTetap = await dbuse.query(
      `
      SELECT SUM(IF(dj.DK='D',-dj.nilai, dj.nilai)) AS nilai, dj.nomorJurnal, dj.kodeAkun, DATE_FORMAT(j.tglJurnal, '%Y-%m-%d') AS tglJurnal,
        IF(dj.desk= '',j.judulJurnal, dj.desk) AS judulJurnal,
       'Jual Aktiva Tetap' AS jenis, IF(j.ac='Y', cb.namaCabang, pt.namaPartner) AS namaPartner, c.namaAkun,
       CASE
        WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN j.cabLain
        WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN j.cabID
        ELSE ''
      END AS milik
      FROM detJur dj
        LEFT JOIN (SELECT distinct j.* from detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
          LEFT JOIN COA c ON c.kodeAkun = d.kodeAkun
          WHERE (c.subAkun IN ('11010', '11020'))AND j.tglJurnal BETWEEN ? AND ? AND ( j.cabID IN (?) OR j.cabLain IN (?)) ) j ON dj.nomorJurnal=j.nomorJurnal
        LEFT JOIN COA c ON dj.kodeAkun= c.kodeAkun
        LEFT JOIN partner pt ON pt.kodePartner = j.kodePartner
        LEFT JOIN cabang cb ON cb.kodeCab = j.cabLain
      WHERE j.tglJurnal BETWEEN ? AND ? AND j.status != 'B' AND c.midSUb= '130' AND c.kasKeluar='Y' AND dj.DK = 'K' AND ( j.cabID IN (?) OR j.cabLain IN (?))
      GROUP BY dj.nomorJurnal
      HAVING nilai != 0`,
      [
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        kodeCab,
      ]
    );
    let beliAktivaTetap = await dbuse.query(
      `
      SELECT SUM(IF(dj.DK='K',-dj.nilai, dj.nilai)) AS nilai, dj.nomorJurnal, dj.kodeAkun, DATE_FORMAT(j.tglJurnal, '%Y-%m-%d') AS tglJurnal,
        IF(dj.desk= '',j.judulJurnal, dj.desk) AS judulJurnal,
       'Pembelian Aktiva Tetap' AS jenis, IF(j.ac='Y', cb.namaCabang, pt.namaPartner) AS namaPartner, c.namaAkun,
       CASE
        WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN j.cabLain
        WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN j.cabID
        ELSE ''
      END AS milik
      FROM detJur dj
        LEFT JOIN (SELECT distinct j.* from detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
          LEFT JOIN COA c ON c.kodeAkun = d.kodeAkun
          WHERE (c.subAkun IN ('11010', '11020'))AND j.tglJurnal BETWEEN ? AND ? AND ( j.cabID IN (?) OR j.cabLain IN (?)) ) j ON dj.nomorJurnal=j.nomorJurnal
        LEFT JOIN COA c ON dj.kodeAkun= c.kodeAkun
        LEFT JOIN partner pt ON pt.kodePartner = j.kodePartner
        LEFT JOIN cabang cb ON cb.kodeCab = j.cabLain
      WHERE j.tglJurnal BETWEEN ? AND ? AND j.status != 'B' AND (c.midSUb= '130' OR c.kodeAkun = '150100001') AND c.kasKeluar='Y' AND dj.DK = 'D' AND ( j.cabID IN (?) OR j.cabLain IN (?))
      GROUP BY dj.nomorJurnal
      HAVING nilai != 0`,
      [
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        kodeCab,
      ]
    );
    let jualTakWujud = await dbuse.query(
      `
      SELECT SUM(IF(dj.DK='D',-dj.nilai, dj.nilai)) AS nilai, dj.nomorJurnal, dj.kodeAkun, DATE_FORMAT(j.tglJurnal, '%Y-%m-%d') AS tglJurnal,
        IF(dj.desk= '',j.judulJurnal, dj.desk) AS judulJurnal,
       'Jual Aktiva Tak Berwujud' AS jenis, IF(j.ac='Y', cb.namaCabang, pt.namaPartner) AS namaPartner, c.namaAkun,
       CASE
        WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN j.cabLain
        WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN j.cabID
        ELSE ''
      END AS milik
      FROM detJur dj
        LEFT JOIN (SELECT distinct j.* from detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
          LEFT JOIN COA c ON c.kodeAkun = d.kodeAkun
          WHERE (c.subAkun IN ('11010', '11020'))AND j.tglJurnal BETWEEN ? AND ? AND ( j.cabID IN (?) OR j.cabLain IN (?)) ) j ON dj.nomorJurnal=j.nomorJurnal
        LEFT JOIN COA c ON dj.kodeAkun= c.kodeAkun
        LEFT JOIN partner pt ON pt.kodePartner = j.kodePartner
        LEFT JOIN cabang cb ON cb.kodeCab = j.cabLain
      WHERE j.tglJurnal BETWEEN ? AND ? AND j.status != 'B' AND c.midSUb= '140' AND c.kasKeluar='Y' AND dj.DK = 'K' AND ( j.cabID IN (?) OR j.cabLain IN (?))
      GROUP BY dj.nomorJurnal
      HAVING nilai != 0`,
      [
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        kodeCab,
      ]
    );
    let beliTakWujud = await dbuse.query(
      `
      SELECT SUM(IF(dj.DK='K',-dj.nilai, dj.nilai)) AS nilai, dj.nomorJurnal, dj.kodeAkun, DATE_FORMAT(j.tglJurnal, '%Y-%m-%d') AS tglJurnal,
        IF(dj.desk= '',j.judulJurnal, dj.desk) AS judulJurnal,
       'Pembelian Aktiva Tak Berwujud' AS jenis, IF(j.ac='Y', cb.namaCabang, pt.namaPartner) AS namaPartner, c.namaAkun,
       CASE
        WHEN j.cabLain IN (?) AND dj.msAC = 'S' THEN j.cabLain
        WHEN j.cabID IN (?) AND dj.msAC = 'M' THEN j.cabID
        ELSE ''
      END AS milik
      FROM detJur dj
        LEFT JOIN (SELECT distinct j.* from detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
          LEFT JOIN COA c ON c.kodeAkun = d.kodeAkun
          WHERE (c.subAkun IN ('11010', '11020'))AND j.tglJurnal BETWEEN ? AND ? AND ( j.cabID IN (?) OR j.cabLain IN (?)) ) j ON dj.nomorJurnal=j.nomorJurnal
        LEFT JOIN COA c ON dj.kodeAkun= c.kodeAkun
        LEFT JOIN partner pt ON pt.kodePartner = j.kodePartner
        LEFT JOIN cabang cb ON cb.kodeCab = j.cabLain
      WHERE j.tglJurnal BETWEEN ? AND ? AND j.status != 'B' AND c.midSUb= '140' AND c.kasKeluar='Y' AND dj.DK = 'D' AND ( j.cabID IN (?) OR j.cabLain IN (?))
      GROUP BY dj.nomorJurnal
      HAVING nilai != 0`,
      [
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
        kodeCab,
      ]
    );
    let [saldoAwal] = await dbuse.query(
      `SELECT 
    SUM(CASE
      WHEN ((trx.cabLain IN (?) AND dt.msAC = 'S') OR (trx.cabID IN (?) AND dt.msAC = 'M')) AND dt.DK=c.jnsAkun THEN dt.nilai
      WHEN ((trx.cabLain IN (?) AND dt.msAC = 'S') OR (trx.cabID IN (?) AND dt.msAC = 'M')) AND dt.DK !=c.jnsAkun  THEN -dt.nilai
      ELSE 0
    END) AS sawalIDR, dt.kodeAkun
    FROM detJur dt LEFT JOIN jurnal trx ON dt.nomorJurnal=trx.nomorJurnal
      LEFT JOIN COA c ON c.kodeAkun=dt.kodeAkun
      LEFT JOIN subAkun sb ON c.subAkun=sb.kodeSubAkun
    WHERE trx.tglJurnal < ? AND (trx.status !='B' AND trx.status !='W')
      AND (trx.cabID IN (?) OR (trx.cabLain IN (?) AND dt.msAC='S')) AND sb.arusKas = 'Y'`,
      [kodeCab, kodeCab, kodeCab, kodeCab, tgla, kodeCab, kodeCab]
    );
    res.send({
      saldoAwal,
      pjTunai,
      pitUsaha,
      pdNonUsaha,
      pdpLain,
      pdpBunga,
      BoP,
      hutUsaha,
      blTunai,
      dpBeli,
      hutNonUsaha,
      biayaPjkBagiHasil,
      pitDireksi,
      balikModal,
      biayaLain,
      pinjamBank,
      sawal,
      bayarBank,
      deviden,
      prive,
      jualAktivaTetap,
      beliAktivaTetap,
      jualTakWujud,
      beliTakWujud,
    });
  } catch (err) {
    console.log(err);
    res.status(410).send("err mas");
  }
});

app.post("/detKas", admin, (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  let kodeCab = ["MAN", "acc", "purchase"].some((a) => a === user.userType)
    ? x.kodeCab
    : user.kodeCab;
  // if cabID = user kodeCab => msAC = M, msAC= S
  let msAC = x.kodeCab === kodeCab ? "M" : "S";
  dbuse
    .query(
      `SELECT d.iddetJur,d.kodeAkun, d.DK, IF(d.DK = ?, -d.nilai, d.nilai) AS nilai,d.desk,d.msAC,d.nomorJurnal,
      IF(d.msAC='S',j.cabLain,j.cabID) AS kodeCab,
      IF(d.DK='D',nilai,0) AS debit,if(d.DK='K',nilai,0) AS kredit,
      c.namaAkun, sb.namaSubAkun, sb.arusKas, c.subAkun
    FROM detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
      LEFT JOIN COA c ON d.kodeAkun=c.kodeAkun
      LEFT JOIN subAkun sb ON c.subAkun=sb.kodeSubAkun
    WHERE d.nomorJurnal=? AND d.msAC =?
    ORDER BY nilai DESC, d.msAC,d.DK`,
      [x.jenis, x.nomorJurnal, msAC]
    )
    .then((rows, fields) => {
      res.send(rows);
      // console.log(rows)
    })
    .catch((err) => {
      console.log(err);
      res.status(501).send({ st: "tidak ada..." });
    });
});

app.post("/dtKas", async (req, res) => {
  let { jns, tgla, tglb } = req.body.x;
  let { x } = req.body;
  // console.log(req.body.x)
  let user = req.user.dtAkun;
  let kodeCab = ["MAN", "acc", "purchase"].some((a) => a === user.userType)
    ? x.kodeCab
    : [user.kodeCab];
  let sawal = {};
  // pilih msAC if ac Y...
  try {
    let dt = await dbuse.query(
      `SELECT
        CASE
          WHEN (trx.ac='Y' AND dt.DK='D' AND dt.msAC='M' AND trx.cabID IN (?)) OR (trx.ac='Y' AND dt.DK='D' AND dt.msAC='S' AND trx.cabLain IN (?)) THEN dt.nilai
          WHEN trx.ac='N' AND dt.DK='D' THEN dt.nilai
          ELSE 0
        END AS debit,
        CASE
          WHEN (trx.ac='Y' AND dt.DK='K' AND dt.msAC='M' AND trx.cabID IN (?)) OR (trx.ac='Y' AND dt.DK='K' AND dt.msAC='S' AND trx.cabLain IN (?)) THEN dt.nilai
          WHEN trx.ac='N' AND dt.DK='K' THEN dt.nilai
          ELSE 0
        END AS kredit, dt.desk,
        DATE_FORMAT(trx.tglJurnal,'%Y-%m-%d') AS tgl, trx.nomorJurnal,trx.judulJurnal,dt.iddetJur,dt.msAC,trx.ac,
        IF(dt.msAC='M',trx.cabID,trx.cabLain) AS kodeCab,
        CASE
          WHEN (trx.ac='Y' AND dt.DK='D' AND dt.msAC='M' AND trx.cabID IN (?)) OR
            (trx.ac='Y' AND dt.DK='D' AND dt.msAC='S' AND trx.cabLain IN (?)) OR (trx.ac='N' AND dt.DK='D')
            THEN 'D'
          ELSE 'K'
        END AS jenis,
        CASE
          WHEN trx.ac = 'N' AND p.namaPartner IS NOT NULL THEN p.namaPartner
          WHEN trx.ac = 'N' AND p.namaPartner IS NULL THEN e.namaKaryawan
          WHEN trx.ac = 'Y' AND trx.cabID IN (?) THEN cb.namaCabang
          ELSE cbl.namaCabang
        END AS namaPartner,
        c.namaAkun, dt.kodeAkun,
        o.namaKaryawan AS olehNama,
        trx.jnsJurnal, trx.buktiAkunting, trx.mimetype, trx.originalname
      FROM detJur dt LEFT JOIN jurnal trx ON dt.nomorJurnal=trx.nomorJurnal
        LEFT JOIN COA c ON dt.kodeAkun=c.kodeAkun
        LEFT JOIN subAkun sb ON c.subAkun=sb.kodeSubAkun
        LEFT JOIN cabang cb ON trx.cabID = cb.kodeCab
        LEFT JOIN cabang cbl ON trx.cabLain = cbl.kodeCab
        LEFT JOIN partner p ON trx.kodePartner = p.kodePartner
        LEFT JOIN karyawan e ON trx.salesID = e.kodeKar
        LEFT JOIN karyawan o ON trx.oleh = o.kodeKar
      WHERE (trx.tglJurnal BETWEEN ? AND ?) AND sb.arusKas = 'Y' AND (trx.status !='B' AND trx.status !='W')
        AND (trx.cabID IN (?) OR trx.cabLain IN (?) )
      HAVING debit > 0 OR kredit > 0
      ORDER BY trx.tglJurnal,trx.nomorJurnal `,
      [
        kodeCab,
        kodeCab,
        kodeCab,
        kodeCab,
        kodeCab,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeCab,
        kodeCab,
      ]
    );
    dbuse
      .query(
        `SELECT
    SUM(CASE
      WHEN ((trx.cabLain IN (?) AND dt.msAC = 'S') OR (trx.cabID IN (?) AND dt.msAC = 'M')) AND dt.DK=c.jnsAkun THEN dt.nilai
      WHEN ((trx.cabLain IN (?) AND dt.msAC = 'S') OR (trx.cabID IN (?) AND dt.msAC = 'M')) AND dt.DK !=c.jnsAkun  THEN -dt.nilai
      ELSE 0
    END) AS sawalIDR, dt.kodeAkun
        FROM detJur dt LEFT JOIN jurnal trx ON dt.nomorJurnal=trx.nomorJurnal
          LEFT JOIN COA c ON c.kodeAkun=dt.kodeAkun
          LEFT JOIN subAkun sb ON c.subAkun=sb.kodeSubAkun
        WHERE trx.tglJurnal < ? AND (trx.status !='B' AND trx.status !='W')
          AND (trx.cabID IN (?) OR (trx.cabLain IN (?) AND dt.msAC = 'S')) AND sb.arusKas = 'Y'`,
        [kodeCab, kodeCab, kodeCab, kodeCab, tgla, kodeCab, kodeCab]
      )
      .then((rows) => {
        sawal = rows[0].sawalIDR;
        res.send({ sawal: sawal, dt: dt });
      })
      .catch((err) => {
        console.log(err);
        res.status(410).send("err mas");
      });
  } catch (err) {
    console.log(err);
    res.status(410).send("err mas");
  }
});

app.post("/bubes", async (req, res) => {
  let { kodeAkun, tgla, tglb } = req.body.x;
  let { x } = req.body;
  // console.log(req.body.x)
  let user = req.user.dtAkun;
  let kodeCab = ["MAN", "acc", "purchase", "mitra"].some(
    (a) => a == user.userType
  )
    ? x.kodeCab
    : [user.kodeCab];
  let sawal = {};
  // pilih msAC if ac Y...
  try {
    let dt = await dbuse.query(
      `SELECT
      CASE
        WHEN (trx.ac='Y' AND dt.DK='D' AND dt.msAC='M' AND trx.cabID IN (?)) OR (trx.ac='Y' AND dt.DK='D' AND dt.msAC='S' AND trx.cabLain IN (?)) THEN dt.nilai
        WHEN trx.ac='N' AND trx.cabID IN (?) AND dt.DK='D' THEN dt.nilai
        ELSE 0
      END AS debit,
      CASE
        WHEN (trx.ac='Y' AND dt.DK='K' AND dt.msAC='M' AND trx.cabID IN (?)) OR (trx.ac='Y' AND dt.DK='K' AND dt.msAC='S' AND trx.cabLain IN (?)) THEN dt.nilai
        WHEN trx.ac='N' AND dt.DK='K' AND trx.cabID IN (?) THEN dt.nilai
        ELSE 0
      END AS kredit, dt.desk,
          DATE_FORMAT(trx.tglJurnal,'%Y-%m-%d') AS tgl, trx.nomorJurnal,trx.judulJurnal,dt.iddetJur,dt.msAC,trx.ac,
          IF(dt.msAC='M',trx.cabID,trx.cabLain) AS kodeCab, trx.nomorSuratJalan AS nomorBukti,
      IF(p.namaPartner IS NOT NULL, p.namaPartner, k.namaKaryawan) AS namaPartner,
      dt.nomorReff,  DATE_FORMAT(jr.tglJurnal,'%Y-%m-%d') AS tglRef, trx.buktiAkunting, COA.jnsAkun, COA.namaAkun
        FROM detJur dt LEFT JOIN jurnal trx ON dt.nomorJurnal=trx.nomorJurnal
          LEFT JOIN partner p ON trx.kodePartner = p.kodePartner
          LEFT JOIN karyawan k ON trx.salesID = k.kodeKar
          LEFT JOIN jurnal jr ON jr.nomorJurnal = dt.nomorReff
          LEFT JOIN COA ON COA.kodeAkun = dt.kodeAkun
        WHERE (trx.tglJurnal BETWEEN ? AND ?) AND dt.kodeAkun IN (?) AND (trx.status !='B' AND trx.status !='W') AND (trx.cabID IN (?) OR (trx.cabLain IN (?) AND trx.ac='Y'))
        HAVING debit != 0 OR kredit !=0
        ORDER BY trx.tglJurnal,trx.nomorJurnal `,
      [
        kodeCab,
        kodeCab,
        kodeCab,
        kodeCab,
        kodeCab,
        kodeCab,
        tgla,
        tglb,
        kodeAkun,
        kodeCab,
        kodeCab,
      ]
    );
    dbuse
      .query(
        `SELECT SUM(IF(dt.DK=c.jnsAkun,dt.nilai,-dt.nilai)) AS sawalIDRa, dt.kodeAkun,
      SUM(CASE
        WHEN (dt.DK=c.jnsAkun AND dt.msAC='M' AND trx.cabID IN (?)) OR (dt.DK=c.jnsAkun AND dt.msAC='S' AND trx.cabLain IN (?) AND trx.ac = 'Y') THEN dt.nilai
        WHEN (dt.DK != c.jnsAkun AND dt.msAC='M' AND trx.cabID IN (?)) OR (dt.DK != c.jnsAkun AND dt.msAC='S' AND trx.cabLain IN (?) AND trx.ac = 'Y') THEN -dt.nilai
        ELSE 0
      END) AS sawalIDR
        FROM detJur dt LEFT JOIN jurnal trx ON dt.nomorJurnal=trx.nomorJurnal
          LEFT JOIN COA c ON c.kodeAkun=dt.kodeAkun
        WHERE trx.tglJurnal < ? AND dt.kodeAkun IN (?) AND (trx.status !='B' AND trx.status !='W') AND (trx.cabID IN (?) OR (trx.cabLain IN (?) AND trx.ac= 'Y'))`,
        [kodeCab, kodeCab, kodeCab, kodeCab, tgla, kodeAkun, kodeCab, kodeCab]
      )
      .then((rows) => {
        sawal = rows[0].sawalIDR;
        res.send({ sawal: sawal, dt: dt });
      })
      .catch((err) => {
        console.log(err);
        res.status(410).send("err mas");
      });
  } catch (err) {
    console.log(err);
    res.status(410).send("err mas");
  }
});

app.post("/neraca", async (req, res) => {
  let { tgl, prd } = req.body.x;
  let tgla = tgl.slice(0, 7);
  let user = req.user.dtAkun;
  let { x } = req.body;
  let y = {
    kodeCab: ["MAN", "acc", "purchase", "mitra"].some((a) => a == user.userType)
      ? x.kodeCab
      : [user.kodeCab],
    periode: prd == "M" ? tgla + "-01" : tgl.slice(0, 4) + "-12-01",
    awal: tgl.slice(0, 5) + "01-01",
  };
  try {
    let hasil = await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `SELECT r.kodeAkun, r.subAkun, r.midSub, r.grupAkun, r.namaAkun,
        sb.namaSubAkun,m.namaMidSub, (COALESCE(nr.saldo,0)+COALESCE(sl.lalu,0)+COALESCE(sj.lalu,0)+COALESCE(st.lalu,0)) AS saldo
      FROM COA r 
        LEFT JOIN
          (SELECT SUM(
            CASE
              WHEN (t.ac='Y' AND dt.msAC='M' AND t.cabID IN (:kodeCab)) OR (t.ac='Y' AND dt.msAC='S' AND t.cabLain IN (:kodeCab)) THEN IF(dt.DK=rek.jnsAkun,dt.nilai,-dt.nilai)
              WHEN t.ac='N' AND t.cabID IN (:kodeCab) THEN IF(dt.DK=rek.jnsAkun,dt.nilai,-dt.nilai)
              ELSE 0
            END) AS saldo, dt.kodeAkun
            FROM detJur dt
              LEFT JOIN jurnal t ON dt.nomorJurnal=t.nomorJurnal
              LEFT JOIN COA rek ON dt.kodeAkun=rek.kodeAkun
              LEFT JOIN grupAkun grp ON rek.grupAkun= grp.kodeGrupAkun
            WHERE  t.tglJurnal < DATE_ADD(:periode,interval 1 month)  AND t.status NOT IN ('B', 'W')
              AND (t.cabID IN (:kodeCab) OR t.cabLain IN (:kodeCab)) AND grp.neraca='Y' AND rek.kodeAkun != '230200001'
            GROUP BY dt.kodeAkun) nr ON r.kodeAkun=nr.kodeAkun
        LEFT JOIN (
          SELECT SUM(
            CASE
              WHEN (t.ac='Y' AND dt.msAC='M' AND t.cabID IN (:kodeCab)) OR (t.ac='Y' AND dt.msAC='S' AND t.cabLain IN (:kodeCab)) THEN IF(dt.DK='D',dt.nilai,-dt.nilai)
              WHEN t.ac='N' AND t.cabID IN (:kodeCab) THEN IF(dt.DK='D',dt.nilai,-dt.nilai)
              ELSE 0
            END) AS lalu, '230200003' AS kodeAkun FROM detJur dt
            LEFT JOIN jurnal t ON dt.nomorJurnal=t.nomorJurnal
            LEFT JOIN COA c ON dt.kodeAkun=c.kodeAkun
            LEFT JOIN grupAkun grp ON c.grupAkun= grp.kodeGrupAkun
          WHERE t.tglJurnal BETWEEN :awal AND DATE_ADD(:periode, INTERVAL -1 MINUTE) AND t.status NOT IN ('B', 'W')
          AND (t.cabID IN (:kodeCab) OR t.cabLain IN (:kodeCab)) AND grp.neraca='Y'
        ) sl ON sl.kodeAkun=r.kodeAkun
        LEFT JOIN (
          SELECT SUM(
            CASE
              WHEN (t.ac='Y' AND dt.msAC='M' AND t.cabID IN (:kodeCab)) OR (t.ac='Y' AND dt.msAC='S' AND t.cabLain IN (:kodeCab)) THEN IF(dt.DK='D',dt.nilai,-dt.nilai)
              WHEN t.ac='N' AND t.cabID IN (:kodeCab) THEN IF(dt.DK='D',dt.nilai,-dt.nilai)
              ELSE 0
            END) AS lalu, '230200005' AS kodeAkun FROM detJur dt
            LEFT JOIN jurnal t ON dt.nomorJurnal=t.nomorJurnal
            LEFT JOIN COA c ON dt.kodeAkun=c.kodeAkun
            LEFT JOIN grupAkun grp ON c.grupAkun= grp.kodeGrupAkun
          WHERE t.tglJurnal BETWEEN :periode AND DATE_ADD(:periode, INTERVAL 1 MONTH) -1 AND t.status NOT IN ('B', 'W')
          AND (t.cabID IN (:kodeCab) OR t.cabLain IN (:kodeCab)) AND grp.neraca='Y'
        ) sj ON sj.kodeAkun=r.kodeAkun
        LEFT JOIN (
          SELECT SUM(
            CASE
              WHEN (t.ac='Y' AND dt.msAC='M' AND t.cabID IN (:kodeCab)) OR (t.ac='Y' AND dt.msAC='S' AND t.cabLain IN (:kodeCab)) THEN IF(dt.DK='D',dt.nilai,-dt.nilai)
              WHEN t.ac='N' AND t.cabID IN (:kodeCab) THEN IF(dt.DK='D',dt.nilai,-dt.nilai)
              ELSE 0
            END) AS lalu, '230200001' AS kodeAkun FROM detJur dt
            LEFT JOIN jurnal t ON dt.nomorJurnal=t.nomorJurnal
            LEFT JOIN COA c ON dt.kodeAkun=c.kodeAkun
            LEFT JOIN grupAkun grp ON c.grupAkun= grp.kodeGrupAkun
          WHERE t.tglJurnal < :awal AND t.status NOT IN ('B', 'W')
          AND (t.cabID IN (:kodeCab) OR t.cabLain IN (:kodeCab)) AND grp.neraca='Y'
        ) st ON st.kodeAkun=r.kodeAkun
        LEFT JOIN subAkun sb ON r.subAkun=sb.kodeSubAkun
        LEFT JOIN midSub m ON r.midSub=m.kodemidSub
        LEFT JOIN grupAkun grp ON r.grupAkun= grp.kodeGrupAkun
        HAVING saldo != 0
        ORDER BY r.grupAkun, r.midSub, r.subAkun`,
      },
      y
    );
    /* let rlbLalu = await dbuse.query(`SELECT SUM(
        CASE
          WHEN (t.ac='Y' AND dt.msAC='M' AND t.cabID IN (?)) OR (t.ac='Y' AND dt.msAC='S' AND t.cabLain IN (?)) THEN IF(dt.DK='D',dt.nilai,-dt.nilai)
          WHEN t.ac='N' THEN IF(dt.DK='D',dt.nilai,-dt.nilai)
          ELSE 0
        END) AS lalu FROM detJur dt
        LEFT JOIN jurnal t ON dt.nomorJurnal=t.nomorJurnal
        LEFT JOIN COA c ON dt.kodeAkun=c.kodeAkun
        LEFT JOIN grupAkun grp ON c.grupAkun= grp.kodeGrupAkun
      WHERE t.tglJurnal < ? AND (t.status !='B' AND t.status !='W')
      AND (t.cabID IN (?) OR t.cabLain IN (?)) AND grp.neraca='Y'`, [kodeCab, kodeCab, periode, kodeCab, kodeCab]) */
    // hasil.push({ grupAkun: '2', midSub: '230', namaMidSub: 'MODAL', subAkun: '23020', namaSubAkun: 'LABA', kodeAkun: '230200003', saldo: rlbLalu[0].lalu, namaAkun: 'Laba Bulan2 lalu'})
    res.send(hasil);
  } catch (err) {
    console.log(err);
    res.status(410).send("err mas");
  }
});

app.post("/cekSaldo", (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  let kodeCab = ["MAN", "acc"].some((a) => a === user.userType)
    ? [x.kodeCab]
    : [user.kodeCab];
  dbuse
    .query(
      `SELECT SUM(CASE
    WHEN (dt.DK=c.jnsAkun AND dt.msAC='M' AND trx.cabID IN (?)) OR (dt.DK=c.jnsAkun AND dt.msAC='S' AND trx.cabLain IN (?)) THEN dt.nilai
    WHEN (dt.DK != c.jnsAkun AND dt.msAC='M' AND trx.cabID IN (?)) OR (dt.DK != c.jnsAkun AND dt.msAC='S' AND trx.cabLain IN (?)) THEN -dt.nilai
    ELSE 0
  END) AS saldo, dt.kodeAkun
    FROM detJur dt LEFT JOIN jurnal trx ON dt.nomorJurnal=trx.nomorJurnal
    LEFT JOIN COA c ON c.kodeAkun= dt.kodeAkun
    WHERE dt.kodeAkun =? AND (trx.status !='B' AND trx.status !='W')
      AND (trx.cabID IN (?) OR trx.cabLain IN (?))`,
      [kodeCab, kodeCab, kodeCab, kodeCab, x.kodeAkun, kodeCab, kodeCab]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "error mas bro" });
    });
});
app.post("/cekSaldoMulti", (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  let kodeCab = ["MAN", "acc"].some((a) => a === user.userType)
    ? x.kodeCab
    : [user.kodeCab];
  let tgl = x.tglb || new Date();
  console.log(kodeCab);
  dbuse
    .query(
      `SELECT SUM(CASE
    WHEN (dt.DK=c.jnsAkun AND dt.msAC='M' AND trx.cabID IN (?)) OR (dt.DK=c.jnsAkun AND dt.msAC='S' AND trx.cabLain IN (?)) THEN dt.nilai
    WHEN (dt.DK != c.jnsAkun AND dt.msAC='M' AND trx.cabID IN (?)) OR (dt.DK != c.jnsAkun AND dt.msAC='S' AND trx.cabLain IN (?)) THEN -dt.nilai
    ELSE 0
  END) AS saldo, dt.kodeAkun, trx.cabID, cab.namaCabang
    FROM detJur dt LEFT JOIN jurnal trx ON dt.nomorJurnal=trx.nomorJurnal
    LEFT JOIN COA c ON c.kodeAkun= dt.kodeAkun
    LEFT JOIN cabang cab ON trx.cabID = cab.kodeCab
    WHERE dt.kodeAkun IN (?) AND (trx.status !='B' AND trx.status !='W')
      AND (trx.cabID IN (?) OR trx.cabLain IN (?)) AND trx.tglJurnal < DATE_ADD(?, INTERVAL 1 DAY)
  GROUP BY trx.cabID
  ORDER BY saldo DESC, trx.cabID`,
      [kodeCab, kodeCab, kodeCab, kodeCab, x.kodeAkun, kodeCab, kodeCab, tgl]
    )
    .then((rows) => {
      res.send(rows);
      // console.log(rows)
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "error mas bro" });
    });
});

app.post("/topHP", async (req, res) => {
  let { x } = req.body;
  try {
    let data = await dbuse.query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT d.nilai,
      p.namaPartner,  DATE_FORMAT(j.tglJurnal,'%Y-%m-%d') AS tgl,
          DATEDIFF(:tglb,j.tglJurnal) AS umur, DATEDIFF(NOW(),j.tempo) AS overDue, DATE_FORMAT(j.tempo, '%Y-%m-%d') AS tempo, j.cabID, j.judulJurnal, j.salesID,
          j.status,COALESCE(byr.tbayar,0) AS tbayar,j.ac, (d.nilai - COALESCE(byr.tbayar,0)) AS saldo,j.nomorSuratJalan,
          nc.namaCabang
        FROM detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
        LEFT JOIN partner p ON j.kodePartner=p.kodePartner
        LEFT JOIN cabang nc ON j.cabID = nc.kodeCab
        LEFT JOIN COA c ON d.kodeAkun=c.kodeAkun
        LEFT JOIN (
          SELECT SUM(IF(d.DK=r.jnsAkun,-d.nilai,d.nilai)) AS tbayar,d.kodeAkun, d.nomorReff
          FROM detJur d
            LEFT JOIN jurnal t ON d.nomorJurnal=t.nomorJurnal
            LEFT JOIN COA r ON d.kodeAkun=r.kodeAkun
          WHERE t.status NOT IN ('B', 'W') AND d.nomorReff !='' AND d.kodeAkun = :kodeAkun
            GROUP BY d.nomorReff, d.kodeAkun
        ) byr ON d.nomorJurnal=byr.nomorReff AND byr.kodeAkun = d.kodeAkun
        WHERE j.jhp= :jhp AND d.kodeAkun = :kodeAkun AND j.tglJurnal<= :tglb AND j.ac='N' AND j.cabID IN (:kodeCab) AND j.status NOT IN ('B','W') AND d.DK = c.jnsAkun
          AND j.ancab IS NULL
        HAVING saldo != 0
        ORDER BY saldo DESC`,
      },
      x
    );
    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(501).send({ st: "tidak ditemukan..." });
  }
});
app.post("/nrcSaldo", (req, res) => {
  let { tgla, tglb, jns } = req.body.x;
  let user = req.user.dtAkun;
  let x = req.body.x;
  let kodeCab = ["MAN", "acc"].some((a) => a == user.userType)
    ? x.kodeCab
    : [user.kodeCab];
  let sql = jns
    ? `SELECT r.kodeAkun, r.subAkun,
      SUM(CASE
        WHEN (t.ac='Y' AND d.DK='D' AND d.msAC='M' AND t.cabID IN (?)) OR (t.ac='Y' AND d.DK='D' AND d.msAC='S' AND t.cabLain IN (?)) THEN d.nilai
        WHEN t.ac='N' AND d.DK='D' THEN d.nilai
        ELSE 0 END) as debit,
      SUM(CASE
        WHEN (t.ac='Y' AND d.DK='K' AND d.msAC='M' AND t.cabID IN (?)) OR (t.ac='Y' AND d.DK='K' AND d.msAC='S' AND t.cabLain IN (?)) THEN d.nilai
        WHEN t.ac='N' AND d.DK='K' THEN d.nilai
        ELSE 0 END) as kredit
    FROM detJur d  LEFT JOIN jurnal t ON d.nomorJurnal=t.nomorJurnal
      LEFT JOIN COA r ON d.kodeAkun=r.kodeAkun
    WHERE (t.tglJurnal BETWEEN '${tgla}' AND '${tglb}') AND t.status NOT IN ('B', 'W') AND (t.cabID IN (?) OR (t.cabLain IN (?) AND t.ac ='Y'))
    GROUP BY r.kodeAkun
    ORDER BY r.kodeAkun ASC`
    : `SELECT SUM(IF(d.DK='D',d.nilai,-d.nilai)) AS sald,r.kodeAkun,r.namaAkun,r.jnsAkun, r.subAkun
      FROM detJur d  LEFT JOIN jurnal t ON d.nomorJurnal=t.nomorJurnal LEFT JOIN COA r ON d.kodeAkun=r.kodeAkun
      WHERE t.tglJurnal<='${tglb}' AND t.status NOT IN ('B', 'W')
      GROUP BY d.kodeAkun
      ORDER BY r.kodeAkun ASC`;
  dbuse
    .query(
      `SELECT (IFNULL(s.sald,0)) AS saldo,r.kodeAkun,r.namaAkun,r.jnsAkun, s.sald,nr.debit,nr.kredit, r.subAkun FROM COA r
    LEFT JOIN (${sql}) nr ON r.kodeAkun=nr.kodeAkun
    LEFT JOIN (SELECT d.kodeAkun,
      SUM(CASE
        WHEN (t.ac='Y' AND d.msAC='M' AND t.cabID IN (?)) OR (t.ac='Y' AND d.msAC='S' AND t.cabLain IN (?)) THEN IF(d.DK=c.jnsAkun,d.nilai,-d.nilai)
        WHEN t.ac='N' THEN IF(d.DK=c.jnsAkun,d.nilai,-d.nilai)
        ELSE 0
      END) AS sald
    FROM detJur d LEFT JOIN jurnal t ON d.nomorJurnal=t.nomorJurnal
        LEFT JOIN COA c ON c.kodeAkun=d.kodeAkun
    WHERE t.status NOT IN ('B', 'W') AND t.tglJurnal<'${tgla}' AND (t.cabID IN (?) OR (t.cabLain IN (?) AND t.ac ='Y'))
    GROUP BY d.kodeAkun) s ON r.kodeAkun=s.kodeAkun
  ORDER BY r.kodeAkun ASC`,
      [
        kodeCab,
        kodeCab,
        kodeCab,
        kodeCab,
        kodeCab,
        kodeCab,
        kodeCab,
        kodeCab,
        kodeCab,
        kodeCab,
        tgla,
        tgla,
        tglb,
      ]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "error mas bro" });
    });
});

app.post("/rugilaba", (req, res) => {
  let { tgl, prd } = req.body.x;
  let tgla = tgl.slice(0, 7);
  let user = req.user.dtAkun;
  let x = req.body.x;
  let kodeCab = ["MAN", "acc"].some((a) => a == user.userType)
    ? x.kodeCab
    : [user.kodeCab];
  let awalBulan = tgla + "-01";
  // let periode = prd === 'M' ? awalBulan : tgl.slice(0, 4) + '-12-01'
  let tahun = Number(tgl.slice(0, 4));
  let awal = prd === "M" ? awalBulan : tahun + "-01-01";
  console.log(awal, awalBulan);
  dbuse
    .query(
      `SELECT (IFNULL(nr.sald,0)) AS saldo,r.kodeAkun,r.namaAkun,r.jnsAkun,r.subAkun,r.grupAkun,
      r.midSub, m.namaMidSub,sb.namaSubAkun,
    grp.namaGrupAkun FROM COA r
    LEFT JOIN
      (SELECT SUM(
        CASE
          WHEN (t.ac='Y' AND dt.msAC='M' AND t.cabID IN (?)) OR (t.ac='Y' AND dt.msAC='S' AND t.cabLain IN (?)) THEN IF(dt.DK=rek.jnsAkun,dt.nilai,-dt.nilai)
          WHEN t.ac='N' AND t.cabID IN (?) THEN IF(dt.DK=rek.jnsAkun,dt.nilai,-dt.nilai)
          ELSE 0
        END) AS sald,rek.kodeAkun
        FROM detJur dt LEFT JOIN COA rek ON dt.kodeAkun=rek.kodeAkun
        LEFT JOIN jurnal t ON dt.nomorJurnal=t.nomorJurnal
        WHERE t.tglJurnal BETWEEN '${awal}' AND (DATE_ADD(?, interval 1 month) - 1) AND t.status NOT IN ('B', 'W') AND t.jnsJurnal !='TB'
          AND (t.cabID IN (?) OR t.cabLain IN (?))
        GROUP BY dt.kodeAkun) nr ON r.kodeAkun=nr.kodeAkun
    LEFT JOIN subAkun sb ON r.subAkun=sb.kodeSubAkun
    LEFT JOIN midSub m ON r.midSub= m.kodemidSub
    LEFT JOIN grupAkun grp ON r.grupAkun= grp.kodeGrupAkun
    WHERE grp.rugilaba='Y'`,
      [kodeCab, kodeCab, kodeCab, awalBulan, kodeCab, kodeCab]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(410).send("err mas");
    });
});

app.post("/countTrx", admin, async (req, res) => {
  let { x } = req.body;
  x.awalTahun = x.tgla.slice(0, 4) + "-01-01";
  x.tgl = x.tglb.slice(0, 8) + "01";
  x.tglAwal = x.periode.value === "Periode" ? x.tgla : x.tgl;
  try {
    let [trx] = await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `SELECT SUM(IF(tglKirim >= :tglAwal, 1, 0)) AS trxBln, SUM(1) AS trxThn FROM transaksi
      WHERE status NOT IN ('W', 'B') AND asal IN (:kodeCab) AND
        tglKirim BETWEEN :awalTahun AND :tglb AND jnsTrx = 'J'`,
      },
      x
    );
    let [cust] = await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `SELECT DISTINCT(kodePartner) AS kodePartner, count(distinct(IF(tglKirim >= :tglAwal, kodePartner, null))) AS custBln,
      COUNT(DISTINCT(kodePartner)) AS custThn FROM transaksi
      WHERE status NOT IN ('W', 'B') AND asal IN (:kodeCab) AND
        tglKirim BETWEEN :awalTahun AND :tglb AND jnsTrx = 'J'`,
      },
      x
    );
    res.send({ ...trx, ...cust });
  } catch (error) {
    console.log(error);
    res.status(501).send({ st: "tidak ditemukan..." });
  }
});

app.post("/profitloss", admin, async (req, res) => {
  let { x } = req.body;
  x.awalTahun = x.tgla.slice(0, 4) + "-01-01";
  x.tgl = x.tglb.slice(0, 8) + "01";
  x.tglAwal = x.periode.value === "Periode" ? x.tgla : x.tgl;
  let ancab = x.ancab
    ? ""
    : "AND (dv.compCode != divt.compCode OR divt.compCode IS NULL)";
  try {
    let data = await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `SELECT 
        gr.kodeGrupAkun, gr.namaGrupAkun,
          SUM(
            CASE
              WHEN (
                (t.ac='Y' AND dt.msAC='M' AND t.cabID IN (:kodeCab))
                  OR (t.ac='Y' AND dt.msAC='S' AND t.cabLain IN (:kodeCab))
                  OR (t.ac='N' AND t.cabID IN (:kodeCab))
                )
                AND dt.DK = rek.jnsAkun THEN IF(rek.subAkun != '61020', dt.nilai, -dt.nilai)
              WHEN ((t.ac='Y' AND dt.msAC='M' AND t.cabID IN (:kodeCab)) OR (t.ac='Y' AND dt.msAC='S' AND t.cabLain IN (:kodeCab)) OR (t.ac='N' AND t.cabID IN (:kodeCab)))
                AND dt.DK != rek.jnsAkun THEN IF(rek.subAkun = '61020', dt.nilai, -dt.nilai)
              ELSE 0
            END) AS tahun,
          SUM(
            IF(t.tglJurnal between :tglAwal AND (date_add(:tgl, interval 1 month) -1),
              CASE
                WHEN ((t.ac='Y' AND dt.msAC='M' AND t.cabID IN (:kodeCab)) OR
                  (t.ac='Y' AND dt.msAC='S' AND t.cabLain IN (:kodeCab)) OR (t.ac='N' AND t.cabID IN (:kodeCab)))
                  AND dt.DK = rek.jnsAkun THEN IF(rek.subAkun != '61020', dt.nilai, -dt.nilai)
                WHEN ((t.ac='Y' AND dt.msAC='M' AND t.cabID IN (:kodeCab)) OR
                  (t.ac='Y' AND dt.msAC='S' AND t.cabLain IN (:kodeCab)) OR (t.ac='N' AND t.cabID IN (:kodeCab)))
                  AND dt.DK != rek.jnsAkun THEN IF(rek.subAkun = '61020', dt.nilai, -dt.nilai)
                ELSE 0
              END, 0)) AS bulan
        FROM detJur dt LEFT JOIN COA rek ON dt.kodeAkun=rek.kodeAkun
          LEFT JOIN grupAkun gr ON rek.grupAkun = gr.kodeGrupAkun
          LEFT JOIN jurnal t ON dt.nomorJurnal=t.nomorJurnal
          LEFT JOIN cabang ca ON ca.kodeCab = t.cabID
          LEFT JOIN divisi dv ON ca.divisiCode = dv.divisiCode
          LEFT JOIN cabang ct ON ct.kodeCab = t.cabLain
          LEFT JOIN divisi divt ON ct.divisiCode = divt.divisiCode
        WHERE t.status NOT IN ('B', 'W') AND t.jnsJurnal !='TB'
              AND (t.cabID IN (:kodeCab) OR t.cabLain IN (:kodeCab)) AND gr.rugilaba = 'Y' AND t.tglJurnal between :awalTahun and (date_add(:tgl, interval 1 month) -1)
              ${ancab}
            GROUP BY gr.kodeGrupAkun`,
      },
      x
    );
    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(501).send({ st: "tidak ditemukan..." });
  }
});
app.post("/dtjurnal", async (req, res) => {
  let { tgla, tglb } = req.body.x;
  let x = req.body.x;
  let user = req.user.dtAkun;
  // console.log(x)
  let kodeCab = ["MAN", "acc"].some((a) => a == user.userType)
    ? x.kodeCab
    : [user.kodeCab];
  dbuse
    .query(
      {
        dateStrings: true,
        sql: `SELECT d.iddetJur,d.kodeAkun, d.DK, d.nilai,d.desk,d.msAC,d.nomorJurnal,
    IF(d.msAC='S',j.cabLain,j.cabID) AS kodeCab,IF(d.DK='D',nilai,0) AS Debit,IF(d.DK='K',nilai,0) AS Kredit,a.namaAkun,
      DATE_FORMAT(j.tglJurnal,'%Y-%m-%d') AS tgl, j.judulJurnal,cabID,e.namaKaryawan,p.namaPartner, j.status,j.ac, j.tglJurnal,
      j.nomorSuratJalan
    FROM detJur d
      LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
      LEFT JOIN COA a ON d.kodeAkun=a.kodeAkun
      LEFT JOIN partner p ON d.kodePartner=p.kodePartner
      LEFT JOIN karyawan e ON d.eID=e.kodeKar
    WHERE (j.tglJurnal BETWEEN ? AND ?) AND ((j.cabID IN (?) AND d.msAC= 'M') OR (j.cabLain IN (?) AND j.ac='Y' AND d.msAC='S')) AND j.status != 'B'
    ORDER BY j.tglJurnal DESC,d.nomorJurnal DESC,d.msAC,d.DK,d.kodeAkun,d.iddetJur`,
      },
      [tgla, tglb, kodeCab, kodeCab]
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(501).send({ st: "tidak ditemukan..." });
    });
});

app.post("/dthpSales", (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  let kodeCab = ["MAN", "acc", "purchase", "mitra"].some(
    (a) => a === user.userType
  )
    ? x.kodeCab
    : user.kodeCab;
  let sales = ["MAN", "acc", "mitra", "admin"].some((a) => a === user.userType)
    ? ""
    : `AND t.salesID = '${user.eID}'`;
  dbuse
    .query(
      `SELECT d.*, IF(p.namaPartner IS NOT NULL,p.namaPartner,cab.namaCabang) AS namaPartner, DATE_FORMAT(j.tglJurnal,'%Y-%m-%d') AS tgl,
    DATEDIFF(NOW(),j.tglJurnal) AS umur, DATEDIFF(NOW(),j.tempo) AS overDue, DATE_FORMAT(j.tempo, '%Y-%m-%d') AS tempo,j.cabID, j.judulJurnal, j.salesID,
    j.status,COALESCE(byr.tbayar,0) AS tbayar,j.ac,
    e.namaKaryawan AS pic,
    IF(p.namaPartner IS NOT NULL,j.kodePartner, j.cabLain) AS kodeRekan,
    t.nomorBukti
    FROM detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
      LEFT JOIN transaksi t ON j.nomorSuratJalan = t.nomorBukti
      LEFT JOIN partner p ON j.kodePartner=p.kodePartner
      LEFT JOIN cabang cab ON j.cabLain=cab.kodeCab
      LEFT JOIN COA c ON d.kodeAkun=c.kodeAkun
      LEFT JOIN karyawan e ON e.kodeKar=t.salesID
      LEFT JOIN (
        SELECT SUM(IF(d.DK=r.jnsAkun,-d.nilai,d.nilai)) AS tbayar,d.kodeAkun, d.nomorReff
        FROM detJur d
          LEFT JOIN jurnal t ON d.nomorJurnal=t.nomorJurnal
          LEFT JOIN COA r ON d.kodeAkun=r.kodeAkun
        WHERE t.status !='B'  AND d.nomorReff !='' AND r.subAkun IN ('11050')
          GROUP BY d.nomorReff
      ) byr ON d.nomorJurnal=byr.nomorReff
      WHERE j.jhp='P' AND c.subAkun IN ('11050') AND j.cabID= ? AND j.status = 'O' AND d.DK = 'D' ${sales}
      HAVING nilai != tbayar
      ORDER BY j.tglJurnal ASC`,
      [kodeCab]
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "tidak ditemukan..." });
    });
});

app.post("/dthp", admin, async (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  x.kodeCabFilt = x.kodeCabFilt || [x.kodeCab];
  let kodeCab = ["MAN", "acc", "purchase", "mitra"].some(
    (a) => a == user.userType
  )
    ? x.kodeCabFilt
    : [user.kodeCab];
  let dk = x.jhp == "P" ? "K" : "D";
  let status = x.status === "O" ? ["O"] : ["T", "L"];
  let having = x.status === "O" ? "HAVING sisa != 0" : "HAVING sisa = 0";
  let vendor =
    ["MAN", "acc", "purchase", "mitra"].some((a) => a == user.userType) ||
    x.jhp === "P"
      ? `${x.ac === "N" ? "p.namaPartner" : "cab.namaCabang"}`
      : "'Pengadaan'";
  let vendorKode =
    ["MAN", "acc", "purchase", "mitra"].some((a) => a == user.userType) ||
    x.jhp === "P"
      ? `${x.ac === "N" ? "p.kodePartner" : "cab.kodeCab"}`
      : "'Pengadaan'";
  // console.log(x)
  if (x.ac === "N" || x.jhp == "P") {
    dbuse
      .query(
        `SELECT d.*,
    CASE
      WHEN cab.namaCabang IS NOT NULL THEN cab.namaCabang
      WHEN p.namaPartner IS NOT NULL THEN ${vendor}
      ELSE e.namaKaryawan
    END AS namaPartner,  DATE_FORMAT(j.tglJurnal,'%Y-%m-%d') AS tgl,
        DATEDIFF(?,j.tglJurnal) AS umur, DATEDIFF(NOW(),j.tempo) AS overDue, DATE_FORMAT(j.tempo, '%Y-%m-%d') AS tempo, j.cabID, j.judulJurnal, j.salesID,
        j.status,COALESCE(byr.tbayar,0) AS tbayar,j.ac, (d.nilai - COALESCE(byr.tbayar,0)) AS sisa,
        e.namaKaryawan AS pic, eo.namaKaryawan AS Oleh,
    CASE
      WHEN cab.namaCabang IS NOT NULL THEN j.cabLain
      WHEN p.namaPartner IS NOT NULL THEN ${vendorKode}
      ELSE e.kodeKar
    END AS kodeRekan,
    CASE
      WHEN cab.namaCabang IS NOT NULL AND (divc.compCode = divn.compCode) THEN 'Y'
      ELSE 'N'
    END AS antarDivisi ,
        CASE
          WHEN cab.namaCabang IS NOT NULL THEN j.cabLain
          WHEN p.namaPartner IS NOT NULL THEN 'kodePartner'
          ELSE 'salesID'
        END AS jnsRekan,
        j.nomorSuratJalan, tr.nomorPO, tr.nomorPR,
        nc.namaCabang AS cabang
      FROM detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
      LEFT JOIN partner p ON j.kodePartner=p.kodePartner
      LEFT JOIN cabang cab ON j.cabLain=cab.kodeCab
      LEFT JOIN cabang nc ON j.cabID = nc.kodeCab
      LEFT JOIN divisi divc ON divc.divisiCode = cab.divisiCode
      LEFT JOIN divisi divn ON divn.divisiCode = nc.divisiCode
      LEFT JOIN COA c ON d.kodeAkun=c.kodeAkun
      LEFT JOIN subAkun s ON c.subAkun=s.kodeSubAkun
      LEFT JOIN karyawan e ON e.kodeKar=j.salesID
      LEFT JOIN karyawan eo ON eo.kodeKar=j.oleh
      LEFT JOIN transaksi tr ON j.nomorSuratJalan= tr.nomorBukti
      LEFT JOIN (
        SELECT SUM(IF(d.DK=r.jnsAkun,-d.nilai,d.nilai)) AS tbayar,d.kodeAkun, d.nomorReff
        FROM detJur d
          LEFT JOIN jurnal t ON d.nomorJurnal=t.nomorJurnal
          LEFT JOIN COA r ON d.kodeAkun=r.kodeAkun
        WHERE t.status !='B'  AND d.nomorReff !='' AND r.subAkun IN (?)
          GROUP BY d.nomorReff, d.kodeAkun
      ) byr ON d.nomorJurnal=byr.nomorReff AND byr.kodeAkun = d.kodeAkun
      WHERE j.jhp=? AND s.kodeSubAkun IN (?) AND j.tglJurnal<= ? AND j.ac=? AND j.cabID IN (?) AND j.status NOT IN ('B','W') AND d.DK = c.jnsAkun
        ${having}
      ORDER BY j.tglJurnal DESC`,
        [
          x.tgl,
          x.kodeSubAkun,
          x.jhp,
          x.kodeSubAkun,
          x.tgl,
          x.ac,
          kodeCab,
          status,
        ]
      )
      .then((rows) => {
        res.send(rows);
      })
      .catch((err) => {
        console.log(err);
        res.status(501).send({ st: "tidak nemu..." });
      });
  } else {
    // hutang Antar cabang / grup Aston
    dbuse
      .query(
        `SELECT d.*, cab.namaCabang AS namaPartner, DATE_FORMAT(j.tglJurnal,'%Y-%m-%d') AS tgl,DATEDIFF(?,j.tglJurnal) AS umur,
        j.judulJurnal,j.status,byr.tbayar,j.cabID, (d.nilai - COALESCE(byr.tbayar,0)) AS sisa,
        nc.namaCabang AS cabang,
        'Y' AS antarDivisi
      FROM detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
      LEFT JOIN cabang cab ON j.cabID=cab.kodeCab
      LEFT JOIN cabang nc ON j.cabLain = nc.kodeCab
      LEFT JOIN COA c ON d.kodeAkun=c.kodeAkun
      LEFT JOIN subAkun s ON c.subAkun=s.kodeSubAkun
      LEFT JOIN (
        SELECT SUM(IF(d.DK='D',d.nilai,-d.nilai)) AS tbayar,d.kodeAkun, t.noreff AS noref
        FROM detJur d
          LEFT JOIN jurnal t ON d.nomorJurnal=t.nomorJurnal
          LEFT JOIN COA r ON d.kodeAkun=r.kodeAkun
        WHERE t.status !='B'  AND d.nomorReff !='' AND r.subAkun IN (?) AND t.tglJurnal<= ?
        GROUP BY d.nomorReff
      ) byr ON j.nomorJurnal=byr.noref
      WHERE j.jhp='P' AND s.kodeSubAkun IN (?) AND j.tglJurnal <= ? AND d.msAC='S' AND j.ac=?  AND j.cabLain IN (?) AND j.status NOT IN ('B','W','T')
      ${having}
      ORDER BY j.tglJurnal DESC`,
        [x.tgl, x.kodeSubAkun, x.tgl, x.kodeSubAkun, x.tgl, x.ac, kodeCab]
      )
      .then((rows) => {
        res.send(rows);
      })
      .catch((err) => {
        console.log(err);
        res.status(501).send({ st: "tidak nemu..." });
      });
  }
});
app.post("/faaKes", async (req, res) => {
  let { kodeAkun, tgla, tglb } = req.body.x;
  let { x } = req.body;
  let user = req.user.dtAkun;
  kodeCab = ["MAN", "acc", "purchase", "mitra"].some((a) => a == user.userType)
    ? x.kodeCab
    : [user.kodeCab];
  let sawal = {};
  // pilih msAC if ac Y...
  try {
    let dt = await dbuse.query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT      
      SUM(CASE
        WHEN dt.DK = 'D' AND ((dt.msAC = 'M' AND j.cabID IN (:cabID)) OR (dt.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID))) THEN dt.nilai
        ELSE 0
      END) AS debit,
      CASE
        WHEN dt.DK = 'K' AND ((dt.msAC = 'M' AND j.cabID IN (:cabID)) OR (dt.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID))) THEN dt.nilai
        ELSE 0
      END AS kredit, dt.desk,
      j.tglJurnal AS tgl, j.nomorJurnal,j.judulJurnal,dt.iddetJur,dt.msAC,j.ac,
      IF(dt.msAC='M',j.cabID,j.cabLain) AS kodeCabang,
      IF(p.namaPartner IS NOT NULL, p.namaPartner, k.namaKaryawan) AS namaPartner,
      dt.nomorReff,  jr.tglJurnal AS tglRef
        FROM detJur dt LEFT JOIN jurnal j ON dt.nomorJurnal=j.nomorJurnal
          LEFT JOIN partner p ON j.kodePartner = p.kodePartner
          LEFT JOIN karyawan k ON j.salesID = k.kodeKar
          LEFT JOIN jurnal jr ON jr.nomorJurnal = dt.nomorReff
        WHERE (j.tglJurnal BETWEEN :tgla AND :tglb) AND dt.kodeAkun = :kodeAkun AND j.status NOT IN ('B','W')
          AND (j.cabID IN (:cabID) OR (j.cabLain IN (:cabID) AND j.ac='Y')) AND dt.DK = 'D'
        GROUP BY j.salesID
        ORDER BY kodeCabang`,
      },
      x
    );
    dbuse
      .query(
        `SELECT SUM(IF(dt.DK=c.jnsAkun,dt.nilai,-dt.nilai)) AS sawalIDRa, dt.kodeAkun,
      SUM(CASE
        WHEN (dt.DK=c.jnsAkun AND dt.msAC='M' AND trx.cabID IN (?)) OR (dt.DK=c.jnsAkun AND dt.msAC='S' AND trx.cabLain IN (?) AND trx.ac = 'Y') THEN dt.nilai
        WHEN (dt.DK != c.jnsAkun AND dt.msAC='M' AND trx.cabID IN (?)) OR (dt.DK != c.jnsAkun AND dt.msAC='S' AND trx.cabLain IN (?) AND trx.ac = 'Y') THEN -dt.nilai
        ELSE 0
      END) AS sawalIDR
        FROM detJur dt LEFT JOIN jurnal trx ON dt.nomorJurnal=trx.nomorJurnal
          LEFT JOIN COA c ON c.kodeAkun=dt.kodeAkun
        WHERE trx.tglJurnal < ? AND dt.kodeAkun =? AND (trx.status !='B' AND trx.status !='W') AND (trx.cabID IN (?) OR (trx.cabLain IN (?) AND trx.ac= 'Y'))`,
        [kodeCab, kodeCab, kodeCab, kodeCab, tgla, kodeAkun, kodeCab, kodeCab]
      )
      .then((rows) => {
        sawal = rows[0].sawalIDR;
        res.send({ sawal: sawal, dt: dt });
      })
      .catch((err) => {
        console.log(err);
        res.status(410).send("err mas");
      });
  } catch (err) {
    console.log(err);
    res.status(410).send("err mas");
  }
});

app.post("/faaStk", async (req, res) => {
  let { x } = req.body;
  try {
    let sql = `SELECT s.kodeProduk, s.asal, s.tujuan, SUM(COALESCE(s.saldo,0)) AS total, SUM(COALESCE(s.masuk, 0)) AS masuk, SUM(COALESCE(s.keluar,0)) AS keluar, s.kodeCabang,
      SUM(IF(COALESCE(s.saldo,0) >= COALESCE(bln1.tb,0), bln1.tb, COALESCE(s.saldo,0))) AS u30,
      SUM(CASE WHEN s.saldo - COALESCE(bln1.tb,0) >= COALESCE(bln2.tb,0) THEN bln2.tb
        WHEN s.saldo - COALESCE(bln1.tb,0) BETWEEN 0 AND COALESCE(bln2.tb,0) THEN s.saldo - COALESCE(bln1.tb,0)
        ELSE 0
      END) AS u60,
      SUM(CASE WHEN s.saldo - COALESCE(bln1.tb,0) - COALESCE(bln2.tb,0) >= COALESCE(bln3.tb,0) THEN bln3.tb
        WHEN s.saldo - COALESCE(bln1.tb,0) -COALESCE(bln2.tb,0) BETWEEN 0 AND COALESCE(bln3.tb,0) THEN s.saldo - COALESCE(bln1.tb,0) -COALESCE(bln2.tb,0)
        ELSE 0
      END) AS u90,
      SUM(CASE WHEN s.saldo - COALESCE(bln1.tb,0) - COALESCE(bln2.tb,0) - COALESCE(bln3.tb,0) >= COALESCE(bln4.tb,0) THEN s.saldo - COALESCE(bln1.tb,0) - COALESCE(bln2.tb,0) - COALESCE(bln3.tb,0)
        WHEN s.saldo - COALESCE(bln1.tb,0) -COALESCE(bln2.tb,0) - COALESCE(bln3.tb,0) BETWEEN 0 AND COALESCE(bln4.tb,0) THEN s.saldo - COALESCE(bln1.tb,0) -COALESCE(bln2.tb,0) - COALESCE(bln3.tb,0)
        ELSE 0
      END) AS u91
      FROM
        (SELECT SUM(CASE
          WHEN t.tujuan IN (:cabID) AND (t.asal NOT IN (:cabID) OR t.asal IS NULL) AND t.status = 'T' AND t.jnsTrx != 'RJ' THEN d.dpp + d.ongkir
          WHEN t.tujuan IN (:cabID) AND (t.asal NOT IN (:cabID) OR t.asal IS NULL) AND t.status = 'T' AND t.jnsTrx = 'RJ' THEN d.hpp
          WHEN t.asal IN (:cabID) AND (t.tujuan NOT IN (:cabID) OR t.tujuan IS NULL) AND t.status IN ('D', 'T') THEN -d.hpp
          ELSE 0
          END) AS saldo,
          d.kodeProduk,
          CASE WHEN t.asal IN (:cabID) AND t.tujuan NOT IN (:cabID) THEN t.asal
            WHEN (t.asal IS NULL OR t.asal NOT IN (:cabID)) AND t.tujuan IN (:cabID) THEN t.tujuan
            ELSE ''
          END AS kodeCabang,
          SUM(CASE
            WHEN t.asal IN (:cabID) AND t.status IN ('T', 'D') AND t.tujuan IN (:cabID) THEN -d.hpp
            ELSE 0
            END) AS keluar,
          SUM(CASE
          WHEN t.tujuan IN (:cabID) AND t.status IN ('T') AND t.asal IN (:cabID) THEN d.dpp
          ELSE 0
          END) AS masuk, t.asal, t.tujuan
        FROM detTrans d
          LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
        WHERE t.tglKirim <= :tgla AND t.status NOT IN ('W', 'B') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID))
        GROUP BY d.kodeProduk, kodeCabang, asal, tujuan) s
      LEFT JOIN
      (SELECT SUM(IF(t.tujuan IN (:cabID),d.dpp + d.ongkir,0)) AS tb, d.kodeProduk,
        CASE WHEN t.asal IN (:cabID) THEN t.asal
          WHEN t.tujuan IN (:cabID) THEN t.tujuan
          ELSE '' END AS kodeCabang FROM detTrans d
        LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
        WHERE t.status NOT IN ('W', 'B') AND t.tglKirim BETWEEN DATE_ADD(:tgla, INTERVAL -30 DAY) AND DATE_ADD(:tgla, INTERVAL -1 DAY) AND t.jnsTrx IN ('SA', 'B','RB','RJ', 'H', 'J') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID))
        GROUP BY d.kodeProduk, kodeCabang) bln1 ON s.kodeProduk=bln1.kodeProduk AND s.kodeCabang = bln1.kodeCabang
      LEFT JOIN
      (SELECT SUM(IF(t.tujuan IN (:cabID),d.dpp + d.ongkir,0)) AS tb, d.kodeProduk,
        CASE WHEN t.asal IN (:cabID) THEN t.asal
          WHEN t.tujuan IN (:cabID) THEN t.tujuan
          ELSE '' END AS kodeCabang FROM detTrans d
        LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
        WHERE t.status NOT IN ('W', 'B') AND t.tglKirim BETWEEN DATE_ADD(:tgla, INTERVAL -60 DAY) AND DATE_ADD(:tgla, INTERVAL -31 DAY) AND t.jnsTrx IN ('SA', 'B','RB','RJ', 'H', 'J') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID))
        GROUP BY d.kodeProduk, kodeCabang) bln2 ON s.kodeProduk=bln2.kodeProduk AND s.kodeCabang = bln2.kodeCabang
      LEFT JOIN
      (SELECT SUM(IF(t.tujuan IN (:cabID),d.dpp + d.ongkir,0)) AS tb, d.kodeProduk,
        CASE WHEN t.asal IN (:cabID) THEN t.asal
          WHEN t.tujuan IN (:cabID) THEN t.tujuan
          ELSE '' END AS kodeCabang FROM detTrans d
        LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
        WHERE t.status NOT IN ('W', 'B') AND t.tglKirim BETWEEN DATE_ADD(:tgla, INTERVAL -90 DAY) AND DATE_ADD(:tgla, INTERVAL -61 DAY) AND t.jnsTrx IN ('SA', 'B','RB','RJ', 'H', 'J') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID))
        GROUP BY d.kodeProduk, kodeCabang) bln3 ON s.kodeProduk=bln3.kodeProduk AND s.kodeCabang = bln3.kodeCabang
      LEFT JOIN
      (SELECT SUM(IF(t.tujuan IN (:cabID),d.dpp + d.ongkir,0)) AS tb, d.kodeProduk,
        CASE WHEN t.asal IN (:cabID) THEN t.asal
          WHEN t.tujuan IN (:cabID) THEN t.tujuan
          ELSE '' END AS kodeCabang FROM detTrans d
        LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
        WHERE t.status NOT IN ('W', 'B') AND t.jnsTrx IN ('SA', 'B','RB','RJ', 'H', 'J') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID)) AND t.tglKirim < DATE_ADD(:tgla, INTERVAL -90 DAY)
        GROUP BY d.kodeProduk, kodeCabang) bln4 ON s.kodeProduk=bln4.kodeProduk AND s.kodeCabang = bln4.kodeCabang
      GROUP BY kodeCabang, asal, tujuan`;
    let sqla = `SELECT s.kodeProduk, SUM(COALESCE(s.saldo,0)) AS totala, SUM(COALESCE(s.masuk, 0)) AS masuka, SUM(COALESCE(s.keluar,0)) AS keluara, s.kodeCabang, s.asal, s.tujuan,
      SUM(IF(COALESCE(s.saldo,0) >= COALESCE(bln1.tb,0), bln1.tb, COALESCE(s.saldo,0))) AS ua30,
      SUM(CASE WHEN s.saldo - COALESCE(bln1.tb,0) >= COALESCE(bln2.tb,0) THEN bln2.tb
        WHEN s.saldo - COALESCE(bln1.tb,0) BETWEEN 0 AND COALESCE(bln2.tb,0) THEN s.saldo - COALESCE(bln1.tb,0)
        ELSE 0
      END) AS ua60,
      SUM(CASE WHEN s.saldo - COALESCE(bln1.tb,0) - COALESCE(bln2.tb,0) >= COALESCE(bln3.tb,0) THEN bln3.tb
        WHEN s.saldo - COALESCE(bln1.tb,0) -COALESCE(bln2.tb,0) BETWEEN 0 AND COALESCE(bln3.tb,0) THEN s.saldo - COALESCE(bln1.tb,0) -COALESCE(bln2.tb,0)
        ELSE 0
      END) AS ua90,
      SUM(CASE WHEN s.saldo - COALESCE(bln1.tb,0) - COALESCE(bln2.tb,0) - COALESCE(bln3.tb,0) >= COALESCE(bln4.tb,0) THEN s.saldo - COALESCE(bln1.tb,0) - COALESCE(bln2.tb,0) - COALESCE(bln3.tb,0)
        WHEN s.saldo - COALESCE(bln1.tb,0) -COALESCE(bln2.tb,0) - COALESCE(bln3.tb,0) BETWEEN 0 AND COALESCE(bln4.tb,0) THEN s.saldo - COALESCE(bln1.tb,0) -COALESCE(bln2.tb,0) - COALESCE(bln3.tb,0)
        ELSE 0
      END) AS ua91
      FROM
        (SELECT SUM(CASE
          WHEN t.tujuan IN (:cabID) AND (t.asal NOT IN (:cabID) OR t.asal IS NULL) AND t.status = 'T' AND t.jnsTrx != 'RJ' THEN d.dpp + d.ongkir
          WHEN t.tujuan IN (:cabID) AND (t.asal NOT IN (:cabID) OR t.asal IS NULL) AND t.status = 'T' AND t.jnsTrx = 'RJ' THEN d.hpp
          WHEN t.asal IN (:cabID) AND (t.tujuan NOT IN (:cabID) OR t.tujuan IS NULL) AND t.status IN ('D', 'T') THEN -d.hpp
          ELSE 0
          END) AS saldo,
          d.kodeProduk,
          CASE WHEN t.asal IN (:cabID) AND t.tujuan NOT IN (:cabID) THEN t.asal
            WHEN (t.asal IS NULL OR t.asal NOT IN (:cabID)) AND t.tujuan IN (:cabID) THEN t.tujuan
            ELSE ''
          END AS kodeCabang,
          SUM(CASE
            WHEN t.asal IN (:cabID) AND t.status IN ('T', 'D') AND t.tujuan IN (:cabID) THEN -d.hpp
            ELSE 0
            END) AS keluar,
          SUM(CASE
          WHEN t.tujuan IN (:cabID) AND t.status IN ('T') AND t.asal IN (:cabID) THEN d.dpp
          ELSE 0
          END) AS masuk, t.asal, t.tujuan
        FROM detTrans d
          LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
        WHERE t.tglKirim <= :tglb AND t.status NOT IN ('W', 'B') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID))
        GROUP BY d.kodeProduk, kodeCabang, asal, tujuan) s
      LEFT JOIN
      (SELECT SUM(IF(t.tujuan IN (:cabID), d.dpp + d.ongkir,0)) AS tb, d.kodeProduk, t.asal, t.tujuan,
        CASE WHEN t.asal IN (:cabID) THEN t.asal
          WHEN t.tujuan IN (:cabID) THEN t.tujuan
          ELSE '' END AS kodeCabang FROM detTrans d
        LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
        WHERE t.status NOT IN ('W', 'B') AND t.tglKirim BETWEEN DATE_ADD(:tglb, INTERVAL -30 DAY) AND DATE_ADD(:tglb, INTERVAL -1 DAY) AND t.jnsTrx IN ('SA', 'B','RB','RJ', 'H', 'J') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID))
        GROUP BY d.kodeProduk, kodeCabang, asal, tujuan) bln1 ON s.kodeProduk=bln1.kodeProduk AND s.kodeCabang = bln1.kodeCabang
      LEFT JOIN
      (SELECT SUM(IF(t.tujuan IN (:cabID),d.dpp + d.ongkir,0)) AS tb, d.kodeProduk,
        CASE WHEN t.asal IN (:cabID) THEN t.asal
          WHEN t.tujuan IN (:cabID) THEN t.tujuan
          ELSE '' END AS kodeCabang FROM detTrans d
        LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
        WHERE t.status NOT IN ('W', 'B') AND t.tglKirim BETWEEN DATE_ADD(:tglb, INTERVAL -60 DAY) AND DATE_ADD(:tglb, INTERVAL -31 DAY) AND t.jnsTrx IN ('SA', 'B','RB','RJ', 'H', 'J') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID))
        GROUP BY d.kodeProduk, kodeCabang) bln2 ON s.kodeProduk=bln2.kodeProduk AND s.kodeCabang = bln2.kodeCabang
      LEFT JOIN
      (SELECT SUM(IF(t.tujuan IN (:cabID),d.dpp + d.ongkir,0)) AS tb, d.kodeProduk,
        CASE WHEN t.asal IN (:cabID) THEN t.asal
          WHEN t.tujuan IN (:cabID) THEN t.tujuan
          ELSE '' END AS kodeCabang FROM detTrans d
        LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
        WHERE t.status NOT IN ('W', 'B') AND t.tglKirim BETWEEN DATE_ADD(:tglb, INTERVAL -90 DAY) AND DATE_ADD(:tglb, INTERVAL -61 DAY) AND t.jnsTrx IN ('SA', 'B','RB','RJ', 'H', 'J') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID))
        GROUP BY d.kodeProduk, kodeCabang) bln3 ON s.kodeProduk=bln3.kodeProduk AND s.kodeCabang = bln3.kodeCabang
      LEFT JOIN
      (SELECT SUM(IF(t.tujuan IN (:cabID),d.dpp + d.ongkir,0)) AS tb, d.kodeProduk,
        CASE WHEN t.asal IN (:cabID) THEN t.asal
          WHEN t.tujuan IN (:cabID) THEN t.tujuan
          ELSE '' END AS kodeCabang FROM detTrans d
        LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
        WHERE t.status NOT IN ('W', 'B') AND t.jnsTrx IN ('SA', 'B','RB','RJ', 'H', 'J') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID)) AND t.tglKirim < DATE_ADD(:tglb, INTERVAL -90 DAY)
        GROUP BY d.kodeProduk, kodeCabang) bln4 ON s.kodeProduk=bln4.kodeProduk AND s.kodeCabang = bln4.kodeCabang
      GROUP BY kodeCabang, asal, tujuan`;
    let sawal = await dbuse.query(
      {
        namedPlaceholders: true,
        sql: sql,
      },
      x
    );
    let sawala = await dbuse.query(
      {
        namedPlaceholders: true,
        sql: sqla,
      },
      x
    );
    let nStk = await dbuse.query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT SUM(CASE
        WHEN t.tujuan IN (:cabID) AND t.asal NOT IN (:cabID) AND t.status = 'T' THEN d.dpp + d.ongkir
        ELSE 0 END) + COALESCE(st.saldo,0) AS masuk,
        SUM(CASE
          WHEN t.asal IN (:cabID) AND t.tujuan NOT IN (:cabID) THEN d.hpp
          ELSE 0 END) + COALESCE(sa.saldo,0) AS keluar,
        CASE
          WHEN t.asal IN (:cabID) AND t.tujuan NOT IN (:cabID) THEN t.asal
            WHEN t.asal NOT IN (:cabID) AND t.tujuan IN (:cabID) THEN t.tujuan
            WHEN st.kodeCabang IN (:cabID) THEN st.kodeCabang
            WHEN sa.kodeCabang IN (:cabID) THEN sa.kodeCabang
            ELSE ''
        END AS kodeCabang
        FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
        LEFT JOIN (
          SELECT SUM(CASE
          WHEN t.tujuan IN (:cabID) AND t.asal IN (:cabID) AND t.status = 'T' THEN d.dpp + d.ongkir
          ELSE 0
          END) AS saldo, d.kodeProduk,
          CASE
            WHEN t.asal IN (:cabID) AND t.tujuan IN (:cabID) THEN t.tujuan
            ELSE ''
          END AS kodeCabang
          FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
          WHERE t.tglKirim BETWEEN :tgla AND :tglb AND t.status NOT IN ('W', 'B') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID))
          GROUP BY kodeCabang, d.kodeProduk) st ON st.kodeProduk=d.kodeProduk AND st.kodeCabang = t.tujuan
        LEFT JOIN (
          SELECT SUM(CASE
          WHEN t.tujuan IN (:cabID) AND t.asal IN (:cabID) AND t.status = 'T' THEN d.hpp
          ELSE 0
          END) AS saldo, d.kodeProduk,
          CASE
            WHEN t.asal IN (:cabID) AND t.tujuan IN (:cabID) THEN t.asal
            ELSE ''
          END AS kodeCabang
          FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
          WHERE t.tglKirim BETWEEN :tgla AND :tglb AND t.status NOT IN ('W', 'B') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID))
          GROUP BY kodeCabang, d.kodeProduk) sa ON sa.kodeProduk=d.kodeProduk AND sa.kodeCabang = t.tujuan
        WHERE t.tglKirim BETWEEN :tgla AND :tglb AND t.status NOT IN ('W', 'B') AND (t.asal IN (:cabID) OR t.tujuan IN (:cabID))
        GROUP BY kodeCabang`,
      },
      x
    );
    res.send({ sawal, sawala, nStk });
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum ada data..." });
  }
});

app.post("/faaAK", async (req, res) => {
  let { x } = req.body;
  try {
    let sawal = await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `SELECT SUM(
        CASE
          WHEN d.DK = 'D' AND ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID)))
            AND j.tglJurnal < :tgla AND c.subAkun IN ('11010','11020') THEN d.nilai
          WHEN d.DK != 'D' AND ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID)))
            AND j.tglJurnal < :tgla AND c.subAkun IN ('11010','11020') THEN -d.nilai
          ELSE 0
        END) AS saldoAwal,
        SUM(CASE
          WHEN d.DK = 'D' AND ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID)))
            AND j.tglJurnal <= :tglb AND c.subAkun IN ('11010','11020') THEN d.nilai
          WHEN d.DK != 'D' AND ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID)))
            AND j.tglJurnal <= :tglb AND c.subAkun IN ('11010','11020') THEN -d.nilai
          ELSE 0
        END) AS saldoAkhir,
        CASE
          WHEN j.ac = 'Y' AND j.cabLain IN (:cabID) AND d.msAC = 'S' THEN j.cabLain
          ELSE j.cabID
        END AS kodeCabang,
        SUM(CASE
          WHEN ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID)))
            AND j.tglJurnal BETWEEN :tgla AND :tglb AND d.DK = 'D' AND c.subAkun IN ('11010', '11020')
            AND t.ct != 'tempo' THEN d.nilai
          ELSE 0
        END) AS tunai,
        SUM(CASE
          WHEN ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID)))
            AND j.tglJurnal BETWEEN :tgla AND :tglb AND d.DK = 'K' AND c.subAkun IN ('11050') THEN d.nilai
          ELSE 0
        END) AS pitUsaha,
        SUM(CASE
          WHEN ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID)))
            AND j.tglJurnal BETWEEN :tgla AND :tglb AND d.DK = 'D' AND c.subAkun IN ('11010', '11020') THEN d.nilai
          ELSE 0
        END) AS masuk,
        SUM(CASE
          WHEN ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID)))
            AND j.tglJurnal BETWEEN :tgla AND :tglb AND d.DK = 'K' AND c.subAkun IN ('11010', '11020')
            AND t.ct != 'tempo' THEN d.nilai
          ELSE 0
        END) AS beli,
        SUM(CASE
          WHEN ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID)))
            AND j.tglJurnal BETWEEN :tgla AND :tglb AND d.DK = 'D' AND c.subAkun IN ('21010') THEN d.nilai
          ELSE 0
        END) AS hutUsaha,
        SUM(CASE
          WHEN ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID)))
            AND j.tglJurnal BETWEEN :tgla AND :tglb AND (c.midSub= '510' OR c.subAkun IN ('21070', '11060', '11065', '15010'))
            AND d.kodeAkun NOT IN ('150100001','110600001', '110650005') AND j.jnsJurnal NOT IN ('J', 'B') AND d.DK = 'D' THEN d.nilai
          ELSE 0
        END) AS bop,
        SUM(CASE
          WHEN ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID)))
            AND j.tglJurnal BETWEEN :tgla AND :tglb AND d.DK = 'K' AND c.subAkun IN ('11010', '11020') THEN d.nilai
          ELSE 0
        END) AS keluar
        FROM detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
        LEFT JOIN transaksi t ON j.nomorSuratJalan = t.nomorBukti
        LEFT JOIN COA c ON c.kodeAkun = d.kodeAkun
        WHERE j.tglJurnal <= :tglb AND (j.cabID IN (:cabID) OR (j.cabLain IN (:cabID) AND j.ac = 'Y')) AND j.status NOT IN ('B', 'W')
        GROUP BY kodeCabang`,
      },
      x
    );
    res.send(sawal);
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum ada data..." });
  }
});

app.post("/faaHP", async (req, res) => {
  let { x } = req.body;
  try {
    let nHP = await dbuse.query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT 
        CASE
          WHEN d.DK = c.jnsAkun AND ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID))) THEN d.nilai
          WHEN d.DK != c.jnsAkun AND ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID))) THEN -d.nilai
          ELSE 0
        END AS nilai, d.kodeAkun, d.DK,
        d.nomorJurnal, j.tglJurnal, j.status, j.cabLain,
        DATEDIFF(:tgla,j.tglJurnal) AS umurAwal, DATEDIFF(:tglb,j.tglJurnal) AS umurAkhir,
        DATEDIFF(j.tempo, :tglb) AS overdue,
        CASE
          WHEN j.ac = 'Y' AND j.cabLain IN (:cabID) AND d.msAC = 'S' THEN j.cabLain
          ELSE j.cabID
        END AS kodeCabang
        FROM detJur d
          LEFT JOIN jurnal j ON d.nomorJurnal = j.nomorJurnal
          LEFT JOIN COA c ON c.kodeAkun = d.kodeAkun
        WHERE j.tglJurnal BETWEEN :tgla AND :tglb AND (j.cabID IN (:cabID) OR (j.cabLain IN (:cabID) AND j.ac = 'Y')) AND j.status NOT IN ('B', 'W') AND c.subAkun = :kodeSubAkun`,
      },
      x
    );
    let sawal = await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `SELECT SUM(
        CASE
          WHEN d.DK = c.jnsAkun AND ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID))) AND j.tglJurnal < DATE_ADD(:tgla, INTERVAL -60 DAY) THEN d.nilai -COALESCE(byr.tbayar, 0)
          ELSE 0
        END
      ) AS u61,
      SUM(
        CASE
          WHEN d.DK = c.jnsAkun AND ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID))) AND j.tglJurnal BETWEEN DATE_ADD(:tgla, INTERVAL -60 DAY) AND DATE_ADD(:tgla, INTERVAL -31 DAY) THEN d.nilai -COALESCE(byr.tbayar, 0)      
          ELSE 0
        END
      ) AS u60,
      SUM(
        CASE
          WHEN d.DK = c.jnsAkun AND ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID))) AND j.tglJurnal BETWEEN DATE_ADD(:tgla, INTERVAL -30 DAY) AND DATE_ADD(:tgla, INTERVAL -15 DAY) THEN d.nilai -COALESCE(byr.tbayar, 0)
          ELSE 0
        END
      ) AS u30,
      SUM(
        CASE
          WHEN d.DK = c.jnsAkun AND ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID))) AND j.tglJurnal > DATE_ADD(:tgla, INTERVAL -15 DAY) THEN d.nilai -COALESCE(byr.tbayar, 0)
          ELSE 0
        END
      ) AS u14, d.kodeAkun,
      SUM(
        CASE
          WHEN d.DK = c.jnsAkun AND ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID))) AND j.tglJurnal < :tgla THEN d.nilai -COALESCE(byr.tbayar, 0)
          ELSE 0
        END
      ) AS total,
      SUM(CASE
          WHEN d.DK = c.jnsAkun AND ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID))) AND j.tglJurnal < DATE_ADD(:tglb, INTERVAL -60 DAY) THEN d.nilai -COALESCE(byra.tbayar, 0)
          ELSE 0
        END) AS ua61,
      SUM(CASE
          WHEN d.DK = c.jnsAkun AND ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID))) AND j.tglJurnal BETWEEN DATE_ADD(:tglb, INTERVAL -60 DAY) AND DATE_ADD(:tglb, INTERVAL -31 DAY) THEN d.nilai -COALESCE(byra.tbayar, 0)      
          ELSE 0
        END) AS ua60,
      SUM(CASE
          WHEN d.DK = c.jnsAkun AND ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID))) AND j.tglJurnal BETWEEN DATE_ADD(:tglb, INTERVAL -30 DAY) AND DATE_ADD(:tglb, INTERVAL -15 DAY) THEN d.nilai -COALESCE(byra.tbayar, 0)
          ELSE 0
        END) AS ua30,
      SUM(CASE
          WHEN d.DK = c.jnsAkun AND ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID))) AND j.tglJurnal > DATE_ADD(:tglb, INTERVAL -15 DAY) THEN d.nilai -COALESCE(byra.tbayar, 0)
          ELSE 0
        END) AS ua14, d.kodeAkun,
      SUM(CASE
          WHEN d.DK = c.jnsAkun AND ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID))) AND j.tglJurnal <= :tglb THEN d.nilai -COALESCE(byra.tbayar, 0)
          ELSE 0
        END) AS totala,
      CASE
        WHEN j.ac = 'Y' AND j.cabLain IN (:cabID) AND d.msAC = 'S' THEN j.cabLain
        ELSE j.cabID
      END AS kodeCabang,
      SUM(CASE
        WHEN j.tempo < :tglb AND d.DK = c.jnsAkun AND ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID))) AND j.tglJurnal <= :tglb THEN d.nilai -COALESCE(byra.tbayar, 0)
        ELSE 0
      END) AS totalOverdue,
      SUM(CASE
        WHEN (j.tempo >= :tglb OR ISNULL(j.tempo)) AND d.DK = c.jnsAkun AND ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID))) AND j.tglJurnal <= :tglb THEN d.nilai -COALESCE(byra.tbayar, 0)
        ELSE 0
      END) AS blmOverdue
      FROM detJur d
        LEFT JOIN jurnal j ON j.nomorJurnal =d.nomorJurnal
        LEFT JOIN COA c ON c.kodeAkun = d.kodeAkun
        LEFT JOIN (
          SELECT
			      SUM(CASE
              WHEN d.DK != r.jnsAkun AND ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID))) THEN d.nilai
			       ELSE 0
			      END) AS tbayar,d.kodeAkun, d.nomorReff
          FROM detJur d
            LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
            LEFT JOIN COA r ON d.kodeAkun=r.kodeAkun
          WHERE j.status !='B'  AND d.nomorReff !='' AND r.subAkun = :kodeSubAkun AND j.tglJurnal < :tgla
          GROUP BY d.nomorReff
        ) byr ON j.nomorJurnal= byr.nomorReff AND d.kodeAkun = byr.kodeAkun
        LEFT JOIN (
          SELECT
			      SUM(CASE
              WHEN d.DK != r.jnsAkun AND ((d.msAC = 'M' AND j.cabID IN (:cabID)) OR (d.msAC = 'S' AND j.ac = 'Y' AND j.cabLain IN (:cabID))) THEN d.nilai
			       ELSE 0
			      END) AS tbayar,d.kodeAkun, d.nomorReff
          FROM detJur d
            LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
            LEFT JOIN COA r ON d.kodeAkun=r.kodeAkun
          WHERE j.status !='B'  AND d.nomorReff !='' AND r.subAkun = :kodeSubAkun AND j.tglJurnal <= :tglb
          GROUP BY d.nomorReff
        ) byra ON j.nomorJurnal= byra.nomorReff AND d.kodeAkun = byra.kodeAkun
      WHERE j.tglJurnal <= :tglb AND j.status NOT IN ('B', 'W') AND ((j.cabLain IN (:cabID) AND j.ac ='Y') OR j.cabID IN (:cabID)) AND c.subAkun = :kodeSubAkun
      GROUP BY kodeCabang`,
      },
      x
    );
    res.send({ sawal: sawal, nHP });
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum ada data..." });
  }
});
app.post("/multiBayar", admin, async (req, res) => {
  let user = req.user.dtAkun;
  let { hd, det } = req.body.x;
  let pot = await det
    .filter((s) => s.ptg === "Y")
    .map((rs) => {
      let ob = {
        kodeAkun: rs.akunPot,
        DK: "D",
        nilai: rs.potong,
        desk: "Potongan",
        nomorReff: rs.nomorJurnal,
        msAC: rs.msAC,
      };
      det.push(ob);
      return ob;
    });
  if (pot.length) {
    // det.push([...pot])
    console.log(pot);
  }
  hd.cabP = hd.kodeCab;
  hd.judulJurnal = hd.uraian;
  hd.cabID = ["MAN", "acc", "purchase", "mitra"].some((a) => a == user.userType)
    ? hd.kodeCab
    : user.kodeCab;
  hd.tglJurnal = hd.tgl;
  hd.jnsJurnal = "HP";
  let nomorReff = det[0].nomorJurnal;
  // hd.DKHP = x.DK // hd.jph == 'H' ? 'D' :'K'
  // hd.kasHP = x.DK == 'D' ? 'K' : 'D' // == 'H' ? 'K' :'D'
  let urt = hd.tgl.replace(/-/gi, "");
  let cr = hd.cabID + "99" + urt.slice(4, 6) + urt.slice(2, 4);
  let urut = await dbuse.query(
    `SELECT COUNT(nomorJurnal) AS nom FROM jurnal WHERE ISNULL(jn) AND nomorJurnal like '${cr}%'`,
    [cr]
  );
  let nojur = cr + String(parseInt(urut[0].nom) + 1).padStart(6, "0");
  try {
    if (hd.ac === "N") {
      hd.status = "L";
      let nomerJurnal;
      if (hd.kodePartner !== "") {
        nomerJurnal = await dbuse.query(
          `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,judulJurnal,noreff,status,kodePartner, oleh)
          VALUES (?,?,?,?,?,?,?,?,?)`,
          [
            hd.cabID,
            nojur,
            hd.tglJurnal,
            hd.jnsJurnal,
            hd.judulJurnal,
            nomorReff,
            hd.status,
            hd.kodePartner,
            user.eID,
          ]
        );
      } else {
        nomerJurnal = await dbuse.query(
          `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,judulJurnal,noreff,status,salesID, oleh)
          VALUES (?,?,?,?,?,?,?,?,?)`,
          [
            hd.cabID,
            nojur,
            hd.tglJurnal,
            hd.jnsJurnal,
            hd.judulJurnal,
            nomorReff,
            hd.status,
            hd.salesID,
            user.eID,
          ]
        );
      }
      let st = ["nomorJurnal", "kodeAkun", "DK", "nilai", "desk", "nomorReff"];
      //  let val = await col.map(a => Object.values(a))
      let val = det.map((a) => {
        let u = [];
        a.nilai = a.potong > 0 ? jumlah([a.nilai, a.potong]) : a.nilai;
        a.nomorJurnal = nojur;
        for (let i in st) {
          a[st[i]] === undefined ? u.push(nojur) : u.push(a[st[i]]);
        }
        return u;
      });
      dbuse
        .batch(
          `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,desk, nomorReff) VALUES (?,?,?,?,?,?)`,
          val
        )
        .then((rows) => {
          res.send({ st: "tersimpan..." });
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      hd.status = "W";
      // jhp = H => msACa = S,
      let msACa = hd.jhp === "H" ? "S" : "M";
      let msACb = hd.jhp === "H" ? "M" : "S";
      let DKa = hd.jhp === "H" ? "K" : "D"; // kas asal = Kredit saat bayar hutang, kas tujuan = Debit terima pembayaran
      let DKb = hd.jhp === "H" ? "D" : "K";
      let nomerJurnal = await dbuse.query(
        `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,judulJurnal,noreff,status,cabLain,ac,oleh)
        VALUES (?,?,?,?,?,?,?,?,'Y',?)`,
        [
          hd.cabP,
          nojur,
          hd.tglJurnal,
          hd.jnsJurnal,
          hd.judulJurnal,
          nomorReff,
          hd.status,
          hd.cabLain,
          user.eID,
        ]
      );
      let dtHP = await dbuse.query(
        `SELECT kodeAkun,DK,msAC FROM detJur WHERE nomorJurnal=? AND cabLain !=''`,
        [nomorReff, hd.tHP]
      );
      let val = dtHP.map((a, b) => {
        a.nilai = hd.nilai;
        a.DK = a.DK === "K" ? "D" : "K";
        a.nomorJurnal = nojur;
        a.desk = hd.desk;
        a.nomorReff = nomorReff;
        return Object.values(a);
      });
      // tambah asalAkun + tujuan akun /// akunKas
      val.push([hd.kodeAkun, DKa, msACa, hd.nilai, nojur, hd.desk, nomorReff]);
      val.push([hd.kodeAkunD, DKb, msACb, hd.nilai, nojur, hd.desk, nomorReff]);
      /* [
        [nojur,x.kodeAkun,'D',x.nilai,x.desk,'M'], // debit
        [nojur,x.kodeAkunt,'K',x.nilai,x.desk,'M'],
        [nojur,x.kodeAkun,'D',x.nilai,x.desk,'S'], // debit
        [nojur,x.kodeAkunt,'K',x.nilai,x.desk,'S']
      ] */
      dbuse
        .batch(
          `INSERT INTO detJur(kodeAkun,DK,msAC,nilai,nomorJurnal,desk,nomorReff) VALUES (?,?,?,?,?,?,?)`,
          val
        )
        .then((rows) => {
          res.send({ st: "tersimpan..." });
        })
        .catch((err) => {
          console.log(err);
        });
    }
  } catch (err) {
    console.log(err);
    res.status(410).send({ st: "gagal simpan..." });
  } finally {
    let lunas = det
      .filter((a) => a.lunas === "Y")
      .map((s) => {
        let us = {};
        us.nomorJurnal = s.nomorReff;
        return us;
      });
    if (lunas.length) {
      for (let a in lunas) {
        dbuse
          .query(`UPDATE jurnal SET status='L' WHERE nomorJurnal=?`, [
            lunas[a].nomorJurnal,
          ])
          .catch((err) => {
            console.log(err);
          });
      }
      res.send({ st: "Tersimpan..." });
    } else {
      res.send({ st: "Belum lunas..." });
    }
    dbuse
      .query(
        `INSERT INTO userLog (jnsLog, waktu,akun,nomorJurnal,deskripsi)
      VALUES ('BY',NOW(),'${req.user.dtAkun.akun}','${nojur}', 'Pembayaran H/P')`
      )
      .catch((err) => {
        console.log(err);
      });
  }
});

app.post("/bayarhp", admin, async (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  let hd = {};
  let nomorReff = x.nomorReff;
  hd.judulJurnal = x.judulJurnal;
  hd.cabID = ["MAN", "acc", "purchase", "mitra"].some((a) => a == user.userType)
    ? x.cabP
    : user.kodeCab;
  hd.tglJurnal = x.tgl;
  hd.jnsJurnal = "HP";
  hd.ac = x.ac;
  hd.DKHP = x.DK; // hd.jph == 'H' ? 'D' :'K'
  hd.kasHP = x.DK == "D" ? "K" : "D"; // == 'H' ? 'K' :'D'
  let urt = x.tgl.replace(/-/gi, "");
  let cr = hd.cabID + "99" + urt.slice(4, 6) + urt.slice(2, 4);
  let urut = await dbuse.query(
    `SELECT COUNT(nomorJurnal) AS nom FROM jurnal WHERE ISNULL(jn) AND nomorJurnal like '${cr}%'`,
    [cr]
  );
  let nojur = cr + String(parseInt(urut[0].nom) + 1).padStart(6, "0");
  let jurkop = x.jurKop || null;
  try {
    if (x.ac == "N") {
      hd.kodePartner = x.kodePartner;
      hd.status = "L";
      x.totalHP =
        x.lunas && x.jhp === "P" ? jumlah([x.nilai, x.biaya]) : x.nilai;
      x.totalKas =
        x.lunas && x.jhp === "H" ? jumlah([x.nilai, x.biaya]) : x.nilai;
      x.DKb = x.jhp === "P" ? hd.kasHP : hd.DKHP;
      let nomerJurnal;
      if (x.kodePartner != "") {
        nomerJurnal = await dbuse.query(
          `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,judulJurnal,noreff,status,kodePartner,oleh)
          VALUES (?,?,?,?,?,?,?,?,?)`,
          [
            hd.cabID,
            nojur,
            hd.tglJurnal,
            hd.jnsJurnal,
            hd.judulJurnal,
            nomorReff,
            hd.status,
            hd.kodePartner,
            user.eID,
          ]
        );
      } else {
        nomerJurnal = await dbuse.query(
          `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,judulJurnal,noreff,status,salesID,oleh)
          VALUES (?,?,?,?,?,?,?,?,?)`,
          [
            hd.cabID,
            nojur,
            hd.tglJurnal,
            hd.jnsJurnal,
            hd.judulJurnal,
            nomorReff,
            hd.status,
            x.salesID,
            user.eID,
          ]
        );
      }
      let val = [
        [nojur, x.kodeAkun, hd.kasHP, x.totalKas, x.desk, ""], // dana Kas
        [nojur, x.akunHP, hd.DKHP, x.totalHP, x.desk, nomorReff], // akun hutang/piutang pokok
      ];
      if (x.lunas) {
        val.push([nojur, x.akunLunas, x.DKb, x.biaya, x.desk, ""]); // akun biaya marketing / admin bank
      }
      dbuse
        .batch(
          `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,desk, nomorReff)
       VALUES (?,?,?,?,?,?)`,
          val
        )
        .then((rows) => {
          res.send({ st: "tersimpan..." });
        })
        .catch((err) => {
          console.log(err);
        });
      if (jurkop) {
        let updreff = await dbuse.query(
          `UPDATE detJur SET jurKop = ? WHERE nomorJurnal= ? AND nomorReff =?`,
          [jurkop, jurkop, x.jurKopreff]
        );
      }
    } else {
      hd.cabLain = x.cabLain;
      hd.status = "W";
      // jhp = H => msACa = S,
      let msACa = x.jhp == "H" ? "S" : "M";
      let msACb = x.jhp == "H" ? "M" : "S";
      let DKa = x.jhp == "H" ? "K" : "D"; // kas asal = Kredit saat bayar hutang, kas tujuan = Debit terima pembayaran
      let DKb = x.jhp == "H" ? "D" : "K";
      let DKl = x.jhp === "H" ? DKb : DKa;
      let totalHP =
        x.lunas && x.jhp === "P" ? jumlah([x.nilai, x.biaya]) : x.nilai;
      let kasHut =
        x.lunas && x.jhp === "H" ? jumlah([x.nilai, x.biaya]) : x.nilai;
      let nomerJurnal = await dbuse.query(
        `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,judulJurnal,noreff,status,cabLain,ac,oleh)
        VALUES (?,?,?,?,?,?,?,?,'Y',?)`,
        [
          x.cabP,
          nojur,
          hd.tglJurnal,
          hd.jnsJurnal,
          hd.judulJurnal,
          nomorReff,
          hd.status,
          hd.cabLain,
          user.eID,
        ]
      );
      let dtHP = await dbuse.query(
        `SELECT kodeAkun,DK,msAC FROM detJur WHERE nomorJurnal=? AND cabLain !=''`,
        [nomorReff, x.tHP]
      );
      let val = dtHP.map((a, b) => {
        a.nilai = totalHP;
        a.DK = a.DK === "K" ? "D" : "K";
        a.nomorJurnal = nojur;
        a.desk = x.desk;
        a.nomorReff = nomorReff;
        return Object.values(a);
      });
      // tambah asalAkun + tujuan akun /// akunKas
      val.push([x.kodeAkun, DKa, msACa, kasHut, nojur, x.desk, nomorReff]);
      val.push([x.kodeAkunD, DKb, msACb, totalHP, nojur, x.desk, nomorReff]);
      /* [
        [nojur,x.kodeAkun,'D',x.nilai,x.desk,'M'], // debit
        [nojur,x.kodeAkunt,'K',x.nilai,x.desk,'M'],
        [nojur,x.kodeAkun,'D',x.nilai,x.desk,'S'], // debit
        [nojur,x.kodeAkunt,'K',x.nilai,x.desk,'S']
      ] */
      if (x.lunas) {
        val.push([x.akunLunas, DKl, msACa, x.biaya, nojur, x.desk, ""]); // akun biaya marketing / admin bank
      }
      dbuse
        .batch(
          `INSERT INTO detJur(kodeAkun,DK,msAC,nilai,nomorJurnal,desk,nomorReff) VALUES (?,?,?,?,?,?,?)`,
          val
        )
        .then((rows) => {
          res.send({ st: "tersimpan..." });
        })
        .catch((err) => {
          console.log(err);
        });
    }
  } catch (err) {
    console.log(err);
    res.status(410).send({ st: "gagal simpan..." });
  } finally {
    if (x.sisaHP <= 0) {
      dbuse
        .query(`UPDATE jurnal SET status='T' WHERE nomorJurnal=?`, [nomorReff])
        .then((rows) => {
          res.send({
            st: `Tagihan ${nomorReff} sudah lunas, lakukan konfrimasi...`,
          });
        })
        .catch((err) => {
          console.log(err);
          res.status(401).send({ st: "Tidak diijinkan..." });
        });
    } else {
      res.send({ st: "Belum lunas..." });
    }
    dbuse
      .query(
        `INSERT INTO userLog (jnsLog, waktu,akun,nomorJurnal,deskripsi)
      VALUES ('BY',NOW(),'${req.user.dtAkun.akun}','${nojur}', 'Pembayaran H/P')`
      )
      .catch((err) => {
        console.log(err);
      });
  }
});

// jurnal status W
app.post("/dtTunggu", admin, (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  let cabID = ["MAN", "acc", "purchase"].some((a) => a == user.userType)
    ? x.kodeCab
    : user.kodeCab;
  dbuse
    .query(
      `SELECT j.nomorJurnal,j.status,j.cabID, j.cabLain,j.judulJurnal,c.namaCabang,
    cb.namaCabang AS namaCabLain,p.namaPartner, j.ac,j.noreff, DATE_FORMAT(j.tglJurnal,'%Y-%m-%d') AS tgl
    FROM jurnal j LEFT JOIN cabang c ON j.cabID=c.kodeCab
      LEFT JOIN cabang cb ON j.cabLain=cb.kodeCab
      LEFT JOIN partner p ON j.kodePartner=p.kodePartner
    WHERE j.status='W' AND (j.cabID = ? OR j.cabLain = ?)`,
      [cabID, cabID]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      res.status(501).send({ st: "tidak tersedia..." });
      console.log(err);
    });
});

app.post("/uphp", async (req, res) => {
  // x => ac, x.cabLain, status, namaCabang, nomorJurnal
  let { x } = req.body;
  let user = req.user.dtAkun;
  console.log(x);
  if (x.ac == "Y" && user.kodeCab == x.cabLain && x.status == "L") {
    res.status(501).send({ st: `Harus disetujui cabang ${x.namaCabang}...` });
  } else {
    try {
      let ss = await dbuse.query(
        `UPDATE jurnal SET status=? WHERE nomorJurnal=?`,
        [x.status, x.nomorJurnal]
      );
      let cekReff = await dbuse.query(
        `SELECT nomorJurnal, noreff, status FROM jurnal WHERE nomorJurnal = ?`,
        [x.nomorJurnal]
      );
      if (cekReff[0].noreff) {
        let upds = await dbuse.query(
          "UPDATE jurnal SET status='O' WHERE nomorJurnal=?",
          [cekReff[0].noreff]
        );
      }
    } catch (err) {
      console.log(err);
      res.status(501).send({ st: "tidak tersedia..." });
    } finally {
      res.send({ st: "Updated..." });
    }
  }
});

app.post("/edjur", admin, (req, res) => {
  let { x } = req.body;
  dbuse
    .query(
      {
        namedPlaceholders: true,
        sql: `UPDATE detJur SET desk=:desk,kodeAkun=:kodeAkun,nilai=:nilai,DK=:DK
      WHERE iddetJur =:iddetJur`,
      },
      x
    )
    .then((rows) => res.send({ st: "Updated..." }))
    .catch((err) => {
      res.status(501).send({ st: "tidak tersedia..." });
      console.log(err);
    });
});

app.post("/getJurtrans", admin, (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  // console.log(x)
  // if cabID = user kodeCab => msAC = M, msAC= S
  let msAC =
    x.tujuan === x.cab && x.ancab === "Y" ? "t.jurnalReff" : "t.nomorJurnal";
  // console.log(msAC)
  // console.log(x)
  dbuse
    .query(
      `SELECT d.iddetJur,d.kodeAkun, d.DK, d.nilai,d.desk,d.msAC,d.nomorJurnal,
      IF(d.msAC='S',j.cabLain,j.cabID) AS kodeCab,
      IF(d.DK='D',nilai,0) AS debit,if(d.DK='K',nilai,0) AS kredit,
      c.namaAkun, sb.namaSubAkun,
      DATE_FORMAT(j.tglJurnal,'%Y-%m-%d') AS tgl, j.judulJurnal
    FROM detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
      LEFT JOIN COA c ON d.kodeAkun=c.kodeAkun
      LEFT JOIN subAkun sb ON c.subAkun=sb.kodeSubAkun
      LEFT JOIN transaksi t ON j.nomorJurnal = ${msAC}
    WHERE t.nomorBukti=? AND j.status != 'B'
    ORDER BY d.msAC,d.DK`,
      [x.nomorBukti, x.nomorBukti]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(501).send({ st: "tidak ada..." });
    });
});

app.post("/detJur", admin, (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  // if cabID = user kodeCab => msAC = M, msAC= S
  let msAC = x.cabID == user.kodeCab ? "M" : "S";
  dbuse
    .query(
      `SELECT d.iddetJur,d.kodeAkun, d.DK, d.nilai,d.desk,d.msAC,d.nomorJurnal,
      IF(d.msAC='S',j.cabLain,j.cabID) AS kodeCab,
      IF(d.DK='D',nilai,0) AS debit,if(d.DK='K',nilai,0) AS kredit,
      c.namaAkun, sb.namaSubAkun, j.judulJurnal
    FROM detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
      LEFT JOIN COA c ON d.kodeAkun=c.kodeAkun
      LEFT JOIN subAkun sb ON c.subAkun=sb.kodeSubAkun
    WHERE d.nomorJurnal=?
    ORDER BY d.msAC,d.DK`,
      [x.nomorJurnal, msAC]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(501).send({ st: "tidak ada..." });
    });
});
app.get("/subAkun", async (req, res) => {
  dbuse
    .query(`SELECT s.* FROM subAkun s ORDER BY s.kodeSubAkun ASC`)
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(501).send({ st: "tidak ada..." });
    });
});

app.get("/midsubAkun", async (req, res) => {
  dbuse
    .query(`SELECT md.* FROM midSub md ORDER BY md.kodeGrup ASC`)
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(501).send({ st: "tidak ada..." });
    });
});

app.post("/cekCoa", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(
      `SELECT COUNT(subAkun) AS nom FROM COA
    WHERE kodeAkun LIKE '${x.subAkun}%'`,
      [x.subAkun]
    )
    .then((rows) => {
      let a = x.subAkun + String(parseInt(rows[0].nom) + 1).padStart(4, "0");
      res.send(a);
    })
    .catch((err) => {
      console.log(err);
      res.status(501).send({ st: "tidak ada..." });
    });
});

app.get("/jnsPembayaran", (req, res) => {
  dbuse
    .query("SELECT * FROM jnsPembayaran")
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(501).send({ st: "gagal simpan..." });
    });
});
app.post("/inCOA", man, (req, res) => {
  let { x } = req.body;
  dbuse
    .query(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO COA (kodeAkun,namaAkun,grupAkun,midSub,subAkun,jnsAkun,kasMasuk,KasKeluar,JU,ADJ,HP,KB,BP,allCab,kodeCab,JB, pembayaran)
      VALUES(:kodeAkun,:namaAkun,:grupAkun,:midSub,:subAkun,:jnsAkun,:kasMasuk,:kasKeluar,:JU,:ADJ,:HP,:KB,:BP,:allCab,:kodeCab, :JB, :pembayaran)
      ON DUPLICATE KEY UPDATE
      namaAkun=:namaAkun,grupAkun=:grupAkun,midSub=:midSub,subAkun=:subAkun,jnsAkun=:jnsAkun,
      kasMasuk=:kasMasuk,kasKeluar=:kasKeluar,JU=:JU,ADJ=:ADJ,HP=:HP,KB=:KB,BP=:BP,allCab=:allCab,kodeCab=:kodeCab, JB=:JB, pembayaran = :pembayaran`,
      },
      x
    )
    .then((rows) => {
      res.send({ st: "Tersimpan..." });
    })
    .catch((err) => {
      console.log(err);
      res.status(501).send({ st: "gagal simpan..." });
    });
});

app.get("/dtcoa", (req, res) => {
  let user = req.user.dtAkun;
  let akses = ["MAN", "acc", "purchase"].some((a) => a == user.userType)
    ? ``
    : `WHERE allCab='Y' OR kodeCab='${user.kodeCab}'`;
  dbuse
    .query(
      `SELECT c.*, JSON_QUERY(c.pembayaran, '$') AS pembayaran, s.namaSubAkun,s.jhp,s.arusKas,m.namaMidSub,g.namaGrupAkun,g.neraca,g.rugilaba
    FROM COA c
      LEFT JOIN subAkun s ON c.subAkun=s.kodeSubAkun
      LEFT JOIN midSub m ON s.midSub=m.kodeMidSub
      LEFT JOIN grupAkun g ON m.kodeGrup=g.kodeGrupAkun
      ${akses}
    ORDER BY c.kodeAkun ASC`
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(501).send({ st: "tidak ada..." });
    });
});

app.post("/editJurnal", admin, async (req, res) => {
  let { x } = req.body;
  try {
    let upd = await dbuse.batch(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO detJur(iddetJur,kodeAkun,DK,nilai,desk,nomorJurnal) VALUES (:iddetJur,:kodeAkun,:DK,:nilai,:desk,:nomorJurnal)
        ON DUPLICATE KEY UPDATE kodeAkun=:kodeAkun, DK=:DK,nilai=:nilai,desk=:desk, nomorJurnal=:nomorJurnal`,
      },
      x
    );
  } catch (err) {
    console.log(err);
    res.status(410).send({ st: "Belum tersimpan" });
  } finally {
    res.send({ st: "Tersimpan..." });
    dbuse
      .query(
        `INSERT INTO userLog (jnsLog,akun,nomorJurnal, deskripsi)
      VALUES ('EJ','${req.user.dtAkun.akun}','${x[0].nomorJurnal}','Edit detail Jurnal')`
      )
      .catch((err) => {
        console.log(err);
      });
  }
});

/* api inKas
url: api/inKas,
data: {
  x : {
    hd : {
      kodeCab: 'xx' => isi kode cabang,
      tgl: 'yyyy-mm-dd',
      uraian: '',
      noreff: '' => nomor referensi hutang atau piutang pokok
    },
    det: [
      { kodeAkun: akunKas, DK: 'D', nilai: nilaiKas },
      { kodeAkun: akunLawan, DK: 'K', nilai: nilaiKas }
    ]
  }
}
*/
app.get("/buktiAkunting?", (req, res) => {
  const x = req.query.key;
  const logo = path.join(__dirname, "buktiAkunting");
  if (fs.existsSync(`${logo}/${x}`)) {
    // res.download(`${logo}/${x.fileName}`)
    res.sendFile(`${x}`, {
      root: path.join(__dirname, "buktiAkunting"),
    });
  } else {
    res.status(410).send({ st: "Belum ada lampiran... " });
  }
});

app.post("/inKas", uploadAkunting.single("buktiAkunting"), async (req, res) => {
  let buktiAkunting = req.file
    ? req.file
    : { filename: null, originalname: null, mimetype: null };
  // console.log(req.file)
  let hd = req.body.x ? req.body.x.hd : JSON.parse(req.body.hd);
  let det = req.body.x ? req.body.x.det : JSON.parse(req.body.det);
  // let logBukti
  // let { hd, det } = req.body.x
  let user = req.user.dtAkun;
  let kodeCab = ["MAN", "acc", "purchase", "mitra"].some(
    (a) => a == user.userType
  )
    ? hd.kodeCab
    : [user.kodeCab];
  let noreff = hd.noreff ? hd.noreff : "";
  let logJurnal;
  try {
    let judul = hd.uraian;
    let jhp = hd.jhp || "";
    let status = jhp != "" ? "O" : "T";
    let urt = hd.tgl.replace(/-/gi, "");
    let cr = kodeCab + "99" + urt.slice(4, 6) + urt.slice(2, 4);
    let urut = await dbuse.query(
      `SELECT COUNT(nomorJurnal) AS nom FROM jurnal WHERE ISNULL(jn) AND nomorJurnal like '${cr}%'`,
      [cr]
    );
    let nojur = cr + String(parseInt(urut[0].nom) + 1).padStart(6, "0");
    await dbuse.query(
      `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,judulJurnal,noreff,status,salesID,jhp,kodePartner,oleh, buktiAkunting, mimetype, originalname)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?, ?)`,
      [
        kodeCab,
        nojur,
        hd.tgl,
        hd.jnsTrx,
        judul,
        noreff,
        status,
        hd.salesID,
        jhp,
        hd.kodePartner,
        user.eID,
        buktiAkunting.filename,
        buktiAkunting.mimetype,
        buktiAkunting.originalname,
      ]
    );
    // add detail jurnal penjualan, hpp per kategori produk
    logJurnal = nojur;
    let st = ["nomorJurnal", "kodeAkun", "DK", "nilai", "desk"];
    //  let val = await col.map(a => Object.values(a))
    let val = det.map((a) => {
      let u = [];
      for (let i in st) {
        a[st[i]] == undefined ? u.push(nojur) : u.push(a[st[i]]);
      }
      return u;
    });
    dbuse
      .batch(
        `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,desk) VALUES (?,?,?,?,?)`,
        val
      )
      .then((rows) => {
        res.send({ st: "tersimpan..." });
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    console.log(err);
    res.status(410).send({ st: "gagal simpan..." });
  } finally {
    dbuse
      .query(
        `INSERT INTO userLog (jnsLog, waktu,akun,nomorJurnal, deskripsi)
      VALUES ('${hd.jnsTrx}',NOW(),'${req.user.dtAkun.akun}','${logJurnal}','Input Kas')`
      )
      .catch((err) => {
        console.log(err);
      });
  }
});

app.post("/dtKasbon", (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  let kodeCab = ["MAN", "acc", "purchase", "mitra"].some(
    (a) => a == user.userType
  )
    ? hd.kodeCab
    : [user.kodeCab];
  dbuse
    .query(
      `SELECT d.iddetJur, d.nomorJurnal, d.DK, d.kodeAkun, d.nilai,COALESCE(byr.tbayar,0) AS tbayar,
      j.status,j.salesID,DATE_FORMAT(j.tglJurnal,'%Y-%m-%d') AS tglKasbon, d.desk,
      e.namaKaryawan
    FROM detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
      LEFT JOIN karyawan e ON j.salesID=e.kodeKar
      LEFT JOIN (
        SELECT SUM(d.nilai) AS tbayar,d.kodeAkun, t.noreff AS noref
        FROM detJur d
          LEFT JOIN jurnal t ON d.nomorJurnal=t.nomorJurnal
        WHERE t.status !='B'  AND t.noreff !='' AND t.jnsJurnal='RS' AND d.DK='K'
          GROUP BY t.noreff
      ) byr ON j.nomorJurnal=byr.noref
    WHERE j.cabID IN (?) AND j.jnsJurnal='KB' AND d.DK='D' AND (j.tglJurnal >= ? OR j.status='O')`,
      [kodeCab, x.tgl]
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/cekbyrKB", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(
      `SELECT d.nilai, d.nomorJurnal,d.desk, DATE_FORMAT(j.tglJurnal,'%Y-%m-%d') AS tgl,
      j.status,j.noreff, c.namaAkun
    FROM detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
      LEFT JOIN COA c ON d.kodeAkun= c.kodeAkun
    WHERE j.noreff=? AND d.kodeAkun=?`,
      [x.nomorJurnal, x.kodeAkun]
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Belum ada pembayaran..." });
    });
});

app.post("/injurnal", async (req, res) => {
  let { hd, det } = req.body.x;
  let user = req.user.dtAkun;
  let logJurnal;
  let kodeCab = ["MAN", "acc", "purchase", "mitra"].some(
    (a) => a == user.userType
  )
    ? hd.kodeCab
    : [user.kodeCab];
  let noreff = hd.noreff ? hd.noreff : "";
  try {
    let judul = hd.uraian;
    //    let cabLain = (hd.ac ==='Y' && hd.jnsTrx ==='J') ? hd.tujuan : (hd.ac ==='Y' && hd.jnsTrx ==='B') ? hd.asal : ''
    //    let jhp = (hd.ct ==='tempo' && hd.jnsTrx ==='B') ? 'H' : (hd.ct ==='tempo' && hd.jnsTrx ==='J') ? 'P' : 'L'

    let status = hd.status || "T",
      jnsTrx = "JU";
    let urt = hd.tgl.replace(/-/gi, "");
    let cr = kodeCab + "99" + urt.slice(4, 6) + urt.slice(2, 4);
    let urut = await dbuse.query(
      `SELECT COUNT(nomorJurnal) AS nom FROM jurnal WHERE ISNULL(jn) AND nomorJurnal like '${cr}%'`,
      [cr]
    );
    let nojur = cr + String(parseInt(urut[0].nom) + 1).padStart(6, "0");
    let nomerJurnal = await dbuse.query(
      `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,judulJurnal,noreff,status,oleh)
      VALUES (?,?,?,?,?,?,?,?)`,
      [kodeCab, nojur, hd.tgl, jnsTrx, judul, noreff, status, user.eID]
    );
    // add detail jurnal penjualan, hpp per kategori produk
    console.log(nomerJurnal);
    logJurnal = nojur;
    let st = ["nomorJurnal", "kodeAkun", "DK", "nilai", "desk"];
    //  let val = await col.map(a => Object.values(a))
    let val = det.map((a) => {
      let u = [];
      for (let i in st) {
        a[st[i]] == undefined ? u.push(nojur) : u.push(a[st[i]]);
      }
      return u;
    });
    dbuse
      .batch(
        `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,desk) VALUES (?,?,?,?,?)`,
        val
      )
      .then((rows) => {
        res.send({ st: "tersimpan..." });
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    console.log(err);
    res.status(410).send({ st: "gagal simpan..." });
  } finally {
    res.send({ st: "Tersimpan..." });
    dbuse
      .query(
        `INSERT INTO userLog (jnsLog, waktu,akun,nomorJurnal,deskripsi)
      VALUES ('JU',NOW(),'${req.user.dtAkun.akun}','${logJurnal}','Input Jurnal')`
      )
      .catch((err) => {
        console.log(err);
      });
  }
});

app.post("/addHP", async (req, res) => {
  let { hd, det, lw } = req.body.x;
  det.map((a) => {
    a.msAC = "M";
    return a;
  });
  // console.log(det)
  let user = req.user.dtAkun;
  let logJurnal;
  let kodeCab = ["MAN", "acc", "purchase"].some((a) => a == user.userType)
    ? hd.kodeCab
    : [user.kodeCab];
  let noreff = hd.noreff ? hd.noreff : "";
  try {
    let judul = hd.uraian;
    //    let cabLain = (hd.ac ==='Y' && hd.jnsTrx ==='J') ? hd.tujuan : (hd.ac ==='Y' && hd.jnsTrx ==='B') ? hd.asal : ''
    //    let jhp = (hd.ct ==='tempo' && hd.jnsTrx ==='B') ? 'H' : (hd.ct ==='tempo' && hd.jnsTrx ==='J') ? 'P' : 'L'

    let status = "O",
      jnsTrx = hd.jhp;
    let urt = hd.tgl.replace(/-/gi, "");
    let cr = kodeCab + "99" + urt.slice(4, 6) + urt.slice(2, 4);
    let urut = await dbuse.query(
      `SELECT COUNT(nomorJurnal) AS nom FROM jurnal WHERE ISNULL(jn) AND nomorJurnal like '${cr}%'`,
      [cr]
    );
    let nojur = cr + String(parseInt(urut[0].nom) + 1).padStart(6, "0");
    if (hd.ac === "Y") {
      let ok = await dbuse.query(
        `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,judulJurnal,noreff,status,jhp,tempo,oleh, cabLain, ac)
        VALUES (?,?,?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?,?,?)`,
        [
          kodeCab,
          nojur,
          hd.tgl,
          jnsTrx,
          judul,
          noreff,
          status,
          hd.jhp,
          hd.tgl,
          hd.tempo,
          user.eID,
          hd.cabLain,
          hd.ac,
        ]
      );
      let ss = [
        {
          kodeAkun: lw.kodeAkunD,
          DK: "D",
          nilai: det[0].nilai,
          desk: hd.uraian,
          msAC: "S",
        },
        {
          kodeAkun: lw.kodeAkun,
          DK: "K",
          nilai: det[0].nilai,
          desk: hd.uraian,
          msAC: "S",
        },
      ];
      det.push(...ss);
      console.log(ok);
      logJurnal = nojur;
      console.log(det);
      let st = ["nomorJurnal", "kodeAkun", "DK", "nilai", "desk", "msAC"];
      //  let val = await col.map(a => Object.values(a))
      let val = det.map((a) => {
        let u = [];
        for (let i in st) {
          a[st[i]] == undefined ? u.push(nojur) : u.push(a[st[i]]);
        }
        return u;
      });
      dbuse
        .batch(
          `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,desk,msAC) VALUES (?,?,?,?,?,?)`,
          val
        )
        .then((rows) => {
          res.send({ st: "tersimpan..." });
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      let nomerJurnal = await dbuse.query(
        `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,judulJurnal,noreff,status,jhp,kodePartner,tempo,oleh)
        VALUES (?,?,?,?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?)`,
        [
          kodeCab,
          nojur,
          hd.tgl,
          jnsTrx,
          judul,
          noreff,
          status,
          hd.jhp,
          hd.kodePartner,
          hd.tgl,
          hd.tempo,
          user.eID,
        ]
      );
      // add detail jurnal penjualan, hpp per kategori produk
      console.log(nomerJurnal);
      logJurnal = nojur;
      let st = ["nomorJurnal", "kodeAkun", "DK", "nilai", "desk", "msAC"];
      //  let val = await col.map(a => Object.values(a))
      let val = det.map((a) => {
        let u = [];
        for (let i in st) {
          a[st[i]] == undefined ? u.push(nojur) : u.push(a[st[i]]);
        }
        return u;
      });
      dbuse
        .batch(
          `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,desk, msAC) VALUES (?,?,?,?,?,?)`,
          val
        )
        .then((rows) => {
          res.send({ st: "tersimpan..." });
        })
        .catch((err) => {
          console.log(err);
        });
    }
  } catch (err) {
    res.status(410).send({ st: "gagal simpan..." });
  } finally {
    res.send({ st: "Tersimpan..." });
    dbuse
      .query(
        `INSERT INTO userLog (jnsLog, waktu,akun,nomorJurnal,deskripsi)
      VALUES ('HP',NOW(),'${req.user.dtAkun.akun}','${logJurnal}','Input H/P')`
      )
      .catch((err) => {
        console.log(err);
      });
  }
});
// masih di header
/* app.post('/cekbyr', (req, res) => {
  let { x } = req.body
  dbuse.query(`SELECT d.nilai, d.nomorJurnal,d.desk, DATE_FORMAT(j.tglJurnal,'%Y-%m-%d') AS tgl,j.status,
    j.judulJurnal, j.noreff, c.namaAkun
    FROM detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
      LEFT JOIN COA c ON d.kodeAkun= c.kodeAkun
    WHERE j.noreff=? AND d.kodeAkun=?`, [x.nomorJurnal, x.kodeAkun])
    .then(rows => {
      res.send(rows)
    })
    .catch(err => {
      console.log(err)
      res.status(410).send({ st: 'Belum ada pembayaran...' })
    })
}) */

app.post("/cekbyr", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(
      `SELECT d.nilai, d.nomorJurnal,d.desk, DATE_FORMAT(j.tglJurnal,'%Y-%m-%d') AS tgl,j.status,
    j.judulJurnal, d.nomorReff, c.namaAkun, k.namaKaryawan
    FROM detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
      LEFT JOIN COA c ON d.kodeAkun= c.kodeAkun
      LEFT JOIN karyawan k ON k.kodeKar = j.oleh
    WHERE d.nomorReff=? AND d.kodeAkun=? AND j.status!='B'`,
      [x.nomorJurnal, x.kodeAkun]
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Belum ada pembayaran..." });
    });
});

app.post("/cekbayarReff", (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  let jhp = x.jhp === "H" ? "P" : "H";
  let kodeCab = ["MAN", "acc", "purchase"].some((a) => a == user.userType)
    ? x.kodeCab
    : user.kodeCab;
  dbuse
    .query(
      `SELECT d.nilai, d.nomorJurnal,d.desk, DATE_FORMAT(j.tglJurnal,'%Y-%m-%d') AS tgl,j.status,
    j.judulJurnal, d.nomorReff, j.jhp, t.nomorJurnal AS pitPokok, t.jurnalReff AS hutPokok,
    t.nomorBukti, j.cabID AS cabLain, c.namaCabang
    FROM detJur d LEFT JOIN jurnal j ON d.nomorReff=j.nomorJurnal
      LEFT JOIN transaksi t ON j.nomorSuratJalan = t.nomorBukti
      LEFT JOIN cabang c ON c.kodeCab = j.cabID
    WHERE j.status!='B' AND j.cabLain = ? AND j.ancab = 'Y' AND j.jhp=? AND ISNULL(d.jurKop)`,
      [kodeCab, jhp]
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Belum ada pembayaran..." });
    });
});
// modul produksi

app.post("/inbom", async (req, res) => {
  let { hd, det } = req.body.x;
  try {
    let urut = await dbuse.query(`SELECT COUNT(kodeBOM) AS nom FROM BOM`);
    hd.kodeBOM = "BOM" + String(parseInt(urut[0].nom) + 1).padStart(6, "0");
    let jdl = await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO BOM SET kodeBOM=:kodeProduk,namaBOM=:namaBarang,kodeProduk=:kodeProduk`,
      },
      hd
    );
    let st = ["kodeBOM", "kodeBahan", "qty"];
    let val = det.map((a) => {
      let u = [];
      a.kodeBOM = hd.kodeProduk;
      for (let i in st) {
        u.push(a[st[i]]);
      }
      return u;
    });
    dbuse
      .batch(`INSERT INTO BomDet(kodeBOM,kodeBahan,qty) VALUES (?,?,?)`, val)
      .then((rows) => {
        res.send({ st: "tersimpan..." });
      });
  } catch (err) {
    console.log(err);
    res.status(410).send({ st: "Belum tersimpan..." });
  }
});

app.post("/deldetBom", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(`DELETE FROM BomDet WHERE BomDet_id=?`, [x.BomDet_id])
    .then((rows) => res.send({ st: "Tersimpan..." }))
    .catch((err) => {
      console.log(err);
      res.status(510).send({ st: "Tidak ditemukan..." });
    });
});

app.post("/updetBom", async (req, res) => {
  let { x } = req.body;
  try {
    let ok;
    if (x.BomDet_id) {
      ok = await dbuse.query(
        {
          namedPlaceholders: true,
          sql: `UPDATE BomDet SET kodeBOM=:kodeBOM,kodeBahan=:kodeBahan,qty=:qty WHERE BomDet_id=:BomDet_id`,
        },
        x
      );
    } else {
      ok = await dbuse.query(
        {
          namedPlaceholders: true,
          sql: `INSERT INTO BomDet (kodeBOM,kodeBahan,qty)
          VALUES(:kodeBOM,:kodeBahan,:qty)`,
        },
        x
      );
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ st: "gagal simpan..." });
  } finally {
    res.send({ st: "tersimpan..." });
  }
});

app.get("/databom", (req, res) => {
  let kodeCab = req.user.dtAkun.kodeCab;
  dbuse
    .query(
      `SELECT b.*,nb.namaBarang,nb.akunPersediaan,nb.akunHpp FROM BOM b
    LEFT JOIN namaBarang nb ON b.kodeProduk=nb.kodeProduk
    ORDER BY nb.namaBarang ASC`
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(510).send({ st: "Tidak ditemukan..." });
    });
});

app.get("/databoms?", (req, res) => {
  // let kodeCab = req.user.dtAkun.kodeCab
  let x = req.query.key;
  dbuse
    .query(
      `SELECT b.*,nb.namaBarang,nb.akunPersediaan,nb.akunHpp FROM BOM b
    LEFT JOIN namaBarang nb ON b.kodeProduk=nb.kodeProduk
    WHERE b.kodeProduk=?`,
      [x]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(510).send({ st: "Tidak ditemukan..." });
    });
});

app.post("/detBom", (req, res) => {
  let { x } = req.body;
  let kodeCab = x.kodeCab;
  dbuse
    .query(
      `SELECT d.*,nb.namaBarang AS bahan, s.${kodeCab} AS tersedia,nb.akunPersediaan,nb.akunHpp,
      h.${kodeCab} AS hpp
    FROM BomDet d LEFT JOIN namaBarang nb ON d.kodeBahan=nb.kodeProduk
      LEFT JOIN stock s ON s.kodeProduk=d.kodeBahan
      LEFT JOIN hpp h ON h.kodeProduk=d.kodeBahan
    WHERE d.kodeBOM=?`,
      [x.kodeBOM]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Tidak ditemukan..." });
    });
});

app.post("/rakit", async (req, res) => {
  let { pr, det } = req.body.x;
  console.log(pr);
  let logBukti;
  let logJurnal;
  let kodeCab = pr.kodeCab || req.user.dtAkun.kodeCab;
  pr.pic = req.user.dtAkun.eID;
  let tgl = new Date(pr.tgl);
  let bt =
    (tgl.getMonth() + 1).toString().padStart(2, "0") +
    tgl.getFullYear().toString().slice(-2);
  try {
    let cr = kodeCab + "RK" + bt;
    let nomJB = await dbuse.query(
      `SELECT COUNT(t.nomorBukti) AS nom FROM transaksi t WHERE ISNULL(t.jn) AND t.nomorBukti like '${cr}%'`,
      [cr]
    );
    pr.nomorBukti = cr + String(parseInt(nomJB[0].nom) + 1).padStart(6, "0");
    logBukti = pr.nomorBukti;
    let crj = kodeCab + "99" + bt;
    let nj = await dbuse.query(
      `SELECT COUNT(nomorJurnal) AS nom FROM jurnal WHERE ISNULL(jn) AND nomorJurnal like '${crj}%'`
    );
    pr.nomorJurnal = crj + String(parseInt(nj[0].nom) + 1).padStart(6, "0");
    logJurnal = pr.nomorJurnal;
    // supply
    let ok = await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO transaksi SET nomorBukti=:nomorBukti,tglKirim='${pr.tgl}',tglTerima='${pr.tgl}', cabID='${kodeCab}', asal='${kodeCab}', tujuan='Prod',
        jnsTrx='S', status='T',kodeBOM=:kodeBOM, nomorJurnal=:nomorJurnal, pic=:pic`,
      },
      pr
    );
    // hasil
    let hasil = await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO transaksi SET nomorBukti='${
          pr.nomorBukti + "h"
        }',tglKirim='${pr.tgl}',tglTerima='${
          pr.tgl
        }', cabID='${kodeCab}', tujuan='${kodeCab}', asal='Prod',
        jnsTrx='H', status='T', jn='h', kodeBOM=:kodeBOM, nomorJurnal=:nomorJurnal,supplyReff=:nomorBukti, pic=:pic`,
      },
      pr
    );
    // insert detail
    let st = ["kodeProduk", "qty", "jmlHarga", "dpp", "hpp", "nomorBukti"];
    let val = det.map((a) => {
      let u = [a.kodeBahan, a.tqty, a.thpp, a.thpp, a.thpp, pr.nomorBukti];
      return u;
    });
    val.push([
      pr.kodeProduk,
      pr.qty,
      pr.thpp,
      pr.thpp,
      pr.thpp,
      pr.nomorBukti + "h",
    ]);
    let detHasil = await dbuse.batch(
      `INSERT INTO detTrans (kodeProduk,qty,jmlHarga,dpp,hpp,nomorBukti)
      VALUES (?,?,?,?,?,?)`,
      val
    );

    // jurnal

    let jr =
      await dbuse.query(`INSERT INTO jurnal SET nomorJurnal='${pr.nomorJurnal}', tglJurnal='${pr.tgl}',cabID='${kodeCab}',jnsJurnal='RK',
      status='T',judulJurnal='Nomor Perakitan ${pr.nomorBukti}',nomorSuratJalan='${pr.nomorBukti}', oleh='${pr.pic}'`);
    let rkPersediaan = [...new Set(det.map((ss) => ss.akunPersediaan))];
    let detJur = [
      [
        pr.akunPersediaan,
        pr.thpp,
        "D",
        `Nomor Perakitan ${pr.nomorBukti}`,
        pr.nomorJurnal,
      ],
    ];
    rkPersediaan.forEach((a) => {
      let c = [
        a,
        det
          .filter((i) => i.akunPersediaan === a)
          .reduce((s, m) => jumlah([s, m.thpp]), 0),
        "K",
        `Nomor Perakitan ${pr.nomorBukti}`,
        pr.nomorJurnal,
      ];
      detJur.push(c);
    });
    let juRkt = await dbuse.batch(
      `INSERT INTO detJur (kodeAkun,nilai,DK,desk,nomorJurnal)
      VALUES (?,?,?,?,?)`,
      detJur
    );
    // update hpp produk jadi => blm
    let updthpp = await dbuse.query(
      `UPDATE hpp h LEFT JOIN stock s ON h.kodeProduk=s.kodeProduk
      SET h.${kodeCab}=((h.${kodeCab} * s.${kodeCab})+ ?)/(s.${kodeCab}+?) WHERE h.kodeProduk=?`,
      [pr.thpp, pr.qty, pr.kodeProduk]
    );
    // update stok bahan
    let u;
    for (let i in det) {
      u = await dbuse.query(
        `UPDATE stock SET ${kodeCab} = ${kodeCab}-? WHERE kodeProduk='${det[i].kodeBahan}'`,
        [det[i].tqty, det[i].tqty]
      );
    }
    let stP = await dbuse.query(
      `UPDATE stock SET ${kodeCab} = ${kodeCab}+? WHERE kodeProduk='${pr.kodeProduk}'`,
      [pr.qty, pr.qty]
    );
  } catch (err) {
    console.log(err);
    res.status(410).send({ st: "Belum tersimpan..." });
  } finally {
    res.send({ st: "Tersimpan..." });
    dbuse
      .query(
        `INSERT INTO userLog (jnsLog, waktu,akun,nomorBukti,nomorJurnal,deskripsi)
      VALUES ('RK',NOW(),'${req.user.dtAkun.akun}','${logBukti}','${logJurnal}','Input rakit produk')`
      )
      .catch((err) => {
        console.log(err);
      });
  }
});

app.post("/getRakit", (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  let kodeCab = ["MAN", "acc", "purchase"].some((a) => a == user.userType)
    ? x.kodeCab
    : [user.kodeCab];
  dbuse
    .query(
      `SELECT ds.*,nb.namaBarang,nb.akunPersediaan,nb.akunHpp,t.nomorJurnal,
      t.kodeBOM,DATE_FORMAT(t.tglTerima,'%Y-%m-%d') AS tgl, k.namaKaryawan
    FROM detTrans ds
    LEFT JOIN namaBarang nb ON ds.kodeProduk=nb.kodeProduk
    LEFT JOIN transaksi t ON t.nomorBukti=ds.nomorBukti
    LEFT JOIN karyawan k ON t.pic=k.kodeKar
    WHERE t.cabID IN (?) AND t.tujuan IN (?) AND asal='Prod' AND jnsTrx='H' AND t.status='T' AND t.tglTerima >= ?
    ORDER BY t.tglTerima DESC`,
      [kodeCab, kodeCab, x.tgl]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(510).send({ st: "waahh..." });
    });
});

// stokOpname

app.post("/createstokop", async (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  let kodeCab = ["MAN", "acc", "purchase"].some((a) => a === user.userType)
    ? x.kodeCab
    : user.kodeCab;
  let tgl = ["MAN", "acc", "purchase", "mitra"].some((a) => a === user.userType)
    ? x.tgl
    : new Date().toISOString().slice(0, 10);
  let ndasStok = {
    kodeCab: kodeCab,
    nomorStokOp: kodeCab + "SO" + tgl.slice(0, 10).replace(/-/gi, ""),
    tgl: tgl,
    status: "Open",
    oleh: user.akun,
  };
  console.log(ndasStok);
  try {
    let ndas = await dbuse.query(
      {
        dateStrings: true,
        namedPlaceholders: true,
        sql: `INSERT INTO stokOpname (kodeCab,nomorStokOp,tgl,status,oleh)
        VALUES (:kodeCab,:nomorStokOp,CONVERT(:tgl, datetime),:status,:oleh)`,
      },
      ndasStok
    );

    let dtstok = await dbuse.query({
      namedPlaceholders: true,
      sql: `SELECT dt.kodeProduk,
      SUM(
        CASE
        WHEN t.status = 'T' AND t.tujuan = '${kodeCab}' THEN +dt.qty
        WHEN t.asal = '${kodeCab}' THEN -dt.qty
        ELSE 0
        END
      ) AS saldo,
      IF(SUM(
          CASE
          WHEN t.status = 'T' AND t.tujuan = '${kodeCab}' THEN +dt.qty
          WHEN t.asal = '${kodeCab}' THEN -dt.qty
          ELSE 0
          END
        ) != 0, 
        SUM(
          CASE
          WHEN t.jnsTrx='RJ' AND t.tujuan='${kodeCab}' THEN dt.hpp
          WHEN t.tujuan='${kodeCab}' AND t.ongkir= 'Y' AND t.status = 'T' THEN dt.dpp + dt.ongkir
          WHEN t.tujuan='${kodeCab}' AND t.ongkir= 'N' AND t.status = 'T' THEN dt.dpp
          WHEN (t.ac!= 'Y' AND t.jnsTrx!='B') AND t.tujuan='${kodeCab}' AND t.status = 'T' THEN dt.hpp
          WHEN t.asal='${kodeCab}' THEN -dt.hpp
          ELSE 0
          END
        ) / SUM(
          CASE
          WHEN t.status = 'T' AND t.tujuan = '${kodeCab}' THEN +dt.qty
          WHEN t.asal = '${kodeCab}' THEN -dt.qty
          ELSE 0
          END
        ) ,0) AS hpp,
      SUM(
        CASE
        WHEN t.status = 'T' AND t.tujuan = '${kodeCab}' THEN +dt.qty
        WHEN t.asal = '${kodeCab}' THEN -dt.qty
        ELSE 0
        END
      ) AS cek
      FROM detTrans dt
      LEFT JOIN transaksi t ON dt.nomorBukti= t.nomorBukti
      LEFT JOIN namaBarang p ON p.kodeProduk=dt.kodeProduk
      WHERE (t.asal='${kodeCab}' OR t.tujuan = '${kodeCab}') AND t.status NOT IN ('W','B') AND t.tglKirim < DATE_ADD('${tgl}', INTERVAL 1 DAY) AND p.jasa != 'Y'
      GROUP BY dt.kodeProduk`,
    });
    delete dtstok.meta;
    let inStk = await dtstok.map((a) => {
      a.nomorStokOp = ndasStok.nomorStokOp;
      return a;
    });
    Promise.all([dtstok, inStk]).then(async (data) => {
      let indet = await dbuse.batch(
        {
          namedPlaceholders: true,
          sql: "INSERT INTO detStokOp (kodeProduk,saldo,hpp,cek, nomorStokOp) VALUES (:kodeProduk,:saldo,:hpp,:cek, :nomorStokOp)",
        },
        inStk
      );
    });
  } catch (err) {
    console.log(err);
    res.status(410).send({ st: "Gagal..." });
  } finally {
    res.send({ st: ndasStok.nomorStokOp });
  }
});
app.post("/liststokop", (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  let kodeCab = ["MAN", "acc", "purchase"].some((a) => a == user.userType)
    ? x.kodeCab
    : [user.kodeCab];
  dbuse
    .query(
      `SELECT *,DATE_FORMAT(tgl,'%Y-%m-%d %H:%i:%s') AS tgl
    FROM stokOpname WHERE kodeCab IN (?)`,
      [kodeCab]
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      res.status(410).send({ st: "Gagal..." });
      console.log(err);
    });
});

app.post("/stokop", async (req, res) => {
  let { x } = req.body;
  let st = ["detStokOp_id", "kodeProduk", "saldo", "cek", "selisih"];
  try {
    let dta = x; // await x.filter(a=>( a.saldo > 0 && a.cek> 0))
    let status = await dbuse.query(
      "SELECT status FROM stokOpname WHERE nomorStokOp=?",
      dta[0].nomorStokOp
    );
    if (status[0].status !== "Open") {
      res.send({ st: "Status sudah Approve, tidak bisa diupdate..." });
    } else {
      /* let dt = await dta.map(a=>{
          let u =[]
          for (let i in st){
            u.push(a[st[i]])
          }
          return u
        }) */
      let upd = await dbuse.query(
        {
          namedPlaceholders: true,
          sql: `INSERT INTO detStokOp (detStokOp_id,kodeProduk,saldo,cek,selisih,akunBiaya,biaya)
            VALUES (:detStokOp_id,:kodeProduk,:saldo,:cek,:selisih,:akunBiaya,:biaya)
          ON DUPLICATE KEY UPDATE saldo = :saldo, cek= :cek,
          selisih=:selisih, akunBiaya=:akunBiaya,biaya=:biaya`,
        },
        dta
      );
    }
  } catch (err) {
    console.log(err);
    res.status(410).send({ st: "Gagal..." });
  } finally {
    res.send({ st: "Sukses..." });
  }
});

app.post("/detstokop", async (req, res) => {
  let { x } = req.body;
  try {
    let dta = x; // await x.filter(a=>( a.saldo > 0 && a.cek> 0))
    let status = await dbuse.query(
      "SELECT status FROM stokOpname WHERE nomorStokOp=?",
      [x.nomorStokOp]
    );
    if (status[0].status !== "Open") {
      res.send({ st: "Status sudah Approve, tidak bisa diupdate..." });
    } else {
      let upd = await dbuse.query(
        {
          namedPlaceholders: true,
          sql: `INSERT INTO detStokOp (detStokOp_id,nomorStokOp,kodeProduk,saldo,cek,selisih,akunBiaya,keterangan)
            VALUES (:detStokOp_id,:nomorStokOp,:kodeProduk,:saldo,:cek,:selisih,:akunBiaya,:keterangan)
          ON DUPLICATE KEY UPDATE saldo = :saldo, cek= :cek,
          selisih=:selisih,akunBiaya=:akunBiaya,keterangan=:keterangan`,
        },
        dta
      );
    }
  } catch (err) {
    console.log(err);
    res.status(410).send({ st: "Gagal..." });
  } finally {
    res.send({ st: "Sukses..." });
  }
});

app.get("/getdetstokop?", (req, res) => {
  let x = req.query.key;
  console.log(req.query);
  dbuse
    .query(
      `SELECT ds.*,nb.namaBarang,nb.akunPersediaan,nb.akunHpp, nb.kodeCat,
      COALESCE(a.adjust,0) AS adjusted
    FROM detStokOp ds
    LEFT JOIN namaBarang nb ON ds.kodeProduk=nb.kodeProduk
    LEFT JOIN (
      SELECT SUM(d.qty) AS adjust, d.kodeProduk
        FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
        WHERE t.nomorStokOp=? AND t.status='T'
        GROUP BY d.kodeProduk
    ) a ON a.kodeProduk=ds.kodeProduk
    WHERE ds.nomorStokOp=?`,
      [x, x]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(510).send({ st: "waahh..." });
    });
});

app.post("/stokopup", mitra, (req, res) => {
  let { x } = req.body;
  dbuse
    .query("UPDATE stokOpname SET status=? WHERE nomorStokOp=?", [
      x.status,
      x.nomorStokOp,
    ])
    .then((rows) => res.send({ st: "Sukses..." }))
    .catch((err) => {
      res.status(410).send({ st: "Gagal..." });
      console.log(err);
    });
});

// hpp kepada biaya
app.post("/adjust", async (req, res) => {
  let { pr, det } = req.body.x;
  let user = req.user.dtAkun;
  let kodeCab = ["MAN", "acc", "purchase"].some((a) => a === user.userType)
    ? pr.kodeCab
    : user.kodeCab;
  let tgl = ["MAN", "acc", "purchase", "mitra"].some((a) => a === user.userType)
    ? new Date(pr.tgl)
    : new Date();
  pr.tglk = tgl;
  let DKa = pr.jenis === "Kurang" ? "D" : "K";
  let DKb = pr.jenis === "Kurang" ? "K" : "D";
  let bt =
    (tgl.getMonth() + 1).toString().padStart(2, "0") +
    tgl.getFullYear().toString().slice(-2);
  try {
    if (det.some((a) => !a.biaya)) {
      throw new Error("Cek Biaya");
    }
    let cr = kodeCab + "ADJ" + bt;
    let nomJB = await dbuse.query(
      `SELECT COUNT(t.nomorBukti) AS nom FROM transaksi t WHERE ISNULL(t.jn) AND t.nomorBukti like '${cr}%'`,
      [cr]
    );
    pr.nomorBukti = cr + String(parseInt(nomJB[0].nom) + 1).padStart(6, "0");
    let crj = kodeCab + "99" + bt;
    let nj = await dbuse.query(
      `SELECT COUNT(nomorJurnal) AS nom FROM jurnal WHERE ISNULL(jn) AND nomorJurnal like '${crj}%'`
    );
    pr.nomorJurnal = crj + String(parseInt(nj[0].nom) + 1).padStart(6, "0");
    if (pr.jenis === "Kurang") {
      // supply
      let ok = await dbuse.query(
        {
          namedPlaceholders: true,
          sql: `INSERT INTO transaksi SET nomorBukti=:nomorBukti,tglKirim=:tglk,tglTerima=:tglk, cabID='${kodeCab}',
          asal='${kodeCab}', tujuan='Prod',
          jnsTrx='ADJ', status='T',nomorStokOp=:nomorStokOp, nomorJurnal=:nomorJurnal`,
        },
        pr
      );
    } else {
      let ok = await dbuse.query(
        {
          namedPlaceholders: true,
          sql: `INSERT INTO transaksi SET nomorBukti=:nomorBukti,tglKirim=:tglk,tglTerima=:tglk, cabID='${kodeCab}',
          asal='prod', tujuan='${kodeCab}',
          jnsTrx='ADJ', status='T',nomorStokOp=:nomorStokOp, nomorJurnal=:nomorJurnal`,
        },
        pr
      );
    }
    // insert detail
    let st = [
      "kodeProduk",
      "qty",
      "jmlHarga",
      "dpp",
      "hpp",
      "nomorBukti",
      "keterangan",
    ];
    let val = det.map((a) => {
      let u = [
        a.kodeProduk,
        a.qty,
        a.biaya,
        a.biaya,
        a.biaya,
        pr.nomorBukti,
        a.keterangan,
      ];
      return u;
    });
    let detHasil = await dbuse.batch(
      `INSERT INTO detTrans (kodeProduk,qty,jmlHarga,dpp,hpp,nomorBukti,keterangan)
      VALUES (?,?,?,?,?,?,?)`,
      val
    );

    // jurnal
    let jr = await dbuse.query(
      `INSERT INTO jurnal SET nomorJurnal='${pr.nomorJurnal}', tglJurnal=?,cabID='${kodeCab}',jnsJurnal='ADJ',
      status='T',judulJurnal='Nomor Adjustment ${pr.nomorBukti}',nomorSuratJalan='${pr.nomorBukti}', oleh='${user.eID}'`,
      [tgl]
    );
    let rkPersediaan = [...new Set(det.map((ss) => ss.akunPersediaan))];
    let akunBiaya = [...new Set(det.map((ss) => ss.akunBiaya))];
    let detJur = [];
    akunBiaya.forEach((a) => {
      let d = det
        .filter((i) => i.akunBiaya === a)
        .reduce((s, m) => jumlah([s, m.biaya]), 0);
      let f = d;
      let g = DKa;
      if (d < 0) {
        f = -d;
        g = DKb;
      }
      let c = [a, f, g, `Nomor Adjustment ${pr.nomorBukti}`, pr.nomorJurnal];
      detJur.push(c);
    });
    rkPersediaan.forEach((a) => {
      let d = det
        .filter((i) => i.akunPersediaan === a)
        .reduce((s, m) => jumlah([s, m.biaya]), 0);
      let f = d;
      let g = DKb;
      if (d < 0) {
        f = -d;
        g = DKa;
      }
      let c = [a, f, g, `Nomor Adjustment ${pr.nomorBukti}`, pr.nomorJurnal];
      detJur.push(c);
    });
    let juRkt = await dbuse.batch(
      `INSERT INTO detJur (kodeAkun,nilai,DK,desk,nomorJurnal)
      VALUES (?,?,?,?,?)`,
      detJur
    );

    // update stok bahan
    let u, hp;
    if (pr.jenis === "Kurang") {
      for (let i in det) {
        u = await dbuse.query(
          `UPDATE stock SET ${kodeCab} = ${kodeCab}-? WHERE kodeProduk='${det[i].kodeProduk}'`,
          [det[i].qty, det[i].qty]
        );
      }
    } else {
      for (let i in det) {
        u = await dbuse.query(
          `UPDATE stock SET ${kodeCab} = ${kodeCab}+? WHERE kodeProduk='${det[i].kodeProduk}'`,
          [det[i].qty, det[i].qty]
        );
        // i.biaya
        // hpp = (hppAwal*(stokAwal-qty)+hppBaru)/stok
        hp = await dbuse.query(
          `UPDATE hpp h LEFT JOIN stock s ON h.kodeProduk=s.kodeProduk
        SET h.${kodeCab}=((h.${kodeCab} * (s.${kodeCab}-?))+ ?)/ IF(s.${kodeCab} != 0, s.${kodeCab},1) WHERE h.kodeProduk=?`,
          [det[i].qty, det[i].biaya, det[i].kodeProduk]
        );
      }
    }
  } catch (err) {
    console.log(err);
    res.status(410).send({ st: "Belum tersimpan..." });
  } finally {
    res.send({ st: "Tersimpan..." });
  }
});

app.post("/getListAdjs", (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  let kodeCab = ["MAN", "acc", "purchase"].some((a) => a == user.userType)
    ? x.kodeCab
    : [user.kodeCab];
  dbuse
    .query(
      `SELECT *,DATE_FORMAT(tglTerima,'%Y-%m-%d') AS tgl
    FROM transaksi WHERE cabID IN (?) AND jnsTrx='ADJ' ORDER BY tglTerima DESC`,
      [kodeCab]
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      res.status(410).send({ st: "Gagal..." });
      console.log(err);
    });
});

app.get("/getdetAdjust?", (req, res) => {
  let x = req.query.key;
  console.log(req.query);
  dbuse
    .query(
      `SELECT ds.*,nb.namaBarang,nb.akunPersediaan,nb.akunHpp
    FROM detTrans ds
    LEFT JOIN namaBarang nb ON ds.kodeProduk=nb.kodeProduk
    WHERE ds.nomorBukti=?`,
      [x, x]
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(510).send({ st: "waahh..." });
    });
});

// upload data produk

app.post("/draftProduk", man, async (req, res) => {
  let { x } = req.body;
  console.log(x);
  try {
    let valDet = await x.map((a) => {
      return Object.values(a);
    });
    let produk = await dbuse.batch(
      `INSERT INTO draftProduk (kodeCab,kodeProduk,sku,namaProduk,kodeMerk,deskripsi,kodeCat,compID,hargaGrosir,hargaRetail)
      VALUES (?,?,?,?,?,?,?,?,?,?)`,
      valDet
    );
    // let hpp = await dbuse.batch()
    res.send({ st: "Tersimpan.." });
  } catch (err) {
    console.log(err);
    res.status(410).send({ st: "gagal..." });
  }
});

app.post("/getDraftProduk", man, (req, res) => {
  dbuse
    .query(
      `SELECT d.*, IF(ISNULL(nb.kodeProduk),'Baru', 'Sudah Ada') AS cek FROM draftProduk d LEFT JOIN namaBarang nb ON nb.kodeProduk= d.kodeProduk`
    )
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "tidak tersedia..." });
    });
});

app.post("/delDraftProduk", man, (req, res) => {
  let { hd, det } = req.body.x;
  let sql =
    hd.all === "All"
      ? `DELETE FROM draftProduk`
      : `DELETE FROM draftProduk WHERE kodeProduk ='${det.kodeProduk}'`;
  dbuse
    .query(sql)
    .then((rows) => res.send({ st: "tersimpan..." }))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "tidak tersedia..." });
    });
});
app.post("/prosesDraftProduk", man, async (req, res) => {
  try {
    let dt =
      await dbuse.query(`INSERT INTO produk (kodeCab,kodeProduk,sku,namaProduk,kodeMerk,deskripsi,kodeCat,compID)
     SELECT kodeCab,kodeProduk,sku,namaProduk,kodeMerk,deskripsi,kodeCat,compID FROM draftProduk`);
    let hpp = await dbuse.query(
      "INSERT INTO hpp (kodeProduk) SELECT kodeProduk FROM draftProduk"
    );
    let stock = await dbuse.query(
      "INSERT INTO stock (kodeProduk) SELECT kodeProduk FROM draftProduk"
    );
    let grosir = await dbuse.query(
      "INSERT INTO hargaGrosir (kodeProduk) SELECT kodeProduk FROM draftProduk"
    );
    let retail = await dbuse.query(
      "INSERT INTO hargaRetail (kodeProduk) SELECT kodeProduk FROM draftProduk"
    );
    res.send({ st: "Tersimpan" });
  } catch (err) {
    console.log(err);
    res.status(410).send({ st: "gagal..." });
  }
});
// stokAwal

app.post("/saldoAwal", admin, (req, res) => {
  let { x } = req.body;
  dbuse
    .batch(
      `INSERT INTO stokAwal ( kodeProduk, qty, hpp, jmlHpp, tglStokAwal, kodeCab) VALUES (?,?,?,?,?,?)`,
      x.slice(1)
    )
    .then((rows) => {
      res.send({ st: "Tersimpan..." });
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Belum tersimpan..." });
    });
});

app.post("/draftSaldoAwal", (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  let kodeCab = ["MAN", "purchase", "acc"].some((a) => a === user.userType)
    ? x.kodeCab
    : user.kodeCab;
  console.log(x);
  dbuse
    .query(
      `SELECT s.*, nm.namaBarang, DATE_FORMAT(s.tglStokAwal, '%Y-%m-%d') AS tglStokAwal FROM stokAwal s
      LEFT JOIN namaBarang nm ON s.kodeProduk=nm.kodeProduk
    WHERE s.kodeCab = ?
    ORDER BY s.tglStokAwal ASC`,
      [kodeCab]
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Belum tersimpan..." });
    });
});

app.post("/delStokAwal", admin, (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  let kodeCab = ["MAN", "acc", "purchase"].some((a) => a === user.userType)
    ? x.kodeCab
    : user.kodeCab;
  let pilih =
    x.hps === "All"
      ? `tglStokAwal= '${x.tglStokAwal}'`
      : `idStokAwal = '${x.idStokAwal}'`;
  dbuse
    .query(`DELETE FROM stokAwal WHERE ${pilih} AND kodeCab = ? `, [kodeCab])
    .then((rows) => {
      res.send({ st: "Tersimpan..." });
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Belum tersimpan..." });
    });
});

app.post("/prosesStokAwal", admin, async (req, res) => {
  let user = req.user.dtAkun;
  let { x } = req.body;
  let nomorBukti;
  try {
    let urut = await dbuse.query(`SELECT COUNT(nomorBukti) AS urt FROM transaksi
      WHERE nomorBukti like '${x.kodeCab}STOKAWAL%'`);
    nomorBukti =
      `${x.kodeCab}STOKAWAL` + (urut[0].urt + 1).toString().padStart(3, "0");
    let hd = await dbuse.query(
      `INSERT INTO transaksi (cabID, nomorBukti,tglKirim, asal, tujuan, jnsTrx, status, salesID, ct, akunBayar, judulTransaksi)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        x.kodeCab,
        nomorBukti,
        x.tglStokAwal,
        "prod",
        x.kodeCab,
        "ADJ",
        "W",
        user.eID,
        "tempo",
        "230200001",
        `Saldo Awal ${x.tglStokAwal}`,
      ]
    );
    let det = await dbuse.query(
      `INSERT INTO detTrans (nomorBukti, kodeProduk, qty, jmlHarga, dpp, hpp)
      SELECT '${nomorBukti}', kodeProduk, qty, jmlHpp AS jmlHarga, jmlHpp AS dpp, jmlHpp AS hpp FROM stokAwal WHERE kodeCab=? AND tglStokAwal= ?`,
      [x.kodeCab, x.tglStokAwal]
    );
  } catch (err) {
    console.log(err);
    res.status(410).send({ st: "Belum terproses..." });
  } finally {
    let upd = await dbuse.query(
      `UPDATE stokAwal SET st='Proses' WHERE tglStokAwal =? `,
      [x.tglStokAwal]
    );
    res.send({
      st: `Transaksi di proses ke nomer bukti ${nomorBukti}, konfirm di menu Adjustment...`,
    });
  }
});

app.post("/uploadHPsa", admin, async (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  // console.log(x)
  try {
    let hd = x.map((a) => {
      let salesID = a.salesID || user.eID;
      let s = {
        tglJurnal: a.tglJurnal,
        cabID: a.kodeCab,
        jnsJurnal: "SA",
        jhp: a.jhp,
        nomorJurnal: a.nomorJurnal,
        kodePartner: a.kodePartner,
        salesID: a.kodeKaryawan,
        judulJurnal: a.judulJurnal,
        status: a.status,
        oleh: salesID,
      };
      return Object.values(s);
    });
    let detail = await x.map((a) => {
      let s = { ...a };
      s.kodeAkun = "230200001";
      s.jnsAkun = a.jnsAkun === "D" ? "K" : "D";
      return [a, s];
    });
    let inDet = [];
    detail.forEach((a) => {
      inDet.push(...a);
    });
    let valDet = await inDet.map((a) => {
      let s = {
        nomorJurnal: a.nomorJurnal,
        kodeAkun: a.kodeAkun,
        DK: a.jnsAkun,
        nilai: a.nilai,
        desk: a.judulJurnal,
      };
      return Object.values(s);
    });
    let jur = await dbuse.batch(
      `INSERT INTO jurnal (tglJurnal, cabID, jnsJurnal, jhp, nomorJurnal, kodePartner, salesID, judulJurnal, status, oleh)
      values (?,?,?,?,?,?,?,?,?,?)`,
      hd
    );
    let detJ = await dbuse.batch(
      `INSERT INTO detJur (nomorJurnal, kodeAkun, DK, nilai, desk)
      values (?,?,?,?,?)`,
      valDet
    );
  } catch (err) {
    console.log(err);
    res.status(410).send({ st: "Gagal upload..." });
  } finally {
    res.send({ st: "Tersimpan..." });
  }
});

app.post("/uploadJurnal", admin, async (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  // console.log(x)
  try {
    let hd = x.map((a) => {
      let s = {
        tglJurnal: a.tglJurnal,
        cabID: a.kodeCab,
        jnsJurnal: a.jnsJurnal,
        jhp: a.jhp,
        nomorJurnal: a.nomorJurnal,
        salesID: a.kodeKaryawan,
        judulJurnal: a.judulJurnal,
        status: a.status,
        oleh: user.eID,
      };
      return Object.values(s);
    });
    let detail = await x.map((a) => {
      let s = { ...a };
      s.kodeAkun = "230200001";
      s.jnsAkun = a.jnsAkun === "D" ? "K" : "D";
      return [a, s];
    });
    let inDet = [];
    detail.forEach((a) => {
      inDet.push(...a);
    });
    let valDet = await inDet.map((a) => {
      let s = {
        nomorJurnal: a.nomorJurnal,
        kodeAkun: a.kodeAkun,
        DK: a.jnsAkun,
        nilai: a.nilai,
        desk: a.judulJurnal,
      };
      return Object.values(s);
    });
    let jur = await dbuse.batch(
      `INSERT INTO jurnal (tglJurnal, cabID, jnsJurnal, jhp, nomorJurnal, kodePartner, salesID, judulJurnal, status, oleh)
      values (?,?,?,?,?,?,?,?,?,?)`,
      hd
    );
    let detJ = await dbuse.batch(
      `INSERT INTO detJur (nomorJurnal, kodeAkun, DK, nilai, desk)
      values (?,?,?,?,?)`,
      valDet
    );
  } catch (err) {
    console.log(err);
    res.status(410).send({ st: "Gagal upload..." });
  } finally {
    res.send({ st: "Tersimpan..." });
  }
});
// repair data

app.post("/repair", man, async (req, res) => {
  // repair stok , HPP, jurnal
  let kodeCab = req.body.x;
  try {
    // per cabang
    await dbuse.query(
      `UPDATE stock SET ${kodeCab}=0 ; UPDATE hpp SET ${kodeCab} = 0`
    );
    let dt = await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `SELECT b.kodeProduk,
          SUM(
            CASE
            WHEN t.status = 'T' AND t.tujuan = :kodeCab THEN +d.qty
            WHEN t.asal = :kodeCab THEN -d.qty
            ELSE 0
            END
          ) AS saldo,
          SUM(
            CASE
            WHEN t.jnsTrx='RJ' AND t.tujuan=:kodeCab THEN d.hpp
            WHEN t.tujuan=:kodeCab AND t.ongkir= 'Y' AND t.status = 'T' THEN d.dpp + d.ongkir
            WHEN t.tujuan=:kodeCab AND t.ongkir= 'N' AND t.status = 'T' THEN d.dpp
            WHEN (t.ac!= 'Y' AND t.jnsTrx!='B') AND t.tujuan=:kodeCab AND t.status = 'T' THEN d.hpp
            WHEN t.asal=:kodeCab THEN -d.hpp
            ELSE 0
            END
          ) AS saldoHpp,
          nb.kodeCat
        FROM detTrans d left join produk b on d.kodeProduk=b.kodeProduk left join transaksi t on d.nomorBukti=t.nomorBukti
            LEFT JOIN namaBarang nb ON nb.kodeProduk=d.kodeProduk
        WHERE (t.asal=:kodeCab or t.tujuan=:kodeCab) AND t.status NOT IN ('W','B') AND nb.jasa != 'Y'
        group by d.kodeProduk`,
      },
      { kodeCab: kodeCab }
    );
    // dt[0].delete('meta')
    let dta = dt.filter((w) => w !== "meta");
    for (let i in dta) {
      await dbuse.query(`UPDATE stock SET ${kodeCab}=? WHERE kodeProduk=?`, [
        dta[i].saldo,
        dta[i].kodeProduk,
      ]);
      if (dta[i].saldo !== 0) {
        await dbuse.query(
          `UPDATE hpp SET ${kodeCab}= ?/? WHERE kodeProduk=? AND ? != 0`,
          [dta[i].saldoHpp, dta[i].saldo, dta[i].kodeProduk, dta[i].saldo]
        );
      }
    }
  } catch (err) {
    console.log(err);
    res.status(501).send({ st: "Belum berhasil..." });
  } finally {
    res.send({ st: "Data stok dan hpp diperbaharui..." });
  }
  // repair HPP jurnal belum....
});

app.post("/repairHpp", async (req, res) => {
  let { x } = req.body;
  try {
    // update hpp detTransaksi
    await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `UPDATE detTrans SET hpp = :hpp WHERE nomorBukti= :nomorBukti AND kodeProduk= :kodeProduk`,
      },
      x
    );
    // update detJur akun persediaan, akunhpp
    let [y] = await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `SELECT SUM(d.hpp) AS jmlHpp, nb.kodeCat, nb.akunPersediaan, nb.akunHpp, t.nomorJurnal
        FROM detTrans d
          LEFT JOIN transaksi t ON t.nomorBukti = d.nomorbukti
          LEFT JOIN namaBarang nb ON nb.kodeProduk=d.kodeProduk
        WHERE d.nomorBukti = :nomorBukti AND nb.kodeCat = :kodeCat`,
      },
      x
    );
    // cek kode akun
    let [cek] = await dbuse.query(
      `SELECT * FROM detJur WHERE nomorJurnal = ? AND kodeAkun = ?`,
      [y.nomorJurnal, y.akunPersediaan]
    );
    if (cek) {
      await dbuse.query(
        {
          namedPlaceholders: true,
          sql: `UPDATE detJur dj SET dj.nilai = :jmlHpp WHERE dj.kodeAkun IN (:akunHpp, :akunPersediaan) AND dj.nomorJurnal = :nomorJurnal`,
        },
        y
      );
    } else {
      await dbuse.query(
        {
          namedPlaceholders: true,
          sql: `INSERT INTO detJur (nomorJurnal, DK, kodeAkun, nilai) VALUES 
          (:nomorJurnal, 'D', :akunHpp, :jmlHpp), (:nomorJurnal, 'K', :akunPersediaan, :jmlHpp)`,
        },
        y
      );
    }
    // update hpp stok
    await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `UPDATE hpp h LEFT JOIN (SELECT b.kodeProduk,
        SUM(
          CASE
          WHEN t.status = 'T' AND t.tujuan = :kodeCab THEN +d.qty
          WHEN t.asal = :kodeCab THEN -d.qty
          ELSE 0
          END
        ) AS saldo,
        SUM(
          CASE
          WHEN t.jnsTrx='RJ' AND t.tujuan=:kodeCab THEN d.hpp
          WHEN t.tujuan=:kodeCab AND t.ongkir= 'Y' AND t.status = 'T' THEN d.dpp + d.ongkir
          WHEN t.tujuan=:kodeCab AND t.ongkir= 'N' AND t.status = 'T' THEN d.dpp
          WHEN (t.ac!= 'Y' AND t.jnsTrx!='B') AND t.tujuan=:kodeCab AND t.status = 'T' THEN d.hpp
          WHEN t.asal=:kodeCab THEN -d.hpp
          ELSE 0
          END
        ) AS saldoHpp,
        nb.kodeCat
      FROM detTrans d left join produk b on d.kodeProduk=b.kodeProduk left join transaksi t on d.nomorBukti=t.nomorBukti
          LEFT JOIN namaBarang nb ON nb.kodeProduk=d.kodeProduk
      WHERE (t.asal=:kodeCab or t.tujuan=:kodeCab) AND t.status NOT IN ('W','B') AND nb.jasa != 'Y' AND d.kodeProduk = :kodeProduk
      group by d.kodeProduk
      ) s ON s.kodeProduk = h.kodeProduk SET h.${x.kodeCab} = s.saldoHpp / IF(s.saldo > 0, s.saldo, 1) WHERE h.kodeProduk= :kodeProduk`,
      },
      x
    );
    res.send({ st: "HPP berhasil diupdate..." });
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  }
});

app.post("/perbaiki", mitra, async (req, res) => {
  let x = req.body.x;
  let cekJur =
    x.ancab === "Y" && x.status === "D" ? x.jurnalReff : x.nomorJurnal;
  try {
    let [cek] = await dbuse.query(
      `SELECT d.nomorJurnal, SUM(d.nilai) AS bayar FROM detJur d
      LEFT JOIN jurnal j ON j.nomorJurnal=d.nomorJurnal
      WHERE d.nomorReff =? AND j.status != 'B'`,
      [cekJur]
    );
    //  let [cekJur] = await dbuse.query(`SELECT nomorJurnal FROM jurnal WHERE nomorJurnal = ?`, [x.nomorJurnal])
    if (cek.bayar > 0 && cekJur.length) {
      console.log(cek);
      res
        .status(410)
        .send({ st: `Sudah ada pembayaran ${cek.bayar.toLocaleString()}` });
    } else {
      // update status
      let stat = await dbuse.query(
        "UPDATE transaksi SET status=? WHERE nomorBukti=?",
        [x.status, x.nomorBukti]
      );
      // batalkan jurnal => status D batalkan pembelian cabang tujuan, status W batalkan jual beli
      let nojur = x.status === "W" ? x.nomorJurnal : x.jurnalReff;
      let bj = await dbuse.query(
        `UPDATE jurnal SET status = 'B' WHERE nomorJurnal = ?`,
        [nojur]
      );
      let bjExpedisi = await dbuse.query(
        `UPDATE jurnal SET status = 'B' WHERE nomorJurnal = ?`,
        [nojur + "e"]
      );
      let [hd] = await dbuse.query(
        `SELECT t.*, DATE_FORMAT(t.tglKirim,'%Y-%m-%d') AS tglKirim, p.namaPartner
        FROM transaksi t
          LEFT JOIN partner p ON t.kodePartner=p.kodePartner
        WHERE nomorBukti=?`,
        [x.nomorBukti]
      );
      let det = await dbuse.query(
        `SELECT d.*,p.kodeCat, c.jasa FROM detTrans d
          LEFT JOIN produk p ON d.kodeProduk=p.kodeProduk
          LEFT JOIN produkCat c ON p.kodeCat=c.kodeCat WHERE d.nomorBukti = ?`,
        [x.nomorBukti]
      );
      let [exp] = await dbuse.query(
        "SELECT * FROM expedisi WHERE nomorBukti=?",
        [x.nomorBukti]
      );
      let [pot] = await dbuse.query(
        "SELECT * FROM potonganHarga WHERE nomorBukti=?",
        [x.nomorBukti]
      );
      if (["W", "D"].some((a) => a === x.status)) {
        Promise.all([hd, det, exp, pot])
          .then(async (data) => {
            delete det.meta;
            // kembalikan saldo
            // W => kembalikan saldo jb
            if (x.status !== "B") {
              let cabLain =
                (hd.ac === "Y" && (hd.jnsTrx === "J" || hd.jnsTrx === "RB")) ||
                hd.ancab === "Y"
                  ? hd.tujuan
                  : hd.ac === "Y" && (hd.jnsTrx === "B" || hd.jnsTrx === "RJ")
                  ? hd.asal
                  : "";
              let ss;
              for (let i in det) {
                if (det[i].jasa === "Y") {
                  continue;
                }
                //   continue
                // antar cabang => update stock asal dan tujuan,  partner => update asal atau tujuan saja
                let uphap;
                let ts =
                  hd.ongkir === "Y"
                    ? jumlah([det[i].dpp, det[i].ongkir])
                    : det[i].dpp;

                // update hpp barang di hd.tujuan / pembeli
                switch (hd.jnsTrx) {
                  case "B":
                  case "ADJ":
                    // hpp = (hppAwal*(stokAwal-qty)+hppBaru)/stok
                    ss = await dbuse.query(
                      `UPDATE stock SET ${hd.tujuan} = ${hd.tujuan}-? WHERE kodeProduk='${det[i].kodeProduk}'`,
                      [det[i].qty, det[i].qty]
                    );
                    uphap = await dbuse.query(
                      `UPDATE hpp h LEFT JOIN stock s ON h.kodeProduk=s.kodeProduk
                      SET h.${hd.cabID}=IF(s.${hd.cabID} = 0, 0, ((h.${hd.cabID} * (s.${hd.cabID}+?))- ?)/ IF(s.${hd.cabID} != 0, s.${hd.cabID}, 1)) WHERE h.kodeProduk=?`,
                      [det[i].qty, ts, det[i].kodeProduk]
                    );
                    break;
                  case "RB":
                    ss = await dbuse.query(
                      `UPDATE stock SET ${hd.asal} = ${hd.asal}+? WHERE kodeProduk='${det[i].kodeProduk}'`,
                      [det[i].qty, det[i].qty]
                    );
                    uphap = await dbuse.query(
                      `UPDATE hpp h LEFT JOIN stock s ON h.kodeProduk=s.kodeProduk
                      SET h.${hd.cabID}= IF(s.${hd.cabID} = 0, 0, (h.${hd.cabID}*(s.${hd.cabID} - ?) + ?)/IF(s.${hd.cabID} !=0, s.${hd.cabID}, 1)) WHERE h.kodeProduk=?`,
                      [det[i].qty, det[i].hpp, det[i].kodeProduk]
                    );
                    break;
                  case "J":
                    // cabLain = cabang pembeli
                    console.log(
                      "iki dpp+ongkir JB ac " + ts,
                      cabLain,
                      det[i].qty
                    );
                    if (x.status === "D") {
                      ss = await dbuse.query(
                        `UPDATE stock SET ${hd.tujuan} = ${hd.tujuan}-? WHERE kodeProduk='${det[i].kodeProduk}'`,
                        [det[i].qty, det[i].qty]
                      );
                      uphap = await dbuse.query(
                        `UPDATE hpp h LEFT JOIN stock s ON h.kodeProduk=s.kodeProduk
                        SET h.${cabLain}=IF(s.${cabLain} = 0, 0, ((h.${cabLain} * (s.${cabLain}+?))- ?)/ IF(s.${cabLain} != 0, s.${cabLain}, 1)) WHERE h.kodeProduk=?`,
                        [det[i].qty, ts, det[i].kodeProduk]
                      );
                    } else {
                      uphap = await dbuse.query(
                        `UPDATE hpp h LEFT JOIN stock s ON h.kodeProduk=s.kodeProduk
                        SET h.${hd.cabID}=IF((s.${hd.cabID} + ?) = 0, 0, ((h.${hd.cabID} * (s.${hd.cabID}))+ ?)/(s.${hd.cabID} + ?)) WHERE h.kodeProduk=?`,
                        [det[i].qty, det[i].hpp, det[i].qty, det[i].kodeProduk]
                      );
                      ss = await dbuse.query(
                        `UPDATE stock SET ${hd.asal} = ${hd.asal}+? WHERE kodeProduk='${det[i].kodeProduk}'`,
                        [det[i].qty, det[i].qty]
                      );
                    }
                    break;
                  default:
                }
              }
            }
            res.send({ st: "tersimpan..." });
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        res.send({ st: "transaksi dibatalkan..." });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(501).send({ st: "Cek ulang..." });
  } finally {
    let ss = await dbuse.query(
      `INSERT INTO userLog (jnsLog, akun, nomorBukti, deskripsi) VALUES ('Revisi',?,?,?)`,
      [req.user.dtAkun.akun, x.nomorBukti, `status ${x.status}`]
    );
  }
});

app.post("/cekPoint", (req, res) => {
  let { x } = req.body;
  let telpPIC = x.telpPIC.replace(/-| |\+/gi);
  let tp = telpPIC.replace(/^(\+628|628|08|8|6208)/, "8");
  dbuse
    .query(
      `SELECT SUM(IF(j.status = 'L' OR j.status = 'T',d.jmlPoint, 0)) AS totalPoint, COALESCE(k.klaimPoint, 0) AS klaimPoint,
  (SUM(IF(j.status = 'L' OR j.status = 'T',d.jmlPoint, 0))-COALESCE(k.klaimPoint,0) - COALESCE(k.klaimPointW,0)) AS sisaPoint,
  SUM(IF(j.status NOT IN ('T', 'L'),d.jmlPoint, 0)) AS tunggu,
  COALESCE(k.klaimPointW,0) AS klaimPointW, p.namaPartner, t.kodePartner, cb.namaCabang, cb.kodeCab
    FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
      LEFT JOIN partner p ON t.kodePartner = p.kodePartner
      LEFT JOIN cabang cb ON cb.kodeCab = t.cabID
      LEFT JOIN jurnal j ON j.nomorJurnal=t.nomorJurnal
      LEFT JOIN (
        SELECT SUM(IF(k.status = 'T', k.pointKlaim, 0)) AS klaimPoint, SUM(IF(k.status = 'W', k.pointKlaim, 0)) AS klaimPointW , k.kodePartner
          FROM klaimPoint k
          LEFT JOIN partner p ON k.kodePartner = p.kodePartner
          WHERE k.status != 'B' AND REGEXP_REPLACE(p.telpPIC, '[- +]', '') LIKE '%${tp}%'
          GROUP BY k.kodePartner
      ) k ON k.kodePartner = t.kodePartner
    WHERE t.status = 'T' AND t.jnsTrx = 'J' AND REGEXP_REPLACE(p.telpPIC, '[- +]', '') LIKE '%${tp}%'
    GROUP BY t.kodePartner, t.cabID`,
      [x.telpPIC, x.telpPIC]
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/cekHisPoint", async (req, res) => {
  let { x } = req.body;
  x.tahun = x.tahun || new Date().getFullYear();
  try {
    let a = await dbuse.query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT SUM(d.jmlPoint) AS pointMasuk, p.namaPartner, t.kodePartner,
        t.nomorJurnal, t.tglKirim AS tglKlaim, t.nomorBukti, c.namaCabang, c.kodeCab
        FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
          LEFT JOIN partner p ON t.kodePartner = p.kodePartner
          LEFT JOIN cabang c ON t.asal = c.kodeCab
        WHERE t.status = 'T' AND t.jnsTrx = 'J' AND t.kodePartner =  :kodePartner AND YEAR(t.tglKirim) = :tahun
        GROUP BY t.nomorBukti
        HAVING pointMasuk > 0`,
      },
      x
    );
    let b = await dbuse.query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT k.*, k.nomorKlaim AS nomorBukti
          FROM klaimPoint k
          WHERE k.status != 'B' AND k.kodePartner = :kodePartner AND YEAR(k.tglKlaim) = :tahun
          ORDER BY k.tglKlaim ASC`,
      },
      x
    );
    res.send([...a, ...b]);
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum ada point..." });
  }
});

app.post("/dataKlaimPoint", (req, res) => {
  let { x } = req.body;
  x.tahun = x.tahun || new Date().getFullYear();
  dbuse
    .query(
      {
        dateStrings: true,
        namedPlaceholders: true,
        sql: `SELECT k.*, p.namaPartner, p.telpPIC, c.namaCabang FROM klaimPoint k
    LEFT JOIN partner p ON p.kodePartner = k.kodePartner
    LEFT JOIN cabang c ON k.kodeCab = c.kodeCab
    WHERE YEAR(k.tglKlaim) = :tahun
    ORDER BY k.tglKlaim DESC`,
      },
      x
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/addKlaim", admin, async (req, res) => {
  let { x } = req.body;
  let tgl = x.tglKlaim.split("-");
  let no = `CLAIM${tgl[1]}${tgl[0].slice(2)}`;
  try {
    let [urut] = await dbuse.query(
      `SELECT COUNT(nomorKlaim) AS nom FROM klaimPoint WHERE nomorKlaim like '${no}%'`
    );
    console.log(urut);
    x.nomorKlaim = (await no) + (urut.nom + 1).toString().padStart(6, "0");
    console.log(x.nomorKlaim);
    dbuse
      .query(
        {
          namedPlaceholders: true,
          sql: `INSERT INTO klaimPoint (nomorKlaim, tglKlaim, kodePartner, pointKlaim, keterangan, kodeCab, caraKlaim)
        VALUES (:nomorKlaim, :tglKlaim, :kodePartner, :pointKlaim, :keterangan, :kodeCab, :caraKlaim)
        ON DUPLICATE KEY UPDATE status= :status, pointKlaim=:pointKlaim, kodeCab=:kodeCab, akunKlaim=:akunKlaim`,
        },
        x
      )
      .then((rows) => {
        res.send({ st: "Selesai" });
      })
      .catch((err) => {
        console.log(err);
        res.status(410).send({ st: "gagal..." });
      });
  } catch (err) {
    console.log(err);
    res.status(410).send({ st: "gagal..." });
  } finally {
    if (x.caraKlaim === "transaksi") {
      dbuse
        .query("UPDATE transaksi SET nomorKlaim = ? WHERE nomorBukti =? ", [
          x.nomorKlaim,
          x.nomorBukti,
        ])
        .catch((err) => {
          console.log(err);
          // res.status(410).send({ st: 'gagal...' })
        });
    }
  }
});

app.post("/klaimPoint", admin, async (req, res) => {
  let { x } = req.body;
  let tgl = x.tglKlaim.split("-");
  let cr = `${x.kodeCab}${tgl[1]}${tgl[0].slice(2)}`;
  x.jnsTrx = "KL";
  let user = req.user.dtAkun;
  let logJurnal;
  try {
    let [urut] = await dbuse.query(
      `SELECT COUNT(nomorJurnal) AS nom FROM jurnal WHERE ISNULL(jn) AND nomorJurnal like '${cr}%'`,
      [cr]
    );
    let nojur = cr + String(parseInt(urut.nom) + 1).padStart(6, "0");
    let nomerJurnal = await dbuse.query(
      `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,judulJurnal,status,oleh)
      VALUES (?,?,?,?,?,?,?)`,
      [x.kodeCab, nojur, x.tgl, x.jnsTrx, x.uraian, "T", user.eID]
    );
    // add detail jurnal penjualan, hpp per kategori produk
    logJurnal = nojur;
    let st = ["nomorJurnal", "kodeAkun", "DK", "nilai", "desk"];
    //  let val = await col.map(a => Object.values(a))
    let val = [
      [nojur, x.kodeAkunD, "D", x.pointKlaim, x.desk],
      [nojur, x.kodeAkun, "K", x.pointKlaim, x.desk],
    ];
    dbuse
      .batch(
        `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,desk) VALUES (?,?,?,?,?)`,
        val
      )
      .then((rows) => {
        res.send({ st: "tersimpan..." });
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    console.log(err);
    res.status(410).send({ st: "gagal simpan..." });
  } finally {
    res.send({ st: "Tersimpan..." });
    dbuse
      .query(
        `INSERT INTO userLog (jnsLog, waktu,akun,nomorJurnal,deskripsi)
      VALUES ('KL',NOW(),'${req.user.dtAkun.akun}','${logJurnal}','Klaim Point');
      UPDATE klaimPoint SET nomorJurnal = '${logJurnal}', status = 'T' WHERE nomorKlaim = '${x.nomorKlaim}'`
      )
      .catch((err) => {
        console.log(err);
      });
  }
});
app.post("/addTutupKlaim", admin, async (req, res) => {
  let { x } = req.body;
  let tgl = x.tglKlaim.split("-");
  let no = `CLAIMRESET${tgl[0]}`;
  try {
    let [urut] = await dbuse.query(
      `SELECT COUNT(nomorKlaim) AS nom FROM klaimPoint WHERE nomorKlaim like '${no}%'`
    );
    let dta = x.dataPoint.map((a, i) => {
      a.nomorKlaim = no + (urut.nom + 1 + i).toString().padStart(6, "0");
      a.status = "T";
      return a;
    });
    await dbuse.batch(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO klaimPoint (nomorKlaim, tglKlaim, kodePartner, pointKlaim, keterangan, kodeCab, caraKlaim, nomorJurnal, status)
        VALUES (:nomorKlaim, '${x.tglKlaim}', :kodePartner, :sisaPoint + :tunggu, :keterangan, :kodeCab, 'Cabang', :nomorKlaim, 'T')`,
      },
      dta
    );
    await dbuse.batch(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,judulJurnal,status,oleh)
      VALUES (:kodeCab, :nomorKlaim, '${x.tglKlaim}', 'KL', 'Reset Point', 'T', '${req.user.dtAkun.eID}')`,
      },
      dta
    );
    // add detail jurnal penjualan, hpp per kategori produk
    let st = ["nomorJurnal", "kodeAkun", "DK", "nilai", "desk"];
    //  let val = await col.map(a => Object.values(a))
    let val = dta.map((a, i) => {
      return [
        [
          a.nomorKlaim,
          "210500003",
          "D",
          Number(a.sisaPoint) + Number(a.tunggu),
          "Reset Point",
        ],
        [
          a.nomorKlaim,
          "310100021",
          "K",
          Number(a.sisaPoint) + Number(a.tunggu),
          "Reset Point",
        ],
      ];
    });
    let valu = val.flat();
    await dbuse.batch(
      `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,desk) VALUES (?,?,?,?,?)`,
      valu
    );
  } catch (err) {
    console.log(err);
    res.status(410).send({ st: "gagal..." });
  } finally {
    res.send({ st: "Tersimpan..." });
  }
});

app.post("/dataPoint", async (req, res) => {
  let { x } = req.body;
  x.tahun = x.tahun || new Date().getFullYear();
  try {
    let data = await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `SELECT SUM(IF (j.status IN('L','T'),d.jmlPoint, 0)) AS totalPoint, COALESCE(k.klaimPoint, 0) AS klaimPoint,
    (SUM(IF(j.status IN('L','T'),d.jmlPoint, 0))-COALESCE(k.klaimPoint,0) - COALESCE(k.klaimPointW,0)) AS sisaPoint,
    SUM(IF(j.status IN ('O', 'W'),d.jmlPoint, 0)) AS tunggu, j.status,
      p.namaPartner, p.telpPIC, p.namaPIC, t.kodePartner, COALESCE(k.klaimPointW, 0) AS klaimPointW, cb.kodeCab, cb.namaCabang
    FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
      LEFT JOIN cabang cb ON cb.kodeCab = t.cabID
      LEFT JOIN partner p ON t.kodePartner = p.kodePartner
      LEFT JOIN jurnal j ON j.nomorJurnal=t.nomorJurnal
      LEFT JOIN (
        SELECT SUM(IF(k.status = 'T', k.pointKlaim, 0)) AS klaimPoint, SUM(IF(k.status = 'W', k.pointKlaim, 0)) AS klaimPointW, k.kodePartner
          FROM klaimPoint k
          WHERE k.status != 'B' AND YEAR(k.tglKlaim) = :tahun
          GROUP BY k.kodePartner
      ) k ON k.kodePartner = t.kodePartner
    WHERE t.status = 'T' AND t.jnsTrx = 'J' AND t.ac='N' AND d.jmlPoint > 0
        AND YEAR(t.tglKirim) = :tahun
    GROUP BY t.kodePartner, t.cabID
      HAVING totalPoint > 0 OR tunggu > 0`,
      },
      x
    );
    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "gagal memuat..." });
  }
});

app.post("/hpsPoint", async (req, res) => {
  let { x } = req.body;
  try {
    let hpsTrx = await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `UPDATE detTrans SET jmlPoint = 0 WHERE nomorBukti= :nomorBukti`,
      },
      x
    );
    let hpsJu = await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `DELETE FROM detJur WHERE nomorJurnal = :nomorJurnal AND kodeAkun IN ('510100007', '210500003')`,
      },
      x
    );
    res.send({ st: "Point terhapus..." });
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  }
});

app.post("/upPoint", async (req, res) => {
  let { x } = req.body;
  try {
    dbuse
      .query(
        {
          namedPlaceholders: true,
          sql: `UPDATE klaimPoint SET status = :status WHERE nomorKlaim =:nomorKlaim`,
        },
        x
      )
      .then((rows) => res.send({ st: "Tersimpan..." }));
  } catch (error) {
    console.log(err);
    res.status(410).send({ st: "Belum tersimpan..." });
  } finally {
    dbuse
      .query(
        {
          namedPlaceholders: true,
          sql: `INSERT INTO userLog (nomorBukti, jnsLog, akun, deskripsi)
      VALUE (:nomorKlaim, 'Klaim','${req.user.dtAkun.akun}',:uraian)`,
        },
        x
      )
      .catch((err) => {
        console.log(err);
        // res.status(410).send({ st: 'gagal...' })
      });
  }
});
// repair point
app.post("/repairPoint", async (req, res) => {
  let { x } = req.body;
  try {
    // update detTrans
    await dbuse.batch(
      {
        namedPlaceholders: true,
        sql: `UPDATE detTrans SET jmlPoint = :jmlPoint WHERE kodeProduk= :kodeProduk AND nomorBukti = :nomorBukti`,
      },
      x.det
    );
    // cek jurnal ada
    if (x.hd.status === "T") {
      let [a] = await dbuse.query(
        {
          namedPlaceholders: true,
          sql: `SELECT kodeAkun FROM detJur WHERE nomorJurnal = :nomorJurnal AND kodeAkun IN ('510100007', '210500003')`,
        },
        x.hd
      );
      x.hd.totalPoint = x.det.reduce((s, t) => s + t.jmlPoint, 0);
      if (a) {
        await dbuse.query(
          {
            namedPlaceholders: true,
            sql: `UPDATE detJur SET nilai = :totalPoint WHERE kodeAkun IN ('510100007', '210500003') AND nomorJurnal = :nomorJurnal`,
          },
          x.hd
        );
      } else {
        await dbuse.query(
          {
            namedPlaceholders: true,
            sql: `INSERT INTO detJur (nomorJurnal, kodeAkun, nilai, DK, desk)
          VALUES (:nomorJurnal, '510100007',:totalPoint, 'D', 'Point Membership'), (:nomorJurnal, '210500003',:totalPoint, 'K', 'Point Membership')`,
          },
          x.hd
        );
      }
    }
    res.send({ st: "Tersimpan..." });
    // belum ada
    // sudah ada
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  }
});

app.post("/hisTrxPelanggan", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT SUM(d.dpp + d.ppn - COALESCE(rtr.hrgRetur,0)) AS totalHarga, SUM(d.jmlPoint) AS totalPoint,
      cb.kodeCab,
      cb.namaCabang, p.namaPartner,
      COALESCE(p.telpPIC, NULL) AS telpPIC,
      (SUM(d.dpp + d.ppn + (IF(t.ongkir = 'Y', d.ongkir, 0))) - COALESCE(pot.diskon,0) - COALESCE(rtr.hrgRetur,0)) AS totalAkhir,
      COALESCE(rtr.qty, 0) AS jmlRetur, COALESCE(rtr.hrgRetur,0) AS hrgRetur,
      IF(t.status IN ('W','D'), 'A', 'T') AS urt,
      t.tglKirim, t.status, t.nomorBukti, IF(j.status = 'T' OR j.status = 'L', 'Disetujui', 'Tunggu') AS stPoint
    FROM detTrans d LEFT JOIN transaksi t ON d.nomorBukti=t.nomorBukti
    LEFT JOIN cabang cb ON t.cabID=cb.kodeCab
    LEFT JOIN partner p ON t.kodePartner=p.kodePartner
    LEFT JOIN potonganHarga pot ON t.nomorBukti=pot.nomorBukti
    LEFT JOIN (
      SELECT d.kodeProduk, SUM(d.qty) AS qty, SUM(d.jmlHarga) AS hrgRetur, t.noreffRetur FROM detTrans d
        LEFT JOIN transaksi t ON t.nomorBukti= d.nomorBukti
      WHERE t.status='T' and t.noreffRetur != ''
      GROUP BY d.kodeProduk, t.noreffRetur
    ) rtr ON rtr.kodeProduk = d.kodeProduk AND rtr.noreffRetur=d.nomorBukti
    LEFT JOIN jurnal j ON t.nomorJurnal=j.nomorJurnal
    WHERE t.jnsTrx='J' AND t.status != 'B' AND (p.telpPIC = :telpPIC AND t.kodePartner = :kodePartner)
    GROUP BY t.nomorBukti
    ORDER BY t.status DESC, t.tglKirim DESC, t.nomorBukti DESC`,
      },
      x
    )
    .then((rows) => {
      res.send(rows);
      console.log(rows);
    })
    .catch((err) => {
      //      throw new Error(err)
      console.log(err);
      res.status(500).send({ st: "ndak nemu..." });
    });
});

app.post("/upjur", man, async (req, res) => {
  let { x } = req.body;
  x.tglBaru = x.tglBaru || x.tglJurnal;
  console.log(x);
  try {
    if (x.jnsEdit === "Trx") {
      await dbuse.query(
        {
          dateStrings: true,
          namedPlaceholders: true,
          sql: "UPDATE transaksi SET tglKirim= :tglBaru, tglTerima= :tglBaru WHERE nomorBukti=:nomorBukti",
        },
        x
      );
      await dbuse.query(
        {
          dateStrings: true,
          namedPlaceholders: true,
          sql: "UPDATE jurnal SET tglJurnal = :tglBaru WHERE nomorJurnal = :nomorJurnal",
        },
        x
      );
    } else {
      await dbuse.query(
        {
          dateStrings: true,
          namedPlaceholders: true,
          sql: "UPDATE jurnal SET tglJurnal = :tglBaru, judulJurnal = :judulJurnal WHERE nomorJurnal = :nomorJurnal",
        },
        x
      );
    }
    res.send({ st: `Tersimpan...` });
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  }
});

// module project
app
  .route("/jnsProject")
  .post(async (req, res) => {
    let { x } = req.body;
    try {
      let [nom] = await dbuse.query(
        `SELECT COUNT(jnsProject) AS urut FROM projectJns`
      );
      x.jnsProject = x.jnsProject
        ? x.jnsProject
        : `JP${String(nom.urut + 1).padStart(3, "0")}`;
      await dbuse.query(
        {
          namedPlaceholders: true,
          sql: `INSERT INTO projectJns (jnsProject, namaJenis, akunUangmuka, aktif)
          VALUES (:jnsProject, :namaJenis, :akunUangmuka, :aktif)
        ON DUPLICATE KEY UPDATE akunUangmuka= :akunUangmuka, aktif= :aktif`,
        },
        x
      );
      res.send({ st: "Tersimpan..." });
    } catch (error) {
      console.log(error);
      res.status(410).send({ st: "Belum tersimpan..." });
    }
  })
  .get((req, res) => {
    dbuse
      .query("SELECT * FROM projectJns ORDER BY jnsProject ASC")
      .then((rows) => {
        res.send(rows);
      })
      .catch((err) => {
        console.log(err);
        res.status(410).send({ st: "Data tidak tersedia..." });
      });
  });

// input project => upload photo
app.get("/sketsa?", (req, res) => {
  const x = req.query.key;
  const potoSket = path.join(__dirname, "sketsa");
  if (fs.existsSync(`${potoSket}/${x}.png`)) {
    res.send({ to64: fs.readFileSync(`${potoSket}/${x}.png`, "base64") });
    /* res.sendFile(`${x}.png`, {
      root: path.join(__dirname, 'sketsa')
    }) */
  } else {
    res.sendFile("sketsa.png", {
      root: path.join(__dirname, "sketsa"),
    });
  }
});

app.post("/inProject", unggahSket.single("potoSket"), async (req, res) => {
  let hd = JSON.parse(req.body.hd);
  let det = JSON.parse(req.body.det);
  let user = req.user.dtAkun;
  hd.salesID = hd.salesID || user.eID;
  hd.tglMlebu = null;
  let tgl = new Date();
  // let j = JSON.parse(hd.jnsProses);

  // let values = j.reduce((o, a) => {
  //   let ini = [];
  //   ini.push(a.jnsProses);
  //   ini.push(a.operator);
  //   o.push(ini);
  //   return o;
  // }, []);

  try {
    let urut = `${hd.kodeCab}_${String(tgl.getMonth() + 1).padStart(
      2,
      "0"
    )}${String(tgl.getFullYear()).slice(-2)}%`;
    let [cek] = await dbuse.query(
      `SELECT COUNT(nomorProject) AS nom FROM project WHERE nomorProject LIKE ?`,
      [urut]
    );
    hd.nomorProject =
      `${hd.kodeCab}_${String(tgl.getMonth() + 1).padStart(2, "0")}${String(
        tgl.getFullYear()
      ).slice(-2)}` + (cek.nom + 1).toString().padStart(3, "0");
    hd.filePoto = req.file.path ? `${hd.nomorProject}.png` : null;
    if (req.file) {
      await sharp(req.file.path)
        .resize(500)
        .png()
        .toFile(path.resolve(req.file.destination + `/${hd.filePoto}`));
      fs.unlinkSync(req.file.path);
    }
    await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO project (nomorProject, kodeCab, kodePartner, asalBahan, uangMuka, akunBayar, materialCust, catatan, salesID, estimasi, jnsProject, akunUangMuka, detOrder, estJadi, jnsProses)
        VALUES (:nomorProject, :kodeCab, :kodePartner, :asalBahan, :uangMuka, :akunBayar, :materialCust, :catatan, :salesID, :estimasi, :jnsProject, :akunUangMuka, :detOrder, :estJadi, :jnsProses)`,
      },
      hd
    );
    // for (let i = 0; i < values.length; i++) {
    //   await dbuse.query({
    //     namedPlaceholders: true,
    //     sql: `INSERT INTO prosesProject (jnsproses, operator, nomorProses, nomorProject) VALUES('${
    //       j[i].jnsProses
    //     }', '${j[i].operator}', '${hd.nomorProject}_${i + 1}', '${
    //       hd.nomorProject
    //     }')`,
    //   });
    // }

    await dbuse.batch(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO projectDetail (nomorProject, kodeProduk, qtySPK, qtyInv, hargaSat, kemasan)
        VALUES ('${hd.nomorProject}', :kodeProduk, :qtySPK, :qtySPK, :hargaSat, :kemasan)`,
      },
      det
    );
    res.send({ st: `Tersimpan dengan nomor: ${hd.nomorProject}` });
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  } finally {
    console.log("hahahas");
    let loger = [
      "user",
      req.user.dtAkun.nama,
      "userAkun",
      req.user.dtAkun.akun,
      "aksi",
      "Masuk",
      "waktu",
      new Date(),
    ];
    let a = await dbuse.query(
      {
        sql: `UPDATE project SET userLog = (SELECT JSON_ARRAY_APPEND(userLog, '$', JSON_OBJECT(?))) WHERE nomorProject = ?`,
      },
      [loger, hd.nomorProject]
    );
  }
});

// data project
app.post("/dataProject", async (req, res) => {
  let { x } = req.body;
  try {
    let data = await dbuse.query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT p.*, JSON_QUERY(p.userLog, '$') AS userLog, JSON_QUERY(p.detOrder, '$') AS detOrder, c.namaPartner, c.telpPIC,
      c.alamat, c.email, cb.namaCabang, cb.alamatCabang,
        COALESCE(b.biaya, 0) AS biaya, j.namaJenis AS jenisProject, j.akunUangmuka, ky.namaKaryawan AS namaSales,
        COALESCE(bt.totalHPP, 0) AS totalHPP, COALESCE(bt.hppSPK, 0) AS hppSPK, COALESCE(bt.hppAdjust, 0) AS hppAdjust
      FROM project p
        LEFT JOIN partner c ON c.kodePartner = p.kodePartner
        LEFT JOIN karyawan ky ON ky.kodeKar = p.salesID
        LEFT JOIN cabang cb ON cb.kodeCab = p.kodeCab
        LEFT JOIN projectJns j ON j.jnsProject = p.jnsProject
        LEFT JOIN (
          SELECT SUM(d.qtyInv * d.hargaSat) AS biaya, d.nomorProject
            FROM projectDetail d LEFT JOIN project p ON d.nomorProject = p.nomorProject
            WHERE p.status != 'Batal' AND p.kodeCab IN (:kodeCab)
            GROUP BY p.nomorProject
        ) b ON b.nomorProject = p.nomorProject
        LEFT JOIN (
          SELECT SUM(d.hpp) AS totalHPP,
            SUM(IF(t.jnsTrx = 'J', d.hpp, 0)) AS hppSPK,
            SUM(IF(t.jnsTrx = 'ADJ', d.hpp, 0)) AS hppAdjust,
            t.nomorProject
          FROM detTrans d LEFT JOIN transaksi t ON t.nomorBukti = d.nomorBukti
          WHERE t.cabID IN (:kodeCab) AND t.status = 'T' AND t.nomorProject IS NOT NULL AND length(t.nomorProject) > 4
          GROUP BY t.nomorProject
        ) bt ON bt.nomorProject = p.nomorProject
      WHERE p.kodeCab IN (:kodeCab) AND ((p.tglMasuk BETWEEN :tgla AND DATE_ADD(:tglb, INTERVAL 1439 MINUTE)) AND p.status NOT IN ('Batal', 'Closed'))
      ORDER BY p.tglMasuk DESC`,
      },
      x
    );
    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  }
});

app
  .route("/detProject")
  .get((req, res) => {
    let x = JSON.parse(req.query.key);
    dbuse
      .query(
        `SELECT d.*, (d.qtyInv * d.hargaSat) AS jmlHarga, nb.namaBarang FROM projectDetail d
      LEFT JOIN namaBarang nb ON d.kodeProduk = nb.kodeProduk
      WHERE d.nomorProject = ?`,
        [x.nomorProject]
      )
      .then((rows) => res.send(rows))
      .catch((err) => {
        console.log(err);
        res.status(410).send({ st: "Data tidak tersedia..." });
      });
  })
  .post(async (req, res) => {
    let data = [];
    let { x } = req.body;
    data.push(x);
    console.log(data);
    let dt = data.map((a) => {
      a.idprojectDetail = a.idprojectDetail || null;
      a.qtyInv = a.qtySPK;
      return a;
    });
    try {
      await dbuse.batch(
        {
          namedPlaceholders: true,
          sql: `INSERT INTO projectDetail (nomorProject, kodeProduk, qtySPK, qtyProd, qtyInv, idprojectDetail)
          VALUES (:nomorProject, :kodeProduk, :qtySPK, :qtyProd, :qtyInv, :idprojectDetail)
          ON DUPLICATE KEY UPDATE qtySPK= :qtySPK, qtyProd= :qtyProd, qtyInv= :qtyInv`,
        },
        dt
      );
      res.send({ st: "Tersimpan..." });
    } catch (error) {
      console.log(error);
      res.status(410).send({ st: "Belum tersimpan..." });
    } finally {
      let loger = [
        "user",
        req.user.dtAkun.nama,
        "userAkun",
        req.user.dtAkun.akun,
        "aksi",
        "Konsumsi",
        "waktu",
        new Date(),
      ];
      await dbuse.query(
        {
          sql: `UPDATE project SET userLog = (SELECT JSON_ARRAY_APPEND(userLog, '$', JSON_OBJECT(?))) WHERE nomorProject = ?`,
        },
        [loger, data[0].nomorProject]
      );
    }
  });

app.post("/upProject", async (req, res) => {
  let { x } = req.body;
  try {
    await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `UPDATE project SET detOrder = :detOrder, salesID = :salesID, estJadi = :estJadi, asalBahan = :asalBahan,
        catatan = :catatan
        WHERE nomorProject = :nomorProject`,
      },
      x
    );
    res.send({ st: "Tersimpan..." });
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  } finally {
    let loger = [
      "user",
      req.user.dtAkun.nama,
      "userAkun",
      req.user.dtAkun.akun,
      "aksi",
      "Update Project",
      "waktu",
      new Date(),
    ];
    await dbuse.query(
      {
        sql: `UPDATE project SET userLog = (SELECT JSON_ARRAY_APPEND(userLog, '$', JSON_OBJECT(?))) WHERE nomorProject = ?`,
      },
      [loger, x.nomorProject]
    );
  }
});
app.post("/delDetProject", async (req, res) => {
  let { x } = req.body;
  try {
    await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `DELETE FROM projectDetail WHERE idprojectDetail = :idprojectDetail AND nomorProject = :nomorProject`,
      },
      x
    );
    res.send({ st: "Tersimpan..." });
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  } finally {
    let loger = [
      "user",
      req.user.dtAkun.nama,
      "userAkun",
      req.user.dtAkun.akun,
      "aksi",
      "Hapus detail",
      "waktu",
      new Date(),
    ];
    await dbuse.query(
      {
        sql: `UPDATE project SET userLog = (SELECT JSON_ARRAY_APPEND(userLog, '$', JSON_OBJECT(?))) WHERE nomorProject = ?`,
      },
      [loger, x.nomorProject]
    );
  }
});

// update project approve => uangmuka, status proses
app.post("/projectApprove", async (req, res) => {
  let { x } = req.body;
  let urt = new Date();
  try {
    let [p] = await dbuse.query(
      `SELECT p.namaPartner, p.telpPIC, c.namaCabang, pj.nomorProject FROM project pj
    LEFT JOIN partner p ON pj.kodePartner = p.kodePartner
    LEFT JOIN cabang c ON c.kodeCab = pj.kodeCab
    WHERE pj.nomorProject = ?`,
      [x.nomorProject]
    );
    if (x.uangMuka > 0 && x.status === "Approve") {
      let crJ =
        x.kodeCab +
        "99" +
        String(urt.getMonth() + 1).padStart(2, "0") +
        String(urt.getFullYear()).slice(-2);
      let [nomJu] = await dbuse.query(
        `SELECT COUNT(nomorJurnal) AS nom FROM jurnal WHERE ISNULL(jn) AND nomorJurnal like '${crJ}%'`
      );
      x.nomorJurnal = crJ + String(parseInt(nomJu.nom) + 1).padStart(6, "0");
      await dbuse.query(
        {
          namedPlaceholders: true,
          sql: `INSERT INTO jurnal (cabID, nomorJurnal, tglJurnal,jnsJurnal,kodePartner,judulJurnal,jhp,status,nomorProject,oleh)
          VALUES (:kodeCab, :nomorJurnal, NOW(), 'J', :kodePartner,'Uang Muka Project ${x.nomorProject}', 'H','O',:nomorProject,:salesID )`,
        },
        x
      );
      await dbuse.query(
        {
          namedPlaceholders: true,
          sql: `INSERT INTO detJur (nomorJurnal, DK, nilai, kodeAkun) VALUES (:nomorJurnal, 'D', :uangMuka, :akunBayar), (:nomorJurnal, 'K', :uangMuka, :akunUangmuka)`,
        },
        x
      );
    }
    await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `UPDATE project SET status = :status WHERE nomorProject = :nomorProject`,
      },
      x
    );
    res.send({ st: `Project ${x.nomorProject} ${x.status}...` });

    fetch("https://kudus.wablas.com/api/send-message", {
      method: "POST",
      body: JSON.stringify({
        phone: p.telpPIC.replace(/^(\+628|628|08|8|6208)/, "628"),
        message: `Halo Sobat Printex, Pesanan anda dengan No SPK *${x.nomorProject}* dalam proses produksi`,
        spintax: true,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "K5oIFgC7sTAj46ftCpvHYUuGwgxabyRycLUUOaH60tHcb2gQnGxztd1WosgXPpjl",
      },
    })
      .then((ok) => {
        console.log(ok);
      })
      .catch((error) => {
        console.log(error);
      });
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  } finally {
    let loger = [
      "user",
      req.user.dtAkun.nama,
      "userAkun",
      req.user.dtAkun.akun,
      "aksi",
      x.status,
      "waktu",
      new Date(),
    ];
    await dbuse.query(
      {
        sql: `UPDATE project SET userLog = (SELECT JSON_ARRAY_APPEND(userLog, '$', JSON_OBJECT(?))) WHERE nomorProject = ?`,
      },
      [loger, x.nomorProject]
    );
  }
});
// project selesai => set penjualan dan selisih untuk adjustment

app.post("/projectDone", async (req, res) => {
  let { x } = req.body;
  console.log(x);
  try {
    let det = await dbuse.query(
      `SELECT d.*, nb.kodeCat, nb.akunPersediaan, nb.akunPenjualan,
      nb.akunHpp, (d.qtyProd - d.qtyInv) AS selisih, h.${x.kodeCab} * d.qtyInv AS hpp, (h.${x.kodeCab} * (d.qtyProd - d.qtyInv)) AS hppS, nb.jasa,
      (d.qtyInv * d.hargaSat) AS jmlHarga
      FROM projectDetail d
      LEFT JOIN namaBarang nb ON nb.kodeProduk = d.kodeProduk
      LEFT JOIN hpp h ON d.kodeProduk= h.kodeProduk
      WHERE d.nomorProject = ?`,
      [x.nomorProject]
    );
    let detInv = det.filter((a) => a.qtyInv > 0);
    // buat penjualan
    let urt = new Date();
    let jn = "44";
    let cr =
      x.kodeCab +
      jn +
      String(urt.getMonth() + 1).padStart(2, "0") +
      String(urt.getFullYear()).slice(-2);
    let [nomJB] = await dbuse.query(
      `SELECT COUNT(t.nomorBukti) AS nom FROM transaksi t WHERE ISNULL(t.jn) AND t.nomorBukti like '${cr}%'`,
      [cr]
    );
    x.nomorBukti = cr + String(parseInt(nomJB.nom) + 1).padStart(6, "0");
    let crJ =
      x.kodeCab +
      "99" +
      String(urt.getMonth() + 1).padStart(2, "0") +
      String(urt.getFullYear()).slice(-2);
    let [nomJu] = await dbuse.query(
      `SELECT COUNT(nomorJurnal) AS nom FROM jurnal WHERE ISNULL(jn) AND nomorJurnal like '${crJ}%'`,
      [cr]
    );
    let nojur = crJ + String(parseInt(nomJu.nom) + 1).padStart(6, "0");
    x.nojur = nojur;
    await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO transaksi (cabID,tglKirim, tglTerima,nomorBukti,salesID,kodePartner,jnsTrx,status,asal, tempo,akunBayar,
        judulTransaksi, nomorJurnal, nomorProject, ct, note)
      VALUES (:kodeCab, NOW(), NOW(),:nomorBukti,:salesID,:kodePartner,'J','T',:kodeCab, 7,:akunBayar, 'Invoice untuk Project ${x.nomorProject}', '${nojur}', :nomorProject, 'tempo', '${x.catatan}')`,
      },
      x
    );
    // insert into detTrans penjualan di invoice
    delete det.meta;
    await dbuse.batch(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO detTrans (nomorBukti, kodeProduk, qty, jmlHarga, dpp, hpp, jmlKemasan, hargaKemasan, jmlPoint)
      VALUES ('${x.nomorBukti}', :kodeProduk, :qtyInv, :jmlHarga, :jmlHarga, :hpp, :qtyInv, :jmlHarga/ :qtyInv, :jmlPoint)`,
      },
      detInv
    );
    // update stok
    for (let i in det) {
      if (det[i].jasa === "Y") {
        continue;
      }
      await dbuse.query(
        `UPDATE stock SET ${x.kodeCab} = ${x.kodeCab} - ? WHERE kodeProduk='${det[i].kodeProduk}'`,
        [det[i].qtyProd]
      );
    }
    // insert jurnal
    await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO jurnal
      (cabID,nomorJurnal,tglJurnal,jnsJurnal,kodePartner,judulJurnal,tempo,jhp,status,nomorSuratJalan,oleh, nomorProject)
      VALUES (:kodeCab,'${nojur}', NOW(), 'J', :kodePartner, 'Invoice untuk Project ${x.nomorProject}', DATE_ADD(now(), INTERVAL 7 DAY),'P','O',
      :nomorBukti,:salesID, :nomorProject)`,
      },
      x
    );
    // insert detJur

    // cek uang muka => dimasukkan ke pengurang piutang
    let cek = { nomorJurnal: null };
    let [cekU] = await dbuse.query(
      `SELECT nomorJurnal FROM jurnal WHERE nomorProject = ? AND jhp = 'H' AND jnsJurnal = 'J'`,
      [x.nomorProject]
    );
    // update uang muka lunas
    if (cekU) {
      cek = cekU;
      await dbuse.query(
        `UPDATE detJur SET nomorReff = ? WHERE nomorJurnal = ? AND kodeAkun = ?`,
        [nojur, cekU.nomorJurnal, x.akunUangMuka]
      );
    }
    // harga Jual
    x.piutang = det.reduce((s, m) => s + m.jmlHarga, 0) - x.uangMuka;
    await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO detJur (nomorJurnal, kodeAkun, DK, nilai, kodePartner, nomorReff)
      VALUES ('${nojur}', '110500001', 'D', :piutang, :kodePartner, ''),
      ('${nojur}', :akunUangMuka, 'D', :uangMuka, :kodePartner, '${cek.nomorJurnal}')`,
      },
      x
    );
    let setKodeCat = [...new Set(detInv.map((a) => a.kodeCat))];
    for (let i in setKodeCat) {
      let tdpp = detInv
        .filter((a) => a.kodeCat == setKodeCat[i])
        .reduce((ss, b) => jumlah([ss, b.jmlHarga]), 0);
      let thpp = detInv
        .filter((a) => a.kodeCat == setKodeCat[i])
        .reduce((ss, b) => jumlah([ss, b.hpp]), 0);
      // penjualan
      await dbuse.query(
        `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
        VALUES (?,(SELECT c.akunPenjualan FROM produkCat c
        WHERE c.kodeCat=? ),?,?)`,
        [nojur, setKodeCat[i], "K", tdpp]
      );
      if (thpp !== 0) {
        // hpp
        await dbuse.query(
          `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
          VALUES (?,(SELECT c.akunHpp FROM produkCat c
          WHERE c.kodeCat=? ),?,?)`,
          [nojur, setKodeCat[i], "D", thpp]
        );
        // persediaan
        await dbuse.query(
          `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
          VALUES (?,(SELECT c.akunPersediaan FROM produkCat c
          WHERE c.kodeCat=? ),?,?)`,
          [nojur, setKodeCat[i], "K", thpp]
        );
      }
    }
    // buat adjustment selisih
    if (det.some((a) => a.selisih > 0)) {
      let detSelisih = det.filter((a) => a.selisih > 0);
      // adjustment transaksi => update stok
      await dbuse.query(
        {
          namedPlaceholders: true,
          sql: `INSERT INTO transaksi (cabID,tglKirim, tglTerima,nomorBukti,salesID,kodePartner,jnsTrx,status,asal, judulTransaksi, nomorJurnal, jn, nomorProject)
        VALUES (:kodeCab, NOW(), NOW(),CONCAT(:nomorBukti, 'B'),:salesID,:kodePartner,'ADJ','T',:kodeCab,
         'Biaya project ${x.nomorProject}', '${nojur}', 'b', :nomorProject)`,
        },
        x
      );
      await dbuse.batch(
        {
          namedPlaceholders: true,
          sql: `INSERT INTO detTrans (nomorBukti, kodeProduk, qty, jmlHarga, dpp, hpp, jmlKemasan, hargaKemasan, jmlPoint)
        VALUES ('${x.nomorBukti}B', :kodeProduk, :selisih, :hppS, :hppS, :hppS, :selisih, :jmlHarga/ :selisih, :jmlPoint)`,
        },
        detSelisih
      );
      // update stok
      for (let i in detSelisih) {
        if (detSelisih[i].jasa === "Y") {
          continue;
        }
        await dbuse.query(
          `UPDATE stock SET ${x.kodeCab} = ${x.kodeCab} - ? WHERE kodeProduk='${detSelisih[i].kodeProduk}'`,
          [detSelisih[i].selisih]
        );
      }
      // jurnal selisih
      await dbuse.query(
        {
          namedPlaceholders: true,
          sql: `INSERT INTO jurnal
        (cabID,nomorJurnal,tglJurnal,jnsJurnal,kodePartner,judulJurnal,status,nomorSuratJalan,oleh, nomorProject)
        VALUES (:kodeCab,'${nojur}B', NOW(), 'ADJ', :kodePartner, 'Biaya Project ${x.nomorProject}', 'T',CONCAT(:nomorBukti, 'B'),:salesID, :nomorProject)`,
        },
        x
      );
      let setKodeCat = [...new Set(detSelisih.map((a) => a.kodeCat))];
      for (let i in setKodeCat) {
        let thpp = detSelisih
          .filter((a) => a.kodeCat == setKodeCat[i])
          .reduce((ss, b) => jumlah([ss, b.hppS]), 0);
        if (thpp !== 0) {
          // hpp
          await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES ('${nojur}B',(SELECT c.akunHpp FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [setKodeCat[i], "D", thpp]
          );
          // persediaan
          await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES ('${nojur}B',(SELECT c.akunPersediaan FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [setKodeCat[i], "K", thpp]
          );
        }
      }
    }
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  } finally {
    let [p] = await dbuse.query(
      `SELECT p.namaPartner, p.telpPIC, c.namaCabang, pj.nomorProject FROM project pj
    LEFT JOIN partner p ON pj.kodePartner = p.kodePartner
    LEFT JOIN cabang c ON c.kodeCab = pj.kodeCab
    WHERE pj.nomorProject = ?`,
      [x.nomorProject]
    );
    let loger = [
      "user",
      req.user.dtAkun.nama,
      "userAkun",
      req.user.dtAkun.akun,
      "aksi",
      "Selesai",
      "waktu",
      new Date(),
    ];
    await dbuse.query(
      {
        sql: `UPDATE project SET userLog = (SELECT JSON_ARRAY_APPEND(userLog, '$', JSON_OBJECT(?))), nomorPiutang = ? WHERE nomorProject = ?`,
      },
      [loger, x.nojur, x.nomorProject]
    );
    await dbuse.query(
      'Update project set status = "Selesai" WHERE nomorProject = ?',
      [x.nomorProject]
    );
    // if (x.status === 'Selesai') {
    fetch("https://kudus.wablas.com/api/send-message", {
      method: "POST",
      body: JSON.stringify({
        phone: p.telpPIC.replace(/^(\+628|628|08|8|6208)/, "628"),
        message: `Halo Sobat Printex, Pesanan anda dengan No SPK ${x.nomorProject} telah selesai dan dapat diambil di outlet kami di *${req.user.dtAkun.namaCabang}* alamat *${req.user.dtAkun.alamatCabang}* dan dapat menghubungi Nomor :  *${req.user.dtAkun.telp}*. Terima kasih Selamat berkarya`,
        spintax: true,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "K5oIFgC7sTAj46ftCpvHYUuGwgxabyRycLUUOaH60tHcb2gQnGxztd1WosgXPpjl",
      },
    })
      .then((ok) => {
        console.log(ok);
      })
      .catch((error) => {
        console.log(error);
      });
    // }
    res.send({ st: "Tersimpan..." });
  }
});
// get jurnal penjualan project
// get jurnal adjust/ reject
// get pembayaran + uang muka

app.post("/ambilProject", async (req, res) => {
  let { x } = req.body;
  try {
    await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `UPDATE project SET status = 'Diambil' WHERE nomorProject = :nomorProject`,
      },
      x
    );
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  } finally {
    let loger = [
      "user",
      req.user.dtAkun.nama,
      "userAkun",
      req.user.dtAkun.akun,
      "aksi",
      "Diambil",
      "waktu",
      new Date(),
    ];
    await dbuse.query(
      {
        sql: `UPDATE project SET userLog = (SELECT JSON_ARRAY_APPEND(userLog, '$', JSON_OBJECT(?))) WHERE nomorProject = ?`,
      },
      [loger, x.nomorProject]
    );
    res.send({ st: "Tersimpan..." });
  }
});

// rekap project vs biaya adjustment

app.post("/rkpProject", async (req, res) => {
  let { x } = req.body;
  // console.log(x)
  try {
    let data = await dbuse.query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT p.tglMasuk, p.tglSelesai, p.nomorProject, p.kodePartner, p.status, cb.namaCabang, c.namaPartner, ky.namaKaryawan AS namaSales,
      j.namaJenis AS jenisProject, p.uangMuka, j.akunUangmuka,
      SUM(d.qtySPK * d.hargaSat) AS totalHarga,
      b.totalHPP, b.hppSPK, b.hppAdjust, coalesce(jp.terbayar, 0) + COALESCE(tb.byrTagihan, 0) AS terbayar
      FROM projectDetail d
        LEFT JOIN project p ON p.nomorProject = d.nomorProject
        LEFT JOIN (
          SELECT SUM(d.hpp) AS totalHPP,
            SUM(IF(t.jnsTrx = 'J', d.hpp, 0)) AS hppSPK,
            SUM(IF(t.jnsTrx = 'ADJ', d.hpp, 0)) AS hppAdjust,
            t.nomorProject
          FROM detTrans d LEFT JOIN transaksi t ON t.nomorBukti = d.nomorBukti
          WHERE t.cabID IN (:kodeCab) AND t.status = 'T' AND t.nomorProject IS NOT NULL AND length(t.nomorProject) > 4
          GROUP BY t.nomorProject
        ) b ON b.nomorProject = p.nomorProject
        LEFT JOIN partner c ON c.kodePartner = p.kodePartner
        LEFT JOIN karyawan ky ON ky.kodeKar = p.salesID
        LEFT JOIN cabang cb ON cb.kodeCab = p.kodeCab
        LEFT JOIN projectJns j ON j.jnsProject = p.jnsProject
        LEFT JOIN (
          SELECT d.kodeAkun, SUM(d.nilai) AS terbayar, d.DK, d.nomorJurnal, j.tglJurnal,
            c.namaAkun AS akunKas, j.judulJurnal, j.nomorProject
          FROM detJur d LEFT JOIN jurnal j ON d.nomorJurnal = j.nomorJurnal
            LEFT JOIN COA c ON d.kodeAkun = c.kodeAkun
          WHERE c.subAkun IN ('11010', '11020') AND d.DK = 'D' AND j.nomorProject IS NOT NULL AND j.status != 'B'
          GROUP BY j.nomorProject
        ) jp ON jp.nomorProject = p.nomorProject
        LEFT JOIN (
          SELECT SUM(d.nilai) AS byrTagihan, r.nomorProject
            FROM detJur d
            LEFT JOIN jurnal j On d.nomorJurnal = j.nomorJurnal
            LEFT JOIN jurnal r ON d.nomorReff = r.nomorJurnal
            WHERE d.nomorReff IS NOT NULL AND j.status != 'B' AND r.nomorProject IS NOT NULL
            GROUP BY r.nomorProject
        ) tb ON tb.nomorProject = p.nomorProject
      WHERE p.kodeCab IN (:kodeCab) AND p.tglMasuk BETWEEN :tgla AND DATE_ADD(:tglb, INTERVAL 1439 MINUTE)
      GROUP BY p.nomorProject`,
      },
      x
    );
    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  }
});
// get histori pembayaran
app.post("/hisBayarProject", async (req, res) => {
  let { x } = req.body;
  x.nomorPiutang = x.nomorPiutang || x.nomorProject;
  try {
    let bayar = await dbuse.query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT d.kodeAkun, d.nilai, d.DK, d.nomorJurnal, j.tglJurnal,
        c.namaAkun AS akunKas, j.judulJurnal
      FROM detJur d LEFT JOIN jurnal j ON d.nomorJurnal = j.nomorJurnal
        LEFT JOIN COA c ON d.kodeAkun = c.kodeAkun
      WHERE (j.nomorProject = :nomorProject OR j.noreff = :nomorPiutang) AND c.subAkun IN ('11010', '11020') AND d.DK = 'D'
      ORDER BY j.tglJurnal ASC`,
      },
      x
    );
    res.send(bayar);
  } catch (error) {
    console.log(error);
    res.status(200).send({ data: [] });
  }
});

// module servis
app.get("/produkService", async (req, res) => {
  try {
    let a = await dbuse.query(`SELECT nb.*, j.pointService FROM namaBarang nb
      LEFT JOIN jenisService j ON nb.kodeJenis = j.kodeJenis WHERE nb.kodeCat = '17' ORDER BY namaBarang`);
    res.send(a);
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Tidak ditemukan..." });
  }
});
app.get("/jnsService", (req, res) => {
  dbuse
    .query("SELECT * FROM jenisService ORDER BY idjenisService ASC")
    .then((rows) => res.send(rows))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Data tidak tersedia..." });
    });
});

app.post("/jnsService", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO jenisService (kodeJenis, namaJenis, pointService, jnsPrinter)
      VALUES (:kodeJenis, :namaJenis, :pointService, :jnsPrinter)
    ON DUPLICATE KEY UPDATE pointService= :pointService`,
      },
      x
    )
    .then((rows) => res.send({ st: `Data ${x.namaJenis} tersimpan...` }))
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Data tidak tersedia..." });
    });
});
app.post("/inservis", async (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  x.salesID = x.salesID || user.eID;
  x.teknisi = x.teknisi || "";
  x.tglMlebu = null;
  let tgl = new Date();
  let [ss] = await dbuse.query(
    "SELECT pointService FROM jenisService WHERE kodeJenis =?",
    [x.kodeJenis]
  );
  // x.tglMasuk = ['MAN', 'acc', 'purchase'].some(a => a == user.userType) ? x.tglMasuk : null
  x.pointService = ss.pointService;
  try {
    let [dtCust] = await dbuse.query(
      "SELECT * FROM partner WHERE kodePartner = ?",
      [x.kodePartner]
    );
    let [teknisi] = await dbuse.query(
      "SELECT namaKaryawan AS namaTeknisi FROM karyawan WHERE kodeKar = ?",
      [x.teknisi]
    );
    let urut = `${x.kodeCab}_${String(tgl.getMonth() + 1).padStart(
      2,
      "0"
    )}${String(tgl.getFullYear()).slice(-2)}%`;
    let [cek] = await dbuse.query(
      `SELECT COUNT(nomorServis) AS nom FROM serviceCenter WHERE nomorServis LIKE ?`,
      [urut]
    );
    x.nomorServis =
      `${x.kodeCab}_${String(tgl.getMonth() + 1).padStart(2, "0")}${String(
        tgl.getFullYear()
      ).slice(-2)}` + (cek.nom + 1).toString().padStart(3, "0");
    await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `INSERT INTO serviceCenter (nomorServis, kodeCab, kodePartner, kodeProduk, nomorSN, produkNo, kelengkapan, keluhan, salesID, kodeJenis, pointService, teknisi)
        VALUES (:nomorServis, :kodeCab, :kodePartner, :kodeProduk, :nomorSN, :produkNo, :kelengkapan, :keluhan, :salesID, :kodeJenis, :pointService, :teknisi)`,
      },
      x
    );
    let telp = dtCust.telpPIC || dtCust.telp;
    // console.log(telp.replace(/^(\+628|628|08|8|6208)/, '628'))
    let dta = JSON.stringify({
      phone_number: telp.replace(/^(\+628|628|08|8|6208)/, "628"), // nomor pelanggan harus menggunakan +62 / 62
      message: {
        type: "template",
        template: {
          template_code_id:
            "9b1224e2_66de_4745_a510_7eea39533133:asis_service_arrive", // id template pesan
          payload: [
            {
              position: "body",
              parameters: [
                // variable pada template
                {
                  // isian untuk variable no service
                  type: "text",
                  text: x.nomorServis,
                },
                {
                  // isian untuk variable nama pelanggan
                  type: "text",
                  text: dtCust.namaPartner,
                },
                {
                  // isian untuk variable nama pelanggan
                  type: "text",
                  text: teknisi.namaTeknisi,
                },
              ],
            },
          ],
        },
      },
    });
    // console.log(dta)
    fetch("https://wa01.ocatelkom.co.id/api/v2/push/message", {
      method: "POST",
      body: dta,
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiYXBwbGljYXRpb24iOiI2MjdjODIwZmYzODQwMzAwMmM3ZWRiODMiLCJpYXQiOjE1MTYyMzkwMjJ9.i2ZY0ZZCmHzSoMv0SCGV4_L7XmNm0aBnXR6DWfTbpj0vFb1TpurnuYQUMPdeO16tQFI_5bnF1sMexdE9Sd6-Y7q2OLaTP2dcFq1_Vi5NYdoix_cNkj9kYcejJLb6nzSteT28kp769Gowf8IqATQw-5KOLFBZgcPQY3ZMcPhtfVDQoKJoRardURwAJ6BnFRp4Ld3QSw67Fa0xXuhT4Mnojk9CrcV4Mr1d-dbgY5_hqJg00UyLuSDf4q_thEG5NXMSKmiEIfAl1vOFep_zViQM1NJSO5ewLGMohDayMMpnPi53oNVIGMGyPrLNZ5ZNTE1HAbnS31axIbytfG3wjv3DzA",
      },
    }).then((ok) => {
      //console.log(ok.status)
      /* if (ok.status === 200) {
        res.send({ st: 'Pesan terkirim...', color: 'teal' })
      } else {
        res.send({ st: 'Pesan tidak terkirim...', color: 'pink' })
      } */
      // console.log(ok)
    });
    res.send({ st: `Tersimpan dengan nomor: ${x.nomorServis}` });
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  } finally {
    await dbuse.query(
      `INSERT INTO userLog (nomorBukti, jnsLog, akun, deskripsi)
      VALUE (?, 'Servis',?,'Input servis')`,
      [x.nomorServis, user.akun]
    );
    let loger = [
      "user",
      req.user.dtAkun.nama,
      "userAkun",
      req.user.dtAkun.akun,
      "aksi",
      "Masuk",
      "waktu",
      new Date(),
    ];
    await dbuse.query(
      {
        sql: `UPDATE serviceCenter SET userLog = (SELECT JSON_ARRAY_APPEND(userLog, '$', JSON_OBJECT(?))) WHERE nomorServis = ?`,
      },
      [loger, x.nomorServis]
    );
  }
});

app.post("/updServis", async (req, res) => {
  let { x } = req.body;
  // console.log(x)
  let y = {
    catatanTeknisi: x.catatanTeknisi,
    tindakan: x.tindakan,
    analisa: x.analisa,
    aksi: x.aksi,
  };
  let point = {
    pointService: x.repair === "Y" ? x.pointService : 0,
    pointRefill: x.refill === "Y" ? 2 : 0,
    pointMaintenance: x.pointMaintenance === "Y" ? x.jmlPointMaintenance : 0,
  };
  try {
    await dbuse.query(
      `UPDATE serviceCenter SET analisa= '${
        x.analisa
      }', catatanTeknisi= ?, tindakan= ?,
      aksi= ?, pencapaian = '${JSON.stringify(point)}', pointTeknisi = ?
      WHERE nomorServis= ?`,
      [x.catatanTeknisi, x.tindakan, x.aksi, x.pointTeknisi, x.nomorServis]
    );
    res.send({ st: `Update nomor: ${x.nomorServis}` });
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  } finally {
    let loger = [
      "user",
      req.user.dtAkun.nama,
      "userAkun",
      req.user.dtAkun.akun,
      "aksi",
      x.status,
      "waktu",
      new Date(),
    ];
    await dbuse.query(
      {
        sql: `UPDATE serviceCenter SET userLog = (SELECT JSON_ARRAY_APPEND(userLog, '$', JSON_OBJECT(?))) WHERE nomorServis = ?`,
      },
      [loger, x.nomorServis]
    );
  }
});

app.post("/upServis", async (req, res) => {
  let { x } = req.body;
  let user = req.user.dtAkun;
  x.tglAmbil = x.status === "Closed" ? new Date() : null;
  x.tglSelesai = x.status === "Selesai" ? new Date() : null;
  x.konfirmasi = x.konfirmasi || "";
  let tglKerja = "";
  if (x.status === "Proses") {
    x.teknisi = user.eID;
    tglKerja = ", tglKerja = NOW()";
  }
  let point = {
    pointService: x.repair === "Y" ? x.pointService : 0,
    pointRefill: x.refill === "Y" ? 2 : 0,
    pointMaintenance: x.pointMaintenance === "Y" ? x.jmlPointMaintenance : 0,
  };
  if (x.status === "Batal" || x.status === "Batal & Diambil") {
    point = { pointService: 0, pointMaintenance: 0, pointRefill: 0 };
  }
  try {
    await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `UPDATE serviceCenter SET keluhan= :keluhan, tglAmbil= :tglAmbil, pengambil =:pengambil,
      catatanTeknisi= :catatanTeknisi, teknisi=:teknisi, status= :status, konfirmasi= :konfirmasi, tglSelesai= :tglSelesai ${tglKerja},
      pencapaian = '${JSON.stringify(point)}'
      WHERE nomorServis= :nomorServis`,
      },
      x
    );
    res.send({ st: `Update nomor: ${x.nomorServis}` });
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  } finally {
    /* let loger = {
      user: req.user.dtAkun.nama,
      userAkun: req.user.dtAkun.akun,
      aksi: x.status,
      waktu: new Date()
    } */
    let loger = [
      "user",
      req.user.dtAkun.nama,
      "userAkun",
      req.user.dtAkun.akun,
      "aksi",
      x.jnsUpdate,
      "waktu",
      new Date(),
    ];
    await dbuse.query(
      {
        sql: `UPDATE serviceCenter SET userLog = (SELECT JSON_ARRAY_APPEND(userLog, '$', JSON_OBJECT(?))) WHERE nomorServis = ?`,
      },
      [loger, x.nomorServis]
    );
  }
});

/* app.get('/ubahDatService', man, async (req, res) => {
  try {
    let data = await dbuse.query(`SELECT idserviceCenter, JSON_QUERY(userLog, '$') AS userLog
      FROM serviceCenter`)
    let upDt = data.map(a => {
      if (a.userLog) {
        a.log = a.userLog.map(s => {
          delete s.data
          return a
        })
        delete a.userLog
      }
      return a
    })
    await dbuse.batch({
      namedPlaceholders: true,
      sql: `UPDATE serviceCenter SET userLog = :log WHERE idserviceCenter = :idserviceCenter`
    }, upDt)
    res.send('Selesai')
  } catch (error) {
    console.log(error)
    res.status(410).send({ st: 'error' })
  }
}) */

app.post("/serviceAll", async (req, res) => {
  let { x } = req.body;
  try {
    /* let data = await dbuse.query(`SELECT idserviceCenter, JSON_QUERY(userLog, '$') AS userLog
      FROM serviceCenter`)
    let upDt = data.map(a => {
      if (a.userLog) {
        a.log = a.userLog.map(s => {
          delete s.data
          return s
        })
        // delete a.userLog
      }
      return a
    })
    await dbuse.batch({
      namedPlaceholders: true,
      sql: `UPDATE serviceCenter SET userLog = :log WHERE idserviceCenter = :idserviceCenter`
    }, upDt) */
    let ok = await dbuse.query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT s.*, p.namaPartner, p.tlp, p.telpPIC, p.alamat,p.email, p.namaPIC, cc.point,
        k.namaKaryawan AS namaTeknisi, nb.namaMerk, ks.namaKaryawan AS namaSales, nb.namaBarang,
        COALESCE(b.biaya, 0) AS biaya, JSON_QUERY(s.pencapaian, '$') AS pencapaian, hg.MP01 AS hargaRetail,
        nb.pointMember, (TIMESTAMPDIFF(DAY, s.tglMasuk, s.tglSelesai) + 1) AS TAT, jn.namaJenis, jn.jnsPrinter,
        TIMESTAMPDIFF(DAY, s.tglMasuk, now()) AS umur, JSON_QUERY(userLog, '$') AS userLog, part.part
      FROM serviceCenter s
        LEFT JOIN cabang c ON c.kodeCab = s.kodeCab
        LEFT JOIN partner p ON s.kodePartner = p.kodePartner
        LEFT JOIN CustCat cc ON p.catPartner = cc.idCustCat
        LEFT JOIN karyawan k ON s.teknisi = k.kodeKar
        LEFT JOIN karyawan ks ON s.salesID = ks.kodeKar
        LEFT JOIN namaBarang nb ON nb.kodeProduk = s.kodeProduk
        LEFT JOIN hargaRetail hg ON hg.kodeProduk = s.kodeProduk
        LEFT JOIN jenisService jn ON s.kodeJenis = jn.kodeJenis
        LEFT JOIN (
          SELECT SUM(d.jmlHarga) AS biaya, nomorServis FROM serviceKomponen d
          GROUP BY d.nomorServis
        ) b ON b.nomorServis = s.nomorServis
        LEFT JOIN (
          SELECT d.nomorServis, group_concat(concat(d.kodeProduk, ': ', nb.namaBarang) separator ',') AS Part FROM serviceKomponen d
            LEFT JOIN serviceCenter sc ON sc.nomorServis = d.nomorServis
            LEFT JOIN namaBarang nb ON d.kodeProduk = nb.kodeProduk
          WHERE nb.jasa = 'N' AND sc.tglMasuk BETWEEN :tgla AND DATE_ADD(:tglb, INTERVAL 1 DAY)
          GROUP BY d.nomorServis
        ) part ON part.nomorServis = s.nomorServis
        WHERE ((s.tglMasuk BETWEEN :tgla AND DATE_ADD(:tglb, INTERVAL 1 DAY) AND s.status IN (:status)) OR s.status NOT IN ('Batal', 'Selesai', 'Closed')) AND s.kodeCab IN (:kodeCab)
        ORDER BY s.tglMasuk DESC`,
      },
      x
    );
    res.send(ok);
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum ditemukan... " });
  }
});

app.post("/serviceDone", (req, res) => {
  let { x } = req.body;
  // console.log(x)
  dbuse
    .query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT s.*, p.namaPartner, p.tlp, p.telpPIC, p.alamat,p.email, p.namaPIC, cc.point,
      k.namaKaryawan AS namaTeknisi, nb.namaMerk, ks.namaKaryawan AS namaSales, nb.namaBarang,
      COALESCE(b.biaya, 0) AS biaya, JSON_QUERY(s.pencapaian, '$') AS pencapaian, hg.MP01 AS hargaRetail,
      nb.pointMember, (TIMESTAMPDIFF(DAY, s.tglMasuk, s.tglSelesai) + 1) AS TAT, jn.namaJenis, jn.jnsPrinter,
      TIMESTAMPDIFF(DAY, s.tglMasuk, now()) AS umur, JSON_QUERY(userLog, '$') AS userLog
    FROM serviceCenter s
      LEFT JOIN cabang c ON c.kodeCab = s.kodeCab
      LEFT JOIN partner p ON s.kodePartner = p.kodePartner
      LEFT JOIN CustCat cc ON p.catPartner = cc.idCustCat
      LEFT JOIN karyawan k ON s.teknisi = k.kodeKar
      LEFT JOIN karyawan ks ON s.salesID = ks.kodeKar
      LEFT JOIN namaBarang nb ON nb.kodeProduk = s.kodeProduk
      LEFT JOIN hargaRetail hg ON hg.kodeProduk = s.kodeProduk
      LEFT JOIN jenisService jn ON s.kodeJenis = jn.kodeJenis
      LEFT JOIN (
        SELECT SUM(d.jmlHarga) AS biaya, nomorServis FROM serviceKomponen d
        GROUP BY d.nomorServis
      ) b ON b.nomorServis = s.nomorServis
      WHERE ((s.tglMasuk BETWEEN :tgla AND DATE_ADD(:tglb, INTERVAL 1 DAY) AND s.status IN (:status))) AND s.kodeCab IN (:kodeCab)
      ORDER BY s.tglSelesai DESC`,
      },
      x
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Belum ditemukan... " });
    });
});

app.post("/dataServis", (req, res) => {
  let { x } = req.body;
  x.kodeCab = !x.kodeCab[0] ? [req.user.dtAkun.kodeCab] : x.kodeCab;
  let teknisi =
    req.user.dtAkun.userType === "teknisi"
      ? ` AND s.teknisi = '${req.user.dtAkun.eID}'`
      : "";
  dbuse
    .query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT s.*, p.namaPartner, p.tlp, p.telpPIC, p.alamat,p.email, p.namaPIC, cc.point,
      k.namaKaryawan AS namaTeknisi, nb.namaMerk, ks.namaKaryawan AS namaSales, nb.namaBarang,
      COALESCE(b.biaya, 0) AS biaya, JSON_QUERY(s.pencapaian, '$') AS pencapaian, hg.MP01 AS hargaRetail,
      nb.pointMember, (TIMESTAMPDIFF(DAY, s.tglMasuk, s.tglSelesai) + 1) AS TAT, jn.namaJenis, jn.jnsPrinter,
      TIMESTAMPDIFF(DAY, s.tglMasuk, now()) AS umur, JSON_query(userLog, '$') AS userLog
    FROM serviceCenter s
      LEFT JOIN cabang c ON c.kodeCab = s.kodeCab
      LEFT JOIN partner p ON s.kodePartner = p.kodePartner
      LEFT JOIN CustCat cc ON p.catPartner = cc.idCustCat
      LEFT JOIN karyawan k ON s.teknisi = k.kodeKar
      LEFT JOIN karyawan ks ON s.salesID = ks.kodeKar
      LEFT JOIN namaBarang nb ON nb.kodeProduk = s.kodeProduk
      LEFT JOIN hargaRetail hg ON hg.kodeProduk = s.kodeProduk
      LEFT JOIN jenisService jn ON s.kodeJenis = jn.kodeJenis
      LEFT JOIN (
        SELECT SUM(d.jmlHarga) AS biaya, nomorServis FROM serviceKomponen d
        GROUP BY d.nomorServis
      ) b ON b.nomorServis = s.nomorServis
      WHERE ((s.tglMasuk BETWEEN :tgla AND DATE_ADD(:tglb, INTERVAL 1 DAY) AND s.status IN (:status)) OR s.status NOT IN ('Batal', 'Selesai', 'Closed')) AND s.kodeCab IN (:kodeCab) ${teknisi}
      ORDER BY s.tglMasuk DESC`,
      },
      x
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Belum ditemukan... " });
    });
});
app.get("/stService", (req, res) => {
  let x = req.query.key;
  dbuse
    .query(
      {
        dateStrings: true,
        sql: `SELECT s.nomorServis, s.tglMasuk, s.status, s.tglAmbil, s.catatanTeknisi FROM serviceCenter s WHERE nomorServis =?`,
      },
      [x.nomorService]
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Tidak ditemukan..." });
    });
});

app.post("/addPartService", async (req, res) => {
  let { x } = req.body;
  try {
    let sql = x.idserviceKomponen
      ? `UPDATE serviceKomponen SET kodeProduk= :kodeProduk, qty= :qty,
      hargaSat = :hargaSat, jmlHarga = :qty * :hargaSat, jmlPoint = :jmlPoint
        WHERE idserviceKomponen = :idserviceKomponen`
      : `INSERT INTO serviceKomponen (nomorServis,
      kodeProduk, qty, hargaSat, jmlHarga, jmlPoint) VALUES (:nomorServis,
        :kodeProduk, :qty, :hargaSat, :jmlHarga, :jmlPoint)`;
    let inPart = await dbuse.query(
      {
        namedPlaceholders: true,
        sql: sql,
      },
      x
    );
    res.send({ st: "Tersimpan...", id: inPart.insertId });
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  }
});

app.post("/partService", (req, res) => {
  let { x } = req.body;
  dbuse
    .query(
      {
        dateStrings: true,
        sql: `SELECT d.*, nb.namaBarang, nb.kodeCat, nb.akunPersediaan, nb.akunPenjualan,
    nb.akunHpp, h.${x.kodeCab} * d.qty AS hpp, s.${x.kodeCab} AS saldo, nb.pointMember, nb.jasa
    FROM serviceKomponen d
      LEFT JOIN namaBarang nb ON d.kodeProduk = nb.kodeProduk
      LEFT JOIN hpp h ON d.kodeProduk= h.kodeProduk
      LEFT JOIN stock s ON d.kodeProduk = s.kodeProduk
    WHERE nomorServis = ?`,
      },
      [x.nomorServis]
    )
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Tidak tersedia..." });
    });
});

app.post("/delDetService", async (req, res) => {
  let { x } = req.body;
  try {
    await dbuse.query(
      `DELETE FROM serviceKomponen WHERE idserviceKomponen = ? AND nomorServis = ?`,
      [x.idserviceKomponen, x.nomorServis]
    );
    res.send({ st: "tersimpan..." });
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  }
});

app.post("/ambilService", async (req, res) => {
  let { hd } = req.body.x;
  let user = req.user.dtAkun;
  let jhp = hd.ct === "tempo" ? "P" : "";
  hd.stJ = hd.ct === "tunai" ? "L" : "O";
  try {
    // status "Batal" & "Closed"
    if (hd.nota === "Y") {
      // insert into transaksi
      let det = await dbuse.query(
        `SELECT d.*, nb.namaBarang, nb.kodeCat, nb.akunPersediaan, nb.akunPenjualan,
      nb.akunHpp, nb.pointMember, nb.jasa, h.${hd.kodeCab} * d.qty AS hpp, nb.pointMember, nb.jasa
      FROM serviceKomponen d
        LEFT JOIN namaBarang nb ON d.kodeProduk = nb.kodeProduk
        LEFT JOIN hpp h ON d.kodeProduk= h.kodeProduk
        LEFT JOIN stock s ON d.kodeProduk = s.kodeProduk
      WHERE nomorServis = ?`,
        [hd.nomorServis]
      );
      let urt = new Date();
      let jn = "44";
      let cr =
        hd.cabID +
        jn +
        String(urt.getMonth() + 1).padStart(2, "0") +
        String(urt.getFullYear()).slice(-2);
      let [nomJB] = await dbuse.query(
        `SELECT COUNT(t.nomorBukti) AS nom FROM transaksi t WHERE ISNULL(t.jn) AND t.nomorBukti like '${cr}%'`,
        [cr]
      );
      hd.nomorBukti = cr + String(parseInt(nomJB.nom) + 1).padStart(6, "0");
      let crJ =
        hd.cabID +
        "99" +
        String(urt.getMonth() + 1).padStart(2, "0") +
        String(urt.getFullYear()).slice(-2);
      let [nomJu] = await dbuse.query(
        `SELECT COUNT(nomorJurnal) AS nom FROM jurnal WHERE ISNULL(jn) AND nomorJurnal like '${crJ}%'`,
        [cr]
      );
      let nojur = crJ + String(parseInt(nomJu.nom) + 1).padStart(6, "0");
      await dbuse.query(
        {
          namedPlaceholders: true,
          sql: `INSERT INTO transaksi (cabID,tglKirim, tglTerima,nomorBukti,salesID,kodePartner,jnsTrx,status,asal,
          ct,tempo,akunBayar, note, judulTransaksi, nomorJurnal)
        VALUES (:cabID, NOW(), NOW(),:nomorBukti,:salesID,:kodePartner,'J','T',:kodeCab,
          :ct,:tempo,:akunBayar, :note, :note, '${nojur}')`,
        },
        hd
      );
      // insert into detTrans
      delete det.meta;
      await dbuse.batch(
        {
          namedPlaceholders: true,
          sql: `INSERT INTO detTrans (nomorBukti, kodeProduk, qty, jmlHarga, dpp, hpp, jmlKemasan, hargaKemasan, jmlPoint)
        VALUES ('${hd.nomorBukti}', :kodeProduk, :qty, :jmlHarga, :jmlHarga, :hpp, :qty, :jmlHarga/ :qty, :jmlPoint)`,
        },
        det
      );
      // update stok
      for (let i in det) {
        console.log(det[i]);
        if (det[i].jasa === "Y") {
          continue;
        }
        await dbuse.query(
          `UPDATE stock SET ${hd.cabID} = ${hd.cabID} - ? WHERE kodeProduk='${det[i].kodeProduk}'`,
          [det[i].qty]
        );
      }
      // insert jurnal
      await dbuse.query(
        {
          namedPlaceholders: true,
          sql: `INSERT INTO jurnal
        (cabID,nomorJurnal,tglJurnal,jnsJurnal,kodePartner,judulJurnal,tempo,jhp,status,nomorSuratJalan,oleh)
        VALUES (:kodeCab,'${nojur}', NOW(), 'J', :kodePartner, :note, DATE_ADD(now(), INTERVAL :tempo DAY),'${jhp}',:stJ,:nomorBukti,:salesID)`,
        },
        hd
      );
      // insert detJur
      // harga Jual
      hd.biaya = det.reduce((s, m) => s + m.jmlHarga, 0);
      await dbuse.query(
        {
          namedPlaceholders: true,
          sql: `INSERT INTO detJur (nomorJurnal, kodeAkun, DK, nilai, kodePartner, eID)
        VALUES ('${nojur}', :akunBayar, 'D', :biaya, :kodePartner, :salesID)`,
        },
        hd
      );
      let setKodeCat = [...new Set(det.map((a) => a.kodeCat))];
      for (let i in setKodeCat) {
        let tdpp = det
          .filter((a) => a.kodeCat == setKodeCat[i])
          .reduce((ss, b) => jumlah([ss, b.jmlHarga]), 0);
        let thpp = det
          .filter((a) => a.kodeCat == setKodeCat[i])
          .reduce((ss, b) => jumlah([ss, b.hpp]), 0);
        // penjualan
        await dbuse.query(
          `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
          VALUES (?,(SELECT c.akunPenjualan FROM produkCat c
          WHERE c.kodeCat=? ),?,?)`,
          [nojur, setKodeCat[i], "K", tdpp]
        );
        if (thpp !== 0) {
          // hpp
          await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunHpp FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "D", thpp]
          );
          // persediaan
          await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunPersediaan FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "K", thpp]
          );
        }
      }
    }
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  } finally {
    // update serviceCenter status
    let loger = [
      "user",
      req.user.dtAkun.nama,
      "userAkun",
      req.user.dtAkun.akun,
      "aksi",
      hd.status,
      "waktu",
      new Date(),
    ];
    await dbuse.query(
      {
        sql: `UPDATE serviceCenter SET userLog = (SELECT JSON_ARRAY_APPEND(userLog, '$', JSON_OBJECT(?))),
       status = ?, tglAmbil= now(), nomorBukti= '${hd.nomorBukti}' WHERE nomorServis = ?`,
      },
      [loger, hd.status, hd.nomorServis]
    );
    res.send({ st: `Nota Invoice ${hd.nomorBukti}`, ambil: hd });
  }
  res.send({ st: "Tersimpan..." });
});

// service masuk

app.post("/serviceMsk", async (req, res) => {
  let { x } = req.body;
  try {
    let data = await dbuse.query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT s.tglMasuk, s.nomorServis, s.kodePartner, p.namaPartner,
      p.telpPIC, p.tlp, s.status, nb.namaMerk, nb.namaBarang, j.namaJenis, j.jnsPrinter,
      s.nomorSN, s.kodeProduk, s.teknisi, s.kodeJenis FROM serviceCenter s
      LEFT JOIN partner p ON p.kodePartner = s.kodePartner
      LEFT JOIN namaBarang nb ON nb.kodeProduk = s.kodeProduk
      LEFT JOIN jenisService j ON j.kodeJenis = s.kodeJenis
      WHERE s.tglMasuk BETWEEN :tgla AND DATE_ADD(:tglb, INTERVAL 1 DAY) AND s.kodeCab IN (:kodeCab)`,
      },
      x
    );
    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Tidak ditemukan..." });
  }
});
// service selesai => top teknisi, analisa, brand, aktifitas
app.post("/serviceSelesai", async (req, res) => {
  let { x } = req.body;
  try {
    let data = await dbuse.query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT s.tglMasuk, s.tglSelesai, JSON_QUERY(s.analisa, '$') AS analisa, s.nomorServis, s.kodePartner, p.namaPartner,
      p.telpPIC, p.tlp, s.status, nb.namaMerk, nb.namaBarang, j.namaJenis, j.jnsPrinter, s.pointService AS pointTeknisi,
      s.nomorSN, s.kodeProduk, s.teknisi, k.namaKaryawan AS namaTeknisi, s.kodeJenis FROM serviceCenter s
      LEFT JOIN partner p ON p.kodePartner = s.kodePartner
      LEFT JOIN namaBarang nb ON nb.kodeProduk = s.kodeProduk
      LEFT JOIN jenisService j ON j.kodeJenis = s.kodeJenis
      LEFT JOIN karyawan k ON k.kodeKar = s.teknisi
      WHERE s.tglSelesai BETWEEN :tgla AND DATE_ADD(:tglb, INTERVAL 1 DAY) AND s.kodeCab IN (:kodeCab) AND s.status IN ('Selesai', 'Closed')
      ORDER BY s.tglSelesai`,
      },
      x
    );
    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Tidak ditemukan..." });
  }
});
// on proses
app.post("/serviceProses", async (req, res) => {
  let { x } = req.body;
  try {
    let data = await dbuse.query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT s.tglMasuk, s.tglSelesai, JSON_QUERY(s.analisa, '$') AS analisa, s.nomorServis, s.kodePartner, p.namaPartner,
      p.telpPIC, p.tlp, s.status, nb.namaMerk, nb.namaBarang, j.namaJenis, j.jnsPrinter,
      s.nomorSN, s.kodeProduk, s.teknisi, k.namaKaryawan AS namaTeknisi, s.kodeJenis FROM serviceCenter s
      LEFT JOIN partner p ON p.kodePartner = s.kodePartner
      LEFT JOIN namaBarang nb ON nb.kodeProduk = s.kodeProduk
      LEFT JOIN jenisService j ON j.kodeJenis = s.kodeJenis
      LEFT JOIN karyawan k ON k.kodeKar = s.teknisi
      WHERE s.status NOT IN ('Batal', 'Selesai', 'Diambil', 'Closed') AND s.kodeCab IN (:kodeCab)
      ORDER BY s.tglMasuk`,
      },
      x
    );
    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Tidak ditemukan..." });
  }
});
// pending part && proses

app.post("/pendingPart", async (req, res) => {
  let { x } = req.body;
  try {
    let cabang = x.kodeCab.map((a) => {
      return `st.${a}`;
    });
    let data = await dbuse.query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT sk.kodeProduk, sk.qty, s.nomorServis, nb.namaBarang, s.tglMasuk, ${cabang.toString()}
        FROM serviceKomponen sk
        LEFT JOIN serviceCenter s ON s.nomorServis = sk.nomorServis
        LEFT JOIN namaBarang nb ON nb.kodeProduk = sk.kodeProduk
        LEFT JOIN stock st ON st.kodeProduk = sk.kodeProduk
        WHERE s.status = 'part' AND s.kodeCab IN (:kodeCab) AND nb.jasa = 'N'
        ORDER BY s.tglMasuk, s.nomorServis`,
      },
      x
    );
    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Tidak ditemukan..." });
  }
});
app.post("/serviceNotif", async (req, res) => {
  let { x } = req.body;
  let telp = x.telpPIC || x.tlp;
  let telpWA = telp.replace(/^(\+628|628|08|8|6208)/, "628");
  try {
    if (telpWA.length > 8) {
      let idWA;
      switch (x.status) {
        case "Baru":
          idWA = "9b1224e2_66de_4745_a510_7eea39533133:asis_service_arrive";
          break;
        case "Proses":
          idWA = "9b1224e2_66de_4745_a510_7eea39533133:asis_service_start";
          break;
        case "Konfirm":
          idWA = "9b1224e2_66de_4745_a510_7eea39533133:asis_service_confirm";
          break;
        case "Selesai":
          idWA = "9b1224e2_66de_4745_a510_7eea39533133:asis_service_finish";
          break;
        case "Closed":
          idWA = "9b1224e2_66de_4745_a510_7eea39533133:asis_service_greeting";
          break;
        default:
          idWA = "";
      }
      let dta = JSON.stringify({
        phone_number: telpWA, // nomor pelanggan harus menggunakan +62 / 62
        message: {
          type: "template",
          template: {
            template_code_id: idWA, // id template pesan
            payload: [
              {
                position: "body",
                parameters: [
                  // variable pada template
                  {
                    // isian untuk variable no service
                    type: "text",
                    text: x.nomorServis,
                  },
                  {
                    // isian untuk variable nama pelanggan
                    type: "text",
                    text: x.namaPartner,
                  },
                ],
              },
            ],
          },
        },
      });
      // console.log(dta)
      fetch("https://wa01.ocatelkom.co.id/api/v2/push/message", {
        method: "POST",
        body: dta,
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiYXBwbGljYXRpb24iOiI2MjdjODIwZmYzODQwMzAwMmM3ZWRiODMiLCJpYXQiOjE1MTYyMzkwMjJ9.i2ZY0ZZCmHzSoMv0SCGV4_L7XmNm0aBnXR6DWfTbpj0vFb1TpurnuYQUMPdeO16tQFI_5bnF1sMexdE9Sd6-Y7q2OLaTP2dcFq1_Vi5NYdoix_cNkj9kYcejJLb6nzSteT28kp769Gowf8IqATQw-5KOLFBZgcPQY3ZMcPhtfVDQoKJoRardURwAJ6BnFRp4Ld3QSw67Fa0xXuhT4Mnojk9CrcV4Mr1d-dbgY5_hqJg00UyLuSDf4q_thEG5NXMSKmiEIfAl1vOFep_zViQM1NJSO5ewLGMohDayMMpnPi53oNVIGMGyPrLNZ5ZNTE1HAbnS31axIbytfG3wjv3DzA",
        },
      }).then((ok) => {
        if (ok.status === 200) {
          res.send({
            st: `Pesan terkirim ke nomor ${telpWA}...`,
            color: "teal",
          });
        } else {
          res.send({ st: "Pesan tidak terkirim...", color: "pink" });
        }
        // console.log(ok)
      });
    } else {
      res.send({
        st: `Format nomor PIC tidak sesuai ${telpWA} !!!`,
        color: "pink",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Notif WA tidak terkirim..." });
  }
});
//
app.get("/newNotif", async (req, res) => {
  try {
    let [newPR] = await dbuse.query(
      "SELECT COUNT(nomorPR) AS nom FROM PR WHERE statusPR = 'Release' AND cabID !='AM01'"
    );
    let [newPO] = await dbuse.query(
      "SELECT COUNT(nomorPO) AS nom FROM PO WHERE statusPO = 'Open' AND cabID !='AM01'"
    );
    Promise.all([newPR, newPO]).then((data) => {
      res.send({ newPO: newPO.nom, newPR: newPR.nom });
    });
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Tidak ditemukan..." });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err); // eslint-disable-line no-console
  res.status(401).send("Login sik mas bro...");
});

// global function

function jumlah(x) {
  return (
    x.reduce((s, m) => {
      return s + parseInt(Math.round(m * 10 ** 4));
    }, 0) /
    10 ** 4
  );
}

function kali(x, y) {
  let z = y > 4 ? y : 4;
  let c =
    Math.round(
      (x.reduce((a, b) => {
        return a * parseInt(Math.round(b * 10 ** z));
      }, 1) /
        (10 ** z) ** x.length) *
        10 ** z
    ) /
    10 ** z;
  return c;
}

async function konfirm(hd, col, exp, pot) {
  let tt = new Date();
  hd.tglTerima = hd.tglKirim;
  let namaPartner = hd.namaPartner || "";
  // hd.tglTerima = tt.getFullYear()+'-'+(tt.getMonth()+1).toString().padStart(2,'0')+'-'+tt.getDate().toString().padStart(2,'0')
  /*
  1. Update status Transaksi => K: Kirim, T: terima atau selesai
  2. Update Stock cabang konfirm => user.kodeCab == asal || user.kodeCab == tujuan
  3. Update hpp => cabang pembeli bila approve
  4. Create jurnal penjualan cabang penjual asal = user.kodeCab => Piutang, penjualan, hpp, persediaan
  5. Create jurnal pembelian tujuan = user.kodeCab => Hutang, persediaan
  */
  try {
    // hd = header Trx, col = detail trx
    let cabLain =
      hd.ac === "Y" && (hd.jnsTrx === "J" || hd.jnsTrx === "RB")
        ? hd.tujuan
        : hd.ac === "Y" && (hd.jnsTrx === "B" || hd.jnsTrx === "RJ")
        ? hd.asal
        : "";
    let noreff =
      hd.jnsTrx === "RB" || hd.jnsTrx === "RJ"
        ? await dbuse.query(
            "SELECT nomorJurnal FROM transaksi WHERE nomorBukti=?",
            [hd.noreffRetur]
          )
        : [{ nomorJurnal: "" }];
    let ss;
    for (let i in col) {
      // antar cabang => update stock asal dan tujuan,  partner => update asal atau tujuan saja
      let stk;
      let ts =
        hd.ongkir === "Y" ? jumlah([col[i].dpp, col[i].ongkir]) : col[i].dpp;
      let uphap;
      // if (hd.ac === 'N') { hanya Cabang yang melakukan konfirm
      stk =
        hd.jnsTrx === "J" || hd.jnsTrx === "RB"
          ? `${hd.asal} = ${hd.asal}-?`
          : `${hd.tujuan} = ${hd.tujuan}+?`;
      // } else {
      //  stk = `${hd.asal} = ${hd.asal}-?, ${hd.tujuan} = ${hd.tujuan}+?`
      // }
      ss = await dbuse.query(
        `UPDATE stock SET ${stk} WHERE kodeProduk='${col[i].kodeProduk}'`,
        [col[i].qty, col[i].qty]
      );
      // update hpp barang di hd.tujuan / pembeli
      if (hd.ac === "N") {
        if (hd.jnsTrx === "B" || hd.jnsTrx === "ADJ") {
          // hpp = (hppAwal*(stokAwal-qty)+hppBaru)/stok
          uphap = await dbuse.query(
            `UPDATE hpp h LEFT JOIN stock s ON h.kodeProduk=s.kodeProduk
            SET h.${hd.cabID}=((h.${hd.cabID} * (s.${hd.cabID}-?))+ ?)/ IF(s.${hd.cabID} !=0, s.${hd.cabID}, 1) WHERE h.kodeProduk=?`,
            [col[i].qty, ts, col[i].kodeProduk]
          );
        } else if (hd.jnsTrx == "RB") {
          uphap = await dbuse.query(
            `UPDATE hpp h LEFT JOIN stock s ON h.kodeProduk=s.kodeProduk
            SET h.${hd.cabID}=(h.${hd.cabID}*(s.${hd.cabID} + ?) - ?)/ IF(s.${hd.cabID} != 0, s.${hd.cabID}, 1) WHERE h.kodeProduk=?`,
            [col[i].qty, col[i].hpp, col[i].kodeProduk]
          );
        }
      } else {
        if (hd.jnsTrx === "J") {
          // cabLain = cabang pembeli
          console.log("iki dpp+ongkir JB ac " + ts, cabLain, col[i].qty);
          uphap = await dbuse.query(
            `UPDATE hpp h LEFT JOIN stock s ON h.kodeProduk=s.kodeProduk
            SET h.${cabLain}=((h.${cabLain} * (s.${cabLain}-?))+ ?)/ IF(s.${cabLain} != 0, s.${cabLain}, 0) WHERE h.kodeProduk=?`,
            [col[i].qty, ts, col[i].kodeProduk]
          );
          console.log(uphap);
        } else if (hd.jnsTrx === "B") {
          uphap = await dbuse.query(
            `UPDATE hpp h LEFT JOIN stock s ON h.kodeProduk=s.kodeProduk
            SET h.${hd.cabID}=((h.${hd.cabID} * (s.${hd.cabID}-?))+ ?)/ IF(s.${hd.cabID} != 0, s.${hd.cabID}, 1) WHERE h.kodeProduk=?`,
            [col[i].qty, ts, col[i].kodeProduk]
          );
        }
      }
    }
    // jual beli normal
    if (hd.ac === "N") {
      let judul =
        hd.jnsTrx == "J"
          ? `Penjualan ${hd.nomorBukti} ${namaPartner}`
          : hd.jnsTrx == "RJ"
          ? `Retur Penjualan ${hd.nomorBukti} ${namaPartner}`
          : hd.jnsTrx == "RB"
          ? `Retur Pembelian ${hd.nomorBukti} ${namaPartner}`
          : `Pengadaan ${hd.nomorBukti} ${namaPartner}`;
      let jhp =
        hd.ct === "tempo" && hd.jnsTrx === "B"
          ? "H"
          : hd.ct === "tempo" && hd.jnsTrx === "J"
          ? "P"
          : "L";
      let total = col.reduce((a, b) => a + b.dpp + b.ppn, 0);
      let status =
        hd.ct === "tempo" && (hd.jnsTrx == "J" || hd.jnsTrx == "B") ? "O" : "L";
      let urt = hd.tglTerima.replace(/-/gi, "");
      let cr = hd.cabID + "99" + urt.slice(4, 6) + urt.slice(2, 4);
      let urut = await dbuse.query(
        `SELECT COUNT(nomorJurnal) AS nom FROM jurnal WHERE ISNULL(jn) AND nomorJurnal like '${cr}%'`,
        [cr]
      );
      let nojur = cr + String(parseInt(urut[0].nom) + 1).padStart(6, "0");
      console.log(nojur);
      let nomerJurnal = await dbuse.query(
        `INSERT INTO jurnal
        (cabID,nomorJurnal,tglJurnal,jnsJurnal,kodePartner,cabLain,judulJurnal,tempo,jhp,status,nomorSuratJalan,noreff,oleh)
        VALUES (?,?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?,?,?,?,?)`,
        [
          hd.cabID,
          nojur,
          hd.tglTerima,
          hd.jnsTrx,
          hd.kodePartner,
          cabLain,
          judul,
          hd.tglTerima,
          hd.tempo,
          jhp,
          status,
          hd.nomorBukti,
          noreff[0].nomorJurnal,
          hd.salesID,
        ]
      );
      // add detail jurnal penjualan, hpp per kategori produk
      console.log(`Jurnal JB normal`, nomerJurnal);
      let upTrx = await dbuse.query(
        "UPDATE transaksi SET nomorJurnal=?, tglTerima=NOW() WHERE nomorBukti=?",
        [nojur, hd.nomorBukti]
      );

      // if penjualan....
      if (hd.jnsTrx === "J") {
        let kas = hd.akunBayar;
        let kodePartner = hd.ct === "tempo" ? hd.kodePartner : "";
        let eID = hd.salesID;
        if (hd.pot === "Y") {
          dbuse
            .query(
              `INSERT INTO detJur (nomorJurnal, kodeAkun, DK, nilai, desk)
              VALUES (?,?,'D',?,'Potongan penjualan')`,
              [nojur, pot.akunDiskon, pot.diskon]
            )
            .catch((err) => {
              console.log(err);
            });
        }
        // per kategori detail dulu
        // detail jurnal
        // insert total penjualan=> kas / piutang
        let diskon = hd.pot === "Y" && pot.diskon != null ? pot.diskon : 0;
        let totalPiutang =
          hd.ongkir === "Y"
            ? jumlah([exp.biaya, total, -diskon])
            : jumlah([total, -diskon]);
        dbuse
          .query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,eID,cabLain,kodePartner)
          VALUES (?,?,?,?,?,?,?)`,
            [nojur, kas, "D", totalPiutang, eID, cabLain, kodePartner]
          )
          .catch((err) => {
            console.log(err);
          });
        // expedisi
        if (exp) {
          // biaya di penjualan
          if (exp.biaya > 0) {
            let akunExp = "510200010";
            // ongkir ditanggung pembeli => jurnal biaya expedisi
            if (hd.ongkir === "Y") {
              let j = await dbuse.query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai) VALUES (?,?,?,?)`,
                [nojur, akunExp, "K", exp.biaya]
              );
            }
            // jurnal hutang expedisi => nomerJurnal = nojur induk + e
            let HutExpedisi = "210900002";
            dbuse.query(
              `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,kodePartner,cabLain,judulJurnal,tempo,jhp,status,nomorSuratJalan,jn)
              VALUES (?,?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?,'O',?,'e')`,
              [
                hd.cabID,
                nojur + "e",
                hd.tglTerima,
                hd.jnsTrx,
                exp.partnerID,
                cabLain,
                judul,
                hd.tglTerima,
                30,
                "H",
                hd.nomorBukti,
              ]
            );
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,?,?,?)`,
                [nojur + "e", akunExp, "D", exp.biaya]
              )
              .catch((err) => {
                console.log(err);
              });
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,kodePartner)
              VALUES (?,?,?,?,?)`,
                [nojur + "e", HutExpedisi, "K", exp.biaya, exp.partnerID]
              )
              .catch((err) => {
                console.log(err);
              });
          }
          // input Hutang Biaya expedisi
        }
        let setKodeCat = [...new Set(col.map((ss) => ss.kodeCat))];
        console.log(setKodeCat);
        // dpp per akun penjualan
        let tppn = col.reduce((ss, b) => jumlah([ss, b.ppn]), 0);
        let pjk = col.reduce((ss, b) => jumlah([ss, b.dpp]), 0);
        if (tppn > 0) {
          let ppnKel = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,?,?,?)`,
            [nojur, "210400005", "K", tppn]
          );
        }
        // insert detail jurnal per produk kategori
        for (let i in setKodeCat) {
          // penjualan
          let tdpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.dpp]), 0);
          let thpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.hpp]), 0);
          let penjualan = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunPenjualan FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "K", tdpp]
          );
          let hpp = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunHpp FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "D", thpp]
          );
          let persediaan = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunPersediaan FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "K", thpp]
          );
          Promise.all([penjualan, hpp, persediaan]).then((ok) => {
            console.log(ok);
          });
        }
      } else if (hd.jnsTrx === "B" || hd.jnsTrx === "ADJ") {
        // pembelian
        let kas = hd.akunBayar;
        let kodePartner = hd.ct === "tempo" ? hd.kodePartner : "";
        let eID = hd.salesID;
        // insert total biaya => kas / hutang
        dbuse
          .query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,cabLain,kodePartner) VALUES (?,?,?,?,?,?)`,
            [nojur, kas, "K", total, cabLain, kodePartner]
          )
          .catch((err) => {
            console.log(err);
          });
        // Biaya dibayar dimuka => expedisi karena masuk ke hpp persediaan
        if (exp) {
          if (exp.biaya > 0) {
            let akunExp = "510200010";
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai) VALUES (?,?,?,?)`,
                [nojur, akunExp, "K", exp.biaya]
              )
              .catch((err) => {
                console.log(err);
              });
            // jurnal hutang expedisi => nomerJurnal = nojur induk + e
            let HutExpedisi = "210900002";
            dbuse.query(
              `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,kodePartner,cabLain,judulJurnal,tempo,jhp,status,nomorSuratJalan,jn)
              VALUES (?,?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?,'O',?,'e')`,
              [
                hd.cabID,
                nojur + "e",
                hd.tglTerima,
                hd.jnsTrx,
                exp.partnerID,
                cabLain,
                judul,
                hd.tglTerima,
                30,
                "H",
                hd.nomorBukti,
              ]
            );
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,?,?,?)`,
                [nojur + "e", akunExp, "D", exp.biaya]
              )
              .catch((err) => {
                console.log(err);
              });
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,kodePartner)
              VALUES (?,?,?,?,?)`,
                [nojur + "e", HutExpedisi, "K", exp.biaya, exp.partnerID]
              )
              .catch((err) => {
                console.log(err);
              });
          }
        }
        let setKodeCat = [...new Set(col.map((ss) => ss.kodeCat))];
        console.log(setKodeCat);
        // dpp per akun pembelian
        let tppn = col.reduce((ss, b) => jumlah([ss, b.ppn]), 0);
        let pjk = col.reduce((ss, b) => jumlah([ss, b.dpp]), 0);
        if (tppn > 0) {
          let ppnMas = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,?,?,?)`,
            [nojur, "110650005", "D", tppn]
          );
        }
        // insert detail jurnal per produk kategori
        for (let i in setKodeCat) {
          // penjualan
          console.log(setKodeCat[i]);
          let thpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.hpp]), 0);
          let persediaan = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunPersediaan FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "D", thpp]
          );
          Promise.all([persediaan]).then((ok) => {
            console.log(ok);
          });
        }
      } else if (hd.jnsTrx === "RB") {
        // Retur pembelian
        let kas = hd.akunBayar;
        let kodePartner = hd.ct === "tempo" ? hd.kodePartner : "";
        let eID = hd.salesID;
        // insert total biaya => kas / hutang
        dbuse
          .query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,cabLain,kodePartner) VALUES (?,?,?,?,?,?)`,
            [nojur, kas, "D", total, cabLain, kodePartner]
          )
          .catch((err) => {
            console.log(err);
          });
        // Biaya dibayar dimuka => expedisi karena masuk ke hpp persediaan
        if (exp) {
          if (exp.biaya > 0) {
            let akunExp = "510200010";
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai) VALUES (?,?,?,?)`,
                [nojur, akunExp, "K", exp.biaya]
              )
              .catch((err) => {
                console.log(err);
              });
            // jurnal hutang expedisi => nomerJurnal = nojur induk + e
            let HutExpedisi = "210900002";
            dbuse.query(
              `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,kodePartner,cabLain,judulJurnal,tempo,jhp,status,nomorSuratJalan,jn)
              VALUES (?,?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?,'O',?,'e')`,
              [
                hd.cabID,
                nojur + "e",
                hd.tglTerima,
                hd.jnsTrx,
                exp.partnerID,
                cabLain,
                judul,
                hd.tglTerima,
                30,
                "H",
                hd.nomorBukti,
              ]
            );
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,?,?,?)`,
                [nojur + "e", akunExp, "D", exp.biaya]
              )
              .catch((err) => {
                console.log(err);
              });
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,kodePartner)
              VALUES (?,?,?,?,?)`,
                [nojur + "e", HutExpedisi, "K", exp.biaya, exp.partnerID]
              )
              .catch((err) => {
                console.log(err);
              });
          }
        }
        let setKodeCat = [...new Set(col.map((ss) => ss.kodeCat))];
        console.log(setKodeCat);
        // dpp per akun pembelian retur
        let tppn = col.reduce((ss, b) => jumlah([ss, b.ppn]), 0);
        let pjk = col.reduce((ss, b) => jumlah([ss, b.dpp]), 0);
        if (tppn > 0) {
          let ppnMas = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,?,?,?)`,
            [nojur, "110650005", "K", tppn]
          );
        }
        // insert detail jurnal per produk kategori
        for (let i in setKodeCat) {
          console.log(setKodeCat[i]);
          let thpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.hpp]), 0);
          let tsel = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.hpp, -b.dpp]), 0);
          let persediaan = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunPersediaan FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "K", thpp]
          );
          let hpp = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunHpp FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "D", tsel]
          );
          Promise.all([persediaan]).then((ok) => {
            console.log(ok);
          });
        }
      } else if (hd.jnsTrx === "RJ") {
        let kas = hd.akunBayar;
        let kodePartner = hd.ct === "tempo" ? hd.kodePartner : "";
        let eID = hd.salesID;

        // per kategori detail dulu

        // detail jurnal
        // insert total penjualan=> kas / piutang
        let totalPiutang =
          hd.ongkir === "Y" ? jumlah([exp.biaya, total]) : total;
        dbuse
          .query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,eID,cabLain,kodePartner)
          VALUES (?,?,?,?,?,?,?)`,
            [nojur, kas, "K", totalPiutang, eID, cabLain, kodePartner]
          )
          .catch((err) => {
            console.log(err);
          });
        // expedisi
        if (exp) {
          // biaya di penjualan
          if (exp.biaya > 0) {
            let akunExp = "510200010";
            if (hd.ongkir === "Y") {
              dbuse
                .query(
                  `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai) VALUES (?,?,?,?)`,
                  [nojur, akunExp, "K", exp.biaya]
                )
                .catch((err) => {
                  console.log(err);
                });
            }
            // jurnal hutang expedisi => nomerJurnal = nojur induk + e
            let HutExpedisi = "210900002";
            dbuse.query(
              `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,kodePartner,cabLain,judulJurnal,tempo,jhp,status,nomorSuratJalan,jn)
              VALUES (?,?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?,'O',?,'e')`,
              [
                hd.cabID,
                nojur + "e",
                hd.tglTerima,
                hd.jnsTrx,
                exp.partnerID,
                cabLain,
                judul,
                hd.tglTerima,
                30,
                "H",
                hd.nomorBukti,
              ]
            );
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,?,?,?)`,
                [nojur + "e", akunExp, "D", exp.biaya]
              )
              .catch((err) => {
                console.log(err);
              });
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,kodePartner)
              VALUES (?,?,?,?,?)`,
                [nojur + "e", HutExpedisi, "K", exp.biaya, exp.partnerID]
              )
              .catch((err) => {
                console.log(err);
              });
          }
          // input Hutang Biaya expedisi
        }
        let setKodeCat = [...new Set(col.map((ss) => ss.kodeCat))];
        console.log(setKodeCat);
        // dpp per akun penjualan
        let tppn = col.reduce((ss, b) => jumlah([ss, b.ppn]), 0);
        let pjk = col.reduce((ss, b) => jumlah([ss, b.dpp]), 0);
        if (tppn > 0) {
          let ppnKel = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,?,?,?)`,
            [nojur, "210400005", "D", tppn]
          );
        }
        // insert detail jurnal per produk kategori
        for (let i in setKodeCat) {
          // penjualan
          let tdpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.dpp]), 0);
          let thpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.hpp]), 0);
          let penjualan = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunPenjualan FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "D", tdpp]
          );
          let hpp = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunHpp FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "K", thpp]
          );
          let persediaan = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunPersediaan FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "D", thpp]
          );
          Promise.all([penjualan, hpp, persediaan]).then((ok) => {
            console.log(ok);
          });
        }
      }
    } else {
      let judul = hd.judulTransaksi
        ? hd.judulTransaksi
        : hd.jnsTrx == "RB" || hd.jnsTrx == "RJ"
        ? "Retur antar cabang"
        : "Jual beli antar cabang";
      let cabLain =
        hd.ac === "Y" && (hd.jnsTrx === "J" || hd.jnsTrx == "RB")
          ? hd.tujuan
          : hd.ac === "Y" && (hd.jnsTrx === "B" || hd.jnsTrx == "RJ")
          ? hd.asal
          : "";
      let jhp = hd.ct === "tempo" ? "P" : "L";
      let total = col.reduce((a, b) => a + b.dpp + b.ppn, 0);
      let status = hd.ct === "tempo" && hd.jnsTrx == "J" ? "O" : "L";
      let urt = hd.tglTerima.replace(/-/gi, "");
      let cr = hd.cabID + "99" + urt.slice(4, 6) + urt.slice(2, 4);
      let urut = await dbuse.query(
        `SELECT COUNT(nomorJurnal) AS nom FROM jurnal WHERE ISNULL(jn) AND nomorJurnal like '${cr}%'`,
        [cr]
      );
      let nojur = cr + String(parseInt(urut[0].nom) + 1).padStart(6, "0");
      let nomerJurnal = await dbuse.query(
        `INSERT INTO jurnal
        (cabID,nomorJurnal,tglJurnal,jnsJurnal,cabLain,judulJurnal,tempo,jhp,status,nomorSuratJalan,ac,noreff)
        VALUES (?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?,?,?,?,?)`,
        [
          hd.cabID,
          nojur,
          hd.tglTerima,
          hd.jnsTrx,
          cabLain,
          judul,
          hd.tglTerima,
          hd.tempo,
          jhp,
          status,
          hd.nomorBukti,
          hd.ac,
          noreff[0].nomorJurnal,
        ]
      );
      // add detail jurnal penjualan, hpp per kategori produk
      console.log("Jurnal antar cabang", nomerJurnal);
      let upTrx = await dbuse.query(
        "UPDATE transaksi SET nomorJurnal=?, tglTerima=NOW() WHERE nomorBukti=?",
        [nojur, hd.nomorBukti]
      );
      let kas = "110500001"; // piutang dagang
      let hut = "210100001"; // hutang dagang supplier grup Aston
      // normal transaksi
      let totalHP = hd.ongkir === "Y" ? jumlah([total, exp.biaya]) : total;
      if (hd.jnsTrx === "J") {
        let kasMaster = await dbuse.query(
          `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,cabLain,msAC)
            VALUES (?,?,?,?,?,?)`,
          [nojur, kas, "D", totalHP, cabLain, "M"]
        );
        let hutSlave = await dbuse.query(
          `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,cabLain,msAC)
            VALUES (?,?,?,?,?,?)`,
          [nojur, hut, "K", totalHP, cabLain, "S"]
        );
        let setKodeCat = [...new Set(col.map((ss) => ss.kodeCat))];
        console.log(setKodeCat);
        // dpp per akun penjualan
        let tppn = col.reduce((ss, b) => jumlah([ss, b.ppn]), 0);
        let pjk = col.reduce((ss, b) => jumlah([ss, b.dpp]), 0);
        if (tppn > 0) {
          let ppnKel = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,?,?,?)`,
            [nojur, "210400005", "K", tppn]
          );
          let ppnMas = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,msAC)
            VALUES (?,?,?,?,'S')`,
            [nojur, "110650005", "D", tppn],
            "S"
          );
        }
        // jurnal biaya expedisi
        if (exp) {
          // biaya di penjualan
          if (exp.biaya > 0) {
            let akunExp = "510200010";
            // ongkir ditanggung pembeli => jurnal biaya expedisi
            if (hd.ongkir === "Y") {
              let j = await dbuse.query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai) VALUES (?,?,?,?)`,
                [nojur, akunExp, "K", exp.biaya]
              );
            }
            // jurnal hutang expedisi => nomerJurnal = nojur induk + e
            let HutExpedisi = "210900002";
            dbuse.query(
              `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,kodePartner,cabLain,judulJurnal,tempo,jhp,status,nomorSuratJalan,jn)
              VALUES (?,?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?,'O',?,'e')`,
              [
                hd.cabID,
                nojur + "e",
                hd.tglTerima,
                hd.jnsTrx,
                exp.partnerID,
                cabLain,
                judul,
                hd.tglTerima,
                30,
                "H",
                hd.nomorBukti,
              ]
            );
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,?,?,?)`,
                [nojur + "e", akunExp, "D", exp.biaya]
              )
              .catch((err) => {
                console.log(err);
              });
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,kodePartner)
              VALUES (?,?,?,?,?)`,
                [nojur + "e", HutExpedisi, "K", exp.biaya, exp.partnerID]
              )
              .catch((err) => {
                console.log(err);
              });
          }
          // input Hutang Biaya expedisi
        }
        // insert detail jurnal per produk kategori
        for (let i in setKodeCat) {
          // penjualan
          console.log(setKodeCat[i]);
          let tdpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.dpp]), 0);
          let tdppL = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => {
              return hd.ongkir === "Y"
                ? jumlah([ss, b.dpp, b.ongkir])
                : jumlah([ss, b.dpp]);
            }, 0);
          console.log(tdppL);
          let thpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.hpp]), 0);
          console.log(tdpp, thpp);
          let penjualan = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunPenjualan FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "K", tdpp]
          );
          let hpp = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunHpp FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "D", thpp]
          );
          let persediaan = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunPersediaan FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "K", thpp]
          );
          // lawan cabang lain persediaan = harga dpp
          let persediaanL = await dbuse.query(
            `INSERT INTO detJur(kodeAkun,nomorJurnal,DK,nilai,msAC)
            VALUES ((SELECT c.akunPersediaan FROM produkCat c
            WHERE c.kodeCat=?),?,?,?,'S')`,
            [setKodeCat[i], nojur, "D", tdppL]
          );
          Promise.all([penjualan, hpp, persediaan, persediaanL]).then((ok) => {
            console.log(ok);
          });
        }
      } else {
        // retur antar cabang
        let kasMaster = await dbuse.query(
          `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,cabLain,msAC)
            VALUES (?,?,?,?,?,?)`,
          [nojur, kas, "K", totalHP, cabLain, "M"]
        );
        let hutSlave = await dbuse.query(
          `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,cabLain,msAC)
            VALUES (?,?,?,?,?,?)`,
          [nojur, hut, "D", totalHP, cabLain, "S"]
        );
        let setKodeCat = [...new Set(col.map((ss) => ss.kodeCat))];
        console.log(setKodeCat);
        // dpp per akun penjualan
        let tppn = col.reduce((ss, b) => jumlah([ss, b.ppn]), 0);
        let pjk = col.reduce((ss, b) => jumlah([ss, b.dpp]), 0);
        if (tppn > 0) {
          let ppnKel = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,?,?,?)`,
            [nojur, "210400005", "D", tppn]
          );
          let ppnMas = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,msAC)
            VALUES (?,?,?,?,'S')`,
            [nojur, "110650005", "K", tppn],
            "S"
          );
        }
        // insert detail jurnal per produk kategori
        for (let i in setKodeCat) {
          // penjualan
          console.log(setKodeCat[i]);
          let tdpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.dpp]), 0);
          let thpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.hpp]), 0);
          console.log(tdpp, thpp);
          let penjualan = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunPenjualan FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "D", tdpp]
          );
          let hpp = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunHpp FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "K", thpp]
          );
          let persediaan = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunPersediaan FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "D", thpp]
          );
          // lawan cabang lain persediaan = harga dpp
          let persediaanL = await dbuse.query(
            `INSERT INTO detJur(kodeAkun,nomorJurnal,DK,nilai,msAC)
            VALUES ((SELECT c.akunPersediaan FROM produkCat c
            WHERE c.kodeCat=?),?,?,?,'S')`,
            [setKodeCat[i], nojur, "K", tdpp]
          );
          Promise.all([penjualan, hpp, persediaan, persediaanL]).then((ok) => {
            console.log(ok);
          });
        }
      }
    }

    //   res.send({st:'Selesai...'})
  } catch (err) {
    console.log(err);

    //   res.status(501).send({st:'gagal simpan...'})
  }
}
app.post("/cekRabalance", man, async (req, res) => {
  let data = [];
  try {
    data = await dbuse.query({
      namedPlaceholders: true,
      sql: `SELECT SUM(IF(d.DK = 'D',d.nilai, -d.nilai)) AS balance, j.nomorSuratJalan AS nomorBukti, j.status, t.status AS statusTrx
        FROM detJur d LEFT JOIN jurnal j ON d.nomorJurnal = j.nomorJurnal
        LEFT JOIN transaksi t ON j.nomorSuratJalan = t.nomorBukti
        WHERE j.status NOT IN ('B') AND t.status != 'B' AND length(j.nomorSuratJalan > 2)
        GROUP BY d.nomorJurnal
        HAVING balance != 0`,
    });
    delete data.meta;
    res.send(data);
  } catch (error) {
    console.log(error);
  } finally {
    for (let a in data) {
      console.log(a);
      await prosesRepair(a);
    }
  }
});

app.post("/cekRabalanceServis", man, async (req, res) => {
  let { x } = req.body;
  try {
    await prosesRepairServis(x);
    res.send("oke");
  } catch (error) {
    console.log(error);
  } finally {
  }
});

async function prosesRepairServis(x) {
  try {
    // let [cSt] = await dbuse.query('SELECT status, nomorBukti FROM transaksi WHERE nomorBukti=?', [x.nomorBukti])
    let [hd] = await dbuse.query(
      `SELECT t.*, DATE_FORMAT(t.tglKirim,'%Y-%m-%d') AS tglKirim, p.namaPartner
      FROM transaksi t
        LEFT JOIN partner p ON t.kodePartner=p.kodePartner
      WHERE nomorBukti=?`,
      [x.nomorBukti]
    );
    let det = await dbuse.query(
      `SELECT d.*,p.kodeCat FROM detTrans d
        LEFT JOIN produk p ON d.kodeProduk=p.kodeProduk
        LEFT JOIN produkCat c ON p.kodeCat=c.kodeCat WHERE d.nomorBukti = ?`,
      [x.nomorBukti]
    );
    let [exp] = await dbuse.query("SELECT * FROM expedisi WHERE nomorBukti=?", [
      x.nomorBukti,
    ]);
    let [pot] = await dbuse.query(
      "SELECT * FROM potonganHarga WHERE nomorBukti=?",
      [x.nomorBukti]
    );
    if (["T", "D"].some((a) => a === x.status)) {
      Promise.all([hd, det, exp, pot])
        .then((data) => {
          delete det.meta;
          repairJurnalServis(hd, det, exp, pot);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  } catch (err) {
    console.log(err);
  } finally {
    await dbuse.query(
      `INSERT INTO userLog (jnsLog, akun, nomorBukti, deskripsi) VALUES ('Approve',?,?,?)`,
      ["sistem", x.nomorBukti, `status ${x.status}`]
    );
  }
}

async function repairJurnalServis(hd, col, exp, pot) {
  let total = col.reduce((a, b) => a + b.dpp + b.ppn, 0);
  let nojur = hd.nomorJurnal;
  let cabLain =
    hd.ancab === "Y" && hd.status === "D"
      ? hd.tujuan
      : hd.ancab === "Y" && hd.status === "T"
      ? hd.asal
      : "";
  try {
    if (hd.jnsTrx === "J") {
      // await dbuse.query('DELETE FROM detJur WHERE nomorJurnal = ?', [nojur])
      let kas = hd.akunBayar;
      let kodePartner = hd.ct === "tempo" ? hd.kodePartner : "";
      let eID = hd.salesID;
      /* if (hd.pot === 'Y') {
        dbuse.query(`INSERT INTO detJur (nomorJurnal, kodeAkun, DK, nilai, desk)
            VALUES (?,?,'D',?,'Potongan penjualan')`, [nojur, pot.akunDiskon, pot.diskon])
          .catch(err => {
            console.log(err)
          })
      } */
      // per kategori detail dulu
      // detail jurnal
      // insert total penjualan=> kas / piutang
      let diskon = hd.pot === "Y" && pot.diskon != null ? pot.diskon : 0;
      let totalPiutang =
        hd.ongkir === "Y"
          ? jumlah([exp.biaya, total, -diskon])
          : jumlah([total, -diskon]);
      /* dbuse.query(`INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,eID,cabLain,kodePartner)
        VALUES (?,?,?,?,?,?,?)`, [nojur, kas, 'D', totalPiutang, eID, cabLain, kodePartner])
        .catch(err => {
          console.log(err)
        }) */
      // expedisi
      /* if (exp) {
        // biaya di penjualan
        if (exp.biaya > 0) {
          let akunExp = '510200010'
          // ongkir ditanggung pembeli => jurnal biaya expedisi
          if (hd.ongkir === 'Y') {
            let j = await dbuse.query(`INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai) VALUES (?,?,?,?)`, [nojur, akunExp, 'K', exp.biaya])
          }
          // jurnal hutang expedisi => nomerJurnal = nojur induk + e
          let HutExpedisi = '210900002'
          dbuse.query(`INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,kodePartner,cabLain,judulJurnal,tempo,jhp,status,nomorSuratJalan,jn)
            VALUES (?,?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?,'O',?,'e')`,
          [hd.cabID, nojur + 'e', hd.tglTerima, hd.jnsTrx, exp.partnerID, cabLain, judul, hd.tglTerima, 30, 'H', hd.nomorBukti])
          dbuse.query(`INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,?,?,?)`, [nojur + 'e', akunExp, 'D', exp.biaya])
            .catch(err => {
              console.log(err)
            })
          dbuse.query(`INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,kodePartner)
            VALUES (?,?,?,?,?)`, [nojur + 'e', HutExpedisi, 'K', exp.biaya, exp.partnerID])
            .catch(err => {
              console.log(err)
            })
        }
        // input Hutang Biaya expedisi
      } */
      // point Membership
      /* if (hd.ac === 'N' && hd.cabID !== 'AM01' && hd.totalPoint > 0 && hd.ancab !== 'Y') {
        const jpm = [
          { nomorJurnal: nojur, kodeAkun: '510100007', DK: 'D', nilai: hd.totalPoint, desk: `Point Member` },
          { nomorJurnal: nojur, kodeAkun: '210500003', DK: 'K', nilai: hd.totalPoint, desk: `Point Member` }
        ]
        await dbuse.batch({
          namedPlaceholders: true,
          sql: `INSERT INTO detJur (nomorJurnal,kodeAkun,DK,nilai, desk)
        VALUES (:nomorJurnal,:kodeAkun,:DK,:nilai, :desk)`
        }, jpm)
      } */
      let setKodeCat = [...new Set(col.map((ss) => ss.kodeCat))];
      // console.log(setKodeCat)
      // dpp per akun penjualan
      /* let tppn = col.reduce((ss, b) => jumlah([ss, b.ppn]), 0)
      let pjk = col.reduce((ss, b) => jumlah([ss, b.dpp]), 0)
      if (tppn > 0) {
        let ppnKel = await dbuse.query(`INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
          VALUES (?,?,?,?)`, [nojur, '210400005', 'K', tppn])
      } */
      // insert detail jurnal per produk kategori
      for (let i in setKodeCat) {
        // penjualan
        let tdpp = col
          .filter((a) => a.kodeCat == setKodeCat[i])
          .reduce((ss, b) => jumlah([ss, b.dpp]), 0);
        let thpp = col
          .filter((a) => a.kodeCat == setKodeCat[i])
          .reduce((ss, b) => jumlah([ss, b.hpp]), 0);
        /* let penjualan = await dbuse.query(`INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
          VALUES (?,(SELECT c.akunPenjualan FROM produkCat c
          WHERE c.kodeCat=? ),?,?)`, [nojur, setKodeCat[i], 'K', tdpp]) */
        if (thpp !== 0) {
          // hpp
          let [cekAkun] = await dbuse.query(
            `SELECT * FROM detJur
            WHERE nomorJurnal = ? AND kodeAkun = (SELECT c.akunHpp FROM produkCat c
            WHERE c.kodeCat=? )`,
            [nojur, setKodeCat[i]]
          );
          if (cekAkun) {
            await dbuse.query(
              `UPDATE detJur SET nilai = ? WHERE nomorJurnal = ? AND kodeAkun = ?`,
              [thpp, nojur, cekAkun.kodeAkun]
            );
          } else {
            await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,(SELECT c.akunHpp FROM produkCat c
              WHERE c.kodeCat=? ),?,?)`,
              [nojur, setKodeCat[i], "D", thpp]
            );
          }
          let [cekAkunP] = await dbuse.query(
            `SELECT * FROM detJur
          WHERE nomorJurnal = ? AND kodeAkun = (SELECT c.akunPersediaan FROM produkCat c
          WHERE c.kodeCat=? )`,
            [nojur, setKodeCat[i]]
          );
          // persediaan
          if (cekAkunP) {
            await dbuse.query(
              `UPDATE detJur SET nilai = ? WHERE nomorJurnal = ? AND kodeAkun = ?`,
              [thpp, nojur, cekAkunP.kodeAkun]
            );
          } else {
            await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,(SELECT c.akunPersediaan FROM produkCat c
              WHERE c.kodeCat=? ),?,?)`,
              [nojur, setKodeCat[i], "K", thpp]
            );
          }
        }
        /* Promise.all([penjualan])
          .then(ok => {
            console.log(ok)
          }) */
      }
    }
  } catch (error) {
    console.log(error);
  }
}

async function prosesRepair(x) {
  try {
    // let [cSt] = await dbuse.query('SELECT status, nomorBukti FROM transaksi WHERE nomorBukti=?', [x.nomorBukti])
    let [hd] = await dbuse.query(
      `SELECT t.*, DATE_FORMAT(t.tglKirim,'%Y-%m-%d') AS tglKirim, p.namaPartner
      FROM transaksi t
        LEFT JOIN partner p ON t.kodePartner=p.kodePartner
      WHERE nomorBukti=?`,
      [x.nomorBukti]
    );
    let det = await dbuse.query(
      `SELECT d.*,p.kodeCat FROM detTrans d
        LEFT JOIN produk p ON d.kodeProduk=p.kodeProduk
        LEFT JOIN produkCat c ON p.kodeCat=c.kodeCat WHERE d.nomorBukti = ?`,
      [x.nomorBukti]
    );
    let [exp] = await dbuse.query("SELECT * FROM expedisi WHERE nomorBukti=?", [
      x.nomorBukti,
    ]);
    let [pot] = await dbuse.query(
      "SELECT * FROM potonganHarga WHERE nomorBukti=?",
      [x.nomorBukti]
    );
    if (["T", "D"].some((a) => a === x.status)) {
      Promise.all([hd, det, exp, pot])
        .then((data) => {
          delete det.meta;
          repairJurnal(hd, det, exp, pot);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  } catch (err) {
    console.log(err);
  } finally {
    await dbuse.query(
      `INSERT INTO userLog (jnsLog, akun, nomorBukti, deskripsi) VALUES ('Approve',?,?,?)`,
      ["sistem", x.nomorBukti, `status ${x.status}`]
    );
  }
}
async function repairJurnal(hd, col, exp, pot) {
  let total = col.reduce((a, b) => a + b.dpp + b.ppn, 0);
  let nojur = hd.nomorJurnal;
  let cabLain =
    hd.ancab === "Y" && hd.status === "D"
      ? hd.tujuan
      : hd.ancab === "Y" && hd.status === "T"
      ? hd.asal
      : "";
  try {
    if (hd.jnsTrx === "J") {
      await dbuse.query("DELETE FROM detJur WHERE nomorJurnal = ?", [nojur]);
      let kas = hd.akunBayar;
      let kodePartner = hd.ct === "tempo" ? hd.kodePartner : "";
      let eID = hd.salesID;
      if (hd.pot === "Y") {
        dbuse
          .query(
            `INSERT INTO detJur (nomorJurnal, kodeAkun, DK, nilai, desk)
            VALUES (?,?,'D',?,'Potongan penjualan')`,
            [nojur, pot.akunDiskon, pot.diskon]
          )
          .catch((err) => {
            console.log(err);
          });
      }
      // per kategori detail dulu
      // detail jurnal
      // insert total penjualan=> kas / piutang
      let diskon = hd.pot === "Y" && pot.diskon != null ? pot.diskon : 0;
      let totalPiutang =
        hd.ongkir === "Y"
          ? jumlah([exp.biaya, total, -diskon])
          : jumlah([total, -diskon]);
      dbuse
        .query(
          `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,eID,cabLain,kodePartner)
        VALUES (?,?,?,?,?,?,?)`,
          [nojur, kas, "D", totalPiutang, eID, cabLain, kodePartner]
        )
        .catch((err) => {
          console.log(err);
        });
      // expedisi
      if (exp) {
        // biaya di penjualan
        if (exp.biaya > 0) {
          let akunExp = "510200010";
          // ongkir ditanggung pembeli => jurnal biaya expedisi
          if (hd.ongkir === "Y") {
            let j = await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai) VALUES (?,?,?,?)`,
              [nojur, akunExp, "K", exp.biaya]
            );
          }
          // jurnal hutang expedisi => nomerJurnal = nojur induk + e
          let HutExpedisi = "210900002";
          dbuse.query(
            `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,kodePartner,cabLain,judulJurnal,tempo,jhp,status,nomorSuratJalan,jn)
            VALUES (?,?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?,'O',?,'e')`,
            [
              hd.cabID,
              nojur + "e",
              hd.tglTerima,
              hd.jnsTrx,
              exp.partnerID,
              cabLain,
              judul,
              hd.tglTerima,
              30,
              "H",
              hd.nomorBukti,
            ]
          );
          dbuse
            .query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,?,?,?)`,
              [nojur + "e", akunExp, "D", exp.biaya]
            )
            .catch((err) => {
              console.log(err);
            });
          dbuse
            .query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,kodePartner)
            VALUES (?,?,?,?,?)`,
              [nojur + "e", HutExpedisi, "K", exp.biaya, exp.partnerID]
            )
            .catch((err) => {
              console.log(err);
            });
        }
        // input Hutang Biaya expedisi
      }
      // point Membership
      if (
        hd.ac === "N" &&
        hd.cabID !== "AM01" &&
        hd.totalPoint > 0 &&
        hd.ancab !== "Y"
      ) {
        const jpm = [
          {
            nomorJurnal: nojur,
            kodeAkun: "510100007",
            DK: "D",
            nilai: hd.totalPoint,
            desk: `Point Member`,
          },
          {
            nomorJurnal: nojur,
            kodeAkun: "210500003",
            DK: "K",
            nilai: hd.totalPoint,
            desk: `Point Member`,
          },
        ];
        await dbuse.batch(
          {
            namedPlaceholders: true,
            sql: `INSERT INTO detJur (nomorJurnal,kodeAkun,DK,nilai, desk)
        VALUES (:nomorJurnal,:kodeAkun,:DK,:nilai, :desk)`,
          },
          jpm
        );
      }
      let setKodeCat = [...new Set(col.map((ss) => ss.kodeCat))];
      // console.log(setKodeCat)
      // dpp per akun penjualan
      let tppn = col.reduce((ss, b) => jumlah([ss, b.ppn]), 0);
      let pjk = col.reduce((ss, b) => jumlah([ss, b.dpp]), 0);
      if (tppn > 0) {
        let ppnKel = await dbuse.query(
          `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
          VALUES (?,?,?,?)`,
          [nojur, "210400005", "K", tppn]
        );
      }
      // insert detail jurnal per produk kategori
      for (let i in setKodeCat) {
        // penjualan
        let tdpp = col
          .filter((a) => a.kodeCat == setKodeCat[i])
          .reduce((ss, b) => jumlah([ss, b.dpp]), 0);
        let thpp = col
          .filter((a) => a.kodeCat == setKodeCat[i])
          .reduce((ss, b) => jumlah([ss, b.hpp]), 0);
        let penjualan = await dbuse.query(
          `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
          VALUES (?,(SELECT c.akunPenjualan FROM produkCat c
          WHERE c.kodeCat=? ),?,?)`,
          [nojur, setKodeCat[i], "K", tdpp]
        );
        if (thpp !== 0) {
          // hpp
          await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunHpp FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "D", thpp]
          );
          // persediaan
          await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunPersediaan FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "K", thpp]
          );
        }
        Promise.all([penjualan]).then((ok) => {
          console.log(ok);
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
}

async function trxTerima(hd, col, exp, pot) {
  let tt = new Date();
  hd.tglTerima = hd.tglKirim;
  hd.totalPoint = col.reduce((a, b) => a + b.jmlPoint, 0);
  let namaPartner = hd.namaPartner || "";
  try {
    let cabLain =
      hd.ancab === "Y" && hd.status === "D"
        ? hd.tujuan
        : hd.ancab === "Y" && hd.status === "T"
        ? hd.asal
        : "";
    let noreff =
      hd.jnsTrx == "RB" || hd.jnsTrx == "RJ"
        ? await dbuse.query(
            "SELECT nomorJurnal FROM transaksi WHERE nomorBukti=?",
            [hd.noreffRetur]
          )
        : [{ nomorJurnal: "" }];
    let ss;
    for (let i in col) {
      // if (col[i].kodeCat === '17' || col[i].kodeCat === '19') { continue }
      if (col[i].jasa === "Y") {
        continue;
      }
      //   continue
      // antar cabang => update stock asal dan tujuan,  partner => update asal atau tujuan saja
      let stk;
      let ts =
        hd.ongkir === "Y" ? jumlah([col[i].dpp, col[i].ongkir]) : col[i].dpp;
      let uphap;
      if (hd.ancab !== "Y" || hd.status == "D") {
        // cabang penjual atau jualbeli langsung
        stk =
          hd.jnsTrx === "J" || hd.jnsTrx === "RB"
            ? `${hd.asal} = ${hd.asal}-?`
            : `${hd.tujuan} = ${hd.tujuan}+?`;

        ss = await dbuse.query(
          `UPDATE stock SET ${stk} WHERE kodeProduk='${col[i].kodeProduk}'`,
          [col[i].qty, col[i].qty]
        );
      } else if (hd.ancab === "Y" && hd.status == "T") {
        // cabang pembeli antar cabang => cabLain => tujuan
        stk =
          hd.jnsTrx === "J" || hd.jnsTrx === "RB"
            ? `${hd.tujuan} = ${hd.tujuan}+?`
            : `${hd.asal} = ${hd.asal}-?`;
        ss = await dbuse.query(
          `UPDATE stock SET ${stk} WHERE kodeProduk='${col[i].kodeProduk}'`,
          [col[i].qty, col[i].qty]
        );
      }
      // update hpp barang di hd.tujuan / pembeli
      if (hd.ac === "N") {
        switch (hd.jnsTrx) {
          case "B":
          case "ADJ":
            await dbuse.query(
              {
                namedPlaceholders: true,
                sql: `UPDATE hpp h LEFT JOIN (SELECT b.kodeProduk,
                SUM(
                  CASE
                  WHEN t.status = 'T' AND t.tujuan = '${hd.cabID}' THEN +d.qty
                  WHEN t.asal = '${hd.cabID}' THEN -d.qty
                  ELSE 0
                  END
                ) AS saldo,
                SUM(
                  CASE
                  WHEN t.jnsTrx='RJ' AND t.tujuan='${hd.cabID}' THEN d.hpp
                  WHEN t.tujuan='${hd.cabID}' AND t.ongkir= 'Y' AND t.status = 'T' THEN d.dpp + d.ongkir
                  WHEN t.tujuan='${hd.cabID}' AND t.ongkir= 'N' AND t.status = 'T' THEN d.dpp
                  WHEN (t.ac!= 'Y' AND t.jnsTrx!='B') AND t.tujuan='${hd.cabID}' AND t.status = 'T' THEN d.hpp
                  WHEN t.asal='${hd.cabID}' THEN -d.hpp
                  ELSE 0
                  END
                ) AS saldoHpp,
                nb.kodeCat
              FROM detTrans d left join produk b on d.kodeProduk=b.kodeProduk left join transaksi t on d.nomorBukti=t.nomorBukti
                  LEFT JOIN namaBarang nb ON nb.kodeProduk=d.kodeProduk
              WHERE (t.asal='${hd.cabID}' or t.tujuan='${hd.cabID}') AND t.status NOT IN ('W','B') AND nb.jasa != 'Y' AND d.kodeProduk = :kodeProduk
              group by d.kodeProduk
              ) s ON s.kodeProduk = h.kodeProduk SET h.${hd.cabID} = IF(s.saldoHpp, s.saldoHpp,0) / IF(s.saldo != 0, s.saldo, 1) WHERE h.kodeProduk= :kodeProduk`,
              },
              col[i]
            );
            break;
          case "RB":
            uphap = await dbuse.query(
              `UPDATE hpp h LEFT JOIN stock s ON h.kodeProduk=s.kodeProduk
                SET h.${hd.cabID}=IF(s.${hd.cabID} = 0, 0, (h.${hd.cabID}*(s.${hd.cabID} + ?) - ?)/ if(s.${hd.cabID} != 0, s.${hd.cabID}, 1)) WHERE h.kodeProduk=?`,
              [col[i].qty, col[i].hpp, col[i].kodeProduk]
            );
            break;
          case "J":
            // cabLain = cabang pembeli
            console.log("iki dpp+ongkir JB ac " + ts, cabLain, col[i].qty);
            if (hd.status == "T" && hd.ancab === "Y") {
              await dbuse.query(
                {
                  namedPlaceholders: true,
                  sql: `UPDATE hpp h LEFT JOIN (SELECT b.kodeProduk,
                  SUM(
                    CASE
                    WHEN t.status = 'T' AND t.tujuan = '${cabLain}' THEN +d.qty
                    WHEN t.asal = '${cabLain}' THEN -d.qty
                    ELSE 0
                    END
                  ) AS saldo,
                  SUM(
                    CASE
                    WHEN t.jnsTrx='RJ' AND t.tujuan='${cabLain}' THEN d.hpp
                    WHEN t.tujuan='${cabLain}' AND t.ongkir= 'Y' AND t.status = 'T' THEN d.dpp + d.ongkir
                    WHEN t.tujuan='${cabLain}' AND t.ongkir= 'N' AND t.status = 'T' THEN d.dpp
                    WHEN (t.ac!= 'Y' AND t.jnsTrx!='B') AND t.tujuan='${cabLain}' AND t.status = 'T' THEN d.hpp
                    WHEN t.asal='${cabLain}' THEN -d.hpp
                    ELSE 0
                    END
                  ) AS saldoHpp,
                  nb.kodeCat
                FROM detTrans d left join produk b on d.kodeProduk=b.kodeProduk left join transaksi t on d.nomorBukti=t.nomorBukti
                    LEFT JOIN namaBarang nb ON nb.kodeProduk=d.kodeProduk
                WHERE (t.asal='${cabLain}' or t.tujuan='${cabLain}') AND t.status NOT IN ('W','B') AND nb.jasa != 'Y' AND d.kodeProduk = :kodeProduk
                group by d.kodeProduk
                ) s ON s.kodeProduk = h.kodeProduk SET h.${cabLain} = s.saldoHpp / if(s.saldo != 0, s.saldo, 1) WHERE h.kodeProduk= :kodeProduk`,
                },
                col[i]
              );
            }
            break;
          default:
            break;
        }
      } else {
        if (hd.jnsTrx === "J") {
          // cabLain = cabang pembeli
          console.log("iki dpp+ongkir JB ac lawas" + ts, cabLain, col[i].qty);
          uphap = await dbuse.query(
            `UPDATE hpp h LEFT JOIN stock s ON h.kodeProduk=s.kodeProduk
            SET h.${cabLain}=((h.${cabLain} * (s.${cabLain}-?))+ ?)/IF(s.${cabLain} != 0, s.${cabLain}, 1) WHERE h.kodeProduk=?`,
            [col[i].qty, ts, col[i].kodeProduk]
          );
          console.log(uphap);
        } else if (hd.jnsTrx === "B") {
          uphap = await dbuse.query(
            `UPDATE hpp h LEFT JOIN stock s ON h.kodeProduk=s.kodeProduk
            SET h.${hd.cabID}=((h.${hd.cabID} * (s.${hd.cabID}-?))+ ?)/ IF(s.${hd.cabID} != 0, s.${hd.cabID}, 1) WHERE h.kodeProduk=?`,
            [col[i].qty, ts, col[i].kodeProduk]
          );
        }
      }
    }
    // jual beli normal
    if (hd.ancab !== "Y") {
      let judul =
        hd.jnsTrx == "J"
          ? `Penjualan ${hd.nomorBukti} ${namaPartner}`
          : hd.jnsTrx == "RJ"
          ? `Retur Penjualan ${hd.nomorBukti} ${namaPartner}`
          : hd.jnsTrx == "RB"
          ? `Retur Pembelian ${hd.nomorBukti} ${namaPartner}`
          : `Pengadaan ${hd.nomorBukti} ${namaPartner}`;
      let jhp =
        hd.ct === "tempo" && hd.jnsTrx === "B"
          ? "H"
          : hd.ct === "tempo" && hd.jnsTrx === "J"
          ? "P"
          : "L";
      let total = col.reduce((a, b) => a + b.dpp + b.ppn, 0);
      let status =
        hd.ct === "tempo" && (hd.jnsTrx == "J" || hd.jnsTrx == "B") ? "O" : "L";
      let urt = hd.tglTerima.replace(/-/gi, "");
      let cr = hd.cabID + "99" + urt.slice(4, 6) + urt.slice(2, 4);
      let urut = await dbuse.query(
        `SELECT COUNT(nomorJurnal) AS nom FROM jurnal WHERE ISNULL(jn) AND nomorJurnal like '${cr}%'`,
        [cr]
      );
      let nojur = cr + String(parseInt(urut[0].nom) + 1).padStart(6, "0");
      console.log(nojur);
      let nomerJurnal = await dbuse.query(
        `INSERT INTO jurnal
        (cabID,nomorJurnal,tglJurnal,jnsJurnal,kodePartner,cabLain,judulJurnal,tempo,jhp,status,nomorSuratJalan,noreff,oleh)
        VALUES (?,?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?,?,?,?,?)`,
        [
          hd.cabID,
          nojur,
          hd.tglTerima,
          hd.jnsTrx,
          hd.kodePartner,
          cabLain,
          judul,
          hd.tglTerima,
          hd.tempo,
          jhp,
          status,
          hd.nomorBukti,
          noreff[0].nomorJurnal,
          hd.salesID,
        ]
      );
      // add detail jurnal penjualan, hpp per kategori produk
      console.log(`Jurnal JB normal`, nomerJurnal);
      let upTrx = await dbuse.query(
        "UPDATE transaksi SET nomorJurnal=?, tglTerima=NOW() WHERE nomorBukti=?",
        [nojur, hd.nomorBukti]
      );

      // if penjualan....
      if (hd.jnsTrx === "J") {
        let kas = hd.akunBayar;
        let kodePartner = hd.ct === "tempo" ? hd.kodePartner : "";
        let eID = hd.salesID;
        if (hd.pot === "Y") {
          dbuse
            .query(
              `INSERT INTO detJur (nomorJurnal, kodeAkun, DK, nilai, desk)
              VALUES (?,?,'D',?,'Potongan penjualan')`,
              [nojur, pot.akunDiskon, pot.diskon]
            )
            .catch((err) => {
              console.log(err);
            });
        }
        // per kategori detail dulu
        // detail jurnal
        // insert total penjualan=> kas / piutang
        let diskon = hd.pot === "Y" && pot.diskon != null ? pot.diskon : 0;
        let totalPiutang =
          hd.ongkir === "Y"
            ? jumlah([exp.biaya, total, -diskon])
            : jumlah([total, -diskon]);
        dbuse
          .query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,eID,cabLain,kodePartner)
          VALUES (?,?,?,?,?,?,?)`,
            [nojur, kas, "D", totalPiutang, eID, cabLain, kodePartner]
          )
          .catch((err) => {
            console.log(err);
          });
        // expedisi
        if (exp) {
          // biaya di penjualan
          if (exp.biaya > 0) {
            let akunExp = "510200010";
            // ongkir ditanggung pembeli => jurnal biaya expedisi
            if (hd.ongkir === "Y") {
              let j = await dbuse.query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai) VALUES (?,?,?,?)`,
                [nojur, akunExp, "K", exp.biaya]
              );
            }
            // jurnal hutang expedisi => nomerJurnal = nojur induk + e
            let HutExpedisi = "210900002";
            dbuse.query(
              `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,kodePartner,cabLain,judulJurnal,tempo,jhp,status,nomorSuratJalan,jn)
              VALUES (?,?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?,'O',?,'e')`,
              [
                hd.cabID,
                nojur + "e",
                hd.tglTerima,
                hd.jnsTrx,
                exp.partnerID,
                cabLain,
                judul,
                hd.tglTerima,
                30,
                "H",
                hd.nomorBukti,
              ]
            );
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,?,?,?)`,
                [nojur + "e", akunExp, "D", exp.biaya]
              )
              .catch((err) => {
                console.log(err);
              });
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,kodePartner)
              VALUES (?,?,?,?,?)`,
                [nojur + "e", HutExpedisi, "K", exp.biaya, exp.partnerID]
              )
              .catch((err) => {
                console.log(err);
              });
          }
          // input Hutang Biaya expedisi
        }
        // point Membership
        if (
          hd.ac === "N" &&
          hd.cabID !== "AM01" &&
          hd.totalPoint > 0 &&
          hd.ancab !== "Y"
        ) {
          const jpm = [
            {
              nomorJurnal: nojur,
              kodeAkun: "510100007",
              DK: "D",
              nilai: hd.totalPoint,
              desk: `Point Member`,
            },
            {
              nomorJurnal: nojur,
              kodeAkun: "210500003",
              DK: "K",
              nilai: hd.totalPoint,
              desk: `Point Member`,
            },
          ];
          let jm = await dbuse.batch(
            {
              namedPlaceholders: true,
              sql: `INSERT INTO detJur (nomorJurnal,kodeAkun,DK,nilai, desk)
          VALUES (:nomorJurnal,:kodeAkun,:DK,:nilai, :desk)`,
            },
            jpm
          );
        }
        let setKodeCat = [...new Set(col.map((ss) => ss.kodeCat))];
        // console.log(setKodeCat)
        // dpp per akun penjualan
        let tppn = col.reduce((ss, b) => jumlah([ss, b.ppn]), 0);
        let pjk = col.reduce((ss, b) => jumlah([ss, b.dpp]), 0);
        if (tppn > 0) {
          let ppnKel = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,?,?,?)`,
            [nojur, "210400005", "K", tppn]
          );
        }
        // insert detail jurnal per produk kategori
        for (let i in setKodeCat) {
          // penjualan
          let tdpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.dpp]), 0);
          let thpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.hpp]), 0);
          let penjualan = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunPenjualan FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "K", tdpp]
          );
          if (thpp !== 0) {
            // hpp
            await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,(SELECT c.akunHpp FROM produkCat c
              WHERE c.kodeCat=? ),?,?)`,
              [nojur, setKodeCat[i], "D", thpp]
            );
            // persediaan
            await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,(SELECT c.akunPersediaan FROM produkCat c
              WHERE c.kodeCat=? ),?,?)`,
              [nojur, setKodeCat[i], "K", thpp]
            );
          }
          Promise.all([penjualan]).then((ok) => {
            console.log(ok);
          });
        }
      } else if (hd.jnsTrx === "B" || hd.jnsTrx === "ADJ") {
        // pembelian
        let kas = hd.akunBayar;
        let kodePartner = hd.ct === "tempo" ? hd.kodePartner : "";
        let eID = hd.salesID;
        // insert total biaya => kas / hutang
        dbuse
          .query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,cabLain,kodePartner) VALUES (?,?,?,?,?,?)`,
            [nojur, kas, "K", total, cabLain, kodePartner]
          )
          .catch((err) => {
            console.log(err);
          });
        // Biaya dibayar dimuka => expedisi karena masuk ke hpp persediaan
        if (exp) {
          if (exp.biaya > 0) {
            let akunExp = "510200010";
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai) VALUES (?,?,?,?)`,
                [nojur, akunExp, "K", exp.biaya]
              )
              .catch((err) => {
                console.log(err);
              });
            // jurnal hutang expedisi => nomerJurnal = nojur induk + e
            let HutExpedisi = "210900002";
            dbuse.query(
              `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,kodePartner,cabLain,judulJurnal,tempo,jhp,status,nomorSuratJalan,jn)
              VALUES (?,?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?,'O',?,'e')`,
              [
                hd.cabID,
                nojur + "e",
                hd.tglTerima,
                hd.jnsTrx,
                exp.partnerID,
                cabLain,
                judul,
                hd.tglTerima,
                30,
                "H",
                hd.nomorBukti,
              ]
            );
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,?,?,?)`,
                [nojur + "e", akunExp, "D", exp.biaya]
              )
              .catch((err) => {
                console.log(err);
              });
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,kodePartner)
              VALUES (?,?,?,?,?)`,
                [nojur + "e", HutExpedisi, "K", exp.biaya, exp.partnerID]
              )
              .catch((err) => {
                console.log(err);
              });
          }
        }
        let setKodeCat = [...new Set(col.map((ss) => ss.kodeCat))];
        // dpp per akun pembelian
        let tppn = col.reduce((ss, b) => jumlah([ss, b.ppn]), 0);
        let pjk = col.reduce((ss, b) => jumlah([ss, b.dpp]), 0);
        if (tppn > 0) {
          let ppnMas = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,?,?,?)`,
            [nojur, "110650005", "D", tppn]
          );
        }
        // insert detail jurnal per produk kategori
        for (let i in setKodeCat) {
          // penjualan
          console.log(setKodeCat[i]);
          let thpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.hpp]), 0);
          let persediaan = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunPersediaan FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "D", thpp]
          );
          Promise.all([persediaan]).then((ok) => {
            console.log(ok);
          });
        }
      } else if (hd.jnsTrx === "RB") {
        // Retur pembelian
        let kas = hd.akunBayar;
        let kodePartner = hd.ct === "tempo" ? hd.kodePartner : "";
        let eID = hd.salesID;
        // insert total biaya => kas / hutang
        dbuse
          .query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,cabLain,kodePartner) VALUES (?,?,?,?,?,?)`,
            [nojur, kas, "D", total, cabLain, kodePartner]
          )
          .catch((err) => {
            console.log(err);
          });
        // Biaya dibayar dimuka => expedisi karena masuk ke hpp persediaan
        if (exp) {
          if (exp.biaya > 0) {
            let akunExp = "510200010";
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai) VALUES (?,?,?,?)`,
                [nojur, akunExp, "K", exp.biaya]
              )
              .catch((err) => {
                console.log(err);
              });
            // jurnal hutang expedisi => nomerJurnal = nojur induk + e
            let HutExpedisi = "210900002";
            dbuse.query(
              `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,kodePartner,cabLain,judulJurnal,tempo,jhp,status,nomorSuratJalan,jn)
              VALUES (?,?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?,'O',?,'e')`,
              [
                hd.cabID,
                nojur + "e",
                hd.tglTerima,
                hd.jnsTrx,
                exp.partnerID,
                cabLain,
                judul,
                hd.tglTerima,
                30,
                "H",
                hd.nomorBukti,
              ]
            );
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,?,?,?)`,
                [nojur + "e", akunExp, "D", exp.biaya]
              )
              .catch((err) => {
                console.log(err);
              });
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,kodePartner)
              VALUES (?,?,?,?,?)`,
                [nojur + "e", HutExpedisi, "K", exp.biaya, exp.partnerID]
              )
              .catch((err) => {
                console.log(err);
              });
          }
        }
        let setKodeCat = [...new Set(col.map((ss) => ss.kodeCat))];
        console.log(setKodeCat);
        // dpp per akun pembelian retur
        let tppn = col.reduce((ss, b) => jumlah([ss, b.ppn]), 0);
        let pjk = col.reduce((ss, b) => jumlah([ss, b.dpp]), 0);
        if (tppn > 0) {
          let ppnMas = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,?,?,?)`,
            [nojur, "110650005", "K", tppn]
          );
        }
        // insert detail jurnal per produk kategori
        for (let i in setKodeCat) {
          console.log(setKodeCat[i]);
          let thpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.hpp]), 0);
          let tsel = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.hpp, -b.dpp]), 0);
          let persediaan = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunPersediaan FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "K", thpp]
          );
          let hpp = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunHpp FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "D", tsel]
          );
          Promise.all([persediaan]).then((ok) => {
            console.log(ok);
          });
        }
      } else if (hd.jnsTrx === "RJ") {
        let kas = hd.akunBayar;
        let kodePartner = hd.ct === "tempo" ? hd.kodePartner : "";
        let eID = hd.salesID;

        // per kategori detail dulu

        // detail jurnal
        // insert total penjualan=> kas / piutang
        let totalPiutang =
          hd.ongkir === "Y" ? jumlah([exp.biaya, total]) : total;
        dbuse
          .query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,eID,cabLain,kodePartner)
          VALUES (?,?,?,?,?,?,?)`,
            [nojur, kas, "K", totalPiutang, eID, cabLain, kodePartner]
          )
          .catch((err) => {
            console.log(err);
          });
        // expedisi
        if (exp) {
          // biaya di penjualan
          if (exp.biaya > 0) {
            let akunExp = "510200010";
            if (hd.ongkir === "Y") {
              dbuse
                .query(
                  `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai) VALUES (?,?,?,?)`,
                  [nojur, akunExp, "K", exp.biaya]
                )
                .catch((err) => {
                  console.log(err);
                });
            }
            // jurnal hutang expedisi => nomerJurnal = nojur induk + e
            let HutExpedisi = "210900002";
            dbuse.query(
              `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,kodePartner,cabLain,judulJurnal,tempo,jhp,status,nomorSuratJalan,jn)
              VALUES (?,?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?,'O',?,'e')`,
              [
                hd.cabID,
                nojur + "e",
                hd.tglTerima,
                hd.jnsTrx,
                exp.partnerID,
                cabLain,
                judul,
                hd.tglTerima,
                30,
                "H",
                hd.nomorBukti,
              ]
            );
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,?,?,?)`,
                [nojur + "e", akunExp, "D", exp.biaya]
              )
              .catch((err) => {
                console.log(err);
              });
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,kodePartner)
              VALUES (?,?,?,?,?)`,
                [nojur + "e", HutExpedisi, "K", exp.biaya, exp.partnerID]
              )
              .catch((err) => {
                console.log(err);
              });
          }
          // input Hutang Biaya expedisi
        }
        let setKodeCat = [...new Set(col.map((ss) => ss.kodeCat))];
        console.log(setKodeCat);
        // dpp per akun penjualan
        let tppn = col.reduce((ss, b) => jumlah([ss, b.ppn]), 0);
        let pjk = col.reduce((ss, b) => jumlah([ss, b.dpp]), 0);
        if (tppn > 0) {
          let ppnKel = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,?,?,?)`,
            [nojur, "210400005", "D", tppn]
          );
        }
        // insert detail jurnal per produk kategori
        for (let i in setKodeCat) {
          // penjualan
          let tdpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.dpp]), 0);
          let thpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.hpp]), 0);
          let penjualan = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunPenjualan FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "D", tdpp]
          );
          let hpp = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunHpp FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "K", thpp]
          );
          let persediaan = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunPersediaan FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "D", thpp]
          );
          Promise.all([penjualan, hpp, persediaan]).then((ok) => {
            console.log(ok);
          });
        }
      }
    } else {
      let judul = hd.judulTransaksi
        ? hd.judulTransaksi
        : hd.jnsTrx == "RB" || hd.jnsTrx == "RJ"
        ? "Retur antar cabang"
        : "Jual beli antar cabang";
      let cabLain = hd.status === "D" ? hd.tujuan : hd.asal;
      let jhp =
        hd.ct === "tempo" && hd.status === "D"
          ? "P"
          : hd.ct === "tempo" && hd.status === "T"
          ? "H"
          : "L";
      let cabID = hd.status === "D" ? hd.asal : hd.tujuan;
      let total = col.reduce((a, b) => a + b.dpp + b.ppn, 0);
      let status = hd.ct === "tempo" && hd.jnsTrx == "J" ? "O" : "L";
      let urt = hd.tglTerima.replace(/-/gi, "");
      let cr = cabID + "99" + urt.slice(4, 6) + urt.slice(2, 4);
      let [urut] = await dbuse.query(
        `SELECT COUNT(nomorJurnal) AS nom FROM jurnal WHERE ISNULL(jn) AND nomorJurnal like '${cr}%'`,
        [cr]
      );
      let nojur = cr + String(parseInt(urut.nom) + 1).padStart(6, "0");
      let nomerJurnal = await dbuse.query(
        `INSERT INTO jurnal
        (cabID,nomorJurnal,tglJurnal,jnsJurnal,cabLain,judulJurnal,tempo,jhp,status,nomorSuratJalan,ancab,noreff)
        VALUES (?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?,?,?,?,?)`,
        [
          cabID,
          nojur,
          hd.tglTerima,
          hd.jnsTrx,
          cabLain,
          judul,
          hd.tglTerima,
          hd.tempo,
          jhp,
          status,
          hd.nomorBukti,
          hd.ancab,
          noreff[0].nomorJurnal,
        ]
      );
      // add detail jurnal penjualan, hpp per kategori produk
      // console.log('Jurnal antar cabang', nomerJurnal)
      let jnsNom = hd.status === "D" ? "nomorJurnal" : "jurnalReff";
      let upTrx = await dbuse.query(
        `UPDATE transaksi SET ${jnsNom}=?, tglTerima=NOW() WHERE nomorBukti=?`,
        [nojur, hd.nomorBukti]
      );
      let kas = "110500001"; // piutang dagang
      let hut = "210100001"; // hutang dagang supplier grup Aston
      // normal transaksi
      let totalHP = hd.ongkir === "Y" ? jumlah([total, exp.biaya]) : total;
      if (hd.jnsTrx == "J") {
        if (hd.status === "D") {
          let kasMaster = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,cabLain,msAC)
          VALUES (?,?,?,?,?,?)`,
            [nojur, kas, "D", totalHP, cabLain, "M"]
          );
        } else {
          let hutSlave = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,cabLain,msAC)
            VALUES (?,?,?,?,?,?)`,
            [nojur, hut, "K", totalHP, cabLain, "M"]
          );
        }
        let setKodeCat = [...new Set(col.map((ss) => ss.kodeCat))];
        // console.log(setKodeCat)
        // dpp per akun penjualan
        let tppn = col.reduce((ss, b) => jumlah([ss, b.ppn]), 0);
        let pjk = col.reduce((ss, b) => jumlah([ss, b.dpp]), 0);
        if (tppn > 0) {
          if (hd.status === "D") {
            let ppnKel = await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,?,?,?)`,
              [nojur, "210400005", "K", tppn]
            );
          } else {
            let ppnMas = await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,msAC)
              VALUES (?,?,?,?,'S')`,
              [nojur, "110650005", "D", tppn],
              "M"
            );
          }
        }
        // jurnal biaya expedisi
        if (exp) {
          // biaya di penjualan
          if (exp.biaya > 0 && hd.status === "D") {
            let akunExp = "510200010";
            // ongkir ditanggung pembeli => jurnal biaya expedisi
            if (hd.ongkir === "Y") {
              let j = await dbuse.query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai) VALUES (?,?,?,?)`,
                [nojur, akunExp, "K", exp.biaya]
              );
            }
            // jurnal hutang expedisi => nomerJurnal = nojur induk + e
            let HutExpedisi = "210900002";
            dbuse.query(
              `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,kodePartner,cabLain,judulJurnal,tempo,jhp,status,nomorSuratJalan,jn)
              VALUES (?,?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?,'O',?,'e')`,
              [
                hd.cabID,
                nojur + "e",
                hd.tglTerima,
                hd.jnsTrx,
                exp.partnerID,
                cabLain,
                judul,
                hd.tglTerima,
                30,
                "H",
                hd.nomorBukti,
              ]
            );
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,?,?,?)`,
                [nojur + "e", akunExp, "D", exp.biaya]
              )
              .catch((err) => {
                console.log(err);
              });
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,kodePartner)
              VALUES (?,?,?,?,?)`,
                [nojur + "e", HutExpedisi, "K", exp.biaya, exp.partnerID]
              )
              .catch((err) => {
                console.log(err);
              });
          }
          // input Hutang Biaya expedisi
        }
        // insert detail jurnal per produk kategori
        for (let i in setKodeCat) {
          // penjualan
          console.log(setKodeCat[i]);
          let tdpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.dpp]), 0);
          let tdppL = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => {
              return hd.ongkir === "Y"
                ? jumlah([ss, b.dpp, b.ongkir])
                : jumlah([ss, b.dpp]);
            }, 0);
          console.log(tdppL);
          let thpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.hpp]), 0);
          if (hd.status === "D") {
            let penjualan = await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,(SELECT c.akunPenjualan FROM produkCat c
              WHERE c.kodeCat=? ),?,?)`,
              [nojur, setKodeCat[i], "K", tdpp]
            );
            let hpp = await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,(SELECT c.akunHpp FROM produkCat c
              WHERE c.kodeCat=? ),?,?)`,
              [nojur, setKodeCat[i], "D", thpp]
            );
            let persediaan = await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,(SELECT c.akunPersediaan FROM produkCat c
              WHERE c.kodeCat=? ),?,?)`,
              [nojur, setKodeCat[i], "K", thpp]
            );
          } else {
            // lawan cabang lain persediaan = harga dpp
            let persediaanL = await dbuse.query(
              `INSERT INTO detJur(kodeAkun,nomorJurnal,DK,nilai,msAC)
              VALUES ((SELECT c.akunPersediaan FROM produkCat c
              WHERE c.kodeCat=?),?,?,?,'M')`,
              [setKodeCat[i], nojur, "D", tdppL]
            );
          }
        }
      } else {
        // retur antar cabang
        if (hd.status === "D") {
          let kasMaster = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,cabLain,msAC)
              VALUES (?,?,?,?,?,?)`,
            [nojur, kas, "K", totalHP, cabLain, "M"]
          );
        } else {
          let hutSlave = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,cabLain,msAC)
              VALUES (?,?,?,?,?,?)`,
            [nojur, hut, "D", totalHP, cabLain, "M"]
          );
        }
        let setKodeCat = [...new Set(col.map((ss) => ss.kodeCat))];
        console.log(setKodeCat);
        // dpp per akun penjualan
        let tppn = col.reduce((ss, b) => jumlah([ss, b.ppn]), 0);
        let pjk = col.reduce((ss, b) => jumlah([ss, b.dpp]), 0);
        if (tppn > 0) {
          if (hd.status === "D") {
            let ppnKel = await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,?,?,?)`,
              [nojur, "210400005", "D", tppn]
            );
          } else {
            let ppnMas = await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,msAC)
              VALUES (?,?,?,?,'S')`,
              [nojur, "110650005", "K", tppn],
              "M"
            );
          }
        }
        // insert detail jurnal per produk kategori
        for (let i in setKodeCat) {
          // penjualan
          console.log(setKodeCat[i]);
          let tdpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.dpp]), 0);
          let thpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.hpp]), 0);
          console.log(tdpp, thpp);
          if (hd.status === "D") {
            let penjualan = await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,(SELECT c.akunPenjualan FROM produkCat c
              WHERE c.kodeCat=? ),?,?)`,
              [nojur, setKodeCat[i], "D", tdpp]
            );
            let hpp = await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,(SELECT c.akunHpp FROM produkCat c
              WHERE c.kodeCat=? ),?,?)`,
              [nojur, setKodeCat[i], "K", thpp]
            );
            let persediaan = await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,(SELECT c.akunPersediaan FROM produkCat c
              WHERE c.kodeCat=? ),?,?)`,
              [nojur, setKodeCat[i], "D", thpp]
            );
          } else {
            // lawan cabang lain persediaan = harga dpp
            let persediaanL = await dbuse.query(
              `INSERT INTO detJur(kodeAkun,nomorJurnal,DK,nilai,msAC)
              VALUES ((SELECT c.akunPersediaan FROM produkCat c
              WHERE c.kodeCat=?),?,?,?,'M')`,
              [setKodeCat[i], nojur, "K", tdpp]
            );
          }
        }
      }
    }

    //   res.send({st:'Selesai...'})
  } catch (err) {
    console.log(err);
  }
}

async function trxTerimax(hd, col, exp, pot) {
  let tt = new Date();
  hd.tglTerima = hd.tglKirim;
  hd.totalPoint = col.reduce((a, b) => a + b.jmlPoint, 0);
  let namaPartner = hd.namaPartner || "";
  try {
    let cabLain =
      hd.ancab === "Y" && hd.status === "D"
        ? hd.tujuan
        : hd.ancab === "Y" && hd.status === "T"
        ? hd.asal
        : "";
    let noreff =
      hd.jnsTrx == "RB" || hd.jnsTrx == "RJ"
        ? await dbuse.query(
            "SELECT nomorJurnal FROM transaksi WHERE nomorBukti=?",
            [hd.noreffRetur]
          )
        : [{ nomorJurnal: "" }];
    let ss;
    for (let i in col) {
      // if (col[i].kodeCat === '17' || col[i].kodeCat === '19') { continue }
      if (col[i].jasa === "Y") {
        continue;
      }
      //   continue
      // antar cabang => update stock asal dan tujuan,  partner => update asal atau tujuan saja
      let stk;
      let ts =
        hd.ongkir === "Y" ? jumlah([col[i].dpp, col[i].ongkir]) : col[i].dpp;
      let uphap;
      if (hd.ancab !== "Y" || hd.status == "D") {
        // cabang penjual atau jualbeli langsung
        stk =
          hd.jnsTrx === "J" || hd.jnsTrx === "RB"
            ? `${hd.asal} = ${hd.asal}-?`
            : `${hd.tujuan} = ${hd.tujuan}+?`;

        ss = await dbuse.query(
          `UPDATE stock SET ${stk} WHERE kodeProduk='${col[i].kodeProduk}'`,
          [col[i].qty, col[i].qty]
        );
      } else if (hd.ancab === "Y" && hd.status == "T") {
        // cabang pembeli antar cabang => cabLain => tujuan
        stk =
          hd.jnsTrx === "J" || hd.jnsTrx === "RB"
            ? `${hd.tujuan} = ${hd.tujuan}+?`
            : `${hd.asal} = ${hd.asal}-?`;
        ss = await dbuse.query(
          `UPDATE stock SET ${stk} WHERE kodeProduk='${col[i].kodeProduk}'`,
          [col[i].qty, col[i].qty]
        );
      }
      // update hpp barang di hd.tujuan / pembeli
      if (hd.ac === "N") {
        switch (hd.jnsTrx) {
          case "B":
          case "ADJ":
            await dbuse.query(
              {
                namedPlaceholders: true,
                sql: `UPDATE hpp h LEFT JOIN (SELECT b.kodeProduk,
                SUM(
                  CASE
                  WHEN t.status = 'T' AND t.tujuan = '${hd.cabID}' THEN +d.qty
                  WHEN t.asal = '${hd.cabID}' THEN -d.qty
                  ELSE 0
                  END
                ) AS saldo,
                SUM(
                  CASE
                  WHEN t.jnsTrx='RJ' AND t.tujuan='${hd.cabID}' THEN d.hpp
                  WHEN t.tujuan='${hd.cabID}' AND t.ongkir= 'Y' AND t.status = 'T' THEN d.dpp + d.ongkir
                  WHEN t.tujuan='${hd.cabID}' AND t.ongkir= 'N' AND t.status = 'T' THEN d.dpp
                  WHEN (t.ac!= 'Y' AND t.jnsTrx!='B') AND t.tujuan='${hd.cabID}' AND t.status = 'T' THEN d.hpp
                  WHEN t.asal='${hd.cabID}' THEN -d.hpp
                  ELSE 0
                  END
                ) AS saldoHpp,
                nb.kodeCat
              FROM detTrans d left join produk b on d.kodeProduk=b.kodeProduk left join transaksi t on d.nomorBukti=t.nomorBukti
                  LEFT JOIN namaBarang nb ON nb.kodeProduk=d.kodeProduk
              WHERE (t.asal='${hd.cabID}' or t.tujuan='${hd.cabID}') AND t.status NOT IN ('W','B') AND nb.jasa != 'Y' AND d.kodeProduk = :kodeProduk
              group by d.kodeProduk
              ) s ON s.kodeProduk = h.kodeProduk SET h.${hd.cabID} = IF(s.saldoHpp, s.saldoHpp,0) / IF(s.saldo != 0, s.saldo, 1) WHERE h.kodeProduk= :kodeProduk`,
              },
              col[i]
            );
            break;
          case "RB":
            uphap = await dbuse.query(
              `UPDATE hpp h LEFT JOIN stock s ON h.kodeProduk=s.kodeProduk
                SET h.${hd.cabID}=IF(s.${hd.cabID} = 0, 0, (h.${hd.cabID}*(s.${hd.cabID} + ?) - ?)/ if(s.${hd.cabID} != 0, s.${hd.cabID}, 1)) WHERE h.kodeProduk=?`,
              [col[i].qty, col[i].hpp, col[i].kodeProduk]
            );
            break;
          case "J":
            // cabLain = cabang pembeli
            console.log("iki dpp+ongkir JB ac " + ts, cabLain, col[i].qty);
            if (hd.status == "T" && hd.ancab === "Y") {
              await dbuse.query(
                {
                  namedPlaceholders: true,
                  sql: `UPDATE hpp h LEFT JOIN (SELECT b.kodeProduk,
                  SUM(
                    CASE
                    WHEN t.status = 'T' AND t.tujuan = '${cabLain}' THEN +d.qty
                    WHEN t.asal = '${cabLain}' THEN -d.qty
                    ELSE 0
                    END
                  ) AS saldo,
                  SUM(
                    CASE
                    WHEN t.jnsTrx='RJ' AND t.tujuan='${cabLain}' THEN d.hpp
                    WHEN t.tujuan='${cabLain}' AND t.ongkir= 'Y' AND t.status = 'T' THEN d.dpp + d.ongkir
                    WHEN t.tujuan='${cabLain}' AND t.ongkir= 'N' AND t.status = 'T' THEN d.dpp
                    WHEN (t.ac!= 'Y' AND t.jnsTrx!='B') AND t.tujuan='${cabLain}' AND t.status = 'T' THEN d.hpp
                    WHEN t.asal='${cabLain}' THEN -d.hpp
                    ELSE 0
                    END
                  ) AS saldoHpp,
                  nb.kodeCat
                FROM detTrans d left join produk b on d.kodeProduk=b.kodeProduk left join transaksi t on d.nomorBukti=t.nomorBukti
                    LEFT JOIN namaBarang nb ON nb.kodeProduk=d.kodeProduk
                WHERE (t.asal='${cabLain}' or t.tujuan='${cabLain}') AND t.status NOT IN ('W','B') AND nb.jasa != 'Y' AND d.kodeProduk = :kodeProduk
                group by d.kodeProduk
                ) s ON s.kodeProduk = h.kodeProduk SET h.${cabLain} = s.saldoHpp / if(s.saldo != 0, s.saldo, 1) WHERE h.kodeProduk= :kodeProduk`,
                },
                col[i]
              );
            }
            break;
          default:
            break;
        }
      } else {
        if (hd.jnsTrx === "J") {
          // cabLain = cabang pembeli
          console.log("iki dpp+ongkir JB ac lawas" + ts, cabLain, col[i].qty);
          uphap = await dbuse.query(
            `UPDATE hpp h LEFT JOIN stock s ON h.kodeProduk=s.kodeProduk
            SET h.${cabLain}=((h.${cabLain} * (s.${cabLain}-?))+ ?)/IF(s.${cabLain} != 0, s.${cabLain}, 1) WHERE h.kodeProduk=?`,
            [col[i].qty, ts, col[i].kodeProduk]
          );
          console.log(uphap);
        } else if (hd.jnsTrx === "B") {
          uphap = await dbuse.query(
            `UPDATE hpp h LEFT JOIN stock s ON h.kodeProduk=s.kodeProduk
            SET h.${hd.cabID}=((h.${hd.cabID} * (s.${hd.cabID}-?))+ ?)/ IF(s.${hd.cabID} != 0, s.${hd.cabID}, 1) WHERE h.kodeProduk=?`,
            [col[i].qty, ts, col[i].kodeProduk]
          );
        }
      }
    }
    // jual beli normal
    if (hd.ancab !== "Y") {
      let judul =
        hd.jnsTrx == "J"
          ? `Penjualan ${hd.nomorBukti} ${namaPartner}`
          : hd.jnsTrx == "RJ"
          ? `Retur Penjualan ${hd.nomorBukti} ${namaPartner}`
          : hd.jnsTrx == "RB"
          ? `Retur Pembelian ${hd.nomorBukti} ${namaPartner}`
          : `Pengadaan ${hd.nomorBukti} ${namaPartner}`;
      let jhp =
        hd.ct === "tempo" && hd.jnsTrx === "B"
          ? "H"
          : hd.ct === "tempo" && hd.jnsTrx === "J"
          ? "P"
          : "L";
      let total = col.reduce((a, b) => a + b.dpp + b.ppn, 0);
      let status =
        hd.ct === "tempo" && (hd.jnsTrx == "J" || hd.jnsTrx == "B") ? "O" : "L";
      let urt = hd.tglTerima.replace(/-/gi, "");
      let cr = hd.cabID + "99" + urt.slice(4, 6) + urt.slice(2, 4);
      let urut = await dbuse.query(
        `SELECT COUNT(nomorJurnal) AS nom FROM jurnal WHERE ISNULL(jn) AND nomorJurnal like '${cr}%'`,
        [cr]
      );
      let nojur = cr + String(parseInt(urut[0].nom) + 1).padStart(6, "0");
      console.log(nojur);
      let nomerJurnal = await dbuse.query(
        `INSERT INTO jurnal
        (cabID,nomorJurnal,tglJurnal,jnsJurnal,kodePartner,cabLain,judulJurnal,tempo,jhp,status,nomorSuratJalan,noreff,oleh)
        VALUES (?,?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?,?,?,?,?)`,
        [
          hd.cabID,
          nojur,
          hd.tglTerima,
          hd.jnsTrx,
          hd.kodePartner,
          cabLain,
          judul,
          hd.tglTerima,
          hd.tempo,
          jhp,
          status,
          hd.nomorBukti,
          noreff[0].nomorJurnal,
          hd.salesID,
        ]
      );
      // add detail jurnal penjualan, hpp per kategori produk
      console.log(`Jurnal JB normal`, nomerJurnal);
      let upTrx = await dbuse.query(
        "UPDATE transaksi SET nomorJurnal=?, tglTerima=NOW() WHERE nomorBukti=?",
        [nojur, hd.nomorBukti]
      );

      // if penjualan....
      if (hd.jnsTrx === "J") {
        let kas = hd.akunBayar;
        let kodePartner = hd.ct === "tempo" ? hd.kodePartner : "";
        let eID = hd.salesID;
        if (hd.pot === "Y") {
          dbuse
            .query(
              `INSERT INTO detJur (nomorJurnal, kodeAkun, DK, nilai, desk)
              VALUES (?,?,'D',?,'Potongan penjualan')`,
              [nojur, pot.akunDiskon, pot.diskon]
            )
            .catch((err) => {
              console.log(err);
            });
        }
        // per kategori detail dulu
        // detail jurnal
        // insert total penjualan=> kas / piutang
        let diskon = hd.pot === "Y" && pot.diskon != null ? pot.diskon : 0;
        let totalPiutang =
          hd.ongkir === "Y"
            ? jumlah([exp.biaya, total, -diskon])
            : jumlah([total, -diskon]);
        dbuse
          .query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,eID,cabLain,kodePartner)
          VALUES (?,?,?,?,?,?,?)`,
            [nojur, kas, "D", totalPiutang, eID, cabLain, kodePartner]
          )
          .catch((err) => {
            console.log(err);
          });
        // expedisi
        if (exp) {
          // biaya di penjualan
          if (exp.biaya > 0) {
            let akunExp = "510200010";
            // ongkir ditanggung pembeli => jurnal biaya expedisi
            if (hd.ongkir === "Y") {
              let j = await dbuse.query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai) VALUES (?,?,?,?)`,
                [nojur, akunExp, "K", exp.biaya]
              );
            }
            // jurnal hutang expedisi => nomerJurnal = nojur induk + e
            let HutExpedisi = "210900002";
            dbuse.query(
              `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,kodePartner,cabLain,judulJurnal,tempo,jhp,status,nomorSuratJalan,jn)
              VALUES (?,?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?,'O',?,'e')`,
              [
                hd.cabID,
                nojur + "e",
                hd.tglTerima,
                hd.jnsTrx,
                exp.partnerID,
                cabLain,
                judul,
                hd.tglTerima,
                30,
                "H",
                hd.nomorBukti,
              ]
            );
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,?,?,?)`,
                [nojur + "e", akunExp, "D", exp.biaya]
              )
              .catch((err) => {
                console.log(err);
              });
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,kodePartner)
              VALUES (?,?,?,?,?)`,
                [nojur + "e", HutExpedisi, "K", exp.biaya, exp.partnerID]
              )
              .catch((err) => {
                console.log(err);
              });
          }
          // input Hutang Biaya expedisi
        }
        // point Membership
        if (
          hd.ac === "N" &&
          hd.cabID !== "AM01" &&
          hd.totalPoint > 0 &&
          hd.ancab !== "Y"
        ) {
          const jpm = [
            {
              nomorJurnal: nojur,
              kodeAkun: "510100007",
              DK: "D",
              nilai: hd.totalPoint,
              desk: `Point Member`,
            },
            {
              nomorJurnal: nojur,
              kodeAkun: "210500003",
              DK: "K",
              nilai: hd.totalPoint,
              desk: `Point Member`,
            },
          ];
          let jm = await dbuse.batch(
            {
              namedPlaceholders: true,
              sql: `INSERT INTO detJur (nomorJurnal,kodeAkun,DK,nilai, desk)
          VALUES (:nomorJurnal,:kodeAkun,:DK,:nilai, :desk)`,
            },
            jpm
          );
        }
        let setKodeCat = [...new Set(col.map((ss) => ss.kodeCat))];
        // console.log(setKodeCat)
        // dpp per akun penjualan
        let tppn = col.reduce((ss, b) => jumlah([ss, b.ppn]), 0);
        let pjk = col.reduce((ss, b) => jumlah([ss, b.dpp]), 0);
        if (tppn > 0) {
          let ppnKel = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,?,?,?)`,
            [nojur, "210400005", "K", tppn]
          );
        }
        // insert detail jurnal per produk kategori
        for (let i in setKodeCat) {
          // penjualan
          let tdpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.dpp]), 0);
          let thpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.hpp]), 0);
          let penjualan = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunPenjualan FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "K", tdpp]
          );
          if (thpp !== 0) {
            // hpp
            await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,(SELECT c.akunHpp FROM produkCat c
              WHERE c.kodeCat=? ),?,?)`,
              [nojur, setKodeCat[i], "D", thpp]
            );
            // persediaan
            await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,(SELECT c.akunPersediaan FROM produkCat c
              WHERE c.kodeCat=? ),?,?)`,
              [nojur, setKodeCat[i], "K", thpp]
            );
          }
          Promise.all([penjualan]).then((ok) => {
            console.log(ok);
          });
        }
      } else if (hd.jnsTrx === "B" || hd.jnsTrx === "ADJ") {
        // pembelian
        let kas = hd.akunBayar;
        let kodePartner = hd.ct === "tempo" ? hd.kodePartner : "";
        let eID = hd.salesID;
        // insert total biaya => kas / hutang
        dbuse
          .query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,cabLain,kodePartner) VALUES (?,?,?,?,?,?)`,
            [nojur, kas, "K", total, cabLain, kodePartner]
          )
          .catch((err) => {
            console.log(err);
          });
        // Biaya dibayar dimuka => expedisi karena masuk ke hpp persediaan
        if (exp) {
          if (exp.biaya > 0) {
            let akunExp = "510200010";
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai) VALUES (?,?,?,?)`,
                [nojur, akunExp, "K", exp.biaya]
              )
              .catch((err) => {
                console.log(err);
              });
            // jurnal hutang expedisi => nomerJurnal = nojur induk + e
            let HutExpedisi = "210900002";
            dbuse.query(
              `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,kodePartner,cabLain,judulJurnal,tempo,jhp,status,nomorSuratJalan,jn)
              VALUES (?,?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?,'O',?,'e')`,
              [
                hd.cabID,
                nojur + "e",
                hd.tglTerima,
                hd.jnsTrx,
                exp.partnerID,
                cabLain,
                judul,
                hd.tglTerima,
                30,
                "H",
                hd.nomorBukti,
              ]
            );
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,?,?,?)`,
                [nojur + "e", akunExp, "D", exp.biaya]
              )
              .catch((err) => {
                console.log(err);
              });
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,kodePartner)
              VALUES (?,?,?,?,?)`,
                [nojur + "e", HutExpedisi, "K", exp.biaya, exp.partnerID]
              )
              .catch((err) => {
                console.log(err);
              });
          }
        }
        let setKodeCat = [...new Set(col.map((ss) => ss.kodeCat))];
        // dpp per akun pembelian
        let tppn = col.reduce((ss, b) => jumlah([ss, b.ppn]), 0);
        let pjk = col.reduce((ss, b) => jumlah([ss, b.dpp]), 0);
        if (tppn > 0) {
          let ppnMas = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,?,?,?)`,
            [nojur, "110650005", "D", tppn]
          );
        }
        // insert detail jurnal per produk kategori
        for (let i in setKodeCat) {
          // penjualan
          console.log(setKodeCat[i]);
          let thpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.hpp]), 0);
          let persediaan = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunPersediaan FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "D", thpp]
          );
          Promise.all([persediaan]).then((ok) => {
            console.log(ok);
          });
        }
      } else if (hd.jnsTrx === "RB") {
        // Retur pembelian
        let kas = hd.akunBayar;
        let kodePartner = hd.ct === "tempo" ? hd.kodePartner : "";
        let eID = hd.salesID;
        // insert total biaya => kas / hutang
        dbuse
          .query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,cabLain,kodePartner) VALUES (?,?,?,?,?,?)`,
            [nojur, kas, "D", total, cabLain, kodePartner]
          )
          .catch((err) => {
            console.log(err);
          });
        // Biaya dibayar dimuka => expedisi karena masuk ke hpp persediaan
        if (exp) {
          if (exp.biaya > 0) {
            let akunExp = "510200010";
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai) VALUES (?,?,?,?)`,
                [nojur, akunExp, "K", exp.biaya]
              )
              .catch((err) => {
                console.log(err);
              });
            // jurnal hutang expedisi => nomerJurnal = nojur induk + e
            let HutExpedisi = "210900002";
            dbuse.query(
              `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,kodePartner,cabLain,judulJurnal,tempo,jhp,status,nomorSuratJalan,jn)
              VALUES (?,?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?,'O',?,'e')`,
              [
                hd.cabID,
                nojur + "e",
                hd.tglTerima,
                hd.jnsTrx,
                exp.partnerID,
                cabLain,
                judul,
                hd.tglTerima,
                30,
                "H",
                hd.nomorBukti,
              ]
            );
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,?,?,?)`,
                [nojur + "e", akunExp, "D", exp.biaya]
              )
              .catch((err) => {
                console.log(err);
              });
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,kodePartner)
              VALUES (?,?,?,?,?)`,
                [nojur + "e", HutExpedisi, "K", exp.biaya, exp.partnerID]
              )
              .catch((err) => {
                console.log(err);
              });
          }
        }
        let setKodeCat = [...new Set(col.map((ss) => ss.kodeCat))];
        console.log(setKodeCat);
        // dpp per akun pembelian retur
        let tppn = col.reduce((ss, b) => jumlah([ss, b.ppn]), 0);
        let pjk = col.reduce((ss, b) => jumlah([ss, b.dpp]), 0);
        if (tppn > 0) {
          let ppnMas = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,?,?,?)`,
            [nojur, "110650005", "K", tppn]
          );
        }
        // insert detail jurnal per produk kategori
        for (let i in setKodeCat) {
          console.log(setKodeCat[i]);
          let thpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.hpp]), 0);
          let tsel = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.hpp, -b.dpp]), 0);
          let persediaan = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunPersediaan FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "K", thpp]
          );
          let hpp = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunHpp FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "D", tsel]
          );
          Promise.all([persediaan]).then((ok) => {
            console.log(ok);
          });
        }
      } else if (hd.jnsTrx === "RJ") {
        let kas = hd.akunBayar;
        let kodePartner = hd.ct === "tempo" ? hd.kodePartner : "";
        let eID = hd.salesID;

        // per kategori detail dulu

        // detail jurnal
        // insert total penjualan=> kas / piutang
        let totalPiutang =
          hd.ongkir === "Y" ? jumlah([exp.biaya, total]) : total;
        dbuse
          .query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,eID,cabLain,kodePartner)
          VALUES (?,?,?,?,?,?,?)`,
            [nojur, kas, "K", totalPiutang, eID, cabLain, kodePartner]
          )
          .catch((err) => {
            console.log(err);
          });
        // expedisi
        if (exp) {
          // biaya di penjualan
          if (exp.biaya > 0) {
            let akunExp = "510200010";
            if (hd.ongkir === "Y") {
              dbuse
                .query(
                  `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai) VALUES (?,?,?,?)`,
                  [nojur, akunExp, "K", exp.biaya]
                )
                .catch((err) => {
                  console.log(err);
                });
            }
            // jurnal hutang expedisi => nomerJurnal = nojur induk + e
            let HutExpedisi = "210900002";
            dbuse.query(
              `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,kodePartner,cabLain,judulJurnal,tempo,jhp,status,nomorSuratJalan,jn)
              VALUES (?,?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?,'O',?,'e')`,
              [
                hd.cabID,
                nojur + "e",
                hd.tglTerima,
                hd.jnsTrx,
                exp.partnerID,
                cabLain,
                judul,
                hd.tglTerima,
                30,
                "H",
                hd.nomorBukti,
              ]
            );
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,?,?,?)`,
                [nojur + "e", akunExp, "D", exp.biaya]
              )
              .catch((err) => {
                console.log(err);
              });
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,kodePartner)
              VALUES (?,?,?,?,?)`,
                [nojur + "e", HutExpedisi, "K", exp.biaya, exp.partnerID]
              )
              .catch((err) => {
                console.log(err);
              });
          }
          // input Hutang Biaya expedisi
        }
        let setKodeCat = [...new Set(col.map((ss) => ss.kodeCat))];
        console.log(setKodeCat);
        // dpp per akun penjualan
        let tppn = col.reduce((ss, b) => jumlah([ss, b.ppn]), 0);
        let pjk = col.reduce((ss, b) => jumlah([ss, b.dpp]), 0);
        if (tppn > 0) {
          let ppnKel = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,?,?,?)`,
            [nojur, "210400005", "D", tppn]
          );
        }
        // insert detail jurnal per produk kategori
        for (let i in setKodeCat) {
          // penjualan
          let tdpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.dpp]), 0);
          let thpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.hpp]), 0);
          let penjualan = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunPenjualan FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "D", tdpp]
          );
          let hpp = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunHpp FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "K", thpp]
          );
          let persediaan = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
            VALUES (?,(SELECT c.akunPersediaan FROM produkCat c
            WHERE c.kodeCat=? ),?,?)`,
            [nojur, setKodeCat[i], "D", thpp]
          );
          Promise.all([penjualan, hpp, persediaan]).then((ok) => {
            console.log(ok);
          });
        }
      }
    } else {
      let judul = hd.judulTransaksi
        ? hd.judulTransaksi
        : hd.jnsTrx == "RB" || hd.jnsTrx == "RJ"
        ? "Retur antar cabang"
        : "Jual beli antar cabang";
      let cabLain = hd.status === "D" ? hd.tujuan : hd.asal;
      let jhp =
        hd.ct === "tempo" && hd.status === "D"
          ? "P"
          : hd.ct === "tempo" && hd.status === "T"
          ? "H"
          : "L";
      let cabID = hd.status === "D" ? hd.asal : hd.tujuan;
      let total = col.reduce((a, b) => a + b.dpp + b.ppn, 0);
      let status = hd.ct === "tempo" && hd.jnsTrx == "J" ? "O" : "L";
      let urt = hd.tglTerima.replace(/-/gi, "");
      let cr = cabID + "99" + urt.slice(4, 6) + urt.slice(2, 4);
      let [urut] = await dbuse.query(
        `SELECT COUNT(nomorJurnal) AS nom FROM jurnal WHERE ISNULL(jn) AND nomorJurnal like '${cr}%'`,
        [cr]
      );
      let nojur = cr + String(parseInt(urut.nom) + 1).padStart(6, "0");
      let nomerJurnal = await dbuse.query(
        `INSERT INTO jurnal
        (cabID,nomorJurnal,tglJurnal,jnsJurnal,cabLain,judulJurnal,tempo,jhp,status,nomorSuratJalan,ancab,noreff)
        VALUES (?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?,?,?,?,?)`,
        [
          cabID,
          nojur,
          hd.tglTerima,
          hd.jnsTrx,
          cabLain,
          judul,
          hd.tglTerima,
          hd.tempo,
          jhp,
          status,
          hd.nomorBukti,
          hd.ancab,
          noreff[0].nomorJurnal,
        ]
      );
      // add detail jurnal penjualan, hpp per kategori produk
      // console.log('Jurnal antar cabang', nomerJurnal)
      let jnsNom = hd.status === "D" ? "nomorJurnal" : "jurnalReff";
      let upTrx = await dbuse.query(
        `UPDATE transaksi SET ${jnsNom}=?, tglTerima=NOW() WHERE nomorBukti=?`,
        [nojur, hd.nomorBukti]
      );
      let kas = "110500001"; // piutang dagang
      let hut = "210100001"; // hutang dagang supplier grup Aston
      // normal transaksi
      let totalHP = hd.ongkir === "Y" ? jumlah([total, exp.biaya]) : total;
      if (hd.jnsTrx == "J") {
        if (hd.status === "D") {
          let kasMaster = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,cabLain,msAC)
          VALUES (?,?,?,?,?,?)`,
            [nojur, kas, "D", totalHP, cabLain, "M"]
          );
        } else {
          let hutSlave = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,cabLain,msAC)
            VALUES (?,?,?,?,?,?)`,
            [nojur, hut, "K", totalHP, cabLain, "M"]
          );
        }
        let setKodeCat = [...new Set(col.map((ss) => ss.kodeCat))];
        // console.log(setKodeCat)
        // dpp per akun penjualan
        let tppn = col.reduce((ss, b) => jumlah([ss, b.ppn]), 0);
        let pjk = col.reduce((ss, b) => jumlah([ss, b.dpp]), 0);
        if (tppn > 0) {
          if (hd.status === "D") {
            let ppnKel = await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,?,?,?)`,
              [nojur, "210400005", "K", tppn]
            );
          } else {
            let ppnMas = await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,msAC)
              VALUES (?,?,?,?,'S')`,
              [nojur, "110650005", "D", tppn],
              "M"
            );
          }
        }
        // jurnal biaya expedisi
        if (exp) {
          // biaya di penjualan
          if (exp.biaya > 0 && hd.status === "D") {
            let akunExp = "510200010";
            // ongkir ditanggung pembeli => jurnal biaya expedisi
            if (hd.ongkir === "Y") {
              let j = await dbuse.query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai) VALUES (?,?,?,?)`,
                [nojur, akunExp, "K", exp.biaya]
              );
            }
            // jurnal hutang expedisi => nomerJurnal = nojur induk + e
            let HutExpedisi = "210900002";
            dbuse.query(
              `INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,kodePartner,cabLain,judulJurnal,tempo,jhp,status,nomorSuratJalan,jn)
              VALUES (?,?,?,?,?,?,?,DATE_ADD(?, INTERVAL ? DAY),?,'O',?,'e')`,
              [
                hd.cabID,
                nojur + "e",
                hd.tglTerima,
                hd.jnsTrx,
                exp.partnerID,
                cabLain,
                judul,
                hd.tglTerima,
                30,
                "H",
                hd.nomorBukti,
              ]
            );
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,?,?,?)`,
                [nojur + "e", akunExp, "D", exp.biaya]
              )
              .catch((err) => {
                console.log(err);
              });
            dbuse
              .query(
                `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,kodePartner)
              VALUES (?,?,?,?,?)`,
                [nojur + "e", HutExpedisi, "K", exp.biaya, exp.partnerID]
              )
              .catch((err) => {
                console.log(err);
              });
          }
          // input Hutang Biaya expedisi
        }
        // insert detail jurnal per produk kategori
        for (let i in setKodeCat) {
          // penjualan
          console.log(setKodeCat[i]);
          let tdpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.dpp]), 0);
          let tdppL = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => {
              return hd.ongkir === "Y"
                ? jumlah([ss, b.dpp, b.ongkir])
                : jumlah([ss, b.dpp]);
            }, 0);
          console.log(tdppL);
          let thpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.hpp]), 0);
          if (hd.status === "D") {
            let penjualan = await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,(SELECT c.akunPenjualan FROM produkCat c
              WHERE c.kodeCat=? ),?,?)`,
              [nojur, setKodeCat[i], "K", tdpp]
            );
            let hpp = await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,(SELECT c.akunHpp FROM produkCat c
              WHERE c.kodeCat=? ),?,?)`,
              [nojur, setKodeCat[i], "D", thpp]
            );
            let persediaan = await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,(SELECT c.akunPersediaan FROM produkCat c
              WHERE c.kodeCat=? ),?,?)`,
              [nojur, setKodeCat[i], "K", thpp]
            );
          } else {
            // lawan cabang lain persediaan = harga dpp
            let persediaanL = await dbuse.query(
              `INSERT INTO detJur(kodeAkun,nomorJurnal,DK,nilai,msAC)
              VALUES ((SELECT c.akunPersediaan FROM produkCat c
              WHERE c.kodeCat=?),?,?,?,'M')`,
              [setKodeCat[i], nojur, "D", tdppL]
            );
          }
        }
      } else {
        // retur antar cabang
        if (hd.status === "D") {
          let kasMaster = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,cabLain,msAC)
              VALUES (?,?,?,?,?,?)`,
            [nojur, kas, "K", totalHP, cabLain, "M"]
          );
        } else {
          let hutSlave = await dbuse.query(
            `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,cabLain,msAC)
              VALUES (?,?,?,?,?,?)`,
            [nojur, hut, "D", totalHP, cabLain, "M"]
          );
        }
        let setKodeCat = [...new Set(col.map((ss) => ss.kodeCat))];
        console.log(setKodeCat);
        // dpp per akun penjualan
        let tppn = col.reduce((ss, b) => jumlah([ss, b.ppn]), 0);
        let pjk = col.reduce((ss, b) => jumlah([ss, b.dpp]), 0);
        if (tppn > 0) {
          if (hd.status === "D") {
            let ppnKel = await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,?,?,?)`,
              [nojur, "210400005", "D", tppn]
            );
          } else {
            let ppnMas = await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,msAC)
              VALUES (?,?,?,?,'S')`,
              [nojur, "110650005", "K", tppn],
              "M"
            );
          }
        }
        // insert detail jurnal per produk kategori
        for (let i in setKodeCat) {
          // penjualan
          console.log(setKodeCat[i]);
          let tdpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.dpp]), 0);
          let thpp = col
            .filter((a) => a.kodeCat == setKodeCat[i])
            .reduce((ss, b) => jumlah([ss, b.hpp]), 0);
          console.log(tdpp, thpp);
          if (hd.status === "D") {
            let penjualan = await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,(SELECT c.akunPenjualan FROM produkCat c
              WHERE c.kodeCat=? ),?,?)`,
              [nojur, setKodeCat[i], "D", tdpp]
            );
            let hpp = await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,(SELECT c.akunHpp FROM produkCat c
              WHERE c.kodeCat=? ),?,?)`,
              [nojur, setKodeCat[i], "K", thpp]
            );
            let persediaan = await dbuse.query(
              `INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai)
              VALUES (?,(SELECT c.akunPersediaan FROM produkCat c
              WHERE c.kodeCat=? ),?,?)`,
              [nojur, setKodeCat[i], "D", thpp]
            );
          } else {
            // lawan cabang lain persediaan = harga dpp
            let persediaanL = await dbuse.query(
              `INSERT INTO detJur(kodeAkun,nomorJurnal,DK,nilai,msAC)
              VALUES ((SELECT c.akunPersediaan FROM produkCat c
              WHERE c.kodeCat=?),?,?,?,'M')`,
              [setKodeCat[i], nojur, "K", tdpp]
            );
          }
        }
      }
    }

    //   res.send({st:'Selesai...'})
  } catch (err) {
    console.log(err);
  }
}
app.post("/cektelpPIC", async (req, res) => {
  let { x } = req.body;
  x.nomorHP = x.nomorHP.replace(/-| /gi, "");
  try {
    let nomer = x.nomorHP.replace(/^(\+62|62|0)/, "");
    let a = await dbuse.query(
      `SELECT namaPartner, namaPIC, telpPIC, kodeCab, kodePartner FROM partner where telpPIC like '%${nomer}'`
    );
    res.send(a);
  } catch (error) {
    console.log(error);
    res.status.send("Nomor Belum terdaftar...");
  }
});

app.post("/cekNobukti", async (req, res) => {
  let { x } = req.body;
  try {
    let data = await dbuse.query(
      {
        namedPlaceholders: true,
        sql: `SELECT t.nomorBukti, t.nomorJurnal, t.nomorPO FROM transaksi t WHERE t.nomorPO = :nomorPO AND t.status != 'B'`,
      },
      x
    );
    res.send(data);
  } catch (error) {
    console.log(error);
    res.status.send("Nomor Belum terdaftar...");
  }
});
app.post("/getLog", async (req, res) => {
  let { x } = req.body;
  try {
    let data = await dbuse.query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT * FROM userLog WHERE ${x.bukti} = :${x.bukti}`,
      },
      x
    );
    res.send(data);
  } catch (error) {
    console.log(error);
    res.status.send("Nomor Belum terdaftar...");
  }
});
app.post("/trackService", async (req, res) => {
  let { x } = req.body;
  try {
    let data = await dbuse.query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT JSON_QUERY(s.userLog, '$') AS log FROM serviceCenter s WHERE s.nomorServis = :nomorServis`,
      },
      x
    );
    res.send(data);
  } catch (error) {
    console.log(error);
    res.status.send("Nomor Belum terdaftar...");
  }
});

// upload buktiTransaksi
async function uploadImage(req, res, next) {
  // to declare some path to store your converted image
  console.log(req);
  let matches = req.body.bukti.split(",");
  response = {};

  if (matches.length !== 3) {
    return new Error("Invalid input string");
  }

  response.type = matches[0].split(";")[0].split("/")[1];
  response.data = new Buffer.from(matches[1], "base64");
  let decodedImg = response;
  let imageBuffer = decodedImg.data;
  let type = decodedImg.type;
  let extension = mime.extension(type);
  let filename = "image." + extension;
  try {
    next({ filename, mimetype: extension, ...req.body });
  } catch (e) {
    next(e);
  }
}

app.post("/uploadBuktiTrans", async (req, res) => {
  const user = req.user.dtAkun;
  let { x } = req.body;
  // console.log(x)
  let imageBuffer = new Buffer.from(x.bukti.split(",")[1], "base64");
  x.mimetype = x.bukti.split(";")[0].split(":")[1];
  x.fileName = `${x.nomorBukti}_${new Date().getTime()}.${
    x.mimetype.split("/")[1]
  }`;
  try {
    fs.writeFileSync("./buktiTransaksi/" + x.fileName, imageBuffer, "utf8");
    let log = [{ akun: user.akun, waktu: new Date() }];
    dbuse
      .query(
        {
          namedPlaceholders: true,
          sql: `INSERT INTO lampiranTransaksi (nomorBukti, namaLampiran, fileName, extensi, lamplog)
        VALUES (:nomorBukti, :namaLampiran, :fileName, :mimetype, '${JSON.stringify(
          log
        )}')`,
        },
        x
      )
      .then((rows) => {
        res.send({ st: "Bukti tersimpan..." });
      })
      .catch((err) => {
        console.log(err);
        res.status(410).send({ st: "Belum ada data" });
      });
    /* await sharp(req.file.path)
      .resize(150)
      .png()
      .toFile(
        path.resolve(req.file.destination + `/${user.akun}.png`)
      )
    fs.unlinkSync(req.file.path) */
  } catch (error) {
    console.log(error);
    res.status(410).send("Harus file gambar...");
  }
});
app.get("/buktiTransaksi?", (req, res) => {
  let x = req.query.key;
  dbuse
    .query(`SELECT * FROM lampiranTransaksi WHERE nomorBukti =?`, [x])
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Belum ada lampiran..." });
    });
});

app.get("/lampiranTransaksi?", (req, res) => {
  const x = JSON.parse(req.query.key);
  const lokasi = path.join(__dirname, "buktiTransaksi");
  if (fs.existsSync(`${lokasi}/${x.fileName}`)) {
    // res.download(`${logo}/${x.fileName}`)
    res.send(fs.readFileSync(`${lokasi}/${x.fileName}`, "base64"));
  } else {
    res.status(410).send({ st: "Belum ada lampiran... " });
  }
});

app.post("/delLamp", (req, res) => {
  let { x } = req.body;
  const bukti = path.join(__dirname, "buktiTransaksi");
  fs.unlinkSync(`${bukti}/${x.fileName}`);
  dbuse
    .query(
      "DELETE FROM lampiranTransaksi WHERE idlampiranTransaksi=?",
      x.idlampiranTransaksi
    )
    .then((rows) => {
      res.send({ st: "Dokumen sudah dihapus... " });
    })
    .catch((err) => {
      console.log(err);
      res.status(410).send({ st: "Tidak ada file" });
    });
});

app.post("/taskData", async (req, res) => {
  let { x } = req.body;
  try {
    let data = await dbuse.query(
      {
        namedPlaceholders: true,
        dateStrings: true,
        sql: `SELECT p.*, JSON_QUERY(p.userLog, '$') AS userLog, JSON_QUERY(p.detOrder, '$') AS detOrder,JSON_QUERY(p.processed, '$') AS terproses, c.namaPartner, c.telpPIC,
      c.alamat, c.email, cb.namaCabang, cb.alamatCabang,
        COALESCE(b.biaya, 0) AS biaya, j.namaJenis AS jenisProject, j.akunUangmuka, pp.operator AS namaSales, pp.jnsProses as pJenisProses, pp.operator, pp.statusProses, pp.nomorProses, pp.hasilBagus, pp.hasilJelek, pp.sisa, pp.tglStart,pp.tglFinish
      FROM project p
        LEFT JOIN partner c ON c.kodePartner = p.kodePartner
        LEFT JOIN karyawan ky ON ky.kodeKar = p.salesID
        LEFT JOIN cabang cb ON cb.kodeCab = p.kodeCab
        LEFT JOIN projectJns j ON j.jnsProject = p.jnsProject
        LEFT JOIN (SELECT * FROM prosesproject PP  WHERE pp.statusProses NOT IN ('Selesai Proses', 'Selesai Revisi')) pp ON pp.nomorProject = p.nomorProject 
        LEFT JOIN (
          SELECT SUM(d.qtyInv * d.hargaSat) AS biaya, d.nomorProject
            FROM projectDetail d LEFT JOIN project p ON d.nomorProject = p.nomorProject
            WHERE p.status != 'Batal' AND p.kodeCab IN (:kodeCab)
            GROUP BY p.nomorProject
        ) b ON b.nomorProject = p.nomorProject
      WHERE p.kodeCab IN (:kodeCab) AND ((p.tglMasuk BETWEEN :tgla AND DATE_ADD(:tglb, INTERVAL 1439 MINUTE)) AND p.status NOT IN ('Batal', 'Closed')) 
      ORDER BY p.tglMasuk DESC`,
      },
      x
    );
    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  }
});
app.post("/proses", async (req, res) => {
  try {
    let x = req.body.x;

    // check if user exist
    let cekUser = await dbuse.query(
      `SELECT COUNT(operator) as operator, nomorProses FROM prosesproject WHERE nomorProject = '${x.nomorProject}' && operator = '${req.user.dtAkun.nama} '&& jnsProses = '${x.proses}'`
    );
    delete cekUser.meta;

    // get last number process
    let cekNum = await dbuse.query(
      `SELECT COUNT(nomorProses) as noProses FROM prosesproject WHERE nomorProject = '${x.nomorProject}' ORDER BY idprosesproject DESC LIMIT 1`
    );
    delete cekNum.meta;

    // if user not exist insert to table prosesProject
    if (cekUser[0].operator < 1) {
      // Function getNumberProcess
      if (parseInt(cekNum[0].noProses) > 0) {
        order = parseInt(cekNum[0].noProses) + 1;
        nomorProses = x.nomorProject + `_` + order.toString();
      } else {
        nomorProses = x.nomorProject + "_1";
      }

      // insert to Process Project
      let insertProses = await dbuse.query(
        `INSERT INTO prosesproject (jnsproses, operator, nomorProses, nomorProject, statusProses) VALUES ('${x.proses}', '${req.user.dtAkun.nama}', '${nomorProses}', '${x.nomorProject}', 'Proses')`
      );
      console.log(insertProses);
    } else {
      // update if user ever doing this process
      await dbuse.query(
        `UPDATE prosesproject SET tglStart = NOW(), statusProses = 'Proses' WHERE nomorProses = '${cekUser[0].nomorProses}'`
      );
    }

    //update project
    let updateProject = await dbuse.query(
      `UPDATE project SET curProcess = '${x.proses}', processed = (SELECT JSON_ARRAY_APPEND(processed, '$', '${x.proses}')), status = 'proses ${x.proses}' WHERE nomorProject = '${x.nomorProject}'`
    );

    res.status(200).send({ st: "Proses dimulai " });
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  } finally {
    console.log("sukses");
  }
});
app.post("/endProses", async (req, res) => {
  function addLeadingZeros(n) {
    if (n <= 9) {
      return "0" + n;
    }
    return n;
  }
  let currentDatetime = new Date();
  let formattedDate =
    currentDatetime.getFullYear() +
    "-" +
    addLeadingZeros(currentDatetime.getMonth() + 1) +
    "-" +
    addLeadingZeros(currentDatetime.getDate()) +
    " " +
    addLeadingZeros(currentDatetime.getHours()) +
    ":" +
    addLeadingZeros(currentDatetime.getMinutes()) +
    ":" +
    addLeadingZeros(currentDatetime.getSeconds());

  let x = req.body.x;
  console.log(x);
  let sisa = x.sisa !== null ? x.sisa : 0;
  let hasilBagus = x.hasilBagus !== null ? x.hasilBagus : 0;
  let hasilJelek = x.hasilJelek !== null ? x.hasilJelek : 0;

  let urt = new Date();
  let jn = "44";
  let cr =
    x.kodeCab +
    jn +
    String(urt.getMonth() + 1).padStart(2, "0") +
    String(urt.getFullYear()).slice(-2);
  let [nomJB] = await dbuse.query(
    `SELECT COUNT(t.nomorBukti) AS nom FROM transaksi t WHERE ISNULL(t.jn) AND t.nomorBukti like '${cr}%'`,
    [cr]
  );
  x.nomorBukti = cr + String(parseInt(nomJB.nom) + 1).padStart(6, "0");
  let crJ =
    x.kodeCab +
    "99" +
    String(urt.getMonth() + 1).padStart(2, "0") +
    String(urt.getFullYear()).slice(-2);
  let [nomJu] = await dbuse.query(
    `SELECT COUNT(nomorJurnal) AS nom FROM jurnal WHERE ISNULL(jn) AND nomorJurnal like '${crJ}%'`,
    [cr]
  );
  let nojur = crJ + String(parseInt(nomJu.nom) + 1).padStart(6, "0");

  try {
    const data = await dbuse.query({
      namedPlaceholders: true,
      sql: `UPDATE prosesProject SET sisa = '${(
        parseFloat(sisa) + parseFloat(x.waste)
      ).toFixed(1)}', hasilBagus = '${(
        parseFloat(hasilBagus) + parseFloat(x.good)
      ).toFixed(1)}', hasiljelek = '${(
        parseFloat(hasilJelek) + parseFloat(x.reject)
      ).toFixed(
        1
      )}', tglFinish = '${formattedDate}', statusProses = 'Selesai', jmlKonsumsi = ${
        parseFloat(sisa) +
        parseFloat(x.waste) +
        (parseFloat(hasilBagus) + parseFloat(x.good)) +
        (parseFloat(hasilJelek) + parseFloat(x.reject))
      }, mesin = '${x.mesin}'  WHERE nomorProses = '${x.nomorProses}'`,
    });

    const upd = await dbuse.query(
      `UPDATE project SET status = 'SelesaiProses', nomorPiutang = '${nojur}', tglSelesai = NOW(), curProcess = '' WHERE nomorProject = '${x.nomorProject}' `
    );
    let loger = [
      "user",
      req.user.dtAkun.nama,
      "userAkun",
      req.user.dtAkun.akun,
      "status",
      "Selesai",
      "Baik",
      x.good,
      "Sisa",
      x.waste,
      "Reject",
      x.reject,
      "mulai",
      x.tglStart,
      "selesai",
      x.tglFinish,
      "note",
      "-",
      "mesin",
      x.mesin,
    ];
    await dbuse.query(
      {
        sql: `UPDATE prosesProject SET logProses = (SELECT JSON_ARRAY_APPEND(logProses, '$', JSON_OBJECT(?))) WHERE nomorProses = ?`,
      },
      [loger, x.nomorProses]
    );

    res.status(200).send({ st: "Sukses..." });
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  } finally {
    console.log("sukses");
  }
});
app.post("/svProses", async (req, res) => {
  // Function to add 0 to month and date
  function addLeadingZeros(n) {
    if (n <= 9) {
      return "0" + n;
    }
    return n;
  }

  // Function to Format date
  let currentDatetime = new Date();
  let formattedDate =
    currentDatetime.getFullYear() +
    "-" +
    addLeadingZeros(currentDatetime.getMonth() + 1) +
    "-" +
    addLeadingZeros(currentDatetime.getDate()) +
    " " +
    addLeadingZeros(currentDatetime.getHours()) +
    ":" +
    addLeadingZeros(currentDatetime.getMinutes()) +
    ":" +
    addLeadingZeros(currentDatetime.getSeconds());

  // Recieve data
  let x = req.body.x;

  //  null safety & string covnertion to number
  let sisa = x.sisa !== null ? x.sisa : 0;
  let hasilBagus = x.hasilBagus !== null ? x.hasilBagus : 0;
  let hasilJelek = x.hasilJelek !== null ? x.hasilJelek : 0;
  let bagus = parseFloat(x.good);
  let reject = parseFloat(x.reject);
  let waste = parseFloat(x.waste);

  try {
    // Variable for status & log
    let state = "";
    let loger = [];

    // check if this process is not 'revisi'
    if (!x.isRevisi) {
      // Set status
      state = "Selesai Proses";

      // Logger
      loger = [
        "user",
        req.user.dtAkun.nama,
        "userAkun",
        req.user.dtAkun.akun,
        "status",
        "Selesai",
        "Baik",
        bagus,
        "Sisa",
        waste,
        "Reject",
        reject,
        "mulai",
        x.tglStart,
        "selesai",
        x.tglFinish,
        "mesin",
        x.mesin,
      ];
    } else {
      state = "Selesai Revisi";
      loger = [
        "user",
        req.user.dtAkun.nama,
        "userAkun",
        req.user.dtAkun.akun,
        "status",
        "Selesai",
        "Baik",
        x.good,
        "Sisa",
        x.waste,
        "Reject",
        x.reject,
        "mulai",
        x.tglStart,
        "selesai",
        x.tglFinish,
        "note",
        x.revNote,
        "mesin",
        x.mesin,
      ];
    }
    // update progress operator
    await dbuse.query({
      namedPlaceholders: true,
      sql: `UPDATE prosesProject SET sisa = '${(
        parseFloat(sisa) + parseFloat(x.waste)
      ).toFixed(1)}', hasilBagus = '${(
        parseFloat(hasilBagus) + parseFloat(x.good)
      ).toFixed(1)}', hasiljelek = '${(
        parseFloat(hasilJelek) + parseFloat(x.reject)
      ).toFixed(1)}', statusProses = '${state}',      
      jmlKonsumsi = ${
        parseFloat(sisa) +
        parseFloat(x.waste) +
        (parseFloat(hasilBagus) + parseFloat(x.good)) +
        (parseFloat(hasilJelek) + parseFloat(x.reject))
      }, mesin ='${x.mesin}'
      WHERE nomorProses = '${x.nomorProses}'`,
    });

    // Update status project
    if (state != "Disimpan") {
      await dbuse.query(
        `UPDATE project SET curProcess = '', status = 'selesai proses ${x.curProcess}' WHERE nomorProject = '${x.nomorProject}'`
      );
    }

    // Set Log process
    await dbuse.query(
      {
        sql: `UPDATE prosesProject SET logProses = (SELECT JSON_ARRAY_APPEND(logProses, '$', JSON_OBJECT(?))) WHERE nomorProses = ?`,
      },
      [loger, x.nomorProses]
    );
    // Result
    res.send({ st: `Proses selesai pada tanggal: ${formattedDate}` });
    console.log(state);
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  }
});
app.post("/simpanProses", async (req, res) => {
  // Function to add 0 to month and date
  function addLeadingZeros(n) {
    if (n <= 9) {
      return "0" + n;
    }
    return n;
  }

  // Function to Format date
  let currentDatetime = new Date();
  let formattedDate =
    currentDatetime.getFullYear() +
    "-" +
    addLeadingZeros(currentDatetime.getMonth() + 1) +
    "-" +
    addLeadingZeros(currentDatetime.getDate()) +
    " " +
    addLeadingZeros(currentDatetime.getHours()) +
    ":" +
    addLeadingZeros(currentDatetime.getMinutes()) +
    ":" +
    addLeadingZeros(currentDatetime.getSeconds());

  // Recieve data
  let x = req.body.x;

  //  null safety & string covnertion to number
  let sisa = x.sisa !== null ? x.sisa : 0;
  let hasilBagus = x.hasilBagus !== null ? x.hasilBagus : 0;
  let hasilJelek = x.hasilJelek !== null ? x.hasilJelek : 0;
  let bagus = parseFloat(x.good);
  let reject = parseFloat(x.reject);
  let waste = parseFloat(x.waste);

  let processed = JSON.parse(x.processed);
  let curProcess = x.curProcess;

  const updated = processed.filter((f) => f !== curProcess);

  try {
    // Variable for status & log
    let state = "";
    let loger = [];

    // check if this process is not 'revisi'
    if (!x.isRevisi) {
      // Logger
      state = "Disimpan";
      loger = [
        "user",
        req.user.dtAkun.nama,
        "userAkun",
        req.user.dtAkun.akun,
        "status",
        "Disimpan",
        "Baik",
        bagus,
        "Sisa",
        waste,
        "Reject",
        reject,
        "mulai",
        x.tglStart,
        "selesai",
        x.tglFinish,
        "mesin",
        x.mesin,
      ];
    } else {
      state = "Selesai Revisi";
      loger = [
        "user",
        req.user.dtAkun.nama,
        "userAkun",
        req.user.dtAkun.akun,
        "status",
        "Selesai",
        "Baik",
        x.good,
        "Sisa",
        x.waste,
        "Reject",
        x.reject,
        "mulai",
        x.tglStart,
        "selesai",
        x.tglFinish,
        "note",
        x.revNote,
        "mesin",
        x.mesin,
      ];
    }
    // update progress operator
    await dbuse.query({
      namedPlaceholders: true,
      sql: `UPDATE prosesProject SET sisa = '${(
        parseFloat(sisa) + parseFloat(x.waste)
      ).toFixed(1)}', hasilBagus = '${(
        parseFloat(hasilBagus) + parseFloat(x.good)
      ).toFixed(1)}', hasiljelek = '${(
        parseFloat(hasilJelek) + parseFloat(x.reject)
      ).toFixed(1)}', statusProses = '${state}',
      tglFinish = NOW(),
      jmlKonsumsi = ${
        parseFloat(sisa) +
        parseFloat(x.waste) +
        (parseFloat(hasilBagus) + parseFloat(x.good)) +
        (parseFloat(hasilJelek) + parseFloat(x.reject))
      }
      WHERE nomorProses = '${x.nomorProses}'`,
    });

    // Update status project
    console.log(JSON.stringify(updated));
    await dbuse.query(
      `UPDATE project SET status = 'Disimpan', processed = '${JSON.stringify(
        updated
      )}' WHERE nomorProject = '${x.nomorProject}'`
    );

    // Set Log process
    await dbuse.query(
      {
        sql: `UPDATE prosesProject SET logProses = (SELECT JSON_ARRAY_APPEND(logProses, '$', JSON_OBJECT(?))) WHERE nomorProses = ?`,
      },
      [loger, x.nomorProses]
    );
    // Result
    res.send({ st: `Proses selesai pada tanggal: ${formattedDate}` });
    console.log(state);
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  }
});

app.post("/prosesRevisi", async (req, res) => {
  let x = req.body.x;

  // Null safety
  let sisa = x.sisa !== null ? x.sisa : 0;
  let hasilBagus = x.hasilBagus !== null ? x.hasilBagus : 0;
  let hasilJelek = x.hasilJelek !== null ? x.hasilJelek : 0;
  try {
    // Save work and set to revisi
    await dbuse.query({
      namedPlaceholders: true,
      sql: `UPDATE prosesProject SET sisa = '${(
        parseFloat(sisa) + parseFloat(x.waste)
      ).toFixed(1)}', hasilBagus = '${(
        parseFloat(hasilBagus) + parseFloat(x.good)
      ).toFixed(1)}', hasiljelek = '${(
        parseFloat(hasilJelek) + parseFloat(x.reject)
      ).toFixed(1)}', statusProses = 'Selesai Proses',
      tglFinish = NOW(),
      jmlKonsumsi = ${(
        parseFloat(sisa) +
        parseFloat(x.waste) +
        (parseFloat(hasilBagus) + parseFloat(x.good)) +
        (parseFloat(hasilJelek) + parseFloat(x.reject))
      ).toFixed(1)}, mesin = '${x.mesin}'
      WHERE nomorProses = '${x.nomorProses}'`,
    });

    // Set status
    await dbuse.query(
      `UPDATE project SET processed = '[]', curProcess = '', status = 'Revisi' WHERE nomorProject = '${x.nomorProject}'`
    );
    res.send({ st: "success" });
  } catch (error) {
    console.log(error);
    res.send({ st: "error" });
  } finally {
    // Set log
    let loger = [
      "user",
      req.user.dtAkun.nama,
      "userAkun",
      req.user.dtAkun.akun,
      "status",
      "Selesai",
      "Baik",
      x.good,
      "Sisa",
      x.waste,
      "Reject",
      x.reject,
      "mulai",
      x.tglStart,
      "selesai",
      x.tglFinish,
      "mesin",
      x.mesin,
    ];
    await dbuse.query(
      {
        sql: `UPDATE prosesProject SET logProses = (SELECT JSON_ARRAY_APPEND(logProses, '$', JSON_OBJECT(?))) WHERE nomorProses = ?`,
      },
      [loger, x.nomorProses]
    );
  }
});
// app.post('/getDtProject', async (req, res) => {
//   let  d  = req.body.x
//   try {
//     // console.log(y.x);
//     console.log(d.kodeCab[0]);
//     let data = await dbuse.query({
//       namedPlaceholders: true,
//       sql: `SELECT a.*, b.* FROM project a LEFT JOIN prosesProject b ON a.nomorProject = b.nomorProject WHERE a.kodeCab = '${d.kodeCab[0]}' AND a.status = 'Selesai' ORDER BY a.idproject DESC`
//     }, x)
//     res.send(data)
//     // console.log(data);
//   }catch(error){
//     res.send({msg: 'hmm'})
//   }finally{

//   }
// })
app.post("/stopProses", async (req, res) => {
  let x = req.body.x;
  try {
    await dbuse.query(
      `UPDATE prosesproject SET tglFinish = NOW() WHERE nomorProses = '${x.nomorProses}'`
    );
    await dbuse.query(
      `UPDATE project SET status = 'proses input' WHERE nomorProject = '${x.nomorProject}'`
    );
    res.status(200).send({ st: "Proses Selesai" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ st: "Error" });
  }
});

app.post("/getDtProject", async (req, res) => {
  let dt = req.body.x;
  try {
    dbuse
      .query(
        `
    SELECT a.*, b.jnsProses, b.operator, b.logProses, JSON_QUERY(b.logProses, '$') AS logProses, JSON_QUERY(a.userLog, '$') AS userlog, c.namaCabang 
    FROM project a LEFT JOIN prosesProject b ON a.nomorProject = b.nomorProject 
    LEFT JOIN cabang c ON c.kodeCab = a.kodeCab 
    WHERE a.kodeCab = '${dt.kodeCab[0]}' AND a.status = 'Selesai' GROUP BY a.nomorProject
     ORDER BY a.idproject DESC`
      )
      .then((rows) => {
        res.send(rows);
      })
      .catch((err) => {
        console.log(err);
        res.status(410).send({ st: "gagal..." });
      });
    // let data = await dbuse.query({
    //   namedPlaceholders: true,
    //   dateStrings: true,
    //   sql: `SELECT a.*, b.jnsProses, b.operator, b.logProses, JSON_QUERY(b.logProses, '$') AS logProses, JSON_QUERY(a.userLog, '$') AS userlog FROM project a LEFT JOIN prosesProject b ON a.nomorProject = b.nomorProject WHERE a.kodeCab = '${x.kodeCab}' AND a.status = 'Selesai' ORDER BY a.idproject DESC`
    // }, x)
    // res.send(data)
    // console.log(data);
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  }
});

app.post("/getReportOperator", async (req, res) => {
  try {
    const data = await dbuse.query(`
    SELECT * FROM prosesProject `);
    res.send(data);
    console.log("success");
  } catch (error) {
    console.log(error);
    res.status(410).send({ st: "Belum tersimpan..." });
  }
});
app.listen(3001);
module.exports = {
  path: "/api/",
  handler: app,
};
