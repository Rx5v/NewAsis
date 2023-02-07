<template>
  <q-card
    style="min-width: 60vw">
    <q-card-section>
      <!-- {{detBayar}} -->
      <div class="text-h6">Histori Pembayaran Project <q-chip color="blue-6" class="text-white text-bold q-ml-md">{{ p.nomorProject }}</q-chip></div>
      <q-space/>
      <q-chip outline :color="p.biaya > totalBayar ? 'red-7' : 'teal-5'" class="absolute-right"> {{ p.biaya > totalBayar ? 'BELUM LUNAS' : 'LUNAS' }}</q-chip>
    </q-card-section>
    <q-separator color="deep-orange-7"/>
    <q-card-section class="q-px-md q-py-sm row q-gutter-xs justify-between">
      <div class="col-md-5 items-start">
        <div class="text-h6" style="color:#474747">
          {{ p.biaya | duit }}
        </div>
        <p style="color:#1F929C">Total Harga</p>
      </div>
      <div class="col-md-5 items-end">
        <div class="text-h6" style="color:#474747">
          {{ totalBayar | duit}}
        </div>
        <p style="color:#1F929C">Jumlah Terbayar</p>
      </div>
      <q-btn
        v-if="p.biaya > totalBayar && ['Selesai', 'Diambil'].some(a => a === p.status)"
        round
        color="white"
        class="absolute-top-right"
        text-color="orange-7"
        icon="queue"
        @click="addBayar(p)"
      />
    </q-card-section>
    <q-card-section>
      <q-table
        :data="detBayar"
        :columns="jdl"
        dense
        class="dataPR"
        />
    </q-card-section>
    <q-dialog
      v-model="adB"
      persistent>
      <q-card style="width: 400px; max-width: 80vw;">
        <q-card-section class="bg-secondary text-white">Pembayaran </q-card-section>
        <q-form
          ref="form"
          @submit="simpan(j)"
          @reset="onReset"
          class="q-gutter-md">
          <q-card-section class="column">
            <q-input filled v-model="j.tgl" label="Tanggal" dense lazy-rules :rules="inRul" readonly>
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy v-if="['MAN','acc','mitra'].some(a=> a==$store.state.auth.user.userType)" ref="qDateProxy" transition-show="scale" transition-hide="scale">
                    <q-date v-model="j.tgl" @input="() => $refs.qDateProxy.hide()" :options="optionsFn" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
            <q-input
              v-model="j.judulJurnal"
              :rules="inRul"
              dense
              label="Judul Transaksi"/>
            <q-chip color="red" outline>Belum dibayar : {{ j.sisa | nomer }}</q-chip>
            <q-select
              filled
              v-model="j.kodeAkun"
              use-input
              dense
              options-dense
              input-debounce="0"
              label="Akun Kas"
              :options="akunB"
              :option-label="(item) => item && `${item.kodeAkun} ${item.namaSubAkun} ${item.namaAkun}`"
              option-value="kodeAkun"
              @filter="filterFn"
              :rules="inRul"
              map-options
              emit-value
              style="width: 250px"
            />
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
            <q-chip color="red" outline>Sisa :{{ j.sisaHP | nomer }} </q-chip>
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
  </q-card>
</template>
<script>
import { computed, onMounted, reactive, toRefs } from '@vue/composition-api'
import { accRek, bayarHP, hisBayarProject } from '../../services/apiList'
export default {
  props: {
    hdr: {
      type: Object,
      default: () => {
        return {
          tglMasuk: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
          kodeCab: null,
          kodePartner: null,
          kodeProduk: '',
          asalBahan: '',
          uangMuka: '',
          akunBayar: '',
          materialCust: '',
          catatan: '',
          salesID: null,
          estimasi: 1,
          jnsProject: '',
          nomorProject: null,
          akunUangMuka: ''
        }
      }
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      p: { ...props.hdr },
      detBayar: [],
      jdl: [
        { name: 'tglJurnal', label: 'Tanggal', field: row => row.tglJurnal, align: 'left' },
        { name: 'nomorJurnal', label: 'Nomor Pembayaran', field: row => row.nomorJurnal, align: 'left' },
        { name: 'akunKas', label: 'Akun Pembayaran', field: row => row.akunKas, align: 'left' },
        { name: 'nilai', label: 'Nilai', field: row => row.nilai, format: v => v.toLocaleString(), align: 'right' },
        { name: 'judulJurnal', label: 'Keterangan', field: row => row.judulJurnal, align: 'left' }
      ],
      j: {},
      adB: false,
      alAkun: [],
      inRul: [ v => !!v || 'Isi data' ],
      akunBP: []
    })
    const getAll = () => {
      hisBayarProject(props.hdr)
        .then(({ data }) => {
          dt.detBayar = data
        })
    }
    onMounted(() => {
      getAll()
      accRek()
        .then(res => {
          dt.alAkun = res.data
        })
    })
    const totalBayar = computed(() => {
      return dt.detBayar.reduce((a, b) => root.$dwn.jumlah([a, b.nilai]), 0)
    })
    const akunB = computed(() => {
      return dt.alAkun.filter(a => a.BP === 'Y')
    })
    const addBayar = (x) => {
      const aa = {
        tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        kodePartner: x.kodePartner,
        judulJurnal: `Pembayaran untuk nomorProject ${x.nomorProject}`,
        sisa: root.$dwn.jumlah([x.biaya, -totalBayar.value]),
        kodeAkun: '',
        ac: 'N',
        nilai: root.$dwn.jumlah([x.biaya, -totalBayar.value]),
        biaya: 0,
        sisaHP: 0,
        desk: `Pembayaran project ${x.nomorProject}`,
        cabP: x.kodeCab,
        nomorReff: x.nomorPiutang,
        akunHP: '110500001',
        DK: 'K'
      }
      dt.j = aa
      dt.adB = true
    }
    const simpan = (x) => {
      x.jhp = 'P'
      if (x.nilai <= x.sisa) {
        dt.adB = false
        bayarHP(x)
          .then(({ data }) => {
            getAll()
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
    const onReset = () => {

    }
    const hit = (x) => {
      x.sbbiaya = root.$dwn.jumlah([x.sisa, -x.nilai])
      if (root.$dwn.jumlah([x.sisa, -x.nilai, -x.biaya]) >= 0) {
        x.sisaHP = root.$dwn.jumlah([x.sisa, -x.nilai, -x.biaya])
      } else {
        x.sisaHP = 0
        x.nilai = x.sisa
      }
    }
    const filterFn = (val, update) => {
      if (val === '') {
        update(() => {
          dt.akunBP = dt.alAkun.filter(a => a.BP === 'Y')
        })
        return
      }
      update(() => {
        const needle = val.toLowerCase()
        dt.akunBP = dt.alAkun.filter(v => (v.namaAkun.toLowerCase().indexOf(needle) > -1 || v.namaSubAkun.toLowerCase().indexOf(needle) > -1 || v.kodeAkun.toLowerCase().indexOf(needle) > -1))
      })
    }
    const optionsFn = (date) => {
      return date >= dt.j.tglMasuk.replace(/-/g, '/')
    }
    return { ...toRefs(dt), totalBayar, addBayar, simpan, onReset, akunB, hit, filterFn, optionsFn }
  }
}
</script>
