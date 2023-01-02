/* eslint-disable vue/no-side-effects-in-computed-properties */
<template>
  <q-page padding>
    <div class="row q-col-gutter-sm q-py-sm">
          <q-chip color="blue-6" class="text-white text-bold shadow-3" clickable>Periode : {{ tgl && tgl.from ? tgl.from + ' ~ ' + tgl.to : tgl }}
            <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
              <q-date range v-model="tgl" @input="(x) => x && (lihat(),$refs.qDateProxy.hide())" mask="YYYY-MM-DD" lazy-rules/>
            </q-popup-proxy>
          </q-chip>
          <q-select
            class="q-ml-sm"
            v-if="['MAN','acc','purchase', 'mitra', 'admin'].some(a => a== $store.state.auth.user.userType)"
            v-model="divisi"
            :options="divCab"
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
          <q-toggle v-model="filt.ancab" color="deep-orange-6" keep-color label="Antar Cabang" @input="lihat"/>
    </div>
    <profitloss :filt="filt"  v-if="filt.kodeCab.length && ['acc', 'mitra', 'investor', 'MAN'].some(a => a === $store.state.auth.user.userType)"/>
    <div class="row q-col-gutter-sm q-py-sm">
      <div class="column col-md-6 col-xs-12">
        <div class="q-py-md" >
          <umurHP :filt="filt" jnsHP="P" class="fit" v-if="filt.kodeCab.length" ukuran="mini"/>
        </div>
        <div class="q-py-md">
          <umurHP :filt="filt" jnsHP="H" class="fit" v-if="filt.kodeCab.length" ukuran="mini"/>
        </div>
      </div>
      <div class="column col-md-6 col-xs-12">
        <saldoKas :filt="filt" v-if="filt.kodeCab.length" class="fit"/>
      </div>
      <div class="col-xs-12 col-md-6 col-xl-3" v-if="['MAN', 'acc'].some(a => a === $store.state.auth.user.userType) && divisi === 'ASI'">
        <q-card class="fit">
          <q-card-section
            style="background: linear-gradient(to left, transparent,rgba(10, 255,175,0.8))">
            <q-chip>{{ rkpPusat.judul }}</q-chip>
          </q-card-section>
          <q-separator />
          <q-list dense>
            <q-item>
              <q-item-section>
                <q-item-label>Qty Penjualan</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption>
                  <q-chip outline color="primary">{{ rkpPusat.qty | nomer }}</q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label>Pencapaian</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption>
                  <q-chip outline color="primary">{{ rkpPusat.nilaiPencapaian | nomer }}</q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label>Omzet</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption>
                  <q-chip outline color="primary">{{ rkpPusat.jmlHarga | nomer }}</q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label>Nilai Point Member</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption>
                  <q-chip outline color="primary">{{ rkpPusat.pointMember | nomer }}</q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label>Profit</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption>
                  <q-chip outline color="primary">{{ rkpPusat.laba | nomer }}</q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
      <div class="col-xs-12 col-md-6 col-xl-3" v-if="divisi === 'ASI'">
        <q-card class="fit">
          <q-card-section
            style="background: linear-gradient(to left, transparent,rgba(100, 255, 125,0.8))">
            <q-chip>{{ rkpOutlet.judul }}</q-chip>
          </q-card-section>
          <q-separator />
          <q-list dense>
            <q-item>
              <q-item-section>
                <q-item-label>Qty Penjualan</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption>
                  <q-chip outline color="primary">{{ rkpOutlet.qty | nomer }}</q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label>Pencapaian</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption>
                  <q-chip outline color="primary">{{ rkpOutlet.nilaiPencapaian | nomer }}</q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label>Omzet</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption>
                  <q-chip outline color="primary">{{ rkpOutlet.jmlHarga | nomer }}</q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label>Nilai Point Member</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption>
                  <q-chip outline color="primary">{{ rkpOutlet.pointMember | nomer }}</q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label>Profit</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption>
                  <q-chip outline color="primary">{{ rkpOutlet.laba | nomer }}</q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
      <div class="col-xs-12 col-md-6 col-xl-3">
        <Persediaan :filt="filt"/>
      </div>
    </div>
    <div class="row q-col-gutter-sm q-py-sm">
      <div class="col-xs-12 col-md-6 col-xl-4">
        <q-markup-table wrap-cells>
          <thead>
            <tr class="bg-teal-13">
              <th colspan="7">
                <div class="row no-wrap items-center">
                  <span class="text-h6 q-ml-md">Top Ten Kategori Produk</span>
                  <div class="q-gutter-sm">
                    <q-radio v-model="urut" val="margin" label="Margin" color="pink-3" />
                    <q-radio v-model="urut" val="jmlHarga" label="Omzet" color="yellow-3" />
                  </div>
                </div>
              </th>
            </tr>
            <q-tr>
              <q-th align="left">No.</q-th>
              <q-th align="left">Kategori</q-th>
              <q-th align="right">Qty</q-th>
              <q-th align="right">Omzet</q-th>
              <q-th align="right">Margin</q-th>
              <q-th align="right">Point Member</q-th>
            </q-tr>
          </thead>
          <tbody>
            <q-tr v-for="(a, i) in perKate" :key="i">
              <template v-if="i < 10">
                <q-td>{{ i + 1 }}</q-td>
                <q-td>{{ a.kategoriProduk }}</q-td>
                <q-td align="right">{{ a.qty | nomer }}</q-td>
                <q-td align="right">{{ a.jmlHarga | nomer }}</q-td>
                <q-td align="right">{{ (a.jmlHarga - a.hpp - a.pointMember) | nomer }}</q-td>
                <q-td align="right">{{ a.pointMember | nomer }}</q-td>
              </template>
            </q-tr>
          </tbody>
        </q-markup-table>
      </div>
      <div class="col-xs-12 col-md-6 col-xl-4">
        <q-markup-table wrap-cells>
          <thead>
            <tr class="bg-teal-13">
              <th colspan="5">
                <div class="row no-wrap items-center">
                  <span class="text-h6 q-ml-md">Top Ten Customers</span>
                  <div class="q-gutter-sm">
                    <q-radio v-model="topCust" val="margin" label="Margin" color="pink-3" />
                    <q-radio v-model="topCust" val="jmlHarga" label="Omzet" color="yellow-3" />
                  </div>
                </div>
              </th>
            </tr>
            <q-tr>
              <q-th align="left">No.</q-th>
              <q-th align="left">Nama Customers</q-th>
              <q-th align="right">Qty</q-th>
              <q-th align="right">Omzet</q-th>
              <q-th align="right">Margin</q-th>
            </q-tr>
          </thead>
          <tbody>
            <q-tr v-for="(a, i) in RcustTopTen" :key="i">
              <template v-if="i < 10">
                <q-td>{{ i + 1 }}</q-td>
                <q-td>{{ a.namaCust }}</q-td>
                <q-td align="right">{{ a.qty | nomer }}</q-td>
                <q-td align="right">{{ a.jmlHarga | nomer }}</q-td>
                <q-td align="right">{{ a.margin | nomer }}</q-td>
              </template>
            </q-tr>
          </tbody>
        </q-markup-table>
      </div>
      <div class="col-xs-12 col-md-5 col-xl-4">
        <!-- <radar :labels="labels" :datasets="datasets" type="line" :title="chart" class="bg-cyan-13"></radar> -->
        <q-markup-table wrap-cells>
          <thead>
            <tr class="bg-teal-13">
              <th colspan="6">
                <div class="row no-wrap items-center">
                  <span class="text-h6 q-ml-md">Pencapaian Sales</span>
                  <div class="q-gutter-sm">
                    <q-radio v-model="topSales" val="margin" label="Margin" color="pink-3" />
                    <q-radio v-model="topSales" val="jmlHarga" label="Omzet" color="yellow-3" />
                    <q-radio v-model="topSales" val="nilaiPencapaian" label="Pencapaian" color="yellow-3" />
                  </div>
                </div>
              </th>
            </tr>
            <q-tr>
              <q-th align="left">No.</q-th>
              <q-th align="left">Nama Karyawan</q-th>
              <q-th align="right">Omzet</q-th>
              <q-th align="right">Qty</q-th>
              <q-th align="right">Margin</q-th>
              <q-th align="right">Pencapaian</q-th>
            </q-tr>
          </thead>
          <tbody>
            <q-tr v-for="(a, i) in RdataPerSales" :key="i">
              <template v-if="i < 10">
                <q-td>{{ i + 1 }}</q-td>
                <q-td>{{ a.namaKaryawan }}</q-td>
                <q-td align="right">{{ a.jmlHarga | nomer }}</q-td>
                <q-td align="right">{{ a.qty | nomer }}</q-td>
                <q-td align="right">{{ a.margin | nomer }}</q-td>
                <q-td align="right">{{ a.nilaiPencapaian | nomer }}</q-td>
              </template>
            </q-tr>
          </tbody>
        </q-markup-table>
      </div>
    </div>
    <!-- <div class="row q-col-gutter-sm q-py-sm justify-between">
      <div class="col-xs-12 col-md-6 col-xl-3" v-if="datasetk.length">
        <donut :labels="labelk" :datasets="datasetk" type="donut" :title="{text: 'Omzet Per Kategori'}" class="bg-cyan-13"></donut>
      </div>
      <div class="col-xs-12 col-md-6 col-xl-3" v-if="datasett.length">
        <garis :labels="labelt" :datasets="datasett" type="area" :title="{text: 'Omzet Penjualan'}" class="bg-teal-13"></garis>
      </div>
    </div> -->
    <div class="q-pa-xs col-xs-12">
    <q-table
      class="dataTrx2"
      :data="RrkpTgl"
      separator="cell"
      row-key="tanggal"
      :pagination="{ rowsPerPage: 0 }"
      :loading="lodingRkp"
      hide-bottom
    >
    <template v-slot:loading>
      <q-inner-loading showing color="primary" />
    </template>
      <template v-slot:top-right>
        <q-btn
          v-if="RrkpTgl.length"
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
          <template v-if="RrkpTgl.length">
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
          <template v-if="RrkpTgl.length">
            <q-th v-for="(s, a, i) in RrkpTgl[0]" :key="i" :class="(i % 2) === 0 && 'bg-teal-13'">
              <template v-if="i === 0">
                Total
              </template>
              <template v-else>
                {{ RrkpTgl.reduce((b, c) => b + c[a], 0) | nomer }}
              </template>
            </q-th>
          </template>
        </q-tr>
      </template>
    </q-table>
  </div>
  </q-page>
