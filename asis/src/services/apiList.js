import axios from "axios";

export const draftProduk = (x) => axios.post("/draftProduk", { x });
export const getDraftProduk = () => axios.post("/getDraftProduk");
export const prosesDraftProduk = () => axios.post("/prosesDraftProduk");
export const delDraftProduk = (x) => axios.post("/delDraftProduk", { x });
export const repair = (x) => axios.post("/repair", { x });
export const perbaiki = (x) => axios.post("/perbaiki", { x });
export const cekRabalanceServis = (x) =>
  axios.post("/cekRaBalanceServis", { x });

// module project
export const addJnsProject = (x) => axios.post("/jnsProject", { x });
export const getJnsProject = () => axios.get("/jnsProject");
export const inProject = (x) => axios.post("/inProject", { x });
export const getdetProject = (x) =>
  axios.get("/detProject", { params: { key: x } });
export const postdetProject = (x) => axios.post("/detProject", { x });
export const allDataProject = (x) => axios.post("/dataProject", { x });
export const projectApprove = (x) => axios.post("/projectApprove", { x });
export const delDetProject = (x) => axios.post("/delDetProject", { x });
export const hisBayarProject = (x) => axios.post("/hisBayarProject", { x });
export const projectDone = (x) => axios.post("/projectDone", { x });
export const getSketsa = (x) => axios.get("/sketsa?", { params: { key: x } });
export const ambilProject = (x) => axios.post("/ambilProject", { x });
export const upProject = (x) => axios.post("/upProject", { x });
export const rkpProject = (x) => axios.post("/rkpProject", { x });
export const saveProses = (x) => axios.post("/svProses", { x });
export const stopProses = (x) => axios.post("/stopProses", { x });
export const selesaiProses = (x) => axios.post("/endProses", { x });
export const simpanProc = (x) => axios.post("/simpanProses", { x });
export const proses = (x) => axios.post("/proses", { x });
export const taskData = (x) => axios.post("/taskData", { x });
export const getDataProject = (x) => axios.post("/getDtProject", { x });
export const getDetproj = (x) => axios.post("/getReportOperator", { x });
export const getLapProject = (x) => axios.post("/getReportProject", { x });
export const getdetail = (x) => axios.post("/getdetail", { x });
export const procRevisi = (x) => axios.post("/prosesRevisi", { x });

// module servis
export const dataServis = (x) => axios.post("/dataServis", { x });
export const inservis = (x) => axios.post("/inservis", { x });
export const serviceAll = (x) => axios.post("/serviceAll", { x });
export const stService = (x) => axios.get("/stService", { params: { key: x } });
export const addPartService = (x) => axios.post("/addPartService", { x });
export const delDetService = (x) => axios.post("/delDetService", { x });
export const partService = (x) => axios.post("/partService", { x });
export const upServis = (x) => axios.post("/upServis", { x });
export const getJnsService = () => axios.get("/jnsService");
export const addJnsService = (x) => axios.post("/jnsService", { x });
export const ambilService = (x) => axios.post("/ambilService", { x });
export const produkService = () => axios.get("/produkService");
export const updServis = (x) => axios.post("/updServis", { x });
export const serviceDone = (x) => axios.post("/serviceDone", { x });
export const serviceMsk = (x) => axios.post("/serviceMsk", { x });
export const serviceSelesai = (x) => axios.post("/serviceSelesai", { x });
export const serviceProses = (x) => axios.post("/serviceProses", { x });
export const pendingPart = (x) => axios.post("/pendingPart", { x });
export const serviceNotif = (x) => axios.post("/serviceNotif", { x });

