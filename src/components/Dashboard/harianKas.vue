<template>
    <q-card v-if="dtJurnal.length">
      <q-card-actions>
        <q-chip color="blue-6" class="text-white text-bold" clickable>Saldo Harian</q-chip>
        <q-select
          filled
          v-model="jh.kodeAkun"
          dense
          options-dense
          input-debounce="0"
          label="Pilih Asal Akun Kas"
          :options="allAkun"
          :option-label="(item) => item && item.kodeAkun + ' ' + item.namaSubAkun  + ' ' + item.namaAkun"
          option-value="kodeAkun"
          multiple
          map-options
          emit-value
          :rules="inRul"
          @input="getData(jh)"
          style="width: 250px"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">
                No results
              </q-item-section>
            </q-item>
          </template>
        </q-select>
        <q-space/>
        <q-chip color="blue-6" class="text-white text-bold" outline clickable>Tanggal : {{ jh.tglb }}</q-chip>
      </q-card-actions>
      <q-separator />
      <q-scroll-area style="height: 400px">
        <q-card-section>
          <q-list dense>
            <q-item>
              <q-item-section>
                <q-item-label >Nama Cabang</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label>Saldo</q-item-label>
              </q-item-section>
            </q-item>
            <q-separator color="teal"/>
            <q-item v-for="(kas, i) in dtJurnal" :key="i">
              <q-item-section>
                <q-item-label >{{ i + 1 }}. {{ kas.cabID }} {{ kas.namaCabang }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label>{{ kas.saldo | duit}}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-scroll-area>
      <q-card-actions>
        <q-space/>
        <q-item dense>
          <q-item-section>
            <q-item-label>Total Saldo</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-item-label class="text-teal">{{ dtJurnal.reduce((a, b) => $dwn.jumlah([a, b.saldo]), 0) | rupiah}}</q-item-label>
          </q-item-section>
        </q-item>
      </q-card-actions>
    </q-card>
</template>
<script>
import { onMounted, reactive, toRefs } from '@vue/composition-api'
import { cekSaldoMulti, accRek } from '../../services/apiList'

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
      dtJurnal: [],
      kodeAkun: ['110100002'],
      allAkun: [],
      jh: { ...props.filt, kodeAkun: ['110100002'] },
      inRul: [ v => !!v || 'Isi data' ]
    })
    const getData = (v) => {
      let x = {...v}
      x.kodeAkun = x.kodeAkun || dt.kodeAkun
      cekSaldoMulti(x)
        .then(({ data }) => {
          dt.dtJurnal = data
        })
        .catch((err) => {
          console.log(err)
        })
    }
    onMounted(() => {
      getData(dt.jh)
      accRek()
        .then(res => {
          dt.allAkun = res.data.filter(s => ['11010', '11020'].includes(s.subAkun))
        })
    })
    return {
      ...toRefs(dt),
      getData
    }
  },
  watch: {
    filt: {
      handler (v) {
        this.jh = { ...v, kodeAkun: ['110100002']}
        this.getData(this.jh)
      },
      deep: true
    }
  }
})
</script>
