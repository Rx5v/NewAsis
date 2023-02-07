<template>
  <div>
    <q-table
      class="dataTrx"
      :data="dtStokAwal"
      :columns="jdlr"
      :filter="cari"
      :pagination.sync="halaman"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Data Upload Saldo Awal Hutang Piutang
          <q-file color="orange" dense v-model="fileStok" label="Upload Hutang Piutang dan Kas BON" @input="ambilData(fileStok)">
              <template v-if="fileStok" v-slot:append>
                <q-icon name="cancel" @click.stop.prevent="fileStok = null" class="cursor-pointer" />
              </template>
            </q-file>
        </div>
        <!-- <q-input filled v-model="filt.tglStokAwal" label="Tanggal" dense lazy-rules :rules="inRul" readonly>
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy v-if="$store.state.auth.user.userType=='MAN'" ref="qDateProxy" transition-show="scale" transition-hide="scale">
                <q-date v-model="filt.tgl" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input> -->
        <q-space/>
        <q-input dense debounce="300" v-model="cari" placeholder="Search" class="q-ml-sm">
          <template v-slot:append>
            <q-icon name="search" />
            <q-btn
              dense outline
              label="Format"
              @click="formatExcel"
              class="q-ml-md"
              color="primary"
            />
          </template>
        </q-input>
        <!-- <q-btn
          flat round dense
          icon="add_circle"
          @click="prosesStok"
          class="q-ml-md"
          color="accent"
        /> -->
        <q-select
          v-if="['MAN','purchase','acc'].some(a=> a== $store.state.auth.user.userType)"
          v-model="filt.kodeCab"
          :options="cabAll"
          :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
          option-value="kodeCab"
          emit-value
          map-options
          style="min-width: 250px; max-width: 300px"
          label="Pilih cabang... "
          dense
          lazy-rules/>
      </template>
      <template v-slot:body-cell-No="props">
        <q-td align="right" :class="['D', 'K'].some(a => a === props.row.jnsAkun) ? 'bg-green' : 'bg-red'">
          {{ dtStokAwal.indexOf(props.row) + 1 }}
        </q-td>
      </template>
      <template v-slot:body-cell-act="props">
        <q-td align="right">
          <q-icon name="close" @click="delDet(props.row)" color="red"/>
        </q-td>
      </template>
      <template v-slot:bottom-row>
        <q-tr>
          <q-th align="right" colspan="5">Jumlah Debit</q-th>
          <q-th>{{ total.debit | nomer }}</q-th>
          <q-th>Jumlah Kredit</q-th>
          <q-th>{{ total.kredit | nomer }}</q-th>
          <q-th>
            <q-btn v-if="dtStokAwal.length" label="Upload" color="primary" outline @click="Upload(dtStokAwal)"/>
          </q-th>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>
