// ─────────────────────────────────────────────────────────────
//  LINKS DE AFILIADO — poupejá.com
//  Como usar:
//    1. Cria conta em awin.com → "Become a Publisher"
//    2. Candidata-te a cada programa individualmente
//    3. Quando aprovado, substitui null pelo link de tracking da Awin
//       Exemplo Worten: "https://www.awin1.com/cread.php?awinmid=XXXXX&awinaffid=YYYYYYY&ued=https://www.worten.pt/"
//    4. Guarda e faz deploy — o site usa automaticamente o link de afiliado
//
//  Redes recomendadas:
//    → Awin Portugal:       awin.com (tem Worten, FNAC, Decathlon, C&A, Zippy...)
//    → Tradedoubler:        tradedoubler.com (tem El Corte Inglés, Adidas, Nike...)
//    → CJ Affiliate:        cj.com (tem Calvin Klein, Tommy Hilfiger, Levi's...)
//
//  Enquanto null: o site abre o link oficial directo (sem rastreio)
// ─────────────────────────────────────────────────────────────

const AFILIADOS = {

  // ── ELETRÓNICA (prioridade máxima — cabazes grandes, comissão 2–5%) ──
  "Amazon":          "https://www.amazon.es/?tag=poupeja-21",
  "Worten":          "https://www.awin1.com/cread.php?awinmid=99897&awinaffid=2930079&ued=https%3A%2F%2Fwww.worten.pt%2F",  // Awin PT — afiliado 2930079 (link permanente p/ homepage)
  "Fnac":            null,  // Awin PT — candidatar em: awin.com → Fnac Portugal
  "Darty":           null,  // Awin PT — mesmo grupo que Fnac
  "Radio Popular":   null,  // Contacto directo: radiopopular.pt
  "PC Diga":         null,  // Awin PT ou contacto directo
  "PCComponentes":   null,  // Awin PT — candidatar em: awin.com → PCComponentes
  "El Corte Inglés": null,  // Tradedoubler — candidatar em: tradedoubler.com
  "Techinn":         null,  // Awin PT — candidatar em: awin.com → Tradeinn

  // ── MODA (comissão 3–8%) ──
  "Zara":            null,  // Sem programa público — contacto directo Inditex
  "H&M":             null,  // Awin — candidatar em: awin.com → H&M PT
  "Mango":           null,  // Awin — candidatar em: awin.com → Mango PT
  "Bershka":         null,  // Sem programa público (Inditex)
  "Pull&Bear":       null,  // Sem programa público (Inditex)
  "Stradivarius":    null,  // Sem programa público (Inditex)
  "Lefties":         null,  // Sem programa público (Inditex)
  "Primark":         null,  // Sem programa público
  "Massimo Dutti":   null,  // Sem programa público (Inditex)
  "Springfield":     null,  // Tradedoubler
  "Parfois":         null,  // Awin PT — candidatar em: awin.com → Parfois
  "Salsa":           null,  // Contacto directo: salsajeans.com
  "Tiffosi":         null,  // Contacto directo
  "MO":              null,  // Sonae — contacto directo
  "Lanidor":         null,  // Contacto directo
  "Sacoor":          null,  // Contacto directo
  "C&A":             null,  // Awin — candidatar em: awin.com → C&A PT
  "Benetton":        null,  // Awin — candidatar em: awin.com → Benetton PT
  "Quebramar":       null,  // Contacto directo
  "Calzedonia":      null,  // Awin — candidatar em: awin.com → Calzedonia PT
  "Women'secret":    null,  // Tradedoubler
  "Calvin Klein":    null,  // CJ Affiliate
  "Tommy Hilfiger":  null,  // CJ Affiliate
  "Levi's":          null,  // CJ Affiliate
  "Zippy":           null,  // Awin PT — candidatar em: awin.com → Zippy

  // ── DESPORTO (comissão 3–6%) ──
  "Decathlon":       null,  // Awin PT — candidatar em: awin.com → Decathlon PT
  "Sport Zone":      null,  // Contacto directo (Sonae)
  "Nike":            null,  // Rakuten Advertising
  "Adidas":          null,  // Tradedoubler ou Awin
  "JD Sports":       null,  // Awin — candidatar em: awin.com → JD Sports PT
  "Puma":            null,  // Awin
  "Foot Locker":     null,  // Awin
  "New Balance":     null,  // Awin
  "Reebok":          null,  // Awin — candidatar em: awin.com → Reebok PT
  "Sportsdirect":    null,  // Awin

};

// Retorna o link de afiliado se disponível, caso contrário o link directo
export function getUrlLoja(loja) {
  return AFILIADOS[loja.nome] || loja.url;
}

// Retorna true se a loja já tem link de afiliado activo
export function temAfiliado(nomeLoja) {
  return !!AFILIADOS[nomeLoja];
}

export default AFILIADOS;
