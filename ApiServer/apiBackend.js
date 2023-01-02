const express = require('express')
const crypto = require('crypto')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const mysql = require('mariadb')
const jwt = require('express-jwt')
const jsonwebtoken = require('jsonwebtoken')
const cors = require('cors')

// Create app
const app = express()

// Install middleware
app.use(cookieParser())
app.use(bodyParser.json())
app.use(cors())
const dbConf = require('./dbConfig.json')

const dbuse = mysql.createPool(dbConf.cfg1);
class Database {
  constructor( x ) {
      this.connection = mysql.createPool( x );
  }
  query( sql, args ) {
      return new Promise( ( resolve, reject ) => {

          this.connection.query( sql, args, ( err, rows ) => {
              if ( err )
                  return reject( err );
              resolve( rows );
          } );
      } );
  }
  close() {
      return new Promise( ( resolve, reject ) => {
          this.connection.end( err => {
              if ( err )
                  return reject( err );
              resolve();
          } );
      } );
  }
}


app.use(
  jwt({
    secret: 'rahasia'
  }).unless({
    path: ['/api/auth/login','/api/login','/login']
  })
)

app.get('/oke',(req,res)=>{
  res.send({st:'Oke'})
})

app.post('/login', async (req, res) => {
  const { username, password } = req.body
  const valid = username.length
  let pass = crypto.createHmac('sha256', username)
        .update(password)
        .digest('hex');
  console.log(pass)
  try{
    let dtAkun = await dbuse.query(`SELECT e.email AS akun, e.password,e.userType,e.lastLogin,
      e.namaKaryawan AS nama, e.jabatan, e.eID,e.kodeCab
      FROM karyawan e 
      WHERE e.email=? AND e.active='Y'`,[username])
    if(pass === dtAkun[0].password){
      delete dtAkun[0].password
 //    console.log(dtAkun)
      const accessToken = jsonwebtoken.sign({dtAkun},'rahasia',{ expiresIn: 60 * 60 * 5 })
      res.json({
        token: {
          accessToken
        }
      })
      let lgn = new Date()
      dbuse.query("UPDATE userAkun SET lastLogin=?",[lgn])
        .catch(err=>{
          console.log(err)
        })
    } else {
  //       console.log(err)
      res.status(401).send('Salah password')
    }
  }
  catch(err) {
    console.log(err)
    res.status(401).send('Perlu login...')
  }
})
// [GET] /user
app.get('/user', (req, res) => {
  res.json({ user: req.user })
})

app.get('/dtuser',(req,res)=>{
  dbuse.query(`SELECT e.*,c.namaCabang FROM karyawan e LEFT JOIN cabang c ON e.kodeCab=c.kodeCab
    ORDER BY e.kodeCab ASC`)
    .then(rows=>{
      delete rows[0].password
      res.send(rows)
    })
    .catch(err=>res.send({st:'tidak nemu...'}))
})
app.post('/inuser',(req,res)=>{
  let {x} = req.body
  x.pass = crypto.createHmac('sha256', x.email)
    .update('salesAston')
    .digest('hex')
  dbuse.query({
    namedPlaceholders:true,
    sql:`INSERT INTO karyawan (npp,namaKaryawan,alamat,ktp,telp,bank,masuk,keluar,jabatan,kodeCab,email,userType,active,password) 
      VALUES (:npp,:namaKaryawan,:alamat,:ktp,:telp,:bank,:masuk,:keluar,:jabatan,:kodeCab,:email,:userType,:active,:pass)
      ON DUPLICATE KEY UPDATE
      npp=:npp,namaKaryawan=:namaKaryawan,alamat=:alamat,ktp=:ktp,telp=:telp,bank=:bank,
      masuk=:masuk,keluar=:keluar,jabatan=:jabatan,kodeCab=:kodeCab,email=:email,userType=:userType,active=:active`
  },x)
  .then(rows=> res.send({st:'Tersimpan...'}))
  .catch(err=>{
    console.log(err)
    res.status(402).send({st:'Tidak ditemukan...'})
  })
})

