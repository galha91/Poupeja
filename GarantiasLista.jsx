import { useState, useEffect, useRef, useMemo } from "react";
import {
  ShieldCheck, Camera, ImagePlus, Plus, CalendarPlus, Share2, Bell, BellOff,
  Pencil, Trash2, Download, Upload, X, ExternalLink, Image as ImageIcon,
} from "lucide-react";
import {
  MESES_GARANTIA_LEGAL, MESES_USADO_MINIMO, FONTE_GARANTIA, LINKS_RECLAMACAO, ROTULO_ESTADO,
  fimGarantia, estadoGarantia, ordenarGarantias, normalizarGarantia, mesesPorOmissao,
} from "./lib/garantias";
import { ANTECEDENCIA_GARANTIAS } from "./lib/lembretes";
import {
  lerGarantias, guardarGarantias, novoId, exportarIcs, migrarGarantiasAntigas,
  criarCopia, restaurarCopia, descarregar, partilharOuDescarregar, ativouLembrete } from "./lib/dadosLocais";
import { guardarFoto, lerFoto, apagarFoto, dataUrlParaBlob } from "./lib/fotosDB";
import { comprimirImagem } from "./lib/imagem";
import { hojeIso, dataCurta, dataExtenso, falta } from "./lib/datas";
import { eur } from "./lib/formato";
import { evento } from "./lib/analytics";
import { Campo, BotaoPrincipal, BotaoSecundario, Chip, Nota, Erro, Folha, EstadoVazio, Cartao, LinkExterno, ROTULO } from "./UiSimples";

/*
 * Garantias — registo rápido de uma compra, fim da garantia calculado,
 * avisos 60 e 30 dias antes, ficha para reclamar. Tudo só no dispositivo:
 * os dados em localStorage (fora da sincronização), as fotos no IndexedDB.
 */

const COR_ESTADO = {
  valida:    { fg: "var(--pj-brand-ink)", bg: "var(--pj-brand-wash)" },
  a_expirar: { fg: "var(--pj-warn)",      bg: "var(--pj-warn-wash)" },
  expirada:  { fg: "var(--pj-text-muted)", bg: "var(--pj-subtle)" },
};

/* Foto do IndexedDB como URL temporário (libertado ao desmontar). */
function useFoto(id, existe, versao = 0) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!existe) { setUrl(null); return; }
    let u = null, vivo = true;
    lerFoto(id).then(b => { if (vivo && b) { u = URL.createObjectURL(b); setUrl(u); } }).catch(() => {});
    return () => { vivo = false; if (u) URL.revokeObjectURL(u); };
  }, [id, existe, versao]);
  return url;
}

function Etiqueta({ estado }) {
  const c = COR_ESTADO[estado];
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 8, color: c.fg, background: c.bg, whiteSpace: "nowrap" }}>
      {ROTULO_ESTADO[estado]}
    </span>
  );
}

function Miniatura({ g }) {
  const url = useFoto(g.id, g.temFoto, g.fotoVersao);
  return (
    <div className="flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ width: 48, height: 48, borderRadius: 12, background: "var(--pj-subtle)" }}>
      {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : <ShieldCheck size={20} style={{ color: "var(--pj-text-faint)" }} aria-hidden="true" />}
    </div>
  );
}

