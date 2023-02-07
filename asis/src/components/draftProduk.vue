<template>
  <div>
    <q-table
      class="dataTrx"
      :data="dtStokAwal"
      :columns="jdl"
      :filter="cari"
      :pagination.sync="halaman"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Data Upload Produk
          <q-file color="orange" dense v-model="fileStok" label="Upload Stok" @input="ambilData(fileStok)">
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
        <q-space/>
        <q-btn
          dense
          label="Proses"
          @click="prosesStok"
          class="q-ml-md"
          color="primary"
        />
        <q-input dense debounce="300" v-model="cari" placeholder="Search" class="q-ml-sm">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <!-- <q-btn
          flat round dense
          icon="add_circle"
          @click="prosesStok"
          class="q-ml-md"
          color="accent"
        /> -->
      </template>
      <template v-slot:body-cell-No="props">
        <q-td align="right">
          {{ (dtStokAwal.indexOf(props.row)) + 1 }}
        </q-td>
      </template>
      <template v-slot:body-cell-act="props">
        <q-td align="right">
          <q-btn round  icon="delete" @click="delStok(props.row)" color="red"/>
        </q-td>
      </template>
      <!-- <template v-slot:bottom-row>
        <q-tr>
          <q-td align="right" colspan="5">Jumlah</q-td>
          <q-td>{{ dtStokAwal.reduce((a,b) => $dwn.jumlah([a, b.qty]), 0) | nomer }}</q-td>
          <q-td>{{ dtStokAwal.reduce((a,b) => $dwn.jumlah([a, b.hpp]), 0) | nomer }}</q-td>
          <q-td>{{ dtStokAwal.reduce((a,b) => $dwn.jumlah([a, b.jmlHpp]), 0) | nomer }}</q-td>
        </q-tr>
      </template> -->
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
                    {{ iu }}
                </td>
              </tr>
            </tbody>
            <!-- <tfoot>
              <tr>
                <th align="right">Jumlah</th>
                <th >{{ stokUpload.length && stokUpload.slice(1).filter(a => a !== null).reduce((a,b) => $dwn.jumlah([a, b[1] || 0]),0) | duit }}</th>
                <th >{{ stokUpload.length && stokUpload.slice(1).filter(a => a !== null).reduce((a,b) => $dwn.jumlah([a, b[2] || 0]),0) | duit }}</th>
                <th >{{ stokUpload.length && stokUpload.slice(1).filter(a => a !== null).reduce((a,b) => $dwn.jumlah([a, b[3] || 0]),0) | duit }}</th>
              </tr>
            </tfoot> -->
          </q-markup-table>
        </q-card-section>
        <q-card-actions>
          <q-space/>
          <q-btn v-if="stokUpload.length" label="Upload" color="orange" @click="Upload(dta)"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>
