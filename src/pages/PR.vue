<template>
  <q-page padding>
    <dataPR @ambil="onpil" @dtBrg="ganti"/>
    <jualBeli ref="jb" :jnsTrx="jnsTrx" status="W" v-if="['MAN','purchase','acc'].some(a=> a===$store.state.auth.user.userType)" />
    <!-- content -->
  </q-page>
</template>

<script>
import { ref } from '@vue/composition-api'
import dataPR from '../components/dataPR'
import jualBeli from '../components/jualBeli'
export default {
  // name: 'PageName',
  components: {
    dataPR,
    jualBeli
  },
  setup (props, { refs, root }) {
    const jnsTrx = ref('B')
    const ganti = (x) => {
      if (['MAN', 'purchase', 'acc'].some(a => a === root.$store.state.auth.user.userType)) refs.jb.onReset()
    }
    const onpil = (x, y) => {
      if (['MAN', 'purchase', 'acc'].some(a => a === root.$store.state.auth.user.userType)) {
        //      jnsTrx.value = y.ac === 'Y' ? 'J' : 'B'
        refs.jb.pr.cabID = y.cabID
        refs.jb.pr.cabLain = y.ac === 'Y' ? y.cabLain : ''
        refs.jb.pr.ac = y.ac
        refs.jb.pr.nomorPR = y.nomorPR
        // refs.jb.judulTransaksi = y.keterangan
        refs.jb.cust.namaPartner = y.namaPartner
        refs.jb.cust.alamat = y.alamat
        refs.jb.cust.kodePartner = y.kodePartner
        refs.jb.cust.point = 'N'
        x.kemasan = x.kemasan || { isi: 1, kemasan: 'Pcs' }
        let m = { ...x }
        m.sisa = x.qty - m.kirim
        m.qty = m.sisa
        m.jmlKemasan = m.qty
        if (y.ac === 'Y') {
          refs.jb.cekStoki(m)
          console.log(m)
        } else {
          refs.jb.onpil(m)
          console.log('kene')
        }
      }
    }
    return { ganti, onpil, jnsTrx }
  }
}
</script>
