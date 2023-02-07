<template>
  <q-card class="fit bg-teal-12">
    <q-card-actions>
      <q-chip color="blue-6" class="text-white text-bold" clickable>Sales Omzet Per Salesman</q-chip>
      <q-space/>
      <q-chip color="blue-6" class="text-white text-bold" outline clickable>Tahun : {{ filt.tgla }}
        <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
            <q-date v-model="filt.tgla" @input="(x) => x && (lihat(),$refs.qDateProxy.hide())" mask="YYYY" default-view="Years" :emit-immediately="true" lazy-rules/>
          </q-popup-proxy>
      </q-chip>
    </q-card-actions>
    <q-separator />
    <q-card-section>
      <q-table
        :data="dtOmzet"
        :columns="jdlBln"
        dense
        >
        <template v-slot:top>
          <garis :labels="labelk" :datasets="dataChart" type="area" :title="{ text: 'Sales Omzet Per Salesman' }" class="bg-cyan-13"></garis>
        </template>
        <template v-slot:body-cell-nom="props">
          <q-td auto-width>{{ props.rowIndex + 1 }}</q-td>
        </template>
      </q-table>
    </q-card-section>
    <q-card-section>
      <q-table
        :data="dtOmzet"
        :columns="jdlTriwulan"
        dense
        >
        <template v-slot:body-cell-nom="props">
          <q-td auto-width>{{ props.rowIndex + 1 }}</q-td>
        </template>
      </q-table>
    </q-card-section>
    <q-card-section>
      <q-table
        :data="dtOmzet"
        :columns="jdlSemester"
        dense
        >
        <template v-slot:body-cell-nom="props">
          <q-td auto-width>{{ props.rowIndex + 1 }}</q-td>
        </template>
      </q-table>
    </q-card-section>
  </q-card>
</template>
<script>
import garis from '../chart/ApexLine.vue'
import { computed, onMounted, reactive, toRefs, watch } from '@vue/composition-api'
import { salesOmzet } from '../../services/apiList'

export default {
  components: {
    garis
  },
  props: {
    pilih: {
      type: Object,
      default: () => {
        return {
          allCab: false,
          tgla: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
          tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
          jnsTrx: 'J',
          ancab: false,
          kodeCab: []
        }
      }
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      filt: { ...props.pilih },
      dtOmzet: [],
      jdlBln: [
        { name: 'nom', label: 'No', align: 'left' },
        { name: 'namaKaryawan', label: 'Nama Sales', field: row => row.namaKaryawan, align: 'left', sortable: true },
        { name: 'Januari', label: 'Januari', field: row => row.Januari, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), jml: 'Y', align: 'right', sortable: true },
        { name: 'Februari', label: 'Februari', field: row => row.Februari, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), jml: 'Y', align: 'right', sortable: true },
        { name: 'Maret', label: 'Maret', field: row => row.Maret, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), jml: 'Y', align: 'right', sortable: true },
        { name: 'April', label: 'April', field: row => row.April, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), jml: 'Y', align: 'right', sortable: true },
        { name: 'Mei', label: 'Mei', field: row => row.Mei, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), jml: 'Y', align: 'right', sortable: true },
        { name: 'Juni', label: 'Juni', field: row => row.Juni, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), align: 'right', sortable: true },
        { name: 'Juli', label: 'Juli', field: row => row.Juli, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), align: 'right', sortable: true },
        { name: 'Agustus', label: 'Agustus', field: row => row.Agustus, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), align: 'right', sortable: true },
        { name: 'September', label: 'September', field: row => row.September, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), align: 'right', sortable: true },
        { name: 'Oktober', label: 'Oktober', field: row => row.Oktober, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), align: 'right', sortable: true },
        { name: 'November', label: 'November', field: row => row.November, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), align: 'right', sortable: true },
        { name: 'Desember', label: 'Desember', field: row => row.Desember, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), align: 'right', sortable: true },
        { name: 'totalOmzet', label: 'Total Omzet', field: row => row.totalOmzet, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), align: 'right', sortable: true },
        { name: 'act', label: 'Act' }
      ],
      jdlTriwulan: [
        { name: 'nom', label: 'No', align: 'left' },
        { name: 'namaKaryawan', label: 'Nama Sales', field: row => row.namaKaryawan, align: 'left', sortable: true },
        { name: 'Triwulan1', label: 'Triwulan1', field: row => row.Triwulan1, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), jml: 'Y', align: 'right', sortable: true },
        { name: 'Triwulan2', label: 'Triwulan2', field: row => row.Triwulan2, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), jml: 'Y', align: 'right', sortable: true },
        { name: 'Triwulan3', label: 'Triwulan3', field: row => row.Triwulan3, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), jml: 'Y', align: 'right', sortable: true },
        { name: 'Triwulan4', label: 'Triwulan4', field: row => row.Triwulan4, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), jml: 'Y', align: 'right', sortable: true },
        { name: 'totalOmzet', label: 'Total Omzet', field: row => row.totalOmzet, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), align: 'right', sortable: true },
        { name: 'act', label: 'Act' }
      ],
      jdlSemester: [
        { name: 'nom', label: 'No', align: 'left' },
        { name: 'namaKaryawan', label: 'Nama Sales', field: row => row.namaKaryawan, align: 'left', sortable: true },
        { name: 'Semester1', label: 'Semester1', field: row => row.Semester1, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), jml: 'Y', align: 'right', sortable: true },
        { name: 'Semester2', label: 'Semester2', field: row => row.Semester2, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), jml: 'Y', align: 'right', sortable: true },
        { name: 'totalOmzet', label: 'Total Omzet', field: row => row.totalOmzet, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), align: 'right', sortable: true },
        { name: 'act', label: 'Act' }
      ],
      tgl: {
        from: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        to: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
      }
    })
    const lihat = () => {
      salesOmzet({ ...dt.filt, ...props.jenis })
        .then(({ data }) => {
          dt.dtOmzet = data.map(a => {
            a.Triwulan1 = root.$dwn.jumlah([a.Januari, a.Februari, a.Maret])
            a.Triwulan2 = root.$dwn.jumlah([a.April, a.Mei, a.Juni])
            a.Triwulan3 = root.$dwn.jumlah([a.Juli, a.Agustus, a.September])
            a.Triwulan4 = root.$dwn.jumlah([a.Oktober, a.November, a.Desember])
            a.Semester1 = root.$dwn.jumlah([a.Triwulan1, a.Triwulan2])
            a.Semester2 = root.$dwn.jumlah([a.Triwulan3, a.Triwulan4])
            return a
          })
        })
    }
    watch(() => props.pilih, (val) => {
      dt.filt = { ...val }
      lihat()
    }, { deep: true })
    onMounted(() => {
      lihat()
    })
    const perCabang = computed(() => {
      let a = props.pilih.kodeCab
      let perCab = a.map(s => {
        let j = {
          kodeCab: a,
          namaCabang: '',
          Januari: dt.dtOmzet.filter(d => d.kodeCab === a).reduce((h, l) => root.$dwn.jumlah([h, l.Januari]), 0)
        }
        return j
      })
      return perCab
    })
    const dataChart = computed(() => {
      let a = [
        {
          name: 'Laporan Penjualan',
          data: dt.dtOmzet.map(s => s.totalOmzet.toFixed(0).toLocaleString())
        }
      ]
      return a
    })
    const labelk = computed(() => {
      return dt.dtOmzet.map(a => a.namaKaryawan)
    })
    return { ...toRefs(dt), lihat, perCabang, dataChart, labelk }
  }
}
</script>
