// Sessão global: utilizador atual + saldo + flag de pagamentos (fase 2).
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "./api.js";

const CtxSessao = createContext(null);

export function ProvedorSessao({ children }) {
  const [user, setUser] = useState(null);
  const [pagamentosAtivos, setPagamentosAtivos] = useState(false);
  const [carregado, setCarregado] = useState(false);

  const atualizar = useCallback(async () => {
    try {
      const { user, pagamentosAtivos } = await api("/auth/eu");
      setUser(user);
      setPagamentosAtivos(!!pagamentosAtivos);
    } catch {
      setUser(null);
    } finally {
      setCarregado(true);
    }
  }, []);

  useEffect(() => {
    atualizar();
  }, [atualizar]);

  const sair = async () => {
    await api("/auth/sair", { method: "POST" }).catch(() => {});
    setUser(null);
  };

  return (
    <CtxSessao.Provider value={{ user, setUser, atualizar, sair, carregado, pagamentosAtivos }}>
      {children}
    </CtxSessao.Provider>
  );
}

export const useSessao = () => useContext(CtxSessao);
