import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

const { Pool } = pg;

function buildPoolConfig(database) {
  const connectionString = process.env.DATABASE_URL?.trim();

  if (connectionString) {
    const url = new URL(connectionString);
    const isLocalHost = ["localhost", "127.0.0.1"].includes(url.hostname);

    if (database) {
      url.pathname = `/${database}`;
    }

    return {
      connectionString: url.toString(),
      ssl: isLocalHost ? undefined : { rejectUnauthorized: false },
    };
  }

  return {
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST || "localhost",
    port: Number(process.env.POSTGRES_PORT || 5432),
    database,
  };
}

function getDatabaseName() {
  const databaseName = process.env.POSTGRES_DB?.trim();

  if (databaseName) {
    return databaseName;
  }

  const connectionString = process.env.DATABASE_URL?.trim();

  if (connectionString) {
    const url = new URL(connectionString);
    const derivedName = url.pathname.replace(/^\/+/, "").trim();

    if (derivedName) {
      return derivedName;
    }
  }

  throw new Error("Missing POSTGRES_DB or DATABASE_URL in environment");
}

export async function getDbPool() {
  const databaseName = getDatabaseName();
  const targetPool = new Pool(buildPoolConfig(databaseName));
  const isProduction = process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT;;

  try {
    await targetPool.query("SELECT 1");
    return targetPool;
  } catch (error) {
    if (error.code !== "3D000") {
      await targetPool.end();
      throw error;
    }

    if (isProduction) {
      await targetPool.end();
      throw new Error(
        `Database \"${databaseName}\" does not exist. Create it in Railway before deploying.`,
      );
    }

    await targetPool.end();

    const adminPool = new Pool(buildPoolConfig("postgres"));

    try {
      await adminPool.query(
        `CREATE DATABASE "${databaseName.replaceAll('"', '""')}"`,
      );
    } catch (createError) {
      if (createError.code !== "42P04") {
        await adminPool.end();
        throw createError;
      }
    }

    await adminPool.end();

    return new Pool(buildPoolConfig(databaseName));
  }
}