<script>
import { reactive, toRefs, onMounted } from '@vue/composition-api'
import { dtCab, getDraftProduk, draftProduk, prosesDraftProduk, delDraftProduk } from '../services/apiList'
import FileSaver from 'file-saver'
export default {
  setup (props, { emit, root }) {
    const dt = reactive({
      jdl: [
        { name: 'No', label: 'No', align: 'right' },
        { name: 'kodeCab', label: 'kodeCab', field: row => row.kodeCab, align: 'left' },
        { name: 'kodeProduk', label: 'kodeProduk', field: row => row.kodeProduk, sortable: true, align: 'left' },
        { name: 'sku', label: 'SKU', field: row => row.sku, sortable: true, align: 'left' },
        { name: 'namaProduk', label: 'namaProduk', field: row => row.namaProduk, sortable: true, align: 'left' },
        { name: 'deskripsi', label: 'deskripsi', field: row => row.deskripsi, sortable: true, align: 'left' },
        { name: 'kodeMerk', label: 'kodeMerk', field: row => row.kodeMerk },
        { name: 'kodeCat', label: 'kodeCat', field: row => row.kodeCat },
        { name: 'hargaGrosir', label: 'hargaGrosir', field: row => row.hargaGrosir, format: (val) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(val) },
        { name: 'hargaRetail', label: 'hargaRetail', field: row => row.hargaRetail, format: (val) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(val) },
        { name: 'compID', label: 'compID', field: row => row.compID },
        { name: 'cek', label: 'Cek Data', field: row => row.cek },
        { name: 'act', label: 'act', align: 'right' }
      ],
      dtStokAwal: [],
      detAjust: [],
      filt: { tgl: '', kodeCab: 'MP01', rekap: true },
      cabAll: [],
      cari: '',
      jh: {},
      selected: [],
      det: false,
      halaman: { rowsPerPage: 10 },
      fileStok: null,
      stokUpload: [],
      dta: []
    })
    dtCab()
      .then(({ data }) => {
        dt.cabAll = data
      })
      .catch(err => console.log(err))
    const getList = () => {
      getDraftProduk(dt.filt)
        .then(({ data }) => {
          dt.dtStokAwal = data
        })
        .catch(err => console.log(err))
    }
    onMounted(() => {
      getList()
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
    const csvJSON = (x) => {
      let csv = x.replace(/(?:\r\n|\r|\n)/g, '|')

      let lines = csv.split('|')

      let result = [],
        atlx = []

      let headers = ['kodeCab', 'kodeProduk', 'sku', 'namaProduk', 'kodeMerk', 'deskripsi', 'kodeCat', 'compID', 'hargaGrosir', 'hargaRetail']
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
      if (x) {
        const file = x
        const reader = new FileReader()
        reader.onload = async e => {
          root.$emit('load', csvArray(e.target.result))
          dt.stokUpload = csvArray(e.target.result).atlx
          dt.dta = JSON.parse(csvJSON(e.target.result).atl)
          // hd.tgl = this.dt[1][6]
        }
        reader.readAsText(file)
        dt.det = true
      }
    }
    const Upload = (x) => {
      // cek data
      // let kodeCab = ['MAN', 'acc', 'purchase'].some(a => a === root.$store.state.auth.user.userType) ? dt.filt.kodeCab : root.$store.state.auth.user.kodeCab
      /* let hd = ['kodeCab', 'kodeProduk', 'sku', 'namaProduk', 'kodeMerk', 'deskripsi', 'kodeCat', 'compID', 'hargaGrosir', 'hargaRetail']
      let ck = hd.every((i, idx) => i === x[0]])
      if (ck) { */
      draftProduk(x)
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
    }
    const prosesStok = () => {
      let ck = dt.dtStokAwal.every(a => a.cek === 'Baru')
      // let ckp = dt.dtStokAwal.filter(a => a.tglStokAwal === x.tglStokAwal).every(a => a.st === null)
      // console.log(ckp)
      if (!ck) {
        root.$q.notify({ message: 'Ada yang sudah ada di sistem...', color: 'purple' })
      } else {
        root.$q.dialog({
          title: 'Proses Data Produk',
          message: 'Konfirmasi :',
          options: {
            type: 'radio',
            model: 'hps',
            // inline: true
            items: [
              { label: `Semua data produk ?`, value: 'All', color: 'secondary' }
            ]
          },
          cancel: true,
          persistent: true
        }).onOk(data => {
          // x.hps = data
          if (data !== 'hps') {
            prosesDraftProduk()
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
    const updateProduk = () => {
      let ck = dt.dtStokAwal.every(a => a.cek === 'Baru')
      root.$q.dialog({
        title: 'Proses Data Produk',
        message: ck ? 'Produk Baru' : 'Anda yakin Update Data Produk ?',
        cancel: true,
        persistent: true
      }).onOk(data => {
        // x.hps = data
        if (data !== 'hps') {
          prosesDraftProduk()
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
    const delStok = (x) => {
      root.$q.dialog({
        title: 'Hapus Draft Produk',
        message: 'Pilihan hapus:',
        options: {
          type: 'radio',
          model: 'hps',
          // inline: true
          items: [
            { label: `Semua data Produk`, value: 'All', color: 'secondary' },
            { label: `Hanya kode produk ${x.kodeProduk}`, value: 'satu', color: 'red' }
          ]
        },
        cancel: true,
        persistent: true
      }).onOk(data => {
        x.hps = data
        console.log(data)
        if (data !== 'hps') {
          delDraftProduk({ det: x, hd: { all: data } })
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
      let hd = ['kodeCab', 'kodeProduk', 'sku', 'namaProduk', 'kodeMerk', 'deskripsi', 'kodeCat', 'compID', 'hargaGrosir', 'hargaRetail']
      let csv = hd.map((d) => d).join(',')
      let blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      FileSaver.saveAs(blob, 'StokAwal.csv')
    }
    return { ...toRefs(dt), toDown, getList, delStok, prosesStok, ambilData, Upload, updateProduk }
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
