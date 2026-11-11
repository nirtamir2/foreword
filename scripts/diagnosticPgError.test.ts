import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";
import { z } from "zod";

it.each(["42704", "22023", "0A000", "55P02", "F0000", "XX000", "08007", "ZZZZZ"])(
  "sanitizes actual pg-protocol ErrorResponse class and SQLSTATE %s",
  (code) => {
    const canary = "postgresql://never-print:never-print@invalid/private";
    const source = String.raw`
      import {createRequire} from "node:module";
      import {PassThrough} from "node:stream";
      import {diagnosticErrorClass} from ${JSON.stringify(new URL("../packages/db/scripts/diagnosticErrorClass.mjs", import.meta.url).href)};
      import {diagnosticErrorCode} from ${JSON.stringify(new URL("../packages/db/scripts/diagnosticErrorCode.mjs", import.meta.url).href)};
      const dbRequire=createRequire(${JSON.stringify(new URL("../packages/db/package.json", import.meta.url).href)});
      const pgRequire=createRequire(dbRequire.resolve("pg"));
      const {parse}=pgRequire("pg-protocol");
      const fields=Buffer.from("SERROR\0C"+${JSON.stringify(code)}+"\0M"+${JSON.stringify(canary)}+"\0\0");
      const header=Buffer.alloc(5);header[0]=69;header.writeInt32BE(fields.length+4,1);
      const stream=new PassThrough();
      const done=parse(stream,error=>console.log(JSON.stringify({name:diagnosticErrorClass(error),code:diagnosticErrorCode(error)})));
      stream.end(Buffer.concat([header,fields]));await done;
    `;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", source], {
      env: {},
      encoding: "utf8",
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).not.toContain(canary);
    const safe = z.object({ name: z.string(), code: z.string() }).parse(JSON.parse(result.stdout));
    expect(safe).toEqual({ name: "error", code: code === "ZZZZZ" ? "UNCLASSIFIED" : code });
  },
);
