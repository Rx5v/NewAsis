<template>
    <q-card>
      <q-card-actions>
        <q-chip color="blue-6" class="text-white text-bold" clickable>{{ judul }} Harian</q-chip>
        <q-select
          filled
          v-model="jh.kodeAkun"
          dense
          options-dense
          input-debounce="0"
          label="Pilih Asal Akun"
          :options="allAkun"
          :option-label="(item) => item && item.kodeAkun + ' ' + item.namaSubAkun  + ' ' + item.namaAkun"
          option-value="kodeAkun"
          map-options
          emit-value
          :rules="inRul"
          @input="getData(jh)"
          style="width: 250px"
          readonly
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
        <q-input
          v-model="limit"
          :label="`Di atas Rp. ${Number(limit).toLocaleString()}`"/>
        <q-space/>
        <q-chip color="blue-6" class="text-white text-bold" outline clickable>Tanggal : {{ jh.tglb }}</q-chip>
      </q-card-actions>
      <q-separator />
      <q-scroll-area style="height: 400px">
        <q-card-section>
          <q-list dense>
            <q-item>
              <q-item-section>
                <q-item-label >Nama Partner</q-item-label>
              </q-item-section>
              <q-item-section>
                <q-item-label >Nama Cabang</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label>{{ judul }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-separator color="teal"/>
            <q-item v-for="(kas, i) in dtJurnal.filter(a => a.saldo >= limit)" :key="i">
              <q-item-section>
                <q-item-label >{{ i + 1 }}. {{ kas.namaPartner }}</q-item-label>
              </q-item-section>
              <q-item-section>
                <q-item-label >{{ kas.namaCabang }}</q-item-label>
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
            <q-item-label>Total</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-item-label class="text-teal">{{ dtJurnal.reduce((a, b) => $dwn.jumlah([a, b.saldo]), 0) | rupiah}}</q-item-label>
          </q-item-section>
        </q-item>
      </q-card-actions>
    </q-card>
</template>
<script>
import { computed, onMounted, reactive, toRefs } from '@vue/composition-api'
import { cekTopHP, accRek } from '../../services/apiList'

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
    },
    judul: {
      type: String,
      default: () => {
        return 'Piutang'
      }
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      dtJurnal: [],
      allAkun: [],
      jh: { ...props.filt, kodeAkun: '110500001', jhp: 'P' },
      inRul: [ v => !!v || 'Isi data' ],
      limit: 10000000
    })
    const kodeAkun = computed(() => {
      return props.judul === 'Piutang' ? '110500001' : '210100001'
    })
    const jhp = computed(() => {
      return props.judul === 'Piutang' ? 'P' : 'H'
    })
    const getData = (v) => {
      let x = {...v}
      x.kodeAkun = x.kodeAkun || kodeAkun.value
      x.jhp = jhp.value || 'P'
      cekTopHP(x)
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
          dt.allAkun = res.data.filter(a => ['110500001', '210100001'].includes(a.kodeAkun))
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
        this.jh = { ...v, kodeAkun: '110500001', jhp: 'P' }
        this.getData(this.jh)
      },
      deep: true
    }
  }
})
</script>
