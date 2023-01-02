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
        row-key="iddetJur"
        separator="cell"
        class="dataPR">
        <template v-slot:top>
          <div class="col-xs-12">
            <q-toolbar>
              <div class="col-2 q-table__title">Pembayaran {{ jhp==='H' ? 'Hutang' : 'Piutang' }}</div>
              <q-chip color="primary">Cabang {{ jh.kodeCab }} {{ cabAll.length ? cabAll.find(a => a.kodeCab === jh.kodeCab).namaCabang : '' }}</q-chip>
              <q-space/>
              <!-- <q-btn
                flat round dense
                icon="add_circle"
                @click="plus"
                class="q-ml-md"
                color="accent"
              /> -->
            </q-toolbar>
            <div class="row q-gutter-md justify-between" >
              <div class="col-xs-6 col-sm-5">
                <q-select
                  filled
                  v-model="jh.kodeAkun"
                  dense
                  use-chips
                  options-dense
                  input-debounce="0"
                  label="Pilih Akun Kas"
                  :options="options.filter(a => a.arusKas === 'Y')"
                  :option-label="(item) => item && item.kodeAkun + ' ' + item.namaSubAkun  + ' ' + item.namaAkun"
                  option-value="kodeAkun"
                  map-options
                  emit-value
                  :rules="inRul"
                  @filter="filterFn"
                  @input="cekSal(jh.kodeAkun)"
                  style="width: 250px"
                  use-input
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
                  label="Partner Luar"
                :value="detJur.length ? detJur[0].namaPartner : jh.namaPartner"/>
              </div>
              <div class="col-xs-6 col-sm-5 col-md-4">
                <q-input filled v-model="jh.tgl" label="Tanggal" dense lazy-rules :rules="inRul" readonly>
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy v-if="['MAN','acc','mitra'].some(a=> a== $store.state.auth.user.userType)" ref="qDateProxy" transition-show="scale" transition-hide="scale">
                        <q-date v-model="jh.tgl" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" :options="optionsFn" lazy-rules :rules="inRul"/>
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
            <q-td key="sisa" :props="props">
              {{ props.row.sisa | duit }}
              <q-checkbox v-model="props.expand"
                @input="props.expand ? props.row.nilai = props.row.sisa : props.row.nilai = 0" dense/>
            </q-td>
            <q-td key="nilai" :props="props">
              <q-chip color="orange"> {{ props.row.nilai | duit }} </q-chip>
              <q-popup-edit v-model="props.row.nilai">
                <q-input
                  v-model="props.row.nilai"
                  :rules="inRul"
                  type="number"
                  label="Nilai"
                  @input="cekSisa(props.row)"/>
              </q-popup-edit>
            </q-td>
            <q-td key="kurang" :props="props">
              {{ props.row.kurang | duit }}
            </q-td>
            <q-td key="ptg" :props="props">
              <q-select
                filled
                v-if="jhp === 'P'"
                v-model="props.row.ptg"
                dense
                label="Potongan"
                :options="['Y', 'N']"/>
            </q-td>
            <q-td key="potong" :props="props">
              {{ props.row.potong | duit }}
              <q-popup-edit v-model="props.row.potong" v-if="props.row.ptg === 'Y' && jhp === 'P'">
                <q-input
                  v-model="props.row.potong"
                  :rules="inRul"
                  type="number"
                  label="potong"
                  @input="cekPot(props.row)"/>
              </q-popup-edit>
            </q-td>
            <q-td key="akunPot" :props="props">
              <template v-if="props.row.kurang > 0 && props.row.ptg === 'Y'">
                <q-select
                  filled
                  v-model="props.row.akunL"
                  use-input
                  dense
                  options-dense
                  input-debounce="0"
                  label="Pilih Akun Potongan"
                  :options="options"
                  :option-label="(item) => item && `${item.kodeAkun} ${item.namaSubAkun} ${item.namaAkun}`"
                  option-value="kodeAkun"
                  map-options
                  :rules="inRul"
                  @filter="filterFn"
                  @input="props.row.akunPot = props.row.akunL.kodeAkun"
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
              </template>
              <template v-else>
                {{ props.row.akunPot }}
              </template>
            </q-td>
            <q-td key="act" :props="props">
              <q-icon
                name="close"
                color="red"
                @click="delJur(props.row)"/>
            </q-td>
          </q-tr>
        </template>
        <template v-slot:bottom-row>
          <q-tr v-if="jhp === 'H'">
            <q-td align="right">
              <q-checkbox v-model="ab.adminBank" label="Biaya Admin Bank" @input="ab.nilai = 0"/>
            </q-td>
            <q-td colSpan="2" align="right">
              <q-chip color="red" outline v-if="ab.adminBank">
                {{ ab.nilai | duit }}
                <q-popup-edit v-model="ab.nilai">
                  <q-input
                    v-model="ab.nilai"
                    :rules="inRul"
                    type="number"
                    label="Biaya Admin"/>
                </q-popup-edit>
              </q-chip>
            </q-td>
          </q-tr>
          <q-tr>
            <q-td
              colSpan="1"
              align="right">
              <strong>Total</strong>
            </q-td>
            <q-td align="right"><strong>{{ total.sisa | duit }}</strong></q-td>
            <q-td align="right"><strong>{{ total.nilai | duit }}</strong></q-td>
          </q-tr>
        </template>
      </q-table>
      <div align="right">
        <q-btn label="Tutup" color="orange" outline rounded class="q-ml-sm" @click="$emit('ttp', 'Y')"/>
        <q-btn label="Reset" type="reset" color="orange" outline rounded class="q-ml-sm" />
        <q-btn label="Submit" type="submit" color="primary" outline rounded class="q-ml-sm" />
      </div>
    </q-form>
  </div>
