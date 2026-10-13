import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { FORMATOS, codigoValido, urlOpenFoodFacts, nomeParaPesquisa } from "./lib/codigoBarras";
import { evento } from "./lib/analytics";

/*
 * Ler o código de barras de um produto na loja e comparar o preço.
 *
 * Câmara traseira → código (BarcodeDetector do browser; onde não existe,
 * como no iPhone, a mesma API em WebAssembly, carregada só agora e servida
 * pelo próprio site) → nome do produto na Open Food Facts → pesquisa
 * normal do comparador. Nada é gravado; a imagem não sai do telemóvel.
 *
 * onNome(nome, codigo) é chamado com o nome a pesquisar.
 */
async function criarDetetor() {
  if (typeof window !== "undefined" && "BarcodeDetector" in window) {
    try {
      const suportados = await window.BarcodeDetector.getSupportedFormats();
      const formats = FORMATOS.filter(f => suportados.includes(f));
      if (formats.length) return new window.BarcodeDetector({ formats });
    } catch {}
  }
  const { BarcodeDetector, prepareZXingModule } = await import("barcode-detector/ponyfill");
  // O WebAssembly vem do próprio site (public/zxing), não de uma CDN.
  prepareZXingModule({
    overrides: { locateFile: (path, prefix) => (path.endsWith(".wasm") ? "/zxing/zxing_reader-3.1.3.wasm" : prefix + path) },
  });
  return new BarcodeDetector({ formats: FORMATOS });
}

export default function LeitorCodigoBarras({ onNome, onFechar }) {
  const video = useRef(null);
  const [estado, setEstado] = useState("a-abrir"); // a-abrir | a-ler | a-procurar | erro
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let stream, parar = false, temporizador;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (parar) return;
        video.current.srcObject = stream;
        await video.current.play();
        const detetor = await criarDetetor();
        setEstado("a-ler");
        const ler = async () => {
          if (parar) return;
          try {
            const r = await detetor.detect(video.current);
            const codigo = r.map(c => c.rawValue).find(codigoValido);
            if (codigo) return encontrado(codigo);
          } catch {}
          temporizador = setTimeout(ler, 250);
        };
        ler();
      } catch (e) {
        setEstado("erro");
        setMsg(e?.name === "NotAllowedError"
          ? "Sem acesso à câmara. Autoriza a câmara para este site nas definições do browser."
          : "Não foi possível abrir a câmara neste telemóvel.");
      }
    })();

    async function encontrado(codigo) {
      parar = true;
      stream?.getTracks().forEach(t => t.stop());
      setEstado("a-procurar");
      try {
        const r = await fetch(urlOpenFoodFacts(codigo));
        const j = await r.json();
        const nome = j?.status === 1 ? nomeParaPesquisa(j.product) : null;
        if (!nome) {
          evento("codigo_barras", { acao: "desconhecido" });
          setEstado("erro");
          setMsg("Ainda não conhecemos este produto. Escreve o nome na pesquisa.");
          return;
        }
        evento("codigo_barras", { acao: "lido" });
        onNome(nome, codigo);
      } catch {
        setEstado("erro");
        setMsg("Sem ligação para identificar o produto. Tenta outra vez.");
      }
    }

    return () => { parar = true; clearTimeout(temporizador); stream?.getTracks().forEach(t => t.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Ler código de barras" className="fixed inset-0 flex flex-col" style={{ background: "#000", zIndex: 70 }}>
      <div className="flex items-center justify-between" style={{ padding: "calc(env(safe-area-inset-top) + 12px) 16px 12px" }}>
        <p style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>Aponta para o código de barras</p>
        <button onClick={onFechar} aria-label="Fechar" className="pj-tap flex items-center justify-center rounded-xl" style={{ width: 40, height: 40, background: "rgba(255,255,255,0.15)", color: "#fff" }}>
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 relative">
        <video ref={video} muted playsInline className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />
        {/* Moldura para centrar o código */}
        <div aria-hidden="true" className="absolute" style={{ left: "12%", right: "12%", top: "38%", height: "18%", border: "2px solid rgba(255,255,255,0.9)", borderRadius: 14 }} />
      </div>
      <div style={{ padding: "14px 16px calc(env(safe-area-inset-bottom) + 18px)", minHeight: 76 }}>
        <p role="status" style={{ color: estado === "erro" ? "#ffb4a6" : "rgba(255,255,255,0.85)", fontSize: 13.5, lineHeight: 1.5, textAlign: "center" }}>
          {estado === "a-abrir" && "A abrir a câmara…"}
          {estado === "a-ler" && "A procurar o código…"}
          {estado === "a-procurar" && "A identificar o produto…"}
          {estado === "erro" && msg}
        </p>
      </div>
    </div>,
    document.body,
  );
}
