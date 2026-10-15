require("dotenv").config();
const app = require("./src/app");
const pool = require("./src/config/db");

const PORT = process.env.PORT || 3001;

// En producción el secreto es obligatorio. En desarrollo, si falta, se genera
// uno aleatorio para que el proyecto arranque sin configurar nada; las sesiones
// abiertas se pierden al reiniciar el servidor.
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Falta JWT_SECRET. Defínelo en backend/.env (ver backend/.env.example).");
    process.exit(1);
  }
  process.env.JWT_SECRET = require("crypto").randomBytes(48).toString("hex");
  console.warn("⚠️  JWT_SECRET no definido: usando uno temporal (solo desarrollo).");
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