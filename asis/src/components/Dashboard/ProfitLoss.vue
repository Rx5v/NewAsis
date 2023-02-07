
<template>
  <div
    class="row q-col-gutter-sm q-py-md justify-beetween q-mt-md"
    v-if="profit"
  >
    <div class="col-md-12 q-mt-md">
      <q-card>
        <div
          class="text-h6 text-white q-pl-md q-pt-md q-pb-xl bg-teal-6"
          style="height: 100px"
        >
          Pendapatan
        </div>

        <q-card-section
          horizontal
          class="q-pa-md row wrap justify-between"
          style="border-radius:5px; width: 90%; margin: auto; margin-top: -3%; background: white"
        >
          <div class="col-md-5">
            <div>Year to date</div>
            <q-separator color="orange" spaced />
            <q-input
              dense
              readonly
              rounded
              outlined
              color="teal"
              :value="
                new Intl.NumberFormat('en').format(
                  Number(profit.pendapatanTahun).toFixed(0)
                )
              "
              input-class="text-h6 text-right text-teal"
              label="Penjualan"
            />
            <q-input
              dense
              readonly
              rounded
              outlined
              color="orange"
              :value="
                new Intl.NumberFormat('en').format(
                  Number(blmPos.tahun).toFixed(0)
                )
              "
              input-class="text-h6 text-right text-orange"
              label="Pesanan"
            />
            <q-separator color="orange" spaced />
            <div class="text-right text-brown-7">{{ jml.custThn.toLocaleString() }} Pelanggan</div>
            <div class="text-right text-brown-7">{{ jml.trxThn.toLocaleString() }} Penjualan</div>
          </div>
          <div class="col-md-5">
            <div>{{ periode }} Berjalan</div>
            <q-separator color="orange" spaced />
            <q-input
              dense
              readonly
              rounded
              outlined
              color="teal"
              :value="
                new Intl.NumberFormat('en').format(
                  Number(profit.pendapatan).toFixed(0)
                )
              "
              input-class="text-h6 text-right text-teal"
              label="Penjualan"
            />
            <q-input
              dense
              readonly
              rounded
              outlined
              color="orange"
              :value="
                new Intl.NumberFormat('en').format(
                  Number(blmPos.periode).toFixed(0)
                )
              "
              input-class="text-h6 text-right text-orange"
              label="Pesanan"
            />
            <q-separator color="orange" spaced />
            <div class="text-right text-brown-7">{{ jml.custBln.toLocaleString() }} Pelanggan</div>
            <div class="text-right text-brown-7">{{ jml.trxBln.toLocaleString() }} Penjualan</div>
          </div>
        </q-card-section>
      </q-card>
    </div>
    <div class="col-xs-12 col-md-4 col-sm-12 q-gutter-xs ">
      <q-card class="shadow-2" style="border-left: 5px solid #00838F">
        <div class="text-subtitle q-px-md q-pt-sm text-cyan-9">
          Laba (Rugi) Kotor
          <q-btn
            disable
            round
            color="white"
            class="float-right"
            text-color="cyan-9"
            icon="attach_money"
          />
        </div>
        <q-card-section
          class="q-px-md q-py-sm row q-gutter-xs justify-between"
        >
          <div class="col-md-5 items-start">
            <div class="text-h5" style="color:#474747">
              {{ (profit.pendapatanTahun - profit.hppTahun) | duit }}
            </div>
            <p style="color:#1F929C">Year to date</p>
          </div>
          <div class="col-md-5 items-end">
            <div class="text-h5" style="color:#474747">
              {{ (profit.pendapatan - profit.hpp) | duit }}
            </div>
            <p style="color:#1F929C">{{ periode }} Berjalan</p>
          </div>
        </q-card-section>
      </q-card>
    </div>
    <div class="col-xs-12 col-md-4 col-sm-12 q-gutter-xs ">
      <q-card class="shadow-2" style="border-left: 5px solid #ff3679">
        <div class="text-subtitle q-px-md q-pt-sm text-deep-orange-5">
          Biaya Operasional
          <q-btn
            disable
            round
            color="white"
            class="float-right"
            text-color="cyan-6"
            icon="attach_money"
          />
        </div>

        <q-card-section
          class="q-px-md q-py-sm row q-gutter-xs justify-between"
        >
          <div class="col-md-5 items-start">
            <div class="text-h5" style="color:#474747">
              {{ profit.bopTahun | duit }}
            </div>
            <p style="color:#00ACC1">Year to date</p>
          </div>
          <div class="col-md-5 items-end">
            <div class="text-h5" style="color:#474747">
              {{ profit.bop | duit }}
            </div>
            <p style="color:#00ACC1">{{ periode }} Berjalan</p>
          </div>
        </q-card-section>
      </q-card>
    </div>
    <div class="col-xs-12 col-md-4 col-sm-12 q-gutter-xs">
      <q-card style="border-left: 5px solid #1565C0">
        <div class="text-subtitle q-px-md q-pt-sm text-blue-9">
          Laba (Rugi) Bersih
          <q-btn
            disable
            round
            color="white"
            class="float-right"
            text-color="blue-9"
            icon="attach_money"
          />
        </div>
        <q-card-section
          class="q-px-md q-py-sm row q-gutter-xs justify-between"
        >
          <div class="col-md-5 items-start">
            <div class="text-h5" style="color:#474747">
              {{
                $dwn.jumlah([
                  profit.pendapatanTahun,
                  -profit.biayaTahun,
                  profit.lainTahun
                ]) | duit
              }}
            </div>
            <p style="color:#1565C0">Year to date</p>
          </div>
          <div class="col-md-5  items-end">
            <div class="text-h5" style="color:#474747">
              {{
                $dwn.jumlah([profit.pendapatan, -profit.biaya, profit.lain])
                  | duit
              }}
            </div>
            <p style="color:#1565C0">{{ periode }} Berjalan</p>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>
