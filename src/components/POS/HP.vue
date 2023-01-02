<template>
  <div>
    <q-table
      class="dataTrx"
      :data="detHP"
      :columns="jdl"
      row-key="iddetJur"
      :filter="cari"
      :pagination.sync="hal"
      dense>
      <template v-slot:top>
        <div class="col-12 q-table__title">Data Piutang per Sales</div>
        <div class="row q-gutter-md justify-between" >
            <q-toggle
              label="Rekap"
              color="pink"
              v-model="rekap"
              keep-color
              readonly class="q-ml-sm"
            />
            <q-input dense debounce="300" v-model="cari" placeholder="Search" class="q-ml-sm">
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
            <q-btn
              flat round dense
              icon="file_download"
              @click="toDown"
              class="q-ml-md"
              color="primary"
            />
          <div class="col-xs-6 col-sm-5 col-md-4">
            <q-select
              v-if="['MAN','acc','purchase'].some(a=> a== $store.state.auth.user.userType)"
              v-model="kodeCab"
              :options="$store.state.auth.user.userType ==='MAN' ? dtCabang : cabAsi"
              :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
              option-value="kodeCab"
              emit-value
              map-options
              style="min-width: 250px; max-width: 300px"
              label="Pilih cabang... "
              :rules="inRul"
              dense
              @input="getHP"
              lazy-rules/>
          </div>
        </div>
      </template>
      <template v-slot:header="props">
        <q-tr :props="props">
          <q-th auto-width />

          <q-th
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
          >
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td auto-width>
            <q-btn size="sm" color="accent" round dense
              @click="props.expand = !props.expand,getByr(props.row,'ok',props.expand)"
              :icon="props.expand ? 'remove' : 'add'" />
          </q-td>
          <q-td
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
          >
            <template v-if="col.jml==='Y'">
              {{ col.value | duit }}
            </template>
            <template v-else>
              {{ col.value }}
            </template>
          </q-td>
        </q-tr>
        <q-tr v-show="props.expand" :props="props">
          <q-td colspan="100%">
            <template v-if="rekap ? dtJurnal.filter(x=> x.kodeRekan === props.row.kodeRekan).length>0 : detByr.filter(x=> x.nomorReff === props.row.nomorJurnal).length>0">
              <q-markup-table
                dense
                bordered>
                <q-tr>
                  <q-th v-for="(jd, i) in jdlB" :key="i"
                    align="left">
                    {{ jd.label }}</q-th>
                </q-tr>
                <q-tr
                  v-for="(dt) in (rekap ? dtJurnal.filter(x=> x.kodeRekan === props.row.kodeRekan) : detByr.filter(x=> x.nomorReff === props.row.nomorJurnal))"
                  :key="dt.iddetJur"
                  class="text-italic">
                  <q-td>{{ dt.tgl }}</q-td>
                  <q-td>{{ dt.nomorJurnal }}</q-td>
                  <q-td>{{ dt.judulJurnal }}</q-td>
                  <q-td>{{ dt.namaAkun }}</q-td>
                  <q-td align="right">{{ dt.nilai | duit }}</q-td>
                  <q-td align="right">{{ dt.status }}</q-td>
                </q-tr>
              </q-markup-table>
            </template>
            <template v-else>
              Belum ada pembayaran
            </template>
          </q-td>
        </q-tr>
      </template>
      <template v-slot:bottom-row>
        <q-tr>
          <q-td colspan="2">Total Piutang</q-td>
          <q-td class="text-right">{{ total.nilai | duit}}</q-td>
        </q-tr>
        <q-tr>
          <q-td colspan="2">Total Bayar</q-td>
          <q-td class="text-right">{{ total.tbayar | duit}}</q-td>
        </q-tr>
        <q-tr>
          <q-td colspan="2">Total Sisa</q-td>
          <q-td class="text-right">{{ total.sisa | duit}}</q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script>
import { dthpSales, cekByr, dtCab } from '../../services/apiList'
import { reactive, toRefs, computed, onMounted, watch } from '@vue/composition-api'
export default {
  // name: 'PageName',
  props: {
    jhp: {
      type: String,
      default: 'P'
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      dtJurnal: [],
      jdld: [
        { name: 'tgl', label: 'Tangal', field: row => row.tgl, align: 'left' },
        { name: 'nomorJurnal', label: 'Nomor Jurnal', field: row => row.nomorJurnal, align: 'left' },
        { name: 'nomorBukti', label: 'Nomor Invoice', field: row => row.nomorBukti, align: 'left' },
        { name: 'judulJurnal', label: 'Judul', field: row => row.judulJurnal, align: 'left' },
        { name: 'umur', label: 'Umur(hari)', field: row => row.umur, align: 'right' },
        { name: 'tempo', label: 'Tempo', field: row => row.tempo, align: 'right', sortable: true },
        { name: 'overDue', label: 'Overdue(hari)', field: row => row.overDue, align: 'right', sortable: true },
        { name: 'nilai', label: 'Nilai', field: row => row.nilai, jml: 'Y', align: 'right' },
        { name: 'tbayar', label: 'Terbayar', field: row => row.tbayar, jml: 'Y', align: 'right' },
        { name: 'sisa', label: 'Sisa', field: row => row.sisa, jml: 'Y', align: 'right' },
        { name: 'namaPartner', label: 'Nama Partner', field: row => row.namaPartner, align: 'left' },
        { name: 'pic', label: 'Nama Sales', field: row => row.pic, align: 'left' },
        { name: 'status', label: 'Status', field: row => row.status, align: 'left' }
      ],
      jdlB: [
        { name: 'tgl', label: 'Tanggal', field: row => row.tgl, align: 'left' },
        { name: 'nomorJurnal', label: 'Nomor Jurnal', field: row => row.nomorJurnal, align: 'left' },
        { name: 'judulJurnal', label: 'Judul', field: row => row.judulJurnal, align: 'left' },
        { name: 'kodeAkun', label: 'Akun', field: row => row.namaAkun, align: 'left' },
        { name: 'nilai', label: 'Nilai', field: row => row.nilai, jml: 'Y', format: row => new Intl.NumberFormat('en').format(Number(row).toFixed(0)), align: 'right' },
        { name: 'status', label: 'Status', field: row => row.status }
      ],
      jdlr: [
        { label: 'Kode Partner', name: 'kodeRekan', field: row => row.kodeRekan, align: 'left' },
        { label: 'Nama Partner', name: 'namaPartner', field: row => row.namaPartner, align: 'left' },
        { label: 'Total', name: 'nilai', field: row => row.nilai, jml: 'Y', align: 'right' },
        { label: 'Bayar', name: 'tbayar', field: row => row.tbayar, jml: 'Y', align: 'right' },
        { label: 'Sisa', name: 'sisa', field: row => row.sisa, jml: 'Y', align: 'right' },
        { name: 'act', label: 'act', align: 'left' }
      ],
      detByr: [],
      inRul: [ v => !!v || 'Isi data' ],
      jh: { tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        status: {
          label: 'Open',
          value: 'O'
        } },
      selected: [],
      cari: '',
      subAkun: [],
      kodeSubAkun: '',
      alAkun: [],
      rekap: false,
      filt: { kodeAkun: '' },
      ac: 'N',
      j: { },
      namaPartner: '',
      dtCabang: [],
      kodeCab: root.$store.state.auth.user.kodeCab,
      hal: { rowsPerPage: 10 },
      sto: [
        { label: 'Open', value: 'O' },
        { label: 'Lunas', value: 'T' }
      ],
      muldet: []
    })
    const jdl = computed(() => {
      let x = dt.rekap ? dt.jdlr : dt.jdld
      return x
    })
    const detHP = computed(() => {
      let x = dt.rekap ? dtRekap.value : dt.dtJurnal
      return x
    })
    const dtRekap = computed(() => {
      let dta = []
      if (dt.dtJurnal.length > 0) {
        let sp = [...new Set(dt.dtJurnal.map(x => x.kodeRekan))] // ambil dt kode rekanan as array
        for (let i in sp) {
          // filter datPi where kode = sp[i] per grup rekanan
          let f = dt.dtJurnal.filter(x => x.kodeRekan === sp[i])
          let s = { ...f[0] } // ambil value untuk rekanan
          s.nilai = f.reduce((x, y) => root.$dwn.jumlah([x, y.nilai]), 0)
          s.tbayar = f.reduce((x, y) => x + (+y.tbayar), 0)
          s.sisa = f.reduce((x, y) => x + (+y.sisa), 0)
          dta.push(s) // add to data array
          //          console.log(dta)
          // tinggal add judulnya
        }
      }
      return dta
    })
    const total = computed(() => {
      let x = {}
      x.nilai = dtRekap.value.reduce((a, b) => root.$dwn.jumlah([a, b.nilai]), 0)
      x.tbayar = dtRekap.value.reduce((a, b) => root.$dwn.jumlah([a, b.tbayar]), 0)
      x.sisa = dtRekap.value.reduce((a, b) => root.$dwn.jumlah([a, b.sisa]), 0)
      return x
    })
    onMounted(() => {
      dtCab()
        .then(res => {
          dt.dtCabang = res.data
        })
        .catch(err => console.log(err))
      getHP()
    })
    const getHP = () => {
      let x = { kodeCab: dt.kodeCab, status: dt.jh.status.value }
      dthpSales(x)
        .then(res => {
          let a = res.data.map(u => {
            let y = u
            y.sisa = y.status === 'O' ? root.$dwn.jumlah([u.nilai, -u.tbayar]) : 0
            y.tbayar = y.status !== 'O' ? u.nilai : u.tbayar
            return y
          })
          dt.dtJurnal = a
        })
        .catch((err) => {
          console.log(err)
        })
    }
    watch(() => root.$store.state.auth.setCabang, (val) => {
      dt.kodeCab = val
      getHP()
    })
    const toDown = () => {
      let x = {
        judul: 'Laporan Piutang per Sales',
        dt: detHP.value,
        hdr: jdl.value,
        naFile: `LapHP`
      }
      root.$dwn.toExcel(x)
    }
    const getByr = async (x, y, z) => {
      if (z) {
        x.rekap = dt.rekap
        let dbyr = await cekByr(x)
        if (dbyr.data.length) {
          dt.detByr.forEach((a, b, c) => {
            if (a.nomorReff === x.nomorJurnal.toString()) {
              c.splice(b, 1)
            }
          })
          dt.detByr.push(...dbyr.data)
        }
      }
    }
    const cabAsi = computed(() => {
      return dt.dtCabang.filter(a => a.compCode === 'ASI')
    })
    return { ...toRefs(dt), cabAsi, getByr, getHP, toDown, total, jdl, detHP, dtRekap }
  }
}
</script>
<style lang="sass">
.detHP
  /* max height is important */
  /* .q-table__middle
    max-height: 300px */

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th
    /* bg color is important for th; just specify one */
    background-color: #ff8c66

  thead tr th
    position: sticky
    z-index: 1
  thead tr:first-child th
    top: 0
  tbody
    font-style: italic

  /* this is when the loading indicator appears */
  &.q-table--loading thead tr:last-child th
    /* height of all previous header rows */
</style>
