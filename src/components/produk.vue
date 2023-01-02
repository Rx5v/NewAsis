<template>
  <div>
    <q-table
      class="dataTrx"
      :data="dtProduk"
      :columns="jdl"
      row-key="kodeProduk"
      selection="multiple"
      :selected.sync="selected"
      :pagination.sync="hal"
      :filter="cari"
      dense
    >
      <template v-slot:top>
        <div class="col-2 q-table__title">Data Produks</div>
        <q-space />
        <q-input dense debounce="300" v-model="cari" placeholder="Search">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-btn
          flat
          round
          dense
          icon="add_circle"
          @click="adP = true"
          class="q-ml-md"
        />
      </template>
      <template v-slot:body-cell-hpp="props">
        <td align="right">
          {{ props.row.hpp | duit }}
        </td>
      </template>
      <template v-slot:body-cell-hargaGrosir="props">
        <td align="right">
          {{ props.row.hargaGrosir | duit }}
          <q-popup-edit v-model="props.row.hargaGrosir">
            <q-input
              v-model="props.row.hargaGrosir"
              type="number"
              input-class="text-right"
              label="Harga Grosir @"
              dense
              autofocus
              @change="setHrg(props.row, 'hargaGrosir')"
            />
          </q-popup-edit>
        </td>
      </template>
      <template v-slot:body-cell-hargaRetail="props">
        <td align="right">
          {{ props.row.hargaRetail | duit }}
          <q-popup-edit v-model="props.row.hargaRetail">
            <q-input
              v-model="props.row.hargaRetail"
              type="number"
              input-class="text-right"
              label="Harga Retail @"
              dense
              autofocus
              @change="setHrg(props.row, 'hargaRetail')"
            />
          </q-popup-edit>
        </td>
      </template>
    </q-table>
    <q-dialog v-model="adP">
      <q-card style="width: 700px; max-width: 80vw">
        <q-card-section>
          <div class="text-h6">Add Produks</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="addProduk(p)" @reset="onReset" class="q-gutter-md">
            <div class="row justify-between">
              <div class="col-12 col-md-5">
                <q-input
                  filled
                  v-model="p.sku"
                  label="SKU *"
                  lazy-rules
                  :rules="inRul"
                />
                <q-input
                  filled
                  v-model="p.namaProduk"
                  label="Nama Produk *"
                  lazy-rules
                  :rules="inRul"
                />
                <q-input
                  filled
                  v-model="p.deskripsi"
                  label="Product deskripsi *"
                  lazy-rules
                  autogrow
                  :rules="inRul"
                />
                <q-select
                  filled
                  v-model="p.kodeMerk"
                  label="Merk *"
                  :options="merk"
                  option-label="namaMerk"
                  option-value="kodeMerk"
                  emit-value
                  map-options
                  lazy-rules
                  :rules="inRul"
                />
              </div>
              <div class="col-12 col-md-5">
                <q-select
                  filled
                  v-model="p.catID"
                  :options="produkCat"
                  option-label="produkCategory"
                  option-value="kodeCat"
                  label="Kategori"
                  emit-value
                  map-options
                />
                <q-input
                  filled
                  v-model="p.satuan"
                  label="Satuan *"
                  lazy-rules
                  :rules="inRul"
                />
                <q-input
                  filled
                  v-model="p.price2"
                  type="number"
                  label="Harga bawah *"
                  lazy-rules
                  :rules="inRul"
                />
                <q-input
                  filled
                  v-model="p.price3"
                  type="number"
                  label="Harga jual *"
                  lazy-rules
                  :rules="inRul"
                />
                <q-toggle
                  v-model="p.aktif"
                  true-value="Y"
                  false-value="N"
                  label="Aktif"
                  :rules="inRul"
                />
                <q-toggle
                  v-model="p.publish"
                  true-value="Y"
                  false-value="N"
                  label="Publish ke Website"
                  :rules="inRul"
                />
              </div>
            </div>
            <div class="text-right">
              <q-btn label="Submit" type="submit" color="primary" />
              <q-btn
                label="Reset"
                type="reset"
                color="primary"
                flat
                class="q-ml-sm"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { reactive, toRefs, watch } from "@vue/composition-api";
