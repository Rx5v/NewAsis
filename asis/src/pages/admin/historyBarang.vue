<template>
  <q-page padding>
    <crProduk @dtProduk="cekHis" ref="crProduk"/>
    <historiBarang ref="ch"/>
  </q-page>
</template>
<script>
import crProduk from '../../components/cariProduk'
import historiBarang from '../../components/hisBarang'
import { cabang } from '../../services/apiList'
import { reactive, toRefs } from '@vue/composition-api'
export default {
  components: {
    crProduk,
    historiBarang
  },
  setup (props, { root, refs }) {
    const dt = reactive({
      filt: {
        tgla: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        kodeCab: 'MP01',
        kodeProduk: ''
      },
      tgl: {
        from: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        to: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
      },
      cabAll: [],
      dtHis: [],
      cari: '',
      inRul: [ v => !!v || 'Isi data' ],
      kodeCab: root.$store.state.auth.user.kodeCab
    })
    cabang()
      .then(res => {
        dt.cabAll = res.data
      })
    const cekHis = (x) => {
      dt.filt.tgla = dt.tgl && dt.tgl.from ? dt.tgl.from : dt.tgl || new Date()
      dt.filt.tglb = dt.tgl && dt.tgl.from ? dt.tgl.to : dt.tgl || new Date()
      const a = { ...dt.filt }
      a.kodeProduk = x ? x.kodeProduk : dt.filt.kodeProduk
      refs.ch.cekHis(a)
    }
    return { ...toRefs(dt), cekHis }
  }
}
</script>