/* ─── Formulário ─── */
function FormGarantia({ inicial, onGuardar }) {
  const camara = useRef(null);
  const galeria = useRef(null);
  const [produto, setProduto] = useState(inicial?.produto || "");
  const [dataCompra, setDataCompra] = useState(inicial?.dataCompra || hojeIso());
  const [loja, setLoja] = useState(inicial?.loja || "");
  const [preco, setPreco] = useState(inicial?.preco != null ? String(inicial.preco).replace(".", ",") : "");
  const [estado, setEstado] = useState(inicial?.estado || "novo");
  const [meses, setMeses] = useState(inicial?.meses || MESES_GARANTIA_LEGAL);
  const [outra, setOutra] = useState(inicial && ![36, 18, 60].includes(inicial.meses));
  const [foto, setFoto] = useState(null);          // dataURL nova (comprimida)
  const [tirarFoto, setTirarFoto] = useState(false); // apagar a foto existente
  const [lembrete, setLembrete] = useState(inicial ? inicial.lembrete !== false : true);
  const [erro, setErro] = useState("");
  const [aGuardar, setAGuardar] = useState(false);
  const fotoAtual = useFoto(inicial?.id, !!inicial?.temFoto && !tirarFoto && !foto);

  const fim = fimGarantia(dataCompra, meses);

  function escolherFicheiro(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    comprimirImagem(f, 1280, 0.7).then(setFoto).catch(() => setErro("Não foi possível ler essa imagem."));
  }

  function mudarEstado(novo) {
    setEstado(novo);
    if (!outra) setMeses(mesesPorOmissao(novo));
  }

  async function submeter(e) {
    e.preventDefault();
    const r = normalizarGarantia({ produto, dataCompra, loja, preco, estado, meses });
    if (!r.ok) { setErro(r.erro); return; }
    setErro("");
    setAGuardar(true);
    try {
      await onGuardar({ ...r.garantia, lembrete }, { foto, tirarFoto });
    } catch {
      setErro("Não foi possível guardar a foto neste dispositivo. Tenta sem foto ou liberta espaço.");
      setAGuardar(false);
    }
  }

  const previa = foto || fotoAtual;

  return (
    <form onSubmit={submeter} className="flex flex-col gap-4 pb-2" noValidate>
      <Campo label="Produto" type="text" maxLength={80} placeholder="ex.: Máquina de lavar" value={produto}
        onChange={e => setProduto(e.target.value)} autoFocus={!inicial} erro={erro && !produto.trim()} />
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Data de compra" type="date" max={hojeIso()} value={dataCompra} onChange={e => setDataCompra(e.target.value)} />
        <Campo label="Preço" opcional type="text" inputMode="decimal" placeholder="0,00" value={preco} onChange={e => setPreco(e.target.value)} />
      </div>
      <Campo label="Loja" opcional type="text" maxLength={60} value={loja} onChange={e => setLoja(e.target.value)} />

      <div>
        <p style={ROTULO}>O produto era</p>
        <div className="flex gap-2 mt-2">
          <Chip ativo={estado === "novo"} onClick={() => mudarEstado("novo")}>Novo</Chip>
          <Chip ativo={estado === "usado"} onClick={() => mudarEstado("usado")}>Usado</Chip>
        </div>
      </div>

      <div>
        <p style={ROTULO}>Garantia</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Chip ativo={!outra && meses === 36} onClick={() => { setOutra(false); setMeses(36); }}>3 anos (legal)</Chip>
          {estado === "usado" && (
            <Chip ativo={!outra && meses === MESES_USADO_MINIMO} onClick={() => { setOutra(false); setMeses(MESES_USADO_MINIMO); }}>18 meses</Chip>
          )}
          <Chip ativo={!outra && meses === 60} onClick={() => { setOutra(false); setMeses(60); }}>5 anos</Chip>
          <Chip ativo={outra} onClick={() => setOutra(true)}>Outra</Chip>
        </div>
        {outra && (
          <div className="mt-3" style={{ maxWidth: 180 }}>
            <Campo label="Meses" type="number" inputMode="numeric" min={1} max={240} value={meses} onChange={e => setMeses(e.target.value)} />
          </div>
        )}
        {estado === "usado" && (
          <p style={{ fontSize: 11, color: "var(--pj-text-faint)", marginTop: 6, lineHeight: 1.5 }}>
            Nos usados a garantia também é de 3 anos; só passa a 18 meses se isso ficou acordado na compra (vê a fatura).
          </p>
        )}
        {fim && (
          <p style={{ fontSize: 14, color: "var(--pj-text)", marginTop: 10 }}>
            Garantia até <strong>{dataExtenso(fim)}</strong>
          </p>
        )}
      </div>

      <div>
        <p style={ROTULO}>Foto do talão ou fatura <span style={{ fontWeight: 400, color: "var(--pj-text-faint)" }}>(opcional)</span></p>
        <input ref={camara} type="file" accept="image/*" capture="environment" hidden onChange={escolherFicheiro} />
        <input ref={galeria} type="file" accept="image/*" hidden onChange={escolherFicheiro} />
        {previa ? (
          <div className="relative mt-2">
            <img src={previa} alt="Foto do talão" className="w-full object-cover" style={{ maxHeight: 180, borderRadius: 14, border: "1px solid var(--pj-border)" }} />
            <button type="button" onClick={() => { setFoto(null); setTirarFoto(true); }} aria-label="Tirar a foto"
              className="pj-tap absolute top-2 right-2 flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 14, border: 0, background: "rgba(20,35,28,0.55)" }}>
              <X size={18} color="#fff" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2 mt-2">
            <BotaoSecundario type="button" className="flex-1" onClick={() => camara.current?.click()}><Camera size={16} /> Câmara</BotaoSecundario>
            <BotaoSecundario type="button" className="flex-1" onClick={() => galeria.current?.click()}><ImagePlus size={16} /> Galeria</BotaoSecundario>
          </div>
        )}
      </div>

      <label className="flex items-center gap-3" style={{ minHeight: 44, fontSize: 14, color: "var(--pj-text)" }}>
        <input type="checkbox" checked={lembrete} onChange={e => setLembrete(e.target.checked)} style={{ width: 22, height: 22, accentColor: "var(--pj-brand)" }} />
        Avisar-me 60 e 30 dias antes do fim
      </label>

      <Erro>{erro}</Erro>
      <BotaoPrincipal type="submit" disabled={aGuardar} style={aGuardar ? { opacity: 0.6 } : undefined}>
        {inicial ? "Guardar alterações" : "Guardar compra"}
      </BotaoPrincipal>
    </form>
  );
}

