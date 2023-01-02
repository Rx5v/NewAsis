<template>
  <q-page padding>
    <dataPO ref="po" @ambil="onpil" @dtBrg="ganti"/>
    <jualBeli ref="jb" :jnsTrx="jnsTrx" status="W" v-show="jubel" @jubel="terkirim"/>
    <!-- content -->
  </q-page>
</template>

<script>
import { ref, reactive, toRefs } from '@vue/composition-api'
import dataPO from '../components/pricing'
import jualBeli from '../components/jualBeli'
export default {
  // name: 'PageName',
  components: {
    dataPO,
    jualBeli
  },
  setup (props, { refs, root }) {
    const jnsTrx = ref('J')
    const dt = reactive({
      jubel: false
    })
    const ganti = (x) => {
      if (['MAN', 'purchase', 'acc'].some(a => a === root.$store.state.auth.user.userType)) refs.jb.onReset()
    }
    const onpil = (x, y) => {
      dt.jubel = true
      if (refs.jb.pr.kodePartner !== y.kodePartner) {
        refs.jb.onReset()
      }
      y.ac = 'N'
      refs.jb.pr.cabID = y.cabID
      refs.jb.pr.judulTransaksi = `Dari Penawaran ${y.nomorPricing}`
      refs.jb.pr.cabLain = y.ac === 'Y' ? y.cabLain : ''
      refs.jb.pr.ac = y.ac
      refs.jb.cust.namaPartner = y.namaPartner
      refs.jb.cust.alamat = y.alamat
      refs.jb.cust.kodePartner = y.kodePartner
      refs.jb.cust.point = y.point
      refs.jb.pr.kodePartner = y.kodePartner
      refs.jb.pr.nomorPricing = y.nomorPricing
      let m = { ...x }
      m.sisa = x.qty - m.kirim
      m.qty = m.sisa
      m.hargaSat = m.hargaJual / m.kemasan.isi
      m.hargaKemasan = m.hargaJual
      if (y.ac === 'Y') {
        refs.jb.cekStoki({ m })
      } else {
        refs.jb.cekStoki(m)
      }
    }
    const jubel = () => {
      refs.po.getPR()
      refs.po.dtTrxPR = []
    }
    const terkirim = () => {
      dt.jubel = false
      refs.po.getPR()
    }
    return { ganti, jubel, onpil, jnsTrx, ...toRefs(dt), terkirim }
  }
}
</script>
