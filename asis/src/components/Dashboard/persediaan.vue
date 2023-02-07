<template>
  <q-card class="fit" v-if="Stok.pusat">
    <q-card-actions
      style="background: linear-gradient(to left, transparent,rgba(0, 150,95,0.8))">
      <q-chip color="blue-6" class="text-white text-bold" clickable>Nilai Persediaan</q-chip>
      <q-space/>
    </q-card-actions>
    <q-separator />
    <q-markup-table dense wrap-cells>
      <thead>
        <tr>
          <th>Keterangan</th>
          <th>PT ASI</th>
          <th>Cabang</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr class="text-bold">
          <td >Saldo Akhir</td>
          <td align="right">{{ Stok.pusat ? Stok.pusat.totala : 0 | duit }}</td>
          <td align="right">{{ Stok.outlet ? Stok.outlet.totala - Stok.pusat.totala : 0 | duit }}</td>
          <td align="right">{{ Stok.outlet ? Stok.outlet.totala : 0 | duit }}</td>
        </tr>
        <tr>
          <td>Umur 30 Hari</td>
          <td align="right">{{ Stok.pusat ? Stok.pusat.ua30 : 0 | duit }}</td>
          <td align="right">{{ Stok.outlet ? Stok.outlet.ua30 : 0 | duit }}</td>
          <td align="right">{{ Stok.pusat ? Stok.pusat.ua30 + Stok.outlet.ua30  : 0 | duit }}</td>
        </tr>
        <tr>
          <td>Umur 31 - 60 Hari</td>
          <td align="right">{{ Stok.pusat ? Stok.pusat.ua60 : 0 | duit }}</td>
          <td align="right">{{ Stok.outlet ? Stok.outlet.ua60 : 0 | duit }}</td>
          <td align="right">{{ Stok.pusat ? Stok.pusat.ua60 + Stok.outlet.ua60 : 0 | duit }}</td>
        </tr>
        <tr>
          <td>Umur 61 - 90 Hari</td>
          <td align="right">{{ Stok.pusat ? Stok.pusat.ua90 : 0 | duit }}</td>
          <td align="right">{{ Stok.outlet ? Stok.outlet.ua90 : 0 | duit }}</td>
          <td align="right">{{ Stok.pusat ? Stok.pusat.ua90 + Stok.outlet.ua90 : 0 | duit }}</td>
        </tr>
        <tr>
          <td>Umur > 90 Hari</td>
          <td align="right">{{ Stok.pusat ? Stok.pusat.ua91 : 0 | duit }}</td>
          <td align="right">{{ Stok.outlet ? Stok.outlet.ua91 : 0 | duit }}</td>
          <td align="right">{{ Stok.pusat ? Stok.pusat.ua91 +  Stok.outlet.ua91 : 0 | duit }}</td>
        </tr>
      </tbody>
    </q-markup-table>
  </q-card>
</template>
<script>
import { reactive, computed, toRefs, onMounted, watch } from '@vue/composition-api'
import { faaStk } from '../../services/apiList'
export default {
  props: {
    filt: {
      type: Object,
      default: () => {
        return {
          allCab: false,
          kodeCab: [],
          cabID: [],
          tgla: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
          tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
          jnsTrx: 'J'
        }
      }
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      dtStok: {},
      pilih: { ...props.filt }
    })
    const Stok = computed(() => {
      const data = dt.dtStok
      return data.pusat ? {
        pusat: {
          totala: data.pusat
            .reduce((a, b) => root.$dwn.jumlah([a,b.total]), 0)/* ,
          ua30: data.pusat.reduce((a, b) => root.$dwn.jumlah([a, b.ua30]), 0),
          ua60: data.pusat.reduce((a, b) => root.$dwn.jumlah([a, b.ua60]), 0),
          ua90: data.pusat.reduce((a, b) => root.$dwn.jumlah([a, b.ua90]), 0),
          ua91: data.pusat.reduce((a, b) => root.$dwn.jumlah([a, b.ua91]), 0) */
        },
        outlet: {
          totala: data.total.reduce((a, b) => root.$dwn.jumlah([a, b.totall]), 0)/* ,
          ua30: data.total.reduce((a, b) => root.$dwn.jumlah([a, b.ua30]), 0),
          ua60: data.total.reduce((a, b) => root.$dwn.jumlah([a, b.ua60]), 0),
          ua90: data.total.reduce((a, b) => root.$dwn.jumlah([a, b.ua90]), 0),
          ua91: data.total.reduce((a, b) => root.$dwn.jumlah([a, b.ua91]), 0) */
        }
      } : { pusat: {}, outlet: {} }
    })
    const lihat = () => {
      dt.pilih.cabID = dt.pilih.cabID || dt.pilih.kodeCab
      faaStk({ ...dt.pilih, kodeSubAkun: '11070' })
        .then(({ data }) => {
          dt.dtStok = {
            pusat: data.sawala.filter(a => ['', 'MP01'].includes(a.kodeCabang))
              .map(a => {
                a.total = a.kodeCabang === 'MP01' ? a.totala : a.asal === 'MP01' ? a.keluara : a.tujuan === 'MP01' ? a.masuka : 0
                return a
              }),
            total: data.sawala
              .map(a => {
                a.totall = root.$dwn.jumlah([a.totala, a.masuka, a.keluara])
                return a
              }),
          }
        })
    }
    onMounted(() => {
      lihat()
    })
    watch(() => root.$store.state.auth.setCabang, (val) => {
      if (val.length) {
        dt.pilih.kodeCab = [val]
        lihat()
      } else {
        dt.dtStok = { pusat: [], total: [] }
      }
    }, { deep: true })
    watch(() => props.filt, (val) => {
      if (val.kodeCab.length) {
        dt.pilih = { ...val }
        lihat()
      } else {
        dt.dtStok = { pusat: [], total: [] }
      }
    }, { deep: true })
    return { ...toRefs(dt), Stok, lihat }
  }
}
</script>
