import { spawn } from "node:child_process";
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const envFilePath = path.resolve(process.cwd(), "../../apps/web/.env");

async function backupDb() {
  const databaseUrl = await getDatabaseUrl();

  if (databaseUrl == null || databaseUrl.length === 0) {
    throw new Error(`DATABASE_URL is missing. Set it in ${envFilePath} or your shell environment.`);
  }

  const backupsPath = path.resolve(process.cwd(), "backups");

  await mkdir(backupsPath, { recursive: true });

  const next = formatTimestamp({ date: new Date() });
  const outputPath = path.join(backupsPath, `${next}.bak`);

  await runPgDump({
    databaseUrl,
    outputPath,
  });

  console.log(`Database backup saved to ${outputPath}`);
}

async function getDatabaseUrl() {
  if (process.env.DATABASE_URL != null && process.env.DATABASE_URL.length > 0) {
    return process.env.DATABASE_URL;
  }

  const envContents = await readFile(envFilePath, "utf8").catch((error) => {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  });

  if (envContents == null || envContents.length === 0) {
    return null;
  }

  const databaseUrl = parseEnvValue({
    envContents,
    key: "DATABASE_URL",
  });

  if (databaseUrl == null || databaseUrl.length === 0) {
    return null;
  }

  process.env.DATABASE_URL = databaseUrl;

  return databaseUrl;
}

function formatTimestamp({ date }) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

function parseEnvValue({ envContents, key }) {
  const envLine = envContents.match(new RegExp(`^(?:export\\s+)?${key}\\s*=\\s*(.+)$`, "m"));

  if (envLine == null) {
    return null;
  }

  const rawValue = envLine[1].trim();

  if (
    (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
    (rawValue.startsWith("'") && rawValue.endsWith("'"))
  ) {
    return rawValue.slice(1, -1);
  }

  return rawValue;
}

async function runPgDump({ databaseUrl, outputPath }) {
  const dumpProcess = spawn("pg_dump", [`--dbname=${databaseUrl}`, `--file=${outputPath}`], {
    stdio: "inherit",
  });

  try {
    const result = await new Promise((resolve, reject) => {
      dumpProcess.on("close", (code, signal) => {
        resolve({ code, signal });
      });

      dumpProcess.on("error", reject);
    });

    if (result.signal != null) {
      throw new Error(`pg_dump terminated with signal ${result.signal}`);
    }

    if (result.code !== 0) {
      throw new Error(`pg_dump exited with code ${result.code}`);
    }
  } catch (error) {
    await rm(outputPath, { force: true });
    throw error;
  }
}

void backupDb().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