app.post('/upuser',(req,res)=>{
  let {x}=req.body
  let akun = req.user.dtAkun[0].userType==='MAN' ? x.email : req.user.dtAkun[0].akun
  let pass = crypto.createHmac('sha256', akun)
    .update(x.password)
    .digest('hex');
  dbuse.query(`UPDATE karyawan SET password=? WHERE email=?`,[pass,akun])
  .then(rows=> res.send({st:'Tersimpan...'}))
  .catch(err=>res.send({st:'gagal...'}))
})

app.get('/cabang',(req,res)=>{
  dbuse.query("SELECT * FROM cabang ORDER BY kodeCab ASC")
    .then(rows=> res.json(rows))
    .catch(err=>res.send({st:'gagal...'}))
})

// [POST] /logout
app.get('/logout', (req, res) => {
  res.json({ status: 'OK' })
})


app.get('/products',(req,res)=>{
  dbuse.query(`SELECT p.*, c.* 
    FROM produk p 
    LEFT JOIN produkCat c ON p.kodeCat=c.kodeCat
    LEFT JOIN merk m ON p.kodeMerk=m.kodeMerk`)
    .then(rows=> res.send(rows))
    .catch(err=>{
      console.log(err)
      res.status(402).send({st:'Tidak ditemukan...'})
    })
})

app.get('/dtProdukCat',(req,res)=>{
  dbuse.query(`SELECT c.*,cp.namaAkun AS Persediaan, cj.namaAkun AS Penjualan, ch.namaAkun AS Hpp
    FROM produkCat c
    LEFT JOIN COA cp ON c.akunPersediaan=cp.kodeAkun
    LEFT JOIN COA cj ON c.akunPenjualan=cj.kodeAkun
    LEFT JOIN COA ch ON c.akunHpp=ch.kodeAkun
    ORDER BY c.kodeCat ASC`)
    .then(rows=> res.send(rows))
    .catch(err=>{
      console.log(err)
      res.status(402).send({st:'Tidak ditemukan...'})
    })
})

app.post('/addProdukCat',(req,res)=>{
  let {x}= req.body
  console.log(x)
  dbuse.query({
    namedPlaceholders:true,
    sql:`INSERT INTO produkCat (kodeCat,produkCategory,akunPersediaan,akunPenjualan,akunHpp) 
      VALUES (:kodeCat,:produkCategory,:akunPersediaan,:akunPenjualan,:akunHpp)
      ON DUPLICATE KEY UPDATE kodeCat=:kodeCat, produkCategory=:produkCategory,akunPersediaan=:akunPersediaan,akunPenjualan=:akunPenjualan,akunHpp=:akunHpp `
  },x)
  .then(rows=> res.send({st:'Tersimpan...'}))
  .catch(err=>{
    console.log(err)
    res.status(402).send({st:'Tidak ditemukan...'})
  })
})
app.get('/crproduk?',(req,res)=>{
  let a = req.query.key
  let b = `%${a}%`
  dbuse.query(`SELECT p.*, c.*,h.${req.user.dtAkun[0].kodeCab} AS hpp
    FROM produk p 
    LEFT JOIN produkCat c ON p.kodeCat=c.kodeCat
    LEFT JOIN merk m ON p.kodeMerk=m.kodeMerk    
    LEFT JOIN hpp h ON p.kodeProduk=h.kodeProduk
    WHERE p.namaProduk like ? OR p.kodeProduk like ?
    LIMIT 10`,[b,b])
    .then(rows=> res.send(rows))
    .catch(err=>{
      console.log(err)
      res.status(402).send({st:'Tidak ditemukan...'})
    })
})

app.get('/crpartner?',(req,res)=>{
  let {key,jns} = req.query
  console.log(key,jns)
  let a = `%${key}%`
  dbuse.query(`SELECT * FROM partner WHERE jnsPartner=? AND namaPartner like ?`,[jns,a])
    .then(rows=> res.send(rows))
    .catch(err=>{
      console.log(err)
      res.status(402).send({st:'Tidak ditemukan...'})
    })
})

app.post('/products',(req,res)=>{
  let x = req.body
  console.log(x)
  res.send({st:'Sukses...'})
})

