<template>
  <q-card>
    <q-card-section>
      <q-form
        @submit="addJB(jd)"
        @reset="onReset"
        class="q-gutter-md">
        <q-table
          class="dataPR"
          :data="detTrxr"
          :columns="jdld"
          row-key="kodeProduk"
          :pagination.sync="pagination"
          dense
          separator="cell">
          <template v-slot:top>
            <q-toolbar>
              <div class="col-4 q-table__title">{{ jenis.label }} Barang</div>
              <q-space/>
              <q-toggle
                :value="prr.ac"
                color="orange"
                keep-color
                false-value="N"
                true-value="Y"
                checked-icon="check"
                label="Antar Cabang"
                unchecked-icon="clear"
              />
            </q-toolbar>
            <div class="row q-gutter-sm justify-between" >
              <div class="col-xs-6 col-sm-4 col-md-3">
                <q-input filled v-model="jd.tgl" label="Tanggal" dense lazy-rules :rules="inRul" readonly>
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy v-if="['MAN','acc','mitra'].some(a=> a== $store.state.auth.user.userType)" ref="qDateProxy" transition-show="scale" transition-hide="scale">
                        <q-date v-model="jd.tgl" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              <div class="col-xs-6 col-sm-4 col-md-3" v-if="pr.ac==='N'">
                <q-input :value="prr.namaPartner" dense lazy-rules readonly/>
              </div>
              <div class="col-xs-6 col-sm-4 col-md-3">
                <q-input :value="jd.noBukti" dense lazy-rules readonly/>
              </div>
              <div class="col-xs-6 col-sm-4 col-md-3">
                <q-chip>Akun Bayar : {{ prr.akunBayar }}</q-chip>
                <q-select
                  v-if="detTrxr.length > 0 && detTrxr[0].status === 'L'"
                  filled
                  v-model="prr.akunBayar"
                  use-input
                  dense
                  options-dense
                  input-debounce="0"
                  label="Pilih Akun Pembayaran"
                  :options="akunCOA"
                  :option-label="(item) => item && item.kodeAkun + ' ' + item.namaAkun"
                  option-value="kodeAkun"
                  map-options
                  emit-value
                  :rules="inRul"
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
              </div>
              <div class="col-xs-6 col-sm-4 col-md-3">
                <q-chip>Nomor Jurnal : {{ detTrxr.length> 0 && detTrxr[0].nomorJurnal }}</q-chip>
                <q-chip>Status Pembayaran : {{ detTrxr.length> 0 && detTrxr[0].status }}</q-chip>
              </div>
            </div>
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td>
                {{ detTrx.indexOf(props.row) +1 }}
              </q-td>
              <q-td key="kodeProduk" :props="props">
                {{ props.row.kodeProduk }}
              </q-td>
              <q-td key="namaBarang" :props="props">
                {{ props.row.namaBarang }}
              </q-td>
              <q-td key="stok" :props="props">
                {{ props.row.stok }}
              </q-td>
              <q-td key="qty" :props="props">
                {{ props.row.qty }}
                <q-popup-edit v-model="props.row.qty">
                  <q-input v-model="props.row.qty" dense autofocus counter @input="onSave(props.row)"/>
                </q-popup-edit>
              </q-td>
              <template v-if="['MAN','purchase'].some(a=> a== $store.state.auth.user.userType) || prr.jnsTrx==='J'">
                <q-td key="hargaSat" :props="props">
                  {{ props.row.hargaSat | duit }}
                </q-td>
                <q-td key="dpp" :props="props">
                  {{ props.row.dpp | duit }}
                </q-td>
                <q-td key="ppn" :props="props">
                  {{ props.row.ppn | duit }}
                </q-td>
              </template>
              <q-td key="act" :props="props">
                <q-icon name="close" color="red" @click="ondel(props.row)" />
              </q-td>
            </q-tr>
          </template>
          <template
            v-if="['MAN','purchase','acc'].some(a=> a== $store.state.auth.user.userType) || prr.jnsTrx==='J'"
            v-slot:bottom-row>
            <q-tr>
              <q-td colspan="5" align="right">Jumlah DPP</q-td>
              <q-td align="right"  colspan="2">{{ totalAll.tdpp | duit }}</q-td>
            </q-tr>
            <q-tr>
              <q-td colspan="5" align="right">Jumlah PPN</q-td>
              <q-td align="right"  colspan="2">{{ totalAll.tppn | duit }}</q-td>
            </q-tr>
            <q-tr>
              <q-td colspan="5" align="right">Total harga</q-td>
              <q-td align="right" colspan="2">{{ $dwn.jumlah([totalAll.tharga,exp.biaya]) | duit }}</q-td>
            </q-tr>
          </template>
        </q-table>
        <div align="right">
          <q-btn label="Retur" type="submit" color="primary"/>
          <q-btn label="Close" type="reset" color="primary" flat class="q-ml-sm" />
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script>
import { exPartner, detPR, cekStok, addJB, accRek } from '../../services/apiList'
export default {
  // name: 'PageName',
  props: {
    jnsTrx: {
      type: String,
      default: function () {
        return 'RJ'
      }
    },
    status: {
      type: String,
      default: function () {
        return 'T'
      }
    },
    pr: {
      type: Object,
      default: function () {
        return {
          tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
          jnsTrx: 'J',
          ct: 'tempo',
          ac: false,
          cabLain: '',
          tempo: '0',
          kurir: 'N',
          ongkir: 0,
          akunBayar: ''
        }
      }
    },
    detTrx: {
      type: Array,
      default: function () {
        return []
      }
    }
  },
  data () {
    return {
      prr: { ...this.pr },
      detTrxr: [ ...this.detTrx ],
      jd: {
        tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        noBukti: this.pr.nomorBukti
      },
      inRul: [ v => !!v || 'Isi data' ],
      selected: [],
      cari: '',
      expedisi: [],
      exp: { partnerID: null, biaya: 0 },
      pagination: {
        rowsPerPage: 15
      },
      ad: {},
      pil: false,
      dtpil: {},
      akunCOA: []
    }
  },
  watch: {
    selected: function (v) {
      let e = Object.assign({}, v[0])
      this.$emit('dtBrg', e)
      this.getdetPR(e)
    }
  },
  computed: {
    judulTransaksi () {
      return `Retur dari transaksi ${this.pr.jnsTrx === 'J' ? 'Penjualan' : 'Pembelian'} ${this.pr.nomorBukti}`
    },
    jdld () {
      let a = [
        { name: 'No', label: 'No', field: row => row.index, align: 'right' },
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left' },
        { name: 'stok', label: 'Tersedia', field: row => row.stok, jml: 'Y', align: 'right' },
        { name: 'qty', label: 'Qty', field: row => row.qty, jml: 'Y', align: 'right' },
        { name: 'hargaSat', label: 'harga @', field: row => row.hargaSat, jml: 'Y', align: 'right' },
        // { name: 'hpp', label: 'hpp', field: row => row.hpp, align: 'right' },
        { name: 'dpp', label: 'DPP', field: row => row.dpp, jml: 'Y', align: 'right' },
        { name: 'ppn', label: 'PPN', field: row => row.ppn, jml: 'Y', align: 'right' },
        { name: 'act', label: 'Act' }
      ]
      /* let b = ['MAN', 'purchase'].some(a => a === this.$store.state.auth.user.userType) || this.pr.jnsTrx === 'J' ? a.splice(-1) : a.splice(4, 3)
      console.log(b) */
      return a
    },
    crByr () {
      let user = this.$store.getters['auth/user']
      let x = user.userType === 'sales' ? [{ label: 'Cash Sales', value: 'sales' }, { label: 'Tempo', value: 'tempo' }]
        : [{ label: 'Cash Sales', value: 'sales' }, { label: 'Cash Toko', value: 'admin' }, { label: 'Tempo', value: 'tempo' }]
      return x
    },
    jenis () {
      let x = {}
      x.label = this.pr.jnsTrx === 'J' ? 'Retur Penjualan' : 'Retur Pembelian'
      x.value = 'R' + this.pr.jnsTrx
      return x
    },
    totalHarga () {
      return this.detTrxr.reduce((a, b) => {
        return this.$dwn.jumlah([a, b.jmlHarga, b.ppn])
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
    }
  },
  mounted () {
    accRek()
      .then(({ data }) => {
        this.akunCOA = data.filter(a => a.JB === 'Y')
      })
  },
  methods: {
    exPartner () {
      exPartner()
        .then(res => {
          this.expedisi = res.data
        })
    },
    addJB (y) {
      let x = { ...this.pr, ...y }
      x.status = 'W'
      x.pot = 'N'
      x.jnsTrx = 'R' + this.pr.jnsTrx
      x.total = this.$dwn.jumlah([this.totalAll.tharga, this.exp.biaya])
      x.judulTransaksi = this.judulTransaksi
      if (this.detTrxr.length > 0 && !this.detTrxr.some(a => a.qty === 0)) {
        addJB({ hd: x, det: this.detTrxr, exp: this.exp })
          .then(res => {
            this.onReset()
            this.$q.notify({ message: `${res.data.st}`, color: 'teal' })
          })
          .catch((err) => {
            console.log(err)
            this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
          })
      } else {
        this.$q.notify({ message: 'isi data dulu...', color: 'purple' })
      }
    },
    getdetPR (x) {
      detPR(x)
        .then(res => {
          this.detPR = res.data
        })
        .catch((err) => {
          console.log(err)
          this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    },
    onReset () {
      //      this.pr = { tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), jnsTrx: 'J', ct: 'sales', ac: false, cabLain: '' }
      this.$emit('ttp')
      this.exp = {}
    },
    cekStok (x) {
      this.pil = true
      cekStok(x.kodeProduk)
        .then(res => {
          x.stok = res.data[0].saldo
          x.qty = 0
          x.hargaSat = x.price3 > x.hpp ? x.price3 : x.hpp
          this.dtpil = x
          // this.onpil(x)
        })
        .catch((err) => {
          console.log(err)
          this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    },
    onpil (x) {
      if (x.kodeProduk) {
        let y = {}
        y.akunPersediaan = x.akunPersediaan
        y.akunBiaya = x.akunBiaya
        y.akunHpp = x.akunHpp
        y.kodeCat = x.kodeCat
        y.kodeProduk = x.kodeProduk
        y.namaProduk = x.namaBarang
        y.stok = x.stok
        y.price1 = x.hpp
        y.hargaSat = x.hargaSat
        y.qty = x.qty ? x.qty : 0
        y.expedisi = 0
        y.jmlHarga = this.$dwn.kali([y.qty, y.hargaSat])
        y.ppn = this.$dwn.kali([y.qty, y.hargaSat, 0.1])
        y.dpp = this.$dwn.kali([y.qty, y.hargaSat])
        this.ad = y
        //  this.adBar = true
        this.detTrxr.push(y)
      }
    },
    onSave (x) {
      if (x.kodeProduk) {
        if (x.qty > x.stok) {
          x.qty = x.stok
          //          x.hargaSat = x.hargaSat > x.hpp ? x.hargaSat : x.hpp
          this.$q.notify({ message: `stok hanya tersedia ${x.stok}`, color: 'purple' })
        }
        x.jmlHarga = this.$dwn.kali([x.qty, x.hargaSat])
        x.dpp = this.$dwn.kali([x.tdpp, x.qty])
        x.ppn = this.$dwn.kali([x.tppn, x.qty])
        x.hpp = this.$dwn.kali([x.thpp, x.qty])
      }
    },
    ondel (item) {
      const index = this.detTrx.indexOf(item)
      let cf = confirm(`Hapus ${item.kodeProduk} ?`)
      if (cf) {
        this.detTrxr.splice(index, 1)
        /* if (item.iddetPR) {
          api.delPRd(item)
            .then(res => this.$q.notify({ message: 'Data tersimpan', color: 'success' }))
            .catch(err => this.$q.notify({ message: 'Gagal simpan...' }))
        } */
      }
    }
  }
}
</script>
