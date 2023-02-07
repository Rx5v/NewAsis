<template>
  <div>
    <q-form
      ref="form"
      @submit="simpan(jh)"
      @reset="onReset"
      class="q-gutter-md">
      <q-table
        :data="detJur"
        :columns="jdl"
        dense
        separator="cell"
        class="dataPR">
        <template v-slot:top>
          <div class="col-xs-12">
            <q-toolbar>
              <div class="col-4 q-table__title">Transaksi {{title}}</div>
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
                dense
                lazy-rules/>
              <q-btn
                flat round dense
                icon="add_circle"
                @click="plus"
                class="q-ml-md"
                color="accent"
              />
            </q-toolbar>
          </div>
          <div class="row q-gutter-md justify-between" >
            <div class="col-xs-6 col-sm-5 col-md-4">
              <q-input filled v-model="jh.tgl" label="Tanggal" dense lazy-rules :rules="inRul" readonly>
                <template v-if="['MAN','acc','mitra'].some(a=> a== $store.state.auth.user.userType)" v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                      <q-date v-model="jh.tgl" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
              <q-select
                v-model="jh.tempo"
                label="Masa Tempo"
                hint="hari"
                color="pink"
                :options="[7,14,30,60,90]"
                :rules="inRul"
                />
            </div>
            <div class="col-xs-8 col-md-5">
              <q-input
                v-model="jh.uraian"
                :rules="inRul"
                dense
                label="Judul Transaksi"/>
              <q-input :value="cust.namaPartner"
                :label="jenis.partner"
                :hint="`alamat : ${cust.alamat}`" dense lazy-rules
                :rules="inRul" readonly @click="crp = true"/>
            </div>
          </div>
        </template>
        <template
          v-slot:body="props">
          <q-tr :props="props">
            <q-td key="desk" :props="props">
              {{ props.row.desk }}
              <q-popup-edit v-model="props.row.desk">
                <q-input
                  v-model="props.row.desk"
                  :rules="inRul"
                  label="Deskripsi..."/>
              </q-popup-edit>
            </q-td>
            <q-td key="kodeAkun" :props="props">
              <q-select
                filled
                v-model="props.row.kodeAkun"
                use-input
                dense
                options-dense
                input-debounce="0"
                label="Pilih Akun COA"
                :options="options"
                :option-label="(item) => item && `${item.kodeAkun} ${item.namaSubAkun} ${item.namaAkun}`"
                option-value="kodeAkun"
                map-options
                emit-value
                @filter="filterFn"
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
            </q-td>
            <q-td key="DK" :props="props" auto-width>
              <q-select
                filled
                v-model="props.row.DK"
                :options="['D','K']"
                dense
                stack-label
                label="DK"
              />
            </q-td>
            <q-td key="nilai" :props="props">
              {{ props.row.nilai | duit }}
              <q-popup-edit v-model="props.row.nilai">
                <q-input
                  v-model="props.row.nilai"
                  :rules="inRul"
                  type="number"
                  label="Nilai"/>
              </q-popup-edit>
            </q-td>
            <q-td key="act" :props="props" auto-width>
              <q-icon name="close" color="red" @click="delJur(props.row)" />
            </q-td>
          </q-tr>
        </template>
        <template v-slot:bottom-row>
          <q-tr>
            <q-td
              align="center">
              <strong>Total Debit</strong>
            </q-td>
            <q-td align="right"><strong>{{ tdebit | duit }}</strong></q-td>
          </q-tr>
          <q-tr>
            <q-td
              align="center">
              <strong>Total Kredit</strong>
            </q-td>
            <q-td align="right"><strong>{{ tkredit | duit }}</strong></q-td>
          </q-tr>
          <q-tr>
            <q-td
              align="center">
              <strong>Balance</strong>
            </q-td>
            <q-td
              align="right"><strong>{{ tblnce | duit }}</strong></q-td>
          </q-tr>
        </template>
      </q-table>
      <div align="right">
        <q-btn label="Reset" type="reset" color="orange" class="q-ml-sm" />
        <q-btn label="Submit" type="submit" color="primary" class="q-ml-sm" />
      </div>
    </q-form>
    <q-dialog
      v-model="crp"
      max-width="1000px">
      <cariPartner :pil="jenis.pil" @dtPartner="pilih" bebas="false"/>
    </q-dialog>
  </div>
