<template>
  <div class="row q-col-gutter-sm q-py-sm justify-between" v-if="profit">
    <div class="col-xs-12 col-sm-6">
      <q-card dense class="fit" >
        <div class="text-h6 text-white q-pl-md q-pt-md bg-teal-6">Pendapatan</div>
        <q-separator />
        <q-card-section horizontal class="q-pa-md row wrap q-gutter-xs justify-between">
          <div class="col-md-5">
            <div >Year to date</div>
            <q-separator color="orange" spaced/>
            <q-input dense readonly rounded outlined color="teal" :value="new Intl.NumberFormat('en').format(Number(profit.pendapatanTahun).toFixed(0))" input-class="text-h6 text-right text-teal" label="Penjualan" />
            <q-input dense readonly rounded outlined color="orange" :value="new Intl.NumberFormat('en').format(Number(blmPos.tahun).toFixed(0))" input-class="text-h6 text-right text-orange" label="Pesanan" />
            <q-separator color="orange" spaced/>
            <!-- <div >Jml Customers</div>
            <div >Jml Transaksi</div> -->
          </div>
          <div class="col-md-5">
            <div>{{ periode }} Berjalan </div>
            <q-separator color="orange" spaced/>
            <q-input dense readonly rounded outlined color="teal" :value="new Intl.NumberFormat('en').format(Number(profit.pendapatan).toFixed(0))" input-class="text-h6 text-right text-teal" label="Penjualan" />
            <q-input dense readonly rounded outlined color="orange" :value="new Intl.NumberFormat('en').format(Number(blmPos.periode).toFixed(0))" input-class="text-h6 text-right text-orange" label="Pesanan" />
            <q-separator color="orange" spaced/>
            <div class="text-right text-brown-7">{{ jml.cust }} Pelanggan</div>
            <div class="text-right text-brown-7">{{ jml.trx }} Transaksi</div>
          </div>
        </q-card-section>
      </q-card>
    </div>
    <div class="col-xs-12 col-md-3 col-sm-6 kartu q-gutter-xs ">
      <q-card dense >
       <div class="text-h6 text-white q-pl-md q-pt-md bg-blue-6">Laba (Rugi) Kotor</div>
        <q-separator />
        <q-card-section horizontal class="q-pl-md row items-start q-gutter-xs justify-between">
          <div class="col-md-5">
            <div class="text-h7">{{ profit.pendapatanTahun - profit.hppTahun | duit }}</div>
            <div>Year to date</div>
            </div>
          <div class="col-md-5">
            <div class="text-h7 text-teal" >{{ profit.pendapatan - profit.hpp | duit }}</div>
            <div>{{ periode }} Berjalan </div>
          </div>
        </q-card-section>
      </q-card>
      <q-card dense>
        <div class="text-h6 text-white q-pl-md q-pt-md bg-red-6">Biaya Operasional</div>
        <q-separator />
        <q-card-section horizontal class="q-pl-md row items-start q-gutter-xs justify-between">
          <div class="col-md-5">
            <div class="text-h7">{{ profit.bopTahun | duit }}</div>
            <div >Year to date</div>
          </div>
          <div class="col-md-5">
            <div class="text-h7 text-pink-5 " >{{ profit.bop | duit }}</div>
            <div>{{ periode }} Berjalan </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
    <div class="col-xs-12 col-md-3 col-sm-6 kartu q-gutter-xs ">
      <q-card dense >
        <div class="text-h6 text-white q-pl-md q-pt-md bg-green-13">Laba (Rugi) Bersih</div>
        <q-separator />
        <q-card-section horizontal class="q-pa-md row items-start q-gutter-xs justify-between">
          <div class="col-md-5">
            <div class="text-h7 text-blue-5">{{ $dwn.jumlah([profit.pendapatanTahun, -profit.biayaTahun, profit.lainTahun]) | duit }}</div>
            <div >Year to date</div>
          </div>
          <div class="col-md-5">
            <div class="text-h7 text-teal" >{{ $dwn.jumlah([profit.pendapatan, -profit.biaya, profit.lain]) | duit }}</div>
            <div>{{ periode }} Berjalan </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>
<script>
import { computed, onMounted, reactive, toRefs } from '@vue/composition-api'
import { countTrx, profitloss, rkpPOnew } from '../../services/apiList'
export default ({
  props: {
    filt: {
      type: Object,
      default: () => {
        return {
          tgla: '',
          tglb: '',
          kodeCab: []
        }
      }
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      profit: null,
      jml: {
        cust: 0,
        trx: 0
      },
      blmPos: { periode: 0, tahun: 0 }
    })
    const periode = computed(() => {
      return props.filt.tgla.slice(0, 7) === props.filt.tglb.slice(0, 7) ? 'Bulan' : 'Periode'
    })
    const getProfit = (v) => {
      let x = { ...v, periode: periode }
      if (v.kodeCab.length) {
        profitloss(x)
          .then(({ data }) => {
            dt.profit = {
              pendapatanTahun: data.find(a => a.kodeGrupAkun === '3') && data.find(a => a.kodeGrupAkun === '3').tahun,
              pendapatan: data.find(a => a.kodeGrupAkun === '3') && data.find(a => a.kodeGrupAkun === '3').bulan,
              hppTahun: data.find(a => a.kodeGrupAkun === '4') && data.find(a => a.kodeGrupAkun === '4').tahun,
              hpp: data.find(a => a.kodeGrupAkun === '4') && data.find(a => a.kodeGrupAkun === '4').bulan,
              bopTahun: data.find(a => a.kodeGrupAkun === '5') && data.find(a => a.kodeGrupAkun === '5').tahun,
              bop: data.find(a => a.kodeGrupAkun === '5') && data.find(a => a.kodeGrupAkun === '5').bulan,
              biayaTahun: data.filter(a => ['4', '5'].some(s => a.kodeGrupAkun === s)).reduce((a, b) => root.$dwn.jumlah([a, b.tahun]), 0),
              biaya: data.filter(a => ['4', '5'].some(s => a.kodeGrupAkun === s)).reduce((a, b) => root.$dwn.jumlah([a, b.bulan]), 0),
              lainTahun: data.find(a => a.kodeGrupAkun === '6') && data.find(a => a.kodeGrupAkun === '6').tahun,
              lain: data.find(a => a.kodeGrupAkun === '6') && data.find(a => a.kodeGrupAkun === '6').bulan
            }
          })
        countTrx(x)
          .then(({ data }) => {
            dt.jml = data
          })
        rkpPOnew(x)
          .then(({ data }) => {
            dt.blmPos.periode = data.periode.length && data.periode.reduce((a, b) => a + b.jmlHarga, 0)
            dt.blmPos.tahun = data.tahun && data.tahun.jmlHarga
          })
      }
    }
    onMounted(() => {
      getProfit(props.filt)
    })
    return {
      ...toRefs(dt),
      getProfit,
      periode
    }
  },
  watch: {
    filt: {
      handler (v) {
        this.getProfit(v)
      },
      deep: true
    }
  }
})
</script>
<style lang="sass" scoped>
  .kartu
    min-width: 300px
    max-width: 24%
  .text-h7
    font-size: 1rem
    font-weight: 500
    line-height: 2rem
    letter-spacing: 0.0125em
</style>
