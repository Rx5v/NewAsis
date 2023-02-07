<template>
  <q-card>
    <q-card-section>
      <q-table
        class="dataTrx"
        :data="rekap ? dtRekap : dataProject"
        :columns="rekap ? jdlr : jdl"
        row-key="nomorProject"
        :filter="cari"
        :pagination.sync="hal"
        :expanded.sync="expanded"
        wrap-cells
        dense
      >
        <template v-slot:top>
          <div class="col-12 q-table__title text-h6 text-white">
            Data Project
          </div>
          <q-chip color="blue-6" class="text-white text-bold q-ml-md"
            >Periode : {{ tgl && tgl.from ? tgl.from + " ~ " + tgl.to : tgl }}
            <q-popup-proxy
              ref="qDateProxya"
              transition-show="scale"
              transition-hide="scale"
            >
              <q-date
                range
                v-model="tgl"
                @input="(x) => x && (getAll(), $refs.qDateProxya.hide())"
                mask="YYYY-MM-DD"
                lazy-rules
              />
            </q-popup-proxy>
          </q-chip>
          <q-toggle
            v-model="rekap"
            label="Per Partner"
            class="q-ml-md text-white text-bold"
            color="teal-4"
            @input="expanded = []"
          />
          <q-space />
          <!-- <q-select
            v-model="filt.status"
            :options="statusProject"
            multiple
            options-dense
            style="min-width: 250px; max-width: 300px"
            label="Status... "
            :rules="inRul"
            dense
            class="q-mr-sm"
            @input="getAll()"
            lazy-rules/> -->
          <q-input v-model="cari" style="width: 250px" label="Cari data...">
            <template v-slot:append>
              <q-icon name="search" />
              <q-btn
                flat
                round
                dense
                icon="file_download"
                @click="toDown(dataProject, jdl)"
                class="q-ml-md"
                color="primary"
              />
            </template>
          </q-input>
          <!-- <q-select
            v-if="['MAN','purchase', 'acc'].some(a=> a== $store.state.auth.user.userType)"
            v-model="filt.kodeCab"
            :options="cabAll"
            :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
            option-value="kodeCab"
            emit-value
            map-options
            options-dense
            style="min-width: 250px; max-width: 300px"
            label="Pilih cabang... "
            :rules="inRul"
            dense
            class="q-ml-sm"
            @input="getAll()"
            lazy-rules/> -->
          <q-btn
            v-if="$store.state.auth.user.userType !== 'teknisi'"
            icon="add"
            color="pink"
            round
            @click="inProj('Input')"
          />
        </template>
        <template v-slot:body="props">
          <q-tr
            :props="props"
            :class="
              props.expand
                ? 'bg-cyan-13'
                : props.row.umur > 60
                ? 'bg-deep-orange-6'
                : props.row.umur > 30
                ? 'bg-yellow-13'
                : 'bg-white'
            "
          >
            <q-td
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
              :class="col.jml === 'Y' ? 'text-right' : 'text-left'"
              style="max-width: 250px"
            >
              <template v-if="col.name === 'act'">
                <template
                  v-if="
                    ['MAN', 'purchase', 'acc', 'admin', 'mitra'].some(
                      (a) => a == $store.state.auth.user.userType
                    )
                  "
                >
                  <template v-if="props.row.status === 'Baru'">
                    <q-btn
                      class="q-ml-xs"
                      icon="check_circle_outline"
                      color="primary"
                      rounded
                      dense
                      outline
                      @click="upD(props.row, 'status', 'Approve')"
                    >
                      <q-tooltip
                        content-class="bg-teal"
                        :offset="[10, 10]"
                        anchor="center left"
                      >
                        Approve
                      </q-tooltip>
                    </q-btn>
                  </template>
                  <template v-if="props.row.status === 'Selesai'">
                    <q-btn
                      class="q-ml-xs"
                      icon="flight_takeoff"
                      color="teal-7"
                      rounded
                      dense
                      outline
                      @click="ambil(props.row)"
                    >
                      <q-tooltip
                        content-class="bg-teal"
                        :offset="[10, 10]"
                        anchor="center left"
                      >
                        Ambil
                      </q-tooltip>
                    </q-btn>
                  </template>
                  <template>
                    <q-btn
                      class="q-ml-xs"
                      icon="edit"
                      color="deep-orange-4"
                      rounded
                      dense
                      outline
                      @click="inProj('Edit', props.row)"
                    >
                      <q-tooltip
                        content-class="bg-teal"
                        :offset="[10, 10]"
                        anchor="center left"
                      >
                        Produksi
                      </q-tooltip>
                    </q-btn>
                    <q-btn
                      class="q-ml-xs"
                      icon="print"
                      color="orange-7"
                      rounded
                      dense
                      outline
                      @click="cetak(props.row)"
                    >
                      <q-tooltip
                        content-class="bg-orange-7"
                        :offset="[10, 10]"
                        anchor="center left"
                      >
                        Print
                      </q-tooltip>
                    </q-btn>
                  </template>
                </template>
                <!-- <template v-else>
                  <template v-if="['Proses', 'Approve', 'Selesai'].some(a => props.row.status === a)">
                    <q-btn icon="grading" color="primary" rounded dense outline @click="addPt(props.row)" class="q-ml-md">
                      <q-tooltip content-class="bg-purple" :offset="[10, 10]" anchor="center left">
                        Part dan Biaya
                      </q-tooltip>
                    </q-btn>
                  </template>
                  <template v-else-if="props.row.status === 'Konfirm'">
                    <q-btn icon="check_circle_outline" dense color="purple" outline class="q-ml-sm">
                      <q-tooltip content-class="bg-teal text-bold" :offset="[10, 10]" anchor="center left">
                        Konfirm
                      </q-tooltip>
                    </q-btn>
                  </template>
                  <q-btn v-if="['Baru', 'Proses', 'Selesai', 'Part'].some(a => a === props.row.status)" label="Konfirmasi" dense color="purple" outline class="q-ml-sm">
                    <q-popup-edit v-model="props.row.konfirmasi" buttons label-set="Simpan" @save="upD(props.row, 'Konfirm')">
                      <q-input v-model="props.row.konfirmasi" label="Konfirmasi" dense autogrow autofocus @keyup.enter.stop/>
                    </q-popup-edit>
                  </q-btn>
                  <q-btn icon="print" color="warning" rounded dense outline @click="cetak(props.row)" class="q-ml-md"/>
                </template> -->
                <q-btn
                  icon="info"
                  dense
                  color="yellow-13"
                  rounded
                  outline
                  class="q-ml-md"
                >
                  <q-menu
                    auto-close
                    content-class="bg-grey-12"
                    style="width: 550px"
                  >
                    <q-list separator style="max-width: 600px">
                      <q-item active active-class="bg-orange-2" dense>
                        Aktifitas user...
                      </q-item>
                      <q-separator />
                      <q-item
                        dense
                        v-for="(i, s) in props.row.userLog"
                        :key="s"
                      >
                        <q-item-section>
                          <q-item-label overline>{{ i.aksi }}</q-item-label>
                          <q-item-label caption>{{ i.user }}</q-item-label>
                        </q-item-section>
                        <q-item-section side top>
                          <q-item-label caption>{{
                            i.waktu
                              ? new Date(i.waktu).toLocaleString("id-ID", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })
                              : ""
                          }}</q-item-label>
                          <q-item-label
                            ><q-icon name="info" color="orange" size="sm"
                          /></q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </template>
              <template v-else-if="col.name === 'nom'">
                <q-icon
                  v-if="rekap"
                  size="sm"
                  color="accent"
                  round
                  dense
                  @click="props.expand = !props.expand"
                  :name="props.expand ? 'expand_less' : 'expand_more'"
                />
                {{ props.rowIndex + 1 }}
              </template>
              <template v-else-if="col.name === 'status'">
                {{ props.row.status }}
              </template>
              <template v-else-if="col.name === 'part'">
                <template v-if="props.row.part">
                  <ol>
                    <li v-for="(a, b) in props.row.part.split(',')" :key="b">
                      Kode {{ a }}
                    </li>
                  </ol>
                </template>
              </template>
              <template v-else>
                <template v-if="col.jml === 'Y'">
                  {{ col.value | duit }}
                </template>
                <template v-else>
                  {{ col.value }}
                </template>
              </template>
            </q-td>
          </q-tr>
          <q-tr
            v-show="props.expand"
            :props="props"
            :class="props.expand && 'bg-yellow-2'"
          >
            <q-td colspan="100%">
              <q-table
                class="detTrx"
                :data="
                  dataProject.filter(
                    (a) => a.kodePartner === props.row.kodePartner
                  )
                "
                :columns="jdl"
                row-key="nomorProject"
                selection="multiple"
                :selected.sync="pilih"
                wrap-cells
                dense
              >
                <template v-slot:body-cell-part="props">
                  <q-td>
                    <template v-if="props.row.part">
                      <ol>
                        <li
                          v-for="(a, b) in props.row.part.split(',')"
                          :key="b"
                        >
                          Kode {{ a }}
                        </li>
                      </ol>
                    </template>
                  </q-td>
                </template>
              </q-table>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card-section>
    <q-dialog v-model="adS" full-width>
      <inputProject
        :hdr="p"
        :detail="detTrx"
        :jns="jnsInput"
        @done="getAll()"
      />
    </q-dialog>
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
          <dataStok @dtStok="onpil" />
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog v-model="confirm" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="print" color="primary" text-color="white" />
          <span class="q-ml-sm">Menu Cetak : #{{ ctk.nomorProject }}</span>
          <q-space />
          <q-btn round icon="close" color="red" v-close-popup />
        </q-card-section>
        <q-card-actions align="right">
          <template v-if="rekap">
            <q-btn
              outline
              label="Tanda Terima"
              color="primary"
              @click="printWr(ctk)"
            />
            <q-btn
              outline
              label="Pengambilan"
              color="primary"
              @click="printWP(ctk)"
            />
          </template>
          <template v-else>
            <q-btn
              outline
              label="Tanda Terima"
              color="primary"
              @click="printA4(ctk)"
            />
            <q-btn outline label="SPK" color="primary" @click="printW(ctk)" />
          </template>
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="dBy">
      <dataBayar :hdr="p" />
    </q-dialog>
    <rekapProject :detail="dataProject" />
  </q-card>
