<template>
  <q-card >
    <q-card-section>
      <q-toolbar>
        <q-toolbar-title>Neraca</q-toolbar-title>
        <q-space/>
        <q-select
          v-model="pr.prd"
          :options="[{label:'Bulanan', value:'M'},{label:'Tahunan',value:'Y'}]"
          emit-value
          map-options
          @input="nrc"
          label="Periode"
        />
        <q-btn dense round icon="folder_open" color="purple" @click="nrc"/>
      </q-toolbar>
      <q-card-actions>
        <q-input filled v-model="pr.tglb" label="Bulan" dense lazy-rules readonly>
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy  ref="qDateProxya" transition-show="scale" transition-hide="scale">
                <q-date v-model="pr.tglb" @input="() => ($refs.qDateProxya.hide())"  mask="YYYY-MM-DD" lazy-rules/>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
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
            @input="nrc"
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
                  <q-checkbox v-model="pr.kodeCab" :val="scope.opt.kodeCab" @input="nrc"/>
                </q-item-section>
              </q-item>
            </template>
            <template v-slot:selected>
              {{ pr.kodeCab.length }} cabang
            </template>
          </q-select>
          <q-toggle v-model="pr.allCab" label="Pilih semua..." @input="gantiCab(pr.allCab)"/>
      </q-card-actions>
    </q-card-section>
    <div class="row">
      <q-card-section>
        <q-list bordered dense>
          <q-expansion-item
            dense
            dense-toggle
            expand-separator
            icon="account_balance"
            label="Harta"
            header-class="bg-teal text-white"
            default-opened
          >
            <template v-slot:header>
              <q-item-section avatar>
                <q-icon name="account_balance"/>
              </q-item-section>
              <q-item-section>
                Aktiva
              </q-item-section>
              <q-item-section side class="text-white">
                {{ jml.aktiva | duit }}
              </q-item-section>
            </template>
            <q-expansion-item
              dense
              dense-toggle
              expand-separator
              v-for="(item) in dt.filter(a=>a.grupAkun==1)" :key="item.midSub"
              header-class="text-teal"
              default-opened
            >
              <template v-slot:header>
                <q-item-section avatar>
                  <q-icon name="bubble_chart"/>
                </q-item-section>
                <q-item-section>
                  {{ item.namaMidSub }}
                </q-item-section>
                <q-item-section side>
                  {{ item.saldoMidSub | duit }}
                </q-item-section>
              </template>
              <q-expansion-item
                dense
                expand-separator
                dense-toggle
                :content-inset-level="1"
                default-opened
                header-class="text-primary"
                v-for="(dta) in item[item.midSub]" :key="dta.subAkun"
              >
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="add_circle_outline"/>
                  </q-item-section>
                  <q-item-section>
                    {{ dta.namaSubAkun }}
                  </q-item-section>
                  <q-item-label>
                    {{ dta.saldoSub | duit }}
                  </q-item-label>
                </template>
                <q-item v-for="(dtal,u) in dta[dta.subAkun]" :key="u" dense>
                  <q-item-section>
                    {{u+1}}. {{ dtal.namaAkun }}
                  </q-item-section>
                  <q-item-label>
                    {{ dtal.saldo | duit }}
                  </q-item-label>
                </q-item>
              </q-expansion-item>
            </q-expansion-item>
          </q-expansion-item>
        </q-list>
      </q-card-section>
      <q-card-section>
        <q-list bordered dense>
          <q-expansion-item
            dense
            expand-separator
            icon="account_balance_wallet"
            label="Kewajiban"
            header-class="bg-orange text-white"
            default-opened
          >
            <template v-slot:header>
              <q-item-section avatar>
                <q-icon name="account_balance_wallet"/>
              </q-item-section>
              <q-item-section>
                Pasiva
              </q-item-section>
              <q-item-section side class="text-white">
                {{ jml.pasiva+jml.rl | duit }}
              </q-item-section>
            </template>
            <q-expansion-item
              dense
              dense-toggle
              expand-separator
              v-for="(item) in dt.filter(a=>a.grupAkun==2)" :key="item.midSub"
              header-class="text-warning"
              default-opened
            >
              <template v-slot:header>
                <q-item-section avatar>
                  <q-icon name="bubble_chart"/>
                </q-item-section>
                <q-item-section>
                  {{ item.namaMidSub }}
                </q-item-section>
                <q-item-section side>
                  {{ item.saldoMidSub | duit }}
                </q-item-section>
              </template>
              <q-expansion-item
                dense
                expand-separator
                dense-toggle
                :content-inset-level="1"
                default-opened
                header-class="text-secondary"
                v-for="(dta) in item[item.midSub]" :key="dta.subAkun"
              >
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="add_circle_outline"/>
                  </q-item-section>
                  <q-item-section>
                    {{ dta.namaSubAkun }}
                  </q-item-section>
                  <q-item-label>
                    {{ dta.saldoSub | duit }}
                  </q-item-label>
                </template>
                <q-item v-for="(dtal,u) in dta[dta.subAkun]" :key="u" dense>
                  <q-item-section>
                    {{u+1}}. {{ dtal.namaAkun }}
                  </q-item-section>
                  <q-item-label>
                    {{ dtal.saldo | duit }}
                  </q-item-label>
                </q-item>
              </q-expansion-item>
            </q-expansion-item>
          </q-expansion-item>
        </q-list>
      </q-card-section>
    </div>
  </q-card>
