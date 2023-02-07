<template>
  <q-card>
    <q-card-section class="row justify-between">
      <q-chip color="blue-6" class="text-white text-bold shadow-3" clickable>Periode : {{ tgl && tgl.from ? tgl.from + ' ~ ' + tgl.to : tgl }}
        <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
          <q-date range v-model="tgl" @input="(x) => x && (lihat(),$refs.qDateProxy.hide())" mask="YYYY-MM-DD" lazy-rules/>
        </q-popup-proxy>
      </q-chip>
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
        v-model="filt.kodeCab"
        :options="cabAll.filter(a => divisi === a.compCode)"
        :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
        option-value="kodeCab"
        option-dense
        emit-value
        map-options
        multiple
        style="min-width: 250px; max-width: 550px"
        label="Pilih cabang... "
        dense
        @input="lihat()"
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
              <q-checkbox v-model="filt.kodeCab" :val="scope.opt.kodeCab" @input="lihat()"/>
            </q-item-section>
          </q-item>
        </template>
        <template v-slot:selected>
          {{ filt.kodeCab.length }} cabang
        </template>
      </q-select>
      <q-toggle v-model="filt.allCab" label="Pilih semua..." @input="gantiCab(filt.allCab)"/>
      <q-toggle v-model="filt.ancab" label="Antar Cabang" @input="lihat"/>
    </q-card-section>
    <q-separator color="teal-5" spaced/>
    <q-card-section>
      <q-table
        :grid="$q.screen.lt.md"
        title="Report Pembelian Detail"
        :data="rekapBy"
        :columns="jdlrk"
        :filter="carik"
        row-key="nama"
        dense>
        <template v-slot:top>
          <div class="row no-wrap items-center">
            <span class="text-h6 q-ml-md">Rekap Pembelian </span>
            <div class="q-gutter-sm">
              <q-radio v-model="jnsRkp" val="namaPemasok" label="Partner" color="pink-3" />
              <q-radio v-model="jnsRkp" val="kategoriProduk" label="Kategori Produk" color="yellow-3" />
              <q-radio v-model="jnsRkp" val="kodeProduk" label="Produk" color="teal-3" />
              <q-radio v-model="jnsRkp" val="nomorBukti" label="Nomor Bukti" color="teal-3" />
            </div>
            <q-input class="q-ml-md" borderless dense debounce="300" v-model="carik" placeholder="Search">
              <template v-slot:append>
                <q-icon name="search" />
                <q-btn
                  flat round dense
                  icon="file_download"
                  @click="toDown(rekapBy, jdlrk)"
                  class="q-ml-md"
                  color="primary"
                />
              </template>
            </q-input>
          </div>
        </template>
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td auto-width>
              <q-toggle v-model="props.expand" checked-icon="add" unchecked-icon="remove" />
              {{ props.rowIndex + 1}}
            </q-td>
            <q-td>{{ props.row.nama }}</q-td>
            <q-td align="right">{{ props.row.qty | duit }}</q-td>
            <q-td align="right">{{ props.row.jmlHarga | duit }}</q-td>
          </q-tr>
          <q-tr v-show="props.expand" :props="props" :key="`e_${props.rowIndex}`" class="q-virtual-scroll--with-prev">
            <q-td colspan="100%">
              <q-table
                class="detTrx"
                :data="allTransaksi.filter(a => a[filtBy.value] === props.row.key)"
                :columns="jdld"
                separator="cell"
                dense/>
            </q-td>
          </q-tr>
        </template>
        <template v-slot:bottom-row>
          <q-tr class="bg-teal-13">
            <q-th align="right" colSpan="2">Total</q-th>
            <q-th align="right">{{ allTransaksi.reduce((a, b) => a + b.qty, 0) | duit }}</q-th>
            <q-th align="right">{{ allTransaksi.reduce((a, b) => a + b.jmlHarga, 0) | duit }}</q-th>
          </q-tr>
        </template>
      </q-table>
    </q-card-section>
    <q-card-section>
      <pivotUI
        :dataTable="allTransaksi"
        :dtPivot="dtPivot"
        judul="Laporan Pembelian"
      />
    </q-card-section>
    <q-card-section>
      <q-dialog v-model="grafik">
        <radarChart :chartId="chartId" :dataChart="dataChart"/>
      </q-dialog>
    </q-card-section>
  </q-card>
</template>

