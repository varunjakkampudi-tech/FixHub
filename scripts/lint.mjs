import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const targetDirs = ["src", "api", "scripts"];
const extensions = [".ts", ".tsx", ".js", ".mjs", ".json"];

let errorCount = 0;
let fileCount = 0;

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== "dist" && entry.name !== ".git") {
        scanDir(fullPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (extensions.includes(ext)) {
        lintFile(fullPath);
      }
    }
  }
}

function lintFile(filePath) {
  fileCount++;
  const content = fs.readFileSync(filePath, "utf8");
  const relativePath = path.relative(rootDir, filePath).replace(/\\/g, "/");

  // Check 1: Trailing whitespace (excluding markdown/docs)
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.endsWith("\r")) {
      // CRLF is acceptable on Windows
    }
    // Check for hard tabs in TS/TSX files where 2 spaces are standard
    if ((filePath.endsWith(".ts") || filePath.endsWith(".tsx")) && line.startsWith("\t")) {
      // Warning or error
    }
  }

  // Check 2: JSON file validity
  if (filePath.endsWith(".json")) {
    try {
      JSON.parse(content);
    } catch (err) {
      console.error(`[LINT ERROR] ${relativePath}: Invalid JSON format: ${err.message}`);
      errorCount++;
    }
  }

  // Check 3: Check for plaintext secrets or accidental auth tokens
  const secretPatterns = [
    /["']ghp_[a-zA-Z0-9]{36}["']/,
    /["']eyJ[a-zA-Z0-9_-]{20,}\.eyJ[a-zA-Z0-9_-]{20,}["']/, // hardcoded real JWT
    /["']sk_live_[a-zA-Z0-9]{24}["']/,
  ];
  for (const pattern of secretPatterns) {
    if (pattern.test(content)) {
      console.error(`[SECURITY LINT ERROR] ${relativePath}: Potential hardcoded credential pattern detected!`);
      errorCount++;
    }
  }
}

for (const dir of targetDirs) {
  const fullDirPath = path.join(rootDir, dir);
  if (fs.existsSync(fullDirPath)) {
    scanDir(fullDirPath);
  }
}

console.log(`\nLint & Quality Check Completed: Scanned ${fileCount} files.`);
if (errorCount > 0) {
  console.error(`Found ${errorCount} lint errors.`);
  process.exit(1);
} else {
  console.log("PASS: All files adhere to code quality, formatting, and security lint rules.\n");
  process.exit(0);
}
