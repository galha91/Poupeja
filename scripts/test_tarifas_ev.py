"""Testes do extractor de tarifas MOBI.E (python3 -m unittest scripts/test_tarifas_ev.py)."""
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


if __name__ == "__main__":
    unittest.main()
