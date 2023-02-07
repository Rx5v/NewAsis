<template>
  <q-page padding>
    <div class="q-pa-xs row q-gutter-xs justify-end">
      <div class="text-h6">
          Periode: <q-chip color="blue" class="text-white">{{ tgl !== null && tgl.from ? (tgl.from + ' ~ ' + tgl.to) : tgl }}
          <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
            <q-date v-model="tgl" range @input="(x) => x && (lihat(),$refs.qDateProxy.hide())" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
          </q-popup-proxy>
        </q-chip>
      </div>
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
            lazy-rules>
          </q-select>
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
    </div>
    <div class="row q-gutter-sm justify-around">
      <profitloss :filt="filt" class="fit"/>
      <!-- <div class="q-pa-xs col-xs-12" v-if="datasetDiv.length">
        <garis :labels="rkpDiv" :datasets="datasetDiv" type="bar" :title="{text: 'Omzet Per Company'}" class="bg-teal-13"></garis>
      </div> -->
      <div class="q-pa-xs col-xs-12">
        <q-card style="width: 350px">
          <q-card-section
            style="`background: linear-gradient(to left, transparent,rgba(255,145,200,0.8))`">
            <q-chip class="text-white bg-blue">Rekap Cabang</q-chip>
          </q-card-section>
          <q-separator />
          <q-list dense>
            <q-item v-for="col in jdl.filter(col => col.name !== 'namaCabang')" :key="col.name">
              <q-item-section>
                <q-item-label>{{ col.label }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption>
                  <template v-if="col.jml === 'Y'">
                    <q-chip outline color="primary">{{ dtSales.reduce((a, b) => a + b[col.name], 0) | nomer }}</q-chip>
                  </template>
                  <template v-else>{{ col.name }}</template>
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
        <q-table
          class="detTrx"
          title="Sales Report"
          :data="dtSales"
          :columns="jdl"
          :pagination.sync="halaman"
          grid
          hide-header
          hide-bottom
        >
          <template v-slot:item="props">
            <div
              class="q-pa-xs col-xs-12 col-sm-6 col-md-4 col-lg-3 grid-style-transition"
            >
              <q-card>
                <q-card-section
                  :style="`background: linear-gradient(to left, transparent,rgba(${200 - props.row.jmlHarga/total.jmlHarga * 225},${props.row.jmlHarga/total.jmlHarga * 255},${props.row.jmlHarga/total.jmlHarga * 125 + 200},0.8))`">
                  <q-chip class="text-white bg-blue">{{ props.row.namaCabang }}</q-chip>
                </q-card-section>
                <q-separator />
                <q-list dense>
                  <q-item v-for="col in props.cols.filter(col => col.name !== 'namaCabang')" :key="col.name">
                    <q-item-section>
                      <q-item-label>{{ col.label }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-item-label caption>
                        <template v-if="col.name === 'hpp' || col.name === 'jmlHargaR'">
                          <q-chip outline color="orange-9">{{ col.value }}</q-chip>
                        </template>
                        <template v-else><q-chip outline color="primary">{{ col.value }}</q-chip></template>
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card>
            </div>
          </template>
        </q-table>
      </div>
      <!-- <div class="col-xs-12 col-sm-5 col-md-5 col-lg-3">
        <garis :labels="jam" :datasets="rkpJam" type="area" :title="{text: 'Jam Ramai'}" class="bg-teal-13"></garis>
      </div> -->
      <div class="q-pa-xs col-xs-12 col-sm-5 col-md-5 col-lg-3" v-if="datasetk.length">
        <donut :labels="labelk" :datasets="datasetk" type="pie" :title="{text: 'Omzet Per Kategori'}" class="bg-cyan-13"></donut>
      </div>
      <div class="q-pa-xs col-xs-12 col-sm-5 col-md-5 col-lg-3" v-if="datasets.length">
        <radar :labels="labels" :datasets="datasets" type="line" :title="chart" class="bg-cyan-13"></radar>
      </div>
      <div class="q-pa-xs col-xs-12 col-sm-5 col-md-5 col-lg-3" v-if="datasett.length">
        <garis :labels="labelt" :datasets="datasett" type="area" :title="{text: 'Omzet per Tanggal'}" class="bg-teal-13"></garis>
      </div>
      <div class="q-pa-xs col-xs-12 col-sm-5 col-md-5 col-lg-3">
        <q-markup-table wrap-cells dense>
          <thead>
            <tr class="bg-teal-13">
              <th colspan="5">
                <div class="row no-wrap items-center">
                  <span class="text-h6 q-ml-md">Top Ten Kategori Produk</span>
                  <q-rating
                    :value="5"
                    size="2.5em"
                    color="yellow-3"
                    class="q-ml-md"
                    icon="star_border"
                  />
                </div>
                <div class="q-gutter-sm">
                  <q-radio keep-color v-model="jnsTop" val="Omzet" label="Omzet" color="teal" />
                  <q-radio keep-color v-model="jnsTop" val="Profit" label="Profit" color="orange"/>
                </div>
                <!-- <q-select v-model="filt.jml" :options="[5, 10, 15]" label="Rangking"/> -->
              </th>
            </tr>
            <q-tr>
              <q-th align="left">No.</q-th>
              <q-th align="left">Kategori</q-th>
              <q-th align="right">Quantity</q-th>
              <q-th align="right">Omzet</q-th>
              <q-th align="right">Profit</q-th>
            </q-tr>
          </thead>
          <tbody>
            <q-tr v-for="(a, i) in perProfit.slice(0, 10)" :key="i">
              <template v-if="i < 10">
                <q-td>{{ i + 1 }}</q-td>
                <q-td>{{ a.kategoriProduk }}</q-td>
                <q-td align="right">{{ a.qty | nomer }}</q-td>
                <q-td align="right">{{ a.jmlHarga | nomer }}</q-td>
                <q-td align="right">{{ a.profit | nomer }}</q-td>
              </template>
            </q-tr>
          </tbody>
        </q-markup-table>
      </div>
      <!-- <div class="col-xs-12 col-sm-5 col-md-5 col-lg-3">
        <q-markup-table dense>
          <thead>
            <tr class="bg-teal-13">
              <th colspan="5">
                <div class="row no-wrap items-center">
                  <span class="text-h6 q-ml-md">Nilai Persediaan per {{ filt.tglb }}</span>
                </div>
              </th>
            </tr>
            <q-tr>
              <q-th align="left">No.</q-th>
              <q-th align="left">Lokasi</q-th>
              <q-th align="right">Persediaan</q-th>
            </q-tr>
          </thead>
          <tbody>
            <q-tr v-for="(a, i) in persediaan" :key="i">
              <q-td>{{ i + 1 }}</q-td>
              <q-td>{{ a.lokasi }}</q-td>
              <q-td align="right">{{ a.saldoPersediaan | nomer }}</q-td>
            </q-tr>
          </tbody>
          <tfoot>
            <tr>
              <th align="right" colspan="2">Total</th>
              <th align="right">{{ persediaan.reduce((a, b) => a + b.saldoPersediaan, 0) | nomer }}</th>
            </tr>
          </tfoot>
        </q-markup-table>
      </div> -->
      <div class="q-pa-xs col-xs-12">
        <q-table
          class="dataTrx"
          :data="rkpTgl"
          separator="cell"
          :pagination="{ rowsPerPage: 0 }"
          :loading="lodingRkp"
        >
        <template v-slot:loading>
          <q-inner-loading showing color="primary" />
        </template>
          <template v-slot:top-right>
            <q-btn
              v-if="rkpTgl.length"
              color="primary"
              icon-right="archive"
              label="Export to Excel"
              no-caps
              @click="toDown"
              class="q-ml-md"
            />
          </template>
          <template v-slot:header>
            <q-tr class="text-bold bg-info">
              <q-th rowSpan="2">Tanggal</q-th>
              <q-th colSpan="2" v-for="(a,s) in filt.kodeCab" :key="a" :class="s % 2 === 0 && 'bg-teal-13'">
                {{ cabAll.find(c => c.kodeCab === a) &&  cabAll.find(c => c.kodeCab === a).namaCabang }}
              </q-th>
            </q-tr>
            <q-tr class="text-bold bg-info">
              <template v-if="rkpTgl.length">
                <q-th v-for="(s, a) in jdlRkp" :key="a" :class="(a % 4) === 0 ? '' : 'bg-teal-13'">
                  {{ s }}
                </q-th>
              </template>
            </q-tr>
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td v-for="col in props.cols"
                :key="col.name"
                :props="props"
              >
                <template v-if="col.name==='tanggal'">
                  {{ props.row.tanggal }}
                </template>
                <template v-else>
                  {{ props.row[col.name] | nomer }}
                </template>
              </q-td>
            </q-tr>
          </template>
          <template v-slot:bottom-row>
            <q-tr class="text-bold">
              <template v-if="rkpTgl.length">
                <q-th v-for="(s, a, i) in rkpTgl[0]" :key="i" :class="(i % 2) === 0 && 'bg-teal-13'">
                  <template v-if="i === 0">
                    Total
                  </template>
                  <template v-else>
                    {{ rkpTgl.reduce((b, c) => b + c[a], 0) | nomer }}
                  </template>
                </q-th>
              </template>
            </q-tr>
          </template>
        </q-table>
      </div>
    </div>
  </q-page>
</template>

<script>
import Excel from 'exceljs'
import FileSaver from 'file-saver'
import donut from '../components/chart/donutChart'
import radar from '../components/chart/ApexRadar'
import garis from '../components/chart/ApexLine'
import profitloss from '../components/Dashboard/ProfitLoss.vue'
import { computed, onBeforeUnmount, onMounted, reactive, toRefs } from '@vue/composition-api'
import { bubes, company, dtCab, rkpAllsales, rkpPerKategori, rkpTransaksi } from '../services/apiList'
export default {
  components: { donut, radar, garis, profitloss },
  setup (props, { root, refs }) {
    const dt = reactive({
      labels: [],
      datasets: [{ data: [] }],
      options: {},
      filt: {
        allCab: true,
        ancab: false,
        kodeCab: [],
        tgla: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        jnsTrx: 'J',
        induk: []
      },
      tgl: {
        from: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        to: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
      },
      inRul: [v => !!v || 'Isi data'],
      cabAll: [],
      chart: {
        ada: false,
        text: 'Pencapaian per Sales',
        id: 'Diagram'
      },
      labelk: [],
      datasetk: [],
      labelt: [],
      datasett: [],
      rkpASI: {},
      rkpPusat: {},
      rkpOutlet: {},
      perKate: [],
      dtComp: [],
      datasetDiv: [],
      rkpDiv: [],
      perjam: [],
      jam: [],
      halaman: { rowsPerPage: 0, sortBy: 'jmlHarga', descending: true },
      dtSales: [],
      jdl: [
        { name: 'namaCabang', label: 'Nama Cabang', field: row => row.namaCabang, align: 'left' },
        { name: 'qty', label: 'Qty Sales', field: row => row.qty, format: val => val.toLocaleString(), jml: 'Y', align: 'right' },
        { name: 'jmlHarga', label: 'Penjualan Bersih', field: row => row.jmlHarga, format: val => new Intl.NumberFormat('en-ID', { style: 'currency', currency: 'IDR' }).format(val), jml: 'Y', align: 'right' },
        { name: 'profit', label: 'Profit', field: row => row.profit, format: val => new Intl.NumberFormat('en-ID', { style: 'currency', currency: 'IDR' }).format(val), jml: 'Y', align: 'right' }
      ],
      counter: 0,
      jnsTop: 'Omzet',
      persediaan: [],
      cashBack: [],
      divCab: [],
      divisi: '',
      rkpTgl: [],
      lodingRkp: false,
      perProfit: []
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
          dt.filt.kodeCab = pegang
          lihat()
        })
      startInterval()
    })
    const lihat = async () => {
      dt.filt.tgla = dt.tgl.from || dt.tgl
      dt.filt.tglb = dt.tgl.to || dt.tgl
      // dt.filt.kodeCab = dt.cabAll.filter(a => dt.filt.kodeCab.some(s => a.kodeCab === s)).map(k => k.kodeCab)
      dt.persediaan = []
      dt.dtSales = []
      // let cashBack = []
      bubes({ ...dt.filt, kodeAkun: '310200001' })
        .then(({ data }) => {
          // if (data.dt.length) {
          /* cashBack = dt.filt.kodeCab.map(a => {
            return {
              kodeCab: a,
              saldo: data.dt.filter(s => s.kodeCab === a).reduce((c, d) => root.$dwn.jumlah([c, -d.debit, d.kredit]), 0) || 0
            }
          }) */
          // }
        })
      try {
        rkpAllsales(dt.filt)
          .then(({ data }) => {
            const perNama = [...new Set(data.map(a => a.namaKaryawan))]
            const rkp = perNama.map((a, i) => {
              return {
                namaKaryawan: a,
                nilaiPencapaian: data.filter(s => s.namaKaryawan === a).reduce((j, m) => j + m.nilaiPencapaian, 0),
                jmlHarga: data.filter(s => s.namaKaryawan === a).reduce((j, m) => j + m.jmlHarga, 0)
              }
            })
            const dta = rkp.sort(function (a, b) {
              return b.nilaiPencapaian - a.nilaiPencapaian
            })
            dt.labels = dta.map(a => a.namaKaryawan)
            dt.datasets = [
              /* {
                name: 'Pencapaian',
                data: dta.filter((a, i) => i < 5).map(s => s.nilaiPencapaian),
                type: 'bar'
              }, */
              {
                name: 'Omzet',
                data: dta.map(s => s.jmlHarga),
                type: 'bar'
              }
            ]
            dt.chart.ada = true
          })
        rkpPerKategori(dt.filt)
          .then(({ data }) => {
            data.map(a => {
              a.profit = a.jmlHarga - a.hpp
              return a
            })
            dt.labelk = data.map(a => a.kategoriProduk)
            dt.datasetk = data.map(s => s.jmlHarga)
            dt.perKate = data.sort(function (a, b) {
              return b.jmlHarga - a.jmlHarga
            })
          })
        rkpTransaksi(dt.filt)
          .then(({ data }) => {
            const perCab = dt.filt.kodeCab
            // [...new Set(data.map(a => a.kodeCab))]
            dt.rkpTgl = []
            dt.dtSales = perCab.map((a, i) => {
              const b = {
                namaCabang: dt.cabAll.find(s => s.kodeCab === a) && dt.cabAll.find(c => c.kodeCab === a).namaCabang,
                qty: data.filter(s => s.asal === a).reduce((j, m) => j + (m.qty - m.qtyR), 0),
                jmlHarga: data.filter(s => s.asal === a).reduce((b, c) => root.$dwn.jumlah([b, c.jmlHarga]), 0),
                jmlHargaR: data.filter(s => s.asal === a).reduce((b, c) => root.$dwn.jumlah([b, c.jmlHargaR]), 0),
                jmlHargaRs: data.filter(s => s.asal === a).reduce((b, c) => root.$dwn.jumlah([b, c.jmlHargaRs]), 0),
                hpp: data.filter(s => s.asal === a).reduce((b, c) => root.$dwn.jumlah([b, c.hpp, -c.hppR]), 0),
                hppa: data.filter(s => s.asal === a).reduce((b, c) => root.$dwn.jumlah([b, c.hpp]), 0),
                hppr: data.filter(s => s.asal === a).reduce((b, c) => root.$dwn.jumlah([b, c.hppR]), 0),
                pointMember: data.filter(s => s.asal === a).reduce((b, c) => root.$dwn.jumlah([b, c.pointMember]), 0),
                laba: data.filter(s => s.asal === a).reduce((b, c) => root.$dwn.jumlah([b, c.laba]), 0),
                omzet: data.filter(s => s.asal === a).reduce((b, c) => root.$dwn.jumlah([b, c.jmlHarga, -c.jmlHargaR]), 0),
                profit: data.filter(s => s.asal === a).reduce((b, c) => root.$dwn.jumlah([b, c.jmlHarga, -c.jmlHargaR, -c.hpp, c.hppR]), 0) // + (cashBack.find(s => s.kodeCab === a).saldo || 0)
              }
              return b
            })
            dt.perjam = []
            dt.jam = []
            let i = 0
            while (i < 24) {
              const c = data.filter(s => new Date(s.tglKirim).getHours() === i)
              const a = c ? c.reduce((j, m) => j + (m.jmlHarga - m.jmlHargaR), 0) : 0
              // console.log(i, a)
              dt.perjam.push(a)
              dt.jam.push('Jam ' + i)
              i++
            }
            // console.log(dt.perjam)
            const rk = [...new Set(data.map(a => a.tglKirim.slice(0, 10)))]
            rk.sort((a, b) => a.slice(-2) - b.slice(-2))
            // rekap per tanggal dan outlet
            dt.rkpTgl = []
            dt.lodingRkp = true
            rk.forEach(a => {
              const s = {
                tanggal: a
              }
              // data filter per tanggal, get per outlet
              perCab.forEach(p => {
                // s[`${p}-O`] = { omzet: 0, hpp: 0, laba: 0 }
                s[`${p}O`] = data.filter(d => d.asal === p && d.tglKirim.slice(0, 10) === a).reduce((b, c) => root.$dwn.jumlah([b, c.jmlHarga, -c.jmlHargaR]), 0)
                // s[`${p}h`] = data.filter(d => d.kodeCab === p && d.tglKirim.slice(0, 10) === a).reduce((b, c) => root.$dwn.jumlah([b, c.hpp, -c.hppR]), 0)
                s[`${p}l`] = data.filter(d => d.asal === p && d.tglKirim.slice(0, 10) === a).reduce((b, c) => root.$dwn.jumlah([b, c.jmlHarga, -c.jmlHargaR, -c.hpp, c.hppR]), 0)
              })
              dt.rkpTgl.push(s)
            })
            dt.lodingRkp = false
            dt.labelt = rk
            const rkp = rk.map((a, i) => {
              return data.filter(s => s.tglKirim.slice(0, 10) === a).reduce((j, m) => j + (m.jmlHarga - m.jmlHargaR), 0)
            })
            dt.datasett = [
              {
                name: 'Omzet Penjualan',
                data: rkp,
                type: 'bar'
              },
              {
                name: 'Walk In',
                data: rk.map((a, i) => {
                  return data.filter(s => s.tglKirim.slice(0, 10) === a && dt.filt.kodeCab.some(d => d === s.kodeCab) && s.walkIn === 'Y').reduce((j, m) => j + (m.jmlHarga - m.jmlHargaR), 0)
                }),
                type: 'line'
              },
              {
                name: 'Delivery Order',
                data: rk.map((a, i) => {
                  return data.filter(s => s.tglKirim.slice(0, 10) === a && dt.filt.kodeCab.some(d => d === s.kodeCab) && s.walkIn === 'N').reduce((j, m) => j + (m.jmlHarga - m.jmlHargaR), 0)
                }),
                type: 'line'
              }
            ]
            // console.log(dt.datasett)
            dt.rkpDiv = dt.dtComp.filter(s => dt.divisi === s.compCode).map(a => a.compName)
            dt.datasetDiv = [
              {
                name: 'Omzet Per Company',
                data: data.filter(s => s.compID === dt.divisi).reduce((j, m) => j + (m.jmlHarga - m.jmlHargaR), 0)
              }
            ]
            const rkpAsi = data
            dt.rkpASI = {
              judul: 'Omzet Holding',
              qty: rkpAsi.reduce((b, c) => root.$dwn.jumlah([b, c.qty]), 0),
              jmlHarga: rkpAsi.reduce((b, c) => root.$dwn.jumlah([b, c.jmlHarga]), 0),
              jmlHargaR: rkpAsi.reduce((b, c) => root.$dwn.jumlah([b, c.jmlHargaR]), 0),
              jmlHargaRs: rkpAsi.reduce((b, c) => root.$dwn.jumlah([b, c.jmlHargaRs]), 0),
              hpp: rkpAsi.reduce((b, c) => root.$dwn.jumlah([b, c.hpp, -c.hppR]), 0),
              hppa: rkpAsi.reduce((b, c) => root.$dwn.jumlah([b, c.hpp]), 0),
              hppr: rkpAsi.reduce((b, c) => root.$dwn.jumlah([b, c.hppR]), 0),
              pointMember: rkpAsi.reduce((b, c) => root.$dwn.jumlah([b, c.pointMember]), 0),
              // cashBack: cashBack.length ? cashBack.reduce((b, c) => root.$dwn.jumlah([b, c.saldo]), 0) : 0,
              laba: rkpAsi.reduce((b, c) => root.$dwn.jumlah([b, c.laba]), 0),
              omzet: rkpAsi.reduce((b, c) => root.$dwn.jumlah([b, c.jmlHarga, -c.jmlHargaR]), 0),
              profit: rkpAsi.reduce((b, c) => root.$dwn.jumlah([b, c.jmlHarga, -c.jmlHargaR, -c.hpp, c.hppR]), 0) // + (cashBack.length ? cashBack.reduce((b, c) => root.$dwn.jumlah([b, c.saldo]), 0) : 0)
            }
            dt.rkpOutlet = {
              judul: 'Omzet Outlet',
              qty: rkpAsi.filter(a => a.asal !== 'MP01').reduce((b, c) => root.$dwn.jumlah([b, c.qty]), 0),
              jmlHarga: rkpAsi.filter(a => a.asal !== 'MP01').reduce((b, c) => root.$dwn.jumlah([b, c.jmlHarga]), 0),
              hpp: rkpAsi.filter(a => a.asal !== 'MP01').reduce((b, c) => root.$dwn.jumlah([b, c.hpp]), 0),
              pointMember: rkpAsi.filter(a => a.asal !== 'MP01').reduce((b, c) => root.$dwn.jumlah([b, c.pointMember]), 0),
              // cashBack: rkpAsi.filter(a => a.asal !== 'MP01').reduce((b, c) => root.$dwn.jumlah([b, Object.values(c)]), 0),
              laba: rkpAsi.filter(a => a.asal !== 'MP01').reduce((b, c) => root.$dwn.jumlah([b, c.jmlHarga, -c.hpp, -c.pointMember]), 0)
            }
          })
      } catch (error) {
        console.log(error)
      }
    }
    const total = () => {
      const b = dt.dtSales
      const a = {
        jmlHarga: b.reduce((x, y) => root.$dwn.jumlah([x, y.jmlHarga]), 0),
        target: 120000000
      }
      return a
    }
    const rkpJam = computed(() => {
      return [
        {
          name: 'Jam Ramai',
          data: dt.perjam
        }
      ]
    })
    const gantiCab = (x) => {
      dt.filt.kodeCab = []
      if (x) {
        dt.filt.kodeCab = dt.cabAll.filter(a => dt.divisi === a.compCode).map(a => a.kodeCab)
        lihat()
      } else {
        dt.filt.kodeCab = []
        dt.rkpTgl = []
        // dt.divisi = []
      }
    }
    const startInterval = () => {
      setInterval(() => {
        dt.counter++
      }, 300000)
    }
    onBeforeUnmount(() => {
      clearInterval(dt.counter)
    })
    watch(() => dt.jnsTop, (fl) => {
      dt.perProfit = dt.perKate.sort(function (a, b) {
        return b[fl] - a[fl]
      })
    })
    const perDiv = () => {
      dt.filt.kodeCab = dt.cabAll.filter(a => dt.divisi === a.compCode).map(a => a.kodeCab)
      lihat()
    }
    const jdlRkp = computed(() => {
      const jd = dt.rkpTgl.length ? dt.filt.kodeCab.flatMap(a => ['Omset', 'Laba']) : []
      return jd
    })
    const toDown = async () => {
      const wb = new Excel.Workbook()
      const ws = wb.addWorksheet('Data', { properties: { showGridLines: true } })
      const hdr = Object.keys(dt.rkpTgl[0])
      const dta = dt.rkpTgl
      const naFile = 'RekapOmset'
      ws.getCell('A1').value = {
        richText: [
          { font: { italic: true }, text: 'Rekap Omzet' }
        ]
      }
      ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      // label judul

      ws.getCell('A3').value = 'Tanggal'
      ws.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      dt.filt.kodeCab.forEach((x, i) => {
        ws.getCell(3, (i * 2) + 2).value = {
          richText: [
            { font: { italic: true }, text: dt.cabAll.find(a => a.kodeCab === x).namaCabang }
          ]
        }
        ws.getCell(3, (i * 2) + 2).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        ws.getCell(3, (i * 2) + 2).fill = {
          type: 'pattern',
          pattern: 'darkTrellis',
          fgColor: { argb: i % 2 === 0 ? '1DE9B6' : '1df003' }
        }
        ws.mergeCells(3, (i + 1) * 2, 3, (i + 1) * 2 + 1)
      })
      const row = ws.getRow(3)
      row.height = 42.5
      /* row.eachCell(function (cell, colNumber) {
        row.getCell(colNumber).fill = {
          type: 'pattern',
          pattern: 'darkTrellis',
          fgColor: { argb: '1DE9B6' }
        }
      }) */
      ws.getRow(4).values = ['', ...jdlRkp.value]
      ws.getRow(4).eachCell((cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'darkTrellis',
          fgColor: { argb: 'e2f905' }
        }
      })
      ws.mergeCells(0, 0, 0, row.cellCount)
      ws.mergeCells('A3:A4')
      ws.columns = hdr.map(x => {
        const a = {}
        a.key = x
        // a.outlineLevel = 1
        a.style = { numFmt: '#,##0.00' }
        return a
      })
      for (const a in dta) {
        ws.addRow(dta[a])
      }
      const cellFoot = dta.length + 5
      const foot = ws.getRow(cellFoot, row.cellCount)
      foot.values = ['Total', ...jdlRkp.value]
      /* const ft = hdr.reduce((z, x) => {
        // if (x.jml) {
        z[x.name] = { formula: `SUM(${ws.getRow(4).getCell(x.name)._address}:${ws.getRow(cellFoot - 1).getCell(x.name)._address})` }
        // }
        return z
      }, {}) */
      foot.eachCell((cell, colNumber) => {
        if (colNumber > 1) {
          cell.value = { formula: `SUM(${ws.getRow(5).getCell(colNumber)._address}:${ws.getRow(cellFoot - 1).getCell(colNumber)._address})` }
        }
        cell.fill = {
          type: 'pattern',
          pattern: 'darkTrellis',
          fgColor: { argb: '22f905' }
        }
      })
      const simpan = await wb.xlsx.writeBuffer()
      const reader = new FileReader()
      reader.readAsDataURL(new Blob([simpan]))
      reader.onloadend = async function () {
        FileSaver.saveAs(new Blob([simpan]), `${naFile}.xlsx`)
      }
    }
    return { ...toRefs(dt), toDown, jdlRkp, lihat, rkpJam, total, gantiCab, perDiv }
  },
  watch: {
    counter: function (v) {
      // if (v % 5000 === 0) {
      this.lihat()
      // }
    }
  }
}
</script>
