<template>
  <div>
    <q-table
      class="dataTrx"
      :data="dtJurnal"
      :columns="jdl"
      row-key="iddetJur"
      :rows-per-page-options="[10,0]"
      :pagination.sync="hal"
      :filter="cari"
      separator="cell"
      :visible-columns="visibleColumns"
      dense>
      <template v-slot:top>
        <div class="row q-gutter-sm justify-between" >
        <div class="col-2 q-table__title">Buku Besar</div>
        <q-chip color="blue-6" class="text-white text-bold">Periode : {{ tgl && tgl.from ? tgl.from + ' ~ ' + tgl.to : tgl }}
          <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
            <q-date range v-model="tgl" @input="(x) => x && (bukbes(),$refs.qDateProxy.hide())" mask="YYYY-MM-DD" lazy-rules/>
          </q-popup-proxy>
        </q-chip>
          <q-select
            filled
            v-model="kodeAkun"
            @input="bukbes()"
            use-input
            dense
            options-dense
            input-debounce="0"
            label="Pilih Akun COA"
            :options="options"
            :option-label="(item) => item ? `${item.kodeAkun} ${item.namaSubAkun} ${item.namaAkun}` : ''"
            option-value="kodeAkun"
            map-options
            multiple
            emit-value
            @filter="filterFn"
            lazy-rules
            :rules="inRul"
            style="width: 250px">
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  No results
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-input dense debounce="300" v-model="cari" placeholder="Search">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
          <q-select
            v-model="visibleColumns"
            multiple
            outlined
            dense
            options-dense
            :display-value="$q.lang.table.columns"
            emit-value
            map-options
            :options="jdl.map(a => { return { label: a.label, value: a.name }})"
            option-value="name"
            option-label="label"
            options-cover
            style="min-width: 150px"
          >
            <template v-slot:option="scope">
              <q-item
                v-bind="scope.itemProps"
                v-on="scope.itemEvents"
              >
                <q-item-section>
                  <q-item-label v-html="scope.opt.label" ></q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-checkbox v-model="visibleColumns" :val="scope.opt.value"/>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-btn
            flat round dense
            icon="file_download"
            @click="toDown"
            class="q-ml-md"
            color="primary"
          />
          <q-select
            v-if="['MAN','acc', 'mitra'].some(a=> a== $store.state.auth.user.userType)"
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
            @input="bukbes"
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
                  <q-checkbox v-model="pr.kodeCab" :val="scope.opt.kodeCab" @input="bukbes"/>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props" :class="props.row.debit !== 0 ? 'text-teal-6' : 'text-orange-13'">
          <q-td
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
          >
            <template v-if="col.name === 'No'">
              {{ dtJurnal.indexOf(props.row) +1 }}
            </template>
            <template v-if="col.name === 'Act'">
              <q-btn icon="fas fa-paperclip" class="q-ml-xs" dense outline color="cyan-5" @click="getBukti(props.row)" v-if="props.row.buktiAkunting"/>
              <q-btn icon="fas fa-balance-scale" color="teal" dense outline class="q-ml-xs" @click="cek(props.row)"/>
            </template>
            <template v-if="['debit', 'kredit', 'saldo'].includes(col.name)">
              {{ col.value | duit }}
            </template>
            <template v-else>
              {{ col.value }}
            </template>
          </q-td>
        </q-tr>
      </template>
      <template v-slot:bottom-row>
        <q-tr>
          <q-th :colspan="visibleColumns.length - 6" align="right">Jumlah Total</q-th>
          <q-th align="right">{{ total.debit | nomer}}</q-th>
          <q-th align="right">{{ total.kredit | nomer}}</q-th>
        </q-tr>
        <q-tr>
          <q-th :colspan="visibleColumns.length - 6" align="right">Mutasi</q-th>
          <q-th align="right">{{ total.mutasi | nomer}}</q-th>
        </q-tr>
        <q-tr>
          <q-th :colspan="visibleColumns.length - 6" align="right">Saldo Awal</q-th>
          <q-th align="right">{{ sawal | nomer}}</q-th>
        </q-tr>
        <q-tr>
          <q-th :colspan="visibleColumns.length - 6" align="right">Saldo Akhir</q-th>
          <q-th align="right">{{ sawal + total.mutasi | nomer}}</q-th>
        </q-tr>
      </template>
    </q-table>
    <q-dialog
      v-model="dtJ"
      full-width>
      <edJur ref="apJur" :detJur="detJur" @ok="dtJ=false" :jh="jh"/>
    </q-dialog>
  </div>
</template>

