require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");

// Create a connection pool using DATABASE_URL or individual vars
const connectionConfig = process.env.DATABASE_URL
  ? process.env.DATABASE_URL
  : {
      host: process.env.DB_HOST || "127.0.0.1",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "citizen_security_v2",
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_POOL_MAX || "10", 10),
    };

// mask password when logging
const maskedConfig = { ...connectionConfig };
if (maskedConfig.password) maskedConfig.password = "********";
console.log("MCP pool config:", maskedConfig);

const pool = mysql.createPool(connectionConfig);

const app = express();
app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 as ok");
    res.json({ ok: !!rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Example MCP endpoint (replace with real logic)
app.post("/mcp/query", async (req, res) => {
  const { query } = req.body;
  try {
    const [rows] = await pool.query(query || "SELECT NOW() as now");
    res.json({ rows });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`MCP server listening on port ${port}`);
});
