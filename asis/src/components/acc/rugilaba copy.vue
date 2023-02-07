<template>
  <div class="flex flex-center">
    <q-card>
      <q-card-section>
        <q-toolbar>
          <q-toolbar-title>Laporan Rugi Laba </q-toolbar-title>
          <q-space/>
          <q-select
            v-model="pr.prd"
            :options="[{label:'Bulanan', value:'M'},{label:'Tahunan',value:'Y'}]"
            emit-value
            map-options
            label="Periode"
            @input="nrc"
          />
        </q-toolbar>
      </q-card-section>
      <q-card-actions>
          <q-input filled v-model="pr.tgla" label="Tanggal" dense lazy-rules :rules="inRul" readonly>
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                  <q-date v-model="pr.tgla" @input="() => (nrc(),$refs.qDateProxy.hide())" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
            <q-input dense debounce="300" v-model="cari" placeholder="Search">
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
            <q-btn
              flat round dense
              icon="file_download"
              @click="toDown"
              class="q-ml-md"
              color="primary"
            />
            <q-select
              v-if="['MAN','acc'].some(a=> a== $store.state.auth.user.userType)"
              v-model="pr.kodeCab"
              :options="dtCabang"
              :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
              option-value="kodeCab"
              emit-value
              map-options
              multiple
              style="min-width: 250px; max-width: 300px"
              label="Pilih cabang... "
              :rules="inRul"
              dense
              @input="nrc"
              lazy-rules>
              <template v-slot:option="scope">
                <q-item
                  v-bind="scope.itemProps"
                  v-on="scope.itemEvents"
                >
                  <q-item-section>
                    <q-item-label v-html="scope.opt.namaCabang" ></q-item-label>
                    {{ scope.opt.kodeCab }}
                  </q-item-section>
                  <q-item-section side>
                    <q-checkbox v-model="pr.kodeCab" :val="scope.opt.kodeCab" @input="nrc"/>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
      </q-card-actions>
      <q-card-section>
        <q-list bordered dense>
          <q-expansion-item
            dense
            dense-toggle
            expand-separator
            icon="account_balance"
            label="Pendapatan"
            header-class="bg-teal text-white"
          >
            <template v-slot:header>
              <q-item-section avatar>
                <q-icon name="account_balance"/>
              </q-item-section>
              <q-item-section>
                Pendapatan
              </q-item-section>
              <q-item-section side class="text-white">
                {{ jml.pendptn | duit }}
              </q-item-section>
            </template>
            <q-expansion-item
              dense
              expand-separator
              v-for="(item,idx) in dt.filter(a=>a.grupAkun==3 || a.grupAkun==6)" :key="item.subAkun"
            >
              <template v-slot:header>
                <q-item-section>
                  {{ idx+1 }}. {{ item.namaSub }}
                </q-item-section>
                <q-item-section side>
                  {{ item.saldoSub | nomer }}
                </q-item-section>
              </template>
              <q-item v-for="(dta,i) in item[item.subAkun]" :key="i" :inset-level="1" dense>
                <q-item-section>
                  {{ dta.namaAkun }}
                </q-item-section>
                <q-item-label>
                  {{ dta.saldo | nomer }}
                </q-item-label>
              </q-item>
            </q-expansion-item>
          </q-expansion-item>
        </q-list>
      </q-card-section>
      <q-card-section>
        <q-list bordered dense>
          <q-expansion-item
            dense
            expand-separator
            icon="account_balance_wallet"
            label="Pengeluaran"
            header-class="bg-orange text-white"
          >
            <template v-slot:header>
              <q-item-section avatar>
                <q-icon name="account_balance_wallet"/>
              </q-item-section>
              <q-item-section>
                Pengeluaran
              </q-item-section>
              <q-item-section side class="text-white">
                {{ jml.keluaran | duit }}
              </q-item-section>
            </template>
            <q-expansion-item
              dense
              expand-separator
              v-for="(item,idx) in dt.filter(a=>a.grupAkun==4 || a.grupAkun== 5 || a.grupAkun== 7)" :key="item.subAkun"
              :label="item.namaSub"
            >
              <template v-slot:header>
                <q-item-section>
                  {{ idx+1 }}. {{ item.namaSub }}
                </q-item-section>
                <q-item-section side>
                  {{ item.saldoSub | nomer }}
                </q-item-section>
              </template>
              <q-item v-for="(dta,i) in item[item.subAkun]" :key="i" :inset-level="1" dense>
                <q-item-section>
                  {{ dta.namaAkun }}
                </q-item-section>
                <q-item-label>
                  {{ dta.saldo | nomer }}
                </q-item-label>
              </q-item>
            </q-expansion-item>
          </q-expansion-item>
        </q-list>
      </q-card-section>
      <q-card-section>
        <q-list bordered dense>
          <q-expansion-item
            dense
            expand-separator
            icon="account_balance_wallet"
            header-class="bg-purple text-white"
          >
            <template v-slot:header>
              <q-item-section avatar>
                <q-icon name="monetization_on"/>
              </q-item-section>
              <q-item-section>
                Rugi Laba berjalan
              </q-item-section>
              <q-item-section side class="text-white">
                {{ jml.rl | duit }}
              </q-item-section>
            </template>
          </q-expansion-item>
        </q-list>
      </q-card-section>
    </q-card>
  </div>
