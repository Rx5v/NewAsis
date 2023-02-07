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
              <div class="col-2 q-table__title">Transaksi Kas Keluar/ Masuk</div>
              <q-space/>
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
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy v-if="['MAN','acc','mitra'].some(a=> a== $store.state.auth.user.userType)" ref="qDateProxy" transition-show="scale" transition-hide="scale">
                      <q-date v-model="jh.tgl" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
            <div class="col-xs-8 col-md-5">
              <q-input
                v-model="jh.uraian"
                :rules="inRul"
                dense
                label="Judul Transaksi"/>
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
                :option-label="(item) => item && item.kodeAkun + ' ' + item.namaAkun"
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
            <q-td key="DK" :props="props">
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
            <q-td key="act" :props="props">
              <q-icon
                color="warning"
                @click="delJur(props.row)">close</q-icon>
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
        <q-btn label="Reset" type="reset" color="orange" flat class="q-ml-sm" />
            <q-btn label="Submit" type="submit" color="primary" flat/>
      </div>
      {{akunCOA}}
      <q-btn color="primary" label="Menu COA">
        <q-menu>
          <q-item clickable>
            <q-item-section>Pilih COA</q-item-section>
            <q-item-section side>
              <q-icon name="keyboard_arrow_right" />
            </q-item-section>
            <q-menu anchor="top right" self="top left">
              <q-list>
                <q-item
                  v-for="n in subAkun"
                  :key="n"
                  dense
                  clickable
                  @click="ckSub= n"
                >
                  <q-item-section>{{ n }}</q-item-section>
                  <q-item-section side>
                    <q-icon name="keyboard_arrow_right" />
                  </q-item-section>
                  <q-menu auto-close anchor="top right" self="top left">
                    <q-list>
                      <q-item
                        v-for="a in perSubAkun"
                        :key="a.kodeAkun"
                        dense
                        clickable
                        @click="akunCOA = a"
                      >
                        <q-item-section>{{ a.namaAkun }}</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-item>
              </q-list>
            </q-menu>
          </q-item>
        </q-menu>
      </q-btn>
    </q-form>
  </div>
</template>
<script>
import api from '../../services/api'
export default {
  data: () => ({
    valid: true,
    inRul: [ v => !!v || 'Isi data' ],
    jurnal: [],
    jdl: [
      { label: 'Deskripsi', name: 'desk', field: row => row.desk, align: 'left' },
      { label: 'Akun', name: 'kodeAkun', field: row => row.kodeAkun, align: 'left' },
      { label: 'D/K', name: 'DK', field: row => row.DK, align: 'right' },
      { label: 'Nilai', name: 'nilai', field: row => row.nilai, align: 'right' }
    ],
    menu: false,
    date: null,
    jh: { tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), uraian: '' },
    jns: [
      { text: 'Debet', value: 'D' },
      { text: 'Kredit', value: 'K' }
    ],
    alAkun: [],
    options: [],
    detJur: [],
    addJur: { kodeAkun: null, DK: 'D', nilai: 0 },
    ckSub: '',
    akunCOA: {}
  }),
  computed: {
    subAkun () {
      let x = new Set(this.alAkun.map(a => a.namaSubAkun))
      console.log(x)
      return x
    },
    perSubAkun () {
      let x = this.ckSub
      return this.alAkun.filter(a => a.namaSubAkun === x)
    },
    akun () {
      // let x = []
      return this.alAkun.filter(y => y.subAkun === 1)
    },
    tdebit () {
      return this.$dwn.jumlah(this.detJur.map(a => a.DK === 'D' && a.nilai))
    },
    tkredit () {
      return this.$dwn.jumlah(this.detJur.map(a => a.DK === 'K' && a.nilai))
    },
    tblnce () {
      return this.$dwn.jumlah([this.tdebit, -this.tkredit])
    }
  },
  mounted () {
    api.accRek()
      .then(res => {
        this.alAkun = res.data
      })
  },
  methods: {
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
    },
    getrkn () {
      api.getrkn()
        .then(res => {
          console.log(res.data)
        })
    },
    plus () {
      this.detJur.push(Object.assign({}, this.addJur))
    },
    delJur (item) {
      const index = this.detJur.indexOf(item)
      confirm(`Hapus ${item.uraian} ?`) && this.detJur.splice(index, 1)
    },
    remove (item) {
      //        this.chips.splice(this.chips.indexOf(item), 1)
      this.chips = [] // [...this.chips]
    },
    clear () {
      // q-tdis.$refs.form.reset()
      this.jh = { tgl: null, uraian: null }
      this.detJur = []
    },
    async simpan () {
      if (this.detJur.length > 0 && this.tblnce === 0 && this.detJur.every(a => a.kodeAkun !== null && a.nilai !== 0)) {
        let x = await { hd: this.jh, det: this.detJur }
        api.injurnal(x)
          .then(res => {
            this.$q.notify({ message: `${res.data.st}`, color: 'teal' })
            this.onReset()
          })
          .catch(err => {
            console.log(err)
          })
      } else {
        this.$q.notify({ message: 'Cek data input...', color: 'warning' })
      }
    },
    ok (x) {
      console.log('iki')
      if (x) {
        this.jh.noreff = x
        console.log(x)
      }
    },
    onReset () {
      this.jh = { tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), cabID: '', uraian: '' }
      this.detJur = []
    }
  }
}
</script>