</template>
<script>
import { accRek, dtCab, addHP } from '../../services/apiList'
import { reactive, computed, toRefs } from '@vue/composition-api'
import cariPartner from '../cariPartner'
export default {
  components: {
    cariPartner
  },
  props: {
    jhp: {
      type: String,
      default: 'P'
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
        { label: 'Act', name: 'act' }
      ],
      menu: false,
      date: null,
      jh: { tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), uraian: '', kodeCab: 'MP01' },
      jns: [
        { text: 'Debet', value: 'D' },
        { text: 'Kredit', value: 'K' }
      ],
      alAkun: [],
      options: [],
      detJur: [],
      addJur: { kodeAkun: null, DK: 'D', nilai: 0 },
      ckSub: '',
      crp: false,
      akunCOA: {},
      cabAll: [],
      cust: {}
    })
    const akun = computed(() => {
      return dt.alAkun.filter(y => y.subAkun === 1)
    })
    const tdebit = computed(() => {
      return root.$dwn.jumlah(dt.detJur.map(a => a.DK === 'D' && a.nilai))
    })
    const tkredit = computed(() => {
      return root.$dwn.jumlah(dt.detJur.map(a => a.DK === 'K' && a.nilai))
    })
    const tblnce = computed(() => {
      return root.$dwn.jumlah([tdebit.value, -tkredit.value])
    })
    const title = computed(() => {
      return props.jhp === 'H' ? 'Hutang' : 'Piutang'
    })
    const jenis = computed(() => {
      return props.jhp === 'H' ? { partner: 'Ven', pil: true } : { partner: 'Cust', pil: false }
    })
    dtCab()
      .then(res => {
        dt.cabAll = res.data
      })
    accRek()
      .then(res => {
        dt.alAkun = res.data
      })
    const pilih = (x) => {
      dt.cust = x
      dt.crp = false
    }
    const filterFn = (val, update) => {
      if (val === '') {
        update(() => {
          dt.options = dt.alAkun

          // with Quasar v1.7.4+
          // here you have access to "ref" which
          // is the Vue reference of the QSelect
        })
        return
      }

      update(() => {
        const needle = val.toLowerCase()
        dt.options = dt.alAkun.filter(v => (v.namaAkun.toLowerCase().indexOf(needle) > -1 || v.kodeAkun.toLowerCase().indexOf(needle) > -1))
      })
    }
    const plus = () => {
      dt.detJur.push(Object.assign({}, dt.addJur))
    }
    const delJur = (item) => {
      const index = dt.detJur.indexOf(item)
      confirm(`Hapus nomer urut ${index + 1} ?`) && dt.detJur.splice(index, 1)
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
      if (dt.detJur.length > 0 && tblnce.value === 0 && dt.detJur.every(a => a.kodeAkun !== null && a.nilai !== 0)) {
        dt.jh.jhp = props.jhp
        dt.jh.kodePartner = dt.cust.kodePartner
        let x = await { hd: dt.jh, det: dt.detJur }
        addHP(x)
          .then(res => {
            root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
            onReset()
          })
          .catch(err => {
            console.log(err)
          })
      } else {
        root.$q.notify({ message: 'Cek data input...', color: 'warning' })
      }
    }
    const ok = (x) => {
      console.log('iki')
      if (x) {
        dt.jh.noreff = x
        console.log(x)
      }
    }
    const onReset = () => {
      dt.jh = { tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), cabID: '', uraian: '' }
      dt.detJur = []
    }
    return { ...toRefs(dt), akun, tdebit, tkredit, tblnce, filterFn, plus, delJur, remove, clear, simpan, ok, onReset, title, jenis, pilih }
  }
}
</script>
