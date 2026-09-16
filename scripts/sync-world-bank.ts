import net from "node:net";
import tls from "node:tls";
import { Pool } from "pg";
import { syncAllWorldBankIndicators } from "../lib/sync/world-bank";
import { createSupabasePoolConfig } from "./postgres-ssl";

async function reportPublicCertificateChain(host: string, port: number) {
  await new Promise<void>((resolve) => {
    const socket = net.connect(port, host, () => {
      const request = Buffer.alloc(8);
      request.writeInt32BE(8, 0);
      request.writeInt32BE(80877103, 4);
      socket.write(request);
    });
    socket.setTimeout(10_000);
    socket.once("data", (reply) => {
      if (reply.toString() !== "S") {
        socket.destroy();
        return resolve();
      }
      const secure = tls.connect({ socket, servername: host, rejectUnauthorized: false }, () => {
        const certificates = [];
        const seen = new Set<string>();
        let certificate = secure.getPeerCertificate(true);
        while (certificate?.fingerprint256 && !seen.has(certificate.fingerprint256)) {
          seen.add(certificate.fingerprint256);
          certificates.push({
            subject: certificate.subject?.CN,
            issuer: certificate.issuer?.CN,
            fingerprint256: certificate.fingerprint256,
          });
          if (!certificate.issuerCertificate || certificate.issuerCertificate === certificate) break;
          certificate = certificate.issuerCertificate;
        }
        console.error("Database TLS endpoint diagnostics:", JSON.stringify({ host, port, certificates }));
        secure.end();
        resolve();
      });
      secure.once("error", () => resolve());
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve();
    });
    socket.once("error", () => resolve());
  });
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required and must point to this project's PostgreSQL database.");
const fromYear = Number(process.env.SYNC_FROM_YEAR ?? "1960");
const toYear = Number(process.env.SYNC_TO_YEAR ?? new Date().getUTCFullYear());
const databaseConfig = createSupabasePoolConfig(connectionString);
const databaseUrl = new URL(String(databaseConfig.connectionString));
const pool = new Pool({
  ...databaseConfig,
  max: 3,
  application_name: "global-economy-world-bank-sync",
});
try {
  const result = await syncAllWorldBankIndicators(pool, fromYear, toYear);
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "success") process.exitCode = 1;
} catch (error) {
  if (error instanceof Error && "code" in error && error.code === "SELF_SIGNED_CERT_IN_CHAIN") {
    await reportPublicCertificateChain(databaseUrl.hostname, Number(databaseUrl.port || 5432));
  }
  throw error;
} finally {
  await pool.end();
}
