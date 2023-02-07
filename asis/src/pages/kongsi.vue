<template>
  <q-page padding>
    <dataKongsi ref="po"  @ambil="onpil"/>
    <jualBeli ref="jb" :jnsTrx="jnsTrx" status="W" v-show="jubel" @jubel="jubel= false" />
  </q-page>
</template>

<script>
import { ref, reactive, toRefs } from '@vue/composition-api'
import dataKongsi from '../components/dataKongsi'
import jualBeli from '../components/jualBeli'
export default {
  components: {
    dataKongsi,
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
    const onpil = (y) => {
      console.log(y)
      dt.jubel = true
      if (refs.jb.pr.kodePartner !== y.kodePartner) {
        refs.jb.onReset()
      }
      y.ac = 'N'
      refs.jb.pr.cabID = y.cabID
      refs.jb.pr.cabLain = ''
      // refs.jb.pr.ac = 'N'
      refs.jb.cust.namaPartner = y.namaPartner
      refs.jb.cust.alamat = y.alamat
      refs.jb.cust.kodePartner = y.kodePartner
      refs.jb.pr.kodePartner = y.kodePartner
      refs.jb.cust.point = y.point
      refs.jb.pr.pjKongsi = 'Y'
      let m = { ...y }
      m.sisa = y.qty - m.kirim
      m.qty = 0
      m.hargaSat = m.qty * m.hargaJual
      if (y.ac === 'Y') {
        refs.jb.cekStoki({ m })
      } else {
        refs.jb.cekStoki(m)
      }
    }
    const jubel = () => {
      refs.po.getKongsi()
      dt.jubel = false
    }
    return { ganti, jubel, onpil, jnsTrx, ...toRefs(dt) }
  }
}
</script>
