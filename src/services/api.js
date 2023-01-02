import axios from 'axios'

export default {
  user: () => axios.get('/user'),
  dtUser: () => axios.get('/dtuser'),
  inUser: (x) => axios.post('/inuser', { x }), // x = { npp,namaKaryawan,alamat,ktp,telp,masuk,keluar,jabatan,kodeCab,email,userType,active }
  upUser: (x) => axios.post('/upuser', { x }),
  upPhoto: (x) => axios.post('/photo', { x }), // upload photo profile x = { photo : }
  cabang: () => axios.get('/cabang'),
  logout: () => axios.get('/logout'),
  dtProduk: () => axios.get('/products'),
  addProduk: (x) => axios.post('/products', { x }), // x= {}
  stok: () => axios.get('/stok'),
  crProduk: (x) => axios.get('/crproduk?', { params: { key: x } }), // x = nama produk.... example => printer
  crPartner: (x, y) => axios.get('/crpartner?', { params: { key: x, jns: y } }), // x = nama partner, y= jenisPartner Ven / Cust
  dtPR: () => axios.get('/dtpr'),
  detPR: (x) => axios.post('/detpr', { x }), // x= {nomorPR:''}
  addPR: (x) => axios.post('/addPR', { x }),
  delPRd: (x) => axios.post('/delprdet', { x }),
  exPartner: () => axios.get('/exPartner'),
  addJB: (x) => axios.post('/jualbeli', { x }), // x = {hd:{},det:[{}]}
  dtTrx: (x) => axios.get('/dtTrx?', { params: { key: x } }), // x =
  detTrx: (x) => axios.post('/detTrx', { x }), // x = {nomorBukti:''}
  konfirm: (x) => axios.post('/konfirm', { x }),
  dtPartner: () => axios.get('/dtpartner'),
  addPartner: (x) => axios.post('/addPartner', { x }),
  jnsCust: () => axios.get('/jnscust'),
  cekStok: (x) => axios.get('/cekStok?', { params: { key: x } }),
  dtProdukCat: () => axios.get('/dtProdukCat'),
  addProdukCat: (x) => axios.post('/addProdukCat', { x }),
  getProdukCat: () => axios.get('/getprodukcat'),
  getMerk: () => axios.get('/merk'),
  // sales report
  rkpAllsales: () => axios.get('/rkpAllsales'),
  kasSales: () => axios.get('/kasSales'), //= > sisa kas di tangan sales sesuai login
  kasSalesAll: (x) => axios.get('/kasSalesAll?', { params: { key: x } }), // sisa kas di semua sales => x = bulan 2020-03 => performa per bulan
  detSalesTrx: (x) => axios.post('/detsalestrx', { x }),
  sisaSales: (x) => axios.get('/sisaSales?', { params: { key: x } }),

  // akunting
  bubes: (x) => axios.post('/bubes', { x }),
  neraca: (x) => axios.post('/neraca', { x }),
  nrcSaldo: (x) => axios.post('/nrcSaldo', { x }),
  rugilaba: (x) => axios.post('/rugilaba', { x }),
  dtJurnal: (x) => axios.post('/dtjurnal', { x }),
  dtHP: (x) => axios.post('/dthp', { x }),
  upHP: (x) => axios.post('/uphp', { x }),
  dtCOA: () => axios.get('/dtcoa'),
  subAkun: () => axios.get('/subakun'),
  accRek: () => axios.get('/dtCOA'),
  injurnal: (x) => axios.post('/injurnal', { x }),
  cekByr: (x) => axios.post('/cekbyr', { x })

}
