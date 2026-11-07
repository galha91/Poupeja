// Usar com: node --import ./scripts/cron/carregador.mjs <script>
import { register } from "node:module";
register("./hooks.mjs", import.meta.url);