app.get('/stok',(req,res)=>{
  let kodeCab = req.user
  console.log(kodeCab)
  dbuse.query(`SELECT s.kodeProduk, p.namaProduk, s.CB01 AS saldo 
    FROM stock s LEFT JOIN produk p ON s.kodeProduk=p.kodeProduk`)
    .then(rows=>{
      res.send(rows)
    })
    .catch(err=>{
//      throw new Error(err)
      res.status(500).send({st:'error...'})      
    })
})

app.get('/cekStok?',(req,res)=>{
  let kodeCab = req.user.dtAkun[0].kodeCab
  console.log(kodeCab)
  let x = req.query.key
  dbuse.query(`SELECT s.CB01 AS saldo 
    FROM stock s WHERE s.kodeProduk = ?`,[x])
    .then(rows=>{
      res.send(rows)
    })
    .catch(err=>{
//      throw new Error(err)
      res.status(500).send({st:'error...'})      
    })
})

app.get('/dtpr',(req,res)=>{
  dbuse.query(`SELECT p.*,DATE_FORMAT(p.tglRequest,'%Y-%m-%d') AS tglRequest, cb.kodeCab, cb.namaCabang FROM PR p
    LEFT JOIN cabang cb ON p.cabID=cb.kodeCab
    ORDER BY p.tglRequest ASC`)
    .then(rows=> res.send(rows))
    .catch(err=>{
//      throw new Error(err)
      res.status(500).send({st:'ndak nemu...'})
    })
})

app.post('/addPR',async (req,res)=>{
  let { hd,det } = req.body.x
  let hPR = {}
  hPR.tglRequest = hd.tglRequest
  hPR.cabID = req.user.dtAkun[0].kodeCab // nko diambil soko session user e
 // hPR.oleh = req.user.user[0].akun
  try{
    let urt = hd.tglRequest.replace(/-/gi,'')
    let cr = 'PR'+urt+'%'
    let nomPR = await dbuse.query('SELECT COUNT(t.nomorPR) AS nom FROM PR t WHERE t.nomorPR like ?',[cr])
    hPR.nomorPR = 'PR'+urt+String(parseInt(nomPR[0].nom)+1).padStart(5,'0')
    let trxID = await dbuse.query(`INSERT INTO PR (cabID,tglRequest,nomorPR) VALUES (?,?,?)`,[re.user.dtAkun[0].kodeCab,hd.tglRequest,hPR.nomorPR])  
    let col = await det.map(a=>{
      let u = a
      u.idPR = trxID.insertId
      return u
    })
    let st = ['idPR','kodeProduk','qty']
  //  let val = await col.map(a => Object.values(a))
    let val = col.map(a =>{
      let u =[]
      for(let i in st){
        a[st[i]]==undefined ? u.push('0') : u.push(a[st[i]])
      }
      return u
    })
    console.log(val)

    dbuse.batch(`INSERT INTO detPR (idPR,kodeProduk,qty) VALUES (?,?,?)`,val)
    .then(rows=>res.send({st:'Sukses...'}))
    .catch(err=>{
      console.log(err)
      //throw new error(err)
    })
  }
  catch(err){
    console.log(err)
    res.status(500).send({st:'cek data...'})
  }

})

app.post('/detpr',(req,res)=>{
  let {x}= req.body
  dbuse.query("SELECT d.*, p.namaProduk FROM detPR d LEFT JOIN produk p ON d.kodeProduk=p.kodeProduk WHERE idPR=?",[x.idPR])
    .then(rows=>res.send(rows))
    .catch(err=>{
      console.log(err)
      //throw new error(err)
    })
})
app.get('/expartner',(req,res)=>{
  dbuse.query("SELECT * FROM partner WHERE jnsPartner='Exp' Order By namaPartner")
    .then(rows=>res.send(rows))
    .catch(err=>{
      console.log(err)
      //throw new error(err)
    })
})

