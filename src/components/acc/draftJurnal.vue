<template>
  <div class="q-mt-md">
    <q-form
      ref="form"
      @submit="simpan(jh)"
      @reset="onReset"
      class="q-gutter-md">
      <q-table
        :data="detJur"
        :columns="jdl"
        dense
        separator="cell"
        class="dataPR">
        <template v-slot:top>
          <div class="col-xs-12">
            <q-toolbar>
              <div class="col-2 q-table__title">Upload Jurnal</div>
              <q-space/>
              <q-select
                v-if="['MAN','purchase','acc'].some(a=> a== $store.state.auth.user.userType)"
                v-model="jh.kodeCab"
                :options="cabAll"
                :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
                option-value="kodeCab"
                emit-value
                map-options
                style="min-width: 250px; max-width: 300px"
                label="Pilih cabang... "
                :rules="inRul"
                dense
                lazy-rules/>
              <q-btn
                flat round dense
                icon="add_circle"
                @click="plus"
                class="q-ml-md"
                color="accent"
              />
            </q-toolbar>
          </div>
          <div class="row q-gutter-md justify-between" >
            <div class="col-xs-6 col-sm-5 col-md-4">
              <q-input filled v-model="jh.tgl" label="Tanggal" dense lazy-rules :rules="inRul" readonly>
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy v-if="['MAN','acc','mitra'].some(a=> a== $store.state.auth.user.userType)" ref="qDateProxy" transition-show="scale" transition-hide="scale">
                      <q-date v-model="jh.tgl" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
            <div class="col-xs-8 col-md-5">
              <q-input
                v-model="jh.uraian"
                :rules="inRul"
                dense
                label="Judul Transaksi"/>
            </div>
            <div class="col-xs-8 col-md-5">
              <q-file color="orange" dense v-model="fileStok" label="Upload Jurnal" @input="ambilData(fileStok)" v-if="jh.tgl">
                <template v-slot:append>
                  <q-icon v-if="fileStok" name="cancel" @click.stop.prevent="fileStok = null" class="cursor-pointer" />
                  <q-btn
                    dense outline
                    label="Format"
                    @click="formatExcel"
                    class="q-ml-md"
                    color="primary"
                  />
                </template>
              </q-file>
            </div>
          </div>
        </template>
        <template
          v-slot:body="props">
          <q-tr :props="props">
            <q-td key="desk" :props="props">
              {{ props.row.desk }}
              <q-popup-edit v-model="props.row.desk">
                <q-input
                  v-model="props.row.desk"
                  :rules="inRul"
                  label="Deskripsi..."/>
              </q-popup-edit>
            </q-td>
            <q-td key="kodeAkun" :props="props">
              {{ props.row.kodeAkun }} {{ props.row.namaAkun }}
              <q-popup-edit v-model="props.row.akun">
                <q-select
                  filled
                  v-model="props.row.akun"
                  use-input
                  dense
                  options-dense
                  input-debounce="0"
                  label="Pilih Akun COA"
                  :options="options"
                  :option-label="(item) => item && `${item.kodeAkun} ${item.namaSubAkun} ${item.namaAkun}`"
                  option-value="kodeAkun"
                  map-options
                  @input="pilAkun(props.row)"
                  @filter="filterFn"
                  style="width: 250px"
                >
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey">
                        No results
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </q-popup-edit>
            </q-td>
            <q-td key="DK" :props="props">
              <q-select
                filled
                v-model="props.row.DK"
                :options="['D','K']"
                dense
                stack-label
                label="DK"
              />
            </q-td>
            <q-td key="nilai" :props="props">
              {{ props.row.nilai | duit }}
              <q-popup-edit v-model="props.row.qty">
                <q-input
                  v-model="props.row.nilai"
                  :rules="inRul"
                  type="number"
                  label="Nilai"/>
              </q-popup-edit>
            </q-td>
            <q-td key="act" :props="props" auto-width>
              <q-icon name="close" color="red" @click="delJur(props.row)" />
            </q-td>
          </q-tr>
        </template>
        <template v-slot:bottom-row>
          <q-tr>
            <q-td
              align="center">
              <strong>Total Debit</strong>
            </q-td>
            <q-td align="right"><strong>{{ total.tdebit | duit }}</strong></q-td>
          </q-tr>
          <q-tr>
            <q-td
              align="center">
              <strong>Total Kredit</strong>
            </q-td>
            <q-td align="right"><strong>{{ total.tkredit | duit }}</strong></q-td>
          </q-tr>
          <q-tr>
            <q-td
              align="center">
              <strong>Balance</strong>
            </q-td>
            <q-td
              align="right"><strong>{{ total.tblnce | duit }}</strong></q-td>
          </q-tr>
        </template>
      </q-table>
      <div align="right">
        <q-btn label="Reset" type="reset" color="orange" flat class="q-ml-sm" />
            <q-btn label="Submit" type="submit" color="primary" flat/>
      </div>
    </q-form>
  </div>
