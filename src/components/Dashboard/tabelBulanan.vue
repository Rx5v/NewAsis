<template>
  <q-card class="fit bg-deep-orange-2">
    <q-card-actions>
      <q-chip color="blue-6" class="text-white text-bold" clickable>Sales Omzet Per {{ jenis.nama }}</q-chip>
      <q-space/>
      <q-chip color="blue-6" class="text-white text-bold" outline clickable >Tahun : {{ filt.tgla }}
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
          <garis :labels="jdlBln.filter((a, i) => i > 1 && i < (jdlBln.length - 1) ).map((a, i) => a.name)" :datasets="dataChart" type="line" :title="{ text: 'Sales Omzet Per ' + jenis.nama }"></garis>
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
    },
    jenis: {
      type: Object,
      default: () => {
        return {
          nama: 'Sales',
          jnsGrup: 'namaKaryawan'
        }
      }
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      filt: { ...props.pilih },
      dtOmzet: [],
      tgl: {
        from: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        to: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
      },
      labelk: []/* ,
      cabAll: [],
      perCab: [] */
    })
    const jdlBln = computed(() => {
      return [
        { name: 'nom', label: 'No', align: 'left' },
        { name: props.jenis.jnsGrup, label: props.jenis.nama, field: row => row[props.jenis.jnsGrup], align: 'left', sortable: true },
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
        { name: 'totalOmzet', label: 'Total Omzet', field: row => row.totalOmzet, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), align: 'right', sortable: true }
      ]
    })
    const jdlTriwulan = computed(() => {
      return [
        { name: 'nom', label: 'No', align: 'left' },
        { name: props.jenis.jnsGrup, label: props.jenis.nama, field: row => row[props.jenis.jnsGrup], align: 'left', sortable: true },
        { name: 'Triwulan1', label: 'Triwulan1', field: row => row.Triwulan1, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), jml: 'Y', align: 'right', sortable: true },
        { name: 'Triwulan2', label: 'Triwulan2', field: row => row.Triwulan2, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), jml: 'Y', align: 'right', sortable: true },
        { name: 'Triwulan3', label: 'Triwulan3', field: row => row.Triwulan3, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), jml: 'Y', align: 'right', sortable: true },
        { name: 'Triwulan4', label: 'Triwulan4', field: row => row.Triwulan4, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), jml: 'Y', align: 'right', sortable: true },
        { name: 'totalOmzet', label: 'Total Omzet', field: row => row.totalOmzet, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), align: 'right', sortable: true }

      ]
    })
    const jdlSemester = computed(() => {
      return [
        { name: 'nom', label: 'No', align: 'left' },
        { name: props.jenis.jnsGrup, label: props.jenis.nama, field: row => row[props.jenis.jnsGrup], align: 'left', sortable: true },
        { name: 'Semester1', label: 'Semester1', field: row => row.Semester1, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), jml: 'Y', align: 'right', sortable: true },
        { name: 'Semester2', label: 'Semester2', field: row => row.Semester2, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), jml: 'Y', align: 'right', sortable: true },
        { name: 'totalOmzet', label: 'Total Omzet', field: row => row.totalOmzet, format: v => v && new Intl.NumberFormat('en').format(Number(v).toFixed(0)), align: 'right', sortable: true }
      ]
    })
    const lihat = () => {
      salesOmzet({ ...dt.filt, ...props.jenis })
        .then(async ({ data }) => {
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
    watch(() => props.jenis, (val) => {
      lihat()
    })
    onMounted(() => {
      lihat()
    })
    const dataChart = computed(() => {
      let lb = jdlBln.value.filter((a, i) => i > 1 && i < (jdlBln.value.length - 1)).map((a, i) => a.name)
      let ab = dt.dtOmzet.map(a => {
        return {
          name: a[props.jenis.jnsGrup],
          data: lb.map(s => a[s])
        }
      })
      return ab
    })
    /* const labelk = computed(() => {
      return dt.dtOmzet.map(a => a[props.jenis.jnsGrup])
    }) */
    return { ...toRefs(dt), lihat, dataChart, jdlBln, jdlTriwulan, jdlSemester }
  }
}
</script>
