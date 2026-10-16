// Crea un superadministrador de la plataforma (o cambia la contraseña de uno existente).
// Uso, con los contenedores en marcha:
//   docker exec -it backend_app node scripts/create-superadmin.js <email> <contraseña>
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 8) {
    console.error("Uso: node scripts/create-superadmin.js <email> <contraseña de 8 caracteres o más>");
    process.exitCode = 1;
    return;
  }

  const [existing] = await pool.query("SELECT id, role FROM users WHERE email = ?", [email]);
  if (existing.length > 0 && existing[0].role !== "superadmin") {
    console.error("Ese email ya pertenece a un usuario de una tienda.");
    process.exitCode = 1;
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  if (existing.length > 0) {
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, existing[0].id]);
    console.log(`Contraseña actualizada para el superadministrador ${email}.`);
  } else {
    await pool.query(
      "INSERT INTO users (business_id, email, password, role) VALUES (NULL, ?, ?, 'superadmin')",
      [email, hashedPassword]
    );
    console.log(`Superadministrador ${email} creado.`);
  }
}

main()
  .catch((error) => {
    console.error("Error creando el superadministrador:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