export const cariSN = (x) => axios.get("/cariSN?", { params: { key: x } });
export const trxSN = (x) => axios.post("/trxSN", { x });
export const user = () => axios.get("/user");
export const dtUser = () => axios.get("/dtuser");
export const inUser = (x) => axios.post("/inuser", { x }); // x = { npp,namaKaryawan,alamat,ktp,telp,masuk,keluar,jabatan,kodeCab,email,userType,active }
export const upUser = (x) => axios.post("/upuser", { x });
export const upass = (x) => axios.post("/upass", { x });
export const carikar = (x) => axios.post("/carikar", { x });
export const inakun = (x) => axios.post("/inakun", { x });
export const upPhoto = (x) => axios.post("/photo", { x }); // upload photo profile x = { photo : }
export const cabang = () => axios.get("/cabang");
export const getBankCab = (x) => axios.post("/getBankCab", { x });
export const dtCab = () => axios.get("/dtcabang");
export const addCab = (x) => axios.post("/cabang", { x });
export const divCode = () => axios.get("/divcode");
export const company = () => axios.get("/company");
export const logout = () => axios.get("/logout");
export const dtProduk = (x) => axios.post("/dtproducts", { x }); // x = { kodeCab: '' }
export const addProduk = (x) => axios.post("/products", { x }); // x= {}
export const uphrg = (x) => axios.post("/uphrg", { x });
export const hisbar = (x) => axios.post("/hisbar", { x });
export const stok = (x, y) =>
  axios.get("/stok?", { params: { key: x, compID: y } });
export const stokall = (x) => axios.post("/stokAllBaru", { x });
export const umurstok = (x) => axios.post("/umurstok", { x });
export const mutasi = (x) => axios.post("/mutasi", { x });
export const crProduk = (x) => axios.get("/crproduk?", { params: { key: x } }); // x = nama produk.... example => printer
export const crstok = (x) => axios.get("/crstok?", { params: { key: x } });
export const crPartner = (x, y) =>
  axios.get("/crpartner?", { params: { key: x, jns: y } }); // x = nama partner, y= jenisPartner Ven / Cust

// PR
export const dtPR = (x) => axios.post("/dtpr", { x });
export const dtPesanan = () => axios.get("/dtpesanan");
export const detPR = (x) => axios.post("/detpr", { x });
export const rekPR = (x) => axios.post("/rekpr", { x }); // x= {nomorPR:''}
export const addPR = (x) => axios.post("/addPR", { x });
export const delPRd = (x) => axios.post("/delprdet", { x });
export const editPRd = (x) => axios.post("/editprdet", { x });
export const cekPR = (x) => axios.post("/cekPR", { x });
export const upPR = (x) => axios.post("/upPR", { x });

export const newNotif = () => axios.get("/newNotif");
// PO
export const dtPO = (x) => axios.post("/dtpo", { x });
// export const dtPesanan = () => axios.get('/dtpesanan')
export const detPO = (x) => axios.post("/detpo", { x });
export const rekPO = (x) => axios.post("/rekpo", { x }); // x= {nomorPR:''}
export const addPO = (x) => axios.post("/addPO", { x });
export const editPOd = (x) => axios.post("/editpodet", { x });
export const delPOd = (x) => axios.post("/delpodet", { x });
export const cekPO = (x) => axios.post("/cekPO", { x });
export const upPO = (x) => axios.post("/upPO", { x });
export const rkpPesanan = (x) => axios.post("/rekapPesanan", { x });
export const rkpPOnew = (x) => axios.post("/rkpPOnew", { x });

// Kongsi
export const addKongsi = (x) => axios.post("/addKongsi", { x });
export const rkpKongsi = (x) => axios.post("/rkpKongsi", { x });
export const dataKongsi = (x) => axios.post("/dataKongsi", { x });
export const detKongsi = (x) =>
  axios.get("/detKongsi?", { params: { key: x } });

// Pricing
export const addPricing = (x) => axios.post("/addPricing", { x });
export const dtPricing = (x) => axios.post("/dtpricing", { x });
export const detPricing = (x) =>
  axios.get("/detPricing", { params: { key: x } });
export const upPricing = (x) => axios.post("/upPricing", { x });
export const editPriceDet = (x) => axios.post("/editpricedet", { x });
export const delpricedet = (x) => axios.post("/delpricedet", { x });
export const rkpPricing = (x) => axios.post("/rkpPricing", { x });

