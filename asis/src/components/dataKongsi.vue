<template>
  <div class="q-pb-md">
    <q-table
      :data="dtKongsik"
      :columns="jdl"
      :filter="cari"
      :pagination.sync="hal"
      dense>
      <template v-slot:top>
        <div class="col-xs-12 col-md-4 q-table__title">Data Rekap Kongsi</div>
        <q-space/>
        <q-chip color="blue-7" class="text-white text-bold shadow-3" clickable @click="sjlKongsi">Data Surat Jalan</q-chip>
        <q-toggle v-model="perPartner" label="Per Partner" color="orange" class="q-ml-md"/>
        <q-select v-if="perPartner" v-model="filt.partner" :options="dtPartner" class="q-ml-md" style="min-width: 250px"/>
        <q-input dense debounce="300" v-model="cari" placeholder="Search" class="q-ml-sm">
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
      </template>
      <template v-slot:body-cell-nom="props">
        <q-td auto-width>
          {{ props.rowIndex + 1 }}
        </q-td>
      </template>
      <template v-slot:body-cell-hargaJual="props">
        <q-td auto-width align="right">
          {{ props.row.hargaJual | duit }}
        </q-td>
      </template>
      <template v-slot:body-cell-hpp="props">
        <q-td auto-width align="right">
          {{ props.row.hpp | duit }}
        </q-td>
      </template>
      <template v-slot:body-cell-act="props">
        <q-td auto-width>
          <q-btn icon="send" color="teal" @click="ambil(props.row)" flat round dense/>
          <q-btn icon="replay" color="orange" @click="tarik(props.row)" flat round dense/>
        </q-td>
      </template>
    </q-table>
    <q-dialog
      v-model="adP"
      full-width
      >
      <q-card>
        <q-card-section>
          <div class="text-h6">Pengiriman Kongsi</div>
          <q-separator color="accent" spaced/>
        </q-card-section>
        <q-card-section>
          <q-form
            @submit="addKO(pr)"
            @reset="onReset"
            class="q-gutter-md">
            <q-table
              class="detPR"
              :data="detPR"
              :columns="jdld"
              row-key="kodeProduk"
              dense>
              <template v-slot:top>
                <div class="col-4 q-table__title">Detail Kirim</div>
                <q-input dense v-model="pr.tglKirim" label="Tanggal Kirim" readonly>
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                        <q-date v-model="pr.tglKirim" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
                <q-input :value="cust.namaPartner" class="q-ml-md" label="Customer" :hint="`alamat : ${cust.alamat}`" dense lazy-rules :rules="inRul" readonly @click="crp = true"/>
                <q-dialog v-model="crp" persistent>
                  <q-card style="min-width: 350px">
                    <q-card-section>
                      <div class="text-h6">Nama Customer</div>
                    </q-card-section>
                    <q-card-section class="q-pt-none">
                      <cariPartner @dtPartner="partner" :pil="false"/>
                    </q-card-section>
                    <q-card-actions align="right" class="text-primary">
                      <q-btn outline push label="Tutup" v-close-popup />
                    </q-card-actions>
                  </q-card>
                </q-dialog>
                <q-chip color="teal" class="text-white">Total Kirim : {{ detPR.reduce((a, b) => a + Number(b.qty), 0) }}</q-chip>
              </template>
              <template v-slot:body="props">
                <q-tr :props="props">
                  <q-td key="kodeProduk" :props="props">
                    {{ props.row.kodeProduk }}
                  </q-td>
                  <q-td key="namaBarang" :props="props">
                    {{ props.row.namaBarang }}
                  </q-td>
                  <q-td key="stok" :props="props">
                    {{ props.row.saldo }}
                  </q-td>
                  <q-td key="qty" :props="props" align="right">
                    <q-chip color="red" outline>{{ props.row.qty }}</q-chip>
                    <q-popup-edit v-model="props.row.qty">
                      <q-input v-model="props.row.newQty" type="number" dense autofocus counter @input="adQty(props.row)"/>
                    </q-popup-edit>
                  </q-td>
                  <q-td key="hargaJual" :props="props" align="right">
                    <q-chip color="red" outline>{{ props.row.hargaJual }}</q-chip>
                    <q-popup-edit v-model="props.row.hargaJual">
                      <q-input v-model="props.row.hargaJual" type="number" dense autofocus counter/>
                    </q-popup-edit>
                  </q-td>
                  <q-td key="act"  :props="props">
                    <q-icon name="close" color="red" @click="ondel(props.row)" />
                  </q-td>
                </q-tr>
              </template>
            </q-table>
            <div align="right">
              <q-btn label="Kirim" type="submit" outline push color="primary" class="shadow-3"/>
              <q-btn label="Reset" type="reset" outline push color="accent" class="q-ml-sm shadow-3" />
            </div>
          </q-form>
        </q-card-section>
        <produk @dtStok="onpil"/>
      </q-card>
    </q-dialog>
    <q-dialog
      v-model="rKong"
      seamless position="bottom" full-width
      >
      <q-card>
        <q-card-section>
          <div class="text-h6">Tarik Stok Kongsi</div>
          <q-separator color="accent" spaced/>
          <q-btn dense icon="close" color="accent" class="absolute-top-right" v-close-popup/>
        </q-card-section>
        <q-card-section>
          <q-form
            @submit="addKO(pr)"
            @reset="onReset"
            class="q-gutter-md">
            <q-table
              class="detPR"
              :data="detPR"
              :columns="jdld"
              row-key="kodeProduk"
              dense>
              <template v-slot:top>
                <div class="col-4 q-table__title">Detail Barang</div>
                <q-input dense v-model="pr.tglKirim" label="Tanggal Tarik" readonly>
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                        <q-date v-model="pr.tglKirim" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
                <q-input :value="pr.namaPartner" class="q-ml-md" label="Customer" dense lazy-rules :rules="inRul" readonly />
                <q-chip color="teal" class="text-white">Total Kirim : {{ detPR.reduce((a, b) => a + Number(b.qty), 0) }}</q-chip>
              </template>
              <template v-slot:body="props">
                <q-tr :props="props">
                  <q-td key="kodeProduk" :props="props">
                    {{ props.row.kodeProduk }}
                  </q-td>
                  <q-td key="namaBarang" :props="props">
                    {{ props.row.namaBarang }}
                  </q-td>
                  <q-td key="stok" :props="props">
                    {{ props.row.saldo }}
                  </q-td>
                  <q-td key="qty" :props="props" align="right">
                    <q-chip color="red" outline>{{ props.row.qty }}</q-chip>
                    <q-popup-edit v-model="props.row.qty">
                      <q-input v-model="props.row.newQty" type="number" dense autofocus counter @input="adQty(props.row)"/>
                    </q-popup-edit>
                  </q-td>
                  <q-td key="hargaJual" :props="props" align="right">
                    <q-chip color="red" outline>{{ props.row.hargaJual }}</q-chip>
                    <q-popup-edit v-model="props.row.hargaJual">
                      <q-input v-model="props.row.hargaJual" type="number" dense autofocus counter/>
                    </q-popup-edit>
                  </q-td>
                  <q-td key="act"  :props="props">
                    <q-icon name="close" color="red" @click="ondel(props.row)" />
                  </q-td>
                </q-tr>
              </template>
            </q-table>
            <div align="right">
              <q-btn label="Tarik" type="submit" outline push color="primary" class="shadow-3"/>
              <q-btn label="Reset" type="reset" outline push color="accent" class="q-ml-sm shadow-3" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog v-model="tk" full-width seamless position="bottom">
      <q-card>
        <q-card-section>
          <div class="col-xs-12 col-md-4 q-table__title">Data Surat Jalan Kongsi</div>
          <q-btn dense icon="close" color="accent" class="absolute-top-right" v-close-popup/>
          <q-separator spaced color="accent"/>
          <q-table
            class="dataTrx"
            :data="trxKongsi"
            :columns="jdlT"
            row-key="nomorKongsi"
            :pagination.sync="hal"
            :filter="cariT"
            dense>
            <template v-slot:body="props">
            <q-tr :props="props" :class="props.expand && 'bg-red-2'">
              <q-td
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
              >
                <template v-if="col.name === 'nom'">
                  <q-icon size="sm" color="accent" dense @click="getdetTrx(props.row, props.expand),props.expand = !props.expand" :name="props.expand ? 'expand_less' : 'expand_more'" />
                  {{ props.rowIndex + 1}}
                </template>
                <template v-else-if="col.jml === 'Y'">
                  {{ col.value | duit }}
                </template>
                <template v-else-if="col.name === 'act'">
                  <q-btn dense icon="print" color="cyan" outline @click="printW(props.row)"/>
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
                  :data="detKongsi.filter(a => a.nomorKongsi === props.row.nomorKongsi)"
                  :columns="jdle"
                  row-key="kodeProduk"
                  separator="cell"
                  :pagination.sync="hald"
                  dense>
                  <template v-slot:body="props">
                    <q-tr :props="props">
                      <q-td class="text-right" auto-width>
                        {{ detKongsi.filter(a => a.nomorKongsi === props.row.nomorKongsi).indexOf(props.row) + 1 }}
                      </q-td>
                      <q-td key="kodeProduk" :props="props" auto-width>
                        {{ props.row.kodeProduk }}
                      </q-td>
                      <q-td key="namaBarang" :props="props">
                        {{ props.row.namaBarang }}
                      </q-td>
                      <q-td key="hargaJual" :props="props">
                        {{ props.row.hargaJual | duit }}
                      </q-td>
                      <q-td key="qty" :props="props">
                        {{ props.row.qty | nomer }}
                      </q-td>
                      <q-td key="jmlHarga" :props="props">
                        {{ props.row.hargaJual * props.row.qty  | duit }}
                      </q-td>
                    </q-tr>
                  </template>
                  <template v-slot:bottom-row>
                    <q-tr>
                      <q-th colspan="5" class="text-right">Total Harga</q-th>
                      <q-th align="right">{{ detKongsi.filter(a => a.nomorKongsi === props.row.nomorKongsi).reduce((a, b) => a + (b.hargaJual * b.qty), 0) | duit }}</q-th>
                    </q-tr>
                  </template>
                </q-table>
              </q-td>
            </q-tr>
          </template>
          </q-table>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { computed, reactive, toRefs } from '@vue/composition-api'
