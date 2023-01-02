<template>
  <q-card class="fit" v-if="Kas.pusat && hutU.pusat">
    <q-card-section
      style="background: linear-gradient(to left, transparent,rgba(0, 150,95,0.8))">
      <q-chip color="blue-6" class="text-white text-bold" clickable>Kas dan Setara Kas</q-chip>
      <q-chip color="brown-6" class="text-white text-bold" clickable>Periode : {{ filt.tgla }} - {{ filt.tglb }}</q-chip>
    </q-card-section>
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
          <td class="text-bold">Saldo Awal</td>
          <td align="right">{{ Kas.pusat ? Kas.pusat.saldoAwal : 0 | duit }}</td>
          <td align="right">{{ Kas.outlet ? Kas.outlet.saldoAwal : 0 | duit }}</td>
          <td align="right">{{ Kas.outlet ? Kas.outlet.saldoAwal +  Kas.pusat.saldoAwal : 0 | duit }}</td>
        </tr>
        <tr>
        </tr>
        <tr class="text-bold">
          <td>Uang Masuk</td>
          <td align="right">{{ Kas.pusat ? Kas.pusat.masuk : 0 | duit }}</td>
          <td align="right">{{ Kas.outlet ? Kas.outlet.masuk : 0 | duit }}</td>
          <td align="right">{{ Kas.pusat ? Kas.pusat.masuk + Kas.outlet.masuk  : 0 | duit }}</td>
        </tr>
        <tr>
          <td>* Penjualan Tunai</td>
          <td align="right">{{ Kas.pusat ? Kas.pusat.tunai : 0 | duit }}</td>
          <td align="right">{{ Kas.outlet ? Kas.outlet.tunai : 0 | duit }}</td>
          <td align="right">{{ Kas.pusat ? Kas.pusat.tunai + Kas.outlet.tunai : 0 | duit }}</td>
        </tr>
        <tr>
          <td>* Pembayaran Piutang Usaha</td>
          <td align="right">{{ Kas.pusat ? Kas.pusat.pitUsaha : 0 | duit }}</td>
          <td align="right">{{ Kas.outlet ? Kas.outlet.pitUsaha : 0 | duit }}</td>
          <td align="right">{{ Kas.pusat ? Kas.pusat.pitUsaha + Kas.outlet.pitUsaha : 0 | duit }}</td>
        </tr>
        <tr>
          <td>* Lain-lain</td>
          <td align="right">{{ Kas.pusat ? Kas.pusat.masukLain : 0 | duit }}</td>
          <td align="right">{{ Kas.outlet ? Kas.outlet.masukLain : 0 | duit }}</td>
          <td align="right">{{ Kas.pusat ? Kas.pusat.masukLain +  Kas.outlet.masukLain : 0 | duit }}</td>
        </tr>
        <tr>
        </tr>
        <tr class="text-bold">
          <td>Uang Keluar</td>
          <td align="right">{{ Kas.pusat ? Kas.pusat.keluar : 0 | duit }}</td>
          <td align="right">{{ Kas.outlet ? Kas.outlet.keluar : 0 | duit }}</td>
          <td align="right">{{ Kas.pusat ? Kas.pusat.keluar + Kas.outlet.keluar  : 0 | duit }}</td>
        </tr>
        <tr>
          <td>* Biaya Operasional</td>
          <td align="right">{{ Kas.pusat ? Kas.pusat.bop : 0 | duit }}</td>
          <td align="right">{{ Kas.outlet ? Kas.outlet.bop : 0 | duit }}</td>
          <td align="right">{{ Kas.pusat ? Kas.pusat.bop + Kas.outlet.bop : 0 | duit }}</td>
        </tr>
        <tr>
          <td>* Pembelian Tunai</td>
          <td align="right">{{ Kas.pusat ? Kas.pusat.beli : 0 | duit }}</td>
          <td align="right">{{ Kas.outlet ? Kas.outlet.beli : 0 | duit }}</td>
          <td align="right">{{ Kas.pusat ? Kas.pusat.beli + Kas.outlet.beli : 0 | duit }}</td>
        </tr>
        <tr>
          <td>* Pembayaran Hutang Usaha</td>
          <td align="right">{{ Kas.pusat ? Kas.pusat.hutUsaha : 0 | duit }}</td>
          <td align="right">{{ Kas.outlet ? Kas.outlet.hutUsaha : 0 | duit }}</td>
          <td align="right">{{ Kas.pusat ? Kas.pusat.hutUsaha + Kas.outlet.hutUsaha : 0 | duit }}</td>
        </tr>
        <tr>
          <td>* Lain-lain</td>
          <td align="right">{{ Kas.pusat ? Kas.pusat.keluarLain : 0 | duit }}</td>
          <td align="right">{{ Kas.outlet ? Kas.outlet.keluarLain : 0 | duit }}</td>
          <td align="right">{{ Kas.pusat ? Kas.pusat.keluarLain +  Kas.outlet.keluarLain : 0 | duit }}</td>
        </tr>
        <tr>
        </tr>
        <tr class="text-bold">
          <td>Kenaikan/ (Penurunan)</td>
          <td align="right" :class="Kas.pusat.naik > 0 ? 'text-teal' : 'text-pink'">{{ Kas.pusat ? Kas.pusat.naik : 0 | duit }}</td>
          <td align="right" :class="Kas.outlet.naik > 0 ? 'text-teal' : 'text-pink'">{{ Kas.outlet ? Kas.outlet.naik : 0 | duit }}</td>
          <td align="right" :class="(Kas.outlet.naik +  Kas.pusat.naik) > 0 ? 'text-teal' : 'text-pink'">{{ Kas.outlet ? Kas.outlet.naik +  Kas.pusat.naik : 0 | duit }}</td>
        </tr>
        <tr class="text-bold">
          <td >Saldo Akhir</td>
          <td align="right">{{ Kas.pusat ? Kas.pusat.saldoAkhir : 0 | duit }}</td>
          <td align="right">{{ Kas.outlet ? Kas.outlet.saldoAkhir : 0 | duit }}</td>
          <td align="right">{{ Kas.outlet ? Kas.outlet.saldoAkhir +  Kas.pusat.saldoAkhir : 0 | duit }}</td>
        </tr>
        <tr>
        </tr>
        <tr class="text-bold">
          <td >Kebutuhan Dana</td>
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
import { faaAK, faaHP } from '../../services/apiList'

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
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      dtKas: [],
      dtHutU: []
    })
    const Kas = computed(() => {
      const data = dt.dtKas
      return data.length ? {
        pusat: {
          saldoAwal: data.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.saldoAwal]), 0),
          tunai: data.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.tunai]), 0),
          pitUsaha: data.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.pitUsaha]), 0),
          masukLain: data.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.masuk, -b.tunai, -b.pitUsaha]), 0),
          saldoAkhir: data.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.saldoAkhir]), 0),
          beli: data.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.beli]), 0),
          hutUsaha: data.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.hutUsaha]), 0),
          keluarLain: data.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.keluar, -b.beli, -b.hutUsaha, -b.bop]), 0),
          masuk: data.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.masuk]), 0),
          keluar: data.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.keluar]), 0),
          naik: data.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.masuk, -b.keluar]), 0),
          bop: data.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.bop]), 0)
        },
        outlet: {
          saldoAwal: data.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.saldoAwal]), 0),
          tunai: data.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.tunai]), 0),
          pitUsaha: data.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.pitUsaha]), 0),
          masukLain: data.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.masuk, -b.tunai, -b.pitUsaha]), 0),
          saldoAkhir: data.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.saldoAkhir]), 0),
          beli: data.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.beli]), 0),
          hutUsaha: data.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.hutUsaha]), 0),
          keluarLain: data.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.keluar, -b.beli, -b.hutUsaha, -b.bop]), 0),
          masuk: data.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.masuk]), 0),
          keluar: data.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.keluar]), 0),
          naik: data.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.masuk, -b.keluar]), 0),
          bop: data.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.bop]), 0)
        }
      } : { pusat: {}, outlet: {} }
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
      faaAK({ ...v, cabID: v.kodeCab })
        .then(({ data }) => {
          dt.dtKas = data
        })
      faaHP({ ...v, cabID: v.kodeCab, kodeSubAkun: '21010' })
        .then(({ data }) => {
          dt.dtHutU = data
        })
    }
    onMounted(() => {
      getData(props.filt)
    })
    return {
      ...toRefs(dt),
      Kas,
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