<script>
import pivotUI from '../chart/pivotData'
import radarChart from '../chart/radarChart'
import { dtCab, rkpTransaksi, company } from '../../services/apiList'
import { computed, onMounted, reactive, toRefs, watch } from '@vue/composition-api'
export default {
  components: {
    radarChart,
    pivotUI
  },
  setup (props, { root, emit }) {
    const dt = reactive({
      dtPivot: {
        rows: ['namaPemasok'],
        cols: ['namaCabang'],
        vals: ['jmlHarga']
      },
      grafik: false,
      chartId: {
        judul: 'Laporan Sales per Kategori Produk',
        id: 'radar'
      },
      sales: [],
      dtSales: [],
      jdl: [
        { name: 'namaKaryawan', label: 'Nama Karyawan', field: row => row.namaKaryawan, align: 'left' },
        { name: 'kategoriProduk', label: 'Kategori Produk', field: row => row.kategoriProduk, align: 'left' },
        { name: 'qty', label: 'Qty Sales', field: row => row.qty, jml: 'Y', align: 'right' },
        { name: 'hpp', label: 'Nilai HPP', field: row => row.hpp, format: val => new Intl.NumberFormat('en-ID', { style: 'currency', currency: 'IDR' }).format(val), jml: 'Y', align: 'right' },
        { name: 'jmlHarga', label: 'Jumlah Harga', field: row => row.jmlHarga, format: val => new Intl.NumberFormat('en-ID', { style: 'currency', currency: 'IDR' }).format(val), jml: 'Y', align: 'right' }
      ],
      jdlrb: [
        { name: 'namaKaryawan', label: 'Nama Karyawan', field: row => row.namaKaryawan, align: 'left' },
        { name: 'kategoriProduk', label: 'Kategori Produk', field: row => row.kategoriProduk, align: 'left' },
        { name: 'qty', label: 'Qty Sales', field: row => row.qty, jml: 'Y', align: 'right' },
        { name: 'hpp', label: 'Nilai HPP', field: row => row.hpp, format: val => new Intl.NumberFormat('en-ID', { style: 'currency', currency: 'IDR' }).format(val), jml: 'Y', align: 'right' },
        { name: 'jmlHarga', label: 'Jumlah Harga', field: row => row.jmlHarga, format: val => new Intl.NumberFormat('en-ID', { style: 'currency', currency: 'IDR' }).format(val), jml: 'Y', align: 'right' }
      ],
      jdlrk: [
        { name: 'No', label: 'No', field: row => row.No, align: 'left' },
        { name: 'nama', label: 'Nama', field: row => row.nama, align: 'left', sortable: true },
        { name: 'qty', label: 'Qty Sales', field: row => row.qty, jml: 'Y', align: 'right', sortable: true },
        { name: 'jmlHarga', label: 'Jumlah Harga', field: row => row.jmlHarga, sortable: true, format: val => new Intl.NumberFormat('en-ID', { style: 'currency', currency: 'IDR' }).format(val), jml: 'Y', align: 'right' }
      ],
      filt: {
        kodeCab: [],
        tgla: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        allCab: false,
        ancab: false
      },
      divCab: [],
      divisi: '',
      dtComp: [],
      tgl: {
        from: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        to: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
      },
      inRul: [ v => !!v || 'Isi data' ],
      cari: '',
      rowFields: [
        {
          getter: item => item.namaKaryawan,
          label: 'namaKaryawan'
        }

      ],
      colFields: [{
        getter: item => item.kategoriProduk,
        label: 'kategoriProduk'
      }],
      reducer: (sum, item) => sum + item.jmlHarga,
      defaultShowSettings: true,
      isDataLoading: false,
      cabAll: [],
      rekapSls: true,
      allTransaksi: [],
      jdld: [
        { name: 'namaKaryawan', label: 'Nama Sales', field: row => row.namaKaryawan, sortable: true, align: 'left' },
        { name: 'nomorBukti', label: 'Nomor Bukti', field: row => row.nomorBukti, sortable: true, align: 'left' },
        { name: 'tglKirim', label: 'Tanggal Kirim', field: row => row.tglKirim, sortable: true, align: 'left' },
        { name: 'namaPemasok', label: 'Nama Supplier', field: row => row.namaPemasok, sortable: true, align: 'left' },
        { name: 'kategoriProduk', label: 'Kategori Produk', field: row => row.kategoriProduk, sortable: true, align: 'left' },
        { name: 'namaMerk', label: 'Merk', field: row => row.namaMerk, sortable: true, align: 'left' },
        { name: 'namaBarang', label: 'Nama Barang', field: row => row.namaBarang, sortable: true, align: 'left' },
        { name: 'qty', label: 'Qty Sales', field: row => row.qty, jml: 'Y', sortable: true, align: 'right' },
        { name: 'jmlHarga', label: 'Nilai Jual', field: row => row.jmlHarga, format: val => new Intl.NumberFormat('en-ID', { style: 'currency', currency: 'IDR' }).format(val), jml: 'Y', sortable: true, align: 'right' }
      ],
      carid: '',
      halaman: { rowsPerPage: 0, sortBy: 'jmlHarga', descending: true },
      jnsRkp: 'namaPemasok',
      pilJnsRkp: [
        { text: 'Partner', value: 'namaPemasok', name: 'namaPemasok' },
        { text: 'Kategori Produk', value: 'kategoriProduk', name: 'kategoriProduk' },
        { text: 'Produk', value: 'kodeProduk', name: 'namaBarang' },
        { text: 'Nomor Bukti', value: 'nomorBukti', name: 'nomorBukti' }
      ],
      carik: '',
      filtBy: { text: 'Partner', value: 'namaPemasok', name: 'namaPemasok' }
    })
    const rekapBy = computed(() => {
      let filt = dt.filtBy
      let perBy = [ ...new Set(dt.allTransaksi.map(a => a[filt.value])) ]
      let a = []
      if (dt.allTransaksi.length) {
        for (let i in perBy) {
          let s = {
            key: perBy[i],
            nama: dt.allTransaksi.find(c => c[filt.value] === perBy[i])[filt.name],
            qty: dt.allTransaksi.filter(c => c[filt.value] === perBy[i]).reduce((c, d) => c + d.qty, 0),
            jmlHarga: dt.allTransaksi.filter(c => c[filt.value] === perBy[i]).reduce((c, d) => c + d.jmlHarga, 0)
          }
          a.push(s)
        }
      }
      return a
    })
    const detailTrx = () => {
      dt.allTransaksi = []
      let ss = ['MAN', 'acc', 'purchase'].some(a => a === root.$store.state.auth.user.userType)
      dt.filt.tgla = dt.tgl && dt.tgl.from ? dt.tgl.from : dt.tgl || new Date()
      dt.filt.tglb = dt.tgl && dt.tgl.from ? dt.tgl.to : dt.tgl || new Date()
      if (dt.filt.kodeCab.length || !ss) {
        dt.filt.jnsTrx = 'B'
        rkpTransaksi(dt.filt)
          .then(({ data }) => {
            dt.allTransaksi = data.map(a => {
              a.hpp = ['MAN', 'acc', 'purchase', 'mitra'].some(a => a === root.$store.state.auth.user.userType) ? a.hpp : 0
              a.laba = ['MAN', 'acc', 'purchase', 'mitra'].some(a => a === root.$store.state.auth.user.userType) ? root.$dwn.jumlah([a.jmlHarga, -a.jmlHargaR, a.hppR, -a.hpp, -a.pointMember]) : 0
              return a
            })
          })
          .catch(err => {
            console.log(err)
          })
      }
    }
    const toDown = (y, z) => {
      let x = {
        judul: `Laporan Pembelian `,
        dt: y.map((a, i) => {
          a.No = i + 1
          return a
        }),
        hdr: z,
        naFile: `LapPembelian`
      }
      root.$dwn.toExcel(x)
    }
    const lihat = () => {
      detailTrx()
    }
    const gantiCab = (x) => {
      dt.filt.kodeCab = []
      if (x === true) {
        dt.filt.kodeCab = dt.cabAll.filter(a => dt.divisi === a.compCode).map(a => a.kodeCab)
        dt.filt.allCab = true
        lihat()
      } else {
        dt.filt.kodeCab = []
        dt.filt.allCab = false
      }
    }
    watch(() => root.$store.state.auth.setCabang, (val) => {
      dt.filt.kodeCab = [val]
      dt.filt.allCab = false
      dt.divisi = ''
      lihat()
    })
    watch(() => dt.jnsRkp, (val) => {
      dt.filtBy = dt.pilJnsRkp.find(a => a.value === val)
    })
    onMounted(() => {
      dtCab()
        .then(({ data }) => {
          const pegang = root.$store.state.auth.user.cabGrup || root.$q.cookies.get('cabGrup')
          dt.cabAll = data.filter(a => pegang.some(s => s === a.kodeCab))
          let st = new Set(dt.cabAll.map(a => a.compCode))
          dt.divisi = '' // [...st]
          dt.divCab = dt.dtComp.filter(a => st.has(a.compCode))
        })
        .catch(err => {
          console.log(err)
        })
      company()
        .then(({ data }) => {
          dt.dtComp = data
        })
    })
    return { ...toRefs(dt), gantiCab, toDown, lihat, rekapBy }
  },
  computed: {
    dataChart () {
      let label = [...new Set(this.allTransaksi.map(a => a.kategoriProduk))]
      let dts = []
      let ttlQty = this.allTransaksi.reduce((x, y) => this.$dwn.jumlah([x, y.qty]), 0)
      this.filt.kodeCab.forEach(s => {
        let pesn = this.allTransaksi.filter(c => c.kodeCab === s).reduce((x, y) => this.$dwn.jumlah([x, y.qty]), 0) / ttlQty * 225 + 130
        let ab = {
          label: s,
          fill: true,
          backgroundColor: `rgba(${parseInt(pesn)},181,198,0.2)`,
          borderColor: `rgba(${parseInt(pesn)},181,198,1)`,
          pointBorderColor: '#fff',
          data: []
        }
        label.forEach(a => {
          ab.data.push(this.allTransaksi.filter(c => c.kategoriProduk === a && c.kodeCab === s).reduce((d, b) => this.$dwn.jumlah([d, b.qty]), 0))
        })
        dts.push(ab)
      })
      return {
        labels: label,
        datasets: dts
      }
    },
    rkpSales () {
      const sales = this.allTransaksi ? [
        ...new Map(this.allTransaksi.map(obj => [`${obj.salesID}:${obj.namaKaryawan}`, obj])).values()
      ] : []
      let rkp = sales.map(c => {
        let a = { ...c }
        a.kategoriProduk = 'All Produk'
        a.qty = this.allTransaksi.filter(s => s.salesID === a.salesID).reduce((b, c) => this.$dwn.jumlah([b, c.qty]), 0)
        a.jmlHarga = this.allTransaksi.filter(s => s.salesID === a.salesID).reduce((b, c) => this.$dwn.jumlah([b, c.jmlHarga]), 0)
        a.hpp = this.allTransaksi.filter(s => s.salesID === a.salesID).reduce((b, c) => this.$dwn.jumlah([b, c.hpp]), 0)
        a.nilaiPencapaian = this.allTransaksi.filter(s => s.salesID === a.salesID).reduce((b, c) => this.$dwn.jumlah([b, c.nilaiPencapaian]), 0)
        a.pointMember = this.allTransaksi.filter(s => s.salesID === a.salesID).reduce((b, c) => this.$dwn.jumlah([b, c.pointMember]), 0)
        a.cashBack = this.allTransaksi.filter(s => s.salesID === a.salesID).reduce((b, c) => this.$dwn.jumlah([b, c.cashBack]), 0)
        a.laba = this.allTransaksi.filter(s => s.salesID === a.salesID).reduce((b, c) => this.$dwn.jumlah([b, c.laba]), 0)
        return a
      })
      return rkp
    },
    perSales () {
      let x = [...new Set(this.dtSales.map(a => a.salesID))]
      let rkp = []
      x.forEach(aa => {
        let c = this.dtSales.filter(s => s.salesID === aa).map(a => a)
        let baru = {
          salesID: aa,
          kategoriProduk: 'All Produk',
          namaKaryawan: c.length ? c[0].namaKaryawan : '',
          qty: c.reduce((s, ss) => this.$dwn.jumlah([s, ss.qty]), 0),
          jmlHarga: c.reduce((s, ss) => this.$dwn.jumlah([s, ss.jmlHarga]), 0),
          hpp: c.reduce((s, ss) => this.$dwn.jumlah([s, ss.hpp]), 0),
          nilaiPencapaian: c.reduce((s, ss) => this.$dwn.jumlah([s, ss.nilaiPencapaian]), 0),
          pointMember: c.reduce((s, ss) => this.$dwn.jumlah([s, ss.pointMember]), 0),
          cashBack: c.reduce((s, ss) => this.$dwn.jumlah([s, ss.cashBack]), 0),
          laba: c.reduce((s, ss) => this.$dwn.jumlah([s, ss.laba]), 0)
        }
        rkp.push(baru)
      })
      return rkp
    },
    total () {
      let b = this.rekapSls ? this.perSales : this.dtSales
      let a = {
        jmlHarga: b.reduce((x, y) => this.$dwn.jumlah([x, y.jmlHarga]), 0),
        target: 120000000
      }
      return a
    },
    cabAsi () {
      return this.cabAll.filter(a => a.compCode === 'ASI')
    }
  }
}
</script>
<style>
  /* @import 'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css';*/
  table table-bordered{
    border: 1px solid teal;
  }
</style>
