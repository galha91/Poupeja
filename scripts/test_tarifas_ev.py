"""Testes do extractor de tarifas MOBI.E (python3 -m unittest scripts/test_tarifas_ev.py)."""
import io
import json
import os
import sys
import tempfile
import unittest

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import tarifas_ev  # noqa: E402

INFRA = os.path.join(AQUI, "amostras-ev", "infra.xml")
STATUS = os.path.join(AQUI, "amostras-ev", "status.xml")
AGORA = "2026-11-06T10:00:00Z"


class TestTarifasEV(unittest.TestCase):
    def setUp(self):
        self.sites, _ = tarifas_ev.ler_inventario(INFRA)
        self.tarifas, self.pub = tarifas_ev.ler_estado(STATUS, AGORA)

    def test_inventario(self):
        self.assertEqual(set(self.sites), {"SITE-A", "SITE-B", "SITE-C"})
        a = self.sites["SITE-A"]
        self.assertEqual((a["lat"], a["lon"], a["op"]), (38.7169, -9.1395, "Operador A"))
        self.assertEqual(a["pontos"]["19"], (50.0, "DC"))
        self.assertEqual(a["pontos"]["20"], (22.0, "AC"))

    def test_ids_de_ponto_repetidos_entre_sites(self):
        # "19" existe no SITE-A e no SITE-B, com tarifas diferentes.
        self.assertEqual(self.tarifas["SITE-A|19"], {"kwh": 0.25, "min": 0.05})
        self.assertEqual(self.tarifas["SITE-B|19"], {"kwh": 0.15})

    def test_precos_absurdos_e_expirados_ficam_de_fora(self):
        t = self.tarifas["SITE-B|19"]
        self.assertNotIn("min", t)          # 3,00 €/min é rejeitado
        self.assertEqual(t["kwh"], 0.15)    # a de 0,10 já expirou

    def test_pontos_removidos_ignorados(self):
        self.assertNotIn("SITE-C|1", self.tarifas)

    def test_juncao_compacta(self):
        postos = tarifas_ev.juntar(self.sites, self.tarifas)
        por_op = {p[2]: p for p in postos}
        self.assertEqual(set(por_op), {"Operador A", "Operador B"})
        # Pontos 20 e 21 são iguais: aparecem uma vez.
        self.assertEqual(por_op["Operador A"][3], [[22.0, "AC", 0, 0.02, 0.3], [50.0, "DC", 0.25, 0.05, 0]])

    def test_main_escreve_json(self):
        with tempfile.TemporaryDirectory() as d:
            saida = os.path.join(d, "t.json")
            rc = tarifas_ev.main(["--infra", INFRA, "--status", STATUS, "--saida", saida, "--agora", AGORA])
            self.assertEqual(rc, 0)
            with open(saida, encoding="utf-8") as f:
                linha = json.load(f)
            self.assertEqual(linha["id"], "mobie")
            self.assertEqual(linha["n_postos"], 2)
            self.assertEqual(linha["publicado_em"], "2026-11-06T10:00:00Z")


class TestDownloadIncompleto(unittest.TestCase):
    def test_xml_cortado_repete_e_troca_de_servidor(self):
        # Simula o caso real: o 1.º download chega cortado, o 2.º vem inteiro.
        with open(INFRA, "rb") as f:
            completo = f.read()
        chamadas = []

        def abrir_falso(urls):
            chamadas.append(list(urls))
            dados = completo[: len(completo) // 2] if len(chamadas) == 1 else completo
            return io.BytesIO(dados)

        original, dormir = tarifas_ev.abrir, tarifas_ev.time.sleep
        tarifas_ev.abrir, tarifas_ev.time.sleep = abrir_falso, lambda s: None
        try:
            sites, _ = tarifas_ev.com_tentativas(["u1", "u2"], tarifas_ev.ler_inventario, "teste")
        finally:
            tarifas_ev.abrir, tarifas_ev.time.sleep = original, dormir
        self.assertEqual(set(sites), {"SITE-A", "SITE-B", "SITE-C"})
        self.assertEqual(chamadas, [["u1", "u2"], ["u2", "u1"]])

    def test_desiste_ao_fim_das_tentativas(self):
        original, dormir = tarifas_ev.abrir, tarifas_ev.time.sleep
        tarifas_ev.abrir = lambda urls: io.BytesIO(b"<a><b>")
        tarifas_ev.time.sleep = lambda s: None
        try:
            with self.assertRaises(tarifas_ev.ET.ParseError):
                tarifas_ev.com_tentativas(["u1", "u2"], tarifas_ev.ler_inventario, "teste")
        finally:
            tarifas_ev.abrir, tarifas_ev.time.sleep = original, dormir


if __name__ == "__main__":
    unittest.main()
