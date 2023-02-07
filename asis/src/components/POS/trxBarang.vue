<template>
  <div class="flex flex-center">
    <q-card class="print-hide">
      <q-card-section>
        <q-table
          class="dataTrx"
          :data="dtTrx"
          :columns="jdl"
          row-key="nomorBukti"
          selection="single"
          :selected.sync="expanded"
          :filter="cari"
          dense>
          <template v-slot:top>
            <div class="col-3 q-table__title">Data Transaksi {{ jenis.judul }}</div>
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
              icon="add_circle"
              @click="adP = true"
              class="q-ml-md"
              color="accent"
            />
            <q-btn
              flat round dense
              icon="file_download"
              @click="toDown"
              class="q-ml-md"
              color="primary"
            />
            <q-select
              v-if="['MAN','purchase'].some(a=> a== $store.state.auth.user.userType)"
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
          <!-- <template v-slot:header="props">
            <q-tr :props="props">
              <q-th auto-width />
              <q-th
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
              >
                {{ col.label }}
              </q-th>
              <q-th>Action</q-th>
            </q-tr>
          </template> -->
          <template v-slot:body-cell-act="props">
            <!-- <q-tr :props="props">
              <q-td auto-width>
                <q-btn size="sm" color="accent" round dense @click="[expanded =[props.row.nomorBukti],getdetTrx(props.row),pn=!pn]" :icon="props.expand ? 'remove' : 'add'" />
              </q-td>
              <q-td
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
              >
                {{ col.value }}
              </q-td> -->
              <q-td auto-width>
                <q-btn v-if="['W', 'D'].some(a => a === props.row.status) && $store.state.auth.user.userType ==='admin'"
                  icon-right="check" color="teal" fab-mini outline
                  @click="pr=props.row,tompo(props.row)" class="q-ml-xs">
                  <q-tooltip content-class="bg-cyan" :offset="[10, 10]" anchor="center left">
                    Konfirm
                  </q-tooltip>
                </q-btn>
                <q-btn dense icon-right="print" color="orange" flat @click="pr=props.row,printW(props.row)"></q-btn>
                <q-btn v-if="props.row.status === 'T' && props.row.garansi==='Y' && ['MAN','acc', 'purchase'].some(a=> a== $store.state.auth.user.userType)" icon-right="replay" color="warning" flat @click="returBarang(props.row)">Retur</q-btn>
              </q-td>
            <!-- </q-tr>
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
            </q-tr> -->
          </template>
        </q-table>
      </q-card-section>
    </q-card>
    <q-dialog
      v-model="reT"
      full-width>
      <retur ref="retur" :pr="selected" :detTrx="detRet"/>
    </q-dialog>
    <q-dialog
      v-model="det"
      full-width>
      <q-card>
        <q-card-section>
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
                </table>
              </div>
              <div class="col-6">
                <table>
                  <tr>
                    <td colspan="2"><b>Nota Penerimaan Barang</b></td>
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
                <q-td key="keterangan" :props="props">
                  <div >{{ props.row.keterangan }}</div>
                  <q-popup-edit v-model="props.row.keterangan" buttons>
                    <q-input v-model="props.row.keterangan"
                      dense autofocus counter
                      @keyup.enter.stop
                      @change="updDet(props.row)"
                      type="textarea" label="Keterangan"/>
                  </q-popup-edit>
                </q-td>
                <q-td key="qty" :props="props">
                  {{ props.row.qty | nomer }}
                </q-td>
              </q-tr>
            </template>
            <template v-slot:bottom-row>
              <q-tr>
                <q-th colspan="2" class="text-center">Diterima Oleh</q-th>
                <q-th colspan="2" class="text-center">Dibuat Oleh</q-th>
              </q-tr>
              <q-tr>
                <q-th colspan="2" class="text-center">..................</q-th>
                <q-th colspan="2" class="text-center">Sales ID</q-th>
              </q-tr>
            </template>
          </q-table>
        </q-card-section>
        <q-card-actions>
          <q-space/>
          <q-btn v-if="pr.status === 'W'" icon-right="check" color="teal" flat @click="terima(pr)">Terima</q-btn>
          <q-btn v-if="pr.status === 'T' && pr.garansi==='Y'" icon-right="replay" color="warning" flat @click="returBarang(pr)">Retur</q-btn>
          <q-btn color="teal" @click="getdetTrx(pr),prnt()">Print</q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { dtTrx, addPR, detTrx, konfirm, cabang, updetTrans } from '../../services/apiList'