<script>
import { computed, onMounted, reactive, toRefs } from '@vue/composition-api'
import { countTrx, profitloss, rkpPOnew } from '../../services/apiList'
export default {
  props: {
    filt: {
      type: Object,
      default: () => {
        return {
          tgla: '',
          tglb: '',
          kodeCab: [],
          ancab: false
        }
      }
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      profit: null,
      jml: {
        custBln: 0,
        trxBln: 0,
        custThn: 0,
        trxThn: 0
      },
      blmPos: { periode: 0, tahun: 0 }
    })
    const periode = computed(() => {
      return props.filt.tgla.slice(0, 7) === props.filt.tglb.slice(0, 7)
        ? 'Bulan'
        : 'Periode'
    })
    const getProfit = v => {
      let x = { ...v, periode: periode }
      if (v.kodeCab.length) {
        profitloss(x).then(({ data }) => {
          dt.profit = {
            pendapatanTahun:
              data.find(a => a.kodeGrupAkun === '3') &&
              data.find(a => a.kodeGrupAkun === '3').tahun,
            pendapatan:
              data.find(a => a.kodeGrupAkun === '3') &&
              data.find(a => a.kodeGrupAkun === '3').bulan,
            hppTahun:
              data.find(a => a.kodeGrupAkun === '4') &&
              data.find(a => a.kodeGrupAkun === '4').tahun,
            hpp:
              data.find(a => a.kodeGrupAkun === '4') &&
              data.find(a => a.kodeGrupAkun === '4').bulan,
            bopTahun:
              data.find(a => a.kodeGrupAkun === '5') &&
              data.find(a => a.kodeGrupAkun === '5').tahun,
            bop:
              data.find(a => a.kodeGrupAkun === '5') &&
              data.find(a => a.kodeGrupAkun === '5').bulan,
            biayaTahun: data
              .filter(a => ['4', '5'].some(s => a.kodeGrupAkun === s))
              .reduce((a, b) => root.$dwn.jumlah([a, b.tahun]), 0),
            biaya: data
              .filter(a => ['4', '5'].some(s => a.kodeGrupAkun === s))
              .reduce((a, b) => root.$dwn.jumlah([a, b.bulan]), 0),
            lainTahun:
              data.find(a => a.kodeGrupAkun === '6') &&
              data.find(a => a.kodeGrupAkun === '6').tahun,
            lain:
              data.find(a => a.kodeGrupAkun === '6') &&
              data.find(a => a.kodeGrupAkun === '6').bulan
          }
        })
        countTrx(x).then(({ data }) => {
          dt.jml = data
        })
        rkpPOnew(x).then(({ data }) => {
          dt.blmPos.periode =
            data.periode.length &&
            data.periode.reduce((a, b) => a + b.jmlHarga, 0)
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
}
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