<script>
import { reactive, toRefs, onMounted, computed } from '@vue/composition-api'
import { accRek, dtCab, uploadHPsa, dtUser, dtPartner } from '../../services/apiList'
import Excel from 'exceljs'
import FileSaver from 'file-saver'
export default {
  setup (props, { emit, root }) {
    const dt = reactive({
      jdl: [
        { name: 'No', label: 'No', align: 'right' },
        { name: 'kodeCab', label: 'kodeCab', field: row => row.kodeCab, align: 'left' },
        { name: 'tglStokAwal', label: 'Tanggal', field: row => row.tglStokAwal, sortable: true, align: 'left' },
        { name: 'kodeProduk', label: 'kodeProduk', field: row => row.kodeProduk, sortable: true, align: 'left' },
        { name: 'namaBarang', label: 'namaBarang', field: row => row.namaBarang, sortable: true, align: 'left' },
        { name: 'qty', label: 'qty', field: row => row.qty, format: (val) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(val) },
        { name: 'hpp', label: 'hpp', field: row => row.hpp, format: (val) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(val) },
        { name: 'jmlHpp', label: 'jmlHpp', field: row => row.jmlHpp, format: (val) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(val) },
        { name: 'act', label: 'act', align: 'right' }
      ],
      dtStokAwal: [],
      jdlr: [
        { name: 'No', label: 'No' },
        { name: 'tglJurnal', label: 'Tgl Jurnal', field: row => row.tglJurnal, align: 'left' },
        { name: 'kodeAkun', label: 'Kode Akun', field: row => row.kodeAkun, align: 'left' },
        { name: 'jhp', label: 'jhp', field: row => row.jhp },
        { name: 'nilai', label: 'nilai', field: row => row.nilai },
        { name: 'kodePartner', label: 'kodePartner', field: row => row.kodePartner },
        { name: 'kodeKaryawan', label: 'Kary ID', field: row => row.kodeKaryawan },
        { name: 'nomorJurnal', label: 'nomorJurnal', field: row => row.nomorJurnal },
        { name: 'judulJurnal', label: 'judulJurnal', field: row => row.judulJurnal, align: 'left' },
        { name: 'namaAkun', label: 'Nama Akun', field: row => row.namaAkun, align: 'left' },
        { name: 'jnsAkun', label: 'Jenis Akun', field: row => row.jnsAkun, align: 'left' },
        { name: 'kodeCab', label: 'kodeCab', field: row => row.kodeCab },
        { name: 'salesID', label: 'kodeSales', field: row => row.salesID },
        { name: 'act', label: 'Act' }
      ],
      detAjust: [],
      filt: { tgl: '', kodeCab: 'MP01', rekap: true },
      cabAll: [],
      cari: '',
      jh: {},
      selected: [],
      det: false,
      halaman: { rowsPerPage: 0 },
      fileStok: null,
      stokUpload: [],
      alAkun: [],
      dtuser: [],
      partner: []
    })
    onMounted(() => {
      dtUser()
        .then(({ data }) => {
          dt.dtuser = data
        })
      dtPartner()
        .then(({ data }) => {
          dt.partner = data
        })
      dtCab()
        .then(({ data }) => {
          dt.cabAll = data
        })
        .catch(err => console.log(err))
      accRek()
        .then(({ data }) => {
          dt.alAkun = data
        })
        .catch(err => console.log(err))
    })
    const total = computed(() => {
      let x = {
        debit: dt.dtStokAwal.filter(a => a.jnsAkun === 'D').reduce((a, b) => root.$dwn.jumlah([a, b.nilai]), 0),
        kredit: dt.dtStokAwal.filter(a => a.jnsAkun === 'K').reduce((a, b) => root.$dwn.jumlah([a, b.nilai]), 0)
      }
      return x
    })
    const csvJSON = (x) => {
      let csv = x.replace(/(?:\r\n|\r|\n)/g, '|')

      let lines = csv.split('|')

      let result = [],
        atlx = []

      let headers = [
        'no',
        'tglJurnal',
        'kodeAkun',
        'jhp',
        'nilai',
        'kodePartner',
        'kodeKaryawan',
        'nomorJurnal',
        'judulJurnal',
        'namaAkun',
        'jnsAkun',
        'status',
        'salesID'
      ]
      // lines[0].split(',')

      for (let i in lines) {
        if (i === '0' || i === (lines.length - 1).toString()) { continue }
        let obj = {}
        let currentline = lines[i].split(',')
        atlx.push(currentline)

        for (let j in headers) {
          obj[headers[j]] = currentline[j]
        }

        result.push(obj)
      }
      return { atlx: atlx, atl: JSON.stringify(result) } // JSON
    }
    const ambilData = async (x) => {
      // console.log(x)
      if (x) {
        const file = x
        const reader = new FileReader()
        reader.onload = async e => {
          // root.$emit('load', csvArray(e.target.result))
          let sa = JSON.parse(csvJSON(e.target.result).atl)
          let dtUp = sa.map(a => {
            let s = a
            // console.log(a)
            let akn = dt.alAkun.find(al => al.kodeAkun === a.kodeAkun)
            if (akn) {
              s.namaAkun = akn.namaAkun
              s.jnsAkun = akn.jnsAkun
            }
            return s
          })
          dt.dtStokAwal = dtUp
          // console.log(dt.dtStokAwal)
          // dt.dta = JSON.parse(csvJSON(e.target.result).atl)
          // hd.tgl = this.dt[1][6]
        }
        reader.readAsText(file)
        // dt.det = true
      }
    }
    const Upload = (x) => {
      // cek data
      let kodeCab = ['MAN', 'acc', 'purchase'].some(a => a === root.$store.state.auth.user.userType) ? dt.filt.kodeCab : root.$store.state.auth.user.kodeCab
      let hd = [
        'tglJurnal',
        'kodeAkun',
        'jhp',
        'nilai',
        'kodePartner',
        'kodeKaryawan',
        'nomorJurnal',
        'judulJurnal',
        'namaAkun',
        'jnsAkun',
        'status',
        'salesID'
      ]
      let dataHP = x.map(a => {
        delete a.no
        a.kodeCab = kodeCab
        return a
      })
      console.log(dataHP)
      let hdr = Object.keys(x[0])
      console.log(hdr, hd)
      let ck = hd.every((i, idx) => i === hdr[idx])
      let cka = x.every(s => s.jnsAkun === 'D' || s.jnsAkun === 'K')
      if (ck && cka) {
        root.$q.dialog({
          title: 'Konfirmasi Upload Saldo Awal Hutang Piutang',
          message: `<b>Cabang ${kodeCab} ${dt.cabAll.find(a => a.kodeCab === kodeCab).namaCabang}</b><br><b>Total debit: ${total.value.debit.toLocaleString()}</b><br><b>Total kredit: ${total.value.kredit.toLocaleString()}`,
          html: true,
          cancel: true,
          persistent: true
        }).onOk(data => {
          uploadHPsa(dataHP)
            .then(res => {
              root.$q.notify({ message: res.data.st, color: 'teal' })
              dt.fileStok = null
              dt.dtStokAwal = []
            })
            .catch(err => {
              console.log(err)
              root.$q.notify({ message: 'Cek data...', color: 'purple' })
            })
          // console.log('>>>> OK, received', data)
        }).onCancel(() => {
          // console.log('>>>> Cancel')
        }).onDismiss(() => {
          // console.log('I am triggered on both OK and Cancel')
        })
      } else {
        root.$q.notify({ message: 'Ada data yang belum sesuai format...', color: 'purple' })
      }
    }
    const delDet = (x) => {
      let idx = dt.dtStokAwal.indexOf(x)
      console.log(idx)
      dt.dtStokAwal.splice(idx, 1)
    }
    const toDown = () => {
      /* var wb = new Excel.Workbook()
      var ws = wb.addWorksheet('HP', { views: [ { showGridLines: false } ] })
      let hdr = dt.jdlr.map(a => a.label)
      ws.getRow(3).values = hdr
      wb.xlsx.writeBuffer()
        .then(buffer => {
          FileSaver.saveAs(new Blob([buffer]), `saldoHP.csv`)
        })
        .catch(err => console.log(err)) */
      let csv = (dt.jdlr.map((d) => d.name).join(','))
      let blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      FileSaver.saveAs(blob, 'saldoHP.csv')
    }
    const formatExcel = async () => {
      var wb = new Excel.Workbook()
      var wshp = wb.addWorksheet('dataHP', { views: [ { showGridLines: false } ] })
      // label judul
      let hdr = [
        'no',
        'tglJurnal',
        'kodeAkun',
        'jhp',
        'nilai',
        'kodePartner',
        'kodeKaryawan',
        'nomorJurnal',
        'judulJurnal',
        'namaAkun',
        'jnsAkun',
        'status',
        'salesID'
      ]
      wshp.addRow(hdr).font = { size: 12, underline: 'double', bold: true, color: { argb: '009292' } }
      wshp.getCell('B1').note = 'yyyy-mm-dd'
      let wskp = wb.addWorksheet('kodePartner', { views: [ { showGridLines: false } ] })
      let wskk = wb.addWorksheet('kodeKary', { views: [ { showGridLines: false } ] })
      let wsak = wb.addWorksheet('COA', { views: [ { showGridLines: false } ] })
      let hdrkp = ['kodePartner', 'namaPartner', 'alamat']
      let hdrkk = ['kodeKar', 'namaKaryawan', 'alamat']
      let hdrak = ['kodeAkun', 'namaAkun', 'jnsAkun', 'namaSubAkun']
      wskp.addRow(hdrkp).font = { size: 12, underline: 'double', bold: true, color: { argb: '009292' } }
      wskk.addRow(hdrkk).font = { size: 12, underline: 'double', bold: true, color: { argb: '009292' } }
      wsak.addRow(hdrak).font = { size: 12, underline: 'double', bold: true, color: { argb: '009292' } }
      wskp.columns = hdrkp.map(x => {
        const a = {}
        a.key = x
        a.style = { alignment: { vertical: 'top', horizontal: 'left' } }
        return a
      })
      for (const a in dt.partner) {
        wskp.addRow(dt.partner[a])
      }
      wskk.columns = hdrkk.map(x => {
        const a = {}
        a.key = x
        a.style = { alignment: { vertical: 'top', horizontal: 'left' } }
        return a
      })
      for (const a in dt.dtuser) {
        wskk.addRow(dt.dtuser[a])
      }
      wsak.columns = hdrak.map(x => {
        const a = {}
        a.key = x
        a.style = { alignment: { vertical: 'top', horizontal: 'left' } }
        return a
      })
      for (const a in dt.alAkun) {
        wsak.addRow(dt.alAkun[a])
      }
      wb.xlsx.writeBuffer()
        .then(buffer => {
          if (typeof cordova !== 'undefined') {
            root.$q.notify({ message: `File draftHP.xlsx tersimpan di folder download...`, color: 'teal' })
            saveBlob2File(`draftHP.xlsx`, new Blob([buffer]))
          } else {
            FileSaver.saveAs(new Blob([buffer]), `draftHP.xlsx`)
          }
        })
        .catch(err => console.log(err))
    }
    return { ...toRefs(dt), formatExcel, toDown, ambilData, Upload, total, delDet }
  },
  watch: {
    selected: function (v) {
      if (v.length) {
        this.jh = v.length ? v[0] : {}
        this.det = true
        this.detAj()
      }
    }
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