import retur from './Retur'
export default {
  // name: 'PageName',
  props: {
    jnsTrx: {
      type: String,
      default: 'J',
      validator: function (x) {
        return ['J', 'B', 'RJ', 'RB'].indexOf(x) !== -1
      }
    }
  },
  components: {
    retur
  },
  /*   setup(props,{root}){
    const jdld = computed(() => {
      let a = [
        { name: 'No', label: 'No', field: row => row.index, align: 'right' },
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left' },
        { name: 'qty', label: 'Qty', field: row => row.qty, jml: 'Y', align: 'right' },
        { name: 'hargaSat', label: 'harga @', field: row => row.hargaSat, jml: 'Y', align: 'right' },
        // { name: 'hpp', label: 'hpp', field: row => row.hpp, align: 'right' },
        { name: 'dpp', label: 'DPP', field: row => row.dpp, jml: 'Y', align: 'right' },
        { name: 'ppn', label: 'PPN', field: row => row.ppn, jml: 'Y', align: 'right' },
        { name: 'act', label: 'Act' }
      ]
      let b = ['MAN', 'purchase'].some(a => a === root.$store.state.auth.user.userType) || props.jnsTrx === 'J' ? a.splice(-1) : a.splice(4, 3)
      console.log(b)
      return a
    })
    return{ jdld}
  }, */
  data () {
    return {
      dtTrx: [],
      detTrx: [],
      detRet: [],
      jdld: [
        { name: 'index', label: '#', field: 'index', style: 'max-width: 10px' },
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left' },
        { name: 'keterangan', label: 'Keterangan', field: row => row.keterangan, align: 'left' },
        { name: 'qty', label: 'Qty', field: row => row.qty, jml: 'Y', align: 'right' }
      ],
      jdle: [
        { name: 'index', label: '#', field: 'index', style: 'max-width: 10px' },
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left' },
        { name: 'qty', label: 'Qty', field: row => row.qty, jml: 'Y', align: 'right' }
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
      cabAll: [],
      det: false,
      filt: { kodecab: 'MP01', ac: 'N', tgla: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01', tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10) }
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
      x.judul = this.jnsTrx === 'J' ? 'Penjualan' : 'Pembelian'
      x.partner = this.jnsTrx === 'J' ? 'CUSTOMER' : 'SUPPLIER'
      return x
    },
    jdl () {
      let x = [
        { name: 'kodeCab', label: 'Cabang', field: row => row.kodeCab, align: 'left' },
        { name: 'nomorBukti', label: 'Nomor Transaksi', field: row => row.nomorBukti, align: 'left' },
        { name: 'tglKirim', label: 'Tanggal', field: row => row.tglKirim, align: 'left' },
        { name: 'namaPartner', label: 'Pelanggan', field: row => row.namaPartner, align: 'left' },
        { name: 'cbayar', label: 'Cara Bayar', field: row => row.ct, align: 'left' },
        { name: 'status', label: 'Status', field: row => row.status, align: 'left' },
        { name: 'act', label: 'Act' }
      ]
      if (this.jnsTrx === 'B') {
        x[3] = { name: 'ketPR', label: 'Keterangan', field: row => row.ketPR, align: 'left' }
      }
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
    tompo (x) {
      if (x.ancab === 'Y' && x.asal === this.$store.state.auth.user.kodeCab && x.status === 'D') {
        this.$q.notify({ message: 'Yang berhak menerima cabang pembeli...', color: 'warning' })
      } else if ((x.ancab === 'Y' && x.tujuan === this.$store.state.auth.user.kodeCab && x.status === 'D') || (x.ancab !== 'Y' && x.status === 'W')) {
        this.$q.dialog({
          title: `Konfirmasi Nomor Bukti : ${x.nomorBukti}`,
          message: '',
          options: {
            type: 'radio',
            model: 'konfr',
            // inline: true
            items: [
              { label: 'Terima', value: 'T', color: 'secondary' },
              { label: 'Batal', value: 'B', color: 'red' }
            ],
            isValid: val => ['T', 'B'].some(a => a === val)
          },
          ok: {
            push: true
          },
          persistent: false
        }).onOk((data) => {
          if (x.status === 'D' && data === 'B') {
            this.$q.notify({ message: 'Abaikan bila tidak menerima barang...', color: 'teal' })
          } else {
            x.status = x.ancab === 'Y' && x.asal === this.$store.state.auth.user.kodeCab && data === 'T' ? 'D' : data
            konfirm(x)
              .then(res => {
                this.$q.notify({ message: `${res.data.st}`, color: 'teal' })
              })
              .catch(err => {
                console.log(err)
              })
          }
        }).onCancel(() => {
          /* console.log('cancel')
            this.pr.status = 'B'
            konfirm(this.pr)
              .then(res => {
                this.$q.notify({ message: `${res.data.st}`, color: 'teal' })
                  .catch(err => {
                    console.log(err)
                  })
              }) */
        }).onDismiss(() => {
          // console.log('I am triggered on both OK and Cancel')
        })
      }
    },
    getTrx () {
      this.filt.jnsTrx = this.jnsTrx
      dtTrx(this.filt)
        .then(({ data }) => {
          this.dtTrx = data
        })
        .catch((err) => {
          console.log(err)
        })
    },
    updDet (x) {
      updetTrans(x)
        .then(res => {
          this.$q.notify({ message: `${res.data.st}`, color: 'teal' })
        })
        .catch((err) => {
          console.log(err)
          this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    },
    addPR (x) {
      addPR({ hd: x, det: this.detTrx })
        .then(res => {
          this.onReset()
          this.getPR()
          this.$q.notify({ message: `${res.data.st}`, color: 'teal' })
        })
        .catch((err) => {
          console.log(err)
          this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    },
    getdetTrx (x) {
      this.pr = x
      this.exp.biaya = x.biaya
      this.detTrx = []
      detTrx(x)
        .then(res => {
          this.detTrx = res.data
          this.det = true
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
          message: `Barang diterima oleh ${this.$store.state.auth.user.nama} ?`,
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
    lihat (x) {
      //      this.selected = x
      this.getdetTrx(x)
      /* detTrx(x)
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
          this.det = true
        })
        .catch((err) => {
          console.log(err)
          this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        }) */
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
    },
    async printW (x) {
      let detail = await detTrx(x)
      let tqty = detail.data.reduce((a, b) => this.$dwn.jumlah([a, b.qty]), 0)
      let wd = window.open('', 'SuratJalan', 'resize = 1')
      let html = `<html>
        <title>Cetak Nota ${this.jenis.judul} ${x.nomorBukti}</title>
        <style>
        #tss{
          font-size: 12px;

        }
        #tss tr td{
          font-size: 12px;
        }
        .bdr_btm{
          border-bottom: 1px solid #000;
          font-size: 12px;
        }

        .bdr_top{
          border-top: 1px solid #000;
          font-size: 12px;
        }
        #table_product th {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #000;
        }
        #table_product td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        @media print{
          #man {
            visibility:hidden;
          }
          thead.report-header {
            display: table-header-group;
          }
          table.report.container {
            page-break-after: always;
          }
        }
        </style>
        <body style="font-size: 11px">

          <table width='100%' id="tss" class="report-container">
            <thead class="report-header">
            <tr>
              <td colspan="3" width='60%' valign="top">

                <table width="100%">
                  <tr>
                    <td>
                      <img src="/statics/logo/${this.pr.kodeCab}.png" alt="" style="width:8%">
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <b>${this.pr.namaCabang.toUpperCase()}</b>
                    </td>
                  </tr>
                  <tr>
                    <td st>
                      <b>${this.pr.alamatCabang}</b>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <b>${this.pr.telp}</b>
                    </td>
                  </tr>
                </table>
              </td>
              <td align='right'>
                <table width="100%" >
                  <tr>
                    <td colspan="4">
                      <b><i>${this.jenis.partner}</i></b>
                    </td>
                  </tr>
                  <tr>
                    <td width='100%' colspan="4">PT Aston Pusat</td>
                  </tr>
                  <tr>
                    <td width='100%' colspan="4">
                     
                    </td>
                  </tr>

                  <tr>
                    <td width='100%' colspan="4"></td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td colspan="4" class="">
                <table width='100%' class="bdr_top">
                  <tr>
                    <td width="50%">
                      <h1>
                        <b>Dokumen Pengiriman <br/> #${x.nomorBukti}</b>
                      </h1>
                    </td>
                    <td width="20%"><b>Date Ordered:</b><br/>${new Date(x.tglKirim).toLocaleString('en-GB').slice(0, 10)}</td>
                    <td width="50%"><b>Delivery Date:</b><br/>${new Date(x.tglKirim).toLocaleString('en-GB').slice(0, 10)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            </thead>
            <tr>
              <td rowspan="" colspan="4" class="">
                <br/>
                <table width='100%' id="table_product">
                <thead class="report-header">
                  <tr  class="bdr_btm">
                    <th>Deskripsi Barang</th>
                    <th width='10%' style="text-align:center">Quatity</th>
                  </tr>
                  </thead>`
      let dtDet = ''
      detail.data.forEach((det, i) => {
        dtDet += `<tr>
          <td>${(i + 1).toString().padStart(3, ' ')}. ${det.namaBarang}</td>
          <td style="text-align:right">${new Intl.NumberFormat('en').format(Number(det.qty).toFixed(2))}</td>
        </tr>`
      })
      let ttp = `</table>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <table width='100%' >
                  <tr>
                    <td width='60%' valign="top">
                    </td>
                    <td align="right" valign="top">
                      <table width="100%" >
                        <td width='60%' align='right' colSpan="4"><b>Jumlah Produk</b></td>
                        <td style="text-align:right"><b>${new Intl.NumberFormat('en').format(Number(tqty).toFixed(2))}</b></td>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td colspan="4" align='center'>
                <table width='90%' align='center'>
                  <tr>
                    <td align='center'>
                      Disiapkan<br/>
                      <br/><br/><br/><br/>
                      (${this.$store.state.auth.user.nama})
                  </td>
                  <td width='33.3%' align='center'>
                    Dikirim Oleh<br/>
                    <br/><br/><br/><br/>
                    (.........................)
                  </td>
                  <td width='33.3%' align='center'>
                    Diterima<br/>
                    <br/><br/><br/><br/>
                    (.........................)
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <div id=man style="border:1px solid red;background-color:silver;padding:5px;width:80%;">
          Pengaturan Printer Epson LX 310: <hr>
          <ul>
            <li>Ukuran kertas 21 cm * 14.8 cm / A4 tanpa header dan footer</li>
            <li>DPI 120 * 144</li>
            <li>Cetak menggunakan browser Mozilla</li>
          </ul>
          <hr>
          <button type=button onclick='window.print();'>Cetak Nota Penjualan</button>
        </div>

        </body>
        </html>`
      html += dtDet + ttp
      if (typeof cordova !== 'undefined') {
        cordova.plugins.printer.print(html)
      } else {
        wd.document.open()
        wd.document.write(html)
        wd.document.close()
      }
    }
  }
}
</script>