import {
  getProdukCat,
  getMerk,
  dtProduk,
  addProduk,
  uphrg,
} from "../services/apiList";
export default {
  // name: 'PageName',
  setup(props, { root }) {
    const dt = reactive({
      dtProduk: [],
      jdl: [
        {
          name: "kodeProduk",
          label: "Kode",
          field: (row) => row.kodeProduk,
          sortable: true,
          align: "left",
        },
        {
          name: "produkCategory",
          label: "Kategori",
          field: (row) => row.produkCategory,
          sortable: true,
          align: "left",
        },
        {
          name: "namaMerk",
          label: "Merk",
          field: (row) => row.namaMerk,
          sortable: true,
          align: "left",
        },
        {
          name: "namaProduk",
          label: "Nama Produk",
          field: (row) => row.namaProduk,
          sortable: true,
          align: "left",
          style: "white-space: normal !important",
        },
        {
          name: "SKU",
          label: "SKU",
          field: (row) => row.sku,
          sortable: true,
          align: "left",
        },
        {
          name: "deskripsi",
          label: "Deskripsi",
          field: (row) => row.deskripsi,
          sortable: true,
          align: "left",
          style: "white-space: normal !important",
        },
        {
          name: "hargaGrosir",
          label: "Harga Grosir",
          sortable: true,
          field: (row) => row.hargaGrosir,
          jml: "Y",
          align: "right",
        },
        {
          name: "hargaRetail",
          label: "Harga Retail",
          sortable: true,
          field: (row) => row.hargaRetail,
          jml: "Y",
          align: "right",
        },
        {
          name: "satuan",
          label: "Satuan",
          field: (row) => row.satuan,
          sortable: true,
          align: "left",
        },
        {
          name: "publish",
          label: "Publish",
          field: (row) => row.publish,
          sortable: true,
        },
        {
          name: "aktif",
          label: "Aktif",
          field: (row) => row.aktif,
          sortable: true,
        },
      ],
      adP: false,
      inRul: [(v) => !!v || "Isi data"],
      p: { namaProduk: "", catID: "", satuan: "Pcs", aktif: "Y", publish: "N" },
      produkCat: [],
      merk: [],
      selected: [],
      cari: "",
      hal: { rowsPerPage: 10 },
    });
    const getProduk = () => {
      dtProduk()
        .then((res) => {
          dt.dtProduk = res.data.map((a) => {
            a.konversi = a.konversi || [];
            return a;
          });
        })
        .catch((err) => {
          console.log(err);
        });
    };
    watch(
      () => root.$store.state.auth.setCabang,
      (val) => {
        dt.kodeCab = val;
        getProduk();
      }
    );
    return { ...toRefs(dt), getProduk };
  },
  watch: {
    selected: function (v) {
      //      let e = Object.assign({}, v[v.length - 1])
      this.$emit("dtBrg", v);
    },
  },
  mounted() {
    this.getProduk();
    this.getprodukCat();
  },
  methods: {
    setHrg(x, y) {
      x.jns = y;
      uphrg(x)
        .then((res) => {
          this.$q.notify({ message: `${res.data.st}`, color: "teal" });
        })
        .catch((err) => {
          console.log(err);
          this.$q.notify({
            message: `${err.response.data.st}`,
            color: "purple",
          });
        });
    },
    async getprodukCat() {
      let procat = await getProdukCat();
      let m = await getMerk();
      Promise.all([procat, m])
        .then((data) => {
          this.produkCat = data[0].data;
          this.merk = data[1].data;
        })
        .catch((err) => {
          console.log(err);
        });
    },
    addProduk(x) {
      addProduk(x)
        .then((res) => {
          this.$q.notify({ message: `${res.data.st}`, color: "teal" });
        })
        .catch((err) => {
          console.log(err);
          this.$q.notify({
            message: `${err.response.data.st}`,
            color: "purple",
          });
        });
    },
    onReset() {
      this.p = {
        namaProduk: "",
        catID: "",
        satuan: "Pcs",
        aktif: "Y",
        publish: "N",
      };
    },
  },
};
</script>
