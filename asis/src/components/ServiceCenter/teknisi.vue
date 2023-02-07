<template>
  <div class="col-grow">
    <q-table
      class="dataTrx"
      :data="dtServis"
      :columns="jdl"
      row-key="nomorServis"
      :filter="cari"
      :pagination.sync="hal"
      :expanded.sync="expanded"
      dense
    >
      <template v-slot:top>
        <div class="col-12 q-table__title text-h6 text-white">Data Servis</div>
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
        <q-space />
        <q-select
          v-model="filt.status"
          :options="statusService"
          multiple
          options-dense
          style="min-width: 250px; max-width: 300px"
          label="Status... "
          :rules="inRul"
          dense
          @input="getAll()"
          class="q-mr-sm"
          lazy-rules
        />
        <q-input v-model="cari" style="width: 250px" label="Cari data...">
          <template v-slot:append>
            <q-icon name="search" />
            <q-btn
              flat
              round
              dense
              icon="file_download"
              @click="toDown(dataServis, jdl)"
              class="q-ml-md"
              color="primary"
            />
          </template>
        </q-input>
        <q-select
          v-if="
            ['MAN', 'purchase', 'acc'].some(
              (a) => a == $store.state.auth.user.userType
            )
          "
          v-model="filt.kodeCab"
          :options="cabAll"
          :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
          option-value="kodeCab"
          emit-value
          map-options
          multiple
          options-dense
          style="min-width: 250px; max-width: 300px"
          label="Pilih cabang... "
          :rules="inRul"
          dense
          class="q-ml-sm"
          @input="getAll()"
          lazy-rules
        />
        <q-btn
          v-if="$store.state.auth.user.userType !== 'teknisi'"
          icon="add"
          color="pink"
          round
          @click="adS = true"
        />
      </template>
      <template v-slot:body="props">
        <q-tr
          :props="props"
          :class="
            props.row.umur > 60
              ? 'bg-red-13'
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
          >
            <template v-if="col.name === 'act'">
              <template v-if="$store.state.auth.user.userType === 'teknisi'">
                <template v-if="props.row.status === 'Baru'">
                  <q-btn
                    icon="handyman"
                    color="primary"
                    rounded
                    dense
                    outline
                    @click="upD(props.row, 'Proses', 'Proses')"
                  >
                    <q-tooltip
                      content-class="bg-purple"
                      :offset="[10, 10]"
                      anchor="center left"
                    >
                      Kerjakan
                    </q-tooltip>
                  </q-btn>
                </template>
                <template
                  v-else-if="
                    ['Proses', 'Part', 'Selesai', 'Konfirm'].some(
                      (a) => props.row.status === a
                    )
                  "
                >
                  <q-btn
                    icon="grading"
                    color="primary"
                    rounded
                    dense
                    outline
                    @click="addPt(props.row)"
                    class="q-ml-md"
                  >
                    <q-tooltip
                      content-class="bg-purple"
                      :offset="[10, 10]"
                      anchor="center left"
                    >
                      Part dan Biaya
                    </q-tooltip>
                  </q-btn>
                </template>
              </template>
              <template v-else>
                <template
                  v-if="
                    ['Proses', 'Part', 'Selesai', 'Konfirm'].some(
                      (a) => props.row.status === a
                    )
                  "
                >
                  <q-btn
                    icon="grading"
                    color="primary"
                    rounded
                    dense
                    outline
                    @click="addPt(props.row)"
                    class="q-ml-md"
                  >
                    <q-tooltip
                      content-class="bg-purple"
                      :offset="[10, 10]"
                      anchor="center left"
                    >
                      Part dan Biaya
                    </q-tooltip>
                  </q-btn>
                </template>
                <template v-if="props.row.status === 'Selesai'">
                  <q-btn
                    icon="flight_takeoff"
                    color="teal"
                    rounded
                    dense
                    outline
                    @click="addPt(props.row)"
                    class="q-ml-md"
                  >
                    <q-tooltip
                      content-class="bg-teal-13"
                      :offset="[10, 10]"
                      anchor="center left"
                    >
                      Ambil
                    </q-tooltip>
                  </q-btn>
                </template>
                <template v-else-if="props.row.status === 'Konfirm'">
                  <q-btn
                    icon="check_circle_outline"
                    dense
                    color="purple"
                    outline
                    class="q-ml-sm"
                  >
                    <q-tooltip
                      content-class="bg-teal text-bold"
                      :offset="[10, 10]"
                      anchor="center left"
                    >
                      Konfirm
                    </q-tooltip>
                  </q-btn>
                </template>
                <q-btn
                  v-if="
                    ['Baru', 'Proses', 'Selesai', 'Part'].some(
                      (a) => a === props.row.status
                    )
                  "
                  label="Konfirmasi"
                  dense
                  color="purple"
                  outline
                  class="q-ml-sm"
                >
                  <q-popup-edit
                    v-model="props.row.konfirmasi"
                    buttons
                    label-set="Simpan"
                    @save="upD(props.row, 'Konfirm', 'Konfirm')"
                  >
                    <q-input
                      v-model="props.row.konfirmasi"
                      label="Konfirmasi"
                      dense
                      autogrow
                      autofocus
                      @keyup.enter.stop
                    />
                  </q-popup-edit>
                </q-btn>
                <q-btn
                  icon="print"
                  color="warning"
                  rounded
                  dense
                  outline
                  @click="cetak(props.row)"
                  class="q-ml-md"
                />
              </template>
            </template>
            <template v-else-if="col.name === 'nom'">
              {{ props.rowIndex + 1 }}
            </template>
            <template v-else-if="col.name === 'catatanTeknisi'">
              {{ props.row.catatanTeknisi }}
              <q-popup-edit
                v-model="props.row.catatanTeknisi"
                buttons
                label-set="Simpan"
                @save="upD(props.row, 'Catatan')"
              >
                <q-input
                  v-model="props.row.catatanTeknisi"
                  dense
                  autofocus
                  @keyup.enter.stop
                  autogrow
                />
              </q-popup-edit>
            </template>
            <template v-else-if="col.name === 'namaTeknisi'">
              {{ props.row.namaTeknisi }}
              <q-popup-edit
                v-if="
                  ['MAN', 'purchase', 'acc'].some(
                    (a) => a == $store.state.auth.user.userType
                  )
                "
                v-model="props.row.teknisi"
                buttons
                label-set="Simpan"
                @save="upD(props.row, 'Teknisi')"
              >
                <q-select
                  v-model="props.row.teknisi"
                  dense
                  :options="
                    dtKar.filter((a) => a.kodeCab === props.row.kodeCab)
                  "
                  option-label="namaKaryawan"
                  option-value="kodeKar"
                  options-dense
                  map-options
                  emit-value
                />
              </q-popup-edit>
            </template>
            <template v-else-if="col.name === 'status'">
              {{ props.row.status }}
              <q-popup-edit
                v-if="props.row.status !== 'Closed'"
                v-model="props.row.status"
                buttons
                label-set="Simpan"
                @save="upD(props.row)"
              >
                <q-select
                  v-model="props.row.status"
                  dense
                  :options="statusService"
                />
              </q-popup-edit>
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
      </template>
    </q-table>
    <q-dialog v-model="adP" position="top" full-width>
      <q-card>
        <q-card-actions>
          <q-space />
          <q-btn
            round
            icon="close"
            color="red"
            class="text-right"
            v-close-popup
          />
        </q-card-actions>
        <q-card-section>
          <div class="row justify-between">
            <div class="col-12 col-md-5">
              <table>
                <tr>
                  <td colspan="3" class="text-bold text-h6">Analisa</td>
                </tr>
                <tr>
                  <td>
                    <q-list v-for="a in analisa.slice(0, 10)" :key="a" dense>
                      <q-checkbox
                        v-model="servis.analisa"
                        :val="a"
                        :label="a"
                        dense
                        @input="updTeknisi(servis)"
                        :disable="$store.state.auth.user.userType !== 'teknisi'"
                      />
                    </q-list>
                  </td>
                  <td>
                    <q-list v-for="a in analisa.slice(10, 20)" :key="a" dense>
                      <q-checkbox
                        v-model="servis.analisa"
                        :val="a"
                        :label="a"
                        dense
                        @input="updTeknisi(servis)"
                        :disable="$store.state.auth.user.userType !== 'teknisi'"
                      />
                    </q-list>
                  </td>
                  <td valign="top">
                    <q-list v-for="a in analisa.slice(20, 30)" :key="a" dense>
                      <q-checkbox
                        v-model="servis.analisa"
                        :val="a"
                        :label="a"
                        dense
                        @input="updTeknisi(servis)"
                        :disable="$store.state.auth.user.userType !== 'teknisi'"
                      />
                    </q-list>
                  </td>
                </tr>
              </table>
            </div>
            <div class="col-12 col-md-5">
              <span class="text-bold text-h6">Tindakan</span>
              <br />
              <div class="q-gutter-sm">
                <q-radio
                  v-model="servis.aksi"
                  val="repair"
                  label="Repair"
                  @input="cekBiaya(servis), updTeknisi(servis)"
                  color="teal"
                  :disable="$store.state.auth.user.userType !== 'teknisi'"
                />
                <q-radio
                  v-model="servis.aksi"
                  val="refill"
                  label="Refill"
                  color="orange"
                  @input="cekBiaya(servis), updTeknisi(servis)"
                  :disable="$store.state.auth.user.userType !== 'teknisi'"
                />
                <q-radio
                  v-model="servis.aksi"
                  val="infus"
                  label="Charging/Infus"
                  @input="cekBiaya(servis), updTeknisi(servis)"
                  color="teal"
                  :disable="$store.state.auth.user.userType !== 'teknisi'"
                />
                <q-radio
                  v-model="servis.aksi"
                  val="maintenance"
                  label="Maintenance"
                  color="cyan"
                  @input="cekBiaya(servis), updTeknisi(servis)"
                  :disable="$store.state.auth.user.userType !== 'teknisi'"
                />
              </div>
              <q-input
                type="textarea"
                v-model="servis.tindakan"
                label="Tindakan"
                label-color="orange"
                @blur="updTeknisi(servis)"
                :disable="$store.state.auth.user.userType !== 'teknisi'"
              />
              <q-input
                type="textarea"
                v-model="servis.catatanTeknisi"
                label="Catatan Teknisi"
                label-color="warning"
                @blur="updTeknisi(servis)"
                :disable="$store.state.auth.user.userType !== 'teknisi'"
              />
            </div>
          </div>
        </q-card-section>
        <!-- <q-card-actions>
          <q-space/>
          <q-btn color="primary" label="Update" @click="updTeknisi(servis)"/>
        </q-card-actions> -->
        <q-card-section>
          <q-table
            class="dataPR"
            :data="detTrx"
            :columns="jdld"
            row-key="kodeProduk"
            dense
            wrap-cells
            hide-bottom
            :pagination.sync="pg"
            separator="cell"
          >
            <template v-slot:top>
              <div
                class="fit row wrap justify-between items-start content-start"
              >
                <div class="text-h5">Biaya dan Part</div>
                <q-form
                  @submit="ambil(servis, detTrx)"
                  @reset="onReset"
                  class="q-gutter-md"
                >
                  <div
                    class="fit row wrap justify-between items-start content-start"
                  >
                    <q-chip color="blue" class="text-white"
                      >Nomor Servis: {{ servis.nomorServis }}</q-chip
                    >
                    <q-btn
                      v-if="
                        servis.status === 'Selesai' &&
                        $store.state.auth.user.userType !== 'teknisi'
                      "
                      label="Ambil"
                      class="shadow3 text-white q-ml-md"
                      dense
                      type="submit"
                      color="primary"
                    />
                    <!-- {{ servis }} -->
                    <div class="row">
                      <q-select
                        v-if="servis.status !== 'Closed'"
                        label="Status"
                        v-model="servis.status"
                        :options="[
                          'Proses',
                          'Part',
                          'Konfirm',
                          'Selesai',
                          'Batal',
                          'Batal & Diambil',
                        ]"
                        class="q-ml-md text-bold"
                        style="width: 250px"
                        color="primary"
                        @input="upD(servis, servis.status, servis.status)"
                      />
                    </div>
                    <q-chip
                      color="primary"
                      outline
                      class="text-white text-bold"
                    >
                      {{ servis.status }}</q-chip
                    >
                    <q-btn
                      icon="add"
                      color="pink"
                      rounded
                      @click="stk = true"
                      label="Add Part"
                    />
                  </div>
                </q-form>
              </div>
            </template>
            <template v-slot:body="props">
              <q-tr>
                <q-td auto-width>{{ props.rowIndex + 1 }}</q-td>
                <q-td>{{ props.row.kodeProduk }}</q-td>
                <q-td>{{ props.row.namaBarang }}</q-td>
                <q-td align="right">{{ props.row.saldo }}</q-td>
                <q-td align="right"
                  >{{ props.row.qty }}
                  <q-popup-edit
                    v-model="props.row.qty"
                    @save="onSave(props.row)"
                  >
                    <q-input v-model="props.row.qty" dense autofocus counter />
                  </q-popup-edit>
                </q-td>
                <q-td>
                  <!-- <q-btn icon="save" color="teal" rounded dense outline @click="simpan(props.row)"/> -->
                  <q-btn
                    icon="close"
                    color="pink"
                    rounded
                    dense
                    outline
                    @click="dele(props.row)"
                  />
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
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
  </div>