app.post('/jualbeli',async (req,res)=>{
  let { hd,det,exp } = req.body.x
  console.log(hd)
  console.log(det)
  hd.cabID = req.user.dtAkun[0].kodeCab
  hd.salesID = req.user.dtAkun[0].eID
  if(hd.jnsTrx === 'J'){
    hd.asal = req.user.dtAkun[0].kodeCab
    hd.tujuan=hd.cabLain
  } else{
    hd.tujuan = req.user.dtAkun[0].kodeCab
    hd.asal = hd.cabLain
  }
  hd.tglKirim = hd.tgl
  hd.cabID = req.user.dtAkun[0].kodeCab // nko diambil soko session user e
 // hPR.oleh = req.user.user[0].akun
  try{
    let urt = hd.tglKirim.replace(/-/gi,'')
    let cr = 'JB'+urt+'%'
    let nomJB = await dbuse.query('SELECT COUNT(t.nomorBukti) AS nom FROM transaksi t WHERE t.nomorBukti like ?',[cr])
    hd.nomorBukti = 'JB'+urt+String(parseInt(nomJB[0].nom)+1).padStart(5,'0')
    
    if(hd.ac){
      // antar cabang
      var trxID = await dbuse.query(`INSERT INTO transaksi (cabID,tglKirim,nomorBukti,salesID,asal,tujuan,jnsTrx,status) VALUES (?,?,?,?,?,?,?,?,?)`,[hd.cabID,hd.tglKirim,hd.nomorBukti,1,hd.asal,hd.tujuan,hd.jnsTrx,hd.status,'Y'])  
    }else{
      // vendor / cust
      var trxID = await dbuse.query(`INSERT INTO transaksi (cabID,tglKirim,nomorBukti,salesID,kodePartner,jnsTrx,status,asal,tujuan) VALUES (?,?,?,?,?,?,?,?,?)`,[hd.cabID,hd.tglKirim,hd.nomorBukti,1,hd.kodePartner,hd.jnsTrx,hd.status,hd.asal,hd.tujuan])
    }
      let col = await det.map(a=>{
      let u = a
      u.trxID = trxID.insertId
      u.nomorBukti = hd.nomorBukti
      return u
    })
    let st = ['trxID','nomorBukti','kodeProduk','qty','jmlHarga','hpp','ppn','dpp']
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
    exp.kodeCab = hd.cabID
    if( exp.biaya >0)
      dbuse.query({ namedPlaceholders: true, sql: "INSERT INTO expedisi (kodeCab, partnerID,biaya,nomorBukti) VALUES (:kodeCab, :partnerID,:biaya,:nomorBukti)" },exp)
    dbuse.batch(`INSERT INTO detTrans (trxID,nomorBukti,kodeProduk,qty,jmlHarga,hpp,ppn,dpp) VALUES (?,?,?,?,?,?,?,?)`,val)
    .then(rows=>{
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
  }
  catch(err){
    res.status(500).send({st:'belum tersimpan...'})
    console.log(err)
  }

})

app.get('/dtTrx?',(req,res)=>{
  let x = req.query.key
  let cabID = req.user.dtAkun[0].kodeCab // ambil req.user
  let a = (x === 'J') ? 't.asal=? ' : 't.tujuan=? '
  dbuse.query(`SELECT t.*,DATE_FORMAT(t.tglKirim,'%Y-%m-%d') AS tglKirim, cb.kodeCab, cb.namaCabang, e.biaya,p.namaPartner
    FROM transaksi t
    LEFT JOIN cabang cb ON t.cabID=cb.kodeCab
    LEFT JOIN expedisi e ON t.nomorBukti=e.nomorBukti
    LEFT JOIN partner p ON t.kodePartner=p.kodePartner
    WHERE ${a}
    ORDER BY t.tglKirim ASC`,[cabID])
    .then(rows=> res.send(rows))
    .catch(err=>{
//      throw new Error(err)
      res.status(500).send({st:'ndak nemu...'})
    })
})

app.post('/detTrx',(req,res)=>{
  let {x}= req.body
  dbuse.query(`SELECT d.*, p.namaProduk, cat.akunPersediaan, cat.akunPenjualan, cat.akunHpp
    FROM detTrans d LEFT JOIN produk p ON d.kodeProduk=p.kodeProduk
    LEFT JOIN produkCat cat ON p.kodeCat=cat.kodeCat
    WHERE trxID=?`,[x.trxID])
    .then(rows=>res.send(rows))
    .catch(err=>{
      console.log(err)
      //throw new error(err)
    })
})

app.get('/dtpartner',(req,res)=>{
  dbuse.query(`SELECT p.*, k.jenisCust FROM partner p 
    LEFT JOIN CustCat k ON p.catPartner= k.idCustCat
    ORDER BY p.kodePartner ASC`)
    .then(rows=>res.send(rows))
    .catch(err=>{
      console.log(err)
      //throw new error(err)
    })
})

app.post('/addPartner',async (req,res)=>{
  let { x } = req.body
  console.log(x)
  try{
    let urut = await dbuse.query("SELECT COUNT(kodePartner) AS nom FROM partner WHERE jnsPartner=?",[x.jnsPartner])
    x.kodePartner = x.jnsPartner.slice(0,1)+(urut[0].nom+1).toString().padStart(7,'0')
    dbuse.query(
      { namedPlaceholders:true,
        sql:`INSERT INTO partner (kodePartner,namaPartner,jnsPartner,alamat,catPartner)
              VALUES (:kodePartner,:namaPartner,:jnsPartner,:alamat,:catPartner)`
      },
      x)
      .then(rows=>{
        res.send({st:'oke'})
      })
      .catch(err=>{
        console.log(err)
        throw err
      })
  }
  catch(err){
    res.status(500).send({st:'gagal...'})
  }
  /* dbuse.query(`SELECT p.* FROM partner p ORDER BY p.kodePartner ASC`)
    .then(rows=>res.send(rows))
    .catch(err=>{
      console.log(err)
      //throw new error(err)
    }) */
})

app.get('/jnscust',(req,res)=>{
  dbuse.query("SELECT * FROM CustCat ORDER BY jenisCust ASC")
    .then(rows=>res.send(rows))
    .catch(err=>{
      console.log(err)
      //throw new error(err)
    })
})

app.post('/konfirm',async (req,res)=>{
  let x = req.body.x
  console.log(x)
  try{
    let hd = await dbuse.query("SELECT * FROM transaksi WHERE nobukti=?",[x.nobukti])
    let det = await dbuse.query("SELECT * FROM detTrans WHERE nobukti = ?",[x.nobukti])
    let exp = await dbuse.query("SELECT * FROM expedisi WHERE nobukti=?",[x.nobukti])
    Promise.all([hd,det,exp])
      .then(rows =>{
        console.log(hd,det,exp)
//        trxTerima(hd,det,exp)
      })
      .catch(err=>{
        console.log(err)
      })
  }
  catch(err){
    console.log(err)
    res.status(501).send({st:'Cek ulang...'})
  }
})


// akunting

app.get('/dtjurnal',async(req,res)=>{
  dbuse.query(`SELECT d.*,a.namaAkun,DATE_FORMAT(j.tglJurnal,'%Y-%m-%d') AS tgl, j.judulJurnal,cabID,e.namaKaryawan,p.namaPartner FROM detJur d 
    LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
    LEFT JOIN COA a ON d.kodeAkun=a.kodeAkun
    LEFT JOIN partner p ON d.kodePartner=p.kodePartner
    LEFT JOIN karyawan e ON d.eID=e.eID
    ORDER BY d.nomorJurnal,d.DK,d.iddetJur ASC`)
    .then(rows=>{
      res.send(rows)
    })
    .catch(err=>{
      console.log(err)
      res.status(501).send({st:'tidak ditemukan...'})
    })
})

app.get('/dthp',async(req,res)=>{
  let {key} = req.query
  console.log(key)
  dbuse.query(`SELECT d.*, p.namaPartner, DATE_FORMAT(j.tglJurnal,'%Y-%m-%d') AS tgl, j.judulJurnal
    FROM detJur d LEFT JOIN jurnal j ON d.nomorJurnal=j.nomorJurnal
    LEFT JOIN partner p ON d.kodePartner=p.kodePartner
    WHERE d.jhp=?`,[key])
    .then(rows=> res.send(rows))
    .catch(err=>{
      console.log(err)
      res.status(501).send({st:'tidak nemu...'})
    })
})

app.get('/subAkun',async(req,res)=>{
  dbuse.query(`SELECT s.* FROM subAkun s ORDER BY s.kodeSubAkun ASC`)
    .then(rows=>res.send(rows))
    .catch(err=>{
      console.log(err)
      res.status(501).send({st:'tidak ada...'})
    })
})

app.get('/dtcoa',(req,res)=>{
  dbuse.query(`SELECT c.*, s.namaSubAkun,s.arusKas,m.namaMidSub,g.namaGrupAkun,g.neraca,g.rugilaba
    FROM COA c 
      LEFT JOIN subAkun s ON c.subAkun=s.kodeSubAkun
      LEFT JOIN midSub m ON s.midSub=m.kodeMidSub
      LEFT JOIN grupAkun g ON m.kodeGrup=g.kodeGrupAkun
    ORDER BY c.kodeAkun ASC`)
    .then(rows=>res.send(rows))
    .catch(err=>{
      console.log(err)
      res.status(501).send({st:'tidak ada...'})
    })
})
// Error handler
app.use((err, req, res, next) => {
  console.error(err) // eslint-disable-line no-console
  res.status(401).send('Login sik mas bro...')
})


// global function

async function trxTerima(hd,col,exp) {
  console.log(hd)
  console.log(col)
  try{
    // hd = header Trx, col = detail trx
    for(let i in col){
      // antar cabang belum
      let stk = hd.jnsTrx === 'J' ? `${hd.asal} = ${hd.asal}-?` : `${hd.tujuan} = ${hd.tujuan}+?`
      dbuse.query(`UPDATE stock SET ${stk} WHERE kodeProduk=?`,[col[i].qty,col[i].kodeProduk])
      .catch(err=>{
        console.log(err)
      })
    }
    let judul = hd.jnsTrx==='J' ? 'Penjualan' : 'Pembelian'
    let jhp = (hd.ct ==='tempo' && hd.jnsTrx ==='B') ? 'H' : (hd.ct ==='tempo' && hd.jnsTrx ==='J') ? 'P' : 'L'
    let status = hd.ct==='admin' ? 'L' :'O'
    let cr = 'JU'+hd.jnsTrx+hd.tglKirim.replace(/-/gi,'')
    let urut = await dbuse.query("SELECT COUNT(nomorJurnal) AS nom FROM jurnal WHERE nomorJurnal like '?%'",[cr])
    let nojur = cr+String(parseInt(urut[0].nom)+1).padStart(5,'0')
    let nomerJurnal = await dbuse.query(`INSERT INTO jurnal(cabID,nomorJurnal,tglJurnal,jnsJurnal,kodePartner,cabLain,judulJurnal)
      VALUES (?,?,?,?,?,?,?)`,[hd.cabID,nojur,hd.tglKirim,hd.jnsTrx,hd.kodePartner,hd.cabLain,judul])
    // add detail jurnal penjualan, hpp per kategori produk
    console.log(nomerJurnal)
    if(hd.jnsTrx==='J'){
      let kas, kodePartner
      let eID = hd.salesID
      switch(hd.ct){
        case 'admin' :
          kas = '110100001' // kas kecil
          kodePartner=''
          break;
        case 'tempo':
          kas = '110500001' // piutang dagang
          kodePartner = hd.kodePartner

          break;
        default :
          eID = hd.salesID
          kas = '110100003' // kas sales
          kodePartner='' // akun kas sales
      }
      
      // per kategori detail dulu
      
      // detail jurnal
      // insert total penjualan=> kas / piutang
      dbuse.query(`INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,status,eID,cabLain,kodePartner,jhp) VALUES (?,?,?,?,?,?,?,?,?)`,[nojur,kas,'D',hd.total,status,eID,hd.cabLain,kodePartner,jhp])
        .catch(err=>{
          console.log(err)
        })
      // expedisi
      if(exp.biaya){
        let HutExpedisi = '210150003'
        dbuse.query(`INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,kodePartner,jhp,status) VALUES (?,?,?,?,?,?,'O')`,[nojur,HutExpedisi,'K',exp.biaya,exp.partnerID,'H'])
          .catch(err=>{
            console.log(err)
          })
      }
      // insert penjualan, hpp,persediaan per barang
      for(let i in col){
        // penjualan
        let penjualan = await dbuse.query(`INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai) VALUES (?,(SELECT c.akunPenjualan FROM produk p LEFT JOIN produkCat c ON p.kodeCat=c.kodeCat WHERE p.kodeProduk=? ),?,?)`,[nojur,col[i].kodeProduk,'K',col[i].dpp])
        let ppnKel = await dbuse.query(`INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai) VALUES (?,?,?,?)`,[nojur,'210400005','K',col[i].ppn])
        let hpp = await dbuse.query(`INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai) VALUES (?,(SELECT c.akunHpp FROM produk p LEFT JOIN produkCat c ON p.kodeCat=c.kodeCat WHERE p.kodeProduk=? ),?,?)`,[nojur,col[i].kodeProduk,'D',col[i].hpp])
        let persediaan = await dbuse.query(`INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai) VALUES (?,(SELECT c.akunPersediaan FROM produk p LEFT JOIN produkCat c ON p.kodeCat=c.kodeCat WHERE p.kodeProduk=? ),?,?)`,[nojur,col[i].kodeProduk,'K',col[i].hpp])
        Promise.all([penjualan,hpp,ppnKel,persediaan])
        .then(ok=>{
          console.log(ok)
        })
      }
    }else{
      let kas,kodeCab, kodePartner, eID
      switch(hd.ct){
        case 'admin' :
          kas = '110100001'
          break;
        case 'tempo':
          kas = '210100001' // Hutang dagang
          kodePartner = hd.kodePartner
          break;
        default :
          kas = '210100001' // Hutang dagang
          kodePartner = hd.kodePartner
      }
      // insert total biaya => kas / hutang
      dbuse.query(`INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,status,cabLain,kodePartner,jhp) VALUES (?,?,?,?,?,?,?,?)`,
        [nojur,kas,'K',hd.total,status,hd.cabLain,kodePartner,jhp])
        .catch(err=>{
          console.log(err)
        })
      // Biaya dibayar dimuka => expedisi karena masuk ke hpp persediaan
      if(exp.biaya){
        let HutExpedisi = '210150003'
        let akunExp = '110600006'
        dbuse.query(`INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai) VALUES (?,?,?,?)`,[nojur,akunExp,'D',exp.biaya])
          .catch(err=>{
            console.log(err)
          })
        dbuse.query(`INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai,kodePartner,jhp,status) VALUES (?,?,?,?,?,?,'O')`,[nojur,HutExpedisi,'K',exp.biaya,exp.partnerID,'H'])
          .catch(err=>{
            console.log(err)
          })
      }
      // insert Pembelian, hpp,ppn,persediaan per barang
      for(let i in col){
        // pembelian
        let ppnMas = await dbuse.query(`INSERT INTO detJur(nomorJurnal,kodeAkun,DK,nilai) VALUES (?,?,?,?)`,[nojur,'210400005','D',col[i].ppn])
        let persediaan = await dbuse.query(`INSERT INTO detJur(kodeAkun,nomorJurnal,DK,nilai) VALUES ((SELECT c.akunPersediaan FROM produk p LEFT JOIN produkCat c ON p.kodeCat=c.kodeCat WHERE p.kodeProduk=?),?,?,?)`,[col[i].kodeProduk,nojur,'D',col[i].hpp])
        let updHpp = await dbuse.query(`UPDATE hpp h LEFT JOIN stock s ON h.kodeProduk=s.kodeProduk
            SET h.CB01=((h.CB01 * s.CB01)+ ?)/(s.CB01+?) WHERE h.kodeProduk=?`,[col[i].hpp,col[i].qty,col[i].kodeProduk])
        // update hpp per produk
        Promise.all([ppnMas,persediaan,updHpp])
        .then(ok=>{
          console.log(ok)
        })
      }

    }

 //   res.send({st:'Selesai...'})
  }
  catch(err){
    console.log(err)
    
 //   res.status(501).send({st:'gagal simpan...'})
  }
}



module.exports = {
  path : '/api/',
  handler : app
}
// app.listen('1500')