export const transaksi = (x) => axios.post("/transaksi", { x });
export const pertrans = (x) => axios.post("/pertrans", { x });
export const exPartner = () => axios.get("/exPartner");
export const addJB = (x) => axios.post("/jualbeli", { x }); // x = {hd:{},det:[{}]}
export const dtTrx = (x) => axios.post("/dtTrx", { x }); // x =
export const updetTrans = (x) => axios.post("/updetTrans", { x });
export const editJB = (x) => axios.post("/editjualbeli", { x });
export const editDetJB = (x) => axios.post("/editDetJB", { x });
export const dtRetur = (x) => axios.post("/dtRetur", { x });
export const detTrxR = (x) => axios.post("/detTrxR", { x }); // x = {nomorBukti:''}
export const detTrx = (x) => axios.post("/detTrx", { x }); // x = {nomorBukti:''}
export const konfirm = (x) => axios.post("/konfirm", { x });
export const dtPartner = () => axios.get("/dtpartner");
export const addPartner = (x) => axios.post("/addPartner", { x });
export const jnsCust = () => axios.get("/jnscust");
export const addJenisCust = (x) => axios.post("/jenisCust", { x });
export const delJenisCust = (x) => axios.post("/delJenisCust", { x });
export const cekStok = (x) => axios.post("/cekStok", { x });
export const dtProdukCat = () => axios.get("/dtProdukCat");
export const addProdukCat = (x) => axios.post("/addProdukCat", { x });
export const getProdukCat = () => axios.get("/getprodukcat");
export const getMerk = () => axios.get("/merk");
export const inMerk = (x) => axios.post("/inMerk", { x });

// expedisi
export const detExp = (x) => axios.post("/biayaPaket", { x });
export const addTrxpaket = (x) => axios.post("/addTrxpaket", { x });

// perakitan
export const inBom = (x) => axios.post("/inbom", { x });
export const dtbom = () => axios.get("/databom");
export const dtboms = (x) => axios.get("/databoms?", { params: { key: x } });
export const detbom = (x) => axios.post("/detbom", { x });
export const updetBom = (x) => axios.post("/updetBom", { x });
export const deldetBom = (x) => axios.post("/deldetBom", { x });
export const rakit = (x) => axios.post("/rakit", { x });
export const getRakit = (x) => axios.post("/getrakit", { x });

// stokOpname
export const createstokop = (x) => axios.post("/createstokop", { x });
export const stokop = (x) => axios.post("/stokop", { x });
export const detstokop = (x) => axios.post("/detstokop", { x });
export const liststokop = (x) => axios.post("/liststokop", { x });
export const getstokop = (x) =>
  axios.get("/getdetstokop?", { params: { key: x } });
export const stokopup = (x) => axios.post("/stokopup", { x });

// adjustment

export const adjusment = (x) => axios.post("/adjust", { x });
export const getListAdjs = (x) => axios.post("/getListAdjs", { x });
export const getdetAdjust = (x) =>
  axios.get("/getdetAdjust?", { params: { key: x } });

// stok Awal
export const draftSaldoAwal = (x) => axios.post("/draftSaldoAwal", { x });
export const saldoAwal = (x) => axios.post("/saldoAwal", { x });
export const prosesStokAwal = (x) => axios.post("/prosesStokAwal", { x });
export const delStokAwal = (x) => axios.post("/delStokAwal", { x });
export const uploadHPsa = (x) => axios.post("/uploadHPsa", { x });
export const uploadJurAwal = (x) => axios.post("/uploadJurAwal", { x });

// sales report
export const rkpAllsales = (x) => axios.post("/rkpAllsales", { x });
export const kasSales = () => axios.get("/kasSales"); //= > sisa kas di tangan sales sesuai login
export const kasSalesAll = (x) => axios.post("/kasSalesAll", { x }); // sisa kas di semua sales => x = bulan 2020-03 => performa per bulan
export const detSalesTrx = (x) => axios.post("/detsalestrx", { x });
export const sisaSales = (x) =>
  axios.get("/sisaSales?", { params: { key: x } });
export const rkpTransaksi = (x) => axios.post("/rkpTransaksi", { x });
export const rkpTransaksiS = (x) => axios.post("/rkpTransaksiS", { x });
export const dthpSales = (x) => axios.post("/dthpSales", { x });

