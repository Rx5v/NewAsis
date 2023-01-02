<template>
  <div>
    <q-table
      class="dataTrx"
      :data="dtBOM"
      :columns="jdl"
      row-key="kodeBOM"
      :filter="cari"
      dense
    >
      <template v-slot:top>
        <div class="col-2 q-table__title">Data BOM Produk</div>        
        <q-input
          dense
          debounce="300"
          v-model="cari"
          placeholder="Search"
          class="q-ml-sm"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-btn
          flat
          round
          dense
          icon="add_circle"
          color="accent"
          @click="adP = true"
          class="q-ml-md"
        />
      </template>
      <template v-slot:body-cell-No="props">
        <q-td auto-width>{{ dtBOM.indexOf(props.row) + 1 }}</q-td>
      </template>
      <template v-slot:body-cell-act="props">
        <q-td auto-width>
          <q-btn color="teal" dense label="Lihat" @click="lihat(props.row)" />
          <q-btn
            color="deep-orange"
            dense
            label="Rakit"
            @click="adProd(props.row)"
          />
        </q-td>
      </template>
    </q-table>
    <q-dialog v-model="adP" full-width>
      <q-card>
        <q-card-section>
          <div class="text-h6">Build Of Material</div>
          {{ detBom }}
        </q-card-section>
        <q-card-section>
          <q-form @submit="addBOM()" @reset="onReset" class="q-gutter-md">
            <q-table
              class="detPR"
              :data="detBom"
              :columns="jdld"
              row-key="kodeBahan"
              dense
            >
              <template v-slot:top>
                <div class="col-4 q-table__title">Detail BOM</div>
                <q-chip outline @click="adBJ = true"
                  >Barang Jadi : {{ pr.namaBarang }}
                </q-chip>
                <q-btn
                  flat
                  round
                  dense
                  icon="add_circle"
                  @click="adBJ = true"
                  class="q-ml-md"
                  color="accent"
                />
              </template>
              <template v-slot:body="props">
                <q-tr :props="props">
                  <q-td key="No" :props="props" auto-width>
                    {{ detBom.indexOf(props.row) + 1 }}
                  </q-td>
                  <q-td key="kodeBahan" :props="props">
                    {{ props.row.kodeBahan }}
                  </q-td>
                  <q-td key="bahan" :props="props">
                    {{ props.row.bahan }}
                  </q-td>
                  <q-td key="qty" :props="props">
                    {{ props.row.qty | nomer }}
                    <q-popup-edit v-model="props.row.qty">
                      <q-input
                        v-model="props.row.qty"
                        dense
                        autofocus
                        counter
                        @change="adDet(props.row)"
                      />
                    </q-popup-edit>
                  </q-td>
                  <q-td key="act" :props="props">
                    <q-icon
                      name="close"
                      color="red"
                      @click="ondel(props.row)"
                    />
                  </q-td>
                </q-tr>
              </template>
            </q-table>
            <div align="right">
              <q-btn
                v-if="!pr.BOM_id"
                label="Simpan"
                type="submit"
                color="primary"
              />
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
        <stok @dtStok="onpil" ref="produk" />
      </q-card>
    </q-dialog>
    <q-dialog v-model="adBJ">
      <cariBarang @dtProduk="pilJD" />
    </q-dialog>
    <q-dialog v-model="adR" full-width>
      <q-card>        
        <q-form @submit="addRakit()" @reset="onReset" class="q-gutter-md">
          <q-card-section>
            <q-table
              class="detPR"
              :data="detR"
              :columns="jdlr"
              row-key="kodeBahan"
              dense
            >
              <template v-slot:top>
                <div class="col-4 q-table__title">
                  Perakitan {{ pr.kodeCab }}
                </div>
                <q-chip outline>Barang Jadi : {{ pr.namaBarang }} </q-chip>
                <q-input
                  v-model="pr.qty"
                  label="Qty Produksi"
                  class="q-ml-md"
                  @input="hitBhn"
                  :rules="inRul"
                />
                <q-input filled v-model="pr.tgl" label="Tanggal" dense readonly>
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy
                        v-if="
                          ['MAN', 'acc', 'mitra'].some(
                            (a) => a == $store.state.auth.user.userType
                          )
                        "
                        ref="qDateProxy"
                        transition-show="scale"
                        transition-hide="scale"
                      >
                        <q-date
                          v-model="pr.tgl"
                          @input="() => $refs.qDateProxy.hide()"
                          mask="YYYY-MM-DD"
                        />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </template>
              <template v-slot:body="props">
                <q-tr :props="props">
                  <q-td key="No" :props="props" auto-width>
                    {{ detR.indexOf(props.row) + 1 }}
                  </q-td>
                  <q-td key="kodeBahan" :props="props">
                    {{ props.row.kodeBahan }}
                  </q-td>
                  <q-td key="bahan" :props="props">
                    {{ props.row.bahan }}
                  </q-td>
                  <q-td key="qty" :props="props">
                    {{ props.row.qty | nomer }}
                  </q-td>
                  <q-td key="tqty" :props="props">
                    {{ (props.row.qty * pr.qty) | nomer }}
                  </q-td>
                  <q-td key="tersedia" :props="props">
                    {{ props.row.tersedia | nomer }}
                  </q-td>
                  <q-td key="selisih" :props="props">
                    {{ (props.row.tersedia - props.row.qty * pr.qty) | nomer }}
                  </q-td>
                </q-tr>
              </template>
            </q-table>
          </q-card-section>
          <q-card-actions>
            <q-space />
            <q-btn
              label="Simpan"
              type="submit"
              color="primary"
              :disable="smp"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>
