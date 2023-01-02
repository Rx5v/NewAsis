<template>
  <q-card class="col-sm-12">
    <q-card-section>
      <div class="text-h6">Permintaan Pembelian Barang</div>
    </q-card-section>
    <q-card-section>
      <q-form
        @submit="addPRa(pr)"
        class="q-gutter-md">
        <q-table
          class="detPR"
          :data="detPR"
          :columns="jdld"
          row-key="kodeProduk"
          dense>
          <template v-slot:top>
            <div class="col-4 q-table__title">Detail PR</div>
              <q-input filled v-model="pr.tglRequest" readonly>
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale" v-if="['MAN','purchase', 'acc'].some(a=> a== $store.state.auth.user.userType)">
                      <q-date v-model="pr.tglRequest" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
              <q-input
                v-model="pr.keterangan"
                label="Keterangan"
                class="q-ml-md"
                style="width: 500px"
                :rules="inRul"/>
            <q-space/>
            <q-toggle
              v-if="['MAN','purchase', 'acc'].some(a=> a== $store.state.auth.user.userType)"
              v-model="pr.ac"
              color="teal"
              keep-color
              false-value="N"
              true-value="Y"
              @input="pr.cabLain=''"
              checked-icon="check"
              label="Antar Cabang"
              unchecked-icon="clear"
            />
            <q-select
              v-if="pr.ac==='Y'"
              v-model="pr.cabLain"
              :options="cabAll"
              :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
              option-value="kodeCab"
              emit-value
              map-options
              style="min-width: 250px; max-width: 300px"
              label="Partner"
              class="q-ml-md"
              dense
              lazy-rules/>
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="kodeProduk" :props="props">
                {{ props.row.kodeProduk }}
              </q-td>
              <q-td key="namaBarang" :props="props">
                {{ props.row.namaBarang }}
              </q-td>
              <q-td key="qty" :props="props">
                {{ props.row.qty }}
                <q-popup-edit v-model="props.row.qty">
                  <q-input v-model="props.row.newQty" dense autofocus counter @input="adQty(props.row)"/>
                </q-popup-edit>
              </q-td>
              <q-td key="act"  :props="props">
                <q-icon name="close" color="red" @click="ondel(props.row)" />
              </q-td>
            </q-tr>
          </template>
        </q-table>
        <div align="right">
          <q-btn label="Submit" type="submit" color="primary"/>
          <q-btn label="Close" type="reset" color="primary" flat class="q-ml-sm" v-close-popup/>
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>
<script>
import { reactive, toRefs } from '@vue/composition-api'
import { addPR, dtCab } from '../services/apiList'
export default {
  props: {
    pra: {
      type: Object,
      default: () => {
        return {
          tglRequest: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), ac: 'N', cabLain: '', keterangan: ''
        }
      }
    },
    detPRa: {
      type: Array,
      default: () => {
        return []
      }
    }
  },
  setup (props, { root, emit, refs }) {
    const dt = reactive({
      detPR: [ ...props.detPRa ],
      jdld: [
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left' },
        { name: 'qty', label: 'Qty Request', field: row => row.qty, jml: 'Y', align: 'right' },
        { name: 'hargaSat', label: 'harga @', field: row => row.hargaSat, jml: 'Y', align: 'right' },
        { name: 'act', label: 'Act' }
      ],
      pr: {
        cabID: props.pra.cabID,
        kodeCab: props.pra.cabID,
        nomorPO: props.pra.nomorPO,
        tglRequest: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        ac: 'N',
        keterangan: `Untuk PO dari ${props.pra.namaPartner} No: ${props.pra.nomorPO}`,
        cabLain: ''
      },
      cabAll: [],
      inRul: [ v => !!v || 'Isi data' ]
    })
    dtCab().then(res => {
      dt.cabAll = res.data.filter(a => a.kodeCab !== props.pra.cabID)
    })
    const addPRa = (x) => {
      if (dt.detPR.every(a => a.qty > 0)) {
        addPR({ hd: x, det: dt.detPR })
          .then(res => {
            root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
            emit('ttp')
          })
          .catch((err) => {
            console.log(err)
            root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
          })
      } else {
        root.$q.notify({ message: `isi detail dan qty dulu...`, color: 'purple' })
      }
    }
    const ondel = (item) => {
      const index = dt.detPR.indexOf(item)
      let cf = confirm(`Hapus ${item.kodeProduk} ?`)
      if (cf) {
        dt.detPR.splice(index, 1)
        /* if (item.iddetPR) {
          api.delPRd(item)
            .then(res => this.$q.notify({ message: 'Data tersimpan', color: 'success' }))
            .catch(err => this.$q.notify({ message: 'Gagal simpan...' }))
        } */
      }
    }
    const adQty = (x) => {
      x.qty = x.newQty
    }
    return { ...toRefs(dt), addPRa, ondel, adQty }
  }
}
</script>