</template>

<script>
import Excel from 'exceljs'
import FileSaver from 'file-saver'
import { accRek, neraca, dtCab, company } from '../../services/apiList'
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
      divCab: []
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
    const nrc = () => {
      dt.dtNeraca = []
      dt.dt = []
      if (dt.pr.kodeCab.length && dt.pr.tglb) {
        neraca({ tgl: dt.pr.tglb, prd: dt.pr.prd, kodeCab: dt.pr.kodeCab })
          .then(res => {
            // this.dtNeraca = res.data.hasil
            let data = res.data
            let total = {}
            total.aktiva = data.filter(s => s.grupAkun === '1').reduce((a, b) => root.$dwn.jumlah([a, b.saldo]), 0)
            total.pasiva = data.filter(s => s.grupAkun === '2').reduce((a, b) => root.$dwn.jumlah([a, b.saldo]), 0)
            total.rl = root.$dwn.jumlah([total.aktiva, -total.pasiva])
            dt.jml = total
            /* let bulanLalu = data.find(s => s.kodeAkun === '230200003')
            if (bulanLalu) { bulanLalu.saldo += res.data.rlbLalu.lalu } */
            data.push({ grupAkun: '2', midSub: '230', namaMidSub: 'MODAL', subAkun: '23020', namaSubAkun: 'LABA', saldo: total.rl, namaAkun: 'Laba Rugi Berjalan' })
            let y = new Set(res.data.map(a => a.midSub))
            dt.dtJurnal = data
            //        let dta = []
            y.forEach(a => {
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
            })
            dt.kelompok = y
          })
      }
    }
    const onReset = () => {
      dt.pr = {}
    }
    const toDown = () => {
      let x = {
        judul: `Laporan Neraca Periode ${dt.pr.tglb}`,
        dt: dt.dtJurnal,
        cab: kodeCab.value.map(a => a.namaCabang),
        naFile: `Neraca_${dt.pr.tglb}_${kodeCab.value.map(a => a.kodeCab)}`
      }
      toExcel(x)
    }
    const toExcel = (x) => {
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
    }
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
        nrc()
      } else {
        dt.pr.kodeCab = []
        // dt.divisi = []
      }
    }
    return { ...toRefs(dt), cabGrup, nrc, onReset, toDown, filterFn, saveBlob2File, FileSaver, gantiCab }
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
