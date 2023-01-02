exports.vendor= (req,res)=>{
  let x = req.query.key
  dbuse2.query(`SELECT * FROM partner WHERE vendor='Y' AND p_name like '%?%'`,[x])
    .then(rows=>{
      res.send(rows)
    })
    .catch(err=>{
      console.log(err)
      res.status(410).send('err mas')
    })
}
exports.cust= (req,res)=>{
  let x = req.query.key
  dbuse2.query(`SELECT * FROM partner WHERE cust='Y' AND p_name like '%?%'`,[x])
    .then(rows=>{
      res.send(rows)
    })
    .catch(err=>{
      console.log(err)
      res.status(410).send('err mas')
    })
}