</template>
<script>
import { accRek, multiBayar, dtCab, cekSaldo, carikar } from '../../services/apiList'
import { reactive, computed, toRefs } from '@vue/composition-api'
export default {
  props: {
    jhp: {
      type: String,
      default: 'P'
    },
    detBayar: {
      type: Array,
      default: function () {
        return []
      }
    },
    cab: {
      type: String,
      default: 'MP01'
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      valid: true,
      inRul: [ v => !!v || 'Isi data' ],
      jurnal: [],
      jdl: [
        { label: 'Deskripsi', name: 'desk', field: row => row.desk, align: 'left' },
        { label: 'Belum dibayar', name: 'sisa', field: row => row.sisa, align: 'right' },
        { label: 'Bayar', name: 'nilai', field: row => row.nilai, align: 'right' },
        { label: 'Kurang', name: 'kurang', field: row => row.kurang, align: 'right' },
        { label: 'Potongan', name: 'ptg', field: row => row.ptg, align: 'right' },
        { label: 'Jumlah Potongan', name: 'potong', field: row => row.potong, align: 'right' },
        { label: 'Akun Potongan', name: 'akunPot', field: row => row.akunPot, align: 'right' },
        { label: 'act', name: 'act' }
      ],
      menu: false,
      date: null,
      jh: {
        tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        uraian: '',
        kodeCab: props.cab,
        salesID: '',
        kodePartner: '',
        ac: 'N'
      },
      jns: [
        { text: 'Debet', value: 'D' },
        { text: 'Kredit', value: 'K' }
      ],
      alAkun: [],
      options: [],
      akunKB: [],
      detJur: [ ...props.detBayar ],
      addJur: { kodeAkun: null, DK: 'D', nilai: 0 },
      ckSub: '',
      akunCOA: {},
      cabAll: [],
      saldo: { saldo: 0 },
      pilihSales: [],
      dtSales: [],
      eksternal: 'N',
      crp: false,
      cust: { namaPartner: '', alamat: '' },
      ab: {
        adminBank: false,
        kodeAkun: '510200004',
        DK: 'D',
        nilai: 0,
        desk: 'admin bank'
      }
    })
    const title = computed(() => props.jhp === 'H' ? 'Hutang' : 'Piutang')
    const akun = computed(() => {
      let a = props.jhp === 'H' ? dt.alAkun.filter(y => y.kasKeluar === 'Y')
        : dt.alAkun.filter(y => y.kasMasuk === 'Y')
      return a
    })
    const akunKas = computed(() => dt.alAkun.filter(a => a.arusKas === 'Y'))
    const total = computed(() => {
      let a = {}
      a.DK = props.jhp === 'H' ? 'K' : 'D'
      a.kodeAkun = dt.jh.kodeAkun
      a.desk = dt.jh.uraian
      a.nilai = dt.detJur.length ? root.$dwn.jumlah([dt.ab.nilai, dt.detJur.reduce((s, b) => {
        let u = b.DK === a.DK ? -b.nilai : b.nilai
        return root.$dwn.jumlah([s, u])
      }, 0)]) : 0
      a.sisa = dt.detJur.reduce((s, b) => root.$dwn.jumlah([s, b.sisa]), 0)
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
      dt.addJur.DK = props.jhp === 'H' ? 'K' : 'D'
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
    const lockTgl = computed(() => {
      // console.log(dt.detJur)
      let dataJur = dt.detJur.filter(s => (s.nilai > 0 || (s.kurang > 0 && s.ptg === 'Y'))).map(a => a.tglPokok)
      let a = dataJur.length ? dataJur.sort((a, b) => new Date(b) - new Date(a))[0] : ''
      return a
    })
    const simpan = async () => {
      let dataJur = dt.detJur.filter(s => (s.nilai > 0 || (s.kurang > 0 && s.ptg === 'Y')))
      // if (!dataJur.length || dataJur.some(a => (a.nilai === 0 || !a.kodeAkun || (a.kurang > 0 && a.lunas === 'Y' && a.akunLunas === '')))) {
      if (dataJur.length > 0 && dataJur.every(a => (a.kodeAkun !== null)) &&
        ((props.jhp === 'H' && total.value.nilai <= dt.saldo.saldo) || props.jhp === 'P')) {
        dt.jh.jnsTrx = props.jhp === 'P' ? 'BP' : 'BH'
        dt.jh.jhp = props.jhp
        dt.jh.kodePartner = dataJur[0].kodePartner
        if (dt.ab.adminBank) {
          dataJur.push(dt.ab)
        }
        dataJur.push(total.value)
        let x = await { hd: dt.jh, det: dataJur }
        multiBayar(x)
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
      return (dt.detJur.some(s => [...dt.akunKB].includes(s.kodeAkun))) ? 'Y' : 'N'
    })
    const onReset = () => {
      dt.jh = { tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), cabID: '', uraian: '', salesID: '', kodePartner: '', kodeCab: props.cab }
      dt.detJur = []
      root.$emit('ttp', 'Y')
    }
    const partner = (x) => {
      dt.cust = x
      dt.jh.kodePartner = x.kodePartner
    }
    const cekSisa = (x) => {
      if (x.nilai >= x.sisa) {
        x.nilai = x.sisa
        x.lunas = 'Y'
        x.kurang = 0
        root.$q.notify({ message: `Maksimal pembayaran ${x.sisa.toLocaleString()}`, color: 'warning' })
      } else {
        x.lunas = 'N'
        x.kurang = root.$dwn.jumlah([x.sisa, -x.nilai])
      }
    }
    const cekPot = (x) => {
      if (x.potong >= x.kurang) {
        x.potong = x.kurang
        x.lunas = 'Y'
        x.ptg = x.potong > 0 ? 'Y' : 'N'
        root.$q.notify({ message: `Maksimal pembayaran ${x.sisa.toLocaleString()}`, color: 'warning' })
      } else {
        x.lunas = 'N'
        x.ptg = x.potong > 0 ? 'Y' : 'N'
        // x.kurang = root.$dwn.jumlah([x.sisa, -x.nilai])
      }
    }
    const optionsFn = (date) => {
      return date >= lockTgl.value.replace(/-/g, '/')
    }
    return { ...toRefs(dt), optionsFn, lockTgl, cekPot, cekSisa, partner, kb, cekSal, akun, total, filterFn, plus, delJur, remove, clear, simpan, ok, onReset, title, akunKas, filterKn }
  }
}
</script>
