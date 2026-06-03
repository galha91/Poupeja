// pages/api/folhetos.js
import folhetos from "../../public/folhetos.json";

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
  res.status(200).json(folhetos);
}
