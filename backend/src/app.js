
const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/auth.routes");
const app = express();

const categoriesRoutes = require("./routes/categories.routes");
const productsRoutes = require("./routes/products.routes");
const businessRoutes = require("./routes/business.routes");


const authMiddleware = require("./middlewares/auth.middleware");
const storeRoutes = require("./routes/store.routes");
const adminRoutes = require("./routes/admin.routes");
const customersRoutes = require("./routes/customers.routes");
const statsRoutes = require("./routes/stats.routes");

app.use(cors());
app.use(express.json());

// Servir archivos estáticos (imágenes)
app.use("/api/images", express.static(
  path.join(__dirname, "../images")
));

app.get("/", (req, res) => {
    res.json({ message: "API funcionando 🚀" });
});


app.get("/", (req, res) => {
    res.json({ message: "API funcionando 🚀" });
});

app.get("/api/test-protected", authMiddleware, (req, res) => {
    res.json({
        message: "Ruta protegida OK",
        user: req.user
    });
});


// Rutas protegidas

app.use("/api/categories", categoriesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/stats", statsRoutes);

// Último recurso para errores no capturados (p. ej. JSON mal formado): responde con un mensaje
// genérico. Sin esto, Express devuelve la traza interna del error al cliente.
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "JSON inválido" });
  }
  console.error(err);
  res.status(err.status && err.status < 500 ? err.status : 500).json({ message: "Error del servidor" });
});

module.exports = app;