export const cekPoint = (x) => axios.post("/cekPoint", { x });
export const cekHisPoint = (x) => axios.post("/cekHisPoint", { x });
export const dataPoint = (x) => axios.post("/dataPoint", { x });
export const dataKlaimPoint = (x) => axios.post("/dataKlaimPoint", { x });
export const addKlaim = (x) => axios.post("/addKlaim", { x });
export const upPoint = (x) => axios.post("/upPoint", { x });
export const klaimPoint = (x) => axios.post("/klaimPoint", { x });
export const hisBelanja = (x) => axios.post("/hisTrxPelanggan", { x });
export const hpsPoint = (x) => axios.post("/hpsPoint", { x });
export const repairPoint = (x) => axios.post("/repairPoint", { x });
export const addTutupKlaim = (x) => axios.post("/addTutupKlaim", { x });

export const rkpPerKategori = (x) => axios.post("/rkpPerKategori", { x });
export const profitloss = (x) => axios.post("/profitloss", { x });
export const countTrx = (x) => axios.post("/countTrx", { x });

// dashboard marketing
export const salesOmzet = (x) => axios.post("/salesomzet", { x });

// akunting
export const multiBayar = (x) => axios.post("/multiBayar", { x });
export const salesSetor = (x) => axios.post("/salesSetor", { x });
export const salesSetorAll = (x) => axios.post("/salesSetorAll", { x });
export const terimaSetoran = (x) => axios.post("/terimasetoran", { x });
export const bubes = (x) => axios.post("/bubes", { x });
export const dtKas = (x) => axios.post("/dtKas", { x });
export const detKas = (x) => axios.post("/detKas", { x });
export const aruskas = (x) => axios.post("/aruskas", { x });
export const neraca = (x) => axios.post("/neraca", { x });
export const nrcSaldo = (x) => axios.post("/nrcSaldo", { x });
export const cekSaldo = (x) => axios.post("/cekSaldo", { x });
export const rugilaba = (x) => axios.post("/rugilaba", { x });
export const dtJurnal = (x) => axios.post("/dtjurnal", { x });
export const detailJur = (x) => axios.post("/detjur", { x });
export const edjur = (x) => axios.post("/edjur", { x });
export const editJur = (x) => axios.post("/editjurnal", { x });
export const dtHP = (x) => axios.post("/dthp", { x });
export const addHP = (x) => axios.post("/addhp", { x });
export const bayarHP = (x) => axios.post("/bayarhp", { x });
export const dtTunggu = (x) => axios.post("/dtTunggu", { x });
export const upHP = (x) => axios.post("/uphp", { x });
export const dtCOA = () => axios.get("/dtcoa");
export const subAkun = () => axios.get("/subakun");
export const midSubAkun = () => axios.get("/midSubAkun");
export const accRek = () => axios.get("/dtCOA");
export const cekCoa = (x) => axios.post("/cekCoa", { x });
export const inCOA = (x) => axios.post("/inCOA", { x });
export const inKas = (x) => axios.post("/inKas", { x });
export const injurnal = (x) => axios.post("/injurnal", { x });
export const cekByr = (x) => axios.post("/cekbyr", { x });
export const getJurtrans = (x) => axios.post("/getJurtrans", { x });
export const editTglTrx = (x) => axios.post("/upJur", { x });
export const cekBayarReff = (x) => axios.post("/cekbayarReff", { x });
export const jnsPembayaran = () => axios.get("/jnsPembayaran");

export const cekHPP = (x) => axios.post("/cekHPP", { x });
export const faaHP = (x) => axios.post("/faaHP", { x });
export const faaStk = (x) => axios.post("/faaStk", { x });
export const faaKes = (x) => axios.post("/faaKes", { x });
export const faaAK = (x) => axios.post("/faaAK", { x });

export const cekSaldoMulti = (x) => axios.post("/ceksaldomulti", { x });
export const cekTopHP = (x) => axios.post("/topHP", { x });
// kasbon
export const dtKasbon = (x) => axios.post("/dtKasbon", { x });

export const getOnline = () => axios.get("/getAllOnline");
export const gantiSales = (x) => axios.post("/gantiSales", { x });
export const repairHpp = (x) => axios.post("/repairHpp", { x });

export const getLog = (x) => axios.post("/getLog", { x });
export const jamTutup = (x) => axios.post("/jamTutup", { x });
