<template>
  <q-page padding>
    <q-form
      ref="form"
      @submit="simpan(jh)"
      @reset="onReset"
      class="q-gutter-md">
      <div class="col-4 q-table__title">Deposit</div>
      <q-select
        v-if="['MAN','acc'].some(a=> a== $store.state.auth.user.userType)"
        v-model="jh.kodeCab"
        :options="cabAll"
        :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
        option-value="kodeCab"
        emit-value
        map-options
        style="min-width: 250px; max-width: 300px"
        label="Pilih cabang... "
        :rules="inRul"
        @input="cekSal(jh.kodeAkun)"
        dense
        lazy-rules/>
      <q-select
        v-model="jh.salesID"
        use-input
        :options="pilihSales"
        :option-label="(item) => item && item.namaKaryawan +' '+ item.namaCabang"
        option-value="salesID"
        options-dense
        emit-value
        map-options
        style="min-width: 250px; max-width: 300px"
        label="Partner"
        @filter="filterKn"
        :rules="inRul"
        dense
        lazy-rules/>
        <q-select
          filled
          v-model="jh.kodeAkun"
          dense
          options-dense
          input-debounce="0"
          label="Pilih Asal Akun Kas"
          :options="akunKas"
          :option-label="(item) => item && item.kodeAkun + ' ' + item.namaSubAkun  + ' ' + item.namaAkun"
          option-value="kodeAkun"
          map-options
          emit-value
          :rules="inRul"
          @input="cekSal(jh.kodeAkun)"
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
        <q-chip color="orange">Saldo : {{ saldo.saldo | duit}}</q-chip>
        <q-input
          v-model="jh.uraian"
          :rules="inRul"
          dense
          label="Judul Transaksi"/>
        <q-input
          v-model="jh.nilai"
          :rules="inRul"
          type="number"
          label="Nilai"/>
      <div align="right">
        <q-btn label="Reset" type="reset" color="orange" class="q-ml-sm" />
        <q-btn label="Submit" type="submit" color="primary" class="q-ml-sm"/>
      </div>
    </q-form>
  </q-page>
</template>

