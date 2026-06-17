import "dotenv/config";
import mysql from "mysql2/promise";

async function dropAll() {
  const dbUrl = process.env.DATABASE_URL!;
  console.log("Connecting to DB...");
  const url = new URL(dbUrl);
  const conn = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
  });

  await conn.execute("SET FOREIGN_KEY_CHECKS = 0");
  const [tables] = await conn.execute("SHOW TABLES") as any[];
  for (const t of tables) {
    const tableName = Object.values(t)[0];
    await conn.execute(`DROP TABLE IF EXISTS \`${tableName}\``);
    console.log("Dropped:", tableName);
  }
  await conn.execute("SET FOREIGN_KEY_CHECKS = 1");
  await conn.end();
}

dropAll().catch(console.error);
