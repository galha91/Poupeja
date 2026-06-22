const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const svg = fs.readFileSync(path.join(__dirname, "../public/icon.svg"));
const assetsDir = path.join(__dirname, "../assets");
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

async function run() {
  // icon-only 1024x1024
  await sharp(svg).resize(1024, 1024).png()
    .toFile(path.join(assetsDir, "icon-only.png"));
  console.log("✅ icon-only.png");

  // splash 2732x2732
  const icon600 = await sharp(svg).resize(600, 600).png().toBuffer();
  await sharp({ create: { width: 2732, height: 2732, channels: 4, background: "#064e3b" } })
    .composite([{ input: icon600, gravity: "center" }])
    .png()
    .toFile(path.join(assetsDir, "splash.png"));
  console.log("✅ splash.png");

  console.log("\nAgora corre: npx cap-assets generate");
}

run().catch(console.error);