/* ─── Detalhe ─── */
function Detalhe({ g, onAtualizar, onEditar, onApagar }) {
  const foto = useFoto(g.id, g.temFoto, g.fotoVersao);
  const { estado, dias } = estadoGarantia(g.fim);
  const [aExportar, setAExportar] = useState(false);

  async function exportar() {
    setAExportar(true);
    try {
      const [{ gerarFichaPng }, blob] = await Promise.all([
        import("./lib/fichaGarantia"),
        g.temFoto ? lerFoto(g.id).catch(() => null) : null,
      ]);
      const png = await gerarFichaPng(g, blob, estado);
      const nome = `garantia-${g.produto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "compra"}.png`;
      const r = await partilharOuDescarregar(nome, png, `Garantia: ${g.produto}`);
      if (r !== "cancelado") evento("garantia_exportada", { formato: "png", via: r });
    } catch {}
    setAExportar(false);
  }

  function calendario() {
    exportarIcs("poupeja-garantia.ics", [{
      uid: `garantia-${g.id}`,
      titulo: `Fim da garantia: ${g.produto}`,
      descricao: `Comprado a ${dataCurta(g.dataCompra)}${g.loja ? ` (${g.loja})` : ""}. Se tiver algum defeito, reclama antes desta data. (Lembrete do PoupeJá)`,
      data: g.fim,
      alarmes: ANTECEDENCIA_GARANTIAS,
    }]);
    evento("calendario_exportado", { tipo: "garantia" });
  }

  function alternarLembrete() {
    const ativo = g.lembrete !== false;
    onAtualizar({ ...g, lembrete: !ativo });
    if (!ativo) ativouLembrete({ tipo: "garantia" });
  }

  return (
    <div className="flex flex-col gap-5 pb-2">
      {foto && <img src={foto} alt="Foto do talão" className="w-full object-contain" style={{ maxHeight: 260, borderRadius: 16, background: "var(--pj-subtle)" }} />}
      <div>
        <div className="flex items-center gap-2"><Etiqueta estado={estado} /></div>
        <p style={{ fontSize: 15, color: "var(--pj-text)", marginTop: 10 }}>
          {estado === "expirada" ? "Acabou" : "Válida até"} {dataExtenso(g.fim)}{" "}
          <span style={{ color: "var(--pj-text-muted)" }}>({falta(dias)})</span>
        </p>
        <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 4 }}>
          Comprado a {dataCurta(g.dataCompra)}{g.loja && ` · ${g.loja}`}{g.preco != null && ` · ${eur(g.preco, 2)} €`}
          {" · "}{g.estado === "usado" ? "usado" : "novo"} · {g.meses} meses
        </p>
      </div>

      <BotaoPrincipal onClick={exportar} disabled={aExportar} style={aExportar ? { opacity: 0.6 } : undefined}>
        <Share2 size={17} /> {aExportar ? "A preparar…" : "Partilhar ficha da compra"}
      </BotaoPrincipal>

      <div className="flex flex-wrap gap-2">
        {estado !== "expirada" && (
          <>
            <BotaoSecundario onClick={alternarLembrete} aria-pressed={g.lembrete !== false}>
              {g.lembrete !== false ? <Bell size={15} /> : <BellOff size={15} />} {g.lembrete !== false ? "Aviso ativo" : "Ativar aviso"}
            </BotaoSecundario>
            <BotaoSecundario onClick={calendario}><CalendarPlus size={15} /> Calendário</BotaoSecundario>
          </>
        )}
      </div>

      <Cartao className="p-4">
        <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--pj-text-muted)" }}>
          Avariou dentro da garantia? Fala primeiro com a loja e leva a ficha. Se não resolver:{" "}
          <LinkExterno href={LINKS_RECLAMACAO.livro}>Livro de Reclamações Eletrónico <ExternalLink size={11} style={{ display: "inline" }} aria-hidden="true" /></LinkExterno>
          {" "}e{" "}
          <LinkExterno href={LINKS_RECLAMACAO.portal}>Portal do Consumidor <ExternalLink size={11} style={{ display: "inline" }} aria-hidden="true" /></LinkExterno>.
        </p>
      </Cartao>

      <div className="flex gap-2">
        <BotaoSecundario onClick={onEditar} className="flex-1"><Pencil size={14} /> Editar</BotaoSecundario>
        <BotaoSecundario onClick={onApagar} aria-label="Apagar" style={{ color: "var(--pj-danger)", background: "var(--pj-danger-wash)" }}><Trash2 size={15} /></BotaoSecundario>
      </div>
    </div>
  );
}

