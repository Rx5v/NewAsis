<template>
  <q-card class="fit" v-if="hutU.pusat" :style="`border-left: 5px solid ${jnsHP === 'H' ? '#f53b7c' : '#10f3c6'}`">
    <q-card-actions
      :style="`background: linear-gradient(to right, ${jnsHP === 'H' ? '#f53b7c' : '#10f3c6'} 15%, #ffffff 97%);`">
      <q-chip color="blue-6" class="text-white text-bold" clickable>{{ jnsHP === 'H' ? 'Hutang' : 'Piutang'}} Usaha</q-chip>
      <q-space/>
      <q-chip color="blue-6" class="text-white text-bold" outline clickable>Periode : {{ filt.tgla }} - {{ filt.tglb }}</q-chip>
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
        <template v-if="ukuran === 'full'">
          <tr class="text-bold">
            <td>Saldo Awal</td>
            <td align="right">{{ hutU.pusat ? hutU.pusat.total : 0 | duit }}</td>
            <td align="right">{{ hutU.outlet ? hutU.outlet.total : 0 | duit }}</td>
            <td align="right">{{ hutU.outlet ? hutU.outlet.total +  hutU.pusat.total : 0 | duit }}</td>
          </tr>
          <tr>
            <td>Umur 14 Hari</td>
            <td align="right">{{ hutU.pusat ? hutU.pusat.u14 : 0 | duit }}</td>
            <td align="right">{{ hutU.outlet ? hutU.outlet.u14 : 0 | duit }}</td>
            <td align="right">{{ hutU.pusat ? hutU.pusat.u14 + hutU.outlet.u14  : 0 | duit }}</td>
          </tr>
          <tr>
            <td>Umur 15 - 30 Hari</td>
            <td align="right">{{ hutU.pusat ? hutU.pusat.u30 : 0 | duit }}</td>
            <td align="right">{{ hutU.outlet ? hutU.outlet.u30 : 0 | duit }}</td>
            <td align="right">{{ hutU.pusat ? hutU.pusat.u30 + hutU.outlet.u30 : 0 | duit }}</td>
          </tr>
          <tr>
            <td>Umur 31 - 60 Hari</td>
            <td align="right">{{ hutU.pusat ? hutU.pusat.u60 : 0 | duit }}</td>
            <td align="right">{{ hutU.outlet ? hutU.outlet.u60 : 0 | duit }}</td>
            <td align="right">{{ hutU.pusat ? hutU.pusat.u60 + hutU.outlet.u60 : 0 | duit }}</td>
          </tr>
          <tr>
            <td>Umur > 61 Hari</td>
            <td align="right">{{ hutU.pusat ? hutU.pusat.u61 : 0 | duit }}</td>
            <td align="right">{{ hutU.outlet ? hutU.outlet.u61 : 0 | duit }}</td>
            <td align="right">{{ hutU.pusat ? hutU.pusat.u61 +  hutU.outlet.u61 : 0 | duit }}</td>
          </tr>
            <tr class="text-bold">
            <td>Pemberian</td>
            <td align="right">{{ hutU.pusat ? hutU.pusat.masuk : 0 | duit }}</td>
            <td align="right">{{ hutU.outlet ? hutU.outlet.masuk : 0 | duit }}</td>
            <td align="right">{{ hutU.outlet ? hutU.outlet.masuk +  hutU.pusat.masuk : 0 | duit }}</td>
          </tr>
          <tr class="text-bold">
            <td>Pembayaran</td>
            <td align="right">{{ hutU.pusat ? hutU.pusat.bayar : 0 | duit }}</td>
            <td align="right">{{ hutU.outlet ? hutU.outlet.bayar : 0 | duit }}</td>
            <td align="right">{{ hutU.outlet ? hutU.outlet.bayar +  hutU.pusat.bayar : 0 | duit }}</td>
          </tr>
          <tr class="text-bold">
            <td>Kenaikan/ (Penurunan)</td>
            <td align="right" :class="hutU.pusat.naik > 0 ? 'text-pink' : 'text-teal'">{{ hutU.pusat ? hutU.pusat.naik : 0 | duit }}</td>
            <td align="right" :class="hutU.outlet.naik > 0 ? 'text-pink' : 'text-teal'">{{ hutU.outlet ? hutU.outlet.naik : 0 | duit }}</td>
            <td align="right" :class="(hutU.outlet.naik +  hutU.pusat.naik) > 0 ? 'text-pink' : 'text-teal'">{{ hutU.outlet ? hutU.outlet.naik +  hutU.pusat.naik : 0 | duit }}</td>
          </tr>
        </template>
       <!--  <tr class="text-bold">
          <td >Jatuh Tempo</td>
          <td align="right">{{ hutU.pusat ? hutU.pusat.totalOverdue : 0 | duit }}</td>
          <td align="right">{{ hutU.outlet ? hutU.outlet.totalOverdue : 0 | duit }}</td>
          <td align="right">{{ hutU.outlet ? hutU.outlet.totalOverdue +  hutU.pusat.totalOverdue : 0 | duit }}</td>
        </tr>
        <tr class="text-bold">
          <td >Belum Tempo</td>
          <td align="right">{{ hutU.pusat ? hutU.pusat.blmOverdue : 0 | duit }}</td>
          <td align="right">{{ hutU.outlet ? hutU.outlet.blmOverdue : 0 | duit }}</td>
          <td align="right">{{ hutU.outlet ? hutU.outlet.blmOverdue +  hutU.pusat.blmOverdue : 0 | duit }}</td>
        </tr> -->
        <tr class="text-bold">
          <td >Saldo Akhir</td>
          <td align="right">{{ hutU.pusat ? hutU.pusat.totala : 0 | duit }}</td>
          <td align="right">{{ hutU.outlet ? hutU.outlet.totala : 0 | duit }}</td>
          <td align="right">{{ hutU.outlet ? hutU.outlet.totala +  hutU.pusat.totala : 0 | duit }}</td>
        </tr>
        <tr>
          <td>Umur 14 Hari</td>
          <td align="right">{{ hutU.pusat ? hutU.pusat.ua14 : 0 | duit }}</td>
          <td align="right">{{ hutU.outlet ? hutU.outlet.ua14 : 0 | duit }}</td>
          <td align="right">{{ hutU.pusat ? hutU.pusat.ua14 + hutU.outlet.ua14  : 0 | duit }}</td>
        </tr>
        <tr>
          <td>Umur 15 - 30 Hari</td>
          <td align="right">{{ hutU.pusat ? hutU.pusat.ua30 : 0 | duit }}</td>
          <td align="right">{{ hutU.outlet ? hutU.outlet.ua30 : 0 | duit }}</td>
          <td align="right">{{ hutU.pusat ? hutU.pusat.ua30 + hutU.outlet.ua30 : 0 | duit }}</td>
        </tr>
        <tr>
          <td>Umur 31 - 60 Hari</td>
          <td align="right">{{ hutU.pusat ? hutU.pusat.ua60 : 0 | duit }}</td>
          <td align="right">{{ hutU.outlet ? hutU.outlet.ua60 : 0 | duit }}</td>
          <td align="right">{{ hutU.pusat ? hutU.pusat.ua60 + hutU.outlet.ua60 : 0 | duit }}</td>
        </tr>
        <tr>
          <td>Umur > 61 Hari</td>
          <td align="right">{{ hutU.pusat ? hutU.pusat.ua61 : 0 | duit }}</td>
          <td align="right">{{ hutU.outlet ? hutU.outlet.ua61 : 0 | duit }}</td>
          <td align="right">{{ hutU.pusat ? hutU.pusat.ua61 +  hutU.outlet.ua61 : 0 | duit }}</td>
        </tr>
      </tbody>
    </q-markup-table>
  </q-card>
