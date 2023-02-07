<template>
  <div>
    <q-table
      class="dataTrx"
      :data="filt.rekap ? rekap : dtStokAwal"
      :columns="jdl"
      :filter="cari"
      :pagination.sync="halaman"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Data Upload Stok Awal
          <q-file color="orange" dense v-model="fileStok" label="Upload Stok" @input="ambilData(fileStok)" v-if="filt.tglStokAwal">
            <template v-slot:append>
              <q-icon v-if="fileStok" name="cancel" @click.stop.prevent="fileStok = null" class="cursor-pointer" />
              <q-btn
                dense outline
                label="Format"
                @click="toDown"
                class="q-ml-md"
                color="primary"
              />
            </template>
          </q-file>
        </div>
        <q-input filled v-model="filt.tglStokAwal" label="Tanggal" dense lazy-rules readonly>
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                <q-date v-model="filt.tglStokAwal" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" lazy-rules />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
        <q-space/>
        <q-input dense debounce="300" v-model="cari" placeholder="Search" class="q-ml-sm">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-toggle
          v-model="filt.rekap"
          label="Rekap"/>
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
          @input="getList"
          lazy-rules/>
      </template>
      <template v-slot:body-cell-No="props">
        <q-td align="right">
          {{ (filt.rekap ? rekap.indexOf(props.row) : dtStokAwal.indexOf(props.row)) + 1 }}
        </q-td>
      </template>
      <template v-slot:body-cell-act="props">
        <q-td align="right">
          <q-btn v-if="filt.rekap && !props.row.st" icon="check" round color="warning" @click="prosesStok(props.row)"/>
          <q-btn round  icon="delete" @click="delStok(props.row)" color="red"/>
        </q-td>
      </template>
      <template v-slot:bottom-row>
        <q-tr>
          <q-td align="right" colspan="5">Jumlah</q-td>
          <q-td>{{ dtStokAwal.reduce((a,b) => $dwn.jumlah([a, b.qty]), 0) | nomer }}</q-td>
          <q-td>{{ dtStokAwal.reduce((a,b) => $dwn.jumlah([a, b.hpp]), 0) | nomer }}</q-td>
          <q-td>{{ dtStokAwal.reduce((a,b) => $dwn.jumlah([a, b.jmlHpp]), 0) | nomer }}</q-td>
        </q-tr>
      </template>
    </q-table>
    <q-dialog
      v-model="det"
      full-width>
      <q-card>
        <q-card-actions><q-space/><q-icon fab name="cancel" class="cursor-pointer" color="red" v-close-popup/></q-card-actions>
        <q-card-section>
          <q-markup-table>
            <thead class="bg-teal">
              <tr>
                <th :colspan="stokUpload.length && stokUpload[0].length">
                  <div class="row no-wrap items-center">
                    <div class="text-h4 q-ml-md text-white">Data CSV File</div>
                  </div>
                </th>
              </tr>
              <tr>
                <th v-for="(iu, a) in stokUpload[0]" :key="a" align="right">{{ iu.toUpperCase() }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in stokUpload.slice(1)" :key="i">
                <td v-for="(iu, a) in item" :key="a" align="right">
                  <template v-if="a > 0">
                    {{ iu | nomer }}
                  </template>
                  <template v-else>
                    {{ iu }}
                  </template>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <th align="right">Jumlah</th>
                <th >{{ stokUpload.length && stokUpload.slice(1).filter(a => a !== null).reduce((a,b) => $dwn.jumlah([a, b[1] || 0]),0) | duit }}</th>
                <th >{{ stokUpload.length && stokUpload.slice(1).filter(a => a !== null).reduce((a,b) => $dwn.jumlah([a, b[2] || 0]),0) | duit }}</th>
                <th >{{ stokUpload.length && stokUpload.slice(1).filter(a => a !== null).reduce((a,b) => $dwn.jumlah([a, b[3] || 0]),0) | duit }}</th>
              </tr>
            </tfoot>
          </q-markup-table>
        </q-card-section>
        <q-card-actions>
          <q-space/>
          <q-btn v-if="stokUpload.length" label="Upload" color="orange" @click="Upload(stokUpload)"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>
<script>
import { reactive, toRefs, computed, onMounted } from '@vue/composition-api'
import { dtCab, draftSaldoAwal, saldoAwal, prosesStokAwal, delStokAwal } from '../services/apiList'
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
        { name: 'st', label: 'Status', field: row => row.st },
        { name: 'act', label: 'act', align: 'right' }
      ],
      dtStokAwal: [],
      jdlr: [
        { name: 'No', label: 'No' },
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Bahan', field: row => row.namaBarang, align: 'left' },
        { name: 'qty', label: 'qty', field: row => row.qty },
        { name: 'jmlHarga', label: 'jmlHarga', field: row => row.jmlHarga },
        { name: 'keterangan', label: 'keterangan', field: row => row.keterangan, align: 'right' }
      ],
      detAjust: [],
      filt: { tgl: '', kodeCab: 'MP01', rekap: true },
      cabAll: [],
      cari: '',
      jh: {},
      selected: [],
      det: false,
      halaman: { rowsPerPage: 10 },
      fileStok: null,
      stokUpload: []
    })
    dtCab()
      .then(({ data }) => {
        dt.cabAll = data
      })
      .catch(err => console.log(err))
    const getList = () => {
      draftSaldoAwal(dt.filt)
        .then(({ data }) => {
          dt.dtStokAwal = data
        })
        .catch(err => console.log(err))
    }
    onMounted(() => {
      getList()
    })
    const rekap = computed(() => {
      let perTgl = [...new Set(dt.dtStokAwal.map(a => a.tglStokAwal))]
      console.log(perTgl)
      let rkp = []
      perTgl.forEach(a => {
        let rkTgl = dt.dtStokAwal.filter(s => s.tglStokAwal === a)
        let d = {
          tglStokAwal: a,
          kodeCab: rkTgl[0].kodeCab,
          namaBarang: `Rekap stok ${a}`,
          qty: rkTgl.reduce((s, m) => root.$dwn.jumlah([s, m.qty]), 0),
          hpp: rkTgl.reduce((s, m) => root.$dwn.jumlah([s, m.hpp]), 0),
          jmlHpp: rkTgl.reduce((s, m) => root.$dwn.jumlah([s, m.jmlHpp]), 0),
          st: rkTgl[0].st
        }
        rkp.push(d)
      })
      return rkp
    })
    const csvArray = (x) => {
      let csv = x.replace(/(?:\r\n|\r|\n)/g, '|')
      let lines = csv.split('|')
      let result = [],
        atlx = []
      for (let i in lines) {
        if (i === lines.length - 1 || lines[i].length === 0) { continue }
        // let obj = []
        let currentline = lines[i].split(',')
        atlx.push(currentline)
      }
      return { atlx: atlx, atl: JSON.stringify(result) }
    }
    const ambilData = async (x) => {
      console.log(x)
      if (x) {
        const file = x
        const reader = new FileReader()
        reader.onload = async e => {
          root.$emit('load', csvArray(e.target.result))
          dt.stokUpload = csvArray(e.target.result).atlx
          // dt.dta = JSON.parse(csvJSON(e.target.result).atl)
          // hd.tgl = this.dt[1][6]
        }
        reader.readAsText(file)
        dt.det = true
      }
    }
    const Upload = (x) => {
      // cek data
      let kodeCab = ['MAN', 'acc', 'purchase'].some(a => a === root.$store.state.auth.user.userType) ? dt.filt.kodeCab : root.$store.state.auth.user.kodeCab
      let hd = ['kodeProduk', 'qty', 'hpp', 'jmlHpp']
      let ck = hd.every((i, idx) => i === x[0][idx])
      if (ck) {
        let y = x.map(a => {
          a.push(dt.filt.tglStokAwal, kodeCab)
          return a
        })
        saldoAwal(y)
          .then(res => {
            root.$q.notify({ message: res.data.st, color: 'teal' })
            dt.fileStok = null
            dt.stokUpload = []
            dt.det = false
            getList()
          })
          .catch(err => {
            console.log(err)
            dt.stokUpload = []
            root.$q.notify({ message: 'Cek data...', color: 'purple' })
          })
      } else {
        root.$q.notify({ message: 'Format data tidak sesuai...', color: 'purple' })
      }
    }
    const prosesStok = (x) => {
      console.log(x)
      let ck = dt.dtStokAwal.filter(a => a.tglStokAwal === x.tglStokAwal).every(a => a.namaBarang)
      let ckp = dt.dtStokAwal.filter(a => a.tglStokAwal === x.tglStokAwal).every(a => a.st === null)
      console.log(ckp)
      if (!ck || !ckp) {
        root.$q.notify({ message: 'Ada yang belum masuk di data produk atau data sudah dalam proses...', color: 'purple' })
      } else {
        root.$q.dialog({
          title: 'Proses Stok Awal',
          message: 'Konfirmasi :',
          options: {
            type: 'radio',
            model: 'hps',
            // inline: true
            items: [
              { label: `Semua data ${x.tglStokAwal}`, value: 'All', color: 'secondary' }
            ]
          },
          cancel: true,
          persistent: true
        }).onOk(data => {
          x.hps = data
          if (data !== 'hps') {
            prosesStokAwal(x)
              .then(res => {
                root.$q.notify({ message: res.data.st, color: 'teal' })
                getList()
              })
              .catch(err => {
                console.log(err)
                root.$q.notify({ message: err.response.data.st, color: 'purple' })
              })
          }
          // console.log('>>>> OK, received', data)
        }).onCancel(() => {
          // console.log('>>>> Cancel')
        }).onDismiss(() => {
          // console.log('I am triggered on both OK and Cancel')
        })
      }
    }
    const delStok = (x) => {
      root.$q.dialog({
        title: 'Hapus Draft Stok Awal',
        message: 'Pilihan hapus:',
        options: {
          type: 'radio',
          model: 'hps',
          // inline: true
          items: [
            { label: `Semua data ${x.tglStokAwal}`, value: 'All', color: 'secondary' },
            { label: `Hanya kode produk ${x.kodeProduk}`, value: 'satu', color: 'red' }
          ]
        },
        cancel: true,
        persistent: true
      }).onOk(data => {
        x.hps = data
        if (data !== 'hps') {
          delStokAwal(x)
            .then(res => {
              root.$q.notify({ message: res.data.st, color: 'teal' })
              getList()
            })
            .catch(err => {
              console.log(err)
              root.$q.notify({ message: err.response.data.st, color: 'purple' })
            })
        }
        // console.log('>>>> OK, received', data)
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    }
    const toDown = () => {
      let hd = ['kodeProduk', 'qty', 'hpp', 'jmlHpp']
      let csv = hd.map((d) => d).join(',')
      let blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      FileSaver.saveAs(blob, 'StokAwal.csv')
    }
    return { ...toRefs(dt), toDown, getList, delStok, saldoAwal, prosesStok, rekap, ambilData, Upload }
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
</script>
