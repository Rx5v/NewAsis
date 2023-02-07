<template>
  <q-page padding>
    <dataPO ref="po" @ambil="onpil" @dtBrg="ganti"/>
    <jualBeli ref="jb" :jnsTrx="jnsTrx" status="W" v-show="jubel" @jubel="jubel= false"/>
    <!-- content -->
  </q-page>
</template>

<script>
import { ref, reactive, toRefs } from '@vue/composition-api'
import dataPO from '../components/dataPO'
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
      // refs.jb.pr.tgl = y.tglRequest
      refs.jb.pr.cabID = y.cabID
      refs.jb.pr.cabLain = y.ac === 'Y' ? y.cabLain : ''
      refs.jb.pr.ac = y.ac
      refs.jb.cust.namaPartner = y.namaPartner
      refs.jb.cust.alamat = y.alamat
      refs.jb.cust.kodePartner = y.kodePartner
      refs.jb.cust.point = x.point
      refs.jb.pr.kodePartner = y.kodePartner
      refs.jb.pr.nomorPO = y.nomorPO
      let m = { ...x }
      m.sisa = x.qty - m.kirim
      m.qty = m.sisa
      m.hargaSat = m.qty * m.hargaJual
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
    return { ganti, jubel, onpil, jnsTrx, ...toRefs(dt) }
  }
}
</script>
