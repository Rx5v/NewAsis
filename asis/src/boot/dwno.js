
import Excel from 'exceljs'
import FileSaver from 'file-saver'
import { Notify } from 'quasar'

export default {
  jumlah (x) {
    return x.reduce((s, m) => {
      let u = Number(m) || 0
      return s + parseInt(Math.round(u * 10 ** 8))
    }, 0) / 10 ** 8
  },
  kali (x, y) {
    let z = y > 8 ? y : 8
    let c = Math.round(x.reduce((a, b) => {
      return Number(a) * parseInt(Math.round(Number(b) * 10 ** z))
    }, 1) / (10 ** z) ** x.length * 10 ** z) / 10 ** z
    return c
  },

  toExcel (x) {
    /* let x = {
      judul: `Laporan `,
      dt: this.dtJurnal,
      hdr: this.jdl,
      naFile: `Lapbc_`
    } */
    let { hdr, dt, judul, naFile } = x
    let dta = dt.map(x => {
      let z = {}
      for (let i in hdr) {
        z[hdr[i].name] = (['nom', 'nomer', 'duit'].some(fmt => fmt === hdr[i].fmt) && !isNaN(x[hdr[i].name])) ? Number(x[hdr[i].name]) : x[hdr[i].name]
      }
      return z
    })
    var wb = new Excel.Workbook()
    var ws = wb.addWorksheet('Data', { properties: { showGridLines: true } })
    ws.getCell('A1').value = {
      richText: [
        { font: { italic: true }, text: judul }
      ]
    }
    ws.getCell('A1').alignment = { horizontal: 'center' }
    // label judul
    ws.getRow(3).values = hdr.map(x => x.label)
    let row = ws.getRow(3)
    row.eachCell(function (cell, colNumber) {
      row.getCell(colNumber).fill = {
        type: 'pattern',
        pattern: 'darkTrellis',
        fgColor: { argb: '1DE9B6' }
      }
    })
    ws.mergeCells(0, 0, 1, row.cellCount)
    ws.columns = hdr.map(x => {
      let a = {}
      a.key = x.name
      // a.outlineLevel = 1
      if (x.align === 'right') { a.style = { numFmt: '#,##0.00' } }
      return a
    })
    for (let a in dta) {
      ws.addRow(dta[a])
    }
    let cellFoot = dt.length + 4
    let foot = ws.getRow(cellFoot)
    let ft = hdr.reduce((z, x) => {
      if (x.jml) {
        z[x.name] = { formula: `SUM(${ws.getRow(4).getCell(x.name)._address}:${ws.getRow(cellFoot - 1).getCell(x.name)._address})` }
      }
      return z
    }, {})
    foot.values = ft
    wb.xlsx.writeBuffer()
      .then(buffer => {
        if (typeof cordova !== 'undefined') {
          Notify.create({ message: `File ${naFile}.xlsx tersimpan di folder download...`, color: 'teal' })
          saveBlob2File(`${naFile}.xlsx`, new Blob([buffer]))
        } else {
          FileSaver.saveAs(new Blob([buffer]), `${naFile}.xlsx`)
        }
      })
      .catch(err => console.log(err))
  },
  bilang (x) {
    return terbilang(x)
  }
}