</template>

<script>
import { reactive, toRefs } from "@vue/composition-api";
import {
  addPartService,
  dataServis,
  delDetService,
  getJnsService,
  partService,
  serviceNotif,
  updServis,
  upServis,
} from "../../services/apiList";
import dataStok from "../../components/stokSatu";
export default {
  components: {
    dataStok,
  },
  setup(props, { root }) {
    const dt = reactive({
      cari: "",
      expanded: [],
      dtServis: [],
      inRul: [(v) => !!v || "Isi data"],
      jdl: [
        { name: "nom", label: "No", align: "left" },
        {
          name: "kodeCab",
          label: "Cabang",
          field: (row) => row.kodeCab,
          align: "left",
        },
        {
          name: "nomorServis",
          label: "Nomor Servis",
          field: (row) => row.nomorServis,
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
          name: "namaBarang",
          label: "Nama Produk",
          field: (row) => row.namaBarang,
          sortable: true,
          align: "left",
        },
        {
          name: "nomorSN",
          label: "Nomor SN",
          field: (row) => row.nomorSN,
          align: "left",
        },
        {
          name: "keluhan",
          label: "Keluhan",
          field: (row) => row.keluhan,
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
          name: "tglSelesai",
          label: "Tanggal Selesai",
          field: (row) => row.tglSelesai,
          sortable: true,
          align: "left",
        },
        {
          name: "pencapaian",
          label: "Pencapaian",
          field: (row) => row.pencapaian,
          sortable: true,
          jml: "Y",
          align: "right",
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
      hal: { rowsPerPage: 10 },
      adS: false,
      filt: {
        kodeCab: [root.$store.state.auth.user.kodeCab],
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
      analisa: [
        "Adaptor",
        "Cartridge",
        "Detektor chip",
        "Ink refill",
        "Main board",
        "Motor/Dinamo",
        "Pasang infus",
        "Print head",
        "Roll",
        "Scaner laser",
        "Sensor encorder disc",
        "Sensor solenoid",
        "Timing belt",
        "Cariage PCB assy",
        "Detector sensor",
        "Engine/Mekanik",
        "Kabel flexible",
        "Maintenance unit",
        "Panel",
        "Pemanas",
        "Reset software",
        "Rumah Catridge",
        "Scaner unit-ADF",
        "Sensor encorder line",
        "service infus",
        "Upgrade software",
      ],
      servis: {
        analisa: [],
        aksi: "repair",
        tindakan: "",
        catatanTeknisi: "",
        repair: false,
        refill: false,
        maintenance: false,
      },
      statusService: [
        "Baru",
        "Konfirm",
        "Proses",
        "Part",
        "Selesai",
        "Closed",
        "Batal",
      ],
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
          name: "qty",
          label: "Qty",
          field: (row) => row.qty,
          jml: "Y",
          align: "right",
        },
        { name: "act", label: "Act" },
      ],
      adP: false,
      pg: { rowsPerPage: 0 },
      stk: false,
      jnsService: [],
    });
    getJnsService().then(({ data }) => {
      dt.jnsService = data;
    });
    const getAll = () => {
      dt.filt.tgla = dt.tgl && dt.tgl.from ? dt.tgl.from : dt.tgl || new Date();
      dt.filt.tglb = dt.tgl && dt.tgl.from ? dt.tgl.to : dt.tgl || new Date();
      // dt.filt.kodeCab = !dt.filt.kodeCab[0] ? null : dt.filt.kodeCab
      dataServis(dt.filt).then(({ data }) => {
        dt.dtServis = data;
      });
    };
    const addPt = (x) => {
      dt.ctk = { ...x };
      dt.ctk.ct = "tunai";
      dt.ctk.note = `Pembayaran Service ${x.nomorServis}`;
      dt.ctk.akunBayar = "110100001";
      dt.ctk.tempo = 0;
      dt.servis = { ...dt.servis, ...dt.ctk };
      dt.servis.analisa = JSON.parse(x.analisa) || [];
      dt.servis.aksi = x.aksi;
      partService(x)
        .then(({ data }) => {
          dt.detTrx = data;
          dt.adP = true;
        })
        .catch((err) => {
          root.$q.notify({ message: err.response.data.st, color: "warning" });
        });
    };
    const onReset = () => {
      dt.servis = {
        analisa: [],
        aksi: "repair",
        tindakan: "",
        catatanTeknisi: "",
        repair: false,
        refill: false,
        maintenance: false,
      };
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
      x.kodeCab = dt.servis.kodeCab;
      root.$q
        .dialog({
          title: "Hapus Biaya ?",
          message: `Nama Barang<span class="text-pink"> ${x.namaBarang}</span>`,
          options: {
            type: "radio",
            model: "hps",
            // inline: true
            items: [{ label: `Ya`, value: "All", color: "secondary" }],
          },
          cancel: true,
          html: true,
          persistent: true,
        })
        .onOk((data) => {
          if (data === "All") {
            if (x.idserviceKomponen) {
              delDetService(x)
                .then(({ data }) => {
                  root.$q.notify({ message: data.st, color: "teal" });
                  partService(x).then(({ data }) => {
                    dt.detTrx = data;
                  });
                })
                .catch((err) => {
                  root.$q.notify({
                    message: err.response.data.st,
                    color: "warning",
                  });
                });
            } else {
              dt.detTrx.splice(index, 1);
            }
          }
        });
    };
    const upD = (x, y, z) => {
      root.$q
        .dialog({
          title: `Update Nomor Servis : ${x.nomorServis} Status ${
            z || x.status
          }<br><span class="text-accent text-italic"> Telp PIC: ${
            x.telpPIC || x.tlp
          }</span>`,
          message: "",
          options: {
            type: "checkbox",
            model: ["T"],
            // inline: true
            items: [
              { label: "Ya", value: "Y", color: "secondary" },
              { label: "Batal", value: "B", color: "red" },
              { label: "Notif WA", value: "W", color: "teal" },
            ],
            isValid: (val) => {
              let ss = val.filter((v) => v === "Y" || v === "B");
              return ss.length === 1 && true;
            },
          },
          ok: {
            push: true,
          },
          html: true,
          persistent: false,
        })
        .onOk((data) => {
          console.log("data");
          if (z) {
            x.status = z;
          }
          x.jnsUpdate = y || x.status;
          upServis(x)
            .then(({ data }) => {
              console.log("succses");
              root.$q.notify({ message: data.st, color: "teal" });
              getAll();
            })
            .catch((err) => {
              console.log("error");
              root.$q.notify({
                message: err.response.data.st,
                color: "warning",
              });
            });
          if (
            ["Proses", "Konfirm", "Selesai"].includes(y) &&
            data.some((a) => a === "W")
          ) {
            serviceNotif(x)
              .then(({ data }) => {
                console.log(data);
                root.$q.notify({ message: data.st, color: data.color });
              })
              .catch((err) => {
                root.$q.notify({ message: "WA Error...", color: "warning" });
              });
          }
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
        x.nomorServis = dt.servis.nomorServis;
        dt.detTrx.push({ ...x });
      }
    };
    const onSave = (x) => {
      x.jmlHarga = x.qty * x.hargaSat;
      x.jmlKemasan = x.qty;
      x.hargaKemasan = x.hargaSat;
      x.kemasan = { isi: 1, kemasan: "Pcs" };
      x.jmlPoint =
        dt.servis.point === "Y" ? (x.pointMember * x.jmlHarga) / 100 : 0;
      simpan(x);
      if (dt.detTrx.filter((a) => a.saldo < a.qty) && x.jasa !== "Y") {
        dt.servis.status = "Part";
        upD(dt.servis, "Part", "Part");
      }
    };
    const updTeknisi = (x) => {
      if (root.$store.state.auth.user.userType !== "teknisi") {
        root.$q.notify({
          message: "Hanya teknisi yang bisa update...",
          color: "warning",
        });
      } else {
        const y = { ...x };
        y.nomorServis = dt.servis.nomorServis;
        y.analisa = JSON.stringify(x.analisa);
        y.pointTeknisi = dt.jnsService.find((a) => a.kodeJenis === x.kodeJenis)[
          x.aksi
        ];
        updServis(y)
          .then(({ data }) => {
            root.$q.notify({ message: data.st, color: "teal" });
            getAll();
            // dt.adP = false
            // onReset()
          })
          .catch((err) => {
            root.$q.notify({ message: err.response.data.st, color: "warning" });
          });
      }
    };
    const cekBiaya = (x) => {
      const ck = dt.detTrx.find((a) => a.kodeProduk === x.kodeProduk);
      if (x.aksi === "repair" && !ck) {
        const biaya = {
          nomorServis: x.nomorServis,
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
      } else if (ck && x.aksi !== "repair") {
        // dt.detTrx.splice(dt.detTrx.indexOf(ck), 1)
        dele(ck);
      }
    };
    getAll();
    return {
      ...toRefs(dt),
      getAll,
      addPt,
      onReset,
      onpil,
      onSave,
      dele,
      upD,
      simpan,
      updTeknisi,
      cekBiaya,
    };
  },
};
</script>