</template>
<script>
import { accRek, injurnal, dtPartner, dtCab } from '../../services/apiList'
import { reactive, computed, toRefs, onMounted } from '@vue/composition-api'
import Excel from 'exceljs'
import FileSaver from 'file-saver'
export default {
  setup (props, { root }) {
    const dt = reactive({
      valid: true,
      inRul: [ v => !!v || 'Isi data' ],
      jurnal: [],
      jdl: [
        { label: 'Deskripsi', name: 'desk', field: row => row.desk, align: 'left' },
        { label: 'Akun', name: 'kodeAkun', field: row => row.kodeAkun, align: 'left' },
        { label: 'D/K', name: 'DK', field: row => row.DK, align: 'right' },
        { label: 'Nilai', name: 'nilai', field: row => row.nilai, align: 'right' },
        { label: 'Act', name: 'act' }
      ],
      menu: false,
      date: null,
      jh: { tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), uraian: '', status: 'W' },
      jns: [
        { text: 'Debet', value: 'D' },
        { text: 'Kredit', value: 'K' }
      ],
      alAkun: [],
      options: [],
      detJur: [],
      addJur: { kodeAkun: null, DK: 'D', nilai: 0 },
      ckSub: '',
      akunCOA: {},
      fileStok: null,
      cabAll: []
    })
    const subAkun = computed(() => {
      let x = new Set(dt.alAkun.map(a => a.namaSubAkun))
      return x
    })
    const perSubAkun = computed(() => {
      let x = dt.ckSub
      return dt.alAkun.filter(a => a.namaSubAkun === x)
    })
    const akun = computed(() => {
      // let x = []
      return dt.alAkun.filter(y => y.subAkun === 1)
    })
    const total = computed(() => {
      let x = {
        tdebit: root.$dwn.jumlah(dt.detJur.map(a => a.DK === 'D' && a.nilai)),
        tkredit: root.$dwn.jumlah(dt.detJur.map(a => a.DK === 'K' && a.nilai)),
        tblnce: root.$dwn.jumlah(dt.detJur.map(a => {
          return a.DK === 'D' ? a.nilai : -a.nilai
        }))
      }
      return x
    })
    onMounted(() => {
      accRek()
        .then(res => {
          dt.alAkun = res.data
        })
      dtCab()
        .then(({ data }) => {
          dt.cabAll = data
        })
        .catch(err => console.log(err))
    })
    const csvJSON = (x) => {
      let csv = x.replace(/(?:\r\n|\r|\n)/g, '|')

      let lines = csv.split('|')

      let result = [],
        atlx = []

      let headers = [
        'no',
        'kodeAkun',
        'DK',
        'nilai',
        'desk'
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
          dt.detJur = dtUp
          console.log(dt.detJur)
          // dt.dta = JSON.parse(csvJSON(e.target.result).atl)
          // hd.tgl = this.dt[1][6]
        }
        reader.readAsText(file)
        // dt.det = true
      }
    }
    const formatExcel = async () => {
      var wb = new Excel.Workbook()
      var wshp = wb.addWorksheet('dataJurnal', { views: [ { showGridLines: false } ] })
      // label judul
      let hdr = [
        'no',
        'kodeAkun',
        'DK',
        'nilai',
        'desk'
      ]
      wshp.addRow(hdr).font = { size: 12, underline: 'double', bold: true, color: { argb: '009292' } }
      wshp.getCell('B1').note = 'yyyy-mm-dd'
      /* let wskp = wb.addWorksheet('kodePartner', { views: [ { showGridLines: false } ] })
      let wskk = wb.addWorksheet('kodeKary', { views: [ { showGridLines: false } ] }) */
      let wsak = wb.addWorksheet('COA', { views: [ { showGridLines: false } ] })
      /* let hdrkp = ['kodePartner', 'namaPartner', 'alamat']
      let hdrkk = ['kodeKar', 'namaKaryawan', 'alamat'] */
      let hdrak = ['kodeAkun', 'namaAkun', 'jnsAkun', 'namaSubAkun']
      /* wskp.addRow(hdrkp).font = { size: 12, underline: 'double', bold: true, color: { argb: '1DE9B6' } }
      wskk.addRow(hdrkk).font = { size: 12, underline: 'double', bold: true, color: { argb: '1DE9B6' } } */
      wsak.addRow(hdrak).font = { size: 12, underline: 'double', bold: true, color: { argb: '009292' } }
      /* wskp.columns = hdrkp.map(x => {
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
      } */
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
            root.$q.notify({ message: `File draftJurnal.xlsx tersimpan di folder download...`, color: 'teal' })
            saveBlob2File(`draftJurnal.xlsx`, new Blob([buffer]))
          } else {
            FileSaver.saveAs(new Blob([buffer]), `draftJurnal.xlsx`)
          }
        })
        .catch(err => console.log(err))
    }
    const pilAkun = (x) => {
      x.kodeAkun = x.akun.kodeAkun
      x.namaAkun = x.akun.namaAkun
    }
    return { ...toRefs(dt), total, akun, perSubAkun, subAkun, ambilData, formatExcel, pilAkun }
  },
  methods: {
    filterFn (val, update) {
      if (val === '') {
        update(() => {
          this.options = this.alAkun
        })
        return
      }
      update(() => {
        const needle = val.toLowerCase()
        this.options = this.alAkun.filter(v => (v.namaSubAkun.toLowerCase().indexOf(needle) > -1 || v.namaAkun.toLowerCase().indexOf(needle) > -1 || v.kodeAkun.toLowerCase().indexOf(needle) > -1))
      })
    },
    getRkn () {
      dtPartner()
        .then(res => {
          console.log(res.data)
        })
    },
    plus () {
      this.detJur.push(Object.assign({}, this.addJur))
    },
    delJur (item) {
      const index = this.detJur.indexOf(item)
      confirm(`Hapus  nomer urut ${index + 1} ?`) && this.detJur.splice(index, 1)
    },
    remove (item) {
      //        this.chips.splice(this.chips.indexOf(item), 1)
      this.chips = [] // [...this.chips]
    },
    clear () {
      // q-tdis.$refs.form.reset()
      this.jh = { tgl: null, uraian: null, status: '' }
      this.detJur = []
    },
    async simpan () {
      if (this.detJur.length > 0 && this.detJur.every(a => (a.nilai !== 0 && a.kodeAkun !== null)) && this.total.tblnce === 0) {
        let x = await { hd: this.jh, det: this.detJur }
        injurnal(x)
          .then(res => {
            this.$q.notify({ message: `${res.data.st}`, color: 'teal' })
            this.onReset()
          })
          .catch(err => {
            console.log(err)
          })
      } else {
        this.$q.notify({ message: 'Cek data input...', color: 'warning' })
      }
    },
    ok (x) {
      console.log('iki')
      if (x) {
        this.jh.noreff = x
        console.log(x)
      }
    },
    onReset () {
      this.jh = { tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), cabID: '', uraian: '' }
      this.detJur = []
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
