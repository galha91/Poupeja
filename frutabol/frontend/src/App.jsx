import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProvedorIdioma } from "./i18n.jsx";
import { ProvedorSessao } from "./sessao.jsx";
import { Nav, Rodape } from "./componentes.jsx";
import Inicio from "./paginas/Inicio.jsx";
import Catalogo from "./paginas/Catalogo.jsx";
import Personagem from "./paginas/Personagem.jsx";
import Entrar from "./paginas/Entrar.jsx";
import Verificar from "./paginas/Verificar.jsx";
import Colecao from "./paginas/Colecao.jsx";
import Moedas from "./paginas/Moedas.jsx";
import Admin from "./paginas/Admin.jsx";
import Legal from "./paginas/Legal.jsx";

export default function App() {
  return (
    <ProvedorIdioma>
      <ProvedorSessao>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Nav />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Inicio />} />
                <Route path="/catalogo" element={<Catalogo />} />
                <Route path="/personagem/:id" element={<Personagem />} />
                <Route path="/entrar" element={<Entrar />} />
                <Route path="/verificar" element={<Verificar />} />
                <Route path="/colecao" element={<Colecao />} />
                <Route path="/moedas" element={<Moedas />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/termos" element={<Legal pagina="termos" />} />
                <Route path="/privacidade" element={<Legal pagina="privacidade" />} />
                <Route path="/conteudos" element={<Legal pagina="conteudos" />} />
              </Routes>
            </main>
            <Rodape />
          </div>
        </BrowserRouter>
      </ProvedorSessao>
    </ProvedorIdioma>
  );
}
