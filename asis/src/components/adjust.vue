<template>
  <q-card>
    <q-form
      @submit="adjs()"
      @reset="onReset"
      class="q-gutter-md">
      <q-card-section>
        <q-table
          class="detPR"
          :data="detR"
          :columns="jdlr"
          row-key="kodeProduk"
          dense>
          <template v-slot:top>
            <div class="col-4 q-table__title">
              Stok Adjustment
            </div>
            <q-input filled v-model="tgl" label="Tanggal" dense lazy-rules :rules="inRul" readonly>
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy v-if="['MAN','acc','mitra'].some(a=> a== $store.state.auth.user.userType)" ref="qDateProxy" transition-show="scale" transition-hide="scale">
                    <q-date v-model="tgl" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
            <q-chip color="deep-orange">{{prr.nomorStokOp}}</q-chip>
            <q-toggle
              :label="`Jenis Adjust ${prr.jenis}`"
              color="cyan"
              false-value="Kurang"
              true-value="Tambah"
              v-model="prr.jenis"
              checked-icon="check"
              unchecked-icon="clear"
              disable/>
            <q-select
              v-if="['MAN','purchase','acc'].some(a=> a== $store.state.auth.user.userType)"
              v-model="prr.kodeCab"
              :options="$store.state.auth.user.userType ==='MAN' ? cabAll : cabAsi"
              :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
              option-value="kodeCab"
              emit-value
              map-options
              class="q-ml-md"
              style="min-width: 250px; max-width: 300px"
              label="Pilih cabang... "
              dense
              lazy-rules/>
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="No" :props="props" auto-width>
                {{ detR.indexOf(props.row) +1 }}
              </q-td>
              <q-td key="kodeProduk" :props="props" auto-width>
                {{ props.row.kodeProduk }}
              </q-td>
              <q-td key="namaBarang" :props="props" auto-width>
                {{ props.row.namaBarang }}
              </q-td>
              <q-td key="selisih" :props="props" auto-width>
                <q-chip color="purple" text-color="white" dense> {{props.row.selisih | nomer}}</q-chip>
                <!-- <q-popup-edit v-model="props.row.selisih">
                  <q-input v-model="props.row.selisih" dense autofocus counter/>
                </q-popup-edit> -->
              </q-td>
              <q-td key="adjusted" :props="props" auto-width>
                {{ props.row.adjusted | nomer}}
              </q-td>
              <q-td key="adjust" :props="props" auto-width>
                <q-chip color="purple" text-color="white" dense> {{props.row.adjust | nomer}}</q-chip>
                <q-popup-edit v-model="props.row.adjust">
                  <q-input v-model="props.row.adjust" dense autofocus counter/>
                </q-popup-edit>
              </q-td>
              <q-td key="hpp" :props="props" auto-width>
                {{ props.row.hpp | nomer}}
                <q-popup-edit v-model="props.row.hpp">
                  <q-input v-model="props.row.hpp" dense autofocus counter/>
                </q-popup-edit>
              </q-td>
              <q-td key="akunBiaya" :props="props" auto-width style="overflow: hidden;">
                <q-select
                  filled
                  v-model="props.row.akunBiaya"
                  use-input
                  dense
                  options-dense
                  label="Pilih Akun COA"
                  :options="options"
                  :option-label="(item) => item && `${item.kodeAkun} ${item.namaSubAkun} ${item.namaAkun}`"
                  option-value="kodeAkun"
                  map-options
                  emit-value
                  @filter="filterFn"
                  style="max-width: 350px"
                />
              </q-td >
              <q-td key="biaya" :props="props" auto-width>
                {{ $dwn.kali([props.row.adjust,props.row.hpp]) | duit }}
              </q-td>
              <q-td key="keterangan" :props="props" auto-width>
                <q-chip color="purple" text-color="white" dense> {{props.row.keterangan}}</q-chip>
                <q-popup-edit v-model="props.row.keterangan">
                  <q-input v-model="props.row.keterangan" dense autofocus counter/>
                </q-popup-edit>
              </q-td>
              <q-td auto-width>
                <q-icon name="close" color="red" @click="ondel(props.row)" />
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>
      <q-card-actions>
        <q-space/>
        <q-btn label="Reset" type="reset" color="orange" class="q-ml-sm" />
        <q-btn label="Simpan" type="submit" color="primary"/>
      </q-card-actions>
    </q-form>
  </q-card>
