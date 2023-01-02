<template>
      <div class="flex flex-center">
        <q-card width="800px">
          <q-card-section>
            <q-toolbar>
              <q-toolbar-title>Rugi Laba</q-toolbar-title>
              <q-space/>
              <q-select
                v-model="pr.prd"
                :options="[{label:'Bulanan', value:'M'},{label:'Tahunan',value:'Y'}]"
                emit-value
                map-options
                @click="allFilt"
                label="Periode"
              />
              <q-btn dense round icon="folder_open" color="purple" @click="allFilt"/>
            </q-toolbar>
            <q-card-actions>
                <q-input dense debounce="300" v-model="cari" placeholder="Search">
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
                <q-btn
                  flat round dense
                  icon="file_download"
                  @click="toDown"
                  class="q-ml-md"
                  color="primary"
                />
                <q-select
                  class="q-ml-sm"
                  v-if="['MAN','acc','purchase', 'mitra', 'admin'].some(a => a== $store.state.auth.user.userType)"
                  v-model="divisi"
                  :options="dtComp"
                  :option-label="(item) => item && item.compCode + ' ' + item.compName"
                  option-value="compCode"
                  emit-value
                  map-options
                  style="min-width: 250px; max-width: 250px"
                  label="Divisi... "
                  @input="gantiCab"
                  dense
                  lazy-rules/>
                <q-select
                  class="q-ml-sm"
                  v-if="['MAN','acc','purchase', 'mitra', 'admin'].some(a => a== $store.state.auth.user.userType)"
                  v-model="pr.kodeCab"
                  :options="dtCabang.filter(a => divisi === a.compCode)"
                  :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
                  option-value="kodeCab"
                  option-dense
                  emit-value
                  map-options
                  multiple
                  style="min-width: 250px; max-width: 550px"
                  label="Pilih cabang... "
                  dense
                  @input="allFilt"
                  lazy-rules>
                  <template v-slot:option="scope">
                    <q-item
                      dense
                      v-bind="scope.itemProps"
                      v-on="scope.itemEvents"
                    >
                      <q-item-section>
                        <q-item-label>
                        {{ scope.opt.kodeCab }} {{ scope.opt.namaCabang }}
                        </q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-checkbox v-model="pr.kodeCab" :val="scope.opt.kodeCab" @input="allFilt"/>
                      </q-item-section>
                    </q-item>
                  </template>
                  <template v-slot:selected>
                    {{ pr.kodeCab.length }} cabang
                  </template>
                </q-select>
                <q-toggle v-model="pr.allCab" label="Pilih semua..." @input="gantiCab(pr.allCab)"/>

              <q-btn icon="add_circle" outline color="pink" class="q-ml-md q-mr-md">
                <q-popup-proxy  ref="qDateProxya" transition-show="scale" transition-hide="scale">
                  <q-date v-model="tglb" @input="() => ($refs.qDateProxya.hide(), addBanding(tglb))"  mask="YYYY-MM-DD" lazy-rules/>
                </q-popup-proxy>
              </q-btn>
              <q-btn icon="cleaning_services" outline color="orange" @click="clearBanding"/>
            </q-card-actions>
          </q-card-section>
            <div class="row">
              <q-table
                :data="dtNeraca"
                :columns="jdlt"
                :filter="cari">
              </q-table>
              <!-- <q-markup-table>
                <q-tr>
                  <q-th>Kode Akun</q-th>
                  <q-th>Nama Akun</q-th>
                  <q-th
                    v-for="a in banding"
                    :key="a">{{ banding[a] }}</q-th>
                </q-tr>
              </q-markup-table> -->
            </div>
        </q-card>
      </div>
</template>

