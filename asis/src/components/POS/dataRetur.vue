<template>
  <div>
    <q-card class="print-hide">
      <q-card-section>
        <q-table
          class="dataTrx"
          :data="dtTrx"
          :columns="jdl"
          row-key="nomorBukti"
          :expanded.sync="expanded"
          :filter="cari"
          dense>
          <template v-slot:top>
            <div class="col-3 q-table__title">Data Retur {{ jenis.judul }}</div>
            <q-space />
            <q-input filled v-model="filt.tgla" label="Tanggal" dense lazy-rules :rules="inRul" readonly>
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                    <q-date v-model="filt.tgla" @input="() => ($refs.qDateProxy.hide(), getTrx())" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
            <q-input filled v-model="filt.tglb" label="Tanggal" dense lazy-rules :rules="inRul" readonly>
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy  ref="qDateProxya" transition-show="scale" transition-hide="scale">
                    <q-date v-model="filt.tglb" @input="() => ($refs.qDateProxya.hide(), getTrx())" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
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
              v-if="['MAN','purchase','acc'].some(a=> a== $store.state.auth.user.userType)"
              v-model="filt.kodeCab"
              :options="cabAll"
              :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
              option-value="kodeCab"
              emit-value
              map-options
              style="min-width: 250px; max-width: 300px"
              label="Pilih cabang... "
              :rules="inRul"
              dense
              @input="getTrx()"
              lazy-rules/>
          </template>
          <template v-slot:header="props">
            <q-tr :props="props">
              <q-th auto-width />
              <q-th
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
              >
                {{ col.label }}
              </q-th>
            </q-tr>
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td auto-width>
                <q-btn size="sm" color="accent" round dense @click="[expanded =[props.row.nomorBukti],getdetTrx(props.row),pn=!pn]" :icon="props.expand ? 'remove' : 'add'" />
              </q-td>
              <q-td
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
              >
                <template v-if="col.name === 'act'">
                  <q-btn v-if="props.row.status === 'W'" icon-right="check" color="teal" flat @click="pr=props.row,terima()">Terima</q-btn>
                  <q-btn label="print" flat color="teal" @click="getdetTrx(props.row),prnt()"/>
                  <q-btn label="jurnal" color="teal" flat @click="cj=true,getJur(props.row)"/>
                </template>
                <template v-else>
                  {{ col.value }}
                </template>
              </q-td>
            </q-tr>
            <q-tr v-show="props.expand" :props="props">
              <q-td colspan="100%">
                <q-table
                  class="detTrx"
                  :data="detTrx"
                  :columns="jdle"
                  row-key="kodeProduk"
                  separator="cell"
                  hide-bottom
                  dense>
                  <template v-slot:body="props">
                    <q-tr :props="props">
                      <q-td class="text-right">
                        {{ detTrx.indexOf(props.row) +1 }}
                      </q-td>
                      <q-td key="kodeProduk" :props="props">
                        {{ props.row.kodeProduk }}
                      </q-td>
                      <q-td key="namaBarang" :props="props">
                        {{ props.row.namaBarang }}
                      </q-td>
                      <q-td key="qty" :props="props">
                        {{ props.row.qty | nomer }}
                      </q-td>
                      <q-td key="harga" :props="props">
                        {{ props.row.jmlHarga/props.row.qty | duit }}
                      </q-td>
                      <q-td key="jmlHarga" :props="props">
                        {{ props.row.jmlHarga | duit }}
                      </q-td>
                      <q-td key="ppn" :props="props">
                        {{ props.row.ppn | duit }}
                      </q-td>
                    </q-tr>
                  </template>
                  <template v-slot:bottom-row>
                    <q-tr>
                      <q-th colspan="6" class="text-right">Biaya Kirim</q-th>
                      <q-th class="text-right">
                        {{ exp.biaya | duit }}
                      </q-th>
                    </q-tr>
                    <q-tr>
                      <q-th colspan="6" class="text-right">Total Harga</q-th>
                      <q-th align="right">{{ $dwn.jumlah([totalAll.tharga,exp.biaya]) | duit }}</q-th>
                    </q-tr>
                  </template>
                </q-table>
                <q-page-sticky position="bottom-right" :offset="[18, 18]" class="print-hide">
                  <q-fab
                    icon="pets"
                    direction="left"
                    color="accent"
                  >
                    <q-fab-action @click="prnt" color="primary" icon="print" />
                    <q-fab-action @click="terima" color="primary" icon="check" />
                  </q-fab>
                </q-page-sticky>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
    <div class="q-pa-md print-only">
      <q-table
        :data="detTrx"
        :columns="jdld"
        row-key="kodeProduk"
        separator="cell"
        hide-bottom
        dense>
        <template v-slot:top>
          <div class="col-6">
            <table>
              <tr>
                <td><b>PT Aston Printer</b></td>
              </tr>
              <tr>
                <td><b>Cabang {{ pr.kodeCab }}</b></td>
              </tr>
              <tr>
                <td><b>{{ pr.alamat }}</b></td>
              </tr>
              <tr>
                <td>Nama {{ jenis.partner }} </td>
                <td>: {{ pr.namaPartner }}</td>
              </tr>
              <tr>
                <td>Alamat {{ jenis.partner }} </td>
                <td>: {{ pr.alamat }}</td>
              </tr>
            </table>
          </div>
          <div class="col-6">
            <table>
              <tr>
                <td colspan="2"><b>Nota {{ jenis.judul }}</b></td>
              </tr>
              <tr>
                <td>Nomor </td>
                <td>: {{ pr.nomorBukti }}</td>
              </tr>
              <tr>
                <td>Tanggal </td>
                <td>: {{ pr.tglKirim }}</td>
              </tr>
            </table>
          </div>
        </template>
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td class="text-right">
              {{ detTrx.indexOf(props.row) +1 }}
            </q-td>
            <q-td key="kodeProduk" :props="props">
              {{ props.row.kodeProduk }}
            </q-td>
            <q-td key="namaBarang" :props="props">
              {{ props.row.namaBarang }}
            </q-td>
            <q-td key="qty" :props="props">
              {{ props.row.qty | nomer }}
            </q-td>
            <q-td key="harga" :props="props">
              {{ props.row.jmlHarga/props.row.qty | duit }}
            </q-td>
            <q-td key="jmlHarga" :props="props">
              {{ props.row.jmlHarga | duit }}
            </q-td>
          </q-tr>
        </template>
        <template v-slot:bottom-row>
          <q-tr>
            <q-th colspan="2" class="text-center">Diterima Oleh</q-th>
            <q-th colspan="2" class="text-center">Dibuat Oleh</q-th>
            <q-th align="right">Jumlah DPP</q-th>
            <q-th align="right">{{ totalAll.tdpp | duit }}</q-th>
          </q-tr>
          <q-tr>
            <q-th colspan="5" align="right">Jumlah PPN</q-th>
            <q-th align="right">{{ totalAll.tppn | duit }}</q-th>
          </q-tr>
          <q-tr>
            <q-th colspan="5" class="text-right">Biaya Kirim</q-th>
            <q-th class="text-right">
              {{ exp.biaya | duit }}
            </q-th>
          </q-tr>
          <q-tr>
            <q-th colspan="2" class="text-center">..................</q-th>
            <q-th colspan="2" class="text-center">Sales ID</q-th>
            <q-th align="right">Total Harga</q-th>
            <q-th align="right">{{ $dwn.jumlah([totalAll.tharga,exp.biaya]) | duit }}</q-th>
          </q-tr>
        </template>
      </q-table>
    </div>
    <q-dialog
      v-model="cj"
      full-width>
      <edJur ref="dtJurnal" :detJur="detJur" :jh="jh" @ok="cj=false"/>
    </q-dialog>
  </div>
