<template>
  <q-card>
    <q-card-section>
      <q-table
        class="detTrx"
        title="Sales Report"
        :data="rekapSls ? perSales : dtSales"
        :columns="jdl"
        :filter="cari"
        :pagination.sync="halaman"
        grid
        hide-header
        hide-bottom
      >
        <template v-slot:top>
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
          <q-input borderless dense debounce="300" v-model="cari" placeholder="Search">
            <template v-slot:append>
              <q-icon name="search" />
              <q-btn
                flat round dense
                icon="file_download"
                @click="toDown((rekapSls ? perSales : dtSales), jdl, 'salesID')"
                class="q-ml-md"
                color="primary"
              />
            </template>
          </q-input>
          <q-toggle
            label="Rekap"
            color="pink"
            v-model="rekapSls"
            keep-color
            readonly class="q-ml-sm"
          />
        </template>
        <template v-slot:item="props">
          <div
            class="q-pa-xs col-xs-12 col-sm-6 col-md-4 col-lg-3 grid-style-transition"
          >
            <q-card>
              <q-card-section
                :style="`background: linear-gradient(to right, transparent,rgba(${200 - props.row.jmlHarga/total.jmlHarga * 225},${props.row.jmlHarga/total.jmlHarga * 255},${props.row.jmlHarga/total.jmlHarga * 125 + 200},0.8))`">
                <q-chip>{{ props.row.namaKaryawan }}</q-chip>
              </q-card-section>
              <q-separator />
              <q-list dense>
                <q-item v-for="col in props.cols.filter(col => col.name !== 'namaKaryawan')" :key="col.name">
                  <q-item-section>
                    <q-item-label>{{ col.label }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label caption>
                      <template v-if="col.jml === 'Y'">
                        <q-chip outline color="primary">{{ col.value | duit }}</q-chip>
                      </template>
                      <template v-else>{{ col.value }}</template>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>
        </template>
      </q-table>
    </q-card-section>
    <q-card-section>
      <q-table
        :grid="$q.screen.lt.md"
        title="Sales Report per Kategori"
        :data="dataSales"
        :columns="jdl"
        :filter="cari"
        dense
        :hide-header="$q.screen.lt.md"
      >
        <template v-slot:top>
          <div class="row no-wrap items-center">
            <span class="text-h6 q-ml-md">Rekap Sales </span>
            <div class="q-gutter-sm">
              <q-radio v-model="jnsRkpSales" val="salesID" label="Sales" color="pink-3" />
              <q-radio v-model="jnsRkpSales" val="kodeCat" label="Kategori Produk" color="yellow-3" />
              <q-radio v-model="jnsRkpSales" val="kodeProduk" label="Produk" color="teal-3" />
            </div>
          </div>
          <q-input borderless dense debounce="300" v-model="cari" placeholder="Search" class="absolute-top-right">
            <template v-slot:append>
              <q-icon name="search" />
              <q-btn
                flat round dense
                icon="file_download"
                @click="toDown(dtSales, jdl, 'salesID')"
                class="q-ml-md"
                color="primary"
              />
            </template>
          </q-input>
        </template>
        <template v-slot:body="props">
          <q-tr>
            <q-td
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
              >
                <template v-if="col.jml === 'Y'">
                  {{ col.value | duit }}
                </template>
                <template v-else>
                  {{ col.value }}
                </template>
            </q-td>
          </q-tr>
        </template>
        <template v-slot:bottom-row>
          <q-tr>
            <q-th align="right" colSpan="2">Total</q-th>
            <q-th align="right">{{ dtSales.reduce((a, b) => $dwn.jumlah([a, b.qty]), 0) | duit }}</q-th>
            <q-th align="right">{{ dtSales.reduce((a, b) => $dwn.jumlah([a, b.hpp]), 0) | duit }}</q-th>
            <q-th align="right">{{ dtSales.reduce((a, b) => $dwn.jumlah([a, b.jmlHarga]), 0) | duit }}</q-th>
            <q-th align="right">{{ dtSales.reduce((a, b) => $dwn.jumlah([a, b.pointMember]), 0) | duit }}</q-th>
            <q-th align="right">{{ dtSales.reduce((a, b) => $dwn.jumlah([a, b.nilaiPencapaian]), 0) | duit }}</q-th>
            <!-- <q-th align="right">{{ dtSales.reduce((a, b) => $dwn.jumlah([a, b.qtyP]), 0) | duit }}</q-th>
            <q-th align="right">{{ dtSales.reduce((a, b) => $dwn.jumlah([a, b.jmlHargaP]), 0) | duit }}</q-th> -->
            <q-th align="right">{{ dtSales.reduce((a, b) => $dwn.jumlah([a, b.laba]), 0) | duit }}</q-th>
          </q-tr>
        </template>
      </q-table>
    </q-card-section>

    <q-card-section>
      <q-table
        :grid="$q.screen.lt.md"
        title="Sales Report Detail Terjual"
        :data="rkpSales"
        :columns="jdlrb"
        :filter="carid"
        dense
        row-key="salesID"
        :hide-header="$q.screen.lt.md"
      >
        <template v-slot:top-right>
          <q-input borderless dense debounce="300" v-model="carid" placeholder="Search">
            <template v-slot:append>
              <q-icon name="search" />
              <q-btn
                flat round dense
                icon="file_download"
                @click="toDown(allTransaksi, jdld)"
                class="q-ml-md"
                color="primary"
              />
            </template>
          </q-input>
        </template>
        <template v-slot:body="props">
          <q-tr :props="props" :key="`m_${props.row.salesID}`">
            <q-td
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
            >
            <template v-if="col.name==='namaKaryawan'">
              <q-toggle v-model="props.expand" checked-icon="add" unchecked-icon="remove" />
              {{ col.value }}
            </template>
            <template v-else-if="col.jml === 'Y'">{{ col.value | duit }}</template>
            <template v-else>{{ col.value }}</template>
            </q-td>
          </q-tr>
          <q-tr v-show="props.expand" :props="props" :key="`e_${props.row.iddetTrans}`" class="q-virtual-scroll--with-prev">
            <q-td colspan="100%">
              <q-table
                class="detTrx"
                :data="allTransaksi.filter(a => a.salesID === props.row.salesID)"
                :columns="jdld"
                separator="cell"
                dense>
                <template v-slot:body="props">
                  <q-tr>
                    <q-td
                        v-for="col in props.cols"
                        :key="col.name"
                        :props="props"
                      >
                        <template v-if="col.jml === 'Y'">
                          {{ col.value | duit }}
                        </template>
                        <template v-else>
                          {{ col.value }}
                        </template>
                    </q-td>
                  </q-tr>
                </template>
              </q-table>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card-section>
    <q-card-section>
      <q-table
        :grid="$q.screen.lt.md"
        title="Report Penjualan Detail"
        :data="rekapBy"
        :columns="jdlrk"
        :filter="carik"
        row-key="nama"
        dense>
        <template v-slot:top>
          <div class="row no-wrap items-center">
            <span class="text-h6 q-ml-md">Rekap Penjualan </span>
            <div class="q-gutter-sm">
              <q-radio v-model="jnsRkp" val="namaCust" label="Pelanggan" color="pink-3" />
              <q-radio v-model="jnsRkp" val="kategoriProduk" label="Kategori Produk" color="yellow-3" />
              <q-radio v-model="jnsRkp" val="kodeProduk" label="Produk" color="teal-3" />
            </div>
            <q-input borderless dense class="q-ml-md" debounce="300" v-model="carik" placeholder="Search">
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
          <q-tr>
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
      />
    </q-card-section>
  </q-card>
</template>

<script>
import pivotUI from '../chart/pivotData'
import { rkpAllsales, dtCab, rkpTransaksi, company } from '../../services/apiList'
import { reactive, toRefs, watch, onMounted, computed } from '@vue/composition-api'
export default {
  components: {
    pivotUI
  },
  setup (props, { root, emit }) {
    const dt = reactive({
      dtPivot: {
        rows: ['namaKaryawan'],
        cols: ['kategoriProduk'],
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
        { name: 'nama', label: 'Nama', field: row => row.nama, align: 'left' },
        { name: 'namaCabang', label: 'Cabang', field: row => row.namaCabang, align: 'left' },
        { name: 'qty', label: 'Qty Sales', field: row => row.qty, jml: 'Y', align: 'right' },
        { name: 'hpp', label: 'Nilai HPP', field: row => row.hpp, jml: 'Y', align: 'right' },
        { name: 'jmlHarga', label: 'Nilai Jual', field: row => row.jmlHarga, jml: 'Y', align: 'right' },
        { name: 'pointMember', label: 'Point Member', field: row => row.pointMember, jml: 'Y', align: 'right' },
        { name: 'nilaiPencapaian', label: 'Nilai Pencapaian', field: row => row.nilaiPencapaian, jml: 'Y', sortable: true, align: 'right' },
        /* { name: 'qtyP', label: 'Qty Pesanan', field: row => row.qtyP, jml: 'Y', sortable: true, align: 'right' },
        { name: 'jmlHargaP', label: 'Nilai Pesanan', field: row => row.jmlHargaP, jml: 'Y', sortable: true, align: 'right' }, */
        { name: 'laba', label: 'Margin', field: row => row.laba, jml: 'Y', align: 'right' }
      ],
      jdlrb: [
        { name: 'namaKaryawan', label: 'Nama Sales', field: row => row.namaKaryawan, align: 'left' },
        { name: 'kategoriProduk', label: 'Kategori Produk', field: row => row.kategoriProduk, align: 'left' },
        { name: 'qty', label: 'Qty Sales', field: row => row.qty, jml: 'Y', align: 'right' },
        { name: 'hpp', label: 'Nilai HPP', field: row => row.hpp, jml: 'Y', align: 'right' },
        { name: 'jmlHarga', label: 'Nilai Jual', field: row => row.jmlHarga, jml: 'Y', align: 'right' },
        { name: 'nilaiPencapaian', label: 'Nilai Pencapaian', field: row => row.nilaiPencapaian, jml: 'Y', sortable: true, align: 'right' },
        { name: 'laba', label: 'Margin', field: row => row.laba, jml: 'Y', align: 'right' }
      ],
      filt: {
        kodeCab: [],
        tgla: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        allCab: false,
        ancab: true,
        grupBy: 'salesID'
      },
      inRul: [ v => !!v || 'Isi data' ],
      cari: '',
      defaultShowSettings: true,
      isDataLoading: false,
      cabAll: [],
      rekapSls: true,
      allTransaksi: [],
      jdld: [
        { name: 'namaKaryawan', label: 'Nama Sales', field: row => row.namaKaryawan, sortable: true, align: 'left' },
        { name: 'namaCabang', label: 'Nama Cabang', field: row => row.namaCabang, sortable: true, align: 'left' },
        { name: 'nomorBukti', label: 'Nomor Bukti', field: row => row.nomorBukti, sortable: true, align: 'left' },
        { name: 'tglKirim', label: 'Tanggal Kirim', field: row => row.tglKirim, sortable: true, align: 'left' },
        { name: 'namaCust', label: 'Nama Cust', field: row => row.namaCust, sortable: true, align: 'left' },
        { name: 'kategoriCust', label: 'Kategori Cust', field: row => row.kategoriCust, sortable: true, align: 'left' },
        { name: 'kategoriProduk', label: 'Kategori Produk', field: row => row.kategoriProduk, sortable: true, align: 'left' },
        { name: 'namaMerk', label: 'Merk', field: row => row.namaMerk, sortable: true, align: 'left' },
        { name: 'namaBarang', label: 'Nama Barang', field: row => row.namaBarang, sortable: true, align: 'left' },
        { name: 'qty', label: 'Qty Sales', field: row => row.qty, jml: 'Y', sortable: true, align: 'right' },
        { name: 'hpp', label: 'Nilai HPP', field: row => row.hpp, jml: 'Y', sortable: true, align: 'right' },
        { name: 'dpp', label: 'Nilai DPP', field: row => row.dpp, jml: 'Y', sortable: true, align: 'right' },
        { name: 'jmlHarga', label: 'Nilai Jual', field: row => row.jmlHarga, jml: 'Y', sortable: true, align: 'right' },
        { name: 'jmlHargaR', label: 'Nilai Retur', field: row => row.jmlHargaR, jml: 'Y', sortable: true, align: 'right' },
        { name: 'pencapaian', label: '% Pencapaian', field: row => row.pencapaian, jml: 'Y', format: val => `${val} %`, sortable: true, align: 'right' },
        { name: 'nilaiPencapaian', label: 'Nilai Pencapaian', field: row => row.nilaiPencapaian, jml: 'Y', sortable: true, align: 'right' },
        { name: 'pointMember', label: 'Point Member', field: row => row.pointMember, jml: 'Y', sortable: true, align: 'right' }
      ],
      carid: '',
      halaman: { rowsPerPage: 0, sortBy: 'jmlHarga', descending: true },
      divCab: [],
      divisi: '',
      dtComp: [],
      tgl: {
        from: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        to: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
      },
      jdlrk: [
        { name: 'No', label: 'No', field: row => row.No, align: 'left' },
        { name: 'nama', label: 'Nama', field: row => row.nama, align: 'left', sortable: true },
        { name: 'qty', label: 'Qty Sales', field: row => row.qty, jml: 'Y', align: 'right', sortable: true },
        { name: 'jmlHarga', label: 'Jumlah Harga', field: row => row.jmlHarga, sortable: true, jml: 'Y', align: 'right' }
      ],
      jnsRkp: 'namaCust',
      pilJnsRkp: [
        { text: 'Partner', value: 'namaCust', name: 'namaCust' },
        { text: 'Kategori Produk', value: 'kategoriProduk', name: 'kategoriProduk' },
        { text: 'Produk', value: 'kodeProduk', name: 'namaBarang' }
      ],
      jnsRkpSales: 'salesID',
      carik: '',
      pilJnsRkpSales: [
        { text: 'Sales', value: 'salesID', name: 'namaKaryawan' },
        { text: 'Kategori Produk', value: 'kodeCat', name: 'kategoriProduk' },
        { text: 'Produk', value: 'kodeProduk', name: 'namaBarang' }
      ],
      filtBy: { text: 'Partner', value: 'namaCust', name: 'namaCust' }
    })
    const dataSales = computed(() => {
      let grupBy = dt.jnsRkpSales
      let filt = dt.pilJnsRkpSales.find(s => s.value === grupBy)
      let perBy = [ ...new Set(dt.dtSales.map(a => a[grupBy])) ]
      let data = []
      if (dt.dtSales.length) {
        for (let i in perBy) {
          let s = {
            namaCabang: dt.dtSales.filter(a => a[grupBy] === perBy[i])[0].namaCabang || '',
            qty: dt.dtSales.filter(a => a[grupBy] === perBy[i]).reduce((c, d) => root.$dwn.jumlah([c, d.qty]), 0),
            jmlHarga: dt.dtSales.filter(a => a[grupBy] === perBy[i]).reduce((c, d) => root.$dwn.jumlah([c, d.jmlHarga]), 0),
            hpp: dt.dtSales.filter(a => a[grupBy] === perBy[i]).reduce((c, d) => root.$dwn.jumlah([c, d.hpp]), 0),
            pointMember: dt.dtSales.filter(a => a[grupBy] === perBy[i]).reduce((c, d) => root.$dwn.jumlah([c, d.pointMember]), 0),
            nilaiPencapaian: dt.dtSales.filter(a => a[grupBy] === perBy[i]).reduce((c, d) => root.$dwn.jumlah([c, d.nilaiPencapaian]), 0),
            qtyP: dt.dtSales.filter(a => a[grupBy] === perBy[i]).reduce((c, d) => root.$dwn.jumlah([c, d.qtyP]), 0),
            jmlHargaP: dt.dtSales.filter(a => a[grupBy] === perBy[i]).reduce((c, d) => root.$dwn.jumlah([c, d.jmlHargaP]), 0),
            laba: dt.dtSales.filter(a => a[grupBy] === perBy[i]).reduce((c, d) => root.$dwn.jumlah([c, d.laba]), 0),
            nama: dt.dtSales.find(a => a[grupBy] === perBy[i])[filt.name]
          }
          data.push(s)
        }
      }
      return data
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
    watch(() => dt.jnsRkp, (val) => {
      dt.filtBy = dt.pilJnsRkp.find(a => a.value === val)
    })
    const detailTrx = () => {
      dt.allTransaksi = []
      let ss = ['MAN', 'acc', 'purchase', 'mitra'].some(a => a === root.$store.state.auth.user.userType)
      if (dt.filt.kodeCab.length || !ss) {
        dt.filt.jnsTrx = 'J'
        rkpTransaksi(dt.filt)
          .then(({ data }) => {
            dt.allTransaksi = data.filter(a => dt.filt.kodeCab.some(s => s === a.asal)).map(a => {
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
    const rekap = () => {
      dt.dtSales = []
      // let ss = ['MAN', 'acc', 'purchase'].some(a => a === root.$store.state.auth.user.userType)
      if (dt.filt.kodeCab.length) {
        let user = root.$store.state.auth.user
        rkpAllsales(dt.filt)
          .then(res => {
            let dta = ['MAN', 'acc', 'purchase', 'mitra', 'admin'].some(a => a === root.$store.state.auth.user.userType) ? res.data : res.data.filter(a => a.salesID === user.eID.toString())
            dt.dtSales = dta.map(a => {
              a.hpp = ['MAN', 'acc', 'purchase', 'mitra'].some(a => a === root.$store.state.auth.user.userType) ? a.hpp : 0
              a.laba = ['MAN', 'acc', 'purchase', 'mitra'].some(a => a === root.$store.state.auth.user.userType) ? root.$dwn.jumlah([a.jmlHarga, -a.hpp, -a.pointMember]) : 0
              return a
            })
          })
          .catch(err => {
            console.log(err)
          })
      }
    }
    watch(() => dt.jnsRkpSales, (val) => {
      dt.filt.grupBy = val
      // let filtBy = dt.pilJnsRkpSales.find(a => a.value === val)
      // dt.jdl[0] = { name: filtBy.name, label: filtBy.text, field: row => row[filtBy.value], align: 'left' }
      rekap()
    })
    const toDown = (y, z, a) => {
      if (a) {
        z[0].name = dt.pilJnsRkpSales.find(s => s.value === a).name
      }
      let x = {
        judul: `Laporan Penjualan `,
        dt: y.map((a, i) => {
          a.No = i + 1
          return a
        }),
        hdr: z,
        naFile: `LapPenjualan`
      }
      root.$dwn.toExcel(x)
    }
    const lihat = () => {
      dt.filt.tgla = dt.tgl && dt.tgl.from ? dt.tgl.from : dt.tgl || new Date()
      dt.filt.tglb = dt.tgl && dt.tgl.from ? dt.tgl.to : dt.tgl || new Date()
      detailTrx()
      rekap()
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
        // dt.divisi = []
      }
      // dt.filt.kodeCab = x ? dt.cabAll.filter(s => s.kodeCab !== 'AM01').map(a => a.kodeCab) : [root.$store.state.auth.user.kodeCab]
    }
    watch(() => root.$store.state.auth.setCabang, (val) => {
      dt.filt.kodeCab = [val]
      lihat()
    })
    onMounted(() => {
      company()
        .then(({ data }) => {
          dt.dtComp = data
        })
      dtCab()
        .then(({ data }) => {
          const pegang = root.$store.state.auth.user.cabGrup || root.$q.cookies.get('cabGrup')
          dt.cabAll = data.filter(a => pegang.some(s => s === a.kodeCab))
          let st = new Set(dt.cabAll.map(a => a.compCode))
          dt.divisi = '' // [...st]
          dt.divCab = dt.dtComp.filter(a => st.has(a.compCode))
          // dt.filt.kodeCab = dt.cabAll.map(a => a.kodeCab)
          lihat()
        })
        .catch(err => {
          console.log(err)
        })
    })
    return { ...toRefs(dt), gantiCab, toDown, lihat, rekapBy, dataSales }
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
          namaCabang: c.length ? c[0].namaCabang : '',
          namaKaryawan: c.length ? c[0].namaKaryawan : '',
          qty: c.reduce((s, ss) => this.$dwn.jumlah([s, ss.qty]), 0),
          jmlHarga: c.reduce((s, ss) => this.$dwn.jumlah([s, ss.jmlHarga]), 0),
          hpp: c.reduce((s, ss) => this.$dwn.jumlah([s, ss.hpp]), 0),
          nilaiPencapaian: c.reduce((s, ss) => this.$dwn.jumlah([s, ss.nilaiPencapaian]), 0),
          pointMember: c.reduce((s, ss) => this.$dwn.jumlah([s, ss.pointMember]), 0),
          cashBack: c.reduce((s, ss) => this.$dwn.jumlah([s, ss.cashBack]), 0),
          laba: c.reduce((s, ss) => this.$dwn.jumlah([s, ss.laba]), 0),
          qtyP: c.reduce((s, ss) => this.$dwn.jumlah([s, ss.qtyP]), 0),
          jmlHargaP: c.reduce((s, ss) => this.$dwn.jumlah([s, ss.jmlHargaP]), 0)
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
      return this.cabAll.filter(a => this.$store.state.auth.user.cabGrup.some(s => s === a.kodeCab))
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
