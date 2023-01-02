exports.bubes= async (req,res)=>{
  let {kodeAkun, tgla,tglb } = req.body.x
  let kodeCab = req.user.dtAkun[0].kodeCab
  let sawal ={}
  let dt = await dbuse.query(`SELECT if(dt.DK='D',dt.nilai,0) AS debit, if(dt.DK='K',dt.nilai,0) AS kredit, dt.desk,
      DATE_FORMAT(trx.tglJurnal,'%Y-%m-%d') AS tgl, trx.nomorJurnal,trx.judulJurnal 
      FROM detJur dt LEFT JOIN jurnal trx ON dt.nomorJurnal=trx.nomorJurnal 
      WHERE (trx.tglJurnal BETWEEN ? AND ?) AND dt.kodeAkun =? AND trx.status !='B'
      ORDER BY trx.tglJurnal,trx.nomorJurnal `,[tgla,tglb,kodeAkun])
  dbuse.query(`SELECT (IF(r.jnsAkun='D',r.${kodeCab},-r.${kodeCab})+IFNULL(s.sawal,0)) AS sawalIDR
    FROM COA r 
    LEFT JOIN (SELECT SUM(IF(dt.DK='D',dt.nilai,-dt.nilai)) AS sawal, dt.kodeAkun
      FROM detJur dt LEFT JOIN jurnal trx ON dt.nomorJurnal=trx.nomorJurnal 
      WHERE trx.tglJurnal < ? AND dt.kodeAkun =? AND trx.status !='B') s ON r.kodeAkun=s.kodeAkun
      WHERE r.kodeAkun=? `,[tgla,kodeAkun,kodeAkun])
    .then(rows=>{
      sawal = rows[0].sawalIDR
      res.send({sawal:sawal,dt:dt})
    })
    .catch(err=>{
      console.log(err)
      res.status(410).send('err mas')
    })
}
// bubes dengan jurnal sawal

exports.edjur=(req,res)=>{
  let x = req.body.x
  let qr
  if(x.detID){
    qr = `UPDATE detTrx SET ? WHERE detID=?`
  }else{
    qr = `INSERT INTO detTrx SET ?`
  }
  dbuse.query(qr,[x,x.detID])
    .then(rows=>res.send({st:'Tersimpan...'}))
    .catch(err=>{
      console.log(err)
      res.status(400).send({st:'Gagal...'})
    })
}
exports.deljur=(req,res)=>{
  let x = req.body.x
  dbuse.query(`DELETE FROM detTrx WHERE detID=?`,[x.detID])
    .then(rows=>res.send({st:'Tersimpan...'}))
    .catch(err=>{
      console.log(err)
      res.status(400).send({st:'Gagal...'})
    })
}
exports.bjur=async (req,res)=>{
  let x = req.body.x
  console.log(`batalkan ${x}`)
  let ckref = await dbuse.query("SELECT noreff FROM Trx WHERE trxID=?",[x.trxID])
  dbuse.query("UPDATE Trx SET status='B' WHERE trxID=? ; UPDATE Trx SET status='O' WHERE nobukti=?",[x.trxID,ckref[0].noreff])
    .then(rows=>res.send({st:'Tersimpan...'}))
    .catch(err=>{
      console.log(err)
      res.status(400).send({st:'Gagal...'})
    })
}
exports.detjur=(req,res)=>{
  let x = req.query.key
//  let periode = `${x.tgl.slice(0,7)}%`
  dbuse.query(`SELECT dt.* FROM detJur dt WHERE dt.nomorJurnal=?`,[x])
    .then(rows=>res.send(rows))
    .catch(err=>{
      console.log(err)
      res.status(400).send('err mas')
    })
}
exports.neraca=(req,res)=>{
  let {tgl,prd} = req.body.x
  let kodeCab = req.user.dtAkun[0].kodeCab
  let periode = prd=='M' ? tgl+'-01' : tgl.slice(0,4)+'-12-01'
  dbuse.query(`SELECT (r.${kodeCab}+IFNULL(nr.sald,0)) AS saldo,r.kodeAkun,r.namaAkun,r.grupAkun,r.subAkun,sb.namaSubAkun, nr.* 
  FROM COA r
    LEFT JOIN 
      (SELECT SUM(IF(dt.DK=rek.jnsAkun,dt.nilai,-dt.nilai)) AS sald, rek.kodeAkun 
        FROM detJur dt LEFT JOIN COA rek ON dt.kodeAkun=rek.kodeAkun 
    LEFT JOIN jurnal t ON dt.nomorJurnal=t.nomorJurnal
    WHERE  t.tglJurnal < DATE_ADD(?,interval 1 month)  AND t.status !='B'
    GROUP BY dt.kodeAkun) nr ON r.kodeAkun=nr.kodeAkun
    LEFT JOIN subAkun sb ON r.subAkun=sb.kodeSubAkun
    LEFT JOIN grupAkun grp ON r.grupAkun= grp.kodeGrupAkun
    WHERE grp.neraca='Y'`,[periode])
    .then(rows=>{
      res.send(rows)
    })
    .catch(err=>{
      console.log(err)
      res.status(410).send('err mas')
    })
}

