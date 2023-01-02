<template>
  <q-page padding>
    <dataPR @ambil="onpil" @dtBrg="ganti"/>
    <template v-if="$store.state.auth.user.userType === 'produksi'">
      <q-dialog
        full-width
        v-model="rkt">
        <rakit :jh="jh"/>
      </q-dialog>
    </template>
    <template v-else>
      <sjln ref="jb" jnsTrx="J" status="W" />
    </template>
    <!-- content -->
  </q-page>
</template>

<script>
import dataPR from '../components/dataPesanan'
import sjln from '../components/sjln'
import rakit from '../components/produksi/rakit'
import { reactive, toRefs } from '@vue/composition-api'
import { dtboms } from '../services/apiList'
export default {
  // name: 'PageName',
  components: {
    dataPR,
    sjln,
    rakit
  },
  setup (props, { refs, root }) {
    const dt = reactive({
      jh: { qty: 0 },
      rkt: false
    })
    const onpil = (x, y) => {
      console.log('iki', x)
      if (root.$store.state.auth.user.userType === 'produksi') {
        dtboms(x.kodeProduk)
          .then(({ data }) => {
            dt.jh = { ...data[0], qty: x.qty }
            dt.jh.tgl = new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
            dt.rkt = true
          })
      } else {
        if (refs.jb.pr.cabLain !== y.cabID) {
          refs.jb.onReset()
        }
        refs.jb.pr.ct = 'tempo'
        refs.jb.pr.akunBayar = '110500001'
        refs.jb.pr.cabID = y.cabLain
        refs.jb.pr.nomorPR = y.nomorPR
        refs.jb.pr.ac = 'Y'
        refs.jb.cust.namaPartner = y.namaPartner
        refs.jb.cust.alamat = y.alamat
        refs.jb.cust.kodePartner = y.kodePartner
        refs.jb.cust.point = 'N'
        if (y.oleh) {
          refs.jb.pr.salesID = y.oleh
        }
        refs.jb.pr.cabLain = y.cabID
        let m = { ...x }
        m.sisa = x.qty - m.kirim
        m.qty = m.sisa
        m.kemasan = { isi: 1, kemasan: 'Pcs' }
        // m.jmlKemasan = m.qty
        refs.jb.cekStoki(m)
      }
    }
    const ganti = () => {
      refs.jb.onReset()
    }
    return { ...toRefs(dt), onpil, ganti }
  }
}
</script>
