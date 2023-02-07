<template>
  <q-card>
    <q-form
      @submit="addRakit()"
      @reset="onReset"
      class="q-gutter-md">
      <q-card-section>
        <q-table
          class="detPR"
          :data="detR"
          :columns="jdlr"
          row-key="kodeBahan"
          dense>
          <template v-slot:top>
            <div class="col-4 q-table__title">Perakitan {{ pr.kodeCab }}</div>
            <q-chip outline >Barang Jadi : {{ pr.namaBarang}} </q-chip>
            <q-input v-model="pr.qty" label="Qty Produksi" class="q-ml-md" @input="hitBhn" :rules="inRul"/>
            <q-input filled v-model="pr.tgl" label="Tanggal" dense lazy-rules :rules="inRul" readonly>
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy v-if="['MAN','acc','mitra'].some(a=> a== $store.state.auth.user.userType)" ref="qDateProxy" transition-show="scale" transition-hide="scale">
                    <q-date v-model="pr.tgl" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="No" :props="props" auto-width>
                {{ detR.indexOf(props.row) +1 }}
              </q-td>
              <q-td key="kodeBahan" :props="props">
                {{ props.row.kodeBahan }}
              </q-td>
              <q-td key="bahan" :props="props">
                {{ props.row.bahan }}
              </q-td>
              <q-td key="qty" :props="props">
                {{ props.row.qty | nomer}}
              </q-td>
              <q-td key="tqty" :props="props">
                {{ props.row.qty * pr.qty | nomer}}
              </q-td>
              <q-td key="tersedia" :props="props">
                {{ props.row.tersedia | nomer}}
              </q-td>
              <q-td key="selisih" :props="props">
                {{ props.row.tersedia - (props.row.qty * pr.qty) | nomer}}
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>
      <q-card-actions>
        <q-space/>
        <q-btn label="Simpan" type="submit" color="primary" :disable="smp"/>
      </q-card-actions>
    </q-form>
  </q-card>
</template>
<script>
import { reactive, toRefs, onMounted } from '@vue/composition-api'
import { detbom, rakit } from '../../services/apiList'
export default {
  props: {
    jh: {
      type: Object,
      default: function () {
        return { kodeProduk: null, namaBarang: '', qty: 1 }
      }
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      jdlr: [
        { name: 'No', label: 'No' },
        { name: 'kodeBahan', label: 'Kode Bahan', field: row => row.kodeBahan, align: 'left' },
        { name: 'bahan', label: 'Nama Bahan', field: row => row.bahan, align: 'left' },
        { name: 'qty', label: 'Qty', field: row => row.qty },
        { name: 'tqty', label: 'Total Qty', field: row => row.tqty },
        { name: 'tersedia', label: 'Tersedia', field: row => row.tersedia },
        { name: 'selisih', label: 'selisih', field: row => row.selisih }
      ],
      inRul: [ v => !!v || 'Isi data' ],
      pr: { ...props.jh, kodeCab: root.$store.state.auth.setCabang },
      cari: '',
      detR: [],
      smp: false
    })
    const adProd = (x) => {
      dt.pr = x
      detbom(x)
        .then(({ data }) => {
          dt.detR = data
          hitBhn()
        })
        .catch(err => {
          console.log(err)
        })
    }
    const hitBhn = () => {
      dt.detR.forEach(a => {
        a.tqty = root.$dwn.kali([a.qty, dt.pr.qty])
        a.selisih = root.$dwn.jumlah([a.tersedia, -a.tqty])
        a.thpp = root.$dwn.kali([a.tqty, a.hpp])
      })
      dt.pr.thpp = dt.detR.reduce((s, i) => root.$dwn.jumlah([s, i.thpp]), 0)
    }
    const addRakit = () => {
      // console.log(dt.pr)
      dt.smp = true
      if (dt.detR.every(a => a.qty > 0 && a.selisih >= 0) && dt.detR.length > 0 && dt.pr.kodeProduk) {
        rakit({ pr: dt.pr, det: dt.detR })
          .then(res => {
            onReset()
            root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
          })
          .catch(err => {
            console.log(err)
            root.$q.notify({ message: `Belum tersimpan...`, color: 'purple' })
          })
      } else {
        console.log(dt.detR)
        root.$q.notify({ message: `Cek qty, saldo bahan dan hasil produk jadi...`, color: 'purple' })
      }
    }
    const onReset = () => {
      dt.detR = []
      root.$emit('selesai')
      dt.smp = false
    }
    onMounted(() => {
      adProd(props.jh)
    })
    return {
      ...toRefs(dt),
      addRakit,
      hitBhn,
      adProd,
      onReset
    }
  }
}
</script>
