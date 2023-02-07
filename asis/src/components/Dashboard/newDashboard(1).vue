<template>
  <q-page padding>
    <div class="col-md-12">
      <div
        class="row q-col-gutter-sm  q-py-sm q-px-md q-mt-md"
        style="width: 100%"
      >
        <q-btn
          color="cyan-8"
          class="text-white text-bold shadow-3 q-mt-md"
          clickable
          >Periode :
          {{ tgl && tgl.from ? tgl.from + " ~ " + tgl.to : tgl }}
          <q-popup-proxy
            ref="qDateProxy"
            transition-show="scale"
            transition-hide="scale"
          >
            <q-date
              range
              v-model="tgl"
              color="red-7"
              @input="x => x && (lihat(), $refs.qDateProxy.hide())"
              mask="YYYY-MM-DD"
              lazy-rules
            />
          </q-popup-proxy>
        </q-btn>
        <q-select
          class="q-ml-sm float-right"
          v-if="
            ['MAN', 'acc', 'purchase', 'mitra', 'admin'].some(
              a => a == $store.state.auth.user.userType
            )
          "
          v-model="divisi"
          :options="dtComp"
          :option-label="item => item && item.compCode + ' ' + item.compName"
          option-value="compCode"
          emit-value
          map-options
          style="min-width: 250px; max-width: 250px"
          label="Divisi... "
          @input="gantiCab"
          dense
          lazy-rules
        />
        <q-select
          class="q-ml-sm"
          v-if="
            ['MAN', 'acc', 'purchase', 'mitra', 'admin'].some(
              a => a == $store.state.auth.user.userType
            )
          "
          v-model="filt.kodeCab"
          :options="cabAll.filter(a => divisi === a.compCode)"
          :option-label="item => item && item.kodeCab + ' ' + item.namaCabang"
          option-value="kodeCab"
          option-dense
          emit-value
          map-options
          multiple
          style="min-width: 250px; max-width: 550px"
          label="Pilih cabang... "
          dense
          @input="lihat()"
          lazy-rules
        >
          <template v-slot:option="scope">
            <q-item dense v-bind="scope.itemProps" v-on="scope.itemEvents">
              <q-item-section>
                <q-item-label>
                  {{ scope.opt.kodeCab }} {{ scope.opt.namaCabang }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-checkbox
                  v-model="filt.kodeCab"
                  :val="scope.opt.kodeCab"
                  @input="lihat()"
                />
              </q-item-section>
            </q-item>
          </template>
          <template v-slot:selected>
            {{ filt.kodeCab.length }} cabang
          </template>
        </q-select>
        <q-toggle
          v-model="filt.allCab"
          label="Pilih semua..."
          @input="gantiCab(filt.allCab)"
        />
      </div>
      <profitloss :filt="filt" v-if="filt.kodeCab.length" />
      <div class="row q-col-gutter-sm q-py-sm">
        <div class="column col-md-6 col-xs-12">
          <div>
            <umurHP
              :filt="filt"
              jnsHP="P"
              class="fit"
              v-if="filt.kodeCab.length"
            />
          </div>
          <div>
            <umurHP
              :filt="filt"
              jnsHP="H"
              class="fit"
              v-if="filt.kodeCab.length"
            />
          </div>
        </div>
        <div class="column col-md-6 col-xs-12">
          <saldoKas :filt="filt" v-if="filt.kodeCab.length" />
        </div>
        <div
          class="col-xs-12 col-md-6 col-xl-3"
          v-if="['MAN', 'acc'].some(a => a === $store.state.auth.user.userType)"
        >
          <q-card class="fit">
            <q-card-section
              style="background: linear-gradient(to left, transparent,rgba(10, 255,175,0.8))"
            >
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
                    <q-chip outline color="primary">{{
                      rkpPusat.qty | nomer
                    }}</q-chip>
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label>Pencapaian</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label caption>
                    <q-chip outline color="primary">{{
                      rkpPusat.nilaiPencapaian | nomer
                    }}</q-chip>
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label>Omzet</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label caption>
                    <q-chip outline color="primary">{{
                      rkpPusat.jmlHarga | nomer
                    }}</q-chip>
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label>Nilai Point Member</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label caption>
                    <q-chip outline color="primary">{{
                      rkpPusat.pointMember | nomer
                    }}</q-chip>
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label>Profit</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label caption>
                    <q-chip outline color="primary">{{
                      rkpPusat.laba | nomer
                    }}</q-chip>
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </div>
        <div class="col-xs-12 col-md-6 col-xl-3">
          <q-card class="fit">
            <q-card-section
              style="background: linear-gradient(to left, transparent,rgba(100, 255, 125,0.8))"
            >
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
                    <q-chip outline color="primary">{{
                      rkpOutlet.qty | nomer
                    }}</q-chip>
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label>Pencapaian</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label caption>
                    <q-chip outline color="primary">{{
                      rkpOutlet.nilaiPencapaian | nomer
                    }}</q-chip>
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label>Omzet</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label caption>
                    <q-chip outline color="primary">{{
                      rkpOutlet.jmlHarga | nomer
                    }}</q-chip>
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label>Nilai Point Member</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label caption>
                    <q-chip outline color="primary">{{
                      rkpOutlet.pointMember | nomer
                    }}</q-chip>
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label>Profit</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label caption>
                    <q-chip outline color="primary">{{
                      rkpOutlet.laba | nomer
                    }}</q-chip>
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
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
                      <q-radio
                        v-model="urut"
                        val="margin"
                        label="Margin"
                        color="pink-3"
                      />
                      <q-radio
                        v-model="urut"
                        val="jmlHarga"
                        label="Omzet"
                        color="yellow-3"
                      />
                    </div>
                  </div>
                </th>
              </tr>
              <q-tr>
                <q-th align="left">No.</q-th>
                <q-th align="left">Kategori</q-th>
                <q-th align="right">Qty</q-th>
                <q-th align="right">Omzet</q-th>
                <q-th align="right">Hpp</q-th>
                <q-th align="right">Point Member</q-th>
                <q-th align="right">Margin</q-th>
              </q-tr>
            </thead>
            <tbody>
              <q-tr v-for="(a, i) in RperKate" :key="i">
                <template v-if="i < 10">
                  <q-td>{{ i + 1 }}</q-td>
                  <q-td>{{ a.kategoriProduk }}</q-td>
                  <q-td align="right">{{ a.qty | nomer }}</q-td>
                  <q-td align="right">{{ a.jmlHarga | nomer }}</q-td>
                  <q-td align="right">{{ a.hpp | nomer }}</q-td>
                  <q-td align="right">{{ a.pointMember | nomer }}</q-td>
                  <q-td align="right">{{
                    (a.jmlHarga - a.hpp - a.pointMember) | nomer
                  }}</q-td>
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
                      <q-radio
                        v-model="topCust"
                        val="margin"
                        label="Margin"
                        color="pink-3"
                      />
                      <q-radio
                        v-model="topCust"
                        val="jmlHarga"
                        label="Omzet"
                        color="yellow-3"
                      />
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
                      <q-radio
                        v-model="topSales"
                        val="margin"
                        label="Margin"
                        color="pink-3"
                      />
                      <q-radio
                        v-model="topSales"
                        val="jmlHarga"
                        label="Omzet"
                        color="yellow-3"
                      />
                      <q-radio
                        v-model="topSales"
                        val="nilaiPencapaian"
                        label="Pencapaian"
                        color="yellow-3"
                      />
                    </div>
                    <q-toggle
                      v-model="filt.ancab"
                      label="Antar Cabang"
                      @input="lihat"
                    />
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
      <div class="row q-col-gutter-sm q-py-sm justify-between">
        <div class="col-xs-12 col-md-6 col-xl-3" v-if="datasetk.length">
          <donut
            :labels="labelk"
            :datasets="datasetk"
            type="donut"
            :title="{ text: 'Omzet Per Kategori' }"
            class="bg-cyan-13"
          ></donut>
        </div>
        <div class="col-xs-12 col-md-6 col-xl-3" v-if="datasett.length">
          <garis
            :labels="labelt"
            :datasets="datasett"
            type="area"
            :title="{ text: 'Omzet Penjualan' }"
            class="bg-teal-13"
          ></garis>
        </div>
      </div>
    </div>
  </q-page>
</template>
<script>
import donut from '../components/chart/donutChart'
// import radar from '../components/chart/ApexRadar'
import garis from '../components/chart/ApexLine'
import profitloss from '../components/Dashboard/ProfitLoss.vue'
import saldoKas from '../components/Dashboard/saldoKasBank.vue'
import umurHP from '../components/Dashboard/umurHP.vue'
import { computed, reactive, toRefs, watch } from '@vue/composition-api'
import {
  company,
  dtCab,
  rkpAllsales,
  rkpPerKategori,
  rkpPricing,
  rkpTransaksi
} from '../services/apiList'
export default {
  components: { donut, garis, profitloss, saldoKas, umurHP },
  setup (props, { root, refs }) {
    const dt = reactive({
      labels: [],
      datasets: [{ data: [] }],
      options: {},
      filt: {
        allCab: false,
        kodeCab: [root.$store.state.auth.user.kodeCab],
        tgla:
          new Date()
            .toLocaleString('sv', { timeZoneName: 'short' })
            .slice(0, 8) + '01',
        tglb: new Date()
          .toLocaleString('sv', { timeZoneName: 'short' })
          .slice(0, 10),
        jnsTrx: 'J',
        ancab: false
      },
      inRul: [v => !!v || 'Isi data'],
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
        from:
          new Date()
            .toLocaleString('sv', { timeZoneName: 'short' })
            .slice(0, 8) + '01',
        to: new Date()
          .toLocaleString('sv', { timeZoneName: 'short' })
          .slice(0, 10)
      }
    })
    company().then(({ data }) => {
      dt.dtComp = data
    })
    dtCab().then(({ data }) => {
      // dt.filt.kodeCab = data.map(a => a.kodeCab)
      const pegang =
        root.$store.state.auth.user.cabGrup || root.$q.cookies.get('cabGrup')
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
        rkpAllsales(dt.filt).then(({ data }) => {
          const perNama = [...new Set(data.map(a => a.namaKaryawan))]
          const rkp = perNama.map((a, i) => {
            return {
              namaKaryawan: a,
              nilaiPencapaian: data
                .filter(s => s.namaKaryawan === a)
                .reduce((j, m) => j + m.nilaiPencapaian, 0),
              jmlHarga: data
                .filter(s => s.namaKaryawan === a)
                .reduce((j, m) => j + m.jmlHarga, 0),
              margin: data
                .filter(s => s.namaKaryawan === a)
                .reduce((j, m) => j + (m.jmlHarga - m.hpp - m.pointMember), 0),
              qty: data
                .filter(s => s.namaKaryawan === a)
                .reduce((j, m) => j + m.qty, 0)
              // divisiTujuan: dt.cabAll.find(c => c.kodeCab === data.filter(s => s.namaKaryawan === a)[0].tujuan).compCode
            }
          })
          const dta = rkp /* .sort(function (a, b) {
              return b[dt.topSales] - a[dt.topSales]
            }) */
          dt.dataPerSales = dta
          dt.labels = dta.filter((a, i) => i < 10).map(a => a.namaKaryawan)
          dt.datasets = [
            {
              name: 'Pencapaian',
              data: dta.filter((a, i) => i < 10).map(s => s.nilaiPencapaian),
              type: 'bar'
            },
            {
              name: 'Omzet',
              data: dta.filter((a, i) => i < 10).map(s => s.jmlHarga),
              type: 'line'
            }
          ]
          dt.chart.ada = true
        })
        rkpPerKategori(dt.filt).then(({ data }) => {
          data.map(a => {
            a.margin = root.$dwn.jumlah([a.jmlHarga, -a.hpp, -a.pointMember])
            return a
          })
          dt.labelk = data.map(a => a.kategoriProduk)
          dt.datasetk = data.map(s => s.jmlHarga)
          dt.perKate = data
        })
        rkpTransaksi(dt.filt).then(({ data }) => {
          const rk = [...new Set(data.map(a => a.tglKirim))]
          dt.labelt = [...rk]
          const rkp = rk.map((a, i) => {
            return data
              .filter(s => s.tglKirim === a)
              .reduce(
                (j, m) => j + root.$dwn.jumlah([m.jmlHarga, -m.jmlHargaR]),
                0
              )
          })
          dt.datasett = [
            {
              name: 'Laporan Penjualan',
              data: rkp
            }
          ]
          const rkpAsi = data
          // per kodePartner
          const kdCust = [
            ...new Set(
              data
                .filter(s => s.compID === root.$store.state.auth.user.compCode)
                .map(a => a.kodePartner)
            )
          ]
          const rkCust = kdCust.map(a => {
            let d = {
              kodePartner: a,
              namaCust: data.find(s => s.kodePartner === a).namaCust,
              qty: data
                .filter(s => s.kodePartner === a)
                .reduce((b, c) => root.$dwn.jumlah([b, c.qty]), 0),
              jmlHarga: data
                .filter(s => s.kodePartner === a)
                .reduce(
                  (b, c) => root.$dwn.jumlah([b, c.jmlHarga, -c.jmlHargaR]),
                  0
                ),
              margin: data
                .filter(s => s.kodePartner === a)
                .reduce(
                  (b, c) =>
                    root.$dwn.jumlah([
                      b,
                      c.jmlHarga,
                      -c.hpp,
                      -c.jmlHargaR,
                      c.hppR,
                      -c.pointMember
                    ]),
                  0
                )
            }
            return d
          })
          dt.custTopTen = rkCust.filter(
            a => a.kodePartner
          ) /* .sort(function (a, b) {
              return b[dt.topCust] - a[dt.topCust]
            }) */
          dt.rkpASI = {
            judul: 'Omzet',
            qty: rkpAsi.reduce((b, c) => root.$dwn.jumlah([b, c.qty]), 0),
            jmlHarga: rkpAsi.reduce(
              (b, c) => root.$dwn.jumlah([b, c.jmlHarga, -c.jmlHargaR]),
              0
            ),
            hpp: rkpAsi.reduce(
              (b, c) => root.$dwn.jumlah([b, c.hpp, -c.hppR]),
              0
            ),
            nilaiPencapaian: rkpAsi.reduce(
              (b, c) => root.$dwn.jumlah([b, c.nilaiPencapaian]),
              0
            ),
            pointMember: rkpAsi.reduce(
              (b, c) => root.$dwn.jumlah([b, c.pointMember]),
              0
            ),
            cashBack: rkpAsi.reduce(
              (b, c) => root.$dwn.jumlah([b, c.cashBack]),
              0
            ),
            laba: rkpAsi.reduce(
              (b, c) =>
                root.$dwn.jumlah([
                  b,
                  c.jmlHarga,
                  -c.hpp,
                  -c.jmlHargaR,
                  c.hppR,
                  -c.pointMember
                ]),
              0
            )
          }
          dt.rkpPusat = {
            judul: 'Omzet Pusat',
            qty: rkpAsi
              .filter(a => a.asal === 'MP01')
              .reduce((b, c) => root.$dwn.jumlah([b, c.qty]), 0),
            jmlHarga: rkpAsi
              .filter(a => a.asal === 'MP01')
              .reduce(
                (b, c) => root.$dwn.jumlah([b, c.jmlHarga, -c.jmlHargaR]),
                0
              ),
            hpp: rkpAsi
              .filter(a => a.asal === 'MP01')
              .reduce((b, c) => root.$dwn.jumlah([b, c.hpp, -c.hppR]), 0),
            nilaiPencapaian: rkpAsi
              .filter(a => a.asal === 'MP01')
              .reduce((b, c) => root.$dwn.jumlah([b, c.nilaiPencapaian]), 0),
            pointMember: rkpAsi
              .filter(a => a.asal === 'MP01')
              .reduce((b, c) => root.$dwn.jumlah([b, c.pointMember]), 0),
            cashBack: rkpAsi
              .filter(a => a.asal === 'MP01')
              .reduce((b, c) => root.$dwn.jumlah([b, c.cashBack]), 0),
            laba: rkpAsi
              .filter(a => a.asal === 'MP01')
              .reduce(
                (b, c) =>
                  root.$dwn.jumlah([
                    b,
                    c.jmlHarga,
                    -c.hpp,
                    -c.jmlHargaR,
                    c.hppR,
                    -c.pointMember
                  ]),
                0
              )
          }
          dt.rkpOutlet = {
            judul: 'Omzet Outlet',
            qty: rkpAsi
              .filter(a => a.asal !== 'MP01')
              .reduce((b, c) => root.$dwn.jumlah([b, c.qty]), 0),
            jmlHarga: rkpAsi
              .filter(a => a.asal !== 'MP01')
              .reduce(
                (b, c) => root.$dwn.jumlah([b, c.jmlHarga, -c.jmlHargaR]),
                0
              ),
            hpp: rkpAsi
              .filter(a => a.asal !== 'MP01')
              .reduce((b, c) => root.$dwn.jumlah([b, c.hpp, -c.hppR]), 0),
            nilaiPencapaian: rkpAsi
              .filter(a => a.asal !== 'MP01')
              .reduce((b, c) => root.$dwn.jumlah([b, c.nilaiPencapaian]), 0),
            pointMember: rkpAsi
              .filter(a => a.asal !== 'MP01')
              .reduce((b, c) => root.$dwn.jumlah([b, c.pointMember]), 0),
            cashBack: rkpAsi
              .filter(a => a.asal !== 'MP01')
              .reduce((b, c) => root.$dwn.jumlah([b, c.cashBack]), 0),
            laba: rkpAsi
              .filter(a => a.asal !== 'MP01')
              .reduce(
                (b, c) =>
                  root.$dwn.jumlah([
                    b,
                    c.jmlHarga,
                    -c.hpp,
                    -c.jmlHargaR,
                    c.hppR,
                    -c.pointMember
                  ]),
                0
              )
          }
        })
        rkpPricing(dt.filt).then(({ data }) => {
          dt.labelp = ['Baru', 'Disetujui', 'Deal', 'Realisasi']
          dt.datasetp = [
            {
              name: 'Status Pricing',
              data: dt.labelp.map(a => {
                const aaa =
                  a === 'Realisasi'
                    ? data.filter(s => s.nomorBukti !== null).length
                    : data.filter(s => s.status === a).length
                return aaa
              }),
              type: 'bar'
            }
          ]
        })
      } else {
        root.$q.notify({ message: 'Pilih cabang dulu...', color: 'pink-3' })
      }
    }
    const gantiCab = x => {
      dt.filt.kodeCab = []
      if (x) {
        dt.filt.kodeCab = dt.cabAll
          .filter(a => dt.divisi === a.compCode)
          .map(a => a.kodeCab)
        dt.filt.allCab = true
        lihat()
      } else {
        dt.filt.kodeCab = []
        dt.rkpTgl = []
        // dt.divisi = []
      }
    }
    watch(
      () => root.$store.state.auth.setCabang,
      val => {
        dt.filt.kodeCab = [val]
        dt.filt.allCab = false
        lihat()
      }
    )
    const RperKate = computed(() => {
      let srt = dt.urut
      return dt.perKate.sort(function (a, b) {
        return b[srt] - a[srt]
      })
    })
    const RcustTopTen = computed(() => {
      return dt.custTopTen.sort((a, b) => {
        return b[dt.topCust] - a[dt.topCust]
      })
    })
    const RdataPerSales = computed(() => {
      return dt.dataPerSales.sort((a, b) => {
        return b[dt.topSales] - a[dt.topSales]
      })
    })
    return {
      ...toRefs(dt),
      lihat,
      gantiCab,
      RperKate,
      RcustTopTen,
      RdataPerSales
    }
  }
}
</script>
