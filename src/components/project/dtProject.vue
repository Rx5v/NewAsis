<template>
  <q-card>
    <!-- {{ p }} -->
    <q-card-section>
      <q-toolbar class="text-h6"
        >{{ jns }} Project
        <q-input
          dense
          readonly
          rounded
          outlined
          color="teal"
          class="q-ml-md text-right"
          :value="p.tglMasuk"
          label="Tanggal Masuk"
        >
          <q-popup-proxy
            ref="qDateProxy"
            transition-show="scale"
            transition-hide="scale"
            v-if="jns === 'Input'"
          >
            <q-date
              v-model="p.tglMasuk"
              @input="(x) => x && $refs.qDateProxy.hide()"
              mask="YYYY-MM-DD"
              lazy-rules
            />
          </q-popup-proxy>
        </q-input>
        <q-space />
        <q-input
          dense
          readonly
          rounded
          outlined
          color="teal"
          :value="
            dtSales.length
              ? dtSales.find((a) => a.salesID === p.salesID).namaKaryawan
              : ''
          "
          input-class="text-right text-teal"
          label="Nama Sales"
          ><q-popup-edit v-model="p.salesID">
            <q-select
              v-model="p.salesID"
              use-input
              :options="pilihSales"
              :option-label="
                (item) => item && item.namaKaryawan + ' ' + item.namaCabang
              "
              option-value="salesID"
              options-dense
              emit-value
              map-options
              style="min-width: 250px; max-width: 300px"
              label="Nama Sales"
              @filter="filterKn"
              :rules="inRul"
              :readOnly="jns !== 'Input'"
              dense
              lazy-rules
            />
          </q-popup-edit>
        </q-input>
      </q-toolbar>

      <q-separator color="purple-7" />
      <q-input
        :value="cust.namaPartner"
        label="Nama Pelanggan"
        input-class="text-teal"
        :hint="`alamat : ${cust.alamat}`"
        dense
        lazy-rules
        :rules="inRul"
        readonly
        @click="crp = true"
      />
      <q-dialog v-model="crp" persistent>
        <q-card style="min-width: 350px">
          <q-card-section class="q-pt-none">
            <cariPartner @dtPartner="partner" :pil="false" />
          </q-card-section>
          <q-card-actions align="right" class="text-primary">
            <q-btn flat label="Cancel" v-close-popup />
            <q-btn flat label="Pilih" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-card-section>
    <q-card-section>
      <q-form @submit="addProject(p)" @reset="onReset" class="q-gutter-md">
        <div class="row justify-between">
          <div class="col-12 col-sm-5 col-md-6">
            <q-card flat bordered>
              <div class="row q-pa-sm">
                <div class="col-md-12">
                  <!-- <q-input
                  v-model="p.jnsProject"
                  type="text" 
                  label="Judul Project"
                  standout="bg-teal text-white"
                  class="q-mb-md"
                  > 
                  <template v-slot:append>
                      <q-icon name="note" />
                    </template> 
                  </q-input> -->
                  <q-select
                    dense
                    standout="bg-teal text-white"
                    v-model="p.jnsProject"
                    :options="jenisProject"
                    :option-label="(item) => item && item.namaJenis"
                    option-value="jnsProject"
                    emit-value
                    map-options
                    class="q-mb-md"
                    :readonly="jns !== 'Input'"
                    label="Jenis Project"
                  />
                </div>
                <div class="col-md-5">
                  <q-file
                    class="q-mr-md"
                    outlined
                    v-model="potoSket"
                    type="file"
                    @input="fileSket"
                    stack-label
                    label="Sketsa"
                    color="teal"
                    accept=".jpg, image/*"
                    :readonly="jns !== 'Input'"
                  >
                    <template v-slot:append>
                      <q-icon name="folder" />
                    </template>
                  </q-file>
                </div>
                <div class="col-md-6">
                  <q-input
                    color="teal"
                    outlined
                    :value="p.estJadi"
                    :rules="inRul"
                    :readonly="jns !== 'Input'"
                    label="Estimasi Selesai"
                  >
                    <template v-slot:append>
                      <q-icon name="event" />
                    </template>
                    <q-popup-proxy
                      ref="qDateProxy"
                      transition-show="scale"
                      transition-hide="scale"
                      v-if="jns === 'Input'"
                    >
                      <q-date
                        v-model="p.estJadi"
                        @input="(x) => x && $refs.qDateProxy.hide()"
                        mask="YYYY-MM-DD"
                        lazy-rules
                      />
                    </q-popup-proxy>
                  </q-input>
                </div>
                <div class="col-md-12">
                  <q-input
                    v-model="p.catatan"
                    label="Catatan *"
                    color="teal"
                    lazy-rules
                    :rules="inRul"
                    autogrow
                    style="min-width: 250px"
                    :readonly="jns !== 'Input' && !editP"
                  />
                </div>
              </div>
            </q-card>

            <q-card flat bordered class="q-mt-md">
              <q-card-section>
                <div class="text-subtitle1">Jenis Proses:</div>
              </q-card-section>
              <q-separator dark inset />
              <div class="row q-gutter-sm item-start">
                <div class="col-md-12">
                  <q-select
                    standout="bg-teal text-white"
                    class="q-pa-md"
                    v-model="p.jnsProses"
                    multiple
                    :options="options"
                    use-chips
                    stack-label
                    :rules="inRul"
                  >
                    <template v-slot:selected-item="scope" class="q-gutter-sm">
                      <div class="q-mr-sm">
                        <q-chip
                          size="md"
                          removable
                          dense
                          @remove="scope.removeAtIndex(scope.index)"
                          :tabindex="scope.tabindex"
                          color="blue-10"
                          text-color="white"
                          class="q-ma-none"
                        >
                          <q-avatar
                            color="light-blue-9"
                            text-color="white"
                            :icon="scope.opt.icon"
                          />
                          {{ scope.opt.label }}
                        </q-chip>
                      </div>
                    </template></q-select
                  >
                </div>
              </div>
              <!-- <q-card-section>
                <div
                  class="row q-gutter-sm item-start"
                  v-for="(x, i) in p.jnsProses"
                  :key="i"
                >
                  <div class="col-md-5">
                    <q-select
                      dense
                      standout="bg-teal text-white"
                      v-model="x.jnsProses"
                      :options="['Press', 'Print', 'Cutting']"
                      emit-value
                      map-options
                      label="Jenis Project"
                    />
                  </div>
                  <div class="col-md-5">
                    <q-select
                      dense
                      standout="bg-teal text-white"
                      use-input
                      @filter="filterFn"
                      v-model="x.operator"
                      :options="operator.filter((s) => s.jabatan == 'Operator')"
                      :option-label="(item) => item && item.namaKaryawan"
                      option-value="namaKaryawan"
                      options-dense
                      emit-value
                      map-options
                      label="Operator Press *"
                      lazy-rules
                      :rules="inRul"
                      :readonly="jns !== 'Input'"
                    />
                  </div>
                  <div class="col-md-1">
                    <q-btn
                      color="negative"
                      outline
                      dense
                      icon="close"
                      round
                      @click="p.jnsProses.splice(i, 1)"
                      class="q-mr-sm"
                    />
                  </div>
                </div>
              </q-card-section> -->
            </q-card>
            <q-card flat bordered class="q-pa-md q-mb-md q-mt-md">
              <div class="row q-gutter-sm item-start">
                <div class="q-gutter-sm col-md-12">
                  <div class="col-md-12">Asal bahan :</div>
                  <q-radio
                    keep-color
                    v-model="p.asalBahan"
                    val="cust"
                    label="Pelanggan"
                    color="teal"
                    :disable="jns !== 'Input' && !editP"
                  />
                  <q-radio
                    keep-color
                    v-model="p.asalBahan"
                    val="outlet"
                    label="Outlet"
                    color="orange"
                    :disable="jns !== 'Input' && !editP"
                  />
                </div>
                <div class="col-md-12">
                  <q-input
                    standout="bg-teal text-white"
                    v-model="p.uangMuka"
                    type="number"
                    label="Uang Muka"
                    lazy-rules
                    input-class="text-right"
                    :hint="
                      new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                      }).format(p.uangMuka)
                    "
                    :readonly="jns !== 'Input'"
                  />
                </div>
                <div class="col-md-11">
                  <q-select
                    standout="bg-teal text-white"
                    v-if="p.uangMuka > 0"
                    v-model="p.akunBayar"
                    use-input
                    options-dense
                    input-debounce="0"
                    label="Pilih Pembayaran"
                    :options="akunCOA"
                    :option-label="
                      (item) => item && item.kodeAkun + ' ' + item.namaAkun
                    "
                    option-value="kodeAkun"
                    map-options
                    emit-value
                    :rules="inRul"
                    :readonly="jns !== 'Input'"
                  >
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          No results
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
                <div class="col-md-11 q-mt-xl">
                  <q-select
                    v-if="
                      ['MAN', 'purchase', 'acc'].some(
                        (a) => a == $store.state.auth.user.userType
                      )
                    "
                    v-model="p.kodeCab"
                    :options="cabAll"
                    :option-label="
                      (item) => item && item.kodeCab + ' ' + item.namaCabang
                    "
                    option-value="kodeCab"
                    emit-value
                    map-options
                    options-dense
                    label="Pilih cabang... "
                    :rules="inRul"
                    dense
                    readonly
                    lazy-rules
                  />
                </div>
              </div>
            </q-card>
          </div>

          <div class="col-12 col-sm-5 col-md-5">
            <q-card>
              <q-card-actions class="text-h6">
                Order
                <q-space />
                <q-avatar rounded size="70px">
                  <q-img
                    :src="gambar"
                    :ratio="1"
                    class="q-mt-md"
                    @click="gmb = !gmb"
                  />
                </q-avatar>
              </q-card-actions>
              <q-separator inset />
              <q-card-section>
                <q-list v-for="(a, i) in detOrder" :key="i" dense>
                  <q-input
                    :label="a.label"
                    v-model="p.detOrder[a.val]"
                    dense
                    :readonly="jns !== 'Input' && !editP"
                  />
                </q-list>
              </q-card-section>
            </q-card>

            <q-btn
              label="Edit Project"
              icon-right="edit"
              color="warning"
              rounded
              @click="editP = true"
              v-if="
                jns !== 'Input' &&
                !editP &&
                ['Diambil', 'Selesai', 'Batal'].every((a) => a !== p.status)
              "
            />

            <q-btn
              label="Update Project"
              @click="updateProject(p)"
              icon-right="done"
              color="teal"
              v-if="editP"
            />
          </div>
          <div class="col-12">
            <q-table
              class="dataPR"
              :data="detProject"
              :columns="jdld"
              row-key="kodeProduk"
              dense
              wrap-cells
              hide-bottom
              :pagination.sync="hal"
              separator="cell"
            >
              <template v-slot:top>
                <div
                  class="fit row wrap justify-between items-start content-start"
                >
                  <div class="text-h5">Biaya dan Bahan</div>
                  <q-chip color="blue" class="text-white q-ml-md"
                    >Nomor Project: {{ p.nomorProject }}</q-chip
                  >
                  <q-space />
                  <q-btn icon="add" color="pink" round @click="stk = true" />
                </div>
              </template>
              <template v-slot:body-cell-nom="props">
                <q-td align="right">
                  {{ props.rowIndex + 1 }}
                </q-td>
              </template>
              <template v-slot:body-cell-qtySPK="props">
                <q-td align="right"
                  >{{ props.row.qtySPK }}
                  <q-popup-edit
                    v-model="props.row.qtySPK"
                    @save="onSave(props.row)"
                    v-if="['Baru', 'Proses', 'Approve'].includes(p.status)"
                  >
                    <q-input
                      v-model="props.row.qtySPK"
                      dense
                      autofocus
                      counter
                      @input="onSave(props.row)"
                    />
                  </q-popup-edit>
                </q-td>
              </template>
              <template v-slot:body-cell-hargaSat="props">
                <q-td
                  align="right"
                  :class="props.row.qtySPK <= 0 && 'text-red-13'"
                >
                  <template v-if="props.row.qtySPK <= 0">
                    Tidak dimasuk invoice
                  </template>
                  <template v-else>
                    {{ props.row.hargaSat | duit }}
                    <q-popup-edit
                      v-model="props.row.hargaSat"
                      @save="onSave(props.row)"
                      v-if="jns === 'Input'"
                    >
                      <q-input
                        v-model="props.row.hargaSat"
                        dense
                        autofocus
                        counter
                        @input="onSave(props.row)"
                      />
                    </q-popup-edit>
                  </template>
                </q-td>
              </template>
              <template v-slot:body-cell-qtyProd="props">
                <q-td align="right"
                  >{{ props.row.qtyProd }}
                  <q-popup-edit
                    v-model="props.row.qtyProd"
                    @save="onSave(props.row)"
                    v-if="
                      jns !== 'Input' &&
                      !['Baru', 'Batal', 'Selesai', 'Diambil'].includes(
                        p.status
                      )
                    "
                  >
                    <q-input
                      v-model="props.row.qtyProd"
                      dense
                      autofocus
                      counter
                    />
                  </q-popup-edit>
                </q-td>
              </template>
              <template v-slot:body-cell-act="props">
                <q-td>
                  <q-btn
                    icon="close"
                    color="pink"
                    rounded
                    dense
                    outline
                    @click="dele(props.row)"
                    v-if="jns === 'Input' || props.row.qtySPK <= 0"
                  />
                </q-td>
              </template>
              <template v-slot:bottom-row>
                <q-tr>
                  <q-td align="right" colSpan="5">Total</q-td>
                  <q-td align="right" colSpan="4"
                    >{{ detProject.reduce((a, b) => a + b.jmlHarga, 0) | duit }}
                  </q-td>
                </q-tr>
              </template>
            </q-table>
          </div>
        </div>
        <div align="right" v-if="jns === 'Input'">
          <q-btn
            label="Simpan"
            outline
            type="submit"
            color="primary"
            class="shadow-3"
          />
          <q-btn
            label="Reset"
            outline
            type="reset"
            color="warning"
            flat
            class="q-ml-sm shadow-3"
          />
        </div>
        <div align="right" v-if="jns === 'Edit'">
          <q-btn
            label="Simpan"
            outline
            color="primary"
            class="shadow-3"
            @click="simpan(detProject)"
          />
          <q-btn
            label="Selesai"
            outline
            color="teal-7"
            class="q-ml-sm shadow-3"
            @click="selesai(p)"
            v-if="p.status === 'SelesaiProses'"
          />
          <q-btn
            label="tutup"
            outline
            color="warning"
            flat
            class="q-ml-sm shadow-3"
            v-close-popup
          />
        </div>
        <div align="right" v-if="jns === 'Proses'">
          <!-- <q-btn label="Selesai" outline color="teal-7" class="q-ml-sm shadow-3" @click="selesai(p)" v-if="p.status === 'Approve'"/> -->
          <q-btn
            label="tutup"
            outline
            color="warning"
            flat
            class="q-ml-sm shadow-3"
            v-close-popup
          />
        </div>
      </q-form>
    </q-card-section>
    <q-dialog v-model="stk" seamless position="bottom">
      <q-card style="max-width: 100vw; max-height: 50vh">
        <q-card-section>
          <div class="text-h6 text-blue-13">Pilih Produk</div>
          <q-btn
            icon="close"
            color="red"
            dense
            v-close-popup
            class="absolute-top-right"
          />
          <q-separator color="purple-13" />
        </q-card-section>
        <q-card-section>
          <dataStok @dtStok="cekStoki" />
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog v-model="gmb" full-width>
      <q-card>
        <q-card-section>
          <q-img
            :src="gambar"
            spinner-color="white"
            class="rounded-borders shadow-3"
            contain
            style="height: 90vh"
            ><!--
            <q-btn icon-right="close" label="hapus" color="red" class="absolute-bottom-right"/> -->
            <div
              class="absolute-bottom text-subtitle1 text-center text-white-5"
            >
              Sketsa untuk Nomor Project: {{ p.nomorProject }}
            </div>
          </q-img>
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog v-model="pil" width="600px" persistent>
      <q-card>
        <q-card-section class="bg-secondary text-white"
          >Cek Barang</q-card-section
        >
        <q-card-section class="row">
          <q-list dense>
            <q-item dense>
              <q-item-section>
                <q-item-label>Kode Barang</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label>{{ dtpil.kodeProduk }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense>
              <q-item-section>
                <q-item-label>Nama Barang</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label>{{ dtpil.namaBarang }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense>
              <q-item-section>
                <q-item-label>Stok Barang</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label>{{ dtpil.stok }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense>
              <q-item-section>
                <q-item-label>Qty Barang</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label>
                  <q-chip outline color="teal"
                    >{{ dtpil.jmlKemasan }}
                    {{ dtpil.kemasan.kemasan || "" }}</q-chip
                  >
                  <q-popup-edit v-model="dtpil.jmlKemasan">
                    <q-input
                      v-model="dtpil.jmlKemasan"
                      @input="onSaved(dtpil)"
                      dense
                      autofocus
                      counter
                    />
                  </q-popup-edit>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense>
              <q-item-section>
                <q-item-label>Kemasan Barang</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label>
                  <q-select
                    :options="dtpil.konversi"
                    v-model="dtpil.kemasan"
                    map-options
                    :option-label="(val) => val.isi + ' pcs/ ' + val.kemasan"
                    label="Kemasan *"
                    :rules="inRul"
                    @input="onSaved(dtpil)"
                    style="width: 200px"
                  />
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item
              v-show="
                ['gudang', 'produksi'].every(
                  (a) => a !== $store.state.auth.user.userType
                )
              "
              dense
            >
              <q-item-section>
                <q-item-label>Harga @ Barang</q-item-label>
                <!-- <q-select
                  v-model="dtpil.jns"
                  :options="['hargaRetail','hargaGrosir']"
                  @input="hrg(dtpil)"
                  label="Harga"
                  /> -->
              </q-item-section>
              <q-item-section side>
                <q-item-label>
                  <q-chip outline color="teal">{{
                    dtpil.hargaKemasan | duit
                  }}</q-chip>
                  <q-popup-edit v-model="dtpil.hargaKemasan">
                    <q-input
                      v-model="dtpil.hargaKemasan"
                      @input="onSaved(dtpil)"
                      dense
                      autofocus
                      counter
                    />
                  </q-popup-edit>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense>
              <q-item-section>
                <q-item-label>Jumlah Harga</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label>
                  {{ dtpil.jmlHarga | duit }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn rounded label="Kembali" color="warning" v-close-popup />
          <q-btn
            rounded
            label="Pilih"
            color="primary"
            v-close-popup
            @click="onpil(dtpil)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>
<script>
import {
  computed,
  onMounted,
  onUnmounted,
  reactive,
  toRefs,
} from "@vue/composition-api";
import {
  accRek,
  carikar,
  cekStok,
  delDetProject,
  dtCab,
  getdetProject,
  getJnsProject,
  getSketsa,
  postdetProject,
  projectDone,
  upProject,
  proses,
} from "../../services/apiList";
import dataStok from "../stokSatu";
import cariPartner from "../cariPartner";
export default {
  components: {
    dataStok,
    cariPartner,
  },
  props: {
    detail: {
      type: Array,
      default: () => {
        return [];
      },
    },
    hdr: {
      type: Object,
      default: () => {
        return {
          tglMasuk: new Date()
            .toLocaleString("sv", { timeZoneName: "short" })
            .slice(0, 10),
          kodeCab: null,
          kodePartner: null,
          kodeProduk: "",
          asalBahan: "",
          uangMuka: 0,
          akunBayar: "",
          materialCust: "--",
          catatan: "",
          salesID: null,
          estimasi: 1,
          estJadi: new Date()
            .toLocaleString("sv", { timeZoneName: "short" })
            .slice(0, 10),
          jnsProject: {},
          oDtf: "",
          oPress: "",
          nomorProject: null,
          akunUangMuka: "",
          detOrder: {},
          jnsProses: {},
        };
      },
    },
    jns: {
      type: String,
      default: "Input",
    },
    gmbr: {
      type: Blob,
      default: null,
    },
    pelanggan: {
      type: Object,
      default: function () {
        return { namaPartner: "", alamat: "" };
      },
    },
  },
  setup(props, { root, emit }) {
    const dt = reactive({
      detProject: [...props.detail],
      p: {
        ...props.hdr,
        kodeCab: root.$store.state.auth.setCabang,
      },
      Project: {
        nomorProject: "",
      },
      editP: false,
      cabAll: [],
      inRul: [(v) => !!v || "Isi data"],
      options: [
        {
          label: "Print",
          value: "print",
          icon: "print",
        },
        {
          label: "Press",
          value: "press",
          icon: "compress",
        },
        {
          label: "Cutting",
          value: "cutting",
          icon: "content_cut",
        },
      ],
      hal: { rowsPerPage: 10 },
      cust: {
        namaPartner: props.hdr.namaPartner || "",
        alamat: "",
        point: "N",
      },
      crp: false,
      jdld: [
        { name: "nom", label: "No", align: "left" },
        {
          name: "kodeProduk",
          label: "Kode Produk",
          field: (row) => row.kodeProduk,
          align: "left",
        },
        {
          name: "namaBarang",
          label: "Nama Barang",
          field: (row) => row.namaBarang,
          align: "left",
        },
        {
          name: "saldo",
          label: "Stok",
          field: (row) => row.saldo,
          jml: "Y",
          align: "right",
        },
        {
          name: "qtySPK",
          label: "Qty SPK",
          field: (row) => row.qtySPK,
          jml: "Y",
          align: "right",
        },
        {
          name: "qtyProd",
          label: "Konsumsi",
          field: (row) => row.qtyProd,
          jml: "Y",
          align: "right",
        },
        {
          name: "qtyInv",
          label: "Qty Jual",
          field: (row) => row.qtyInv,
          jml: "Y",
          align: "right",
        },
        {
          name: "hargaSat",
          label: "harga @",
          field: (row) => row.hargaSat,
          format: (v) => v && v.toLocaleString(),
          align: "right",
        },
        {
          name: "jmlHarga",
          label: "Jml Harga",
          field: (row) => row.jmlHarga,
          format: (v) => v && v.toLocaleString(),
          jml: "Y",
          align: "right",
        },
        { name: "act", label: "Act" },
      ],
      akunCOA: [],
      jenisProject: [],
      dtSales: [],
      pilihSales: [],
      stk: false,
      potoSket: null,
      gambar: props.gmbr,
      gmb: false,
      operator: [],
      jnsProses: [],
      detOrder: [
        { label: "Nama Kain", val: "namaKain" },
        { label: "Motif Kain", val: "motifKain" },
        { label: "Jumlah Kain", val: "jmlKain" },
        { label: "Lebar Kain", val: "lbrKain" },
        { label: "Aplikasi Produk", val: "aplikasiProduk" },
        { label: "Jumlah Produksi", val: "jmlProduksi" },
        { label: "Panjang Layout", val: "pjLayout" },
        { label: "Judul File", val: "jdlFile" },
      ],
      dtpil: {
        kemasan: { isi: 1, kemasan: "Pcs" },
        hargaKemasan: 0,
        jmlKemasan: 1,
      },
      pil: false,
    });
    carikar(root.$store.state.auth.user.kodeCab).then(({ data }) => {
      dt.operator = data;
    });
    onMounted(() => {
      getJnsProject().then(({ data }) => {
        dt.jenisProject = data;
      });

      accRek().then(({ data }) => {
        dt.akunCOA = data.filter((a) => a.kasMasuk === "Y");
      });
      carikar(root.$store.state.auth.user.kodeCab)
        .then(({ data }) => {
          dt.dtSales = data;
        })
        .catch((err) => {
          console.log(err);
        });
      dtCab().then(({ data }) => {
        dt.cabAll = data;
      });
      getSketsa(props.hdr.nomorProject).then((res) => {
        /* const oo = Buffer.from(res.data, 'base64')
          const blob = new Blob([oo], { type: res.headers['content-type'] }) */
        // console.log(res.data)
        dt.gambar = `data: 'png';base64, ${res.data.to64}`;
        // console.log(dt.gambar)
      });
      /* cariPartner(props.hdr.kodePartner)
        .then(({ data }) => {
          dt.cust = data
        }) */
    });
    onUnmounted(() => {
      emit("done");
    });
    const filterKn = (val, update) => {
      if (val === "") {
        update(() => {
          dt.pilihSales = dt.dtSales;
        });
        return;
      }
      update(() => {
        const needle = val.toLowerCase();
        dt.pilihSales = dt.dtSales.filter(
          (v) => v.namaKaryawan.toLowerCase().indexOf(needle) > -1
        );
      });
    };
    const cekStoki = (s) => {
      let x = { ...s };
      x.qty = x.qty || 1;
      x.jmlKemasan = x.jmlKemasan || 1;
      let kodeCab = dt.p.kodeCab;
      if (x.kodeProduk) {
        if (dt.detProject.find((a) => a.kodeProduk === x.kodeProduk)) {
          root.$q.notify({
            message: `Barang ${x.kodeProduk} sudah ada di list... `,
            color: "red-13",
          });
        } else {
          cekStok({
            kodeProduk: x.kodeProduk,
            kodeCab: kodeCab,
            kodePartner: s.kodePartner,
          })
            .then((res) => {
              /* if (res.data[1]) {
                this.kongsi = res.data[1]
                this.pr.pjKongsi = 'Y'
              } else {
                this.pr.pjKongsi = null
              } */
              x.hargaRetail = x.hargaJual || res.data[0].hargaRetail;
              x.hargaGrosir = res.data[0].hargaGrosir || 0;
              x.price1 = res.data[0].hargaGrosir || 0;
              x.stok =
                res.data[0].jasa === "Y" || x.jasa === "Y"
                  ? 1000
                  : res.data[0].saldo;
              x.hp = res.data[0].hpp || 0;
              x.qty = x.qty > 0 ? (x.stok > x.qty ? x.qty : x.stok) : 0;
              x.hargaSat = x.hargaRetail > x.price1 ? x.hargaRetail : x.price1;
              x.jns = "hargaRetail";
              x.pointMember = res.data[0].pointMember;
              // x.konversi = JSON.parse(x.konversi) || []
              x.kemasan = x.kemasan || { isi: 1, kemasan: "Pcs" };
              x.hargaKemasan = x.hargaKemasan || x.hargaSat * x.kemasan.isi;
              x.jmlPoint =
                dt.cust.point === "Y"
                  ? (x.pointMember * x.qty * x.hargaSat) / 100
                  : 0;
              dt.dtpil = { ...x };
              // this.kodeCab = kodeCab
              dt.pil = true;

              // this.onpil(x)
            })
            .catch((err) => {
              console.log(err);
              // this.$q.notify({ message: `Stok kosong`, color: 'purple' })
            });
        }
      }
    };
    const onpil = (x) => {
      // x.qty = 1
      x.nomorProject = dt.p.nomorProject;
      if (dt.detProject.find((a) => a.kodeProduk === x.kodeProduk)) {
        root.$q.notify({
          message: `${x.namaBarang} sudah di list...`,
          color: "warning",
        });
      } else {
        // x.hargaSat = x.hargaRetail
        /* x.jmlHarga = x.hargaRetail
        x.jmlPoint = x.pointMember * x.jmlHarga / 100 */
        // x.nomorProject = dt.Project.nomorProject
        x.qtySPK = x.qty;
        x.qtyInv = 0;
        dt.detProject.push({ ...x });
      }
    };
    const onSaved = (x) => {
      if (x.kodeProduk) {
        x.qty = x.kemasan.isi * x.jmlKemasan;
        x.hargaSat = x.hargaKemasan / x.kemasan.isi;
        if (x.qty > x.stok) {
          x.qty = x.stok;
          x.jmlKemasan = x.qty / x.kemasan.isi;
          //          x.hargaSat = x.hargaSat > x.hpp ? x.hargaSat : x.hpp
          root.$q.notify({
            message: `stok hanya tersedia ${x.stok} pcs`,
            color: "purple",
          });
        }
        if (x.qty > x.sisa) {
          x.qty = x.sisa;
          x.jmlKemasan = 0;
          //          x.hargaSat = x.hargaSat > x.hpp ? x.hargaSat : x.hpp
          root.$q.notify({
            message: `sisa permintaan hanya ${x.sisa} pcs`,
            color: "purple",
          });
        }
        if (x.hargaSat < x.price1) {
          root.$q.notify({
            message: `harga terlalu rendah...`,
            color: "purple",
          });
          x.hargaSat = x.price1;
          x.hargaKemasan = x.price1;
        }
      }

      /* if (this.ppn === 'in') {
        x.ppn = this.$dwn.kali([x.dpp, 1 / 11])
      } else {
        x.ppn = this.$dwn.kali([x.dpp, 0.1])
      } */
      x.jmlHarga = root.$dwn.kali([x.qty, x.hargaSat]);
      x.jmlPoint =
        x.pointMember > 0 && dt.cust.point === "Y"
          ? root.$dwn.kali([x.qty, x.hargaSat, x.pointMember]) / 100
          : 0;
      x.dpp = x.jmlHarga;
    };
    const onSave = (x) => {
      x.jmlHarga = x.qtySPK * x.hargaSat;
      x.jmlKemasan = x.qtySPK;
      x.hargaKemasan = x.hargaSat;
      x.kemasan = x.kemasan || { isi: 1, kemasan: "Pcs" };
      postdetProject(x).then(({ data }) => {
        root.$q.notify({ message: data.st, color: "teal-4" });
      });
      simpan(x);
      if (
        dt.detProject.find((a) => a.saldo < Number(a.qty)) &&
        x.jasa !== "Y"
      ) {
        dt.project.status = "Part";
        upD(dt.project, "Part", "Part");
      }
    };
    const simpan = async (x) => {
      let a;
      try {
        a = await postdetProject(x);
        root.$q.notify({ message: a.st, color: "teal-4" });
        return "done";
      } catch (error) {
        root.$q.notify({ message: error.response.data.st, color: "orange-4" });
      }
      /* postdetProject(x)
        .then(({ data }) => {
          root.$q.notify({ message: data.st, color: 'teal-4' })
          a = 'dono'
        })
        .catch(err => {
          root.$q.notify({ message: err.response.data.st, color: 'orange-4' })
          a = 'eror'
        }) */
    };
    const addProject = (x) => {
      x.kodePartner = dt.cust.kodePartner;
      // x.jnsProses = JSON.stringify(x.jnsProses);
      x.jnsProses = JSON.stringify(
        x.jnsProses.map((o) => {
          return o.value;
        })
      );
      x.akunUangMuka = dt.jenisProject.find(
        (a) => a.jnsProject === x.jnsProject
      ).akunUangmuka;
      // console.log(x.akunUangMuka);
      // console.log(dt.detProject);
      // console.log(JSON.stringify(x.jnsProses));
      if (dt.cust.kodePartner && dt.detProject.length) {
        // const aa = { ...x }
        const formData = new FormData();
        // const blob = await new Blob([dt.potoabs], { type: 'image/png' })
        formData.append(
          "potoSket",
          dt.potoSket,
          `${new Date().getTime()}x_${root.$store.state.auth.user.akun}.png`
        );
        // Object.keys(aa).forEach(key => formData.append(key, aa[key]))
        formData.append("hd", JSON.stringify(x));
        formData.append("det", JSON.stringify(dt.detProject));
        // console.log(formData);
        root.$axios
          .post("/inProject", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
          .then(({ data }) => {
            root.$q.notify({ message: data.st, color: "teal" });
            onReset();
          })
          .catch((err) => {
            root.$q.notify({ message: err.response.data.st, color: "warning" });
          });
      } else {
        root.$q.notify({ message: "Isi data pelanggan...", color: "warning" });
      }
    };
    const dele = (x) => {
      const index = dt.detProject.indexOf(x);
      x.kodeCab = dt.p.kodeCab;
      if (x.idprojectDetail) {
        delDetProject(x)
          .then(({ data }) => {
            root.$q.notify({ message: data.st, color: "teal" });
            getdetProject(x).then(({ data }) => {
              dt.detProject = data;
            });
          })
          .catch((err) => {
            root.$q.notify({ message: err.response.data.st, color: "warning" });
          });
      } else {
        dt.detProject.splice(index, 1);
      }
    };
    const onReset = () => {
      dt.p = {
        tglMasuk: new Date()
          .toLocaleString("sv", { timeZoneName: "short" })
          .slice(0, 10),
        kodeCab: root.$store.state.auth.user.kodeCab,
        kodePartner: null,
        asalBahan: "",
        uangMuka: 0,
        akunBayar: "",
        materialCust: "--",
        catatan: "",
        salesID: root.$store.state.auth.user.eID,
        estimasi: 1,
        estJadi: new Date()
          .toLocaleString("sv", { timeZoneName: "short" })
          .slice(0, 10),
        jnsProject: "",
        jnsProses: [],
        detOrder: [],
      };
      dt.Project = {
        kodeCab: root.$store.state.auth.user.kodeCab,
        kodePartner: null,
        asalBahan: "",
        uangMuka: 0,
        akunBayar: "",
        materialCust: "",
        catatan: "",
        salesID: root.$store.state.auth.user.eID,
        estimasi: 1,
        jnsProject: "",
      };
      dt.detProject = [];
      emit("done");
    };
    const partner = (x) => {
      dt.cust = x;
      dt.p.kodePartner = x.kodePartner;
    };
    const filterFn = (val, update) => {
      if (val === "") {
        update(() => {
          dt.options = dt.produk;
        });
        return;
      }

      update(() => {
        const needle = val.toLowerCase();
        dt.options = dt.produk.filter(
          (v) => v.namaBarang.toLowerCase().indexOf(needle) > -1
        );
      });
    };
    const base64toBlob = (base64Data, contentType) => {
      contentType = contentType || "";
      var sliceSize = 1024;
      var byteCharacters = window.atob(base64Data);
      var bytesLength = byteCharacters.length;
      var slicesCount = Math.ceil(bytesLength / sliceSize);
      var byteArrays = new Array(slicesCount);

      for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
        var begin = sliceIndex * sliceSize;
        var end = Math.min(begin + sliceSize, bytesLength);

        var bytes = new Array(end - begin);
        for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
          bytes[i] = byteCharacters[offset].charCodeAt(0);
        }
        byteArrays[sliceIndex] = new Uint8Array(bytes);
      }
      return new Blob(byteArrays, { type: contentType });
    };
    const fileSket = (x) => {
      // console.log(x)
      /* const blob = base64toBlob(x, 'image/png')
      console.log(blob) */
      dt.gambar = window.URL.createObjectURL(x);
    };
    const selesai = (x) => {
      if (dt.detProject.some((a) => a.qtyProd === 0)) {
        root.$q.notify({ message: "Konsumsi belum diisi...", color: "pink-4" });
      } else {
        root.$q
          .dialog({
            title: `Project ${x.nomorProject} selesai ?`,
            options: {
              type: "radio",
              model: "konfr",
              // inline: true
              items: [
                { label: "Selesai", value: "Selesai", color: "secondary" },
                { label: "Tutup", value: "Tutup", color: "yellow" },
              ],
              isValid: (val) => ["Selesai", "Tutup"].some((a) => a === val),
            },
            ok: {
              push: true,
            },
            persistent: false,
          })
          .onOk(async (data) => {
            if (data !== "Tutup") {
              let sp = await simpan(dt.detProject);
              if (sp === "done") {
                x.status = data;
                x.cabID = x.kodeCab;
                projectDone(x)
                  .then(({ data }) => {
                    root.$q.notify({ message: data.st, color: "teal" });
                    onReset();
                  })
                  .catch((err) => {
                    root.$q.notify({
                      message: err.response.data.st,
                      color: "warning",
                    });
                  });
              }
            }
          });
      }
    };

    const editAble = computed(() => {
      let a = ["Baru", "Proses", "Approve"].some((s) => s === dt.p.status);
      return a;
    });
    const updateProject = (x) => {
      root.$q
        .dialog({
          html: true,
          title: `<span class="text-teal" >Konfirmasi update project ${x.nomorProject}</span>`,
          options: {
            type: "radio",
            model: "konfr",
            // inline: true
            items: [
              { label: "Update", value: "Update", color: "teal" },
              { label: "Tutup", value: "Tutup", color: "yellow" },
            ],
            isValid: (val) => ["Update", "Tutup"].some((a) => a === val),
          },
          ok: {
            push: true,
          },
          persistent: false,
        })
        .onOk((data) => {
          if (data !== "Tutup") {
            upProject(x)
              .then(({ data }) => {
                root.$q.notify({ message: data.st, color: "teal" });
                dt.editP = false;
              })
              .catch((err) => {
                root.$q.notify({
                  message: err.response.data.st,
                  color: "warning",
                });
              });
          }
        });
    };
    return {
      ...toRefs(dt),
      cekStoki,
      onSaved,
      updateProject,
      filterKn,
      onpil,
      dele,
      onSave,
      onReset,
      partner,
      filterFn,
      simpan,
      addProject,
      fileSket,
      selesai,
      base64toBlob,
      editAble,
    };
  },
};

const a = {
  tglMasuk: "2022-05-20",
  kodeCab: "MP01",
  kodePartner: "MP01cB0000000454",
  asalBahan: "cust",
  uangMuka: "123120",
  akunBayar: "110100002",
  materialCust: "",
  catatan: "asd",
  salesID: "204",
  estimasi: 1,
  jnsProject: "JP001",
  detOrder: {
    namaKain: "asd",
    motifKain: "asd",
    jmlKain: "asd",
    lbrKain: "asdas",
    aplikasiProduk: "dads",
    jmlProduksi: "asd",
    pjLayout: "asd",
    jdlFile: "asd",
  },
  jnsProses: [],
  estJadi: "2022-05-16",
  akunUangMuka: "210600001",
};
det: [
  {
    kodeProduk: "0501017",
    saldo: 53,
    total: 927494.82102124,
    hpp: 17499.902283419622,
    kodeCabang: "MP01",
    hargaRetail: 500000,
    hargaGrosir: 0,
    tunggu: 0,
    akunPersediaan: "110700001",
    jasa: "N",
    sku: "0501017",
    namaBarang: "TINTA AMAZINK BROTHER T Series Black",
    konversi: '[{"isi":"1","kemasan":"Pcs"}]',
    pointMember: 10,
    compID: "ASI",
    kodeCab: "",
    kodeCat: "01",
    nilaiPersediaan: 927494.82102126,
    qty: 1,
    jmlKemasan: "1",
    price1: 0,
    stok: 53,
    hp: 17499.902283419622,
    hargaSat: 500000,
    jns: "hargaRetail",
    kemasan: { isi: 1, kemasan: "Pcs" },
    hargaKemasan: 500000,
    jmlPoint: 0,
    jmlHarga: 500000,
    dpp: 500000,
    qtySPK: 1,
    qtyInv: 0,
  },
];
</script>