</template>

<script>
import {
  computed,
  onMounted,
  reactive,
  toRefs,
  watch,
} from "@vue/composition-api";
import {
  accRek,
  addPartService,
  allDataProject,
  carikar,
  delDetService,
  getdetProject,
  dtCab,
  dtUser,
  getBankCab,
  getJnsProject,
  getMerk,
  partService,
  produkService,
  projectApprove,
  ambilProject,
  getSketsa,
  hisBayarProject,
} from "../../services/apiList";
// import cariPartner from '../../components/cariPartner'
import dataStok from "../../components/stokSatu";
import inputProject from "./uDetailProject.vue";
import dataBayar from "./dataBayar.vue";
import rekapProject from "./rekapProject.vue";
export default {
  components: {
    dataStok,
    inputProject,
    dataBayar,
    rekapProject,
  },
  setup(props, { root }) {
    const dt = reactive({
      expanded: [],
      cari: "",
      confirm: false,
      stk: false,
      repair: false,
      p: {
        tglMasuk: new Date()
          .toLocaleString("sv", { timeZoneName: "short" })
          .slice(0, 10),
        kodeCab: root.$store.state.auth.user.kodeCab,
        kodePartner: null,
        kodeProduk: "",
        asalBahan: "",
        uangMuka: 0,
        akunBayar: "",
        materialCust: "",
        catatan: "",
        salesID: root.$store.state.auth.user.eID,
        estimasi: 1,
        estJadi: new Date()
          .toLocaleString("sv", { timeZoneName: "short" })
          .slice(0, 10),
        jnsProject: "",
        akunUangMuka: "",
        detOrder: {},
      },
      hal: { rowsPerPage: 10 },
      adS: false,
      filt: {
        kodeCab: root.$store.state.auth.setCabang,
        tgla: "",
        tglb: "",
        status: ["Baru", "Konfirm", "Proses", "Part", "Selesai"],
      },
      tgl: {
        from:
          new Date()
            .toLocaleString("sv", { timeZoneName: "short" })
            .slice(0, 8) + "01",
        to: new Date()
          .toLocaleString("sv", { timeZoneName: "short" })
          .slice(0, 10),
      },
      dataProject: [],
      cust: { namaPartner: "", kodePartner: null },
      crp: false,
      cabAll: [],
      merk: [],
      produk: [],
      inRul: [(v) => !!v || "Isi data"],
      ctk: {},
      pilih: [],
      detTrx: [],
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
          align: "right",
        },
        {
          name: "jmlHarga",
          label: "Jml Harga",
          field: (row) => row.jmlHarga,
          jml: "Y",
          align: "right",
        },
        { name: "act", label: "Act" },
      ],
      adP: false,
      pg: { rowsPerPage: 0 },
      dtKar: [],
      akunCOA: [],
      tempo: [
        { label: " 7 Hari", value: "7" },
        { label: "14 hari", value: "14" },
        { label: "30 hari", value: "30" },
        { label: "60 Hari", value: "60" },
        { label: "90 hari", value: "90" },
      ],
      rekap: false,
      jdl: [
        { name: "nom", label: "No", align: "left" },
        {
          name: "kodeCab",
          label: "Cabang",
          field: (row) => row.kodeCab,
          align: "left",
        },
        {
          name: "nomorProject",
          label: "Nomor Project",
          field: (row) => row.nomorProject,
          align: "left",
        },
        {
          name: "tglMasuk",
          label: "Tanggal Masuk",
          field: (row) => row.tglMasuk,
          sortable: true,
          align: "left",
        },
        {
          name: "namaPartner",
          label: "Nama Partner",
          field: (row) => row.namaPartner,
          sortable: true,
          align: "left",
        },
        {
          name: "telpPIC",
          label: "Telp PIC",
          field: (row) => row.telpPIC,
          align: "left",
        },
        {
          name: "status",
          label: "Status",
          field: (row) => row.status,
          sortable: true,
          align: "left",
        },
        {
          name: "biaya",
          label: "Total Harga",
          field: (row) => row.biaya,
          jml: "Y",
          align: "right",
        },
        {
          name: "namaSales",
          label: "Sales",
          field: (row) => row.namaSales,
          sortable: true,
          align: "left",
        },
        {
          name: "umur",
          label: "Umur",
          field: (row) => row.umur,
          sortable: true,
          align: "left",
        },
        {
          name: "TAT",
          label: "TAT",
          field: (row) => row.TAT,
          sortable: true,
          align: "left",
        },
        { name: "act", label: "Act", align: "left" },
      ],
      jdlr: [
        { name: "nom", label: "No", align: "left" },
        {
          name: "kodeCab",
          label: "Cabang",
          field: (row) => row.kodeCab,
          align: "left",
        },
        {
          name: "namaPartner",
          label: "Nama Partner",
          field: (row) => row.namaPartner,
          align: "left",
        },
        {
          name: "telpPIC",
          label: "Telp PIC",
          field: (row) => row.telpPIC,
          align: "left",
        },
        {
          name: "biaya",
          label: "Biaya",
          field: (row) => row.biaya,
          jml: "Y",
          align: "right",
        },
        { name: "act", label: "Act", align: "left" },
      ],
      options: [],
      Project: {
        kodeCab: root.$store.state.auth.user.kodeCab,
        kodePartner: null,
        kodeProduk: "",
        asalBahan: "",
        uangMuka: 0,
        akunBayar: "",
        materialCust: "",
        catatan: "",
        salesID: root.$store.state.auth.user.eID,
        estimasi: 1,
        jnsProject: "",
      },
      statusProject: [
        "Baru",
        "Konfirm",
        "Proses",
        "Selesai",
        "Closed",
        "Batal",
      ],
      dataAllProject: [],
      dtSales: [],
      pilihSales: [],
      jenisProject: [],
      jnsInput: "Input",
      dBy: false,
      gambar: null,
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
    const getAll = () => {
      dt.filt.tgla = dt.tgl && dt.tgl.from ? dt.tgl.from : dt.tgl || new Date();
      dt.filt.tglb = dt.tgl && dt.tgl.from ? dt.tgl.to : dt.tgl || new Date();
      allDataProject(dt.filt).then(({ data }) => {
        dt.dataAllProject = data; /* .map(a => {
            if (a.pencapaian) {
              a.pointService = a.pencapaian.pointService
              a.pointRefill = a.pencapaian.pointRefill
              a.pointMaintenance = a.pencapaian.pointMaintenance
              a.totalPointTeknisi = a.pointService + a.pointRefill + a.pointMaintenance
            }
            return a
          }) */
      });
    };
    const dataProject = computed(() => {
      return dt.dataAllProject; /* .filter(a => dt.filt.status.some(s => s === a.status)) */
    });
    watch(
      () => root.$store.state.auth.setCabang,
      (newVal, oldVal) => {
        dt.filt.kodeCab = newVal;
        getAll();
      }
    );
    dtUser().then(({ data }) => {
      dt.dtKar = data;
    });
    dtCab().then(({ data }) => {
      dt.cabAll = data;
    });
    getMerk().then(({ data }) => {
      dt.merk = data;
    });
    produkService().then(({ data }) => {
      dt.produk = data;
    });
    const pilihProduk = (x) => {
      let a = dt.produk.find((s) => s.kodeProduk === x.kodeProduk);
      if (a) {
        x.kodeJenis = a.kodeJenis;
        x.pointService = a.pointService;
      }
    };
    const partner = (x) => {
      dt.cust = x;
      dt.p.kodePartner = x.kodePartner;
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
        materialCust: "",
        catatan: "",
        salesID: root.$store.state.auth.user.eID,
        estimasi: 1,
        jnsProject: "",
        detOrder: {},
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
      dt.detTrx = [];
    };
    getAll();
    const cetak = (x) => {
      dt.ctk = x;
      dt.confirm = true;
    };
    const addPt = (x) => {
      dt.ctk = { ...x };
      dt.ctk.ct = "tunai";
      dt.ctk.note = `Pembayaran Service ${x.nomorProject}`;
      dt.ctk.akunBayar = "110100001";
      dt.ctk.tempo = 0;
      dt.Project = { ...dt.Project, ...dt.ctk };
      dt.Project.analisa = JSON.parse(x.analisa) || [];
      dt.Project.aksi = JSON.parse(x.aksi) || [];
      partService(x)
        .then(({ data }) => {
          dt.detTrx = data;
          dt.adP = true;
        })
        .catch((err) => {
          root.$q.notify({ message: err.response.data.st, color: "warning" });
        });
    };
    const onpil = (x) => {
      // x.qty = 1
      if (dt.detTrx.find((a) => a.kodeProduk === x.kodeProduk)) {
        root.$q.notify({
          message: `${x.namaBarang} sudah di list...`,
          color: "warning",
        });
      } else {
        x.hargaSat = x.hargaRetail;
        /* x.jmlHarga = x.hargaRetail
        x.jmlPoint = x.pointMember * x.jmlHarga / 100 */
        x.nomorProject = dt.Project.nomorProject;
        dt.detTrx.push({ ...x });
      }
    };
    const onSave = (x) => {
      x.jmlHarga = x.qtySPK * x.hargaSat;
      x.jmlKemasan = x.qtySPK;
      x.hargaKemasan = x.hargaSat;
      x.kemasan = x.kemasan || { isi: 1, kemasan: "Pcs" };
      // simpan(x)
      /* if (dt.detTrx.find(a => a.saldo < Number(a.qty)) && x.jasa !== 'Y') {
        dt.project.status = 'Part'
        upD(dt.project, 'Part', 'Part')
      } */
    };
    const simpan = (x) => {
      addPartService(x)
        .then(({ data }) => {
          root.$q.notify({ message: data.st, color: "teal" });
          if (data.id > 0) x.idserviceKomponen = data.id;
        })
        .catch((err) => {
          root.$q.notify({ message: err.response.data.st, color: "warning" });
        });
    };
    const dele = (x) => {
      const index = dt.detTrx.indexOf(x);
      x.kodeCab = dt.Project.kodeCab;
      if (x.idserviceKomponen) {
        delDetService(x)
          .then(({ data }) => {
            root.$q.notify({ message: data.st, color: "teal" });
            partService(x).then(({ data }) => {
              dt.detTrx = data;
            });
          })
          .catch((err) => {
            root.$q.notify({ message: err.response.data.st, color: "warning" });
          });
      } else {
        dt.detTrx.splice(index, 1);
      }
    };
    const upD = (x, y, z) => {
      if (z) {
        x.status = z;
      }
      x.jnsUpdate = y || x.status;
      root.$q
        .dialog({
          html: true,
          title: `Konfirmasi project ${x.nomorProject} </br>
        <span class="text-teal" >Uang Muka ${x.uangMuka.toLocaleString()}</span>`,
          options: {
            type: "radio",
            model: "konfr",
            // inline: true
            items: [
              { label: "Approve", value: "Approve", color: "teal" },
              { label: "Batal", value: "Batal", color: "orange-7" },
              { label: "Tutup", value: "Tutup", color: "yellow" },
            ],
            isValid: (val) =>
              ["Approve", "Batal", "Tutup"].some((a) => a === val),
          },
          ok: {
            push: true,
          },
          persistent: false,
        })
        .onOk((data) => {
          if (data !== "Tutup") {
            projectApprove(x)
              .then(({ data }) => {
                root.$q.notify({ message: data.st, color: "teal" });
                getAll();
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
    const ambil = async (x, y) => {
      root.$q
        .dialog({
          title: `Konfirmasi Pengambilan ${x.nomorProject}`,
          options: {
            type: "radio",
            model: "konfr",
            // inline: true
            items: [
              { label: "Ambil", value: "Diambil", color: "yellow" },
              { label: "Tutup", value: "Tutup", color: "yellow" },
            ],
            isValid: (val) =>
              ["Closed", "Diambil", "Batal", "Tutup"].some((a) => a === val),
          },
          ok: {
            push: true,
          },
          persistent: false,
        })
        .onOk((data) => {
          if (data !== "Tutup") {
            x.status = data;
            ambilProject(x)
              .then(({ data }) => {
                root.$q.notify({ message: data.st, color: "teal" });
                getAll();
                dt.adP = false;
                onReset();
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
    const gantiByr = (x) => {
      if (x === "tempo") {
        dt.project.tempo = 14;
        dt.project.akunBayar = "110500001";
      } else {
        dt.project.tempo = 0;
        dt.project.akunBayar = "110100001";
      }
    };
    const dtRekap = computed(() => {
      let dta = [];
      if (dataProject.value.length > 0) {
        let sp = [...new Set(dataProject.value.map((x) => x.kodePartner))]; // ambil dt kode rekanan as array
        for (let i in sp) {
          // filter datPi where kode = sp[i] per grup rekanan
          let f = dataProject.value.filter((x) => x.kodePartner === sp[i]);
          let s = { ...f[0] }; // ambil value untuk rekanan
          s.biaya = f.reduce((x, y) => root.$dwn.jumlah([x, y.biaya]), 0);
          dta.push(s); // add to data array
          // tinggal add judulnya
        }
      }
      return dta;
    });
    const printA4 = async (x, y) => {
      let wd = window.open("", "SPK", "resize = 1");
      let detail = await getdetProject(x);
      // let gambar = await getSketsa(x.nomorProject)
      let dataBayar = await hisBayarProject(x);
      let dataBayara = dataBayar.data.map((s) => {
        let ss = `<li>${s.tglJurnal}: Rp ${s.nilai.toLocaleString()} melalui ${
          s.akunKas
        } sebagai ${s.judulJurnal}</li>`;
        return ss;
      });
      let html = `<html>
        <title>Invoice ${x.nomorProject}</title>
        <style>
        #tss{
          font-size: 14px;

        }
        #tss tr td{
          font-size: 14px;
        }
        .bdr_btm{
          border-bottom: 1px solid #000;
          font-size: 14px;
        }

        .bdr_top{
          border-top: 2px double #000;
          font-size: 14px;
        }
        #table_product th {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #000;
        }
        #table_product td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        p {
          text-indent: 30px;
          text-align: justify;
          text-justify: inter-word;
        }

        @media print{
          #man {
            visibility:hidden;
          }
          thead.report-header {
            display: table-header-group;
          }
          .pisah {
            page-break-after: always;
          }
          table.report.container {
            page-break-after: always;
            break-before: always;
          }
        }
        </style>
        <body style="font-size: 14px">
          <table width='100%' id="tss" class="report-container" >
            <tr>
              <td valign="top">
                <img src="/statics/logo/${
                  x.kodeCab
                }.png" alt="" style="float: left; padding: 10px;width: 90px;">
                <h3>${x.namaCabang}</h3>
                ${x.alamatCabang}
                <br>
                
                <br>
              </td>
              <td></td>
              <td></td>
              <td align="center" valign="top">
                <h3><b><u>INVOICE PENJUALAN</u></b></H3>
                <b>Nomor Project: ${x.nomorProject}</b>
                <br>
                Salatiga, ${new Date(x.tglMasuk).toLocaleString("en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </td>
            </tr>
            <tr>
              <td colspan="4" class="">
                <table width='100%' class="bdr_top">
                  <tr>
                    <td valign="top" width="20%">
                      Nama Pelanggan
                    </td>
                    <td valign="top" width="20%">: ${x.namaPartner}</td>
                    <td valign="top" width="20%"></td>
                    <td valign="top" width="10%">Email</td>
                    <td valign="top">: ${x.email}</td>
                  </tr>
                  <tr>
                    <td valign="top" width="20%">Telp</td>
                    <td valign="top" width="20%">: ${x.telpPIC}</td>
                    <td valign="top" width="20%"></td>
                    <td valign="top" width="10%">Alamat</td>
                    <td valign="top">: ${x.alamat}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td rowspan="" colspan="4" class="">
                <table width='100%' id="table_product">
                <thead class="report-header">
                  <tr>
                    <th>Deskripsi Barang</th>
                    <th width='10%' style='text-align: right'>QTY</th>
                    <th width='10%' align='right' style='text-align: right'>Harga</th>
                    <th width='10%' align='right' style='text-align: right'>Jumlah</th>
                  </tr>
                  </thead>`;
      let dtDet = "";
      detail.data.forEach((det, i) => {
        dtDet += `<tr>
          <td>${(i + 1).toString().padStart(3, " ")}. ${det.namaBarang}</td>
          <td align="right" style='text-align: right'>${new Intl.NumberFormat(
            "en"
          ).format(Number(det.qtySPK).toFixed(2))}</td>
          <td align="right" style='text-align: right'>${new Intl.NumberFormat(
            "en"
          ).format(Number(det.hargaSat).toFixed(2))}</td>
          <td align="right" style='text-align: right'>${new Intl.NumberFormat(
            "en"
          ).format(Number(det.hargaSat * det.qtySPK).toFixed(2))}</td>
        </tr>`;
      });
      let ttp = `<tr>
                    <td></td>
                    <td align='right' colspan="2" style="text-align: right"><b>Jumlah Harga</b></td>
                    <td align='right' style="border-top: double black; text-align: right"><b>${new Intl.NumberFormat(
                      "en"
                    ).format(Number(Number(x.biaya).toFixed(2)))}</b></td>
                  </tr>
              </td>
            </tr>
            <tr>
              <td colspan="4"><hr>
                List Pembayaran:
                  <ol>
                    ${dataBayara}
                  </ol>
              </td>
            </tr>
            <tr>
              <td colspan="4"><br>
                <table style="font-size:12px;" align="center" width="100%">
                  <tbody>
                    <tr>
                      <th>
                      
                      </th>
                      <th align="center">Dibuat Oleh,<br>Admin<br><br><br><br>(${
                        x.namaSales
                      })</th>
                      <th align="center"><br>Pelanggan<br><br><br><br>( &nbsp; ${
                        x.namaPartner
                      } &nbsp; )</th>
                    </tr>
                  </tbody></table>
                </td>
                </tr>
            <tr>
              <td colspan="4" >
                <div>*** Ketentuan :
                  <br>
                  ${x.catatan || ""}
                </div>
              </td>
            </tr>
        </table>
        </body>
        </html>`;
      if (typeof cordova !== "undefined") {
        cordova.plugins.printer.print(html);
      } else {
        wd.document.open();
        wd.document.write(html + dtDet + ttp);
        wd.document.close();
      }
    };
    const printW = async (x) => {
      if (x.status === "Batal") {
        printA4(x, "ambil");
      } else {
        let gambar = await getSketsa(x.nomorProject);
        let wd = window.open("", "transPrint", "resize = 1");
        let html = `<html><head>`;
        let dtPrint = `<!DOCTYPE html>
<html>
  <head>
    <style>
      th,
      td {
        border-bottom: 1px solid black;
      }
    </style>
  </head>

  <body>
    <table width="100%" style="border: 1px solid black">
      <tr>
        <th rowspan="4">
          <img
            src="/statics/logo/${x.kodeCab}.png"
            width="100px"
            height="100px"
            style="object-fit: scale-down;"
            alt=""
          />
        </th>
        <th colspan="2">Surat Perintah Kerja</th>
      </tr>
      <tr>
        <td width="40%">No Doc : </td>
        <td width="40%">No Order : ${x.nomorProject}</td>
      </tr>
      <tr>
        <td>Revisi : 00</td>
        <td>Nama Customer: ${x.namaPartner}</td>
      </tr>
      <tr>
        <td>Estimasi : ${x.estJadi}</td>
        <td>Tanggal : ${x.tglApprove || x.tglMasuk}</td>
      </tr>
    </table>
    <p><b>1. Detail Order</b></p>
    <table width="100%" style="border: 1px solid black">
      <tr>
        <th>KETERANGAN</th>
        <th>DESKRIPSI</th>
        <th>PARAF</th>
      </tr>
      <tr>
        <td>1. Asal Bahan</td>
        <td>: ${x.asalBahan}</td>
        <td rowspan="3"></td>
      </tr>
      `;
        dt.detOrder.forEach((det, i) => {
          dtPrint += `<tr>
            <td>${(i + 2).toString().padStart(3, " ")}. ${det.label}</td>
            <td >: ${x.detOrder[det.val]}</td>
            <td rowspan="${(i + 1) % 3 === 0 ? 3 : 1}"></td>
          </tr>`;
        });
        let ttp = `
    </table>
    <p><b>2. Preview Project</b></p>
    <div
      class="prev"
      style="width: 100%; height: auto; border: 1px solid black"
    >
      <img
        src="data: 'png';base64, ${gambar.data.to64}"
        alt=""
        style="
          max-width: auto;
          height: 40vh;
          display: block;
          margin-left: auto;
          margin-right: auto;
          margin-top: 10px;
          object-fit: scale-down;
        "
      />
    </div>
    <table style="border: none; margin-top:20px" width="100%">
        <tr style="border: none;">
            <th style="border: none;" width="50%">Note</td>
            <th style="border: none;"> Approval Custommer</th>
        </tr>
        <tr>
            
        </tr>
    </table>
  </body>
</html>`;
        html += dtPrint + ttp;
        if (typeof cordova !== "undefined") {
          cordova.plugins.printer.print(html);
        } else {
          wd.document.open();
          wd.document.write(html);
          wd.document.close();
        }
      }
    };
    const printWP = async (x) => {
      let { data } = await getBankCab(x.kodeCab);
      let pilih = dt.pilih.filter((s) => s.kodePartner === x.kodePartner);
      let bankCabanga = data.map((s) => {
        let ss = `<li>${s.namaBank}: ${s.rekening} a.n ${s.atasNama}</li>`;
        return ss;
      });
      let bankCabang = await bankCabanga.toString().replace(/,/g, "");
      let cabA = dt.cabAll.find((a) => a.kodeCab === x.kodeCab);
      let detail = [];
      pilih.forEach(async (a, i) => {
        let { data } = await partService(a);
        let ss = data.map((s) => {
          s.nomorBukti = a.nomorBukti;
          s.namaTeknisi = a.namaTeknisi;
          return s;
        });
        detail.push(...ss);
        if (i === pilih.length - 1) {
          let wd = window.open("", "transPrint", "resize = 1");
          let html = `<html><head>`;
          let dtPrint = `
            <title>Transaksi ${x.nomorBukti}</title>
              <style>
                  #tss{
                      font-size: 12px;
                      font-family:Courier New;
                  }
                  #tss tr td{
                      font-size: 12px;
                      font-family:Courier New;
                  }
                  .bdr_btm{
                      border-bottom: 1px dashed #000;
                      font-size: 12px;
                      font-family:Courier New;
                  }
                  @media print{
                      #man {
                          visibility:hidden;
                      }
                      thead.report-header {
                        display: table-header-group;
                      }
                      table.report.container {
                        page-break-after: always;
                      }
                  }
              </style>
              <body style="font-size: 11px">
              <table width='100%' id="tss" class="report-container">
                <thead class="report-header">
                  <tr>
                    <td colspan="3" width='60%' class="bdr_btm" valign="top">
                        <table width="100%">
                            <tr>
                                <td>
                                    <b>${cabA.namaCabang.toUpperCase()}</b>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <b>${cabA.alamatCabang}</b>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <b>${cabA.telp}</b>
                                </td>
                            </tr>
                        </table>
                    </td>
                    <td class="bdr_btm" align='right'>
                        <table width="100%" >
                            <tr>
                                <td colspan="4">
                                    <b>NOTA BIAYA SERVICE</b>
                                </td>
                            </tr>
                            <tr>
                                <td>Tanggal </td>
                                <td>: ${
                                  x.tglAmbil
                                    ? new Date(x.tglAmbil)
                                        .toLocaleString("en-GB")
                                        .slice(0, 10)
                                    : new Date().toLocaleString("en-GB")
                                }</td>
                            </tr>
                            <tr>
                                <td>Pembayaran </td>
                                <td>: ${x.namaAkunBayar || ""}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td colspan="4" class="bdr_btm">
                        <table width='100%'>
                            <tr>
                                <td width='15%'>Nama Pelanggan</td>
                                <td width='35%'>: ${x.namaPartner}</td>
                                <td width='15%'></td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Alamat</td>
                                <td rowspan="2" valign="top">: ${
                                  x.alamat || ""
                                }</td>
                                <td valign="top"></td>
                                <td rowspan="2" valign="top"></td>
                            </tr>
                            <tr>
                                <td>&nbsp;</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>No Telp</td>
                                <td>: ${x.telpPIC || ""}</td>
                                <td valign="top"></td>
                                <td></td>
                            </tr>
                        </table>
                    </td>
                  </tr>
                </thead/>
                <tbody class="report-content">
                  <tr>
                    <td colspan="4" class="bdr_btm">
                        <table width='100%'>
                          <thead class="report-header">
                            <tr>
                                <td width='3%' class="bdr_btm">No</td>
                                <td class="bdr_btm">Deskripsi Barang</td>
                                <td class="bdr_btm">Nomor Service</td>
                                <td class="bdr_btm">Nomor Invoice</td>
                                <td class="bdr_btm">Teknisi</td>
                                <td width='10%' class="bdr_btm" align='right'>QTY</td>
                                <td width='10%' class="bdr_btm" align='right'>Harga</td>
                                <td width='10%' class="bdr_btm" align='right'>Jumlah</td>
                            </tr>
                          </thead>
                          <tbody>`;
          let dtDet = "";
          detail.forEach((det, u) => {
            dtDet += `<tr>
                <td>${u + 1}</td>
                <td>${det.namaBarang}</td>
                <td>${det.nomorProject}</td>
                <td>${det.nomorBukti}</td>
                <td>${det.namaTeknisi}</td>
                <td align='right'>${new Intl.NumberFormat("en").format(
                  Number(det.qty).toFixed(2)
                )}</td>
                <td align='right'>${new Intl.NumberFormat("en").format(
                  Number(det.jmlHarga / det.qty).toFixed(2)
                )}</td>
                <td align='right'>${new Intl.NumberFormat("en").format(
                  Number(det.jmlHarga).toFixed(2)
                )}</td>
            </tr>`;
          });
          let ttp = `</tbody>
              </table>
                    </td>
                </tr>
                <tr>
                    <td colspan="4">
                        <table width='100%' >
                            <tr>
                                <td style='border : 1px dotted #000000; padding:10px' width='60%'>
                                  Pembayaran dapat dilakukan melalui:
                                  <ul>
                                    ${bankCabang}
                                  </ul>
                                  Catatan tambahan : ${x.note || ""}
                                </td>`;
          let ttpNote = `<td align="right" valign="top">
                                    <table width="100%" >
                                      <tr>
                                          <td align='right'><b>Jumlah Total</b></td>
                                          <td align='right' style="text-decoration : underline; text-decoration-style: double;"><b>${new Intl.NumberFormat(
                                            "en"
                                          ).format(
                                            Number(
                                              detail.reduce(
                                                (a, b) =>
                                                  root.$dwn.jumlah([
                                                    a,
                                                    b.jmlHarga,
                                                  ]),
                                                0
                                              )
                                            ).toFixed(2)
                                          )}</b></td>
                                      </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td colspan="4" align='center'>
                        <table width='90%' align='center'>
                            <tr>
                                <td width='33.3%' align='center'>
                                    Diambil Oleh<br/>
                                    <br/><br/><br/><br/>
                                    ${x.namaPartner}
                                </td>
                                <td width='33.3%' align='center'>
                                </td>
                                <td width='33.3%' align='center'>
                                    Di Buat Oleh<br/>
                                    <br/><br/><br/><br/>
                                    ${x.namaSales}
                                </td>
                            </tr>                        
                        </table>
                    </td>
                </tr>
              </tbody>
            </table>
            <div id=man style="border:1px solid red;background-color:silver;padding:5px;width:80%;">
                Pengaturan Printer Epson LX 310: <hr>
                <ul>
                    <li>Ukuran kertas 21 cm * 14.8 cm / A4 tanpa header dan footer</li>
                    <li>DPI 120 * 144</li>
                    <li>Cetak menggunakan browser Mozilla</li>
                </ul>
                <hr>
                <button type=button onclick='window.print();'>Cetak Nota Service</button>
            </div>`;
          html += dtPrint + dtDet + ttp + ttpNote + "</body></html>";
          if (typeof cordova !== "undefined") {
            cordova.plugins.printer.print(html);
          } else {
            wd.document.open();
            wd.document.write(html);
            wd.document.close();
          }
        }
      });
    };
    const printWr = async (x) => {
      let cabA = dt.cabAll.find((a) => a.kodeCab === x.kodeCab);
      let detail = dataProject.value.filter((a) =>
        dt.pilih.some(
          (s) =>
            s.nomorProject === a.nomorProject && a.kodePartner === x.kodePartner
        )
      );
      let wd = window.open("", "transPrint", "resize = 1");
      let html = `<html><head>`;
      let dtPrint = `
        <title>Transaksi ${x.nomorBukti}</title>
          <style>
              #tss{
                  font-size: 12px;
                  font-family:Courier New;
              }
              #tss tr td{
                  font-size: 12px;
                  font-family:Courier New;
              }
              .bdr_btm{
                  border-bottom: 1px dashed #000;
                  font-size: 12px;
                  font-family:Courier New;
              }
              @media print{
                  #man {
                      visibility:hidden;
                  }
                  thead.report-header {
                    display: table-header-group;
                  }
                  table.report.container {
                    page-break-after: always;
                  }
              }
          </style>
          <body style="font-size: 11px">
          <table width='100%' id="tss" class="report-container">
            <thead class="report-header">
              <tr>
                <td colspan="3" width='60%' class="bdr_btm" valign="top">
                    <table width="100%">
                        <tr>
                            <td>
                                <b>${cabA.namaCabang.toUpperCase()}</b>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <b>${cabA.alamatCabang}</b>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <b>${cabA.telp}</b>
                            </td>
                        </tr>
                    </table>
                </td>
                <td class="bdr_btm" align='right'>
                    <table width="100%" >
                        <tr>
                            <td colspan="4">
                                <b>TANDA TERIMA SERVICE</b>
                            </td>
                        </tr>
                        <tr>
                            <td>Tanggal </td>
                            <td>: ${new Date(x.tglMasuk)
                              .toLocaleString("en-GB")
                              .slice(0, 10)}</td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td colspan="4" class="bdr_btm">
                    <table width='100%'>
                        <tr>
                            <td width='15%'>Nama Pelanggan</td>
                            <td width='35%'>: ${x.namaPartner}</td>
                            <td width='15%'></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>Alamat</td>
                            <td rowspan="2" valign="top">: ${
                              x.alamat || ""
                            }</td>
                            <td valign="top"></td>
                            <td rowspan="2" valign="top"></td>
                        </tr>
                        <tr>
                            <td>&nbsp;</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>No Telp</td>
                            <td>: ${x.telpPIC || ""}</td>
                            <td valign="top"></td>
                            <td></td>
                        </tr>
                    </table>
                </td>
              </tr>
            </thead/>
            <tbody class="report-content">
              <tr>
                <td colspan="4" class="bdr_btm">
                    <table width='100%'>
                      <thead class="report-header">
                        <tr>
                            <td width='3%' class="bdr_btm">No</td>
                            <td class="bdr_btm">Nomor Project</td>
                            <td class="bdr_btm">Nama Produk</td>
                            <td class="bdr_btm">Nomor SN</td>
                            <td class="bdr_btm">Keluhan</td>
                            <td class="bdr_btm">Kelengkapan</td>
                        </tr>
                      </thead>
                      <tbody>`;
      let dtDet = "";
      detail.forEach((det, i) => {
        dtDet += `<tr>
            <td>${i + 1}</td>
            <td>${det.nomorProject}</td>
            <td>${det.namaBarang}</td>
            <td>${det.nomorSN}</td>
            <td>${det.keluhan}</td>
            <td>${det.kelengkapan}</td>            
        </tr>`;
      });
      let ttp = `</tbody>
          </table>
                </td>
            </tr>
            <tr>
              <td colspan="4">
                <table width='100%' >
                  <tr>
                    <td style='border : 1px dotted #000000; padding:10px' width='100%'>
                      <span style="font-size:11px">
                        Pernyataan : Saya serahkan barang tsb kepada aston, apabila dalam waktu 2 bulan belum saya ambil maka saya berikan barang tsb kepada aston
                      </span>
                    </td>`;
      let ttpNote = `<td align="right" valign="top">
                      </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
              <td colspan="4" align='center'>
                <table width='90%' align='center'>
                  <tr>
                    <td width='33.3%' align='center'>
                      Diserahkan Oleh<br/>
                      <br/><br/><br/><br/>
                      ${x.namaPIC}
                    </td>
                    <td width='33.3%' align='center'>
                    </td>
                    <td width='33.3%' align='center'>
                      Diterima Oleh<br/>
                      <br/><br/><br/><br/>
                      ${x.namaSales}
                    </td>
                  </tr>                        
                </table>
              </td>
            </tr>
            <tr>
              <td colspan="4" >
                <div>*** Ketentuan :
                  <br>
                  ${x.note || ""}
                  <p style="text-align:'center'">
                  </p>
                  <br>
                  Nama Teknisi: ${x.namaTeknisi}
                  <br>
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div id=man style="border:1px solid red;background-color:silver;padding:5px;width:80%;">
            Pengaturan Printer Epson LX 310: <hr>
            <ul>
                <li>Ukuran kertas 21 cm * 14.8 cm / A4 tanpa header dan footer</li>
                <li>DPI 120 * 144</li>
                <li>Cetak menggunakan browser Mozilla</li>
            </ul>
            <hr>
            <button type=button onclick='window.print();'>Cetak Nota Service</button>
        </div>`;
      html += dtPrint + dtDet + ttp + ttpNote + "</body></html>";
      if (typeof cordova !== "undefined") {
        cordova.plugins.printer.print(html);
      } else {
        wd.document.open();
        wd.document.write(html);
        wd.document.close();
      }
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
    const cekBiaya = (x) => {
      const ck = dt.detTrx.find((a) => a.kodeProduk === x.kodeProduk);
      if (x.repair === "Y" && !ck) {
        const biaya = {
          nomorProject: x.nomorProject,
          kodeProduk: x.kodeProduk,
          qty: 1,
          hpp: 0,
          hargaSat: x.hargaRetail,
          jmlHarga: x.hargaRetail,
          jmlPoint: (x.hargaRetail * x.pointMember) / 100,
          namaBarang: x.namaBarang,
        };
        simpan(biaya);
        dt.detTrx.push(biaya);
      } else if (x.repair === "N" && ck) {
        dt.detTrx.splice(dt.detTrx.indexOf(ck), 1);
        dele(ck);
      }
    };
    const toDown = (data, z) => {
      let cabang = dt.cabAll.find(
        (s) => s.kodeCab === dt.filt.kodeCab
      ).namaCabang;
      let y = Array.from(data);
      y.map((a, i) => {
        let c = { ...a };
        c.nom = i + 1;
        if (c.part) {
          c.part = c.part.replace(/,/gi, "r\n");
        }
        return c;
      });
      let x = {
        judul: `Data Service Cabang ${cabang} Periode ${dt.filt.tgla} s/d ${dt.filt.tglb} `,
        dt: y,
        hdr: z,
        naFile: `LapService`,
      };
      root.$dwn.toExcel(x);
    };
    const inProj = (x, y) => {
      dt.jnsInput = x;
      if (y) {
        dt.p = { ...y };
        getdetProject(y).then(({ data }) => {
          dt.detTrx = data;
          dt.adS = true;
        });
      } else {
        onReset();
        dt.adS = true;
      }
    };
    const cekBayar = (x) => {
      dt.p = { ...x };
      dt.dBy = true;
    };
    return {
      cekBayar,
      toDown,
      ...toRefs(dt),
      cekBiaya,
      filterFn,
      gantiByr,
      getAll,
      partner,
      onReset,
      cetak,
      printA4,
      printW,
      printWr,
      addPt,
      onpil,
      onSave,
      simpan,
      dele,
      upD,
      ambil,
      dtRekap,
      dataProject,
      printWP,
      filterKn,
      pilihProduk,
      inProj,
    };
  },
};
</script>
<style lang="sass" scoped>
.detTrans
  /* max height is important */
  .q-table__middle
    max-height: 600px

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th
    /* bg color is important for th; just specify one */
    background-color: #ffff

  thead tr th
    position: sticky
    z-index: 1
  thead tr:first-child th
    top: 0

  /* this is when the loading indicator appears */
  &.q-table--loading thead tr:last-child th
    /* height of all previous header rows */
    top: 48px
</style>
