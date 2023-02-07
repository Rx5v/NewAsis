exports.inuser=(req,res)=>{
  let {x} = req.body
  dbuse.query("INSERT INTO m_user_access SET ?",[x])
    .then(rows=>{
      res.send({st:'Sukses'})
    })
    .catch(err=>{
      console.log(err)
      res.send({st:'Gagal simpan...'})
    })
}

exports.inEmployee=(req,res)=>{
  let {x} = req.body
  dbuse.query("INSERT INTO m_employee SET ?",[x])
    .then(rows=>{
      res.send({st:'Sukses'})
    })
    .catch(err=>{
      console.log(err)
      res.send({st:'Gagal simpan...'})
    })
}

exports.inBranch=(req,res)=>{
  let {x} = req.body
  dbuse.query("INSERT INTO m_company SET ?",[x])
    .then(rows=>{
      res.send({st:'Sukses'})
    })
    .catch(err=>{
      console.log(err)
      res.send({st:'Gagal simpan...'})
    })
}

exports.inGroupBranch=(req,res)=>{
  let {x} = req.body
  dbuse.query("INSERT INTO company_group SET ?",[x])
    .then(rows=>{
      res.send({st:'Sukses'})
    })
    .catch(err=>{
      console.log(err)
      res.send({st:'Gagal simpan...'})
    })
}

exports.inCoaGroup=(req,res)=>{
  let {x} = req.body
  dbuse.query("INSERT INTO m_coa_group SET ?",[x])
    .then(rows=>{
      res.send({st:'Sukses'})
    })
    .catch(err=>{
      console.log(err)
      res.send({st:'Gagal simpan...'})
    })
}
exports.inCoaSub=(req,res)=>{
  let {x} = req.body
  dbuse.query("INSERT INTO m_coa_sub SET ?",[x])
    .then(rows=>{
      res.send({st:'Sukses'})
    })
    .catch(err=>{
      console.log(err)
      res.send({st:'Gagal simpan...'})
    })
}

exports.inCoa=(req,res)=>{
  let {x} = req.body
  dbuse.query("INSERT INTO m_coa SET ?",[x])
    .then(rows=>{
      res.send({st:'Sukses'})
    })
    .catch(err=>{
      console.log(err)
      res.send({st:'Gagal simpan...'})
    })
}

// global partner => cust, vendor
exports.inCust=(req,res)=>{
  let {x} = req.body
  dbuse.query("INSERT INTO partner SET ?",[x])
    .then(rows=>{
      res.send({st:'Sukses'})
    })
    .catch(err=>{
      console.log(err)
      res.send({st:'Gagal simpan...'})
    })
}
