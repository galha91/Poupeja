/*
 * Compressão de imagens no cliente antes do OCR e do armazenamento.
 *
 * Uma foto de telemóvel moderna tem 3–8 MB; enviada em base64 ao
 * /api/ler-talao custa tokens de imagem desnecessários no Anthropic,
 * demora em redes móveis, e guardada no localStorage rebenta a quota
 * (~5 MB) ao fim de meia dúzia de talões. Reduzimos para um máximo de
 * 1400px no lado maior e JPEG q0.72 — mais do que suficiente para o
 * OCR ler valores e nomes de loja.
 */
export function comprimirImagem(file, maxDim = 1400, qualidade = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha a ler o ficheiro."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(reader.result); // formato não suportado pelo canvas → usa o original
      img.onload = () => {
        try {
          const escala = Math.min(1, maxDim / Math.max(img.width, img.height));
          if (escala >= 1 && file.size < 400 * 1024) return resolve(reader.result); // já é pequena
          const canvas = document.createElement("canvas");
          canvas.width  = Math.round(img.width * escala);
          canvas.height = Math.round(img.height * escala);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", qualidade));
        } catch {
          resolve(reader.result);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
