import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Reads repo-root deployments/localhost.json (written by contracts/scripts/deploy.js).
 * Lets the relayer pick up a new address after redeploy without editing .env.
 */
export function loadLocalDeployment() {
  const filePath = path.join(__dirname, "..", "..", "deployments", "localhost.json");
  try {
    if (!fs.existsSync(filePath)) return null;
    const j = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!j.address || typeof j.address !== "string") return null;
    return {
      address: String(j.address).trim(),
      chainId: typeof j.chainId === "number" && Number.isFinite(j.chainId) ? j.chainId : 31337,
    };
  } catch {
    return null;
  }
}