exports.nrl=(req,res)=>{
  let {tgl,prd} = req.body.x
  let kodeCab = req.user.dtAkun[0].kodeCab
  let tahun = Number(tgl.slice(0,4))
  let periode = prd=='M' ? tgl+'-01' : tgl.slice(0,4)+'-12-01'
  let awal = prd=='M' ? ` DATE_ADD('${periode}', interval -1 day) ` : ` DATE_ADD('${tahun+'-01-01'}', interval -1 day) `
  console.log(awal)
  dbuse.query(`SELECT (r.${kodeCab}+IFNULL(nr.sald,0)) AS saldo,r.kodeAkun,r.namaAkun,r.jnsAkun,r.grupAkun, nr.*,sb.namaSubAkun,
    grp.namaGrupAkun FROM COA r
    LEFT JOIN 
      (SELECT SUM(IF(dt.DK=rek.jnsAkun,dt.nilai,-dt.nilai)) AS sald,rek.kodeAkun 
        FROM detJur dt LEFT JOIN COA rek ON dt.kodeAkun=rek.kodeAkun 
        LEFT JOIN jurnal t ON dt.nomorJurnal=t.nomorJurnal
        WHERE t.tglJurnal > ${awal} AND  t.tglJurnal < DATE_ADD(?,interval 1 month) AND t.status !='B' AND t.jnsTrx !='TB'
        GROUP BY dt.kodeAkun) nr ON r.kodeAkun=nr.kodeAkun
    LEFT JOIN subAkun sb ON r.subAkun=sb.kodeSubAkun
    LEFT JOIN grupAkun grp ON r.grupAkun= grp.kodeGrupAkun
    WHERE grp.rugilaba='Y'`,[periode])
    .then(rows=>res.send(rows))
    .catch(err=>{
      console.log(err)
      res.status(410).send('err mas')
    })
}

exports.nrcSaldo =(req, res)=>{
  let {tgla, tgl,jns} = req.body.x
  let kodeCab = req.user.dtAkun[0].kodeCab
  let sql = jns ? `SELECT r.kodeAkun, s.sald,SUM(IF(d.DK='D',d.nilai,0)) as debit,SUM(IF(d.DK='K',d.nilai,0)) as kredit
  FROM detJur d  LEFT JOIN jurnal t ON d.nomorJurnal=t.nomorJurnal
    LEFT JOIN COA r ON d.akunID=r.kodeAkun
    LEFT JOIN (SELECT d.kodeAkun, SUM(IF(d.DK='D',d.nilai,-d.nilai)) AS sald
        FROM detJur d LEFT JOIN jurnal t ON d.nomorJurnal=t.nomorJurnal
        WHERE t.status!='B' AND t.tglJurnal<'${tgla}'
        GROUP BY d.kodeAkun) s ON r.kodeAkun=s.kodeAkun
  WHERE (t.tglJurnal BETWEEN '${tgla}' AND '${tgl}') AND t.status!='B'
  GROUP BY r.kodeAkun
  ORDER BY r.kodeAkun ASC` : `SELECT r.kodeAkun,SUM(IF(d.DK='D',d.nilai,-d.nilai)) AS sald
    FROM detJur  LEFT JOIN jurnal t ON d.nomorJurnal=t.nomorJurnal LEFT JOIN COA r ON d.kodeAkun=r.kodeAkun
    WHERE t.tglJurnal<='${tgl}' AND t.status!='B'
    GROUP BY d.kodeAkun
    ORDER BY r.kodeAkun ASC`
  dbuse.query(`SELECT (r.${kodeCab}+IFNULL(nr.sald,0)) AS saldo,r.kodeAkun,r.namaAkun,r.jnsAkun, nr.* FROM COA r
  LEFT JOIN (${sql}) nr ON r.kodeAkun=nr.kodeAkun ORDER BY r.kodeAkun ASC`,[tgla,tgla,tgl])
  .then(rows=>res.send(rows))
  .catch(err=>{
    console.log(err)
    res.status(410).send({st:'error mas bro'})
  })
}