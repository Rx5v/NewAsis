<template>
  <q-page padding>
    <div>
      <div class="col-12">
        <dataPO @ambil="onRkt"/>
      </div>
      <div>
      <q-table
        class="dataPR"
        :data="dtPR"
        :columns="jdl"
        row-key="iddetPO"
        :filter="cari"
        :pagination.sync="hal"
        dense>
        <template v-slot:top>
          <div class="col-2 q-table__title">Data Rekap Pesanan</div>
          <q-space/>
          <q-input dense debounce="300" v-model="cari" placeholder="Search" class="q-ml-sm">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </template>
        <template v-slot:body-cell-act="props">
          <q-td auto-width>
            <q-btn label="Rakit" @click="onRkt(props.row)" v-if="props.row.kodeBOM"/>
          </q-td>
        </template>
      </q-table>
      <q-dialog
        full-width
        v-model="rkt">
        <rakit :jh="jh"/>
      </q-dialog>
      </div>
    </div>
  </q-page>
</template>

<script>
import { reactive, onMounted, toRefs } from '@vue/composition-api'
import { rkpPesanan } from '../services/apiList'
import rakit from '../components/produksi/rakit'
import dataPO from '../components/dataPO'
export default {
  components: {
    rakit,
    dataPO
  },
  setup (props, { refs }) {
    const dt = reactive({
      hal: { rowsPerPage: 10 },
      dtPR: [],
      jdl: [
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left' },
        { name: 'qty', label: 'Qty Request', field: row => row.qty, jml: 'Y', align: 'right' },
        { name: 'stok', label: 'Stok', field: row => row.stok, jml: 'Y', align: 'right' },
        { name: 'act', label: 'Act' }
      ],
      cari: '',
      rkt: false,
      jh: {}
    })
    const getRkp = () => {
      rkpPesanan({ kodeCab: 'MP01' })
        .then(({ data }) => {
          dt.dtPR = data
        })
    }
    onMounted(() => {
      getRkp()
    })
    const onRkt = (x) => {
      dt.jh = x
      dt.jh.tgl = new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
      dt.rkt = true
    }
    return { getRkp, ...toRefs(dt), onRkt }
  }
}
</script>
