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
        <template v-slot:top >
          <div class="col-xs-12">
            <q-toolbar>
              <div class="col-4 q-table__title">Mutasi Kas</div>
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
              <q-btn
                flat round dense
                icon="add_circle"
                @click="plus"
                class="q-ml-md"
                color="accent"
              />
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
            </q-toolbar>
          </div>
          <div class="row q-gutter-md justify-between" >
            <div class="col-xs-6 col-sm-5">
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
            </div>
            <div class="col-xs-8 col-md-5">
              <q-input filled v-model="jh.tgl" label="Tanggal" dense lazy-rules :rules="inRul" readonly>
                <template v-if="['MAN','acc','mitra'].some(a=> a== $store.state.auth.user.userType)" v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                      <q-date v-model="jh.tgl" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
              <q-input
                v-model="jh.uraian"
                :rules="inRul"
                dense
                label="Judul Transaksi"/>
            </div>
            <q-file outlined
              v-model="jh.buktiAkunting"
              max-file-size="2097152"
              label="Upload Bukti"
              hint="Maksimal 2MB"
              :rules="inRul"
              counter>
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>
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
                label="Akun kas masuk"
                :options="akunKas"
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
              {{props.row.DK}}
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
              <strong>Total {{ title }}</strong>
            </q-td>
            <q-td align="right"><strong>{{ total.nilai | nomer }}</strong></q-td>
          </q-tr>
        </template>
      </q-table>
      <div align="right">
        <q-btn label="Reset" type="reset" color="orange" class="q-ml-sm" />
        <q-btn label="Submit" type="submit" color="primary" class="q-ml-sm"/>
      </div>
    </q-form>
  </div>
</template>
<script>
import { accRek, dtCab, cekSaldo, carikar } from '../../services/apiList'
import { reactive, computed, toRefs, watch } from '@vue/composition-api'
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
        kodeCab: root.$store.state.auth.setCabang,
        salesID: '',
        kodePartner: '',
        buktiAkunting: null
      },
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
      if (dt.jh.buktiAkunting !== null && dt.detJur.length > 0 && dt.detJur.every(a => (a.nilai !== 0 && a.kodeAkun !== null)) && ((total.value.nilai <= dt.saldo.saldo))) {
        dt.jh.jnsTrx = props.jnsTrx
        dt.detJur.push(total.value)
        const formData = new FormData()
        formData.append('buktiAkunting', dt.jh.buktiAkunting)
        formData.append('hd', JSON.stringify(dt.jh))
        formData.append('det', JSON.stringify(dt.detJur))
        // addJB({ hd: x, det: det, exp: this.exp, pot: this.pot })
        /* this.$axios.post('/jualbeli', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }) */
        root.$axios.post('/inkas', formData)
          .then(res => {
            root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
            onReset()
          })
          .catch(err => {
            console.log(err)
          })
      } else {
        root.$q.notify({ message: 'Cek bukti dan saldo Kas...', color: 'warning' })
      }
    }
    const ok = (x) => {
      if (x) {
        dt.jh.noreff = x
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
        kodePartner: '',
        buktiAkunting: null
      }
      dt.detJur = []
    }
    watch(() => root.$store.state.auth.setCabang, (val) => {
      dt.jh.kodeCab = val
      if (dt.jh.kodeAkun) {
        cekSal(dt.jh.kodeAkun)
      }
    })
    return { ...toRefs(dt), kb, cekSal, akun, total, filterFn, plus, delJur, remove, clear, simpan, ok, onReset, title, akunKas, filterKn }
  }
}
</script>