</template>

<script>
import { dtRetur, detTrx, konfirm, cabang, getJurtrans } from '../../services/apiList'
import edJur from '../acc/edJur'
export default {
  // name: 'PageName',
  components: {
    edJur
  },
  props: {
    jnsTrx: {
      type: String,
      default: 'RJ',
      validator: function (x) {
        return ['RJ', 'RB'].indexOf(x) !== -1
      }
    }
  },
  data () {
    return {
      dtTrx: [],
      detTrx: [],
      detRet: [],
      jdld: [
        { name: 'index', label: '#', field: 'index', style: 'max-width: 10px' },
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaProduk', label: 'Nama Produk', field: row => row.namaProduk, align: 'left' },
        { name: 'qty', label: 'Qty', field: row => row.qty, align: 'right' },
        { name: 'harga', label: 'Harga @', field: row => (row.jmlHarga / row.qty), align: 'right' },
        { name: 'jmlHarga', label: 'jmlHarga', field: row => row.jmlHarga, align: 'right' }
      ],
      jdle: [
        { name: 'index', label: '#', field: 'index', style: 'max-width: 10px' },
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left' },
        { name: 'qty', label: 'Qty', field: row => row.qty, jml: 'Y', align: 'right' },
        { name: 'harga', label: 'Harga @', field: row => (row.jmlHarga / row.qty), jml: 'Y', align: 'right' },
        { name: 'jmlHarga', label: 'jmlHarga', field: row => row.jmlHarga, jml: 'Y', align: 'right' },
        { name: 'ppn', label: 'ppn', field: row => row.ppn, jml: 'Y', align: 'right' }
      ],
      adP: false,
      inRul: [ v => !!v || 'Isi data' ],
      pr: { tglKirim: '' },
      selected: {},
      expanded: [],
      cari: '',
      exp: { idExp: null, biaya: 0 },
      pn: false,
      reT: false,
      cj: false,
      detJur: [],
      jh: {},
      cabAll: [],
      filt: { kodeCab: 'MP01', ac: 'N', tgla: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10) }
    }
  },
  computed: {
    opac () {
      let a = [
        { label: 'Penjualan', value: 'N' },
        { label: 'Antar Cabang', value: 'Y' }
      ]
      this.jnsTrx === 'B' ? a[0].label = 'Pembelian' : a[0].label = 'Penjualan'
      return a
    },
    totalHarga () {
      return this.detTrx.reduce((a, b) => {
        return this.$dwn.jumlah([a, b.jmlHarga])
      }, 0)
    },
    totalAll () {
      let x = {}
      x.tdpp = this.detTrx.reduce((a, b) => this.$dwn.jumlah([a, b.dpp]), 0)
      x.tppn = this.detTrx.reduce((a, b) => this.$dwn.jumlah([a, b.ppn]), 0)
      x.tharga = this.$dwn.jumlah([x.tdpp, x.tppn])
      return x
    },
    totalQty () {
      return this.detTrx.reduce((a, b) => {
        return this.$dwn.jumlah([a, b.qty])
      }, 0)
    },
    jenis () {
      let x = {}
      x.judul = this.jnsTrx === 'RJ' ? 'Penjualan' : 'Pembelian'
      x.partner = this.jnsTrx === 'RJ' ? 'Pelanggan' : 'Vendor'
      return x
    },
    jdl () {
      let x = [
        { name: 'kodeCab', label: 'Cabang', field: row => row.kodeCab, align: 'left' },
        { name: 'nomorBukti', label: 'Nomor Transaksi', field: row => row.nomorBukti, align: 'left' },
        { name: 'tglKirim', label: 'Tanggal', field: row => row.tglKirim, align: 'left' },
        { name: 'namaPartner', label: 'Pelanggan', field: row => row.namaPartner, align: 'left' },
        { name: 'status', label: 'Status', field: row => row.status, align: 'left' },
        { name: 'act', label: 'Act' }
      ]
      if (this.jnsTrx === 'RB') { x[3].label = 'Vendor' }
      /* if (this.filt.ac === 'Y') {
        x[3].field = row => row.cabLain
      } */
      return x
    }
  },
  mounted () {
    this.getTrx()
    cabang()
      .then(({ data }) => {
        this.cabAll = data
      })
  },
  methods: {
    getJur (x) {
      getJurtrans(x)
        .then(({ data }) => {
          this.detJur = data
          this.jh = data[0]
        })
        .catch((err) => {
          console.log(err)
        })
    },
    getTrx () {
      this.filt.jnsTrx = this.jnsTrx
      dtRetur(this.filt)
        .then(({ data }) => {
          this.dtTrx = data
        })
        .catch((err) => {
          console.log(err)
        })
    },
    getdetTrx (x) {
      this.pr = x
      this.exp.biaya = x.biaya
      this.detTrx = []
      detTrx(x)
        .then(res => {
          this.detTrx = res.data
        })
        .catch((err) => {
          console.log(err)
          this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    },
    onReset () {
      this.pr = { tglRequest: '' }
      this.detTrx = []
    },
    onpil (x) {
      if (x.kodeProduk) {
        x.qty = 0
        this.detTrx.push(x)
      }
    },
    ondel (item) {
      const index = this.detTrx.indexOf(item)
      let cf = confirm(`Hapus ${item.kodeProduk} ?`)
      console.log(index, cf)
      if (cf) {
        this.detTrx.splice(index, 1)
        /* if (item.iddetTrx) {
          api.delPRd(item)
            .then(res => this.$q.notify({ message: 'Data tersimpan', color: 'success' }))
            .catch(err => this.$q.notify({ message: 'Gagal simpan...' }))
        } */
      }
    },
    prnt () {
      if (typeof cordova !== 'undefined') {
        cordova.plugins.printer.setDefaults({ monochrome: true })
        cordova.plugins.printer.print()
      } else {
        window.print()
      }
    },
    terima () {
      if (this.pr.status === 'W') {
        this.$q.dialog({
          title: 'Konfirmasi Penerimaan Barang',
          message: `Barang diterima ?`,
          cancel: true,
          persistent: false
        }).onOk(() => {
          this.pr.status = 'T'
          konfirm(this.pr)
            .then(res => {
              this.$q.notify({ message: `${res.data.st}`, color: 'teal' })
                .catch(err => {
                  console.log(err)
                })
            })
        }).onCancel(() => {
          // console.log('>>>> Cancel')
        }).onDismiss(() => {
          // console.log('I am triggered on both OK and Cancel')
        })
      }
    },
    toDown () {
      let x = {
        judul: `Data transaksi ${this.jenis.judul} `,
        dt: this.dtTrx,
        hdr: this.jdl,
        naFile: `transaksi${this.jenis.judul}`
      }
      this.$dwn.toExcel(x)
    },
    returBarang (x) {
      this.selected = x
      this.reT = true
      detTrx(x)
        .then(res => {
          let a = res.data
          for (let i in a) {
            a[i].hargaSat = a[i].jmlHarga / a[i].qty
            a[i].stok = a[i].qty
            a[i].tppn = a[i].ppn > 0 ? a[i].ppn / a[i].stok : 0
            a[i].tdpp = a[i].dpp / a[i].stok
            a[i].thpp = a[i].hpp / a[i].stok
            a[i].qty = 0
          }
          this.detRet = a
        })
        .catch((err) => {
          console.log(err)
          this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    }
  }
}
</script>
