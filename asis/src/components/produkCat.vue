<template>
  <div>
    <q-table
      class="dataTrx"
      :data="dtProdukCat"
      :columns="jdl"
      row-key="kodeCat"
      selection="single"
      :selected.sync="selected"
      :filter="cari"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Data Kategori Produk</div>
        <q-space />
        <q-input dense debounce="300" v-model="cari" placeholder="Search">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-btn
          flat round dense
          icon="add_circle"
          @click="editKat(), add='Add'"
          color="purple"
          class="q-ml-md"
        />
      </template>
      <template v-slot:body-cell-pencapaian="props">
        <td align="right">
        {{ props.row.pencapaian | duit }}
          <q-popup-edit v-model="props.row.pencapaian">
            <q-input
              v-model="props.row.pencapaian"
              type="number"
              input-class="text-right"
              label="Pencapaian @"
              dense
              autofocus
              @change="addProdCat(props.row)"/>
          </q-popup-edit>
        </td>
      </template>
      <template v-slot:body-cell-pointMember="props">
        <td align="right">
          {{ props.row.pointMember | nomer }}
          <q-popup-edit v-model="props.row.pointMember">
            <q-input
              v-model="props.row.pointMember"
              type="number"
              input-class="text-right"
              label="Point Member @"
              dense
              autofocus
              @change="addProdCat(props.row)"/>
          </q-popup-edit>
        </td>
      </template>
      <template v-slot:body-cell-promoPoint="props">
        <td align="right">
            <q-toggle
              v-model="props.row.promoPoint"
              input-class="text-right"
              label="Promo Point"
              false-value="OFF"
              true-value="ON"
              @input="addProdCat(props.row)"/>
        </td>
      </template>
      <template v-slot:body-cell-device="props">
        <td align="right">
            <q-toggle
              v-model="props.row.device"
              input-class="text-right"
              :label="props.row.device === 'Y' ? 'Device' : 'Non-device'"
              false-value="N"
              true-value="Y"
              @input="addProdCat(props.row)"/>
        </td>
      </template>
      <template v-slot:body-cell-jasa="props">
        <td align="right">
            <q-checkbox
              v-model="props.row.jasa"
              input-class="text-right"
              label="Jasa"
              false-value="N"
              true-value="Y"
              @input="addProdCat(props.row)"/>
        </td>
      </template>
    </q-table>
     <q-dialog
      v-model="adP"
      >
      <q-card style="width: 700px; max-width: 80vw;">
        <q-card-section>
          <div class="text-h6">{{add}} Kategori Produk</div>
        </q-card-section>
        <q-form
          @submit="addProdCat(p)"
          @reset="onReset"
          class="q-gutter-md">
          <q-card-section>
            <q-input
              filled
              v-model="p.kodeCat"
              label="Kode Kategori *"
              lazy-rules
              :rules="inRul"
            />
            <q-input
              filled
              v-model="p.produkCategory"
              label="Nama Kategori *"
              lazy-rules
              :rules="inRul"
            />
            <q-select filled v-model="p.akunPersediaan" :options="COA.filter(a=> a.subAkun==='11070')"
              option-label="namaAkun" option-value="kodeAkun" label="Akun Persediaan" emit-value  map-options/>
            <q-select filled v-model="p.akunPenjualan" :options="COA.filter(a=> a.subAkun==='31010')"
              option-label="namaAkun" option-value="kodeAkun" label="Akun Penjualan" emit-value  map-options/>
            <q-select filled v-model="p.akunHpp" :options="COA.filter(a=> a.subAkun==='41010')"
              option-label="namaAkun" option-value="kodeAkun" label="Akun HPP" emit-value  map-options/>
            <q-input
              v-model="p.pencapaian"
              type="number"
              input-class="text-right"
              label="Pencapaian @"
              dense
              autofocus/>
            <q-input
              v-model="p.pointMember"
              type="number"
              input-class="text-right"
              label="Point Member @"
              dense
              autofocus/>
            <q-checkbox
              v-model="p.promoPoint"
              false-value="OFF"
              true-value="ON"
              :label="`Promo Point ${p.promoPoint}`"/>
            <q-checkbox
              v-model="p.device"
              false-value="N"
              true-value="Y"
              :label="`Device: ${p.device}`"/>
            <q-checkbox
              v-model="p.jasa"
              false-value="N"
              true-value="Y"
              :label="`Jasa: ${p.jasa}`"/>
          </q-card-section>
          <q-card-actions align="right" class="bg-white text-teal">
            <q-btn label="Batal" v-close-popup color="accent" flat />
            <q-btn label="Reset" type="reset" color="orange" flat class="q-ml-sm" />
            <q-btn label="Submit" type="submit" color="primary" flat/>
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { onMounted, reactive, toRefs } from '@vue/composition-api'
import { dtCOA, dtProdukCat, addProdukCat } from '../services/apiList'
export default {
  // name: 'PageName',
  setup (props, { root }) {
    const dt = reactive({
      dtProdukCat: [],
      jdl: [
        { name: 'ProdukCat', label: 'Kode', field: row => row.kodeCat, align: 'left' },
        { name: 'namaProduk', label: 'Kategori', field: row => row.produkCategory, align: 'left' },
        { name: 'akunPersediaan', label: 'akunPersediaan', field: row => row.akunPersediaan + ' ' + row.Persediaan, align: 'left' },
        { name: 'akunPenjualan', label: 'akunPenjualan', field: row => row.akunPenjualan + ' ' + row.Penjualan, align: 'left' },
        { name: 'akunHpp', label: 'akunHpp', field: row => row.akunHpp + ' ' + row.Hpp, align: 'left' },
        { name: 'pencapaian', label: 'Pencapaian', field: row => row.pencapaian, sortable: true, align: 'right' },
        { name: 'pointMember', label: 'Point Member', field: row => row.pointMember, sortable: true, align: 'right' },
        { name: 'promoPoint', label: 'Promo Point', field: row => row.promoPoint },
        { name: 'device', label: 'Device', field: row => row.device },
        { name: 'jasa', label: 'Jasa', field: row => row.jasa },
        { name: 'act', label: 'Act' }
      ],
      adP: false,
      inRul: [ v => !!v || 'Isi data' ],
      p: { catID: '', promoPoint: 'OFF', pointMember: 0, pencapaian: 0, device: 'N', jasa: 'N', akunPersediaan: '', akunPenjualan: '', akunHpp: '' },
      selected: [],
      cari: '',
      COA: [],
      add: 'Add'
    })
    const getProdukCat = () => {
      dtProdukCat()
        .then(res => {
          dt.dtProdukCat = res.data
        })
        .catch((err) => {
          console.log(err)
        })
    }
    const editKat = () => {
      onReset()
      dt.adP = true
    }
    const addProdCat = (x) => {
      addProdukCat(x)
        .then(res => {
          onReset()
          getProdukCat()
          root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
        })
        .catch((err) => {
          console.log(err)
          root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    }
    const onReset = () => {
      dt.p = { catID: '', promoPoint: 'OFF', pointMember: 0, pencapaian: 0, device: 'N', jasa: 'N', akunPersediaan: '', akunPenjualan: '', akunHpp: '' }
    }
    onMounted(() => {
      dtCOA()
        .then(({ data }) => {
          dt.COA = data
        })
      getProdukCat()
    })
    return { ...toRefs(dt), addProdCat, onReset, editKat }
  },
  watch: {
    selected: function (v) {
      if (v.length > 0) {
        this.p = v[0]
        this.adP = true
        this.add = 'Edit'
      }
    }
  }
}
</script>
