<template>
  <q-card>
    <q-card-section>
      <!-- {{ allReport }} -->
      <!-- {{ jdld }} -->
      <q-table
        class="detTrx"
        title="Sales Report"
        :data="rekapSls ? perSales : dtSales"
        :columns="jdl"
        :filter="cari"
        :pagination.sync="halaman"
        grid
        hide-header
        hide-bottom
      >
        <template v-slot:top>
          <q-chip color="blue-6" class="text-white text-bold shadow-3" clickable
            >Periode : {{ tgl && tgl.from ? tgl.from + " ~ " + tgl.to : tgl }}
            <q-popup-proxy
              ref="qDateProxy"
              transition-show="scale"
              transition-hide="scale"
            >
              <q-date
                range
                v-model="tgl"
                @input="(x) => x && (lihat(), $refs.qDateProxy.hide())"
                mask="YYYY-MM-DD"
                lazy-rules
              />
            </q-popup-proxy>
          </q-chip>
          <q-select
            class="q-ml-sm"
            v-if="
              ['MAN', 'acc', 'purchase', 'mitra', 'admin'].some(
                (a) => a == $store.state.auth.user.userType
              )
            "
            v-model="divisi"
            :options="dtComp"
            :option-label="
              (item) => item && item.compCode + ' ' + item.compName
            "
            option-value="compCode"
            emit-value
            map-options
            style="min-width: 250px; max-width: 250px"
            label="Divisi... "
            @input="gantiCab"
            dense
            lazy-rules
          />
          <q-select
            class="q-ml-sm"
            v-if="
              ['MAN', 'acc', 'purchase', 'mitra', 'admin'].some(
                (a) => a == $store.state.auth.user.userType
              )
            "
            v-model="filt.kodeCab"
            :options="cabAll.filter((a) => divisi === a.compCode)"
            :option-label="
              (item) => item && item.kodeCab + ' ' + item.namaCabang
            "
            option-value="kodeCab"
            option-dense
            emit-value
            map-options
            multiple
            style="min-width: 250px; max-width: 550px"
            label="Pilih cabang... "
            dense
            @input="lihat()"
            lazy-rules
          >
            <template v-slot:option="scope">
              <q-item dense v-bind="scope.itemProps" v-on="scope.itemEvents">
                <q-item-section>
                  <q-item-label>
                    {{ scope.opt.kodeCab }} {{ scope.opt.namaCabang }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-checkbox
                    v-model="filt.kodeCab"
                    :val="scope.opt.kodeCab"
                    @input="lihat()"
                  />
                </q-item-section>
              </q-item>
            </template>
            <template v-slot:selected>
              {{ filt.kodeCab.length }} cabang
            </template>
          </q-select>
          <q-toggle
            v-model="filt.allCab"
            label="Pilih semua..."
            @input="gantiCab(filt.allCab)"
          />
          <q-toggle v-model="filt.ancab" label="Antar Cabang" @input="lihat" />
        </template>
        <template v-slot:item="props">
          <div
            class="q-pa-xs col-xs-12 col-sm-6 col-md-4 col-lg-3 grid-style-transition"
          >
            <q-card>
              <q-card-section
                :style="`background: linear-gradient(to right, transparent,rgba(${
                  200 - (props.row.jmlHarga / total.jmlHarga) * 225
                },${(props.row.jmlHarga / total.jmlHarga) * 255},${
                  (props.row.jmlHarga / total.jmlHarga) * 125 + 200
                },0.8))`"
              >
                <q-chip>{{ props.row.namaKaryawan }}</q-chip>
              </q-card-section>
              <q-separator />
              <q-list dense>
                <q-item
                  v-for="col in props.cols.filter(
                    (col) => col.name !== 'namaKaryawan'
                  )"
                  :key="col.name"
                >
                  <q-item-section>
                    <q-item-label>{{ col.label }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label caption>
                      <template v-if="col.jml === 'Y'">
                        <q-chip outline color="primary">{{
                          col.value | duit
                        }}</q-chip>
                      </template>
                      <template v-else>{{ col.value }}</template>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>
        </template>
      </q-table>
    </q-card-section>

    <q-card-section>
      <q-table
        :grid="$q.screen.lt.md"
        title="Report kinerja Operator"
        :data="allTransaksi"
        :columns="jdlrb"
        :filter="carid"
        dense
        row-key="idproject"
        :hide-header="$q.screen.lt.md"
      >
        <template v-slot:top-right>
          <q-input
            borderless
            dense
            debounce="300"
            v-model="carid"
            placeholder="Search"
          >
            <template v-slot:append>
              <q-icon name="search" />
              <q-btn
                flat
                round
                dense
                icon="file_download"
                @click="toDown(allReport, fieldReport)"
                class="q-ml-md"
                color="primary"
              />
            </template>
          </q-input>
        </template>
        <template v-slot:body="props">
          <q-tr :props="props" :key="`m_${props.row.nomorProject}`">
            <q-td v-for="col in props.cols" :key="col.name" :props="props">
              <template v-if="col.name === 'nomorProject'">
                <q-toggle
                  v-model="props.expand"
                  checked-icon="add"
                  unchecked-icon="remove"
                />
                {{ col.value }}
              </template>
              <template v-else-if="col.jml === 'Y'">{{
                col.value | duit
              }}</template>
              <template v-else>{{ col.value }}</template>
            </q-td>
          </q-tr>
          <q-tr
            v-show="props.expand"
            :props="props"
            :key="`e_${props.row.idproject}`"
            class="q-virtual-scroll--with-prev"
          >
            <q-td colspan="100%">
              <q-table
                class="detTrx"
                table-header-class="bg-red-9 text-white"
                :data="
                  dtTransaksi.filter(
                    (a) => a.nomorProject === props.row.nomorProject
                  )
                "
                :columns="jdld"
                separator="cell"
                dense
              >
                <template v-slot:body="props">
                  <!-- {{props.row.logProses}} -->
                  <q-tr>
                    <q-td
                      v-for="col in props.cols"
                      :key="col.name"
                      :props="props"
                    >
                      <template v-if="col.name === 'note'">
                        <q-expansion-item dense label="catatan">
                          <q-card>
                            <q-card-section>
                              <q-table
                                title=" "
                                :data="JSON.parse(props.row.logProses)"
                                :columns="dtcolumns"
                                row-key="name"
                              >
                                <template v-slot:body="props">
                                  <q-tr>
                                    <q-td
                                      v-for="col in props.cols"
                                      :key="col.name"
                                      :props="props"
                                    >
                                      <template>
                                        {{ col.value }}
                                      </template>
                                    </q-td>
                                  </q-tr>
                                </template>
                              </q-table>
                            </q-card-section>
                          </q-card>
                        </q-expansion-item>
                        {{ col.value }}
                      </template>
                      <template v-else>{{ col.value }}</template>
                    </q-td>
                  </q-tr>
                </template>
              </q-table>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card-section>
    <q-card-section> </q-card-section>
  </q-card>
</template>

<script>
import {
  rkpAllsales,
  dtCab,
  rkpTransaksi,
  company,
  getDataProject,
  getDetproj,
  allDataProject,
  getLapProject,
} from "../../services/apiList";
import {
  reactive,
  toRefs,
  watch,
  onMounted,
  computed,
} from "@vue/composition-api";
export default {
  setup(props, { root, emit }) {
    const dt = reactive({
      sales: [],
      dtSales: [],
      jdlrb: [
        {
          name: "nomorProject",
          label: "Nomor Project",
          field: (row) => row.nomorProject,
          align: "left",
        },
        {
          name: "tglMasuk",
          label: "Tanggal masuk",
          field: (row) =>
            new Date(row.tglMasuk)
              .toLocaleString("sv", { timeZoneName: "short" })
              .slice(0, 10),
          align: "left",
        },
        {
          name: "namaCabang",
          label: "Nama Cabang",
          field: (row) => row.namaCabang,
          align: "right",
        },
        {
          name: "uangMuka",
          label: "Uang muka",
          field: (row) => row.uangMuka,
          jml: "Y",
          align: "right",
        },
        {
          name: "catatan",
          label: "Catatan",
          field: (row) => row.catatan,
          align: "right",
        },
        {
          name: "estJadi",
          label: "Estimasi jadi",
          field: (row) =>
            new Date(row.estJadi)
              .toLocaleString("sv", { timeZoneName: "short" })
              .slice(0, 10),
          sortable: true,
          align: "right",
        },
      ],
      dtcolumns: [
        {
          name: "mulai",
          label: "Mulai",
          field: (row) => row.mulai,
          align: "left",
        },
        {
          name: "selesai",
          label: "Selesai",
          field: (row) => row.selesai,
          align: "left",
        },
        {
          name: "status",
          label: "Hasil bagus",
          field: (row) => row.Baik,
          align: "right",
        },
        {
          name: "sisa",
          label: "Terbuang",
          field: (row) => row.Sisa,
          jml: "Y",
          align: "right",
        },
        {
          name: "reject",
          label: "Reject",
          field: (row) => row.Reject,
          jml: "Y",
          align: "right",
        },
        {
          name: "baik",
          label: "Note",
          field: (row) => row.note,
          jml: "Y",
          sortable: true,
          align: "right",
        },
        {
          name: "mesin",
          label: "Mesin",
          field: (row) => row.mesin,
          jml: "Y",
          sortable: true,
          align: "right",
        },
        {
          name: "waktu",
          label: "Waktu(menit)",
          field: (row) =>
            Math.abs(new Date(row.selesai) - new Date(row.mulai)) / 60000,
          jml: "Y",
          sortable: true,
          align: "right",
        },
      ],
      filt: {
        kodeCab: [],
        tgla:
          new Date()
            .toLocaleString("sv", { timeZoneName: "short" })
            .slice(0, 8) + "01",
        tglb: new Date()
          .toLocaleString("sv", { timeZoneName: "short" })
          .slice(0, 10),
        allCab: false,
        ancab: true,
        grupBy: "salesID",
      },
      cari: "",
      defaultShowSettings: true,
      isDataLoading: false,
      cabAll: [],
      rekapSls: true,
      allTransaksi: [],
      allReport: [],
      dtTransaksi: [],
      jdld: [
        {
          name: "operator",
          label: "User",
          field: (row) => row.operator,
          sortable: true,
          align: "left",
        },
        {
          name: "jnsProses",
          label: "Jenis Proses",
          field: (row) => row.jnsProses,
          sortable: true,
          align: "left",
        },
        {
          name: "hasilBagus",
          label: "Hasil bagus",
          field: (row) => row.hasilBagus,
          sortable: true,
          align: "left",
        },
        {
          name: "hasilJelek",
          label: "Reject",
          field: (row) => row.hasilJelek,
          sortable: true,
          align: "left",
        },
        {
          name: "sisa",
          label: "Terbuang",
          field: (row) => row.sisa,
          sortable: true,
          align: "left",
        },
        {
          name: "note",
          label: "Note",
          field: "",
          sortable: true,
          align: "left",
        },
        {
          name: "tglStart",
          label: "Start",
          field: (row) =>
            new Date(row.tglStart)
              .toLocaleString("sv", { timeZoneName: "short" })
              .slice(0, 10),
          sortable: true,
          align: "left",
        },
        {
          name: "tglFinish",
          label: "Finish",
          field: (row) =>
            new Date(row.tglFinish)
              .toLocaleString("sv", { timeZoneName: "short" })
              .slice(0, 10),
          sortable: true,
          align: "left",
        },
        {
          name: "mesin",
          label: "Mesin yang digunakan",
          field: (row) => row.mesin,
          sortable: true,
          align: "left",
        },
      ],
      fieldReport: [
        {
          name: "nomorProject",
          label: "Nomor Project",
          field: (row) => row.nomorProject,
        },
        {
          name: "operator",
          label: "Operator",
          field: (row) => row.operator,
        },
        {
          name: "mesin",
          label: "Mesin",
          field: (row) => row.mesin,
        },
        {
          name: "hasilBagus",
          label: "Hasil Bagus",
          field: (row) => row.hasilBagus,
        },
        {
          name: "hasilJelek",
          label: "Hasil Jelek",
          field: (row) => row.hasilJelek,
        },
        {
          name: "sisa",
          label: "Terbuang",
          field: (row) => row.sisa,
        },
        {
          name: "totalWaktu",
          label: "Jam",
          field: (row) => row.totalWaktu,
        },
      ],
      carid: "",
      halaman: { rowsPerPage: 0, sortBy: "jmlHarga", descending: true },
      divCab: [],
      divisi: "",
      dtComp: [],
      tgl: {
        from:
          new Date()
            .toLocaleString("sv", { timeZoneName: "short" })
            .slice(0, 8) + "01",
        to: new Date()
          .toLocaleString("sv", { timeZoneName: "short" })
          .slice(0, 10),
      },
      jdlrk: [
        { name: "No", label: "No", field: (row) => row.No, align: "left" },
        {
          name: "nama",
          label: "Nama",
          field: (row) => row.nama,
          align: "left",
          sortable: true,
        },
        {
          name: "qty",
          label: "Qty Sales",
          field: (row) => row.qty,
          jml: "Y",
          align: "right",
          sortable: true,
        },
        {
          name: "jmlHarga",
          label: "Jumlah Harga",
          field: (row) => row.jmlHarga,
          sortable: true,
          jml: "Y",
          align: "right",
        },
      ],
      jnsRkp: "namaCust",
      pilJnsRkp: [
        { text: "Partner", value: "namaCust", name: "namaCust" },
        {
          text: "Kategori Produk",
          value: "kategoriProduk",
          name: "kategoriProduk",
        },
        { text: "Produk", value: "kodeProduk", name: "namaBarang" },
      ],
      jnsRkpSales: "salesID",
      carik: "",
      pilJnsRkpSales: [
        { text: "Sales", value: "salesID", name: "namaKaryawan" },
        { text: "Kategori Produk", value: "kodeCat", name: "kategoriProduk" },
        { text: "Produk", value: "kodeProduk", name: "namaBarang" },
      ],
      filtBy: { text: "Partner", value: "namaCust", name: "namaCust" },
    });
    const dataSales = computed(() => {
      let grupBy = dt.jnsRkpSales;
      let filt = dt.pilJnsRkpSales.find((s) => s.value === grupBy);
      let perBy = [...new Set(dt.dtSales.map((a) => a[grupBy]))];
      let data = [];
      if (dt.dtSales.length) {
        for (let i in perBy) {
          let s = {
            namaCabang:
              dt.dtSales.filter((a) => a[grupBy] === perBy[i])[0].namaCabang ||
              "",
            qty: dt.dtSales
              .filter((a) => a[grupBy] === perBy[i])
              .reduce((c, d) => root.$dwn.jumlah([c, d.qty]), 0),
            jmlHarga: dt.dtSales
              .filter((a) => a[grupBy] === perBy[i])
              .reduce((c, d) => root.$dwn.jumlah([c, d.jmlHarga]), 0),
            hpp: dt.dtSales
              .filter((a) => a[grupBy] === perBy[i])
              .reduce((c, d) => root.$dwn.jumlah([c, d.hpp]), 0),
            pointMember: dt.dtSales
              .filter((a) => a[grupBy] === perBy[i])
              .reduce((c, d) => root.$dwn.jumlah([c, d.pointMember]), 0),
            nilaiPencapaian: dt.dtSales
              .filter((a) => a[grupBy] === perBy[i])
              .reduce((c, d) => root.$dwn.jumlah([c, d.nilaiPencapaian]), 0),
            qtyP: dt.dtSales
              .filter((a) => a[grupBy] === perBy[i])
              .reduce((c, d) => root.$dwn.jumlah([c, d.qtyP]), 0),
            jmlHargaP: dt.dtSales
              .filter((a) => a[grupBy] === perBy[i])
              .reduce((c, d) => root.$dwn.jumlah([c, d.jmlHargaP]), 0),
            laba: dt.dtSales
              .filter((a) => a[grupBy] === perBy[i])
              .reduce((c, d) => root.$dwn.jumlah([c, d.laba]), 0),
            nama: dt.dtSales.find((a) => a[grupBy] === perBy[i])[filt.name],
          };
          data.push(s);
        }
      }
      return data;
    });
    const rekapBy = computed(() => {
      let filt = dt.filtBy;

      let a = [];
      a.push({ msg: "aaa" });

      return a;
    });
    watch(
      () => dt.jnsRkp,
      (val) => {
        dt.filtBy = dt.pilJnsRkp.find((a) => a.value === val);
      }
    );
    // const detailTrx = () => {
    //   dt.allTransaksi = []
    //   let ss = ['MAN', 'acc', 'purchase', 'mitra'].some(a => a === root.$store.state.auth.user.userType)
    //   if (dt.filt.kodeCab.length || !ss) {
    //     dt.filt.jnsTrx = 'J'
    //     rkpTransaksi(dt.filt)
    //       .then(({ data }) => {
    //         dt.allTransaksi = data.filter(a => dt.filt.kodeCab.some(s => s === a.asal)).map(a => {
    //           a.hpp = ['MAN', 'acc', 'purchase', 'mitra'].some(a => a === root.$store.state.auth.user.userType) ? a.hpp : 0
    //           a.laba = ['MAN', 'acc', 'purchase', 'mitra'].some(a => a === root.$store.state.auth.user.userType) ? root.$dwn.jumlah([a.jmlHarga, -a.jmlHargaR, a.hppR, -a.hpp, -a.pointMember]) : 0
    //           return a
    //         })
    //       })
    //       .catch(err => {
    //         console.log(err)
    //       })
    // //   }
    // }
    const rekap = () => {
      dt.dtSales = [];
      // let ss = ['MAN', 'acc', 'purchase'].some(a => a === root.$store.state.auth.user.userType)
      if (dt.filt.kodeCab.length) {
        let user = root.$store.state.auth.user;
        rkpAllsales(dt.filt)
          .then((res) => {
            let dta = ["MAN", "acc", "purchase", "mitra", "admin"].some(
              (a) => a === root.$store.state.auth.user.userType
            )
              ? res.data
              : res.data.filter((a) => a.salesID === user.eID.toString());
            dt.dtSales = dta.map((a) => {
              a.hpp = ["MAN", "acc", "purchase", "mitra"].some(
                (a) => a === root.$store.state.auth.user.userType
              )
                ? a.hpp
                : 0;
              a.laba = ["MAN", "acc", "purchase", "mitra"].some(
                (a) => a === root.$store.state.auth.user.userType
              )
                ? root.$dwn.jumlah([a.jmlHarga, -a.hpp, -a.pointMember])
                : 0;
              return a;
            });
          })
          .catch((err) => {
            console.log(err);
          });
      }
    };
    watch(
      () => dt.jnsRkpSales,
      (val) => {
        dt.filt.grupBy = val;
        // let filtBy = dt.pilJnsRkpSales.find(a => a.value === val)
        // dt.jdl[0] = { name: filtBy.name, label: filtBy.text, field: row => row[filtBy.value], align: 'left' }
        rekap();
      }
    );
    const toDown = (y, z, a) => {
      if (a) {
        z[0].name = dt.pilJnsRkpSales.find((s) => s.value === a).name;
      }
      console.log(y);
      let x = {
        judul: `Laporan Penjualan `,
        dt: y.map((a, i) => {
          a.No = i + 1;
          return a;
        }),
        hdr: z,
        naFile: `LapPenjualan`,
      };
      root.$dwn.toExcel(x);
    };
    const lihat = () => {
      dt.filt.tgla = dt.tgl && dt.tgl.from ? dt.tgl.from : dt.tgl || new Date();
      dt.filt.tglb = dt.tgl && dt.tgl.from ? dt.tgl.to : dt.tgl || new Date();
      getAllProject(dt.filt);
      getAllReport(dt.filt);

      // detailTrx()
      // rekap()
    };
    const gantiCab = (x) => {
      dt.filt.kodeCab = [];
      if (x === true) {
        dt.filt.kodeCab = dt.cabAll
          .filter((a) => dt.divisi === a.compCode)
          .map((a) => a.kodeCab);
        dt.filt.allCab = true;
        lihat();
      } else {
        dt.filt.kodeCab = [];
        dt.filt.allCab = false;
        // dt.divisi = []
      }
      // dt.filt.kodeCab = x ? dt.cabAll.filter(s => s.kodeCab !== 'AM01').map(a => a.kodeCab) : [root.$store.state.auth.user.kodeCab]
    };
    watch(
      () => root.$store.state.auth.setCabang,
      (val) => {
        dt.filt.kodeCab = [val];
        lihat();
      }
    );
    onMounted(() => {
      company().then(({ data }) => {
        dt.dtComp = data;
      });
      dtCab()
        .then(({ data }) => {
          const pegang = root.$store.state.auth.user.cabGrup;
          dt.cabAll = data.filter((a) => pegang.some((s) => s === a.kodeCab));
          // dt.cabAll = data.filter(a => JSON.parse(pegang).some(s => s == a.kodeCab))
          let st = new Set(dt.cabAll.map((a) => a.compCode));
          dt.divisi = ""; // [...st]
          dt.divCab = dt.dtComp.filter((a) => st.has(a.compCode));
          // dt.filt.kodeCab = dt.cabAll.map(a => a.kodeCab)
          lihat();
        })
        .catch((err) => {
          console.log(err);
        });

      getDetproj()
        .then(({ data }) => {
          dt.dtTransaksi = data;
        })
        .catch((err) => {
          console.log(err);
        });
    });
    const getAllProject = (x) => {
      getDataProject(x).then(({ data }) => {
        dt.allTransaksi = data;
      });
    };
    const getAllReport = (x) => {
      getLapProject(x).then(({ data }) => {
        dt.allReport = data;
      });
    };

    return {
      ...toRefs(dt),
      gantiCab,
      toDown,
      lihat,
      rekapBy,
      dataSales,
      getAllProject,
      getAllReport,
    };
  },
  computed: {
    rkpSales() {
      return dt.allTransaksi;
    },

    total() {
      let b = this.rekapSls ? this.perSales : this.dtSales;
      let a = {
        jmlHarga: b.reduce((x, y) => this.$dwn.jumlah([x, y.jmlHarga]), 0),
        target: 120000000,
      };
      return a;
    },
    cabAsi() {
      return this.cabAll.filter((a) =>
        this.$store.state.auth.user.cabGrup.some((s) => s === a.kodeCab)
      );
    },
  },
};
</script>
<style>
/* @import 'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css';*/
table table-bordered {
  border: 1px solid teal;
}
</style>