/* ─── Ecrã ─── */
export default function GarantiasLista() {
  const [lista, setLista] = useState([]);
  const [folha, setFolha] = useState(null); // { modo: "nova" | "ver" | "editar", id? }
  const [msg, setMsg] = useState("");
  const importar = useRef(null);

  useEffect(() => {
    setLista(lerGarantias());
    // Se ainda houver garantias no formato antigo (talões), passam para aqui.
    migrarGarantiasAntigas().then(n => { if (n) setLista(lerGarantias()); });
  }, []);

  function gravar(nova) {
    setLista(nova);
    guardarGarantias(nova);
    window.dispatchEvent(new CustomEvent("poupeja:avisos"));
  }

  const hoje = hojeIso();
  const ordenadas = useMemo(() => ordenarGarantias(lista, hoje), [lista, hoje]);
  const atual = folha?.id ? lista.find(x => x.id === folha.id) : null;

  async function guardar(dados, { foto, tirarFoto }, existente) {
    const id = existente?.id || novoId("g");
    let temFoto = existente?.temFoto || false;
    let fotoVersao = existente?.fotoVersao || 0;
    if (foto) { await guardarFoto(id, await dataUrlParaBlob(foto)); temFoto = true; fotoVersao += 1; }
    else if (tirarFoto && temFoto) { await apagarFoto(id).catch(() => {}); temFoto = false; }
    const g = { ...(existente || {}), ...dados, id, temFoto, fotoVersao, criadoEm: existente?.criadoEm || new Date().toISOString() };
    gravar(existente ? lista.map(x => (x.id === id ? g : x)) : [...lista, g]);
    if (!existente) {
      evento("garantia_registada", { estado_bem: g.estado, com_foto: temFoto, meses: g.meses });
      if (g.lembrete !== false) ativouLembrete({ tipo: "garantia" });
    }
    setFolha({ modo: "ver", id });
  }

  async function exportarCopia() {
    const copia = await criarCopia();
    descarregar(`poupeja-copia-${hoje}.json`, JSON.stringify(copia), "application/json");
    evento("copia_seguranca", { acao: "exportar" });
  }

  async function lerCopia(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const r = await restaurarCopia(JSON.parse(await f.text()));
      if (!r.ok) { setMsg(r.erro); return; }
      setLista(lerGarantias());
      window.dispatchEvent(new CustomEvent("poupeja:avisos"));
      setMsg("Cópia restaurada. O que já tinhas neste dispositivo ficou como estava.");
      evento("copia_seguranca", { acao: "restaurar" });
    } catch {
      setMsg("Não foi possível ler esse ficheiro.");
    }
  }

  return (
    <div className="pb-28 px-4 anim-up">
      {lista.length === 0 ? (
        <Cartao>
          <EstadoVazio Icone={ShieldCheck} titulo="Guarda as compras importantes"
            texto="Eletrodomésticos, telemóvel, computador… Regista a compra e avisamos-te antes de a garantia acabar. Em Portugal, a garantia legal é de 3 anos." />
        </Cartao>
      ) : (
        <div className="flex flex-col gap-2">
          {ordenadas.map(g => {
            const { estado, dias } = estadoGarantia(g.fim, hoje);
            return (
              <button key={g.id} onClick={() => setFolha({ modo: "ver", id: g.id })} className="press pj-tap w-full text-left flex items-center gap-3"
                style={{ minHeight: 72, padding: 12, borderRadius: 16, background: "var(--pj-card)", border: "1px solid var(--pj-border)", opacity: estado === "expirada" ? 0.75 : 1 }}>
                <Miniatura g={g} />
                <span className="flex-1 min-w-0">
                  <span className="block truncate" style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>{g.produto}</span>
                  <span className="block truncate" style={{ fontSize: 12, color: "var(--pj-text-muted)" }}>
                    {estado === "expirada" ? `Acabou a ${dataCurta(g.fim)}` : estado === "a_expirar" ? `Acaba ${falta(dias)}` : `Até ${dataCurta(g.fim)}`}
                  </span>
                </span>
                <Etiqueta estado={estado} />
              </button>
            );
          })}
        </div>
      )}

      <BotaoPrincipal className="mt-5" onClick={() => setFolha({ modo: "nova" })}>
        <Plus size={18} /> Registar compra
      </BotaoPrincipal>

      <div className="flex flex-wrap justify-center gap-x-2 mt-4">
        {lista.length > 0 && (
          <BotaoSecundario onClick={exportarCopia} style={{ background: "transparent", color: "var(--pj-text-muted)", whiteSpace: "nowrap" }}>
            <Download size={14} /> Cópia de segurança
          </BotaoSecundario>
        )}
        <BotaoSecundario onClick={() => importar.current?.click()} style={{ background: "transparent", color: "var(--pj-text-muted)", whiteSpace: "nowrap" }}>
          <Upload size={14} /> Restaurar cópia
        </BotaoSecundario>
        <input ref={importar} type="file" accept="application/json,.json" hidden onChange={lerCopia} />
      </div>
      {msg && <p role="status" className="text-center mt-2" style={{ fontSize: 13, color: "var(--pj-text-muted)" }}>{msg}</p>}

      <Nota className="mt-5 text-center">
        <ImageIcon size={11} style={{ display: "inline", marginRight: 4, verticalAlign: "-1px" }} aria-hidden="true" />
        As compras e as fotos (comprimidas) ficam só neste dispositivo. Limpar os dados do browser apaga-as — faz uma cópia de segurança de vez em quando.
        Prazo legal confirmado no <LinkExterno href={FONTE_GARANTIA.href}>Portal do Consumidor</LinkExterno> a {dataCurta(FONTE_GARANTIA.verificado)}.
      </Nota>

      {folha?.modo === "nova" && (
        <Folha titulo="Registar compra" onFechar={() => setFolha(null)}>
          <FormGarantia onGuardar={(d, f) => guardar(d, f, null)} />
        </Folha>
      )}
      {folha?.modo === "ver" && atual && (
        <Folha titulo={atual.produto} onFechar={() => setFolha(null)}>
          <Detalhe
            g={atual}
            onAtualizar={g => gravar(lista.map(x => (x.id === g.id ? g : x)))}
            onEditar={() => setFolha({ modo: "editar", id: atual.id })}
            onApagar={() => {
              if (!window.confirm("Apagar esta compra e a foto?")) return;
              apagarFoto(atual.id).catch(() => {});
              gravar(lista.filter(x => x.id !== atual.id));
              setFolha(null);
            }}
          />
        </Folha>
      )}
      {folha?.modo === "editar" && atual && (
        <Folha titulo="Editar compra" onFechar={() => setFolha({ modo: "ver", id: atual.id })}>
          <FormGarantia inicial={atual} onGuardar={(d, f) => guardar(d, f, atual)} />
        </Folha>
      )}
    </div>
  );
}
