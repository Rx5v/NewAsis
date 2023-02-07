<template>
  <q-page padding>
    <dtAdjust ref="dtAdj" @buatAdj="baru"/>
    <q-dialog
      v-model="badj"
      full-width>
      <div>
        <adjust ref="adj" @tutup="tutup" :pr="pr" :detRR="detR"/>
        <stok @dtStok="onpil"/>
      </div>
    </q-dialog>
  </q-page>
</template>

<script>
import adjust from '../components/adjust'
import stok from '../components/stokSatu'
import dtAdjust from '../components/dtAdjust'
import { reactive, toRefs, watch } from '@vue/composition-api'
export default {
  components: {
    adjust,
    dtAdjust,
    stok
  },
  setup (props, { refs, root }) {
    const dt = reactive({
      badj: false,
      pr: { kodeCab: root.$store.state.auth.setCabang, nomorStokOp: 'Adjust', desk: '', jenis: 'Tambah' },
      detR: []
    })
    const baru = (x) => {
      dt.badj = true
    }
    const onpil = (x) => {
      if (dt.detR.find(a => a.kodeProduk === x.kodeProduk)) {
        alert('Data sudah ada di list....')
      } else {
        dt.detR.push({ ...x })
      }
    }
    const tutup = () => {
      dt.detR = []
      refs.dtAdj.getList()
    }
    watch(() => root.$store.state.auth.setCabang, (val) => {
      dt.pr.kodeCab = val
    })
    return {
      onpil,
      tutup,
      baru,
      ...toRefs(dt)
    }
  }
}
</script>
