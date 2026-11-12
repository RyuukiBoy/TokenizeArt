const fs = require("node:fs");
const path = require("node:path");

// Hardhat rejects source and script files outside its project root. Keep the
// documented code/ and mint/ files canonical and create ignored build copies.
const projectRoot = path.resolve(__dirname, "../..");
const copies = [
  [path.join(projectRoot, "code/contracts"), path.join(__dirname, "../contracts")],
  [path.join(projectRoot, "code/test"), path.join(__dirname, "../test")],
  [path.join(projectRoot, "mint/scripts"), path.join(__dirname, "mint")]
];

for (const [source, destination] of copies) {
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(destination, { recursive: true });
  if (fs.existsSync(source)) fs.cpSync(source, destination, { recursive: true });
}