</template>

<script>
import Excel from 'exceljs'
import FileSaver from 'file-saver'
/* import donut from '../components/chart/donutChart'
import garis from '../components/chart/ApexLine' */
import profitloss from '../components/Dashboard/ProfitLoss.vue'
import saldoKas from '../components/Dashboard/saldoKasBank.vue'
import umurHP from '../components/Dashboard/umurHP.vue'
import Persediaan from '../components/Dashboard/persediaan.vue'
import { computed, reactive, toRefs, watch } from '@vue/composition-api'
import { company, dtCab, rkpAllsales, rkpPerKategori, rkpPricing, rkpTransaksi } from '../services/apiList'
export default {
  components: { profitloss, saldoKas, umurHP, Persediaan },
  setup (props, { root, refs }) {
    const dt = reactive({
      labels: [],
      datasets: [{ data: [] }],
      options: {},
      filt: {
        allCab: false,
        kodeCab: [root.$store.state.auth.user.kodeCab],
        tgla: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        jnsTrx: 'J',
        ancab: false
      },
      inRul: [ v => !!v || 'Isi data' ],
      cabAll: [],
      chart: {
        ada: false,
        text: 'Pencapaian Sales',
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
      labelp: [],
      datasetp: [],
      custTopTen: [],
      topCust: 'jmlHarga',
      dataPerSales: [],
      topSales: 'nilaiPencapaian',
      urut: 'margin',
      divCab: [],
      divisi: '',
      dtComp: [],
      tgl: {
        from: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        to: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
      },
      lodingRkp: false,
      rkpTgl: []
    })
    company()
      .then(({ data }) => {
        dt.dtComp = data
      })
    dtCab()
      .then(({ data }) => {
        // dt.filt.kodeCab = data.map(a => a.kodeCab)
        const pegang = root.$store.state.auth.user.cabGrup || root.$q.cookies.get('cabGrup')
        dt.cabAll = data.filter(a => pegang.some(s => s === a.kodeCab))
        let st = new Set(dt.cabAll.map(a => a.compCode))
        dt.divisi = '' // [...st]
        dt.divCab = dt.dtComp.filter(a => st.has(a.compCode))
        // dt.filt.kodeCab = pegang
        lihat()
      })
    const lihat = () => {
      dt.filt.tgla = dt.tgl && dt.tgl.from ? dt.tgl.from : dt.tgl || new Date()
      dt.filt.tglb = dt.tgl && dt.tgl.from ? dt.tgl.to : dt.tgl || new Date()
      if (dt.filt.kodeCab.length) {
        rkpAllsales(dt.filt)
          .then(({ data }) => {
            const perNama = [...new Set(data.map(a => a.namaKaryawan))]
            const rkp = perNama.map((a, i) => {
              return {
                namaKaryawan: a,
                nilaiPencapaian: data.filter(s => s.namaKaryawan === a).reduce((j, m) => root.$dwn.jumlah([j, m.nilaiPencapaian]), 0),
                jmlHarga: data.filter(s => s.namaKaryawan === a).reduce((j, m) => root.$dwn.jumlah([j, m.jmlHarga]), 0),
                margin: data.filter(s => s.namaKaryawan === a).reduce((j, m) => root.$dwn.jumlah([j, m.jmlHarga, -m.hpp, -m.pointMember]), 0),
                qty: data.filter(s => s.namaKaryawan === a).reduce((j, m) => root.$dwn.jumlah([j, m.qty]), 0),
                qtyP: data.filter(s => s.namaKaryawan === a).reduce((j, m) => root.$dwn.jumlah([j, m.qty]), 0),
                jmlHargaP: data.filter(s => s.namaKaryawan === a).reduce((j, m) => root.$dwn.jumlah([j, m.jmlHargaP]), 0)
                // divisiTujuan: dt.cabAll.find(c => c.kodeCab === data.filter(s => s.namaKaryawan === a)[0].tujuan).compCode
              }
            })
            const dta = rkp/* .sort(function (a, b) {
              return b[dt.topSales] - a[dt.topSales]
            }) */
            dt.dataPerSales = dta
            dt.labels = dta.filter((a, i) => i < 10).map(a => a.namaKaryawan)
            dt.datasets = [{
              name: 'Pencapaian',
              data: dta.filter((a, i) => i < 10).map(s => s.nilaiPencapaian),
              type: 'bar'
            },
            {
              name: 'Omzet',
              data: dta.filter((a, i) => i < 10).map(s => s.jmlHarga),
              type: 'line'
            }]
            dt.chart.ada = true
          })
        rkpPerKategori(dt.filt)
          .then(({ data }) => {
            data.map(a => {
              a.margin = root.$dwn.jumlah([a.jmlHarga, -a.hpp, -a.pointMember])
              return a
            })
            dt.labelk = data.map(a => a.kategoriProduk)
            dt.datasetk = data.map(s => s.jmlHarga)
            dt.perKate = data
          })
        rkpTransaksi(dt.filt)
          .then(({ data }) => {
            const rk = [...new Set(data.map(a => a.tglKirim.slice(0, 10)))]
            rk.sort((a, b) => new Date(a).valueOf() - new Date(b).valueOf())
            dt.labelt = [...rk]
            const rkp = rk.map((a, i) => {
              return data.filter(s => s.tglKirim === a).reduce((j, m) => j + root.$dwn.jumlah([m.jmlHarga, -m.jmlHargaR]), 0)
            })
            dt.datasett = [
              {
                name: 'Laporan Penjualan',
                data: rkp
              }
            ]
            // rekap per tanggal dan outlet
            dt.rkpTgl = []
            dt.lodingRkp = true
            const perCab = dt.filt.kodeCab
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
            const rkpAsi = data
            // per kodePartner
            const kdCust = [...new Set(data.map(a => a.kodePartner))]
            const rkCust = kdCust.map(a => {
              let d = {
                kodePartner: a,
                namaCust: data.find(s => s.kodePartner === a).namaCust,
                qty: data.filter(s => s.kodePartner === a).reduce((b, c) => root.$dwn.jumlah([b, c.qty]), 0),
                jmlHarga: data.filter(s => s.kodePartner === a).reduce((b, c) => root.$dwn.jumlah([b, c.jmlHarga, -c.jmlHargaR]), 0),
                margin: data.filter(s => s.kodePartner === a).reduce((b, c) => root.$dwn.jumlah([b, c.jmlHarga, -c.hpp, -c.jmlHargaR, c.hppR, -c.pointMember]), 0)
              }
              return d
            })
            dt.custTopTen = rkCust.filter(a => a.kodePartner)/* .sort(function (a, b) {
              return b[dt.topCust] - a[dt.topCust]
            }) */
            dt.rkpASI = {
              judul: 'Omzet',
              qty: rkpAsi.reduce((b, c) => root.$dwn.jumlah([b, c.qty]), 0),
              jmlHarga: rkpAsi.reduce((b, c) => root.$dwn.jumlah([b, c.jmlHarga, -c.jmlHargaR]), 0),
              hpp: rkpAsi.reduce((b, c) => root.$dwn.jumlah([b, c.hpp, -c.hppR]), 0),
              nilaiPencapaian: rkpAsi.reduce((b, c) => root.$dwn.jumlah([b, c.nilaiPencapaian]), 0),
              pointMember: rkpAsi.reduce((b, c) => root.$dwn.jumlah([b, c.pointMember]), 0),
              cashBack: rkpAsi.reduce((b, c) => root.$dwn.jumlah([b, c.cashBack]), 0),
              laba: rkpAsi.reduce((b, c) => root.$dwn.jumlah([b, c.jmlHarga, -c.hpp, -c.jmlHargaR, c.hppR, -c.pointMember]), 0)
            }
            dt.rkpPusat = {
              judul: 'Omzet Pusat',
              qty: rkpAsi.filter(a => a.asal === 'MP01').reduce((b, c) => root.$dwn.jumlah([b, c.qty]), 0),
              jmlHarga: rkpAsi.filter(a => a.asal === 'MP01').reduce((b, c) => root.$dwn.jumlah([b, c.jmlHarga, -c.jmlHargaR]), 0),
              hpp: rkpAsi.filter(a => a.asal === 'MP01').reduce((b, c) => root.$dwn.jumlah([b, c.hpp, -c.hppR]), 0),
              nilaiPencapaian: rkpAsi.filter(a => a.asal === 'MP01').reduce((b, c) => root.$dwn.jumlah([b, c.nilaiPencapaian]), 0),
              pointMember: rkpAsi.filter(a => a.asal === 'MP01').reduce((b, c) => root.$dwn.jumlah([b, c.pointMember]), 0),
              cashBack: rkpAsi.filter(a => a.asal === 'MP01').reduce((b, c) => root.$dwn.jumlah([b, c.cashBack]), 0),
              laba: rkpAsi.filter(a => a.asal === 'MP01').reduce((b, c) => root.$dwn.jumlah([b, c.jmlHarga, -c.hpp, -c.jmlHargaR, c.hppR, -c.pointMember]), 0)
            }
            dt.rkpOutlet = {
              judul: 'Omzet Outlet',
              qty: rkpAsi.filter(a => a.asal !== 'MP01').reduce((b, c) => root.$dwn.jumlah([b, c.qty]), 0),
              jmlHarga: rkpAsi.filter(a => a.asal !== 'MP01').reduce((b, c) => root.$dwn.jumlah([b, c.jmlHarga, -c.jmlHargaR]), 0),
              hpp: rkpAsi.filter(a => a.asal !== 'MP01').reduce((b, c) => root.$dwn.jumlah([b, c.hpp, -c.hppR]), 0),
              nilaiPencapaian: rkpAsi.filter(a => a.asal !== 'MP01').reduce((b, c) => root.$dwn.jumlah([b, c.nilaiPencapaian]), 0),
              pointMember: rkpAsi.filter(a => a.asal !== 'MP01').reduce((b, c) => root.$dwn.jumlah([b, c.pointMember]), 0),
              cashBack: rkpAsi.filter(a => a.asal !== 'MP01').reduce((b, c) => root.$dwn.jumlah([b, c.cashBack]), 0),
              laba: rkpAsi.filter(a => a.asal !== 'MP01').reduce((b, c) => root.$dwn.jumlah([b, c.jmlHarga, -c.hpp, -c.jmlHargaR, c.hppR, -c.pointMember]), 0)
            }
          })
        rkpPricing(dt.filt)
          .then(({ data }) => {
            dt.labelp = ['Baru', 'Disetujui', 'Deal', 'Realisasi']
            dt.datasetp = [{
              name: 'Status Pricing',
              data: dt.labelp.map(a => {
                const aaa = a === 'Realisasi' ? data.filter(s => s.nomorBukti !== null).length : data.filter(s => s.status === a).length
                return aaa
              }),
              type: 'bar'
            }]
          })
      } else {
        root.$q.notify({ message: 'Pilih cabang dulu...', color: 'pink-3' })
      }
    }
    const gantiCab = (x) => {
      dt.filt.kodeCab = []
      if (x) {
        dt.filt.kodeCab = dt.cabAll.filter(a => dt.divisi === a.compCode).map(a => a.kodeCab)
        dt.filt.allCab = true
        lihat()
      } else {
        dt.filt.kodeCab = []
        dt.rkpTgl = []
        // dt.divisi = []
      }
    }
    watch(() => root.$store.state.auth.setCabang, (val) => {
      dt.filt.kodeCab = [val]
      dt.filt.allCab = false
      lihat()
    })
    watch(() => dt.urut, (srt) => {
      dt.perKate.sort(function (a, b) {
        return b[srt] - a[srt]
      })
    })
    const RrkpTgl = computed(() => {
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      return dt.rkpTgl.sort(function (a, b) {
        return new Date(b.tanggal).valueOf() - new Date(a.tanggal).valueOf()
      })
    })
    const RcustTopTen = computed(() => {
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      return dt.custTopTen.sort((a, b) => {
        return b[dt.topCust] - a[dt.topCust]
      })
    })
    const RdataPerSales = computed(() => {
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      return dt.dataPerSales.sort((a, b) => {
        return b[dt.topSales] - a[dt.topSales]
      })
    })
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
    const jdl = computed(() => {
      let data = [
        { name: 'tanggal', label: 'Tanggal', sortable: true, sort: (a, b) => new Date(b).valueOf() - new Date(a).valueOf() }
      ]
      return data
    })
    return { ...toRefs(dt), lihat, gantiCab, RcustTopTen, RdataPerSales, jdlRkp, toDown, RrkpTgl, jdl }
  }
}
</script>
