<template>
  <div>
    <q-card class="print-hide">
      <q-card-section>
        <q-table
          class="dataTrx"
          :data="transaksi"
          :columns="perPartner ? jdlp : jdl"
          :row-key="perPartner ? 'kodePartner' : 'nomorBukti'"
          :pagination.sync="hal"
          :filter="cari"
          dense
        >
          <template v-slot:top>
            <div class="col-12 q-table__title text-center text-white">
              Data Transaksi {{ jenis.judul }}
            </div>
            <div class="col-6 text-white">
              <q-select
                v-if="!allCat"
                v-model="filt.jnsCust"
                :options="jenisCust"
                multiple
                style="min-width: 250px; max-width: 300px"
                label="Kategori Partner "
                :rules="inRul"
                dense
                options-dense
              >
                <template v-slot:option="scope">
                  <q-item
                    v-bind="scope.itemProps"
                    v-on="scope.itemEvents"
                    dense
                  >
                    <q-item-section>
                      <q-item-label v-html="scope.opt"></q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-checkbox
                        dense
                        v-model="filt.jnsCust"
                        :val="scope.opt"
                      />
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
              <q-chip color="blue-6" class="text-white text-bold"
                >Periode :
                {{ tgl && tgl.from ? tgl.from + " ~ " + tgl.to : tgl }}
                <q-popup-proxy
                  ref="qDateProxy"
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <q-date
                    range
                    v-model="tgl"
                    @input="(x) => x && (getTrx(), $refs.qDateProxy.hide())"
                    mask="YYYY-MM-DD"
                    lazy-rules
                  />
                </q-popup-proxy>
              </q-chip>
              <q-toggle
                v-model="allCat"
                label="All Kategori Partner"
                color="orange"
                class="q-ml-md"
              />
              <q-toggle
                v-model="perPartner"
                label="Per Partner  "
                color="orange"
                class="q-ml-md"
              />
              <template v-if="!perPartner">
                <q-checkbox
                  v-model="caraBayar"
                  val="tempo"
                  label="tempo"
                  color="orange"
                  keep-color
                />
                <q-checkbox
                  v-model="caraBayar"
                  val="tunai"
                  label="tunai"
                  color="teal"
                  keep-color
                />
                <q-checkbox
                  v-model="caraBayar"
                  val="sales"
                  label="sales"
                  color="teal"
                  keep-color
                />
                <q-checkbox
                  v-model="caraBayar"
                  val="Bank"
                  label="Transfer"
                  color="teal"
                  keep-color
                />
                <q-checkbox
                  v-model="caraBayar"
                  val="EDC"
                  label="EDC"
                  color="teal"
                  keep-color
                />
              </template>
            </div>
            <div class="col-6 text-white">
              <q-input
                dense
                debounce="300"
                v-model="cari"
                placeholder="Cari..."
                class="q-ml-md"
              >
                <template v-slot:append>
                  <q-icon name="search" />
                  <q-btn
                    flat
                    round
                    dense
                    icon="add_circle"
                    @click="jb = true"
                    class="q-ml-md"
                    color="accent"
                  />
                  <q-btn
                    flat
                    round
                    dense
                    icon="file_download"
                    @click="toDown"
                    class="q-ml-md"
                    color="primary"
                  />
                  <q-btn
                    flat
                    round
                    dense
                    :icon="
                      $q.fullscreen.isActive ? 'fullscreen_exit' : 'fullscreen'
                    "
                    @click="$q.fullscreen.toggle()"
                    class="q-ml-md"
                  />
                </template>
              </q-input>
            </div>
          </template>
          <template v-slot:header="props">
            <q-tr :props="props">
              <q-th auto-width />
              <q-th v-for="col in props.cols" :key="col.name" :props="props">
                {{ col.label }}
              </q-th>
              <q-th>Action</q-th>
            </q-tr>
          </template>
          <template v-slot:body="props">
            <q-tr
              :props="props"
              :style="
                props.expand
                  ? 'background: linear-gradient(to bottom, #00ccff 30%, #ffffff 92%)'
                  : props.row.status !== 'T'
                  ? 'background: linear-gradient(to left, #f50083, #ffffff 70%)'
                  : ''
              "
            >
              <q-td auto-width>
                <q-icon
                  v-if="perPartner"
                  size="sm"
                  color="accent"
                  dense
                  @click="props.expand = !props.expand"
                  :name="props.expand ? 'expand_less' : 'expand_more'"
                />
                <q-icon
                  v-else
                  size="sm"
                  color="accent"
                  dense
                  @click="
                    getdetTrx(props.row, props.expand),
                      (props.expand = !props.expand)
                  "
                  :name="props.expand ? 'expand_less' : 'expand_more'"
                />
                {{ props.rowIndex + 1 }}
              </q-td>
              <q-td v-for="col in props.cols" :key="col.name" :props="props">
                <template v-if="col.name === 'tglKirim'">
                  {{ col.value }}
                  <q-icon
                    v-if="
                      ['MAN', 'purchase', 'mitra', 'acc'].some(
                        (a) => a == $store.state.auth.user.userType
                      )
                    "
                    name="edit"
                    class="q-ml-xs"
                    color="red"
                    @click="ubahTgl(props.row)"
                  />
                </template>
                <template v-else-if="col.name === 'kodeCab'">
                  {{ jnsTrx === "J" ? props.row.kodeCab : props.row.tujuan }}
                </template>
                <template v-else-if="col.name === 'namaSales'">
                  {{ col.value }}
                  <q-popup-edit
                    v-model="props.row.gantiSales"
                    buttons
                    @save="ubahSales(props.row)"
                  >
                    <q-select
                      v-if="
                        ['MAN', 'purchase', 'mitra', 'acc'].some(
                          (a) => a == $store.state.auth.user.userType
                        )
                      "
                      v-model="props.row.gantiSales"
                      use-input
                      :options="
                        pilihSales.filter((a) => a.kodeCab === props.row.cabID)
                      "
                      :option-label="
                        (item) =>
                          item && item.namaKaryawan + ' ' + item.namaCabang
                      "
                      option-value="salesID"
                      options-dense
                      map-options
                      style="min-width: 250px; max-width: 300px"
                      label="Sales ID"
                      @filter="filterFns"
                      :rules="inRul"
                      dense
                      lazy-rules
                    />
                  </q-popup-edit>
                </template>
                <template v-else-if="col.jml === 'Y'">
                  {{ col.value | duit }}
                </template>
                <template v-else>
                  {{ col.value }}
                </template>
              </q-td>
              <q-td
                auto-width
                v-if="!perPartner"
                :class="
                  props.row.jurnalReff === null &&
                  props.row.ancab === 'Y' &&
                  props.row.status === 'T' &&
                  'bg-orange-5'
                "
              >
                <q-btn
                  icon="fas fa-edit"
                  color="red-13"
                  dense
                  outline
                  class="q-ml-xs"
                  v-if="
                    ['MAN', 'purchase', 'mitra', 'acc'].some(
                      (a) => a == $store.state.auth.user.userType
                    ) && props.row.status !== 'W'
                  "
                  @click="buka(props.row)"
                >
                  <q-tooltip
                    content-class="bg-orange-13"
                    :offset="[10, 10]"
                    anchor="center left"
                  >
                    Buka transaksi
                  </q-tooltip>
                </q-btn>
                <q-btn
                  v-if="props.row.status === 'W'"
                  icon-right="edit"
                  color="orange"
                  fab-mini
                  outline
                  @click="editJubel(props.row)"
                >
                  <q-tooltip
                    content-class="bg-orange"
                    :offset="[10, 10]"
                    anchor="center left"
                  >
                    Edit
                  </q-tooltip>
                </q-btn>
                <q-btn
                  v-if="['W', 'D'].some((a) => a === props.row.status)"
                  icon-right="check"
                  color="teal"
                  fab-mini
                  outline
                  @click="(pr = props.row), tompo(props.row)"
                  class="q-ml-xs"
                >
                  <q-tooltip
                    content-class="bg-cyan"
                    :offset="[10, 10]"
                    anchor="center left"
                  >
                    Konfirm
                  </q-tooltip> </q-btn
                ><!--
                <q-btn v-if="props.row.status === 'W'" icon-right="close" dense color="red" fab-mini outline @click="pr=props.row,terima('B')" class="q-ml-xs">
                  <q-tooltip content-class="bg-red" :offset="[10, 10]" anchor="center left">
                    Batal
                  </q-tooltip>
                </q-btn> -->
                <q-btn
                  v-if="
                    props.row.status === 'T' &&
                    props.row.garansi === 'Y' &&
                    ['MAN', 'purchase', 'admin', 'mitra', 'acc'].some(
                      (a) => a == $store.state.auth.user.userType
                    )
                  "
                  icon-right="replay"
                  color="warning"
                  flat
                  @click="returBarang(props.row)"
                  class="q-ml-xs"
                >
                  <q-tooltip
                    content-class="bg-orange"
                    :offset="[10, 10]"
                    anchor="center left"
                  >
                    Retur
                  </q-tooltip>
                </q-btn>
                <q-btn
                  icon="print"
                  dense
                  outline
                  color="orange"
                  @click="getdetTrx(props.row, props.expand), cetak(props.row)"
                  class="q-ml-xs"
                />
                <q-btn
                  icon="fas fa-balance-scale"
                  :color="
                    props.row.nomorJurnal.length || props.row.jurnalReff
                      ? 'teal'
                      : 'pink'
                  "
                  dense
                  outline
                  class="q-ml-xs"
                  v-if="
                    ['MAN', 'purchase', 'admin', 'mitra', 'acc'].some(
                      (a) => a == $store.state.auth.user.userType
                    ) && ['T', 'D'].some((a) => a === props.row.status)
                  "
                  @click="(cj = true), getJur(props.row)"
                >
                  <q-tooltip
                    content-class="bg-teal"
                    :offset="[10, 10]"
                    anchor="center left"
                  >
                    Jurnal
                  </q-tooltip>
                </q-btn>
                <q-btn
                  icon="fas fa-money-bill-alt"
                  color="blue-13"
                  dense
                  outline
                  class="q-ml-xs"
                  v-if="
                    ['MAN', 'purchase', 'admin', 'mitra', 'acc'].some(
                      (a) => a == $store.state.auth.user.userType
                    ) &&
                    props.row.status === 'T' &&
                    props.row.walkIn === 'Y'
                  "
                >
                  <q-tooltip
                    content-class="bg-blue-13"
                    :offset="[10, 10]"
                    anchor="center left"
                  >
                    Klaim Point
                  </q-tooltip>
                </q-btn>
                <q-btn
                  @click="updPoint(props.row)"
                  icon="fas fa-money-bill-alt"
                  dense
                  outline
                  class="q-ml-xs text-green-12"
                  v-if="
                    (['MAN', 'purchase', 'mitra', 'acc'].some(
                      (a) => a == $store.state.auth.user.userType
                    ) &&
                      props.row.point === 'Y' &&
                      props.row.ac === 'N' &&
                      props.row.cabID !== 'AM01' &&
                      props.row.ancab !== 'Y') ||
                    props.row.totalPoint > 0
                  "
                >
                  <q-tooltip
                    content-class="bg-brown-3 text-bold"
                    :offset="[10, 10]"
                    anchor="bottom left"
                  >
                    Repair Point
                  </q-tooltip>
                </q-btn>
                <q-btn
                  @click="repairJurnalServis(props.row)"
                  icon="fas fa-cogs"
                  dense
                  outline
                  class="q-ml-xs text-purple-12"
                  v-if="$store.state.auth.user.akun === 'itsupport'"
                >
                  <q-tooltip
                    content-class="bg-brown-3 text-bold"
                    :offset="[10, 10]"
                    anchor="bottom left"
                  >
                    Repair Jurser
                  </q-tooltip>
                </q-btn>
                <q-btn
                  label="Bukti"
                  color="cyan-5"
                  @click="getSPK(props.row)"
                  v-if="props.row.spkFile"
                />

                <q-btn
                  small
                  outline
                  round
                  class="q-ml-sm"
                  icon="attach_file"
                  @click="getLamp(props.row)"
                />
                <q-btn
                  icon="info"
                  v-if="
                    ['MAN', 'purchase', 'acc'].some(
                      (a) => a == $store.state.auth.user.userType
                    ) && props.row.status
                  "
                  dense
                  color="brown-12"
                  rounded
                  outline
                  class="q-ml-md"
                  @click="cekLog(props.row, 'nomorBukti')"
                >
                  <q-menu
                    auto-close
                    content-class="bg-grey-12"
                    style="width: 550px"
                  >
                    <q-list
                      separator
                      style="max-width: 600px"
                      v-if="userLog.length > 0"
                    >
                      <q-item active active-class="bg-yellow-2" dense>
                        Aktifitas user...
                      </q-item>
                      <q-separator />
                      <q-item dense v-for="(i, s) in userLog" :key="s">
                        <q-item-section>
                          <q-item-label overline>{{ i.akun }}</q-item-label>
                          <q-item-label caption>{{ i.deskripsi }}</q-item-label>
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
              </q-td>
            </q-tr>
            <q-tr v-show="props.expand" :props="props">
              <template v-if="perPartner">
                <q-td colspan="100%">
                  <q-table
                    class="detTrans"
                    :data="
                      dataTrx.filter(
                        (a) => a.kodePartner === props.row.kodePartner
                      )
                    "
                    :columns="jdl"
                    row-key="nomorBukti"
                    :filter="cari"
                    dense
                  >
                    <template v-slot:body="pp">
                      <q-tr :props="pp" :class="props.expand && 'bg-yellow-2'">
                        <q-td
                          v-for="col in pp.cols"
                          :key="col.name"
                          :props="pp"
                        >
                          <template v-if="col.name === 'kodeCab'">
                            <q-icon
                              size="sm"
                              color="accent"
                              dense
                              @click="
                                getdetTrx(pp.row, pp.expand),
                                  (pp.expand = !pp.expand)
                              "
                              :name="pp.expand ? 'expand_less' : 'expand_more'"
                            />
                            {{
                              jnsTrx === "J" ? pp.row.kodeCab : pp.row.tujuan
                            }}
                          </template>
                          <template v-else-if="col.name === 'tglKirim'">
                            {{ col.value }}
                            <q-icon
                              v-if="
                                ['MAN', 'purchase', 'mitra', 'acc'].some(
                                  (a) => a == $store.state.auth.user.userType
                                )
                              "
                              name="edit"
                              class="q-ml-xs"
                              color="red"
                              @click="ubahTgl(pp.row)"
                            />
                          </template>
                          <template v-else-if="col.name === 'namaSales'">
                            {{ col.value }}
                            <q-popup-edit
                              v-model="props.row.gantiSales"
                              buttons
                              @save="ubahSales(props.row)"
                            >
                              <q-select
                                v-if="
                                  ['MAN', 'purchase', 'mitra', 'acc'].some(
                                    (a) => a == $store.state.auth.user.userType
                                  )
                                "
                                v-model="pp.row.gantiSales"
                                use-input
                                :options="
                                  pilihSales.filter(
                                    (a) => a.kodeCab === pp.row.cabID
                                  )
                                "
                                :option-label="
                                  (item) =>
                                    item &&
                                    item.namaKaryawan + ' ' + item.namaCabang
                                "
                                option-value="salesID"
                                options-dense
                                map-options
                                style="min-width: 250px; max-width: 300px"
                                label="Sales ID"
                                @filter="filterFns"
                                :rules="inRul"
                                dense
                                lazy-rules
                              />
                            </q-popup-edit>
                          </template>
                          <template v-else-if="col.jml === 'Y'">
                            {{ col.value | duit }}
                          </template>
                          <template v-else>
                            {{ col.value }}
                          </template>
                        </q-td>
                        <q-td
                          auto-width
                          :class="
                            pp.row.jurnalReff === null &&
                            pp.row.ancab === 'Y' &&
                            pp.row.status === 'T' &&
                            'bg-orange-5'
                          "
                        >
                          <q-btn
                            icon="fas fa-edit"
                            color="red-13"
                            dense
                            outline
                            class="q-ml-xs"
                            v-if="
                              ['MAN', 'purchase', 'mitra', 'acc'].some(
                                (a) => a == $store.state.auth.user.userType
                              ) && pp.row.status !== 'W'
                            "
                            @click="buka(pp.row)"
                          >
                            <q-tooltip
                              content-class="bg-orange-13"
                              :offset="[10, 10]"
                              anchor="center left"
                            >
                              Buka transaksi
                            </q-tooltip>
                          </q-btn>
                          <q-btn
                            v-if="pp.row.status === 'W'"
                            icon-right="edit"
                            color="orange"
                            fab-mini
                            outline
                            @click="editJubel(pp.row)"
                          >
                            <q-tooltip
                              content-class="bg-orange"
                              :offset="[10, 10]"
                              anchor="center left"
                            >
                              Edit
                            </q-tooltip>
                          </q-btn>
                          <q-btn
                            v-if="['W', 'D'].some((a) => a === pp.row.status)"
                            icon-right="check"
                            color="teal"
                            fab-mini
                            outline
                            @click="(pr = pp.row), tompo(pp.row)"
                            class="q-ml-xs"
                          >
                            <q-tooltip
                              content-class="bg-cyan"
                              :offset="[10, 10]"
                              anchor="center left"
                            >
                              Konfirm
                            </q-tooltip> </q-btn
                          ><!--
                          <q-btn v-if="props.row.status === 'W'" icon-right="close" dense color="red" fab-mini outline @click="pr=props.row,terima('B')" class="q-ml-xs">
                            <q-tooltip content-class="bg-red" :offset="[10, 10]" anchor="center left">
                              Batal
                            </q-tooltip>
                          </q-btn> -->
                          <q-btn
                            v-if="
                              pp.row.status === 'T' &&
                              pp.row.garansi === 'Y' &&
                              ['MAN', 'purchase', 'admin', 'mitra', 'acc'].some(
                                (a) => a == $store.state.auth.user.userType
                              )
                            "
                            icon-right="replay"
                            color="warning"
                            flat
                            @click="returBarang(pp.row)"
                            class="q-ml-xs"
                          >
                            <q-tooltip
                              content-class="bg-orange"
                              :offset="[10, 10]"
                              anchor="center left"
                            >
                              Retur
                            </q-tooltip>
                          </q-btn>
                          <q-btn
                            icon="print"
                            dense
                            outline
                            color="orange"
                            @click="getdetTrx(pp.row, pp.expand), cetak(pp.row)"
                            class="q-ml-xs"
                          />
                          <q-btn
                            icon="fas fa-balance-scale"
                            color="teal"
                            dense
                            outline
                            class="q-ml-xs"
                            v-if="
                              ['MAN', 'purchase', 'admin', 'mitra', 'acc'].some(
                                (a) => a == $store.state.auth.user.userType
                              ) && ['T', 'D'].some((a) => a === pp.row.status)
                            "
                            @click="(cj = true), getJur(pp.row)"
                          >
                            <q-tooltip
                              content-class="bg-teal"
                              :offset="[10, 10]"
                              anchor="center left"
                            >
                              Jurnal
                            </q-tooltip>
                          </q-btn>
                          <q-btn
                            icon="fas fa-money-bill-alt"
                            color="blue-13"
                            dense
                            outline
                            class="q-ml-xs"
                            v-if="
                              ['MAN', 'purchase', 'admin', 'mitra', 'acc'].some(
                                (a) => a == $store.state.auth.user.userType
                              ) &&
                              pp.row.status === 'T' &&
                              pp.row.walkIn === 'Y'
                            "
                          >
                            <q-tooltip
                              content-class="bg-blue-13"
                              :offset="[10, 10]"
                              anchor="center left"
                            >
                              Klaim Point
                            </q-tooltip>
                          </q-btn>
                          <q-btn
                            @click="updPoint(pp.row)"
                            icon="fas fa-money-bill-alt"
                            dense
                            outline
                            class="q-ml-xs text-green-12"
                            v-if="
                              (['MAN', 'purchase', 'mitra', 'acc'].some(
                                (a) => a == $store.state.auth.user.userType
                              ) &&
                                pp.row.point === 'Y' &&
                                pp.row.ac === 'N' &&
                                pp.row.cabID !== 'AM01' &&
                                pp.row.ancab !== 'Y') ||
                              pp.row.totalPoint > 0
                            "
                          >
                            <q-tooltip
                              content-class="bg-brown-3 text-bold"
                              :offset="[10, 10]"
                              anchor="bottom left"
                            >
                              Repair Point
                            </q-tooltip>
                          </q-btn>
                          <q-btn
                            label="SPK Dinas"
                            @click="getSPK(pp.row)"
                            v-if="pp.row.spkFile"
                          />
                          <q-btn
                            rounded
                            icon="attach-file"
                            @click="getLamp(pp.row)"
                          />
                        </q-td>
                      </q-tr>
                      <q-tr v-show="pp.expand" :props="pp">
                        <q-td colspan="100%">
                          <q-table
                            class="detTrx"
                            :data="
                              detTrx.filter(
                                (a) => a.nomorBukti === pp.row.nomorBukti
                              )
                            "
                            :columns="jdle"
                            row-key="kodeProduk"
                            separator="cell"
                            :pagination.sync="hald"
                            dense
                          >
                            <template v-slot:body="ppt">
                              <q-tr :props="props">
                                <q-td class="text-right">
                                  {{
                                    detTrx
                                      .filter(
                                        (a) =>
                                          a.nomorBukti === pp.row.nomorBukti
                                      )
                                      .indexOf(ppt.row) + 1
                                  }}
                                </q-td>
                                <q-td key="kodeProduk" :props="ppt">
                                  {{ ppt.row.kodeProduk }}
                                </q-td>
                                <q-td key="namaBarang" :props="ppt">
                                  {{ ppt.row.namaBarang }}
                                </q-td>
                                <q-td key="qty" :props="ppt">
                                  {{ ppt.row.qty | nomer }} Pcs
                                </q-td>
                                <q-td key="jmlKemasan" :props="ppt">
                                  {{ ppt.row.jmlKemasan | nomer }}
                                  {{ ppt.row.kemasan.kemasan }}
                                </q-td>
                                <q-td key="jmlRetur" :props="ppt">
                                  {{ ppt.row.jmlRetur | nomer }} Pcs
                                </q-td>
                                <q-td key="hargaKemasan" :props="ppt">
                                  {{ ppt.row.hargaKemasan | duit }}
                                </q-td>
                                <q-td key="jmlHarga" :props="ppt">
                                  {{
                                    (ppt.row.jmlHarga - ppt.row.hrgRetur) | duit
                                  }}
                                </q-td>
                                <q-td key="ppn" :props="ppt">
                                  {{ ppt.row.ppn | duit }}
                                </q-td>
                              </q-tr>
                            </template>
                            <template v-slot:bottom-row>
                              <q-tr>
                                <q-th colspan="6" class="text-right"
                                  >Biaya Kirim</q-th
                                >
                                <q-th class="text-right">
                                  {{ pp.row.biaya | duit }}
                                </q-th>
                              </q-tr>
                              <q-tr>
                                <q-th colspan="6" class="text-right"
                                  >Diskon</q-th
                                >
                                <q-th class="text-right">
                                  {{ pp.row.diskon | duit }}
                                </q-th>
                              </q-tr>
                              <q-tr>
                                <q-th colspan="6" class="text-right"
                                  >Total Harga</q-th
                                >
                                <q-th align="right">{{
                                  pp.row.totalAkhir | duit
                                }}</q-th>
                              </q-tr>
                            </template>
                          </q-table>
                        </q-td>
                      </q-tr>
                    </template>
                  </q-table>
                </q-td>
              </template>
              <template v-else>
                <q-td colspan="100%">
                  <q-table
                    class="detTrx"
                    :data="
                      detTrx.filter(
                        (a) => a.nomorBukti === props.row.nomorBukti
                      )
                    "
                    :columns="jdle"
                    row-key="kodeProduk"
                    separator="cell"
                    :pagination.sync="hald"
                    dense
                  >
                    <template v-slot:body="props">
                      <q-tr :props="props">
                        <q-td class="text-right">
                          {{
                            detTrx
                              .filter(
                                (a) => a.nomorBukti === props.row.nomorBukti
                              )
                              .indexOf(props.row) + 1
                          }}
                        </q-td>
                        <q-td key="kodeProduk" :props="props">
                          {{ props.row.kodeProduk }}
                        </q-td>
                        <q-td key="namaBarang" :props="props">
                          {{ props.row.namaBarang }}
                        </q-td>
                        <q-td key="qty" :props="props">
                          {{ props.row.qty | nomer }} Pcs
                        </q-td>
                        <q-td key="jmlKemasan" :props="props">
                          {{ props.row.jmlKemasan | nomer }}
                          {{ props.row.kemasan.kemasan }}
                        </q-td>
                        <q-td key="jmlRetur" :props="props">
                          {{ props.row.jmlRetur | nomer }}
                        </q-td>
                        <q-td key="hargaKemasan" :props="props">
                          {{ props.row.hargaKemasan | duit }}
                        </q-td>
                        <q-td key="jmlHarga" :props="props">
                          {{ (props.row.jmlHarga - props.row.hrgRetur) | duit }}
                        </q-td>
                        <q-td key="ppn" :props="props">
                          {{ props.row.ppn | duit }}
                        </q-td>
                      </q-tr>
                    </template>
                    <template v-slot:bottom-row>
                      <q-tr>
                        <q-th colspan="6" class="text-right">Biaya Kirim</q-th>
                        <q-th class="text-right">
                          {{ props.row.biaya | duit }}
                        </q-th>
                      </q-tr>
                      <q-tr>
                        <q-th colspan="6" class="text-right">Diskon</q-th>
                        <q-th class="text-right">
                          {{ props.row.diskon | duit }}
                        </q-th>
                      </q-tr>
                      <q-tr>
                        <q-th colspan="6" class="text-right">Total Harga</q-th>
                        <q-th align="right">{{
                          props.row.totalAkhir | duit
                        }}</q-th>
                      </q-tr>
                    </template>
                  </q-table>
                </q-td>
              </template>
            </q-tr>
          </template>
          <template v-slot:bottom-row>
            <q-tr>
              <q-th :colspan="perPartner ? 3 : 6" class="text-right"
                >Jumlah</q-th
              >
              <q-th align="right">{{
                transaksi.reduce((a, b) => $dwn.jumlah([a, b.totalAkhir]), 0)
                  | duit
              }}</q-th>
              <q-th />
              <q-th align="right">{{
                transaksi.reduce((a, b) => $dwn.jumlah([a, b.totalPoint]), 0)
                  | duit
              }}</q-th>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
    <q-dialog v-model="confirm" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="print" color="primary" text-color="white" />
          <span class="q-ml-sm">Menu Cetak : #{{ ctk.nomorBukti }}</span>
          <q-space />
          <q-btn round icon="close" color="red" v-close-popup />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            outline
            label="Surat Jalan"
            color="primary"
            @click="printSjln(ctk)"
          />
          <q-btn
            outline
            label="Surat Jalan SN"
            color="primary"
            @click="printSjln(ctk, true)"
            v-if="
              ['MAN', 'purchase', 'gudang', 'mitra', 'acc'].some(
                (a) => a == $store.state.auth.user.userType
              )
            "
          />
          <q-btn
            outline
            label="Invoice A4"
            color="primary"
            @click="printA4(ctk)"
          />
          <q-btn
            outline
            label="Invoice Kertas Ply"
            color="primary"
            @click="printW(ctk)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="reT" full-width>
      <retur ref="retur" :pr="selected" :detTrx="detRet" @ttp="reT = false" />
    </q-dialog>
    <q-dialog v-model="jb" full-width persistent>
      <q-card>
        <q-card-section>
          <q-btn
            icon="close"
            color="red"
            size="sm"
            class="absolute-top-right"
            v-close-popup
          />
        </q-card-section>
        <q-card-section>
          <jualbeli :jnsTrx="jnsTrx" @jubel="getTrx" />
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog v-model="cj" full-width>
      <edJur ref="dtJurnal" :detJur="detJur" :jh="jh" @ok="cj = false" />
    </q-dialog>
    <q-dialog v-model="edjb" persistent full-width>
      <q-card>
        <q-card-section>
          <q-btn
            @click="getTrx()"
            icon="close"
            color="red"
            size="sm"
            class="absolute-top-right"
            v-close-popup
          />
        </q-card-section>
        <editJB
          ref="editJB"
          :jnsTrx="jnsTrx"
          :expd="exp"
          :edDet="detTrx"
          :jh="jh"
          :potHrg="pot"
          :pelanggan="plgn"
          @jubel="(edjb = false), getTrx()"
        />
      </q-card>
    </q-dialog>
    <q-dialog v-model="ubT">
      <q-card style="width: 400px">
        <q-form ref="form" @submit="ubahTrx(ubahT, 'Trx')">
          <q-card-section>
            <div class="text-h5 text-orange-9">Ubah Tanggal Transaksi</div>
            <q-separator />
            <q-chip outline color="teal"
              >Nomor Bukti : {{ ubahT.nomorBukti }}
            </q-chip>
            <q-input
              v-model="ubahT.tglKirim"
              label="Tanggal Awal *"
              :rules="rules.required"
              readonly
            />
            <q-input
              filled
              v-model="ubahT.tglBaru"
              label="Ubah Tanggal"
              dense
              lazy-rules
              :rules="inRul"
              readonly
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy
                    ref="qDateProxye"
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <q-date
                      v-model="ubahT.tglBaru"
                      @input="() => $refs.qDateProxye.hide()"
                      mask="YYYY-MM-DD"
                      lazy-rules
                      :rules="inRul"
                    />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </q-card-section>
          <q-card-actions>
            <q-space />
            <q-btn
              label="Batal"
              type="reset"
              outline
              rounded
              color="warning"
              v-close-popup
            />
            <q-btn
              label="Simpan"
              type="submit"
              outline
              rounded
              color="teal"
              v-close-popup
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
    <q-dialog v-model="lamp">
      <q-card>
        <q-card-section>
          <q-chip outline color="orange-9">
            Lampiran Transaksi {{ pr.nomorBukti }}
          </q-chip>
          <q-btn
            icon="add"
            dense
            rounded
            color="pink-13"
            @click="addLamp = true"
            class="text-right q-ml-md"
          />
          <q-separator color="purple" />
          <template v-if="lampTrans.length">
            <q-list dense v-for="(a, i) in lampTrans" :key="i">
              <q-item dense>
                <!-- <q-item-section>
                  <q-item-label no-wrap>{{ i + 1 }}</q-item-label>
                </q-item-section> -->
                <q-item-section class="text-teal">
                  <q-item-label>
                    {{ i + 1 }}. {{ a.namaLampiran }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn-group class="">
                    <q-icon
                      name="cloud_download"
                      color="teal-13"
                      size="md"
                      @click="downLamp(a)"
                    >
                      <q-tooltip
                        content-class="bg-teal text-bold"
                        content-style="font-size: 14px;"
                        >Unduh {{ a.namaLampiran }}</q-tooltip
                      >
                    </q-icon>
                    <q-icon
                      name="close"
                      color="orange-13"
                      size="md"
                      @click="delLamp(a)"
                      v-if="
                        ['MAN', 'purchase', 'mitra', 'acc'].includes(
                          $store.state.auth.user.userType
                        ) || pr.status === 'W'
                      "
                    >
                      <q-tooltip
                        content-class="bg-warning text-bold"
                        content-style="font-size: 14px;"
                        >Hapus {{ a.namaLampiran }}</q-tooltip
                      >
                    </q-icon>
                  </q-btn-group>
                </q-item-section>
              </q-item>
              <q-separator inset />
            </q-list>
          </template>
          <template v-else> Tidak ada lampiran dokumen pendukung </template>
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog v-model="addLamp">
      <q-card style="width: 600px">
        <q-form @submit="uploadLamp(bukti)">
          <q-card-section>
            <div class="text-h5 text-orange-9">Lampiran</div>
            <q-separator />
            <q-input
              v-model="pr.nomorBukti"
              label="Nomor Transaksi"
              :rules="inRul"
              readonly
            />
            <q-input
              v-model="bukti.namaLampiran"
              label="Nama Dokumen"
              :rules="inRul"
            />
            <q-uploader
              @added="factoryFn"
              style="max-width: 300px"
              @failed="uploadFailed"
              max-file-size="2050000"
              label="Maksimal 2Mb"
              max-files="1"
              hide-upload-btn
            ></q-uploader>
            <!-- <q-file outlined v-model="bukti.file" label="Pilih dokumen" counter :rules="inRul">
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file> -->
          </q-card-section>
          <q-card-actions>
            <q-space />
            <q-btn
              type="submit"
              color="teal"
              label="Simpan"
              class="shadow-5"
              outline
              rounded
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import {
  dtTrx,
  detTrxR,
  detTrx,
  konfirm,
  dtCab,
  getJurtrans,
  getBankCab,
  editTglTrx,
  perbaiki,
  carikar,
  gantiSales,
  repairPoint,
  cekRabalanceServis,
  getLog,
} from "../services/apiList";
import retur from "./POS/Retur";
import jualbeli from "./jualBeli";
import edJur from "./acc/edJur";
import editJB from "./editJB";
import FileSaver from "file-saver";
import {
  computed,
  onMounted,
  reactive,
  toRefs,
  watch,
} from "@vue/composition-api";
import { Loading } from "quasar";

export default {
  preFetch({ store, redirect }) {
    Loading.show();
    store.dispatch("auth/user").then((a) => {
      console.log("iki pree layout");
      Loading.hide();
      if (a !== "mitra") {
        let rd = a || "login";
        redirect(`/${rd}`);
      }
    });
  },
  // name: 'PageName',
  props: {
    jnsTrx: {
      type: String,
      default: "J",
      validator: function (x) {
        return ["J", "B", "RJ", "RB"].indexOf(x) !== -1;
      },
    },
  },
  components: {
    retur,
    jualbeli,
    edJur,
    editJB,
  },
  setup(props, { root }) {
    const dt = reactive({
      allCat: true,
      dataTrx: [],
      detTrx: [],
      detRet: [],
      jdld: [
        { name: "index", label: "#", field: "index", style: "max-width: 10px" },
        {
          name: "kodeProduk",
          label: "Kode Produk",
          field: (row) => row.kodeProduk,
          align: "left",
        },
        {
          name: "namaBarang",
          label: "Nama Produk",
          field: (row) => row.namaBarang,
          align: "left",
        },
        {
          name: "jmlKemasan",
          label: "Qty",
          field: (row) => row.jmlKemasan,
          jml: "Y",
          align: "right",
        },
        {
          name: "harga",
          label: "Harga @",
          field: (row) => row.hargaKemasan,
          jml: "Y",
          align: "right",
        },
        {
          name: "jmlHarga",
          label: "jmlHarga",
          field: (row) => row.jmlHarga,
          jml: "Y",
          align: "right",
        },
      ],
      jdle: [
        { name: "index", label: "#", field: "index", style: "max-width: 10px" },
        {
          name: "kodeProduk",
          label: "Kode Produk",
          field: (row) => row.kodeProduk,
          align: "left",
        },
        {
          name: "namaBarang",
          label: "Nama Produk",
          field: (row) => row.namaBarang,
          align: "left",
        },
        {
          name: "qty",
          label: "Qty",
          field: (row) => row.qty,
          jml: "Y",
          align: "right",
        },
        {
          name: "jmlKemasan",
          label: "Kemasan",
          field: (row) => row.jmlKemasan,
          jml: "Y",
          align: "right",
        },
        {
          name: "jmlRetur",
          label: "Retur",
          field: (row) => row.jmlRetur,
          jml: "Y",
          align: "right",
        },
        {
          name: "hargaKemasan",
          label: "Harga @",
          field: (row) => row.hargaKemasan,
          jml: "Y",
          align: "right",
        },
        {
          name: "jmlHarga",
          label: "jmlHarga",
          field: (row) => row.jmlHarga,
          jml: "Y",
          align: "right",
        },
        {
          name: "ppn",
          label: "ppn",
          field: (row) => row.ppn,
          jml: "Y",
          align: "right",
        },
      ],
      jdlp: [
        {
          name: "namaPartner",
          label: "Partner",
          field: (row) => row.namaPartner,
          align: "left",
          sortable: true,
        },
        {
          name: "kategoriCust",
          label: "Kategori Partner",
          field: (row) => row.kategoriCust,
          align: "left",
          sortable: true,
        },
        {
          name: "totalAkhir",
          label: "Total Harga",
          field: (row) => row.totalAkhir,
          jml: "Y",
          align: "right",
          sortable: true,
        },
        {
          name: "totalPoint",
          label: "Total Point",
          field: (row) => row.totalPoint,
          jml: "Y",
          align: "right",
          sortable: true,
        },
      ],
      adP: false,
      jb: false,
      confirm: false,
      inRul: [(v) => !!v || "Isi data"],
      pr: { tglKirim: "" },
      pot: {},
      selected: {},
      expanded: [],
      cari: "",
      exp: { idExp: null, biaya: 0 },
      pn: false,
      reT: false,
      cj: false,
      detJur: [],
      jh: {},
      cabAll: [],
      hal: { rowsPerPage: 10 },
      hald: { rowsPerPage: 0 },
      edjb: false,
      ctk: {},
      plgn: { namaPartner: "", alamat: "" },
      perPartner: false,
      rkpTrx: [],
      filt: {
        kodeCab: [root.$store.state.auth.setCabang],
        ac: "N",
        tgla:
          new Date()
            .toLocaleString("sv", { timeZoneName: "short" })
            .slice(0, 8) + "01",
        tglb: new Date()
          .toLocaleString("sv", { timeZoneName: "short" })
          .slice(0, 10),
        jnsCust: [],
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
      ubahT: {},
      ubT: false,
      rules: {
        required: [(value) => !!value || "Harus diisi.."],
        min: [(v) => (v && v.length >= 4) || "Min 4 characters"],
        cek: [(v) => v === dt.u.password || "Password tidak sama..."],
      },
      dtSales: [],
      pilihSales: [],
      caraBayar: ["tempo", "tunai", "sales", "EDC", "Bank", "eMoney", "CRM"],
      userLog: [],
      lampTrans: [],
      lamp: false,
      fileBukti: null,
      bukti: { file: null, namaLampiran: "", nomorBukti: "", bukti: null },
      addLamp: false,
    });
    const cabPilih = computed(() => {
      let a = dt.cabAll.find((a) => dt.pr.kodeCab);
      return a;
    });
    const opac = computed(() => {
      let a = [
        { label: "Penjualan", value: "N" },
        { label: "Antar Cabang", value: "Y" },
      ];
      props.jnsTrx === "B"
        ? (a[0].label = "Pembelian")
        : (a[0].label = "Penjualan");
      return a;
    });
    const rekapTransaksi = computed(() => {
      let dta = [];
      if (dt.rkpTrx.length > 0) {
        let sp = [...new Set(dt.rkpTrx.map((s) => s.kodePartner))]; // ambil dt kode rekanan as array
        for (let i in sp) {
          // filter datPi where kode = sp[i] per grup rekanan
          let f = dt.rkpTrx.filter((x) => x.kodePartner === sp[i]);
          let s = { ...f[0] }; // ambil value untuk rekanan
          s.totalHarga = f.reduce(
            (x, y) => root.$dwn.jumlah([x, y.jmlHarga]),
            0
          );
          s.totalAkhir = f.reduce(
            (x, y) => root.$dwn.jumlah([x, y.totalHarga]),
            0
          );
          s.totalPoint = f.reduce(
            (x, y) => root.$dwn.jumlah([x, y.totalPoint]),
            0
          );
          dta.push(s); // add to data array
          //          console.log(dta)
          // tinggal add judulnya
        }
      }
      return dta;
    });
    const transaksi = computed(() => {
      let data = dt.perPartner ? rekapTransaksi.value : dt.dataTrx;
      let a;
      switch (dt.perPartner) {
        case true:
          a = dt.allCat
            ? data
            : data.filter((s) =>
                dt.filt.jnsCust.some((d) => d === s.kategoriCust)
              );
          break;
        default:
          a = dt.allCat
            ? data.filter((s) => dt.caraBayar.some((c) => c === s.ct))
            : data.filter(
                (s) =>
                  dt.filt.jnsCust.some((d) => d === s.kategoriCust) &&
                  dt.caraBayar.some((c) => c === s.ct)
              );
      }
      return a;
    });
    const jenisCust = computed(() => {
      let data = dt.perPartner ? rekapTransaksi.value : dt.dataTrx;
      let a = [...new Set(data.map((d) => d.kategoriCust))];
      return a;
    });
    const totalHarga = computed(() => {
      return dt.detTrx.reduce((a, b) => {
        return root.$dwn.jumlah([a, b.jmlHarga]);
      }, 0);
    });
    const totalAll = computed(() => {
      let x = {};
      x.tdpp = dt.detTrx.reduce((a, b) => root.$dwn.jumlah([a, b.dpp]), 0);
      x.tppn = dt.detTrx.reduce((a, b) => root.$dwn.jumlah([a, b.ppn]), 0);
      x.tharga = root.$dwn.jumlah([x.tdpp, x.tppn]);
      return x;
    });
    const totalQty = computed(() => {
      return dt.detTrx.reduce((a, b) => {
        return root.$dwn.jumlah([a, b.qty]);
      }, 0);
    });
    const jenis = computed(() => {
      let x = {};
      x.judul = props.jnsTrx === "J" ? "Penjualan" : "Pembelian";
      x.partner = props.jnsTrx === "J" ? "CUSTOMER" : "SUPPLIER";
      return x;
    });
    const jdl = computed(() => {
      let x = [
        {
          name: "kodeCab",
          label: "Cabang",
          field: (row) => row.kodeCab,
          align: "left",
        },
        {
          name: "nomorBukti",
          label: "Nomor Transaksi",
          field: (row) => row.nomorBukti,
          align: "left",
          sortable: true,
        },
        {
          name: "tglKirim",
          label: "Tanggal",
          field: (row) => row.tglKirim,
          align: "left",
          sortable: true,
        },
        {
          name: "namaPartner",
          label: "Pelanggan",
          field: (row) => row.namaPartner,
          align: "left",
          sortable: true,
        },
        {
          name: "kategoriCust",
          label: "Kategori",
          field: (row) => row.kategoriCust,
          align: "left",
          sortable: true,
        },
        {
          name: "totalHarga",
          label: "Total Harga",
          field: (row) => row.totalHarga,
          jml: "Y",
          align: "right",
          sortable: true,
        },
        {
          name: "totalAkhir",
          label: "Total Akhir",
          field: (row) => row.totalAkhir,
          jml: "Y",
          align: "right",
          sortable: true,
        },
        {
          name: "totalPoint",
          label: "Total Point",
          field: (row) => row.totalPoint,
          jml: "Y",
          align: "right",
          sortable: true,
        },
        {
          name: "ct",
          label: "Cara Bayar",
          field: (row) => row.ct,
          align: "left",
        },
      ];
      if (props.jnsTrx === "B") {
        x[3].label = "Vendor";
        x.push(
          {
            name: "nomorPR",
            label: "nomorPR",
            field: (row) => row.nomorPR,
            align: "left",
            width: "500px",
          },
          {
            name: "ketPR",
            label: "PR info",
            field: (row) => row.ketPR,
            align: "left",
          },
          {
            name: "tglTempo",
            label: "Tgl Tempo",
            field: (row) => row.tglTempo,
            align: "left",
          },
          {
            name: "status",
            label: "Status",
            field: (row) => row.status,
            align: "left",
            sortable: true,
          },
          {
            name: "note",
            label: "Note",
            field: (row) => row.note,
            align: "left",
          }
        );
      } else {
        x.push(
          {
            name: "namaSales",
            label: "Nama Sales",
            field: (row) => row.namaSales,
            sortable: true,
          },
          {
            name: "namaAkunBayar",
            label: "Akun Jurnal",
            field: (row) => row.namaAkunBayar,
            align: "left",
            style: "white-space: normal !important",
            headerStyle: "width: 400px !important",
          },
          {
            name: "nomorPO",
            label: "Nomor Pesanan",
            field: (row) => row.nomorPO,
            sortable: true,
          },
          {
            name: "tglTempo",
            label: "Tgl Tempo",
            field: (row) => row.tglTempo,
            align: "left",
          },
          {
            name: "status",
            label: "Status",
            field: (row) => row.status,
            align: "left",
          },
          {
            name: "note",
            label: "Note",
            field: (row) => row.note,
            align: "left",
          }
        );
      }

      /* if (this.filt.ac === 'Y') {
        x[3].field = row => row.cabLain
      } */
      return x;
    });
    const cabAsi = computed(() => {
      return dt.cabAll.filter((a) => a.compCode === "ASI");
    });
    onMounted(() => {
      dtCab().then(({ data }) => {
        dt.cabAll = data;
        getTrx();
      });
      carikar().then(({ data }) => {
        dt.dtSales = data;
      });
    });
    const getTrx = () => {
      dt.dataTrx = [];
      dt.filt.tgla = dt.tgl && dt.tgl.from ? dt.tgl.from : dt.tgl || new Date();
      dt.filt.tglb = dt.tgl && dt.tgl.from ? dt.tgl.to : dt.tgl || new Date();
      dt.filt.jnsTrx = props.jnsTrx;
      dt.filt.kodeCab = [root.$store.state.auth.setCabang];
      /* if (dt.perPartner) {
        rkpTransaksiS(dt.filt)
          .then(({ data }) => {
            dt.rkpTrx = data
          })
      } */
      if (dt.filt.kodeCab[0] !== "") {
        dtTrx(dt.filt)
          .then(({ data }) => {
            const aa = [...new Set(data.map((a) => a.namaPartner))];
            dt.rkpTrx = aa.map((a) => {
              return {
                namaPartner: a,
                kodePartner: data.find((s) => s.namaPartner === a).kodePartner,
                kategoriCust: data.find((s) => s.namaPartner === a)
                  .kategoriCust,
                totalHarga: data
                  .filter((s) => s.namaPartner === a)
                  .reduce((c, b) => root.$dwn.jumlah([c, b.totalHarga]), 0),
                totalAkhir: data
                  .filter((s) => s.namaPartner === a)
                  .reduce((c, b) => root.$dwn.jumlah([c, b.totalAkhir]), 0),
                totalPoint: data
                  .filter((s) => s.namaPartner === a)
                  .reduce((c, b) => root.$dwn.jumlah([c, b.totalPoint]), 0),
              };
            });
            dt.dataTrx = data;
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        root.$q.notify({ message: "pilih cabang dulu...", color: "purple" });
      }
      // }
    };
    watch(
      () => root.$store.state.auth.setCabang,
      (newVal, oldVal) => {
        dt.filt.kodeCab = [newVal];
        getTrx();
      }
    );
    const getdetTrx = (x, y) => {
      if (!y) {
        dt.pr = x;
        dt.pot.diskon = x.diskon;
        dt.pot.akunDiskon = x.akunDiskon || "510100005";
        dt.exp.partnerID = x.partnerID;
        dt.exp.namaExpedisi = x.namaExpedisi;
        dt.exp.biaya = x.ongkir === "Y" ? x.biaya : 0;
        dt.detTrx.forEach((a, b, c) => {
          if (a.nomorBukti === x.nomorBukti) {
            c.splice(b);
          }
        });
        detTrx(x)
          .then((res) => {
            dt.detTrx.push(
              ...res.data /* .map(a => {
              a.kemasan = JSON.parse(a.kemasan) || []
              return a
            }) */
            );
          })
          .catch((err) => {
            console.log(err);
            root.$q.notify({
              message: `${err.response.data.st}`,
              color: "purple",
            });
          });
      }
    };
    const getJur = (x) => {
      x.cab = x.ancab === "Y" && props.jnsTrx === "B" ? x.tujuan : x.asal;
      x.jnsTrx = props.jnsTrx;
      getJurtrans(x)
        .then(({ data }) => {
          dt.detJur = data;
          dt.jh = data[0];
          dt.jh.tglJurnal = dt.jh.tgl || "";
        })
        .catch((err) => {
          console.log(err);
        });
    };
    const onReset = () => {
      dt.pr = { tglRequest: "" };
      dt.detTrx = [];
    };
    const onpil = (x) => {
      if (x.kodeProduk) {
        x.qty = 0;
        dt.detTrx.push(x);
      }
    };
    const ubahTgl = (x) => {
      dt.ubahT = { ...x };
      dt.ubT = true;
    };
    const ubahTrx = (x, y) => {
      x.jnsEdit = y;
      editTglTrx(x)
        .then((res) => {
          root.$q.notify({ message: `${res.data.st}`, color: "teal" });
          getTrx();
        })
        .catch((err) => {
          console.log(err);
          root.$q.notify({
            message: `${err.response.data.st}`,
            type: "warning",
          });
        });
    };
    const ubahSales = (x) => {
      root.$q
        .dialog({
          title: `Ubah Sales : ${x.nomorBukti}`,
          message: `Sales awal ${x.namaSales} menjadi ${x.gantiSales.namaKaryawan} ?`,
          options: {
            type: "radio",
            model: "konfr",
            // inline: true
            items: [
              { label: "Ya", value: "Y", color: "secondary" },
              { label: "Tidak", value: "B", color: "red" },
            ],
            isValid: (val) => ["Y", "B"].some((a) => a === val),
          },
          ok: {
            push: true,
          },
          persistent: false,
        })
        .onOk((data) => {
          let z = {
            nomorBukti: x.nomorBukti,
            namaSales: x.namaSales,
            salesBaru: x.gantiSales.salesID,
            namaSalesBaru: x.gantiSales.namaKaryawan,
          };
          if (data === "Y") {
            gantiSales(z)
              .then((res) => {
                root.$q.notify({ message: `${res.data.st}`, color: "teal" });
                getTrx();
              })
              .catch((err) => {
                console.log(err);
                root.$q.notify({
                  message: `${err.response.data.st}`,
                  color: "orange",
                });
              });
          }
        });
    };
    const buka = (x) => {
      const st = x.ancab === "Y" && x.status === "T" ? "D" : "W";
      const z = { ...x };
      root.$q
        .dialog({
          title: `Buka transaksi nomor : ${x.nomorBukti}`,
          message: "",
          options: {
            type: "radio",
            model: "konfr",
            // inline: true
            items: [
              { label: "Ya", value: "Y", color: "secondary" },
              { label: "Tidak", value: "B", color: "red" },
            ],
            isValid: (val) => ["Y", "B"].some((a) => a === val),
          },
          ok: {
            push: true,
          },
          persistent: false,
        })
        .onOk((data) => {
          z.status = st;
          if (data === "Y") {
            perbaiki(z)
              .then((res) => {
                root.$q.notify({ message: `${res.data.st}`, color: "teal" });
                getTrx();
              })
              .catch((err) => {
                console.log(err);
                root.$q.notify({
                  message: `${err.response.data.st}`,
                  color: "orange",
                });
              });
          }
        });
    };
    const tompo = (x) => {
      // const cc = dt.cabAll.find(a => a.kodeCab === x.cabID)
      if (
        (x.ancab === "Y" &&
          x.asal === root.$store.state.auth.user.kodeCab &&
          x.status === "D") ||
        (x.ancab === "Y" &&
          x.tujuan === root.$store.state.auth.user.kodeCab &&
          x.status === "W")
      ) {
        root.$q.notify({
          message: "Yang berhak menerima cabang pembeli...",
          color: "warning",
        });
      } else if (
        props.jnsTrx === "J" &&
        ["tempo", "Bank", "EDC", "eMoney"].includes(x.ct) &&
        !["MAN", "purchase", "mitra", "acc"].includes(
          root.$store.state.auth.user.userType
        ) &&
        x.ancab !== "Y" &&
        x.ecommerce !== "Y"
      ) {
        // console.log(cabPilih.spk, )
        root.$q.notify({ message: "Konfirm ke HO dulu...", color: "warning" });
      } else if (
        (x.ancab === "Y" &&
          ((x.tujuan === root.$store.state.auth.user.kodeCab &&
            x.status === "D") ||
            x.status === "W")) ||
        x.status === "W"
      ) {
        root.$q
          .dialog({
            title: `Konfirmasi Nomor Bukti : ${
              x.nomorBukti
            } <br><span class="text-accent text-italic"> Telp PIC: ${
              x.telpPIC || x.tlp
            }</span>`,
            message: "",
            options: {
              type: "checkbox",
              model: ["T"],
              // inline: true
              items: [
                { label: "Terima", value: "T", color: "secondary" },
                { label: "Batal", value: "B", color: "red" },
              ],
              isValid: (val) => {
                let ss = val.filter((v) => v === "T" || v === "B");
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
            if (x.status === "D" && data.some((s) => s === "B")) {
              root.$q.notify({
                message: "Abaikan bila tidak menerima barang...",
                color: "teal",
              });
            } else {
              x.status =
                x.ancab === "Y" &&
                x.asal === root.$store.state.auth.user.kodeCab &&
                data.some((s) => s === "T")
                  ? "D"
                  : data.some((s) => s === "B")
                  ? "B"
                  : "T";
              x.wa = data.find((s) => s === "Y");
              // console.log(x.wa)
              konfirm(x)
                .then((res) => {
                  root.$q.notify({ message: `${res.data.st}`, color: "teal" });
                  getTrx();
                })
                .catch((err) => {
                  console.log(err);
                });
            }
          })
          .onCancel(() => {})
          .onDismiss(() => {});
      } else {
        root.$q.notify({
          message: "Harus diterima admin cabang...",
          color: "warning",
        });
      }
    };
    const updPoint = async (x) => {
      // let det = dt.detTrx.filter(a => a.nomorBukti === x.nomorBukti)
      const { data } = await detTrx(x);
      const det = data.map((a) => {
        a.jmlPoint =
          x.point === "Y" &&
          x.ac === "N" &&
          x.cabID !== "AM01" &&
          x.ancab !== "Y"
            ? (a.pointMember * (a.qty * a.hargaSat)) / 100
            : 0;
        // a.kemasan = JSON.parse(a.kemasan) || []
        return a;
      });
      const totalPoint = det.reduce((a, b) => a + b.jmlPoint, 0);
      root.$q
        .dialog({
          title: `Update point membership : ${
            x.nomorBukti
          } <br><span class="text-accent text-italic"> Total Point Awal: ${x.totalPoint.toLocaleString()}</span>
        <br><span class="text-accent text-italic"> Total Point Update: ${totalPoint.toLocaleString()}</span>`,
          message: "",
          options: {
            type: "radio",
            model: "konfr",
            // inline: true
            items: [
              { label: "Terima", value: "T", color: "secondary" },
              { label: "Batal", value: "B", color: "red" },
            ],
            isValid: (val) => ["T", "B"].some((a) => a === val),
          },
          ok: {
            push: true,
          },
          html: true,
          persistent: false,
        })
        .onOk((data) => {
          if (data === "T") {
            repairPoint({ hd: x, det: det })
              .then((res) => {
                root.$q.notify({ message: `${res.data.st}`, color: "teal" });
                getTrx();
              })
              .catch((err) => {
                console.log(err);
                root.$q.notify({
                  message: `${err.response.data.st}`,
                  color: "warning",
                });
              });
          }
        });
    };
    const repairJurnalServis = (x) => {
      console.log(x);
      cekRabalanceServis(x)
        .then((res) => {
          root.$q.notify({ message: `${res.data.st}`, color: "teal" });
        })
        .catch((err) => {
          console.log(err);
        });
    };
    const cekLog = (x, y) => {
      getLog({ ...x, bukti: y })
        .then(({ data }) => {
          dt.userLog = data;
        })
        .catch((err) => {
          console.log(err);
        });
    };
    const dataLamp = (x) => {
      root.$axios
        .get("/buktiTransaksi?", { params: { key: x.nomorBukti } })
        .then(({ data }) => {
          dt.lampTrans = data;
        });
    };
    const downLamp = (x) => {
      root.$axios
        .get("/lampiranTransaksi", { params: { key: x } })
        .then(async (res) => {
          // const oke = await fetch(`data:${x.extensi};base64,${res.data}`)
          FileSaver.saveAs(await base64toBlob(res.data, "base64"), x.fileName);
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
    const getLamp = (x) => {
      dt.pr = { ...x };
      dataLamp(x);
      dt.lamp = true;
    };
    return {
      ...toRefs(dt),
      getLamp,
      dataLamp,
      downLamp,
      cekLog,
      cabPilih,
      repairJurnalServis,
      updPoint,
      ubahSales,
      buka,
      tompo,
      ubahTrx,
      ubahTgl,
      cabAsi,
      jdl,
      jenis,
      totalQty,
      totalAll,
      opac,
      totalHarga,
      getTrx,
      getdetTrx,
      getJur,
      onReset,
      onpil,
      rekapTransaksi,
      transaksi,
      jenisCust,
    };
  },
  /* computed: mapState(['setCabang']),
  watch: { cab
    setCabang (newValue, oldValue) {
      console.log(`Updating from ${oldValue} to ${newValue}`)

      // Do whatever makes sense now
    }
  }, */
  methods: {
    cariSales(x) {
      carikar(x.kodeCab).then(({ data }) => {
        this.dtSales = data;
      });
    },
    filterFns(val, update) {
      if (val === "") {
        update(() => {
          this.pilihSales = this.dtSales;

          // with Quasar v1.7.4+
          // here you have access to "ref" which
          // is the Vue reference of the QSelect
        });
        return;
      }

      update(() => {
        const needle = val.toLowerCase();
        this.pilihSales = this.dtSales.filter(
          (v) =>
            v.namaKaryawan.toLowerCase().indexOf(needle) > -1 ||
            v.namaCabang.toLowerCase().indexOf(needle) > -1
        );
      });
    },
    ondel(item) {
      const index = this.detTrx.indexOf(item);
      let cf = confirm(`Hapus ${item.kodeProduk} ?`);
      console.log(index, cf);
      if (cf) {
        this.detTrx.splice(index, 1);
        /* if (item.iddetTrx) {
          api.delPRd(item)
            .then(res => this.$q.notify({ message: 'Data tersimpan', color: 'success' }))
            .catch(err => this.$q.notify({ message: 'Gagal simpan...' }))
        } */
      }
    },
    prnt() {
      if (typeof cordova !== "undefined") {
        cordova.plugins.printer.setDefaults({ monochrome: true });
        cordova.plugins.printer.print();
      } else {
        window.print();
      }
    },
    terima(x) {
      if (
        this.pr.ac === "Y" &&
        this.pr.asal === this.$store.state.auth.setCabang &&
        x === "T"
      ) {
        this.$q.notify({
          message: "Yang berhak menerima cabang pembeli...",
          color: "warning",
        });
      } else {
        if (this.pr.status === "W") {
          this.$q
            .dialog({
              title: `Konfirmasi ${x === "T" ? "Penerimaan" : "Batal"}`,
              message: `${x === "T" ? "Terima" : "Batal"} ?`,
              /* cancel: {
              label: 'Batal',
              color: 'negative'
            }, */
              ok: {
                push: true,
              },
              persistent: false,
            })
            .onOk(() => {
              this.pr.status = x;
              konfirm(this.pr)
                .then((res) => {
                  this.$q.notify({ message: `${res.data.st}`, color: "teal" });
                })
                .catch((err) => {
                  console.log(err);
                });
            })
            .onCancel(() => {
              /* console.log('cancel')
            this.pr.status = 'B'
            konfirm(this.pr)
              .then(res => {
                this.$q.notify({ message: `${res.data.st}`, color: 'teal' })
                  .catch(err => {
                    console.log(err)
                  })
              }) */
            })
            .onDismiss(() => {
              // console.log('I am triggered on both OK and Cancel')
            });
        }
      }
    },
    toDown() {
      const jd = [...this.jdl, { name: "akunBayar", label: "Akun Bayar" }];
      let x = {
        judul: `Data transaksi ${this.jenis.judul} `,
        dt: this.transaksi,
        hdr: this.perPartner ? this.jdlp : jd,
        naFile: `transaksi${this.jenis.judul}`,
      };
      this.$dwn.toExcel(x);
    },
    returBarang(x) {
      this.selected = x;
      this.reT = true;
      detTrxR(x)
        .then((res) => {
          let a = res.data;
          for (let i in a) {
            a[i].hargaSat = a[i].jmlHarga / a[i].qty;
            a[i].stok = a[i].qty - a[i].jmlRetur;
            a[i].tppn = a[i].ppn > 0 ? a[i].ppn / a[i].stok : 0;
            a[i].tdpp = a[i].dpp / a[i].stok;
            a[i].thpp = a[i].hpp / a[i].stok;
            a[i].qty = 0;
          }
          this.detRet = a;
        })
        .catch((err) => {
          console.log(err);
          this.$q.notify({
            message: `${err.response.data.st}`,
            color: "purple",
          });
        });
    },
    editJubel(x) {
      if (
        x.ac === "Y" &&
        this.jnsTrx === "B" &&
        !["MAN", "purchase", "acc"].some(
          (a) => a === this.$store.state.auth.user.userType
        )
      ) {
        this.$q.notify({
          message: "Yang berhak edit cabang penjual...",
          color: "warning",
        });
      } else {
        this.exp.partnerID = x.partnerID;
        this.exp.biaya = x.biaya;
        this.pot.diskon = x.diskon;
        this.pot.akunDiskon = x.akunDiskon || "510100005";
        detTrx(x)
          .then(({ data }) => {
            this.detTrx = data; /* .map(a => {
              a.kemasan = JSON.parse(a.kemasan)
              return a
            }) */
            this.jh = x;
            x.cabLain = x.jnsTrx === "J" ? x.tujuan : x.asal;
            x.tgl = x.tglKirim;
            this.plgn = { namaPartner: x.namaPartner, alamat: x.alamat };
            this.edjb = true;
          })
          .catch((err) => {
            console.log(err);
            this.$q.notify({
              message: `${err.response.data.st}`,
              color: "purple",
            });
          });
      }
    },
    cetak(x) {
      this.ctk = x;
      this.confirm = true;
    },
    async printA4(x) {
      // let bankCabang = ''
      console.log(x);
      let { data } = await getBankCab(x.cabID);
      let bankCabanga = data.map((s) => {
        let ss = `<li>${s.namaBank}: ${s.rekening} a.n ${s.atasNama}</li>`;
        return ss;
      });
      let cabA =
        this.jnsTrx === "J" && x.asal === x.cabID
          ? this.cabAll.find((a) => a.kodeCab === x.cabID)
          : this.cabAll.find((a) => a.kodeCab === x.tujuan);
      let bankCabang = await bankCabanga.toString().replace(/,/g, "");
      /* console.log(data)
      getBankCab(x.cabID)
        .then(res => {
          res.data.forEach(a => {
            // bankCabang
            console.log(bankCabang)
          })
        }) */
      let detail = await detTrx(x);
      let tdpp = detail.data.reduce(
        (a, b) => this.$dwn.jumlah([a, b.dpp, -b.hrgRetur]),
        0
      );
      let tppn = detail.data.reduce((a, b) => this.$dwn.jumlah([a, b.ppn]), 0);
      let wd = window.open("", "InvoiceA4", "resize = 1");
      let html = `<html>
        <title>Cetak Nota ${this.jenis.judul}</title>
        <style>
        #tss{
          font-size: 12px;

        }
        #tss tr td{
          font-size: 12px;
        }
        .bdr_btm{
          border-bottom: 1px solid #000;
          font-size: 12px;
        }
        .text-right{
          text-align: right
        }

        .bdr_top{
          border-top: 1px solid #000;
          font-size: 12px;
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

          <table width='100%' id="tss" class="report-container" >
            <thead class="report-header">
            <tr>
              <td colspan="3" width='60%' valign="top">

                <table width="100%">
                  <tr>
                    <td>
                      <img src="/statics/logo/${
                        cabA.kodeCab
                      }.png" alt="" style="width:8%">
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <b>${cabA.namaCabang.toUpperCase()}</b>
                    </td>
                  </tr>
                  <tr>
                    <td st>
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
              <td align='right'>
                <table width="100%" >
                  <tr>
                    <td colspan="4">
                      <b><i>${this.jenis.partner}</i></b>
                    </td>
                  </tr>
                  <tr>
                    <td width='100%' colspan="4">${x.namaPartner}</td>
                  </tr>
                  <tr>
                    <td width='100%' colspan="4">
                      ${x.alamat || ""}
                    </td>
                  </tr>

                  <tr>
                    <td width='100%' colspan="4">${x.tlp || ""}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td colspan="4" class="">
                <table width='100%' class="bdr_top">
                  <tr>
                    <td colspan="3">
                      <h1>
                        <b>INVOICE #${x.nomorBukti}</b>
                      </h1>
                    </td>
                    <td align="right">
                      <b>Date Ordered:</b><br/>${new Date(x.tglKirim)
                        .toLocaleString("en-GB")
                        .slice(0, 10)}
                    </td>
                  </tr>
                  <tr>
                    ${
                      this.jnsTrx === "J"
                        ? '<td width="15%"><b>Sales person:</b><br/>' +
                          x.namaSales +
                          `</td><td><b>Payment:</b><br/>${x.ct}</td> `
                        : ""
                    }
                  </tr>
                </table>
              </td>
            </tr>
            </thead>
            <tr>
              <td rowspan="" colspan="4" class="">
                <br/><br/>
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
          ).format(Number(det.jmlKemasan).toFixed(2))} ${
          det.kemasan.kemasan
        }</td>
          <td align="right" style='text-align: right'>${new Intl.NumberFormat(
            "en"
          ).format(Number(det.dpp / det.jmlKemasan).toFixed(2))}</td>
          <td align="right" style='text-align: right'>${new Intl.NumberFormat(
            "en"
          ).format(Number(det.dpp - det.hrgRetur).toFixed(2))}</td>
        </tr>`;
      });
      let ttpj = `<table width='100%' >
                  <tr>
                    <td width='60%' valign="top">
                      <b>
                        <i>
                          Terbilang : ${this.$dwn.bilang(
                            Number(x.totalAkhir).toFixed(2)
                          )}
                        </i>
                      </b>`;
      let note =
        x.jnsTrx === "J" && x.ancab !== "Y"
          ? `
                      <div style='border : 1px dotted #000000; padding:10px' width='60%'>
                        Note : Pembayaran dapat dilakukan melalui:
                        <ul>
                          ${bankCabang}
                        </ul>
                        ${
                          ["tempo", "Bank"].includes(x.ct) && x.jnsTrx === "J"
                            ? cabA.noteNota
                            : ""
                        }
                        <br/>Catatan tambahan : ${x.note || ""}
                      </div>`
          : "";
      let ttpNote = `
                    </td>
                    <td align="right" valign="top">
                      <table width="100%" >
                        <td width='50%' align='right'><b>Total</b></td>
                        <td width='50%' align='right'><b>${new Intl.NumberFormat(
                          "en"
                        ).format(Number(tdpp).toFixed(2))}</b></td>`;
      let ttpPpn =
        Number(tppn) > 0 &&
        `<tr>
                            <td align='right'><b>Total PPN</b></td>
                            <td align='right'><b>${new Intl.NumberFormat(
                              "en"
                            ).format(Number(Number(tppn).toFixed(2)))}</b></td>
                          </tr>`;
      let ttpUM =
        x.uangMuka &&
        `<tr>
                            <td align='right'><b>Uang Muka</b></td>
                            <td align='right'><b></b></td>
                          </tr>`;
      let ttpDiskon =
        x.diskon &&
        `<tr>
                            <td align='right'><b>Diskon</b></td>
                            <td align='right'><b><span contenteditable="">- ${new Intl.NumberFormat(
                              "en"
                            ).format(
                              Number(x.diskon || 0).toFixed(2)
                            )}</span></b></td>
                          </tr>`;
      let ttpxBiaya =
        x.biaya &&
        `<tr>
                            <td align='right'><b>Ongkos Kirim</b></td>
                            <td align='right'><b><span style="text-decoration: ${
                              x.ongkir === "N" ? "line-through" : ""
                            }">${new Intl.NumberFormat("en").format(
          Number(x.biaya || 0).toFixed(2)
        )}</span></b></td>
                          </tr>`;
      let ttpTotal =
        x.totalAkhir !== tdpp &&
        `<tr>
                            <td align='right'><b>Jumlah Pembayaran</b></td>
                            <td align='right' style="border-top: double black;"><b>${new Intl.NumberFormat(
                              "en"
                            ).format(
                              Number(Number(x.totalAkhir).toFixed(2))
                            )}</b></td>
                          </tr>`;
      let ttpJ =
        this.jnsTrx === "J" &&
        `</table>
                    </td>
                  </tr>
                </table>`;
      let ttp = `</table>
              </td>
            </tr>
            <tr>
              <td colspan="4">
              ${ttpj} ${note} ${ttpNote} ${
        (ttpPpn || "") +
        (ttpUM || "") +
        (ttpDiskon || "") +
        (ttpxBiaya || "") +
        (ttpTotal || "") +
        (ttpJ || "")
      }
              </td>
            </tr>
            <tr>
              <td colspan="4" align='center'>
                <table width='90%' align='center'>
                  <tr>
                    <td >

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
        </table>
        <div id=man style="border:1px solid red;background-color:silver;padding:5px;width:80%;">
          Pengaturan Printer Epson LX 310: <hr>
          <ul>
            <li>Ukuran kertas 21 cm * 14.8 cm / A4 tanpa header dan footer</li>
            <li>DPI 120 * 144</li>
            <li>Cetak menggunakan browser Mozilla</li>
          </ul>
          <hr>
          <button type=button onclick='window.print();'>Cetak Nota ${
            this.jenis.judul
          }</button>
        </div>

        </body>
        </html>`;
      html += dtDet + ttp;
      if (typeof cordova !== "undefined") {
        cordova.plugins.printer.print(html);
      } else {
        wd.document.open();
        wd.document.write(html);
        wd.document.close();
      }
    },
    async printSjln(x, z) {
      /* let { data } = await getBankCab(x.cabID)
      let bankCabang = await data.map(s => {
        let ss = `<li>${s.namaBank}: ${s.rekening} a.n ${s.atasNama}</li>`
        return ss
      }) */
      let detail = await detTrx(x);
      let tqty = detail.data.reduce(
        (a, b) => this.$dwn.jumlah([a, b.jmlKemasan]),
        0
      );
      let cabA =
        this.jnsTrx === "J" && x.asal === x.cabID
          ? this.cabAll.find((a) => a.kodeCab === x.cabID)
          : this.cabAll.find((a) => a.kodeCab === x.tujuan);
      let wd = window.open("", "SuratJalan", "resize = 1");
      let html = `<html>
        <title>Cetak Nota ${this.jenis.judul} ${x.nomorBukti}</title>
        <style>
        #tss{
          font-size: 12px;

        }
        #tss tr td{
          font-size: 12px;
        }
        .bdr_btm{
          border-bottom: 1px solid #000;
          font-size: 12px;
        }

        .bdr_top{
          border-top: 1px solid #000;
          font-size: 12px;
        }
        #table_product th {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #000;
        }
        #table_product td {
          padding: 8px;
          border-bottom: 1px solid #ddd;
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
              <td colspan="3" width='60%' valign="top">

                <table width="100%">
                  <tr>
                    <td>
                      <img src="/statics/logo/${
                        cabA.kodeCab
                      }.png" alt="" style="width:8%">
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <b>${cabA.namaCabang.toUpperCase()}</b>
                    </td>
                  </tr>
                  <tr>
                    <td st>
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
              <td align='right'>
                <table width="100%" >
                  <tr>
                    <td colspan="4">
                      <b><i>${this.jenis.partner}</i></b>
                    </td>
                  </tr>
                  <tr>
                    <td width='100%' colspan="4">${x.namaPartner}</td>
                  </tr>
                  <tr>
                    <td width='100%' colspan="4">
                      ${x.alamat || ""}
                    </td>
                  </tr>

                  <tr>
                    <td width='100%' colspan="4">${x.tlp || ""}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td colspan="4" class="">
                <table width='100%' class="bdr_top">
                  <tr>
                    <td width="50%">
                      <h1>
                        <b>Dokumen Pengiriman <br/> #${x.nomorBukti}</b>
                      </h1>
                    </td>
                    <td width="20%"><b>Date Ordered:</b><br/>${new Date(
                      x.tglKirim
                    )
                      .toLocaleString("en-GB")
                      .slice(0, 10)}</td>
                    <td width="50%"><b>Delivery Date:</b><br/>${new Date(
                      x.tglKirim
                    )
                      .toLocaleString("en-GB")
                      .slice(0, 10)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            </thead>
            <tr>
              <td rowspan="" colspan="4" class="">
                <br/>
                <table width='100%' id="table_product">
                  <thead class="report-header">
                  <tr>
                    <th>Deskripsi Barang</th>
                    <th width='10%' style="text-align: right">Quatity</th>
                  </tr>
                  </thead>`;
      let dtDet = "";
      detail.data.forEach((det, i) => {
        det.SN = JSON.parse(det.SN);
        let snn = "";
        if (det.SN.length && z) {
          snn =
            "<ol>Serial No." +
            det.SN.map((s, i) => {
              return `<li>${s}</li>`;
            }).toString() +
            "</ol>";
        }
        dtDet += `<tr>
          <td>${(i + 1).toString().padStart(3, " ")}. ${
          det.namaBarang
        } ${snn.replace(/\,/gi, "")}</td>
          <td style="text-align: right">${new Intl.NumberFormat("en").format(
            Number(det.jmlKemasan).toFixed(2)
          )} ${det.kemasan.kemasan}</td>
        </tr>`;
      });
      let ttp = `</table>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <table width='100%' >
                  <tr>
                    <td width='60%' valign="top">
                    </td>
                    <td align="right" valign="top">
                      <table width="100%" >
                        <td width='60%' align='right' colSpan="2"><b>Jumlah Produk</b></td>
                        <td width='50%' align='center'><b>${new Intl.NumberFormat(
                          "en"
                        ).format(Number(tqty).toFixed(2))}</b></td>
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
                    <td align='center'>
                      Disiapkan<br/>
                      <br/><br/><br/><br/>
                      (${this.$store.state.auth.user.nama})
                  </td>
                  <td width='33.3%' align='center'>
                    Dikirim Oleh<br/>
                    <br/><br/><br/><br/>
                    (.........................)
                  </td>
                  <td width='33.3%' align='center'>
                    Diterima<br/>
                    <br/><br/><br/><br/>
                    (.........................)
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>Catatan : ${x.note || ""}
            </br>
            ${cabA.noteNota}
            </td>
          </tr>
        </table>
        <div id=man style="border:1px solid red;background-color:silver;padding:5px;width:80%;">
          Pengaturan Printer Epson LX 310: <hr>
          <ul>
            <li>Ukuran kertas 21 cm * 14.8 cm / A4 tanpa header dan footer</li>
            <li>DPI 120 * 144</li>
            <li>Cetak menggunakan browser Mozilla</li>
          </ul>
          <hr>
          <button type=button onclick='window.print();'>Cetak Nota ${
            this.jenis.judul
          }</button>
        </div>

        </body>
        </html>`;
      html += dtDet + ttp;
      if (typeof cordova !== "undefined") {
        cordova.plugins.printer.print(html);
      } else {
        wd.document.open();
        wd.document.write(html);
        wd.document.close();
      }
    },
    async printW(x) {
      let { data } = await getBankCab(x.cabID);
      let bankCabanga = data.map((s) => {
        let ss = `<li>${s.namaBank}: ${s.rekening} a.n ${s.atasNama}</li>`;
        return ss;
      });
      let bankCabang = await bankCabanga.toString().replace(/,/g, "");
      let cabA =
        this.jnsTrx === "J" && x.asal === x.cabID
          ? this.cabAll.find((a) => a.kodeCab === x.cabID)
          : this.cabAll.find((a) => a.kodeCab === x.tujuan);
      let detail = await detTrx(x);
      let tdpp = detail.data.reduce(
        (a, b) => this.$dwn.jumlah([a, b.dpp, -b.hrgRetur]),
        0
      );
      let tppn = detail.data.reduce((a, b) => this.$dwn.jumlah([a, b.ppn]), 0);
      let wd = window.open("", "transPrint", "resize = 1");
      let html = `<html><head>`;
      let dtPrint = `
        <title>Transaksi ${this.jenis.judul} ${x.nomorBukti}</title>
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
                                <b>NOTA ${this.jenis.judul.toUpperCase()}</b>
                            </td>
                        </tr>
                        <tr>
                            <td width="35%">ID ${this.jenis.judul}</td>
                            <td>: ${x.nomorBukti}</td>
                        </tr>
                        <tr>
                            <td>Tanggal </td>
                            <td>: ${new Date(x.tglKirim)
                              .toLocaleString("en-GB")
                              .slice(0, 10)}</td>
                        </tr>
                        <tr>
                            <td>Pembayaran </td>
                            <td>: ${x.ct || ""}</td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td colspan="4" class="bdr_btm">
                    <table width='100%'>
                        <tr>
                            <td width='15%'>Nama ${this.jenis.partner}</td>
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
                            <td>: ${x.tlp || ""}</td>
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
                            <td width='10%' class="bdr_btm">Serial Number</td>
                            <td width='10%' class="bdr_btm" align='right'>QTY</td>
                            <td width='10%' class="bdr_btm" align='right'>Harga</td>
                            <td width='10%' class="bdr_btm" align='right'>Jumlah</td>
                        </tr>
                      </thead>
                      <tbody>`;
      let dtDet = "";
      detail.data.forEach((det, i) => {
        dtDet += `<tr>
            <td>${i + 1}</td>
            <td>${det.namaBarang}</td>
            <td>${det.keterangan}</td>
            <td align='right'>${new Intl.NumberFormat("en").format(
              Number(det.jmlKemasan).toFixed(2)
            )} ${det.kemasan.kemasan}</td>
            <td align='right'>${new Intl.NumberFormat("en").format(
              Number(det.dpp / det.jmlKemasan).toFixed(2)
            )}</td>
            <td align='right'>${new Intl.NumberFormat("en").format(
              Number(det.dpp - det.hrgRetur).toFixed(2)
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
                        <tr>`;
      let note =
        x.jnsTrx === "J" && x.ancab !== "Y"
          ? `
                            <td style='border : 1px dotted #000000; padding:10px' width='60%'>
                              Pembayaran dapat dilakukan melalui:
                              <ul>
                                ${bankCabang}
                              </ul>
                              ${cabA.noteNota}
                              Catatan tambahan : ${x.note || ""}
                            </td>`
          : `<td></td>`;
      let ttpNote =
        `<td align="right" valign="top">
                                <table width="100%" >` +
        (this.$dwn.jumlah([x.totalAkhir, this.exp.biaya]) !== tdpp
          ? `<td width='40%' align='right'><b>Total</b></td>
                                    <td width='60%' align='right'><b>${new Intl.NumberFormat(
                                      "en"
                                    ).format(Number(tdpp).toFixed(2))}</b></td>`
          : "") +
        (tppn > 0
          ? `<tr>
                                            <td align='right'><b>Total PPN</b></td>
                                            <td align='right' style="text-decoration : underline; text-decoration-style: double;"><b>${new Intl.NumberFormat(
                                              "en"
                                            ).format(
                                              Number(tppn).toFixed(2)
                                            )}</b></td>
                                        </tr>`
          : "") +
        (x.uangMuka > 0
          ? `<tr>
                                            <td align='right'><b>Uang Muka</b></td>
                                            <td align='right'><b>0</b></td>
                                        </tr>`
          : "") +
        (x.diskon > 0
          ? `<tr>
                                            <td align='right'><b>Diskon</b></td>
                                            <td align='right'><b>- ${new Intl.NumberFormat(
                                              "en"
                                            ).format(
                                              Number(x.diskon || 0).toFixed(2)
                                            )}</b></td>
                                        </tr>`
          : "") +
        (this.pr.biaya > 0
          ? `<tr>
                                            <td align='right' style="${
                                              this.pr.ongkir === "N" &&
                                              "text-decoration : line-through; text-decoration-style: double;"
                                            }"><b>Biaya Kirim</b></td>
                                            <td align='right' style="${
                                              this.pr.ongkir === "N" &&
                                              "text-decoration : line-through; text-decoration-style: double;"
                                            }"><b>${new Intl.NumberFormat(
              "en"
            ).format(Number(this.pr.biaya).toFixed(2))}</b></td>
                                        </tr>`
          : "") +
        `<tr>
                                            <td align='right'><b>Jumlah Harus Dibayar</b></td>
                                            <td align='right' style="text-decoration : underline; text-decoration-style: double; ` +
        (this.$dwn.jumlah([x.totalAkhir, this.exp.biaya]) !== tdpp
          ? "border-top: double black;"
          : "") +
        `"><b>${new Intl.NumberFormat("en").format(
          Number(this.$dwn.jumlah([x.totalAkhir])).toFixed(2)
        )}</b></td>
                                        </tr>` +
        (this.pr.namaExpedisi
          ? `<tr>
                                            <td align='right'><b>Jasa Ekspedisi</b></td>
                                            <td align='right'><b><i>${
                                              this.pr.namaExpedisi || ""
                                            }</i></b></td>
                                        </tr>`
          : "") +
        `</table>
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
                                Diterima Oleh<br/>
                                <br/><br/><br/><br/>
                                ${
                                  this.jnsTrx === "J"
                                    ? x.namaPartner
                                    : this.$store.state.auth.user.nama
                                }
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
            <button type=button onclick='window.print();'>Cetak Nota ${
              this.jenis.judul
            }</button>
        </div>`;
      html += dtPrint + dtDet + ttp + note + ttpNote + "</body></html>";
      if (typeof cordova !== "undefined") {
        cordova.plugins.printer.print(html);
      } else {
        wd.document.open();
        wd.document.write(html);
        wd.document.close();
      }
    },
    getSPK(x) {
      const mimetype = x.mimetype ? x.mimetype.split("/")[1] : "pdf";
      this.$axios
        .get("/SPKFile?", {
          params: { key: x.spkFile },
          responseType: "arraybuffer",
        })
        .then(async (res) => {
          // const oke = await fetch(`data:${x.extensi};base64,${res.data}`)
          FileSaver.saveAs(new Blob([res.data]), `${x.nomorBukti}.${mimetype}`);
        });
    },
    toBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        // reader.onloadend = (e) => resolve(imageToDataUri(e, 400, 400))
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
    },
    factoryFn(file) {
      // returning a Promise
      // console.log(file)
      return new Promise((resolve, reject) => {
        this.toBase64(file[0])
          .then((data) => {
            // data is base64
            this.bukti.bukti = data;
            // console.log(data)
            resolve(data);
            /* setTimeout(() => {
              resolve({
                url: this.$axios.baseURL + '/uploadBuktiTrans',
                method: 'POST',
                headers: [{name:'Content-Type',value:'application/json'}],
                fields: [{name:'bukti',value:data, namaLampiran: this.lampTrans.namaLampiran, nomorBukti: this.lampTrans.nomorBukti}]
              })
            }, 2000) */
          })
          .catch(() => {
            this.$q.notify({
              color: "negative",
              message: "Failed to convert file...",
            });
            console.log("error");
            reject();
          });
      });
    },
    uploadFailed(req) {
      console.log("failed", req);
    },
    async uploadLamp(x) {
      // console.log(x.file)
      // let file = await this.toBase64(x.file)
      /* 
      const formData = new FormData()
      formData.append('namaLampiran', x.namaLampiran)
      formData.append('nomorBukti', x.nomorBukti)
      formData.append('bukti', x.bukti) */
      x.nomorBukti = this.pr.nomorBukti;
      this.$axios
        .post("/uploadBuktiTrans", { x })
        .then(({ data }) => {
          this.$q.notify({ message: data.st, color: "teal" });
          this.bukti = {
            file: null,
            namaLampiran: "",
            nomorBukti: "",
            bukti: null,
          };
          this.addLamp = false;
          this.dataLamp(x);
        })
        .catch((err) => {
          this.$q.notify({ message: err.response.data.st, type: "warning" });
        });
    },
    delLamp(x) {
      this.$q
        .dialog({
          title: "Konfirmasi Hapus",
          message: `Nama Lampiran : ${x.namaLampiran}`,
          options: {
            type: "radio",
            model: "hps",
            // inline: true
            items: [{ label: "Ya", value: "All", color: "secondary" }],
            isValid: (val) => ["All"].some((a) => a === val),
          },
          cancel: {
            label: "Batal",
            color: "orange-13",
            outline: true,
            rounded: true,
          },
          ok: {
            label: "Ok",
            color: "blue-13",
            outline: true,
            rounded: true,
          },
          persistent: true,
        })
        .onOk((data) => {
          x.hps = data;
          this.$axios
            .post("/delLamp", { x })
            .then(({ data }) => {
              this.$q.notify({ message: data.st, color: "teal" });
              this.dataLamp(x);
            })
            .catch((err) => {
              console.log(err);
              this.$q.notify({
                message: err.response.data.st,
                color: "warning",
              });
            });
          // console.log('>>>> OK, received', data)
        })
        .onCancel(() => {
          // console.log('>>>> Cancel')
        })
        .onDismiss(() => {
          // console.log('I am triggered on both OK and Cancel')
        });
    },
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
