<template>
  <div>
    <q-table
      title="Sales Report"
      :data="dtSales"
      :columns="jdl"
      row-key="eID"
      :filter="cari"
      grid
      hide-header
    >
      <template v-slot:top-right>
        <q-input borderless dense debounce="300" v-model="cari" placeholder="Search">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <template v-slot:item="props">
        <div
          class="q-pa-xs col-xs-12 col-sm-6 col-md-4 col-lg-3 grid-style-transition"
        >
          <q-card >
            <q-card-section>
             {{ props.row.namaKaryawan }}
            </q-card-section>
            <q-separator />
            <q-list dense>
              <q-item v-for="col in props.cols.filter(col => col.name !== 'namaKaryawan')" :key="col.name">
                <q-item-section>
                  <q-item-label>{{ col.label }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label caption>{{ col.value }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </div>
      </template>
    </q-table>
    <q-table
      :grid="$q.screen.lt.md"
      title="Sales Report"
      :data="dtSales"
      :columns="jdl"
      row-key="eID"
      :filter="cari"
      dense
      :hide-header="$q.screen.lt.md"
    >
      <template v-slot:top-right>
        <q-input borderless dense debounce="300" v-model="cari" placeholder="Search">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>
    </q-table>
      <h4>Pivot Table</h4>
      <vue-pivottable-ui
        :data="dtSales"
        aggregatorName='Sum'
        rendererName='Table Heatmap'
        :rows="['namaProduk']"
        :cols="['namaKaryawan']"
        :vals="['jmlHarga']"
      />
      <!-- <h4>Pivot Table Style</h4>
      <pivot
        :data="dtSales"
        :fields="fields"
        :row-fields="rowFields"
        :col-fields="colFields"
        :reducer="reducer"
        :default-show-settings="defaultShowSettings">
        <template slot="value" slot-scope="{ value }">
          {{ value.toLocaleString() }}
        </template>
      </pivot> -->
  </div>
</template>

<script>
import { rkpAllsales } from '../../services/apiList'
export default {
  data () {
    return {
      sales: [],
      dtSales: [],
      jdl: [
        { name: 'namaKaryawan', label: 'Nama Sales', field: row => row.namaKaryawan, align: 'left' },
        { name: 'qty', label: 'Qty Sales', field: row => row.qty, jml: 'Y', align: 'right' },
        { name: 'jmlHarga', label: 'Nilai Jual', field: row => row.jmlHarga, format: val => new Intl.NumberFormat('en-ID', { style: 'currency', currency: 'IDR' }).format(val), jml: 'Y', align: 'right' },
        { name: 'dpp', label: 'Nilai DPP', field: row => row.dpp, format: val => new Intl.NumberFormat('en-ID', { style: 'currency', currency: 'IDR' }).format(val), jml: 'Y', align: 'right' },
        { name: 'hpp', label: 'Nilai HPP', field: row => row.hpp, format: val => new Intl.NumberFormat('en-ID', { style: 'currency', currency: 'IDR' }).format(val), jml: 'Y', align: 'right' },
        { name: 'laba', label: 'Nilai DPP - HPP', field: row => this.$dwn.jumlah([row.dpp, -row.hpp]), format: val => new Intl.NumberFormat('en-ID', { style: 'currency', currency: 'IDR' }).format(val), jml: 'Y', align: 'right' }
      ],
      cari: '',
      rowFields: [
        {
          getter: item => item.namaKaryawan,
          label: 'namaKaryawan'
        },
        {
          getter: item => item.namaProduk,
          label: 'namaProduk'
        },
        {
          getter: item => item.Customers,
          label: 'Customers'
        },
        {
          getter: item => item.qty,
          label: 'Qty'
        }
      ],
      colFields: [{
        getter: item => item.jmlHarga,
        label: 'Harga Jual'
      }],
      reducer: (sum, item) => sum + item.jmlHarga,
      defaultShowSettings: true,
      isDataLoading: false
    }
  },
  mounted () {
    let user = this.$store.state.auth.user
    rkpAllsales()
      .then(res => {
        let dt = user.userType === 'sales' ? res.data.filter(a => a.salesID === user.eID.toString()) : res.data
        this.dtSales = dt
      })
  }
}
</script>
<style>
 table table-bordered{
   border: 1px solid teal;
 }
</style>
