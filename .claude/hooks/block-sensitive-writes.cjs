#!/usr/bin/env node
// PreToolUse hook — enforcement determinista de la regla "Nunca commitees .env*"
// (y llaves privadas) del contrato de seguridad. Bloquea Write/Edit/MultiEdit
// sobre archivos sensibles devolviendo exit 2. Ver .claude/rules/security.md.
const fs = require("fs");

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

let data;
try {
  data = JSON.parse(readStdin() || "{}");
} catch {
  // Input ilegible → fail-open para no romper el flujo de trabajo.
  process.exit(0);
}

const tool = data.tool_name || "";
if (!["Write", "Edit", "MultiEdit", "NotebookEdit"].includes(tool)) {
  process.exit(0);
}

const input = data.tool_input || {};
const filePath = String(
  input.file_path || input.notebook_path || input.path || ""
);
const base = filePath.split(/[\\/]/).pop() || "";

// Plantillas versionables permitidas (no contienen secretos reales).
const isAllowedExample = /\.(example|sample|template)$/i.test(base);

// Secretos inequívocos: .env y variantes, llaves privadas, credenciales.
const sensitive =
  /^\.env(\..+)?$/i.test(base) ||
  /\.(pem|key|p12|pfx)$/i.test(base) ||
  /^(id_rsa|id_ed25519|id_ecdsa)$/i.test(base) ||
  base === ".netrc";

if (sensitive && !isAllowedExample) {
  process.stderr.write(
    `🔒 BLOQUEADO por hook de seguridad: no se permite escribir en "${filePath}".\n` +
      `Los archivos de secretos (.env*, llaves privadas, credenciales) nunca se ` +
      `editan ni se commitean (ver .claude/rules/security.md, regla #8). ` +
      `Para plantillas usa un archivo .env.example.\n`
  );
  process.exit(2);
}

process.exit(0);