<script>
import FileSaver from 'file-saver'
import { accRek, bubes, dtCab, detailJur } from '../../services/apiList'
import edJur from './edJur'
import { reactive, computed, toRefs, onMounted, watch } from '@vue/composition-api'
export default {
  components: {
    edJur
  },
  setup (props, { root }) {
    const dt = reactive({
      dtJurnal: [],
      jdl: [
        { name: 'No', label: 'No', align: 'left' },
        { name: 'kodeCab', label: 'Cabang', field: row => row.kodeCab, align: 'left' },
        { name: 'tgl', label: 'Tanggal', field: row => row.tgl, align: 'left' },
        { name: 'nomorJurnal', label: 'Nomor Jurnal', field: row => row.nomorJurnal, align: 'left' },
        { name: 'namaAkun', label: 'Nama COA', field: row => row.namaAkun, align: 'left' },
        { name: 'judulJurnal', label: 'Judul', field: row => row.judulJurnal, align: 'left' },
        { name: 'desk', label: 'Desk', field: row => row.desk, align: 'left' },
        { name: 'namaPartner', label: 'Partner', field: row => row.namaPartner, align: 'left' },
        { name: 'nomorBukti', label: 'Nomor Bukti', field: row => row.nomorBukti, align: 'left' },
        { name: 'debit', label: 'Debit', field: row => row.debit, jml: 'Y', align: 'right', fmt: 'nomer' },
        { name: 'kredit', label: 'Kredit', field: row => row.kredit, jml: 'Y', align: 'right', fmt: 'nomer' },
        { name: 'saldo', label: 'Saldo', field: row => row.saldo, align: 'right', fmt: 'nomer' },
        { name: 'nomorReff', label: 'Jurnal Referensi', field: row => row.nomorReff, align: 'left' },
        { name: 'tglRef', label: 'Tgl Ref', field: row => row.tglRef, align: 'left' },
        { name: 'Act', label: 'Act' }
      ],
      adP: false,
      dtJ: false,
      detJur: [],
      inRul: [ v => !!v || 'Isi data' ],
      pr: { tgla: '', tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), kodeAkun: [], kodeCab: [root.$store.state.auth.setCabang] },
      tgl: {
        from: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        to: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
      },
      alAkun: [],
      kodeAkun: [],
      selected: [],
      cari: '',
      options: [],
      sawal: 0,
      dtCabang: [],
      jh: {},
      hal: { rowsPerPage: 10 },
      visibleColumns: []
    })
    const total = computed(() => {
      let x = {}
      x.debit = dt.dtJurnal.reduce((a, b) => root.$dwn.jumlah([a, b.debit]), 0)
      x.kredit = dt.dtJurnal.reduce((a, b) => root.$dwn.jumlah([a, b.kredit]), 0)
      x.mutasi = dt.dtJurnal.reduce((a, b) => b.jnsAkun === 'D' ? root.$dwn.jumlah([a, b.debit, -b.kredit]) : root.$dwn.jumlah([a, -b.debit, b.kredit]), 0)
      /* x.saldoAkhir = dt.kodeAkun.jnsAkun === 'D' ? root.$dwn.jumlah([dt.sawal, x.debit, -x.kredit])
        : root.$dwn.jumlah([dt.sawal, x.kredit, -x.debit]) */
      return x
    })
    onMounted(() => {
      dt.visibleColumns = dt.jdl.map(a => a.name !== 'desk' && a.name)
      accRek()
        .then(res => {
          dt.alAkun = res.data
        })
      dtCab()
        .then(res => {
          const pegang = root.$store.state.auth.user.cabGrup
          dt.dtCabang = res.data.filter(a => pegang.some(s => s === a.kodeCab))
        })
    })
    const getBukti = (x) => {
      const mimetype = x.mimetype ? x.mimetype.split('/')[1] : 'pdf'
      root.$axios.get('/buktiAkunting?',
        {
          params: { key: x.buktiAkunting },
          responseType: 'arraybuffer'
        })
        .then(async (res) => {
          // const oke = await fetch(`data:${x.extensi};base64,${res.data}`)
          FileSaver.saveAs(new Blob([res.data]), `${x.nomorJurnal}.${mimetype}`)
        })
    }
    const bukbes = () => {
      dt.pr.tgla = dt.tgl && dt.tgl.from ? dt.tgl.from : dt.tgl || new Date()
      dt.pr.tglb = dt.tgl && dt.tgl.from ? dt.tgl.to : dt.tgl || new Date()
      if (dt.pr && dt.kodeAkun.length) {
        dt.pr.kodeAkun = dt.kodeAkun
        dt.dtJurnal = []
        bubes(dt.pr)
          .then(res => {
            let a = res.data.dt
            let sawal = res.data.sawal
            dt.sawal = sawal
            dt.dtJurnal = a.map((x, y, a) => {
              let u = x
              if (y === 0) {
                u.saldo = u.jnsAkun === 'D' ? root.$dwn.jumlah([sawal, u.debit, -u.kredit])
                  : root.$dwn.jumlah([sawal, u.kredit, -u.debit])
              } else {
                u.saldo = u.jnsAkun === 'D' ? root.$dwn.jumlah([a[y - 1].saldo, u.debit, -u.kredit])
                  : root.$dwn.jumlah([a[y - 1].saldo, u.kredit, -u.debit])
              }
              return u
            })
            dt.dtJurnal.unshift({ nomorJurnal: 'Saldo Awal', saldo: sawal, debit: 0, kredit: 0 })
          })
          .catch((err) => {
            console.log(err)
          })
      } else {
        root.$q.notify({ message: `Pilih filter dulu....`, color: 'accent' })
      }
    }
    const onReset = () => {
      dt.pr = { }
    }
    const toDown = () => {
      let x = {
        judul: `Laporan Buku Besar ${dt.kodeAkun.kodeAkun} ${dt.kodeAkun.namaAkun} (${dt.kodeAkun.jnsAkun})`,
        dt: dt.dtJurnal,
        hdr: dt.jdl,
        naFile: `BukuBesar`
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
    const cek = (x) => {
      if (['MAN', 'acc', 'mitra'].some(a => a === root.$store.state.auth.user.userType)) {
        dt.jh = { ...x }
        detailJur(x)
          .then(res => {
            dt.dtJ = true
            dt.detJur = res.data
          })
          .catch((err) => {
            console.log(err)
          })
      }
    }
    watch(() => root.$store.state.auth.setCabang, (val) => {
      dt.pr.kodeCab = [val]
      bukbes()
    })
    return { ...toRefs(dt), total, cek, filterFn, toDown, onReset, bukbes, getBukti }
  }
}
</script>
