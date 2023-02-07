exports.inProductCat=(req,res)=>{
  let {x} = req.body
  dbuse.query("INSERT INTO product_category SET ?",[x])
    .then(rows=>{
      res.send({st:'Sukses'})
    })
    .catch(err=>{
      console.log(err)
      res.send({st:'Gagal simpan...'})
    })
}

exports.inProduct=async (req,res)=>{
  let {x} = req.body
  let a = await dbuse.query("INSERT INTO product SET ?",[x])
  try {
    dbuse.query("INSERT INTO stok SET product_id=?; INSERT INTO hpp SET product_id=?",[a.insertId,a.insertId])
    .then(rows=>{
      res.send({st:'Sukses'})
    })
    .catch(err=>{
      console.log(err)
      res.send({st:'Gagal simpan...'})
    })
  }
  catch{
    res.send({st:'Gagal simpan...'})
  }
}

exports.inPR=async (req,res)=>{
  let {x} = req.body
  dbuse.query("INSERT INTO purchace_order SET ?",[x])  
    .then(rows=>{
      res.send({st:'Sukses'})
    })
    .catch(err=>{
      console.log(err)
      res.send({st:'Gagal simpan...'})
    })
}

exports.inSO=async (req,res)=>{
  let {x} = req.body
  dbuse.query("INSERT INTO sales_order SET ?",[x])
     .then(rows=>{
      res.send({st:'Sukses'})
    })
    .catch(err=>{
      console.log(err)
      res.send({st:'Gagal simpan...'})
    })  
}

exports.inSOdet=async (req,res)=>{
  let {x} = req.body
  dbuse.query("INSERT INTO sales_order_detail SET ?",[x])
     .then(rows=>{
      res.send({st:'Sukses'})
    })
    .catch(err=>{
      console.log(err)
      res.send({st:'Gagal simpan...'})
    })  
}