</template>

<script>
import { accRek, dtCab, rugilaba } from '../../services/apiList'
export default {
  data () {
    return {
      dtJurnal: [],
      jdl: [
        { name: 'tgl', label: 'tgl', field: row => row.tgl, align: 'left' },
        { name: 'nomorJurnal', label: 'Nomor Jurnal', field: row => row.nomorJurnal, align: 'left' },
        { name: 'judulJurnal', label: 'Judul', field: row => row.judulJurnal, align: 'left' },
        { name: 'desk', label: 'Desk', field: row => row.desk, align: 'left' },
        { name: 'debit', label: 'Debit', field: row => row.debit, jml: 'Y', align: 'right' },
        { name: 'kredit', label: 'Kredit', field: row => row.kredit, jml: 'Y', align: 'right' },
        { name: 'saldo', label: 'Saldo', field: row => row.saldo, align: 'right' }
      ],
      adP: false,
      inRul: [ v => !!v || 'Isi data' ],
      pr: { tgla: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 7), prd: 'M', kodeCab: ['MP01'] },
      alAkun: [],
      selected: [],
      cari: '',
      options: [],
      sawal: 0,
      dtNeraca: [],
      dt: [],
      kelompok: [],
      dtCabang: []
    }
  },
  computed: {
    jml () {
      let x = {}
      x.pendptn = this.dt.filter(y => y.grupAkun === '3' || y.grupAkun === '6').reduce((a, b) => this.$dwn.jumlah([a, b.saldoSub]), 0)
      x.keluaran = this.dt.filter(a => a.grupAkun === '4' || a.grupAkun === '5' || a.grupAkun === '7').reduce((a, b) => this.$dwn.jumlah([a, b.saldoSub]), 0)
      x.rl = this.$dwn.jumlah([x.pendptn, -x.keluaran])
      return x
    }
  },
  mounted () {
    accRek()
      .then(res => {
        this.alAkun = res.data
      })
    dtCab()
      .then(res => {
        this.dtCabang = res.data
      })
  },
  methods: {
    nrc () {
      this.dt = []
      rugilaba({ tgl: this.pr.tgla, prd: this.pr.prd, kodeCab: this.pr.kodeCab })
        .then(res => {
          this.dtNeraca = res.data
          let data = res.data
          let y = new Set(res.data.map(a => a.subAkun))
          this.dt = []
          //        let dta = []
          y.forEach(a => {
            let x = {}
            x.subAkun = a
            x.namaSub = data.filter(b => b.subAkun === a)[0].namaSubAkun
            x.saldoSub = data.filter(b => b.subAkun === a).reduce((s, i) => this.$dwn.jumlah([s, i.saldo]), 0)
            // this.dt.push(x)
            let z = {}
            z[a] = data.filter(b => b.subAkun === a)
            z.subAkun = a
            z.saldoSub = x.saldoSub
            z.namaSub = data.filter(b => b.subAkun === a)[0].namaSubAkun
            z.grupAkun = data.filter(b => b.subAkun === a)[0].grupAkun
            this.dt.push(z)
            // console.log(dta)
          })
          this.kelompok = y

          //          console.log(this.dt)
        })
    },
    onReset () {
      this.pr = { }
    },
    toDown () {
      let x = {
        judul: `Laporan Jurnal Umum `,
        dt: this.dtJurnal,
        hdr: this.jdl,
        naFile: `dataJurnal`
      }
      this.$dwn.toExcel(x)
    },
    filterFn (val, update) {
      if (val === '') {
        update(() => {
          this.options = this.alAkun

          // with Quasar v1.7.4+
          // here you have access to "ref" which
          // is the Vue reference of the QSelect
        })
        return
      }

      update(() => {
        const needle = val.toLowerCase()
        this.options = this.alAkun.filter(v => (v.namaAkun.toLowerCase().indexOf(needle) > -1 || v.kodeAkun.toLowerCase().indexOf(needle) > -1))
      })
    }
  }
}
</script>
