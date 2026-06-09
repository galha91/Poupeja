// Base de dados dos EVs disponíveis em Portugal
// bateria: kWh utilizáveis | maxAC/maxDC: kW | conectorDC: tipo de ficha DC

const CARROS_EV = [
  // ── Tesla ──
  { id:"tesla-m3-sr",    marca:"Tesla",       modelo:"Model 3 Standard Range",    bateria:57.5, maxAC:11,  maxDC:170, conectorDC:"CCS2" },
  { id:"tesla-m3-lr",    marca:"Tesla",       modelo:"Model 3 Long Range",         bateria:75,   maxAC:11,  maxDC:250, conectorDC:"CCS2" },
  { id:"tesla-m3-p",     marca:"Tesla",       modelo:"Model 3 Performance",        bateria:75,   maxAC:11,  maxDC:250, conectorDC:"CCS2" },
  { id:"tesla-my-sr",    marca:"Tesla",       modelo:"Model Y Standard Range",     bateria:57.5, maxAC:11,  maxDC:170, conectorDC:"CCS2" },
  { id:"tesla-my-lr",    marca:"Tesla",       modelo:"Model Y Long Range",         bateria:75,   maxAC:11,  maxDC:250, conectorDC:"CCS2" },
  { id:"tesla-ms",       marca:"Tesla",       modelo:"Model S",                    bateria:100,  maxAC:11,  maxDC:250, conectorDC:"CCS2" },
  { id:"tesla-mx",       marca:"Tesla",       modelo:"Model X",                    bateria:100,  maxAC:11,  maxDC:250, conectorDC:"CCS2" },
  // ── Volkswagen ──
  { id:"vw-id3-58",      marca:"Volkswagen",  modelo:"ID.3 Pro (58 kWh)",          bateria:58,   maxAC:11,  maxDC:135, conectorDC:"CCS2" },
  { id:"vw-id3-77",      marca:"Volkswagen",  modelo:"ID.3 Pro S (77 kWh)",        bateria:77,   maxAC:11,  maxDC:170, conectorDC:"CCS2" },
  { id:"vw-id4-52",      marca:"Volkswagen",  modelo:"ID.4 Pure (52 kWh)",         bateria:52,   maxAC:11,  maxDC:100, conectorDC:"CCS2" },
  { id:"vw-id4-77",      marca:"Volkswagen",  modelo:"ID.4 Pro (77 kWh)",          bateria:77,   maxAC:11,  maxDC:175, conectorDC:"CCS2" },
  { id:"vw-id5",         marca:"Volkswagen",  modelo:"ID.5 Pro (77 kWh)",          bateria:77,   maxAC:11,  maxDC:175, conectorDC:"CCS2" },
  // ── Renault ──
  { id:"renault-zoe",    marca:"Renault",     modelo:"Zoe R135 ZE50",              bateria:52,   maxAC:22,  maxDC:50,  conectorDC:"CCS2" },
  { id:"renault-megane", marca:"Renault",     modelo:"Mégane E-Tech",              bateria:60,   maxAC:22,  maxDC:130, conectorDC:"CCS2" },
  { id:"renault-5",      marca:"Renault",     modelo:"5 E-Tech",                   bateria:52,   maxAC:11,  maxDC:100, conectorDC:"CCS2" },
  // ── Nissan ──
  { id:"nissan-leaf-40", marca:"Nissan",      modelo:"Leaf 40 kWh",                bateria:39,   maxAC:6.6, maxDC:50,  conectorDC:"CHAdeMO" },
  { id:"nissan-leaf-62", marca:"Nissan",      modelo:"Leaf 62 kWh (e+)",           bateria:59,   maxAC:6.6, maxDC:100, conectorDC:"CHAdeMO" },
  { id:"nissan-ariya",   marca:"Nissan",      modelo:"Ariya 87 kWh",               bateria:87,   maxAC:22,  maxDC:130, conectorDC:"CCS2" },
  // ── Dacia ──
  { id:"dacia-spring",   marca:"Dacia",       modelo:"Spring (26.8 kWh)",          bateria:26.8, maxAC:7.4, maxDC:30,  conectorDC:"CCS2" },
  { id:"dacia-spring65", marca:"Dacia",       modelo:"Spring Extreme (26.8 kWh)",  bateria:26.8, maxAC:7.4, maxDC:30,  conectorDC:"CCS2" },
  // ── Peugeot ──
  { id:"peugeot-e208",   marca:"Peugeot",     modelo:"e-208 (51 kWh)",             bateria:50,   maxAC:11,  maxDC:100, conectorDC:"CCS2" },
  { id:"peugeot-e2008",  marca:"Peugeot",     modelo:"e-2008 (51 kWh)",            bateria:50,   maxAC:11,  maxDC:100, conectorDC:"CCS2" },
  { id:"peugeot-e308",   marca:"Peugeot",     modelo:"e-308 (54 kWh)",             bateria:54,   maxAC:11,  maxDC:100, conectorDC:"CCS2" },
  // ── Citroën ──
  { id:"citroen-ec4",    marca:"Citroën",     modelo:"ë-C4 (54 kWh)",              bateria:54,   maxAC:11,  maxDC:100, conectorDC:"CCS2" },
  { id:"citroen-eac4",   marca:"Citroën",     modelo:"ë-C4 X (54 kWh)",            bateria:54,   maxAC:11,  maxDC:100, conectorDC:"CCS2" },
  // ── Opel ──
  { id:"opel-corse",     marca:"Opel",        modelo:"Corsa Electric (51 kWh)",    bateria:50,   maxAC:11,  maxDC:100, conectorDC:"CCS2" },
  { id:"opel-mokka",     marca:"Opel",        modelo:"Mokka Electric (54 kWh)",    bateria:54,   maxAC:11,  maxDC:100, conectorDC:"CCS2" },
  { id:"opel-astra",     marca:"Opel",        modelo:"Astra Electric (54 kWh)",    bateria:54,   maxAC:11,  maxDC:100, conectorDC:"CCS2" },
  // ── Fiat ──
  { id:"fiat-500e",      marca:"Fiat",        modelo:"500e (42 kWh)",              bateria:42,   maxAC:11,  maxDC:85,  conectorDC:"CCS2" },
  // ── Hyundai ──
  { id:"hyundai-kona39", marca:"Hyundai",     modelo:"Kona EV 39 kWh",             bateria:39.2, maxAC:7.2, maxDC:50,  conectorDC:"CCS2" },
  { id:"hyundai-kona64", marca:"Hyundai",     modelo:"Kona EV 64 kWh",             bateria:64,   maxAC:11,  maxDC:100, conectorDC:"CCS2" },
  { id:"hyundai-ioniq5", marca:"Hyundai",     modelo:"IONIQ 5 Standard (58 kWh)",  bateria:58,   maxAC:11,  maxDC:200, conectorDC:"CCS2" },
  { id:"hyundai-ioniq5l",marca:"Hyundai",     modelo:"IONIQ 5 Long Range (72 kWh)",bateria:72.6, maxAC:11,  maxDC:220, conectorDC:"CCS2" },
  { id:"hyundai-ioniq6", marca:"Hyundai",     modelo:"IONIQ 6 Long Range (77 kWh)",bateria:77.4, maxAC:11,  maxDC:233, conectorDC:"CCS2" },
  // ── Kia ──
  { id:"kia-eniro",      marca:"Kia",         modelo:"e-Niro 64 kWh",              bateria:64,   maxAC:11,  maxDC:100, conectorDC:"CCS2" },
  { id:"kia-ev6-sr",     marca:"Kia",         modelo:"EV6 Standard Range",         bateria:58,   maxAC:11,  maxDC:100, conectorDC:"CCS2" },
  { id:"kia-ev6-lr",     marca:"Kia",         modelo:"EV6 Long Range",             bateria:77.4, maxAC:11,  maxDC:233, conectorDC:"CCS2" },
  { id:"kia-ev9",        marca:"Kia",         modelo:"EV9 Long Range",             bateria:99.8, maxAC:11,  maxDC:233, conectorDC:"CCS2" },
  { id:"kia-niro",       marca:"Kia",         modelo:"Niro EV (64 kWh)",           bateria:64.8, maxAC:11,  maxDC:100, conectorDC:"CCS2" },
  // ── BMW ──
  { id:"bmw-i3",         marca:"BMW",         modelo:"i3 (42 kWh)",                bateria:37.9, maxAC:11,  maxDC:50,  conectorDC:"CCS2" },
  { id:"bmw-i4-40",      marca:"BMW",         modelo:"i4 eDrive40",                bateria:80.7, maxAC:11,  maxDC:205, conectorDC:"CCS2" },
  { id:"bmw-i4-m50",     marca:"BMW",         modelo:"i4 M50",                     bateria:80.7, maxAC:11,  maxDC:205, conectorDC:"CCS2" },
  { id:"bmw-ix3",        marca:"BMW",         modelo:"iX3",                        bateria:74,   maxAC:11,  maxDC:150, conectorDC:"CCS2" },
  { id:"bmw-ix",         marca:"BMW",         modelo:"iX xDrive50",                bateria:105.2,maxAC:11,  maxDC:200, conectorDC:"CCS2" },
  { id:"bmw-mini-se",    marca:"Mini",        modelo:"Cooper SE (32 kWh)",         bateria:28.9, maxAC:11,  maxDC:50,  conectorDC:"CCS2" },
  { id:"bmw-mini-aceman",marca:"Mini",        modelo:"Aceman E",                   bateria:54.2, maxAC:11,  maxDC:95,  conectorDC:"CCS2" },
  // ── Mercedes ──
  { id:"mercedes-eqa",   marca:"Mercedes",    modelo:"EQA 250",                    bateria:66.5, maxAC:11,  maxDC:100, conectorDC:"CCS2" },
  { id:"mercedes-eqb",   marca:"Mercedes",    modelo:"EQB 300",                    bateria:66.5, maxAC:11,  maxDC:100, conectorDC:"CCS2" },
  { id:"mercedes-eqc",   marca:"Mercedes",    modelo:"EQC 400",                    bateria:80,   maxAC:11,  maxDC:110, conectorDC:"CCS2" },
  { id:"mercedes-eqe",   marca:"Mercedes",    modelo:"EQE 350",                    bateria:90.6, maxAC:22,  maxDC:170, conectorDC:"CCS2" },
  { id:"mercedes-eqs",   marca:"Mercedes",    modelo:"EQS 450",                    bateria:107.8,maxAC:22,  maxDC:200, conectorDC:"CCS2" },
  // ── Audi ──
  { id:"audi-q4-40",     marca:"Audi",        modelo:"Q4 e-tron 40",               bateria:76.6, maxAC:11,  maxDC:135, conectorDC:"CCS2" },
  { id:"audi-q4-50",     marca:"Audi",        modelo:"Q4 e-tron 50",               bateria:76.6, maxAC:11,  maxDC:175, conectorDC:"CCS2" },
  { id:"audi-etron55",   marca:"Audi",        modelo:"e-tron 55",                  bateria:86.5, maxAC:22,  maxDC:150, conectorDC:"CCS2" },
  // ── Skoda ──
  { id:"skoda-enyaq-60", marca:"Skoda",       modelo:"Enyaq iV 60",                bateria:58,   maxAC:11,  maxDC:125, conectorDC:"CCS2" },
  { id:"skoda-enyaq-80", marca:"Skoda",       modelo:"Enyaq iV 80",                bateria:77,   maxAC:11,  maxDC:135, conectorDC:"CCS2" },
  // ── Volvo ──
  { id:"volvo-xc40",     marca:"Volvo",       modelo:"XC40 Recharge",              bateria:78,   maxAC:11,  maxDC:150, conectorDC:"CCS2" },
  { id:"volvo-c40",      marca:"Volvo",       modelo:"C40 Recharge",               bateria:78,   maxAC:11,  maxDC:150, conectorDC:"CCS2" },
  { id:"volvo-ex30",     marca:"Volvo",       modelo:"EX30",                       bateria:51,   maxAC:11,  maxDC:153, conectorDC:"CCS2" },
  // ── Porsche ──
  { id:"porsche-taycan", marca:"Porsche",     modelo:"Taycan",                     bateria:79.2, maxAC:11,  maxDC:270, conectorDC:"CCS2" },
  { id:"porsche-taycant",marca:"Porsche",     modelo:"Taycan Turbo",               bateria:93.4, maxAC:11,  maxDC:320, conectorDC:"CCS2" },
  // ── Cupra / Seat ──
  { id:"cupra-born-58",  marca:"Cupra",       modelo:"Born 58 kWh",                bateria:58,   maxAC:11,  maxDC:130, conectorDC:"CCS2" },
  { id:"cupra-born-77",  marca:"Cupra",       modelo:"Born 77 kWh",                bateria:77,   maxAC:11,  maxDC:170, conectorDC:"CCS2" },
  { id:"seat-born",      marca:"Seat",        modelo:"Born",                       bateria:58,   maxAC:11,  maxDC:130, conectorDC:"CCS2" },
  // ── MG ──
  { id:"mg-zs-44",       marca:"MG",          modelo:"ZS EV 44 kWh",               bateria:44.5, maxAC:7.4, maxDC:50,  conectorDC:"CCS2" },
  { id:"mg-zs-72",       marca:"MG",          modelo:"ZS EV Long Range",           bateria:72.6, maxAC:11,  maxDC:76,  conectorDC:"CCS2" },
  { id:"mg-mg4-51",      marca:"MG",          modelo:"MG4 EV Standard (51 kWh)",   bateria:51,   maxAC:11,  maxDC:117, conectorDC:"CCS2" },
  { id:"mg-mg4-64",      marca:"MG",          modelo:"MG4 EV Long Range (64 kWh)", bateria:64,   maxAC:11,  maxDC:135, conectorDC:"CCS2" },
  // ── BYD ──
  { id:"byd-atto3",      marca:"BYD",         modelo:"Atto 3 (60 kWh)",            bateria:60.4, maxAC:7,   maxDC:88,  conectorDC:"CCS2" },
  { id:"byd-seal-58",    marca:"BYD",         modelo:"Seal Standard (58 kWh)",     bateria:61.4, maxAC:11,  maxDC:150, conectorDC:"CCS2" },
  { id:"byd-seal-82",    marca:"BYD",         modelo:"Seal Performance (82 kWh)",  bateria:82.6, maxAC:11,  maxDC:150, conectorDC:"CCS2" },
  { id:"byd-han",        marca:"BYD",         modelo:"Han",                        bateria:85.4, maxAC:11,  maxDC:120, conectorDC:"CCS2" },
  // ── Toyota / Lexus ──
  { id:"toyota-bz4x",   marca:"Toyota",       modelo:"bZ4X (71 kWh)",              bateria:71.4, maxAC:6.6, maxDC:150, conectorDC:"CCS2" },
  { id:"lexus-rze",      marca:"Lexus",        modelo:"RZ 450e",                    bateria:71.4, maxAC:6.6, maxDC:150, conectorDC:"CCS2" },
  // ── Jeep / Alfa ──
  { id:"jeep-avenger",   marca:"Jeep",        modelo:"Avenger (54 kWh)",           bateria:54,   maxAC:11,  maxDC:100, conectorDC:"CCS2" },
  { id:"alfa-junior",    marca:"Alfa Romeo",  modelo:"Junior Elettrica",           bateria:54,   maxAC:11,  maxDC:100, conectorDC:"CCS2" },
  // ── Smart ──
  { id:"smart-eq",       marca:"Smart",       modelo:"EQ ForTwo (17.6 kWh)",       bateria:17.6, maxAC:22,  maxDC:null,conectorDC:null },
  { id:"smart-1",        marca:"Smart",       modelo:"#1",                         bateria:66,   maxAC:22,  maxDC:150, conectorDC:"CCS2" },
  // ── Polestar ──
  { id:"polestar-2",     marca:"Polestar",    modelo:"Polestar 2 Long Range",      bateria:78,   maxAC:11,  maxDC:205, conectorDC:"CCS2" },
  { id:"polestar-3",     marca:"Polestar",    modelo:"Polestar 3",                 bateria:111,  maxAC:11,  maxDC:250, conectorDC:"CCS2" },
  // ── Subaru ──
  { id:"subaru-solterra",marca:"Subaru",      modelo:"Solterra",                   bateria:71.4, maxAC:6.6, maxDC:150, conectorDC:"CCS2" },
  // ── Honda ──
  { id:"honda-enp1",     marca:"Honda",       modelo:"e:Np1",                      bateria:68.8, maxAC:11,  maxDC:100, conectorDC:"CCS2" },
  { id:"honda-e",        marca:"Honda",       modelo:"e (35 kWh)",                 bateria:35.5, maxAC:7.4, maxDC:50,  conectorDC:"CCS2" },
  // ── Mazda ──
  { id:"mazda-mx30",     marca:"Mazda",       modelo:"MX-30 (35 kWh)",             bateria:35.5, maxAC:11,  maxDC:50,  conectorDC:"CCS2" },
];

export default CARROS_EV;