import produk from '../components/stok'
import cariPartner from '../components/cariPartner'
import { addKongsi, dataKongsi, detKongsi, dtCab, rkpKongsi } from '../services/apiList'
export default {
  components: {
    produk,
    cariPartner
  },
  setup (props, { root, emit }) {
    const dt = reactive({
      adP: false,
      jdl: [
        { name: 'nom', label: 'No', align: 'left' },
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left' },
        { name: 'namaPartner', label: 'Nama Partner', field: row => row.namaPartner, align: 'left' },
        { name: 'hargaJual', label: 'Harga', field: row => row.hargaJual, jml: 'Y', align: 'right' },
        { name: 'jmlQty', label: 'Jumlah Qty', field: row => row.jmlQty, jml: 'Y', align: 'right' },
        { name: 'kirim', label: 'Qty Terpakai', field: row => row.kirim, jml: 'Y', align: 'right' },
        { name: 'sisa', label: 'Qty Sisa', field: row => row.sisa, jml: 'Y', align: 'right' },
        { name: 'act', label: 'Act' }
      ],
      dtKongsi: [],
      cari: '',
      detPR: [],
      jdld: [
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left' },
        { name: 'stok', label: 'Stok', field: row => row.stok, jml: 'Y', align: 'right' },
        { name: 'qty', label: 'Qty Kirim', field: row => row.qty, jml: 'Y', align: 'right' },
        { name: 'hargaJual', label: 'Harga Jual', field: row => row.hargaJual, jml: 'Y', align: 'right' },
        { name: 'hpp', label: 'HPP', field: row => row.hpp, jml: 'Y', align: 'right' },
        { name: 'act', label: 'Act' }
      ],
      pr: {
        tglRequest: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        ac: 'N',
        cabLain: '',
        kodePartner: '',
        namaCabang: '',
        alamatCabang: '' },
      hal: { rowsPerPage: 10 },
      cust: { namaPartner: '', alamat: '' },
      crp: false,
      cabAll: [],
      selected: [],
      inRul: [ v => !!v || 'Isi data' ],
      filt: {
        kodeCab: root.$store.state.auth.user.kodeCab,
        partner: ''
      },
      trxKongsi: [],
      detKongsi: [],
      tk: false,
      cariT: '',
      jdlT: [
        { name: 'nom', label: 'No', align: 'left' },
        { name: 'nomorKongsi', label: 'Nomor Surat Jalan', field: row => row.nomorKongsi, align: 'left' },
        { name: 'tglKirim', label: 'Tgl Kirim', field: row => row.tglKirim, align: 'left' },
        { name: 'namaPartner', label: 'Nama Partner', field: row => row.namaPartner, align: 'left' },
        { name: 'status', label: 'Status', field: row => row.status },
        { name: 'act', label: 'Act' }
      ],
      jdle: [
        { name: 'nom', label: 'No', align: 'left' },
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left' },
        { name: 'hargaJual', label: 'Harga', field: row => row.hargaJual, format: row => row.toLocaleString(), jml: 'Y', align: 'right' },
        { name: 'qty', label: 'Qty', field: row => row.qty, jml: 'Y', align: 'right' },
        { name: 'jmlHarga', label: 'Jumlah Harga', field: row => row.jmlHarga, format: row => row.toLocaleString(), jml: 'Y', align: 'right' }
      ],
      hald: { rowsPerPage: 0 },
      perPartner: false,
      dtPartner: [],
      rKong: false
    })
    dtCab().then(res => {
      dt.cabAll = res.data
    })
    const adQty = (x) => {
      x.qty = x.newQty
    }
    const onReset = () => {
      dt.pr = { tglKirim: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10) }
      dt.detPR = []
      dt.cust = { namaPartner: '', alamat: '' }
    }
    const addKO = (x) => {
      if (dt.detPR.every(a => a.qty !== 0 || a.qty !== null)) {
        addKongsi({ hd: x, det: dt.detPR })
          .then(res => {
            onReset()
            getKongsi()
            root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
          })
          .catch((err) => {
            console.log(err)
            root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
          })
      } else {
        root.$q.notify({ message: `isi detail dan qty dulu...`, color: 'purple' })
      }
    }
    const onpil = (x) => {
      let ada = dt.detPR.map(a => a.kodeProduk)
      let ax = x.filter(a => ada.every(s => s !== a.kodeProduk))
      if (ax.length) {
        let sx = { ...ax[0] }
        sx.hargaJual = sx.hargaRetail
        dt.detPR.push(sx)
      }
    }
    const ambil = (y) => {
      emit('ambil', y)
      root.$q.notify({ message: `${y.namaBarang} terpilih...`, color: 'teal' })
    }
    const ondel = (item) => {
      const index = dt.detPR.indexOf(item)
      let cf = confirm(`Hapus ${item.kodeProduk} ?`)
      if (cf) {
        dt.detPR.splice(index, 1)
      }
    }
    const partner = (x) => {
      dt.cust = x
      dt.pr.kodePartner = x.kodePartner
    }
    const totalPesanan = computed(() => {
      let x = {
        jmlHarga: dt.detPR.reduce((a, b) => root.$dwn.jumlah([a, b.qty * b.hargaJual]), 0)
      }
      return x
    })
    const getKongsi = () => {
      rkpKongsi(dt.filt)
        .then(({ data }) => {
          dt.dtKongsi = data.map(a => {
            a.sisa = root.$dwn.jumlah([a.jmlQty, -a.kirim])
            return a
          })
          dt.dtPartner = [...new Set(data.map(a => a.namaPartner))]
        })
    }
    getKongsi()
    const sjlKongsi = () => {
      dt.trxKongsi = []
      dataKongsi(dt.filt)
        .then(({ data }) => {
          dt.trxKongsi = data
          dt.tk = true
        })
    }
    const getdetTrx = (x, y) => {
      if (!y) {
        dt.detKongsi.forEach((a, b, c) => {
          if (a.nomorKongsi === x.nomorKongsi) {
            c.splice(b)
          }
        })
        detKongsi(x.nomorKongsi)
          .then(({ data }) => {
            dt.detKongsi.push(...data)
          })
          .catch((err) => {
            console.log(err)
            root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
          })
      }
    }
    const printW = async (x) => {
      let detail = await detKongsi(x.nomorKongsi)
      let tqty = detail.data.reduce((a, b) => root.$dwn.jumlah([a, b.qty]), 0)
      let wd = window.open('', 'SuratJalanKongsi', 'resize = 1')
      let html = `<html>
        <title>Cetak Surat Jalan Kongsi ${x.nomorKongsi}</title>
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
                      <img src="/statics/logo/${x.cabID}.png" alt="" style="width:8%">
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <b>${dt.cabAll.find(s => s.kodeCab === x.cabID).namaCabang.toUpperCase()}</b>
                    </td>
                  </tr>
                  <tr>
                    <td st>
                      <b>${dt.cabAll.find(s => s.kodeCab === x.cabID).alamatCabang}</b>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <b>${dt.cabAll.find(s => s.kodeCab === x.cabID).telp || ''}</b>
                    </td>
                  </tr>
                </table>
              </td>
              <td align='right'>
                <table width="100%" >
                  <tr>
                    <td colspan="4">
                      <b><i>CUSTOMER</i></b>
                    </td>
                  </tr>
                  <tr>
                    <td width='100%' colspan="4">${x.namaPartner}</td>
                  </tr>
                  <tr>
                    <td width='100%' colspan="4">
                      ${x.alamat || ''}
                    </td>
                  </tr>

                  <tr>
                    <td width='100%' colspan="4">${x.tlp || ''}</td>
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
                        <b>Dokumen Pengiriman <br/> #${x.nomorKongsi}</b>
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
                  <tr>
                    <th>Deskripsi Barang</th>
                    <th width='10%' style="text-align: right">Quatity</th>
                  </tr>
                  </thead>`
      let dtDet = ''
      detail.data.forEach((det, i) => {
        dtDet += `<tr>
          <td>${(i + 1).toString().padStart(3, ' ')}. ${det.namaBarang}</td>
          <td style="text-align: right">${new Intl.NumberFormat('en').format(Number(det.qty).toFixed(2))}</td>
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
                        <td width='60%' align='right' colSpan="2"><b>Jumlah Produk</b></td>
                        <td width='50%' align='center'><b>${new Intl.NumberFormat('en').format(Number(tqty).toFixed(2))}</b></td>
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
                      (${x.namaKaryawan || root.$store.state.auth.user.nama})
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
          <tr>
            <td>Catatan : ${x.note || ''}</td>
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
          <button type=button onclick='window.print();'>Cetak Surat Jalan ${x.nomorKongsi}</button>
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
    const dtKongsik = computed(() => {
      const aa = dt.perPartner ? dt.dtKongsi.filter(s => dt.filt.partner === s.namaPartner) : dt.dtKongsi
      return aa
    })
    const tarik = (x) => {
      if (dt.pr.kodePartner === x.kodePartner) {
        adDetko(x)
      } else {
        dt.pr = { ...x }
        dt.detPR = []
        adDetko(x)
        dt.rKong = true
      }
    }
    const adDetko = (x) => {
      let a = dt.detPR.find(s => s.kodeProduk === x.kodeProduk)
      if (a) {
        root.$q.notify({ message: `Produk ${x.namaBarang} sudah di list... `, color: 'orange' })
      } else {
        dt.detPR.push({ ...x, qty: -x.sisa })
      }
    }
    return { ...toRefs(dt), tarik, adQty, addKO, onReset, onpil, ambil, ondel, partner, totalPesanan, getKongsi, sjlKongsi, getdetTrx, printW, dtKongsik }
  }
}
</script>
