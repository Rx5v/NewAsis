<template>
  <div>
    <q-table
      class="dataTrx"
      :data="detHP"
      :columns="jdl"
      row-key="iddetJur"
      :filter="cari"
      :pagination.sync="hal"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Data Kas Bon</div>
        <q-space/>
        <q-input filled v-model="jh.tgl" label="Tanggal" dense lazy-rules :rules="inRul"  class="q-ml-sm" readonly>
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                <q-date v-model="jh.tgl" @input="() => ($refs.qDateProxy.hide(),getHP())" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
        <q-input dense debounce="300" v-model="cari" placeholder="Search" class="q-ml-sm">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <!-- <q-btn
          flat round dense
          icon="add_circle"
          @click="adHP=true"
          class="q-ml-md"
          color="accent"
        /> -->
        <q-btn
          flat round dense
          icon="file_download"
          @click="toDown"
          class="q-ml-md"
          color="primary"
        />
        <q-select
          v-if="['MAN','acc','purchase'].some(a=> a== $store.state.auth.user.userType)"
          v-model="kodeCab"
          :options="dtCabang"
          :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
          option-value="kodeCab"
          emit-value
          map-options
          style="min-width: 250px; max-width: 300px"
          label="Pilih cabang... "
          :rules="inRul"
          dense
          @input="getHP"
          lazy-rules/>
      </template>
      <template v-slot:header="props">
        <q-tr :props="props">
          <q-th auto-width />

          <q-th
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
          >
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td auto-width>
            <q-btn size="sm" color="accent" round dense
              @click="props.expand = !props.expand,getByr(props.row,'ok',props.expand)"
              :icon="props.expand ? 'remove' : 'add'" />
          </q-td>
          <q-td
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
          >
            <template v-if="col.name==='act'">
              <q-icon v-if="props.row.status==='O'" name="queue" color="red" @click="addByr(props.row)" />
            </template>
            <template v-else-if="col.jml==='Y'">
              {{ col.value | duit }}
            </template>
            <template v-else>
              {{ col.value }}
            </template>
          </q-td>
        </q-tr>
        <q-tr v-show="props.expand" :props="props">
          <q-td colspan="100%">
            <template v-if="detByr.length>0">
              <q-table
                class="detHP"
                :data="detByr.filter(x=> x.noreff === props.row.nomorJurnal)"
                :columns="jdlB"
                row-key="iddetJur"
                separator="cell"
                no-data-label="Belum ada realisasi"
                dense>
                <template v-slot:no-data="{ message }">
                  <div class="full-width row flex-center text-error q-gutter-sm">
                    <q-icon size="2em" name="sentiment_dissatisfied" />
                    <span>
                      {{ message }}
                    </span>
                  </div>
                </template>
              </q-table>
            </template>
            <template v-else>
              Belum ada realisasi
            </template>
          </q-td>
        </q-tr>
      </template>
      <template v-slot:bottom-row>
        <q-tr>
          <q-td colspan="2">Total {{ jenis}}</q-td>
          <q-td class="text-right">{{ total.nilai | nomer}}</q-td>
        </q-tr>
        <q-tr>
          <q-td colspan="2">Total Bayar</q-td>
          <q-td class="text-right">{{ total.tbayar | nomer}}</q-td>
        </q-tr>
        <q-tr>
          <q-td colspan="2">Total Sisa</q-td>
          <q-td class="text-right">{{ total.sisa | nomer}}</q-td>
        </q-tr>
      </template>
    </q-table>
    <q-dialog
      v-model="adB"
      persistent>
      <q-card style="width: 400px; max-width: 80vw;">
        <q-card-section class="bg-secondary text-white">Pengembalian Kas Bon</q-card-section>
        <q-form
          ref="form"
          @submit="simpan(j)"
          @reset="onReset"
          class="q-gutter-md">
          <q-card-section class="column">
            <q-input filled v-model="j.tgl" label="Tanggal" dense lazy-rules :rules="inRul" readonly>
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy v-if="['MAN','acc'].some(a=> a==$store.state.auth.user.userType)" ref="qDateProxy" transition-show="scale" transition-hide="scale">
                    <q-date v-model="j.tgl" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
            <q-input
              :value="namaKaryawan"
              label="Nama Karyawan"/>
            <q-input
              v-model="j.judulJurnal"
              :rules="inRul"
              dense
              label="Judul Transaksi"/>
            <!-- <q-select
              filled
              v-model="j.kodeAkun"
              use-input
              dense
              options-dense
              input-debounce="0"
              label="Asal Kas"
              :options="akunKas"
              :option-label="(item) => item && item.kodeAkun + ' ' + item.namaAkun"
              option-value="kodeAkun"
              :rules="inRul"
              map-options
              emit-value
              style="width: 250px"
            />
            <q-select
              v-if="this.ac==='Y'"
              filled
              v-model="j.kodeAkunD"
              use-input
              dense
              options-dense
              input-debounce="0"
              label="Akun Penerima"
              :options="akunKas"
              :option-label="(item) => item && item.kodeAkun + ' ' + item.namaAkun"
              option-value="kodeAkun"
              :rules="inRul"
              map-options
              emit-value
              style="width: 250px"
            /> -->
            <q-chip color="red" outline>Belum Bayar :{{ j.sisa | nomer }}</q-chip>
            <q-chip color="red" outline>Sisa :{{ j.sisaHP | nomer }}</q-chip>
            <q-chip color="green" outline>
              Jumlah Bayar {{ j.nilai | duit}}
              <q-popup-edit v-model="j.nilai">
                <q-input
                  v-model="j.nilai"
                  :rules="inRul"
                  type="number"
                  label="Nilai"
                  @input="hit(j)"/>
              </q-popup-edit>
            </q-chip>
            <q-input
              v-model="j.desk"
              label="Note : "/>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn rounded label="Kembali" color="warning" v-close-popup />
            <q-btn rounded label="Bayar" color="primary" type="submit"/>
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
    <q-dialog
      v-model="adBa"
      full-width>
      <q-card>
        <q-card-section>
          <q-form
            ref="form"
            @submit="bayar(jh)"
            @reset="onReset"
            class="q-gutter-md">
            <q-table
              :data="detJur"
              :columns="jdlByr"
              dense
              separator="cell"
              class="dataPR">
              <template v-slot:top >
                <div class="col-xs-12">
                  <q-toolbar>
                    <div class="col-4 q-table__title">Pengembalian Kas Bon dan Realisasi </div>
                    <q-btn
                      flat round dense
                      icon="add_circle"
                      @click="plus"
                      class="q-ml-md"
                      color="accent"
                    />
                    <q-chip>Nama Karyawan : {{ bh.namaKaryawan }}</q-chip>
                  </q-toolbar>
                </div>
                <div class="row q-gutter-md justify-between" >
                  <div class="col-xs-6 col-sm-5">
                    <q-chip>Kode Akun : {{ bh.kodeAkun }} {{ bh.namaAkun }}</q-chip>
                    <q-chip color="orange">Sisa : {{ bh.sisa | duit}}</q-chip>
                  </div>
                  <div class="col-xs-8 col-md-5">
                    <q-input filled v-model="bh.tgl" label="Tanggal" dense lazy-rules :rules="inRul" readonly>
                      <template v-if="['MAN','acc'].some(a=> a== $store.state.auth.user.userType)" v-slot:append>
                        <q-icon name="event" class="cursor-pointer">
                          <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                            <q-date v-model="bh.tgl" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                    <q-input
                      v-model="bh.uraian"
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
                    <strong>Total Pengembalian</strong>
                  </q-td>
                  <q-td align="right"><strong>{{ totalByr.nilai | duit }}</strong></q-td>
                </q-tr>
              </template>
            </q-table>
            <div align="right">
              <!-- <q-btn label="Reset" type="reset" color="orange" class="q-ml-sm" /> -->
              <q-btn label="Submit" type="submit" color="primary" class="q-ml-sm"/>
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog
      v-model="adHP"
      full-width>
      <addHP :jhp="jhp"/>
    </q-dialog>
  </div>
