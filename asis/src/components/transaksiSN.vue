<template>
  <q-table
      class="dataPR"
      :data="dtTrx"
      :columns="jdl"
      row-key="SN"
      :filter="cari"
      dense>
      <template v-slot:top>
        <div class="col-xs-12 col-md-4 q-table__title">Transaksi pengiriman berdasarkan SN</div>
        <q-space />
        <q-chip color="blue" class="text-white">{{ tgl !== null && tgl.from ? (tgl.from + ' ~ ' + tgl.to) : tgl }}
          <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
            <q-date v-model="tgl" range @input="(x) => x && (lap(),$refs.qDateProxy.hide())" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
          </q-popup-proxy>
        </q-chip>
        <q-input dense debounce="300" v-model="cari" placeholder="Search" class="q-ml-md">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-select
          v-if="['MAN','purchase', 'acc', 'mitra'].some(a=> a== $store.state.auth.user.userType)"
          v-model="filt.kodeCab"
          :options="cabAll"
          :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
          option-value="kodeCab"
          emit-value
          map-options
          style="min-width: 250px; max-width: 300px"
          label="Pilih cabang... "
          :rules="inRul"
          dense
          class="q-ml-md"
          @input="lap()"
          lazy-rules/>
        <q-btn
          flat round dense
          icon="file_download"
          @click="toDown(dtTrx)"
          class="q-ml-md"
          color="primary"
        />
      </template>
      <template v-slot:body-cell-No="props">
        <q-td auto-width>
          {{ props.rowIndex + 1 }}
        </q-td>
      </template>
      <template v-slot:body-cell-Act="props">
        <q-td auto-width>
          <q-btn
            flat round dense
            icon="file_download"
            @click="toDown(dtTrx, props.row.nomorBukti)"
            class="q-ml-md"
            color="primary"
          />
        </q-td>
      </template>
      <!-- <template v-slot:bottom-row>
        <q-tr>
          <q-th align="right" colspan="6">Total</q-th>
          <q-th align="right"></q-th>
          <q-th align="right" >
            {{ dtHis.reduce((a, b) => $dwn.jumlah([a, b.masuk]), 0) | duit}}
          </q-th>
          <q-th align="right">{{ dtHis.reduce((a, b) => $dwn.jumlah([a, b.keluar]), 0) | duit}}</q-th>
          <q-th align="right">{{ dtHis.reduce((a, b) => $dwn.jumlah([a, b.masuk, -b.keluar]), 0) | duit}}</q-th>
          <q-th align="right"></q-th>
        </q-tr>
      </template> -->
    </q-table>
</template>

<script>
import { cabang, trxSN } from '../services/apiList'
import { reactive, computed, toRefs, watch } from '@vue/composition-api'
export default {
  props: {
    pilih: {
      type: Object,
      default: function () {
        return {
          kodeCab: null,
          kodeProduk: ''
        }
      }
    },
    tanggal: {
      type: Object,
      default: () => {
        return {
          from: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
          to: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
        }
      }
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      filt: {
        tgla: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        kodeCab: root.$store.state.auth.setCabang
      },
      tgl: props.tanggal,
      dtTrx: [],
      cabAll: [],
      cari: '',
      inRul: [v => !!v || 'Isi data'],
      kodeCab: root.$store.state.auth.user.kodeCab
    })
    const jdl = computed(() => {
      const b = [
        { name: 'No', label: 'No' },
        { name: 'tglKirim', label: 'Tanggal', field: row => row.tglKirim, align: 'right' },
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left' },
        { name: 'nomorBukti', label: 'Nomor Bukti', field: row => row.nomorBukti, align: 'left' },
        { name: 'nomorJurnal', label: 'Nomor Jurnal', field: row => row.nomorJurnal, align: 'left' },
        { name: 'namaPartner', label: 'Nama Partner', field: row => row.namaPartner, align: 'left' },
        { name: 'SN', label: 'SN', field: row => row.SN, sortable: true },
        { name: 'namaSales', label: 'namaSales', field: row => row.namaSales, sortable: true },
        { name: 'status', label: 'Status', field: row => row.status, align: 'left' },
        { name: 'Act', label: 'Act' }
      ]
      return b
    })
    cabang()
      .then(({ data }) => {
        dt.cabAll = data
      })
    const lap = (x) => {
      dt.filt.tgla = dt.tgl.from || dt.tgl
      dt.filt.tglb = dt.tgl.to || dt.tgl
      dt.filt = { ...dt.filt, ...x }
      trxSN(dt.filt)
        .then(res => {
          dt.dtTrx = res.data
        })
        .catch(err => {
          console.log(err)
        })
    }
    watch(() => root.$store.state.auth.setCabang, (val) => {
      dt.filt.kodeCab = val
      lap()
    })
    const toDown = (y, z) => {
      const data = z ? y.filter(a => a.nomorBukti === z).map((a, i) => {
        a.No = i + 1
        return a
      }) : y.map((a, i) => {
        a.No = i + 1
        return a
      })
      const x = {
        judul: `Transaksi Barang per Serial Nomer Periode ${dt.filt.tgla} s/d ${dt.filt.tglb}`,
        dt: data,
        hdr: jdl.value,
        naFile: 'trxSN_' + (z || `${dt.filt.tgla} to ${dt.filt.tglb}`)
      }
      root.$dwn.toExcel(x)
    }
    return { ...toRefs(dt), jdl, lap, toDown }
  }
}
</script>