</template>
<script>
import { reactive, toRefs, computed, watch } from '@vue/composition-api'
import { accRek, adjusment, dtCab } from '../services/apiList'
export default {
  props: {
    pr: {
      type: Object,
      default: function () {
        return { kodeCab: '', nomorStokOp: 'Adjust', desk: '', jenis: 'Tambah' }
      }
    },
    detRR: {
      type: Array,
      default: function () {
        return []
      }
    }
  },
  setup (props, { root, emit }) {
    const dt = reactive({
      jdlr: [
        { name: 'No', label: 'No' },
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left', sortable: true },
        { name: 'namaBarang', label: 'Nama Bahan', field: row => row.namaBarang, align: 'left', sortable: true },
        { name: 'selisih', label: 'selisih', field: row => row.selisih, sortable: true },
        { name: 'adjusted', label: 'Adjusted', field: row => row.adjusted, sortable: true },
        { name: 'adjust', label: 'Adjust', field: row => row.adjust, sortable: true },
        { name: 'hpp', label: 'hpp', field: row => row.hpp, sortable: true },
        { name: 'akunBiaya', label: 'akunBiaya', field: row => row.akunBiaya, align: 'left', sortable: true },
        { name: 'biaya', label: 'biaya', sortable: true, field: row => row.biaya, jml: 'Y', align: 'right' },
        { name: 'keterangan', label: 'keterangan', field: row => row.keterangan, sortable: true, align: 'right' },
        { name: 'act', label: 'act' }
      ],
      tgl: new Date(),
      prr: {},
      cabAll: [],
      filt: { kodeCab: root.$store.state.auth.setCabang },
      alAkun: [],
      options: [],
      detR: [...props.detRR],
      inRul: [ v => !!v || 'Isi data' ],
      prr: { ...props.pr }
    })
    accRek()
      .then(res => {
        dt.alAkun = res.data
      })
    const filterFn = (val, update) => {
      if (val === '') {
        update(() => {
          dt.options = dt.alAkun
        })
        return
      }
      update(() => {
        const needle = val.toLowerCase()
        dt.options = dt.alAkun.filter(v => (v.namaSubAkun.toLowerCase().indexOf(needle) > -1 || v.namaAkun.toLowerCase().indexOf(needle) > -1 || v.kodeAkun.toLowerCase().indexOf(needle) > -1))
      })
    }
    const adjs = () => {
      let rp = dt.detR.map(a => {
        a.keterangan = a.keterangan || ''
        return a
      })
      let prr = { ...props.pr, tgl: dt.tgl }
      if (rp.every(a => a.akunBiaya && a.hpp !== 0 && a.adjust !== 0)) {
        let detail = rp.map(s => {
          let d = s
          d.biaya = root.$dwn.kali([d.adjust, d.hpp])
          d.qty = d.adjust
          return d
        })
        adjusment({ pr: prr, det: detail })
          .then(res => {
            onReset()
            root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
          })
          .catch(err => {
            console.log(err)
            root.$q.notify({ message: `Belum tersimpan...`, color: 'purple' })
          })
      } else {/* 
        console.log(dt.detR.map(a => `${a.akunbiaya} + ${a.hpp} + ${a.selisih}`)) */
        root.$q.notify({ message: `Cek akunBiaya dan nilainya...`, color: 'purple' })
      }
    }
    const onReset = () => {
      emit('tutup', 'Y')/* 
      console.log('ok') */
    }
    dtCab()
      .then(({ data }) => {
        const pegang = root.$store.state.auth.user.cabGrup
        dt.cabAll = data.filter(a => pegang.some(s => s === a.kodeCab))
      })
    const cabAsi = computed(() => {
      return dt.cabAll
    })
    const ondel = (item) => {
      const index = dt.detR.indexOf(item)
      let cf = confirm(`Hapus ${item.kodeProduk} ?`)
      if (cf) {
        dt.detR.splice(index, 1)
        /* if (item.iddetPR) {
          api.delPRd(item)
            .then(res => this.$q.notify({ message: 'Data tersimpan', color: 'success' }))
            .catch(err => this.$q.notify({ message: 'Gagal simpan...' }))
        } */
      }
    }
    watch(() => root.$store.state.auth.setCabang, (val) => {
      dt.filt.kodeCab = val
    })
    watch(() => props.detRR, (val) => {
      dt.detR = val
    })
    return { ...toRefs(dt), cabAsi, adjs, onReset, filterFn, ondel }
  }
}
</script>
