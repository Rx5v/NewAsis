<template>
  <q-page padding>
    <dataPO @ambil="onpil" @dtBrg="ganti"/>
    <sjln ref="jb" :jnsTrx="jnsTrx" status="W" v-show="jubel" @jubel="jubel= false"/>
    <cekSN/>
  </q-page>
</template>

<script>
import { ref, reactive, toRefs } from '@vue/composition-api'
import dataPO from '../../components/dataPO'
import sjln from '../../components/sjln'
import cekSN from '../../components/cariSN'
export default {
  // name: 'PageName',
  components: {
    dataPO,
    sjln,
    cekSN
  },
  setup (props, { refs, root }) {
    const jnsTrx = ref('J')
    const dt = reactive({
      jubel: false
    })
    const ganti = (x) => {
      if (['MAN', 'purchase'].some(a => a === root.$store.state.auth.user.userType)) refs.jb.onReset()
    }
    const onpil = (x, y) => {
      if (refs.jb.pr.kodePartner !== y.kodePartner) {
        refs.jb.onReset()
      }
      dt.jubel = true
      y.ac = 'N'
      refs.jb.pr.cabID = y.cabID
      refs.jb.pr.cabLain = y.ac === 'Y' ? y.cabLain : ''
      refs.jb.pr.ac = y.ac
      refs.jb.cust.namaPartner = y.namaPartner
      refs.jb.cust.alamat = y.alamat
      refs.jb.pr.kodePartner = y.kodePartner
      refs.jb.pr.nomorPO = y.nomorPO
      refs.jb.pr.salesID = y.salesID
      let m = { ...x }
      m.sisa = x.qty - m.kirim
      m.qty = m.sisa
      m.hargaSat = m.qty * m.hargaJual
      if (y.ac === 'Y') {
        refs.jb.cekStoki({ m })
        console.log(m)
      } else {
        refs.jb.cekStoki(m)
        console.log(y)
      }
    }
    return { ganti, onpil, jnsTrx, ...toRefs(dt) }
  }
}
</script>