</template>
<script>
import { computed, onMounted, reactive, toRefs } from '@vue/composition-api'
import { faaHP } from '../../services/apiList'

export default ({
  props: {
    filt: {
      type: Object,
      default: () => {
        return {
          tgla: '',
          tglb: '',
          kodeCab: [],
          cabID: []
        }
      }
    },
    jnsHP: {
      type: String,
      default: 'H'
    },
    ukuran: {
      type: String,
      default: 'full'
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      dtHutU: []
    })
    const kodeSubAkun = computed(() => {
      return props.jnsHP === 'H' ? '21010' : '11050'
    })
    const hutU = computed(() => {
      const data = dt.dtHutU
      return data.sawal ? {
        pusat: {
          total: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.total, 0),
          u14: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.u14, 0),
          u30: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.u30, 0),
          u60: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.u60, 0),
          u61: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.u61, 0),
          totala: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.totala, 0),
          totalOverdue: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.totalOverdue, 0),
          blmOverdue: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.blmOverdue, 0),
          ua14: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.ua14, 0),
          ua30: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.ua30, 0),
          ua60: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.ua60, 0),
          ua61: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.ua61, 0),
          masuk: data.nHP.filter(a => a.kodeCabang === 'MP01' && a.DK === 'K').reduce((a, b) => a + b.nilai, 0),
          bayar: data.nHP.filter(a => a.kodeCabang === 'MP01' && a.DK === 'D').reduce((a, b) => a - b.nilai, 0),
          naik: data.nHP.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.nilai, 0)
        },
        outlet: {
          total: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.total, 0),
          u14: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.u14, 0),
          u30: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.u30, 0),
          u60: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.u60, 0),
          u61: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.u61, 0),
          totala: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.totala, 0),
          totalOverdue: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.totalOverdue, 0),
          blmOverdue: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.blmOverdue, 0),
          ua14: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.ua14, 0),
          ua30: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.ua30, 0),
          ua60: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.ua60, 0),
          ua61: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.ua61, 0),
          masuk: data.nHP.filter(a => a.kodeCabang !== 'MP01' && a.DK === 'K').reduce((a, b) => a + b.nilai, 0),
          bayar: data.nHP.filter(a => a.kodeCabang !== 'MP01' && a.DK === 'D').reduce((a, b) => a - b.nilai, 0),
          naik: data.nHP.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.nilai, 0)
        }
      } : { pusat: {}, outlet: {} }
    })
    const getData = (v) => {
      faaHP({ ...v, cabID: v.kodeCab, kodeSubAkun: kodeSubAkun.value })
        .then(({ data }) => {
          dt.dtHutU = data
        })
    }
    onMounted(() => {
      getData(props.filt)
    })
    return {
      ...toRefs(dt),
      hutU,
      getData
    }
  },
  watch: {
    filt: {
      handler (v) {
        this.getData(v)
      },
      deep: true
    }
  }
})
</script>
