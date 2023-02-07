<template>
  <div class="col-12">
    <q-card v-if="dtJurnal.length">
      <q-card-actions
        style="background: linear-gradient(to left, transparent,rgba(0, 150,95,0.8))">
        <q-chip color="blue-6" class="text-white text-bold" clickable>Kas dan Bank</q-chip>
        <q-space/>
        <q-chip color="blue-6" class="text-white text-bold" outline clickable>Periode : {{ filt.tgla }} - {{ filt.tglb }}</q-chip>
      </q-card-actions>
      <q-separator />
      <q-scroll-area style="height: 400px">
        <q-card-section>
          <q-list dense>
            <q-item v-for="(kas, i) in dtJurnal.filter(a => a.saldoAkhir !== 0)" :key="i">
              <q-item-section>
                <q-item-label >{{ i + 1 }}. {{ kas.namaAkun }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label>{{ kas.saldoAkhir | duit}}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-scroll-area>
      <q-card-actions>
        <q-item dense>
          <q-item-section>
            <q-item-label>Saldo Kas</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-item-label class="text-teal">{{ dtJurnal.filter(a => a.subAkun === '11010').reduce((a, b) => $dwn.jumlah([a, b.saldoAkhir]), 0) | rupiah}}</q-item-label>
          </q-item-section>
        </q-item>
        <q-space/>
        <q-item dense>
          <q-item-section>
            <q-item-label>Saldo Bank</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-item-label class="text-teal">{{ dtJurnal.filter(a => a.subAkun === '11020').reduce((a, b) => $dwn.jumlah([a, b.saldoAkhir]), 0) | rupiah}}</q-item-label>
          </q-item-section>
        </q-item>
      </q-card-actions>
    </q-card>
  </div>
</template>
<script>
import { onMounted, reactive, toRefs } from '@vue/composition-api'
import { nrcSaldo } from '../../services/apiList'

export default ({
  props: {
    filt: {
      type: Object,
      default: () => {
        return {
          tgla: '',
          tglb: '',
          kodeCab: [],
          cabID: []
        }
      }
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      dtJurnal: []
    })
    const getData = (v) => {
      nrcSaldo({ ...v, jns: true })
        .then(({ data }) => {
          let a = data.filter(s => ['11010', '11020'].some(sub => sub === s.subAkun))
          dt.dtJurnal = a.map((x, y) => {
            let u = x
            u.saldoAkhir = u.jnsAkun === 'D' ? root.$dwn.jumlah([x.saldo, x.debit, -x.kredit])
              : root.$dwn.jumlah([x.saldo, x.kredit, -x.debit])
            return u
          })
        })
        .catch((err) => {
          console.log(err)
        })
    }
    onMounted(() => {
      getData(props.filt)
    })
    return {
      ...toRefs(dt),
      getData
    }
  },
  watch: {
    filt: {
      handler (v) {
        this.getData(v)
      },
      deep: true
    }
  }
})
</script>
