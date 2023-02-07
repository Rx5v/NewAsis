<template>
  <q-card style="width: 700px; max-width: 80vw;">
    <q-card-section>
      <q-toolbar>
        <q-toolbar-title>Persetujuan Transaksi Keuangan</q-toolbar-title>
      </q-toolbar>
    </q-card-section>
    <q-card-section>
      <q-table
        :data="detJur"
        :columns="jdl"
        row-key="iddetJur"
        dense
        separator="cell"
        class="dataPR">
        <template v-slot:top>
            <q-input filled :value="jh.tgl" label="Tanggal" dense lazy-rules readonly/>
            <q-chip outline>{{jh.nomorJurnal}}</q-chip>
            <q-chip>{{jh.judulJurnal}}</q-chip>
        </template>
        <template
          v-slot:body="props">
          <q-tr :props="props">
            <q-td key="desk" :props="props">
              {{ props.row.desk }}
              <q-popup-edit v-model="props.row.desk">
                <q-input
                  v-model="props.row.desk"
                  label="Deskripsi..."/>
              </q-popup-edit>
            </q-td>
            <q-td key="kodeAkun" :props="props">
              {{ props.row.kodeAkun }} {{ props.row.namaAkun}}
              <q-popup-edit v-model="props.row.kodeAkun">
                <q-select
                  filled
                  v-model="props.row.akun"
                  use-input
                  dense
                  options-dense
                  input-debounce="0"
                  label="Pilih Akun COA"
                  :options="options"
                  :option-label="(item) => item && item.kodeAkun + ' ' + item.namaAkun"
                  option-value="kodeAkun"
                  map-options
                  @filter="filterFn"
                  @input="pilC(props.row)"
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
              </q-popup-edit>
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
            <q-td key="debit" :props="props">
              {{ props.row.debit | duit }}
            </q-td>
            <q-td key="kredit" :props="props">
              {{ props.row.kredit | duit }}
            </q-td>
            <q-td key="act" :props="props">
              <q-icon
                color="teal"
                name="save"
                style="font-size:1.5rem"
                @click="upDet(props.row)"/>
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
              align="right"><strong>{{ tblnce | nomer }}</strong></q-td>
          </q-tr>
        </template>
      </q-table>
      <div align="right">
        <q-btn label="Batal" type="reset" color="red" class="q-ml-sm" @click="simpan('B')" />
        <q-btn label="Setuju" type="submit" color="primary" class="q-ml-sm" @click="simpan('L')" />
      </div>
    </q-card-section>
  </q-card>
</template>
<script>
import { upHP, accRek, edjur } from '../../services/apiList'
export default {
  props: {
    detJur: {
      type: Array,
      default: function () {
        return []
      }
    },
    jh: {
      type: Object,
      default: function () {
        return {
          tgl: null,
          judulJurnal: ''
        }
      }
    }
  },
  data () {
    return {
      jdl: [
        { name: 'desk', label: 'Deskripsi', field: row => row.desk, align: 'left' },
        { name: 'kodeAkun', label: 'Akun', field: row => row.kodeAkun, align: 'left' },
        { name: 'debit', label: 'Debit', field: row => row.debit, align: 'right' },
        { name: 'kredit', label: 'Kredit', field: row => row.kredit, align: 'right' },
        { name: 'act', label: 'action' }
      ],
      alAkun: [],
      options: []
    }
  },
  mounted () {
    accRek()
      .then(res => {
        this.alAkun = res.data
      })
  },
  computed: {
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
  methods: {
    simpan (x) {
      upHP({ ...this.jh, status: x })
        .then(({ data }) => {
          this.$emit('ok', 'Y')
          this.$q.notify({ message: `${data.st}`, color: 'teal' })
        })
        .catch((err) => {
          console.log(err)
          this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    },
    upDet (x) {
      edjur(x)
        .then(({ data }) => {
          this.$emit('ok', 'Y')
          this.$q.notify({ message: `${data.st}`, color: 'teal' })
        })
        .catch((err) => {
          console.log(err)
          this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
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
    },
    pilC (x) {
      x.kodeAkun = x.akun.kodeAkun
      x.namaAkun = x.akun.namaAkun
    }
  }
}
</script>