<script>
import Excel from 'exceljs'
import FileSaver from 'file-saver'
import { accRek, rugilaba, dtCab, company } from '../../services/apiList'
import { reactive, toRefs, onMounted, computed } from '@vue/composition-api'
export default {
  setup (props, { root }) {
    const dt = reactive({
      dtJurnal: [],
      jdl: [
        { name: 'namaMidSub', label: 'Kelompok Akun' },
        { name: 'namaSubAkun', label: 'Sub Akun' },
        { name: 'kodeAkun', label: 'Nomor Jurnal', align: 'left' },
        { name: 'namaAkun', label: 'Judul', align: 'left' },
        { name: 'saldo', label: 'Saldo', jml: 'Y', align: 'right' }
      ],
      adP: false,
      inRul: [ v => !!v || 'Isi data' ],
      pr: { tgla: '', tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), prd: 'M', kodeCab: [root.$store.state.auth.user.kodeCab], allCab: true },
      tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
      alAkun: [],
      selected: [],
      cari: '',
      options: [],
      sawal: 0,
      dtNeraca: [],
      dt: [],
      kelompok: [],
      dtCabang: [],
      jml: {},
      divisi: '',
      dtComp: [],
      divCab: [],
      banding: []
    })
    onMounted(() => {
      company()
        .then(({ data }) => {
          dt.dtComp = data
        })
      accRek()
        .then(res => {
          dt.alAkun = res.data
        })
        .catch(err => console.log(err))
      dtCab()
        .then(({ data }) => {
          const pegang = root.$store.state.auth.user.cabGrup || root.$q.cookies.get('cabGrup')
          dt.dtCabang = data.filter(a => pegang.some(s => s === a.kodeCab))
          let st = new Set(dt.dtCabang.map(a => a.compCode))
          dt.divisi = '' // [...st]
          dt.divCab = dt.dtComp.filter(a => st.has(a.compCode))
        })
        .catch(err => console.log(err))
    })
    const jdlt = computed(() => {
      let a = [
        { name: 'namaMidSub', label: 'Kelompok Akun', field: row => row.namaMidSub, align: 'left' },
        { name: 'namaSubAkun', label: 'Sub Akun', field: row => row.namaSubAkun, align: 'left' },
        { name: 'kodeAkun', label: 'Nomor Jurnal', field: row => row.kodeAkun, align: 'left' },
        { name: 'namaAkun', label: 'Judul', field: row => row.namaAkun, align: 'left' }
      ]
      dt.banding.forEach(s => {
        a.push({
          name: s,
          label: s,
          field: row => row[s],
          align: 'right',
          format: val => new Intl.NumberFormat('en-ID').format(val.toFixed(0))
        })
      })
      return a
    })
    const cabGrup = computed(() => {
      return dt.dtCabang.filter(a => root.$store.state.auth.user.cabGrup.some(s => s === a.kodeCab))
    })
    const kodeCab = computed(() => {
      let a = ['MAN', 'acc'].some(s => s === root.$store.state.auth.user.userType) ? dt.pr.kodeCab : [root.$store.state.auth.user.kodeCab]
      let s = a.map(d => {
        let nm = dt.dtCabang.find(dd => dd.kodeCab === d)
        return nm
      })
      return s
    })
    const addBanding = (x) => {
      dt.banding.push(x)
      nrc(x)
    }
    const allFilt = (x) => {
      dt.dtJurnal = []
      if (dt.banding.length === 1) {
        nrc(dt.banding[0])
      } else {
        clearBanding()
      }
      /* dt.banding.forEach(a => {
        console.log(a)
        nrc(a)
      }) */
    }
    const nrc = (x) => {
      dt.dtNeraca = []
      dt.dt = []
      if (dt.pr.kodeCab.length && x) {
        rugilaba({ tgl: x, prd: dt.pr.prd, kodeCab: dt.pr.kodeCab })
          .then(res => {
            // this.dtNeraca = res.data.hasil
            let data = res.data.filter(a => a.saldo !== 0).map(a => {
              let b = {
                kodeAkun: a.kodeAkun,
                namaAkun: a.namaAkun,
                namaMidSub: a.namaMidSub,
                namaSubAkun: a.namaSubAkun
              }
              b[x] = a.saldo
              return b
            })
            /* let total = {}
            total.aktiva = data.filter(s => s.grupAkun === '1').reduce((a, b) => root.$dwn.jumlah([a, b.saldo]), 0)
            total.pasiva = data.filter(s => s.grupAkun === '2').reduce((a, b) => root.$dwn.jumlah([a, b.saldo]), 0)
            total.rl = root.$dwn.jumlah([total.aktiva, -total.pasiva])
            dt.jml = total */
            /* let bulanLalu = data.find(s => s.kodeAkun === '230200003')
            if (bulanLalu) { bulanLalu.saldo += res.data.rlbLalu.lalu } */
            // data.push({ grupAkun: '2', midSub: '230', namaMidSub: 'MODAL', subAkun: '23020', namaSubAkun: 'LABA', saldo: total.rl, namaAkun: 'Laba Rugi Berjalan' })
            let y = new Set(data.map(a => a.midSub))
            dt.dtJurnal.push(...data)
            let ss = new Set(dt.dtJurnal.map(a => a.kodeAkun))
            ss.forEach(a => {
              const dk = dt.dtJurnal.filter(j => j.kodeAkun === a)
              let sk = {
                kodeAkun: a,
                namaAkun: dk[0].namaAkun,
                namaMidSub: dk[0].namaMidSub,
                namaSubAkun: dk[0].namaSubAkun
              }
              dt.banding.forEach(b => {
                // console.log(dk.filter(d => d[b]))
                sk[b] = dk.filter(d => d[b]).reduce((d, e) => d + e[b], 0)
              })
              dt.dtNeraca.push(sk)
            })
            //        let dta = []
            /* y.forEach(a => {
              let dtperMidsub = data.filter(b => b.midSub === a)
              let x = {}
              x.midSub = a
              x.namaMidSub = dtperMidsub[0].namaMidSub
              x.saldoMidSub = dtperMidsub.reduce((s, i) => root.$dwn.jumlah([s, i.saldo]), 0)
              // this.dt.push(x)
              let z = {}
              z[a] = []
              z.midSub = a
              z.saldoMidSub = x.saldoMidSub
              z.namaMidSub = dtperMidsub[0].namaMidSub
              z.grupAkun = dtperMidsub[0].grupAkun
              let sb = new Set(dtperMidsub.map(ad => ad.subAkun))
              sb.forEach(sba => {
                let dtperSub = dtperMidsub.filter(b => b.subAkun === sba)
                let w = {}
                w[sba] = dtperSub
                w.subAkun = sba
                w.saldoSub = dtperSub.reduce((s, i) => root.$dwn.jumlah([s, i.saldo]), 0)
                w.namaSubAkun = dtperSub[0].namaSubAkun
                w.grupAkun = dtperSub[0].grupAkun
                z[a].push(w)
              })
              dt.dt.push(z)
            }) */
            dt.kelompok = y
          })
      }
    }
    const onReset = () => {
      dt.pr = {}
    }
    const toDown = () => {
      let x = {
        judul: `Laporan Rugi Laba ${kodeCab.value.map(a => a.namaCabang)}`,
        dt: dt.dtNeraca,
        cab: kodeCab.value.map(a => a.namaCabang),
        hdr: jdlt.value,
        naFile: `rugiLaba${dt.pr.tglb}_${kodeCab.value.map(a => a.kodeCab)}`
      }
      root.$dwn.toExcel(x)
    }
    /* const toExcel = (x) => {
      const { judul, cab, naFile } = x
      let dtAll = []
      dt.dt.forEach(a => {
        let s = {
          akt: a.grupAkun,
          grupAkun: a.namaMidSub,
          saldo: Number(a.saldoMidSub),
          style: { font: { size: 16, bold: true } }
        }
        dtAll.push(s)
        a[a.midSub].forEach(ss => {
          let ssa = {
            akt: a.grupAkun,
            subAkun: ss.namaSubAkun,
            saldo: Number(ss.saldoSub),
            style: { font: { size: 16, bold: true } }
          }
          dtAll.push(ssa)
          ss[ss.subAkun].forEach(sss => {
            let s3a = {
              akt: a.grupAkun,
              kode: sss.kodeAkun,
              namaAkun: sss.namaAkun,
              saldo: Number(sss.saldo)
            }
            dtAll.push(s3a)
          })
        })
      })
      var wb = new Excel.Workbook()
      var ws = wb.addWorksheet('Neraca', { views: [ { showGridLines: false } ] })
      ws.getCell('A1').value = {
        richText: [
          { font: { size: 13, underline: 'double', bold: true }, text: judul }
        ]
      }
      ws.getCell('A1').alignment = { horizontal: 'center' }
      ws.getCell('A2').value = {
        richText: [
          { font: { size: 13, underline: 'double', bold: true }, text: cab }
        ]
      }
      ws.getCell('A2').alignment = { horizontal: 'center' }
      // label judul
      let hdr = [ 'grupAkun', 'subAkun', 'kode', 'namaAkun', 'saldo' ]
      ws.getRow(3).values = ''
      const row = ws.getRow(3)
      row.eachCell(function (cell, colNumber) {
        row.getCell(colNumber).fill = {
          type: 'pattern',
          pattern: 'darkTrellis',
          alignment: { wrapText: true },
          fgColor: { argb: '1DE9B6' }
        }
      })
      ws.mergeCells(1, 0, 1, hdr.length)
      ws.mergeCells(2, 0, 2, hdr.length)
      ws.columns = hdr.map(x => {
        const a = {}
        a.key = x
        // a.outlineLevel = 1
        a.style = { alignment: { vertical: 'top', horizontal: 'left' } }
        if (x === 'saldo') { a.style = { numFmt: '#,##0.00' } }
        // if (x.wrap === true) { a.style.alignment.wrapText = true }
        return a
      })
      let aktiva = dtAll.filter(a => Number(a.akt) === 1)
      let pasiva = dtAll.filter(a => a.akt !== '1')
      ws.addRow(['AKTIVA', '', '', '', root.$dwn.jumlah([dt.jml.aktiva])]).font = { size: 13, underline: 'double', bold: true, color: { argb: '1DE9B6' } }
      for (const a in aktiva) {
        let rw = ws.addRow(aktiva[a])
        if (!aktiva[a].kode) {
          rw.eachCell(function (cell, colNumber) {
            rw.getCell(colNumber).font = { size: 13, underline: 'double', bold: true }
          })
        }
      }
      ws.addRow()
      ws.addRow(['PASIVA', '', '', '', root.$dwn.jumlah([dt.jml.pasiva, dt.jml.rl])]).font = { size: 13, underline: 'double', bold: true, color: { argb: '1DE9B6' } }
      for (const a in pasiva) {
        let rw = ws.addRow(pasiva[a])
        if (!pasiva[a].kode) {
          rw.eachCell(function (cell, colNumber) {
            rw.getCell(colNumber).font = { size: 13, underline: 'double', bold: true }
          })
        }
      }
      wb.xlsx.writeBuffer()
        .then(buffer => {
          if (typeof cordova !== 'undefined') {
            root.$q.notify({ message: `File ${naFile}.xlsx tersimpan di folder download...`, color: 'teal' })
            saveBlob2File(`${naFile}.xlsx`, new Blob([buffer]))
          } else {
            FileSaver.saveAs(new Blob([buffer]), `${naFile}.xlsx`)
          }
        })
        .catch(err => console.log(err))
    } */
    const filterFn = (val, update) => {
      if (val === '') {
        update(() => {
          dt.options = dt.alAkun
        })
        return
      }
      update(() => {
        const needle = val.toLowerCase()
        dt.options = dt.alAkun.filter(v => (v.namaAkun.toLowerCase().indexOf(needle) > -1 || v.kodeAkun.toLowerCase().indexOf(needle) > -1))
      })
    }
    const gantiCab = (x) => {
      dt.pr.kodeCab = []
      if (x) {
        dt.pr.kodeCab = dt.dtCabang.filter(a => dt.divisi === a.compCode).map(a => a.kodeCab)
        // nrc()
        if (dt.banding.length > 1) {
          clearBanding()
        } else {
          allFilt()
        }
      } else {
        dt.pr.kodeCab = []
        clearBanding()
        // dt.divisi = []
      }
    }
    const clearBanding = () => {
      dt.banding = []
      dt.dtJurnal = []
      dt.dtNeraca = []
    }
    return { ...toRefs(dt), cabGrup, nrc, onReset, toDown, filterFn, saveBlob2File, FileSaver, gantiCab, addBanding, jdlt, allFilt, clearBanding }
  }
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
</script>