function terbilang (a) {
  var bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas']
  let kalimat = ''
  let utama = a
  let depan = 0
  let belakang = 0
  // 1 - 11
  if (a < 12) {
    kalimat = bilangan[a]
  } else if (a < 20) {
    kalimat = bilangan[a - 10] + ' Belas'
  } else if (a < 100) {
    utama = a / 10
    depan = parseInt(String(utama).substr(0, 1))
    belakang = a % 10
    kalimat = bilangan[depan] + ' Puluh ' + bilangan[belakang]
  } else if (a < 200) {
    kalimat = 'Seratus ' + terbilang(a - 100)
  } else if (a < 1000) {
    utama = a / 100
    depan = parseInt(String(utama).substr(0, 1))
    belakang = a % 100
    kalimat = bilangan[depan] + ' Ratus ' + terbilang(belakang)
  } else if (a < 2000) {
    kalimat = 'Seribu ' + terbilang(a - 1000)
  } else if (a < 10000) {
    utama = a / 1000
    depan = parseInt(String(utama).substr(0, 1))
    belakang = a % 1000
    kalimat = bilangan[depan] + ' Ribu ' + terbilang(belakang)
  } else if (a < 100000) {
    utama = a / 100
    depan = parseInt(String(utama).substr(0, 2))
    belakang = a % 1000
    kalimat = terbilang(depan) + ' Ribu ' + terbilang(belakang)
  } else if (a < 1000000) {
    utama = a / 1000
    depan = parseInt(String(utama).substr(0, 3))
    belakang = a % 1000
    kalimat = terbilang(depan) + ' Ribu ' + terbilang(belakang)
  } else if (a < 100000000) {
    utama = a / 1000000
    depan = parseInt(String(utama).substr(0, 4))
    belakang = a % 1000000
    kalimat = terbilang(depan) + ' Juta ' + terbilang(belakang)
  } else if (a < 1000000000) {
    utama = a / 1000000
    depan = parseInt(String(utama).substr(0, 4))
    belakang = a % 1000000
    kalimat = terbilang(depan) + ' Juta ' + terbilang(belakang)
  } else if (a < 10000000000) {
    utama = a / 1000000000
    depan = parseInt(String(utama).substr(0, 1))
    belakang = a % 1000000000
    kalimat = terbilang(depan) + ' Milyar ' + terbilang(belakang)
  } else if (a < 100000000000) {
    utama = a / 1000000000
    depan = parseInt(String(utama).substr(0, 2))
    belakang = a % 1000000000
    kalimat = terbilang(depan) + ' Milyar ' + terbilang(belakang)
  } else if (a < 1000000000000) {
    utama = a / 1000000000
    depan = parseInt(String(utama).substr(0, 3))
    belakang = a % 1000000000
    kalimat = terbilang(depan) + ' Milyar ' + terbilang(belakang)
  } else if (a < 10000000000000) {
    utama = a / 10000000000
    depan = parseInt(String(utama).substr(0, 1))
    belakang = a % 10000000000
    kalimat = terbilang(depan) + ' Triliun ' + terbilang(belakang)
  } else if (a < 100000000000000) {
    utama = a / 1000000000000
    depan = parseInt(String(utama).substr(0, 2))
    belakang = a % 1000000000000
    kalimat = terbilang(depan) + ' Triliun ' + terbilang(belakang)
  } else if (a < 1000000000000000) {
    utama = a / 1000000000000
    depan = parseInt(String(utama).substr(0, 3))
    belakang = a % 1000000000000
    kalimat = terbilang(depan) + ' Triliun ' + terbilang(belakang)
  } else if (a < 10000000000000000) {
    utama = a / 1000000000000000
    depan = parseInt(String(utama).substr(0, 1))
    belakang = a % 1000000000000000
    kalimat = terbilang(depan) + ' Kuadriliun ' + terbilang(belakang)
  }

  var pisah = kalimat.split(' ')
  var full = []
  for (var i = 0; i < pisah.length; i++) {
    if (pisah[i] !== '') { full.push(pisah[i]) }
  }
  return full.join(' ')
}

function saveBlob2File (fileName, blob) {
  var folder = cordova.file.externalRootDirectory + 'Download'
  window.resolveLocalFileSystemURL(folder, function (dirEntry) {
    console.log('file system open: ' + dirEntry.name)
    createFile(dirEntry, fileName, blob)
  }, onErrorLoadFs)
}

function createFile (dirEntry, fileName, blob) {
  // Creates a new file
  dirEntry.getFile(fileName, { create: true, exclusive: false }, function (fileEntry) {
    writeFile(fileEntry, blob)
  }, onErrorCreateFile)
}

function writeFile (fileEntry, dataObj) {
  // Create a FileWriter object for our FileEntry
  fileEntry.createWriter(function (fileWriter) {
    fileWriter.onwriteend = function () {
      console.log('Successful file write...')
    }

    fileWriter.onerror = function (error) {
      console.log('Failed file write: ' + error)
    }
    fileWriter.write(dataObj)
  })
}

function onErrorLoadFs (error) {
  console.log(error)
}

function onErrorCreateFile (error) {
  console.log(error)
}
