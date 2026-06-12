// Fonte única de verdade para as URLs de promoções.
// urlFallback é sempre a homepage — nunca quebra.
// O cron auto-corrige para urlFallback quando deteta um 404.
export const PROMOCOES = [
  { nome: "Worten",         dominio: "worten.pt",       cor: "#e30613", url: "https://www.worten.pt/promocoes",                                     urlFallback: "https://www.worten.pt/" },
  { nome: "Parfois",        dominio: "parfois.com",     cor: "#d4a05a", url: "https://www.parfois.com/pt/sale/",                                     urlFallback: "https://www.parfois.com/pt/" },
  { nome: "Mango",          dominio: "mango.com",       cor: "#000000", url: "https://shop.mango.com/pt/pt/l/mulher/promocoes",                      urlFallback: "https://shop.mango.com/pt/pt" },
  { nome: "Nike",           dominio: "nike.com",        cor: "#000000", url: "https://www.nike.com/pt/en/w/sale-3yaep",                              urlFallback: "https://www.nike.com/pt/" },
  { nome: "Adidas",         dominio: "adidas.pt",       cor: "#000000", url: "https://www.adidas.pt/outlet",                                         urlFallback: "https://www.adidas.pt/" },
  { nome: "Decathlon",      dominio: "decathlon.pt",    cor: "#0082c3", url: "https://www.decathlon.pt/C-3274473-promocoes",                         urlFallback: "https://www.decathlon.pt/" },
  { nome: "Darty",          dominio: "darty.pt",        cor: "#e2001a", url: "https://darty.pt/collections/campanhas-promocoes",                     urlFallback: "https://darty.pt/" },
  { nome: "Puma",           dominio: "pt.puma.com",     cor: "#000000", url: "https://pt.puma.com/pt/pt/sale",                                       urlFallback: "https://pt.puma.com/" },
  { nome: "Tommy Hilfiger", dominio: "pt.tommy.com",    cor: "#002d72", url: "https://pt.tommy.com/",                                                urlFallback: "https://pt.tommy.com/" },
  { nome: "Calvin Klein",   dominio: "calvinklein.pt",  cor: "#000000", url: "https://www.calvinklein.pt/sale",                                      urlFallback: "https://www.calvinklein.pt/" },
  { nome: "Levi's",         dominio: "levi.com",        cor: "#d6001c", url: "https://www.levi.com/PT/pt_PT/clothing/c/levi_clothing_sale",          urlFallback: "https://www.levi.com/PT/pt_PT/" },
  { nome: "JD Sports",      dominio: "jdsports.pt",     cor: "#000000", url: "https://www.jdsports.pt/saldos/",                                      urlFallback: "https://www.jdsports.pt/" },
];