<script>
import { accRek, inKas, dtCab, cekSaldo, carikar } from '../services/apiList'
import { reactive, computed, toRefs } from '@vue/composition-api'
export default {
  props: {
    jnsTrx: {
      type: String,
      default: 'MK'
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      valid: true,
      inRul: [ v => !!v || 'Isi data' ],
      jurnal: [],
      jdl: [
        { label: 'Deskripsi', name: 'desk', field: row => row.desk, align: 'left' },
        { label: 'Akun', name: 'kodeAkun', field: row => row.kodeAkun, align: 'left' },
        { label: 'D/K', name: 'DK', field: row => row.DK, align: 'right' },
        { label: 'Nilai', name: 'nilai', field: row => row.nilai, align: 'right' },
        { label: 'act', name: 'act' }
      ],
      menu: false,
      date: null,
      jh: { tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        uraian: '',
        kodeCab: 'MP01',
        salesID: '',
        kodePartner: '' },
      jns: [
        { text: 'Debet', value: 'D' },
        { text: 'Kredit', value: 'K' }
      ],
      alAkun: [],
      options: [],
      akunKB: [],
      detJur: [],
      addJur: { kodeAkun: null, DK: 'D', nilai: 0 },
      ckSub: '',
      akunCOA: {},
      cabAll: [],
      saldo: { saldo: 0 },
      pilihSales: [],
      dtSales: []
    })
    const title = computed(() => props.jnsTrx === 'KK' ? 'Keluar' : 'Masuk')
    const akun = computed(() => {
      let a = props.jnsTrx === 'KK' ? dt.alAkun.filter(y => y.kasKeluar === 'Y')
        : dt.alAkun.filter(y => y.kasMasuk === 'Y')
      return a
    })
    const akunKas = computed(() => dt.alAkun.filter(a => a.arusKas === 'Y'))
    const total = computed(() => {
      let a = {}
      a.DK = 'K'
      a.kodeAkun = dt.jh.kodeAkun
      a.desk = `${dt.jh.uraian} by ${root.$store.state.auth.user.nama}`
      a.nilai = dt.detJur.length ? dt.detJur.reduce((a, b) => root.$dwn.jumlah([a, b.nilai]), 0) : 0
      return a
    })
    carikar(root.$store.state.auth.user.kodeCab)
      .then(({ data }) => {
        dt.dtSales = data
      })
      .catch(err => {
        console.log(err)
      })
    const filterKn = (val, update) => {
      if (val === '') {
        update(() => {
          dt.pilihSales = dt.dtSales
        })
        return
      }
      update(() => {
        const needle = val.toLowerCase()
        dt.pilihSales = dt.dtSales.filter(v => (v.namaKaryawan.toLowerCase().indexOf(needle) > -1))
      })
    }
    dtCab()
      .then(res => {
        dt.cabAll = res.data
      })
    accRek()
      .then(res => {
        dt.alAkun = res.data
        dt.akunKB = new Set(res.data.filter(s => s.KB === 'Y').map(a => a.kodeAkun))
      })
    const filterFn = (val, update) => {
      if (val === '') {
        update(() => {
          dt.options = akun.value
        })
        return
      }
      update(() => {
        const needle = val.toLowerCase()
        dt.options = dt.alAkun.filter(v => (v.namaSubAkun.toLowerCase().indexOf(needle) > -1 || v.namaAkun.toLowerCase().indexOf(needle) > -1 || v.kodeAkun.toLowerCase().indexOf(needle) > -1))
      })
    }
    const plus = () => {
      dt.addJur.DK = 'D'
      dt.detJur.push(Object.assign({}, dt.addJur))
    }
    const delJur = (item) => {
      const index = dt.detJur.indexOf(item)
      confirm(`Hapus nomer urut ${index + 1} ?`) && dt.detJur.splice(index, 1)
    }
    const cekSal = (x) => {
      let y = { kodeAkun: x, kodeCab: dt.jh.kodeCab }
      cekSaldo(y)
        .then(({ data }) => {
          dt.saldo = data[0]
        })
    }
    const remove = (item) => {
      //        this.chips.splice(this.chips.indexOf(item), 1)
      dt.chips = [] // [...this.chips]
    }
    const clear = () => {
      // q-tdis.$refs.form.reset()
      dt.jh = { tgl: null, uraian: null }
      dt.detJur = []
    }
    const simpan = async () => {
      if (dt.detJur.length > 0 && dt.detJur.every(a => (a.nilai !== 0 && a.kodeAkun !== null)) && ((total.value.nilai <= dt.saldo.saldo))) {
        dt.jh.jnsTrx = props.jnsTrx
        dt.detJur.push(total.value)
        let x = await { hd: dt.jh, det: dt.detJur }
        inKas(x)
          .then(res => {
            root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
            onReset()
          })
          .catch(err => {
            console.log(err)
          })
      } else {
        root.$q.notify({ message: 'Cek data input dan saldo Kas...', color: 'warning' })
      }
    }
    const ok = (x) => {
      console.log('iki')
      if (x) {
        dt.jh.noreff = x
        console.log(x)
      }
    }
    const kb = computed(() => {
      return (dt.detJur.some(s => [...dt.akunKB].includes(s.kodeAkun)) && props.jnsTrx === 'KK') ? 'Y' : 'N'
    })
    const onReset = () => {
      dt.jh = { tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        cabID: '',
        uraian: '',
        salesID: '',
        kodePartner: '' }
      dt.detJur = []
    }
    return { ...toRefs(dt), kb, cekSal, akun, total, filterFn, plus, delJur, remove, clear, simpan, ok, onReset, title, akunKas, filterKn }
  }
}
</script>
