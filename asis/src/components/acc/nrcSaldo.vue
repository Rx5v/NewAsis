<template>
  <div>
    <q-table
      class="dataTrx"
      :data="dtJurnal"
      :columns="jdl"
      row-key="kodeAkun"
      :filter="cari"
      :pagination.sync="halaman"
      dense>
      <template v-slot:top>
        <div class="row q-gutter-sm justify-between" >
        <div class="col-2 q-table__title">Neraca Saldo</div>
          <q-input filled v-model="pr.tgla" label="Tanggal" dense lazy-rules :rules="inRul" readonly>
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy ref="qDateProxya" transition-show="scale" transition-hide="scale">
                  <q-date v-model="pr.tgla" @input="() => (nrc(),$refs.qDateProxya.hide())" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <q-input filled v-model="pr.tglb" label="Tanggal" dense lazy-rules :rules="inRul" readonly>
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy  ref="qDateProxy" transition-show="scale" transition-hide="scale">
                  <q-date v-model="pr.tglb" @input="() => (nrc(),$refs.qDateProxy.hide())" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
            <q-input dense debounce="300" v-model="cari" placeholder="Search">
              <template v-slot:append>
                <q-icon name="search" />
                <q-btn
                  flat round dense
                  icon="file_download"
                  @click="toDown"
                  class="q-ml-md"
                  color="primary"
                />
              </template>
            </q-input>
            <q-select
              v-if="['MAN','acc'].some(a=> a== $store.state.auth.user.userType)"
              v-model="pr.kodeCab"
              :options="$store.state.auth.user.userType ==='MAN' ? dtCabang : cabAsi"
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
        </div>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props" @click="cek(props.row)">
          <q-td
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
          >
            <template v-if="col.name==='No'">
              {{ dtJurnal.indexOf(props.row) +1 }}
            </template>
            <template v-if="col.fmt">
              {{ col.value | duit }}
            </template>
            <template v-else>
              {{ col.value }}
            </template>
          </q-td>
        </q-tr>
      </template>
     <!--  <template v-slot:bottom-row>
        <q-tr>
          <q-th colspan="4" align="center">Jumlah Total</q-th>
          <q-th align="right">{{ total.debit | nomer}}</q-th>
          <q-th align="right">{{ total.kredit | nomer}}</q-th>
        </q-tr>
        <q-tr>
          <q-th colspan="2" align="right">Saldo Awal</q-th>
          <q-th align="right">{{ sawal | nomer}}</q-th>
          <q-th colspan="2" align="right">Saldo Akhir</q-th>
          <q-th align="right">{{ total.saldoAkhir | nomer}}</q-th>
        </q-tr>
      </template> -->
    </q-table>
  </div>
</template>

<script>
import { accRek, nrcSaldo, dtCab } from '../../services/apiList'
import { reactive, computed, onMounted, toRefs } from '@vue/composition-api'
export default {
  setup (props, { root }) {
    const dt = reactive({
      dtJurnal: [],
      jdl: [
        { name: 'No', label: 'No', align: 'left' },
        { name: 'kodeAkun', label: 'Kode Akun', field: row => row.kodeAkun, align: 'left' },
        { name: 'namaAkun', label: 'Nama Akun', field: row => row.namaAkun, align: 'left' },
        { name: 'jnsAkun', label: 'Jenis Akun', field: row => row.jnsAkun, align: 'left' },
        { name: 'sawal', label: 'Saldo Awal', field: row => row.saldo, align: 'right', fmt: 'nomer' },
        { name: 'debit', label: 'Debit', field: row => row.debit, jml: 'Y', align: 'right', fmt: 'nomer' },
        { name: 'kredit', label: 'Kredit', field: row => row.kredit, jml: 'Y', align: 'right', fmt: 'nomer' },
        { name: 'saldo', label: 'Saldo Akhir', field: row => row.saldoAkhir, align: 'right', fmt: 'nomer' }
      ],
      adP: false,
      inRul: [ v => !!v || 'Isi data' ],
      pr: { tgla: '', tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), kodeCab: ['MP01'] },
      alAkun: [],
      selected: [],
      cari: '',
      options: [],
      sawal: 0,
      dtCabang: [],
      halaman: { rowsPerPage: 10 }
    })
    const total = computed(() => {
      let x = {}
      x.debit = dt.dtJurnal.reduce((a, b) => root.$dwn.jumlah([a, b.debit]), 0)
      x.kredit = dt.dtJurnal.reduce((a, b) => root.$dwn.jumlah([a, b.kredit]), 0)
      x.saldoAkhir = root.$dwn.jumlah([root.sawal, x.debit, -x.kredit])
      return x
    })
    onMounted(() => {
      accRek()
        .then(res => {
          dt.alAkun = res.data
        })
      dtCab()
        .then(res => {
          dt.dtCabang = res.data
        })
    })
    const nrc = () => {
      if (dt.pr) {
        dt.dtJurnal = []
        dt.pr.jns = true
        nrcSaldo(dt.pr)
          .then(res => {
            let a = res.data
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
      } else {
        root.$q.notify({ message: `Pilih filter dulu....`, color: 'action' })
      }
    }
    const onReset = () => {
      dt.pr = { }
    }
    const toDown = () => {
      let x = {
        judul: `Laporan Jurnal Umum `,
        dt: dt.dtJurnal,
        hdr: dt.jdl,
        naFile: `dataJurnal`
      }
      root.$dwn.toExcel(x)
    }
    const filterFn = (val, update) => {
      if (val === '') {
        update(() => {
          dt.options = dt.alAkun
        })
        return
      }
      update(() => {
        const needle = val.toLowerCase()
        dt.options = dt.alAkun.filter(v => (v.namaAkun.toLowerCase().indexOf(needle) > -1 || v.kodeAkun.toLowerCase().indexOf(needle) > -1))
      })
    }
    const cabAsi = computed(() => {
      return dt.dtCabang.filter(a => a.compCode === 'ASI')
    })
    return { ...toRefs(dt), cabAsi, filterFn, toDown, nrc, onReset, total }
  }
}
</script>
