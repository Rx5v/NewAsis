<template>
  <q-card>
    <q-card-section>
      <q-table
        class="detTrx"
        :data="dtTrans"
        :columns="jdl"
        separator="cell"
        dense>
        <template v-slot:top>
          <div class="text-h6">Transaksi HPP Nol</div>
        </template>
        <template v-slot:body-cell-Act="props">
          <q-btn outline rounded label="Cek" @click="cekHis(props.row)"/>
        </template>
        <template v-slot:body-cell-hpp="props">
          <q-td align="right">
            <q-chip color="orange" outline @click="cekHis(props.row)">{{ props.row.hpp }}</q-chip>
          </q-td>
        </template>
      </q-table>
    </q-card-section>
    <q-dialog v-model="hb" seamless position="bottom"
      full-width>
      <q-card class="bg-teal-5">
        <q-card-actions>
          <q-btn icon="close" dense class="absolute-top-right" color="accent" v-close-popup/>
        </q-card-actions>
        <q-card-section>
          <hisBar ref="ch" :tanggal="{ from: filt.tgla, to: filt.tglb }"/>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script>
import { onMounted, reactive, toRefs, watch } from '@vue/composition-api'
import hisBar from './hisBarang'
import { cekHPP } from '../services/apiList'
export default {
  // name: 'ComponentName',
  components: {
    hisBar
  },
  props: {
    pilih: {
      type: Object,
      default: () => {
        return {
          kodeCab: [],
          jnsTrx: 'J',
          tgla: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
          tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
          allCab: true
        }
      }
    }
  },
  setup (props, { root, refs }) {
    const dt = reactive({
      hb: false,
      dtTrans: [],
      jdl: [
        { name: 'namaKaryawan', label: 'Nama Sales', field: row => row.namaKaryawan, sortable: true, align: 'left' },
        { name: 'nomorBukti', label: 'Nomor Bukti', field: row => row.nomorBukti, sortable: true, align: 'left' },
        { name: 'tglKirim', label: 'Tanggal Kirim', field: row => row.tglKirim, sortable: true, align: 'left' },
        { name: 'namaCust', label: 'Nama Cust', field: row => row.namaCust, sortable: true, align: 'left' },
        { name: 'namaBarang', label: 'Nama Barang', field: row => row.namaBarang, sortable: true, align: 'left' },
        { name: 'qty', label: 'Qty Sales', field: row => row.qty, jml: 'Y', sortable: true, align: 'right' },
        { name: 'hpp', label: 'Nilai HPP', field: row => row.hpp, format: val => new Intl.NumberFormat('en-ID', { style: 'currency', currency: 'IDR' }).format(val), jml: 'Y', sortable: true, align: 'right' },
        { name: 'dpp', label: 'Nilai DPP', field: row => row.dpp, format: val => new Intl.NumberFormat('en-ID', { style: 'currency', currency: 'IDR' }).format(val), jml: 'Y', sortable: true, align: 'right' },
        { name: 'jmlHarga', label: 'Nilai Jual', field: row => row.jmlHarga, format: val => new Intl.NumberFormat('en-ID', { style: 'currency', currency: 'IDR' }).format(val), jml: 'Y', sortable: true, align: 'right' },
        { name: 'jmlHargaR', label: 'Nilai Retur', field: row => row.jmlHargaR, jml: 'Y', sortable: true, align: 'right' },
        { name: 'Act', label: 'Act' }
      ],
      filt: props.pilih
    })
    const cekHis = (x) => {
      dt.hb = true
      const a = {
        kodeCab: x.asal,
        kodeProduk: x.kodeProduk
      }
      root.$nextTick(() => refs.ch.cekHis(a))
    }
    const detailTrx = () => {
      dt.dtTrans = []
      let ss = ['MAN', 'acc', 'purchase', 'mitra'].some(a => a === root.$store.state.auth.user.userType)
      if (dt.filt.kodeCab.length || !ss) {
        dt.filt.jnsTrx = 'J'
        cekHPP(dt.filt)
          .then(({ data }) => {
            dt.dtTrans = data.filter(a => dt.filt.kodeCab.some(s => s === a.asal)).map(a => {
              a.hpp = ['MAN', 'acc', 'purchase', 'mitra'].some(a => a === root.$store.state.auth.user.userType) ? a.hpp : 0
              a.laba = ['MAN', 'acc', 'purchase', 'mitra'].some(a => a === root.$store.state.auth.user.userType) ? root.$dwn.jumlah([a.jmlHarga, -a.jmlHargaR, a.hppR, -a.hpp, -a.pointMember]) : 0
              return a
            })
          })
          .catch(err => {
            console.log(err)
          })
      }
    }
    onMounted(() => {
      detailTrx()
    })
    watch(() => root.$store.state.auth.setCabang, (val) => {
      dt.filt.kodeCab = [val]
      detailTrx()
    })
    return {
      ...toRefs(dt),
      cekHis,
      detailTrx
    }
  }
}
</script>
