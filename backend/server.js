require("dotenv").config();
const app = require("./src/app");
const pool = require("./src/config/db");

const PORT = process.env.PORT || 3001;

// Sin secreto, jwt.sign/verify fallarían en cada petición; mejor no arrancar.
if (!process.env.JWT_SECRET) {
  console.error("❌ Falta JWT_SECRET. Defínelo en .env (ver .env.example).");
  process.exit(1);
}

async function waitForDB() {
  while (true) {
    try {
      await pool.query("SELECT 1");
      console.log("✅ Conectado a MySQL");
      break;
    } catch (error) {
      console.log("⏳ Esperando MySQL...");
      await new Promise(res => setTimeout(res, 3000));
    }
  }
}

async function startServer() {
  await waitForDB();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor corriendo en ${PORT}`);
  });
}

startServer();