<script>
import stok from "../stok";
import cariBarang from "../cariProduk";
import { reactive, toRefs } from "@vue/composition-api";
import {
  inBom,
  dtbom,
  detbom,
  rakit,
  deldetBom,
  updetBom,
} from "../../services/apiList";
export default {
  components: {
    stok,
    cariBarang,
  },
  setup(props, { root }) {
    const dt = reactive({
      detBom: [],
      inRul: [(v) => !!v || "Isi data"],
      jdld: [
        { name: "No", label: "No" },
        {
          name: "kodeBahan",
          label: "Kode Bahan",
          field: (row) => row.kodeBahan,
          align: "left",
        },
        {
          name: "bahan",
          label: "Nama Bahan",
          field: (row) => row.bahan,
          align: "left",
        },
        { name: "qty", label: "Qty", field: (row) => row.qty },
        { name: "act", label: "Act" },
      ],
      adP: false,
      adBJ: false,
      adR: false,
      pr: {
        kodeProduk: null,
        namaBarang: "",
        qty: 1,
        tgl: new Date()
          .toLocaleString("sv", { timeZoneName: "short" })
          .slice(0, 10),
      },
      cari: "",
      dtBOM: [],
      jdl: [
        { name: "No", label: "No" },
        {
          name: "kodeBOM",
          label: "Kode BOM",
          field: (row) => row.kodeBOM,
          sortable: true,
          align: "left",
        },
        {
          name: "kodeProduk",
          label: "Kode Produk",
          field: (row) => row.kodeProduk,
          sortable: true,
          align: "left",
        },
        {
          name: "namaBOM",
          label: "Nama Barang",
          field: (row) => row.namaBOM,
          sortable: true,
          align: "left",
        },
        { name: "act", label: "Act" },
      ],
      detR: [],
      jdlr: [
        { name: "No", label: "No" },
        {
          name: "kodeBahan",
          label: "Kode Bahan",
          field: (row) => row.kodeBahan,
          align: "left",
        },
        {
          name: "bahan",
          label: "Nama Bahan",
          field: (row) => row.bahan,
          align: "left",
        },
        { name: "qty", label: "Qty", field: (row) => row.qty },
        { name: "tqty", label: "Total Qty", field: (row) => row.tqty },
        { name: "tersedia", label: "Tersedia", field: (row) => row.tersedia },
        { name: "selisih", label: "selisih", field: (row) => row.selisih },
      ],
      smp: false,
    });
    const getBom = () => {
      dtbom()
        .then(({ data }) => {
          dt.dtBOM = data;
        })
        .catch((err) => {
          console.log(err);
        });
    };
    getBom();
    const onpil = (x) => {
      let ax = x.map((a) => {
        if (!dt.detBom.some((el) => el.kodeBahan === a.kodeProduk))
          return {
            kodeBOM: dt.pr.kodeBOM,
            kodeBahan: a.kodeProduk,
            bahan: a.namaBarang,
            qty: 0,
          };
      });
      dt.detBom.push(...ax.filter((el) => el !== undefined));
    };
    const ondel = (item) => {
      const index = dt.detBom.indexOf(item);
      let cf = confirm(`Hapus ${item.kodeBahan} ?`);
      if (cf) {
        dt.detBom.splice(index, 1);
        if (item.BomDet_id) {
          deldetBom(item)
            .then((res) => {
              root.$q.notify({ message: `${res.data.st}`, color: "teal" });
            })
            .catch((err) => {
              console.log(err);
              root.$q.notify({
                message: `Belum tersimpan...`,
                color: "purple",
              });
            });
        }
      }
    };
    const addBOM = () => {
      if (
        dt.detBom.every((a) => a.qty > 0) &&
        dt.detBom.length > 0 &&
        dt.pr.kodeProduk
      ) {
        if (dt.pr.BOM_id) {
          updetBom(dt.detBom)
            .then((res) => {
              onReset();
              root.$q.notify({ message: `${res.data.st}`, color: "teal" });
              dt.adP = false;
            })
            .catch((err) => {
              console.log(err);
              root.$q.notify({
                message: `Belum tersimpan...`,
                color: "purple",
              });
            });
        } else {
          inBom({ hd: dt.pr, det: dt.detBom })
            .then((res) => {
              onReset();
              root.$q.notify({ message: `${res.data.st}`, color: "teal" });
              dt.adP = false;
              getBom();
            })
            .catch((err) => {
              console.log(err);
              root.$q.notify({
                message: `Belum tersimpan...`,
                color: "purple",
              });
            });
        }
      } else {
        root.$q.notify({
          message: `Cek qty bahan dan hasil produk jadi...`,
          color: "purple",
        });
      }
    };
    const adDet = (x) => {
      if (dt.pr.BOM_id) {
        updetBom(x)
          .then((res) => {
            root.$q.notify({ message: `${res.data.st}`, color: "teal" });
          })
          .catch((err) => {
            console.log(err);
            root.$q.notify({ message: `Belum tersimpan...`, color: "purple" });
          });
      } else {
        root.$q.notify({
          message: `Jangan lupa disimpan...`,
          color: "pink",
          position: "right",
        });
      }
    };
    const onReset = () => {
      dt.detBom = [];
      dt.pr = {
        kodeProduk: "",
        namaBarang: "",
        kodeCab: root.$store.state.auth.setCabang,
        tgl: new Date()
          .toLocaleString("sv", { timeZoneName: "short" })
          .slice(0, 10),
      };
      dt.smp = false;
    };
    const pilJD = (x) => {
      dt.detBom = [];
      dt.adBJ = false;
      if (dt.dtBOM.some((arr) => arr.kodeProduk === x.kodeProduk)) {
        root.$q
          .dialog({
            title: "Cek Data BOM",
            message: `Data BOM untuk produk ${x.namaBarang} sudah ada, cek di pencarian...`,
            cancel: true,
            persistent: false,
          })
          .onOk(() => {
            dt.cari = x.kodeProduk;
            dt.adP = false;
            // dt.pr = x
          })
          .onCancel(() => {
            dt.cari = x.kodeProduk;
            dt.adP = false;
          });
      } else {
        dt.pr = x;
      }
    };
    const adProd = (x) => {
      dt.pr = x;
      x.kodeCab = root.$store.state.auth.setCabang;
      detbom(x).then(({ data }) => {
        dt.detR = data;
        dt.adR = true;
      });
    };
    const lihat = (x) => {
      dt.adP = true;
      dt.pr = x;
      detbom(x).then(({ data }) => {
        dt.detBom = data;
      });
    };
    const hitBhn = () => {
      dt.detR.forEach((a) => {
        a.tqty = root.$dwn.kali([a.qty, dt.pr.qty]);
        a.selisih = root.$dwn.jumlah([a.tersedia, -a.tqty]);
        a.thpp = root.$dwn.kali([a.tqty, a.hpp]);
      });
      dt.pr.thpp = dt.detR.reduce((s, i) => root.$dwn.jumlah([s, i.thpp]), 0);
    };
    const addRakit = () => {
      if (!dt.pr.tgl) {
        dt.pr.tgl = new Date()
          .toLocaleString("sv", { timeZoneName: "short" })
          .slice(0, 10);
      }
      dt.smp = true;
      if (
        dt.detR.every((a) => a.qty > 0 && a.selisih >= 0) &&
        dt.detR.length > 0 &&
        dt.pr.kodeProduk
      ) {
        rakit({ pr: dt.pr, det: dt.detR })
          .then((res) => {
            onReset();
            root.$q.notify({ message: `${res.data.st}`, color: "teal" });
            dt.adR = false;
          })
          .catch((err) => {
            console.log(err);
            root.$q.notify({ message: `Belum tersimpan...`, color: "purple" });
          });
      } else {
        root.$q.notify({
          message: `Cek qty, saldo bahan dan hasil produk jadi...`,
          color: "purple",
        });
      }
    };

    return {
      ...toRefs(dt),
      onpil,
      ondel,
      addBOM,
      onReset,
      pilJD,
      getBom,
      adProd,
      addRakit,
      hitBhn,
      lihat,
      adDet,
    };
  },
};
</script>