</template>

<script>
import { dtKasbon, cekByr, accRek, bayarHP, dtCab, inKas } from '../../services/apiList'
import addHP from './addHP'
import { reactive, computed, onMounted, toRefs, ref } from '@vue/composition-api'
export default {
  // name: 'PageName',
  props: {
    jhp: {
      type: String,
      default: 'P'
    }
  },
  components: {
    addHP
  },
  setup (props, { root }) {
    const dt = reactive({
      dtJurnal: [],
      jdld: [
        { name: 'tglKasbon', label: 'Tanggal', field: row => row.tglKasbon, align: 'left' },
        { name: 'nomorJurnal', label: 'Nomor Jurnal', field: row => row.nomorJurnal, align: 'left' },
        { name: 'judul', label: 'Judul', field: row => row.desk, align: 'left' },
        { name: 'nilai', label: 'nilai', field: row => row.nilai, jml: 'Y', align: 'right' },
        { name: 'tbayar', label: 'Terbayar', field: row => row.tbayar, jml: 'Y', align: 'right' },
        { name: 'sisa', label: 'Sisa', field: row => row.sisa, jml: 'Y', align: 'right' },
        { name: 'namaKaryawan', label: 'namaKaryawan', field: row => row.namaKaryawan, align: 'left' },
        { name: 'status', label: 'status', field: row => row.status, align: 'left' },
        { name: 'act', label: 'act', align: 'left' }
      ],
      jdlB: [
        { name: 'tgl', label: 'tgl', field: row => row.tgl, align: 'left' },
        { name: 'nomorJurnal', label: 'Nomor Jurnal', field: row => row.nomorJurnal, align: 'left' },
        { name: 'desk', label: 'Judul', field: row => row.desk, align: 'left' },
        { name: 'kodeAkun', label: 'Akun', field: row => row.namaAkun, align: 'right' },
        { name: 'nilai', label: 'nilai', field: row => row.nilai, jml: 'Y', align: 'right' },
        { name: 'status', label: 'Status', field: row => row.status }
      ],
      jdlr: [
        { label: 'Nama Partner', name: 'kodePartner', field: row => row.namaPartner, align: 'left' },
        { label: 'Total', name: 'nilai', field: row => row.nilai, jml: 'Y', align: 'right' },
        { label: 'Bayar', name: 'tbayar', field: row => row.tbayar, jml: 'Y', align: 'right' },
        { label: 'Sisa', name: 'sisa', field: row => row.sisa, jml: 'Y', align: 'right' }
      ],
      detByr: [],
      adP: false,
      adHP: false,
      inRul: [ v => !!v || 'Isi data' ],
      jh: {
        tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        kodePartner: ''
      },
      selected: [],
      cari: '',
      adB: false,
      adBa: false,
      alAkun: [],
      options: [],
      rekap: false,
      ac: 'N',
      j: { },
      namaKaryawan: '',
      dtCabang: [],
      kodeCab: 'MP01',
      jdlByr: [
        { label: 'Deskripsi', name: 'desk', field: row => row.desk, align: 'left' },
        { label: 'Akun', name: 'kodeAkun', field: row => row.kodeAkun, align: 'left' },
        { label: 'D/K', name: 'DK', field: row => row.DK, align: 'right' },
        { label: 'Nilai', name: 'nilai', field: row => row.nilai, align: 'right' },
        { label: 'act', name: 'act' }
      ],
      detJur: [],
      addJur: { kodeAkun: null, DK: 'D', nilai: 0 },
      hal: { rowsPerPage: 10 },
      bh: { tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), uraian: '', kodeCab: 'MP01', salesID: '', kodePartner: '' }
    })
    const byrHP = ref(null)
    const jdl = computed(() => {
      let x = dt.rekap ? dt.jdlr : dt.jdld
      return x
    })
    const detHP = computed(() => {
      let x = dt.rekap ? dt.dtRekap : dt.dtJurnal
      return x
    })
    const jenis = computed(() => {
      return props.jhp === 'H' ? 'Hutang' : 'Piutang'
    })
    const dtRekap = computed(() => {
      let dta = []
      if (dt.dtJurnal.length > 0) {
        let sp = [...new Set(dt.dtJurnal.map(x => x.salesID))] // ambil dt kode rekanan as array
        for (let i in sp) {
          // filter datPi where kode = sp[i] per grup rekanan
          let f = dt.dtJurnal.filter(x => x.salesID === sp[i])
          let s = { ...f[0] } // ambil value untuk rekanan
          s.nilai = f.reduce((x, y) => root.$dwn.jumlah([x, y.nilai]), 0)
          s.tbayar = f.reduce((x, y) => x + (+y.tbayar), 0)
          s.sisa = f.reduce((x, y) => x + (+y.sisa), 0)
          dta.push(s) // add to data array
          //          console.log(dta)
          // tinggal add judulnya
        }
      }
      return dta
    })
    const total = computed(() => {
      let x = {}
      x.nilai = dtRekap.value.reduce((a, b) => root.$dwn.jumlah([a, b.nilai]), 0)
      x.tbayar = dtRekap.value.reduce((a, b) => root.$dwn.jumlah([a, b.tbayar]), 0)
      x.sisa = dtRekap.value.reduce((a, b) => root.$dwn.jumlah([a, b.sisa]), 0)
      return x
    })
    const totalByr = computed(() => {
      let a = {}
      a.DK = 'K'
      a.kodeAkun = dt.bh.kodeAkun
      a.desk = dt.bh.uraian
      a.nilai = dt.detJur.length ? dt.detJur.reduce((a, b) => root.$dwn.jumlah([a, b.nilai]), 0) : 0
      return a
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
      getHP()
    })
    const getHP = () => {
      let x = { tgl: dt.jh.tgl, kodeCab: dt.kodeCab }
      dtKasbon(x)
        .then(res => {
          let a = res.data.map(u => {
            let y = u
            y.sisa = root.$dwn.jumlah([u.nilai, -u.tbayar])
            return y
          })
          dt.dtJurnal = a
        })
        .catch((err) => {
          console.log(err)
        })
    }
    const onReset = () => {
      dt.bh = { tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), uraian: '', kodeCab: 'MP01', salesID: '' }
      dt.detJur = []
      dt.adBa = false
    }
    const toDown = () => {
      let x = {
        judul: `Laporan ${props.jhp} `,
        dt: props.dtJurnal,
        hdr: jdl.value,
        naFile: `LapHP`
      }
      root.$dwn.toExcel(x)
    }
    const getByr = async (x, y, z) => {
      if (z) {
        let dbyr = await cekByr(x)
        if (dbyr.data.length) {
          dt.detByr.forEach((a, b, c) => {
            if (a.noreff === x.nomorJurnal.toString()) {
              c.splice(b, 1)
            }
          })
          dt.detByr.push(...dbyr.data)
        }
      }
    }
    const addByr = (x) => {
      // cek jml HP dan bayar
      getByr(x)
      console.log(x)
      if (x.nilai >= x.sisa) {
        dt.adBa = true
        dt.j = {}
        dt.namaKaryawan = x.namaPartner
        let a = { ...x }
        a.DK = x.DK === 'K' ? 'D' : 'K'
        a.ac = dt.ac
        a.cabP = x.cabID
        a.tgl = new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
        a.nilai = x.sisa // nilai akan dibayar
        a.tHP = x.nilai // total HP
        a.sisa = x.sisa // sisa HP sebelum bayar
        a.sisaHP = root.$dwn.jumlah([x.sisa, -a.nilai]) // sisa HP setelah bayar
        a.uraian = `Pengembalian kas bon ${x.nomorJurnal}`
        a.noreff = x.nomorJurnal
        a.akunHP = x.kodeAkun
        a.namaKaryawan = x.namaKaryawan
        a.desk = ''
        delete a.nomorJurnal
        dt.j = a
        dt.bh = a
        /* this.$nextTick(() => {
          let a = {}
          a.kodeAkun = x.kodeAkun
          a.nilai = x.sisa
          a.dk = x.jhp === 'P' ? 'K' : 'D'
          this.$refs.byrHP.jh.noreff = x.nomorJurnal
          this.$refs.byrHP.detJur.push({ ...a })
        }) */
      } else {
        root.$q.notify({ message: `Sudah lunas ?`, color: 'purple' })
      }
    }
    const simpan = async (x) => {
      if (x.nilai <= x.sisa) {
        dt.adB = false
        bayarHP(x)
          .then(({ data }) => {
            getHP()
            root.$q.notify({ message: `${data.st}`, color: 'success' })
          })
          .catch(err => {
            console.log(err.response.data)
            root.$q.notify({ message: 'gagal simpan...', color: 'warning' })
          })
      } else {
        root.$q.notify({ message: 'Kelebihan bayar ... ?', color: 'warning' })
      }
    }
    const hit = (x) => {
      if (root.$dwn.jumlah([x.sisa, -x.nilai]) >= 0) {
        x.sisaHP = root.$dwn.jumlah([x.sisa, -x.nilai])
      } else {
        x.sisaHP = 0
        x.nilai = x.sisa
      }
    }
    const bayar = async () => {
      if (dt.detJur.length > 0 && dt.detJur.every(a => (a.nilai !== 0 && a.kodeAkun !== null)) && totalByr.value.nilai <= dt.bh.sisa) {
        dt.bh.jnsTrx = 'RS'
        dt.bh.kodePartner = ''
        dt.detJur.push(totalByr.value)
        let x = await { hd: dt.bh, det: dt.detJur }
        inKas(x)
          .then(res => {
            root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
            onReset()
            getHP()
          })
          .catch(err => {
            console.log(err)
          })
      } else {
        root.$q.notify({ message: 'Cek data input dan sisa kas bon...', color: 'red' })
      }
    }
    const plus = () => {
      dt.addJur.DK = 'D'
      dt.detJur.push(Object.assign({}, dt.addJur))
    }
    const delJur = (item) => {
      const index = dt.detJur.indexOf(item)
      confirm(`Hapus nomer urut ${index + 1} ?`) && dt.detJur.splice(index, 1)
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
    return {
      ...toRefs(dt),
      getHP,
      onReset,
      toDown,
      getByr,
      addByr,
      simpan,
      hit,
      detHP,
      dtRekap,
      jenis,
      total,
      jdl,
      byrHP,
      bayar,
      plus,
      delJur,
      totalByr,
      filterFn
    }
  },
  watch: {
    selected: function (v) {
      let e = Object.assign({}, v[0])
      this.$emit('byr', e)
      this.toDown()
    }
  }
}
</script>
<style lang="sass">
.detHP
  /* max height is important */
  /* .q-table__middle
    max-height: 300px */

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th
    /* bg color is important for th; just specify one */
    background-color: rgba(166,21,132,0.6)

  thead tr th
    position: sticky
    z-index: 1
  thead tr:first-child th
    top: 0

  /* this is when the loading indicator appears */
  &.q-table--loading thead tr:last-child th
    /* height of all previous header rows */
    top:
