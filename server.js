const express = require("express");
const path = require("path");
const app = express();
const PORT = 5000;

// Body parsing
app.use(express.json());

// Simple request logger to help debug 404s
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.originalUrl);
  next();
});

// Static files
app.use(express.static(path.join(__dirname, "src", "public")));

// Routes
const viewRoutes = require("./src/routes/viewRoutes");
app.use("/", viewRoutes);
const apiRoutes = require("./src/routes/apiRoutes");
app.use("/api", apiRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en:`);
  console.log(`- Local: http://localhost:${PORT}`);
  console.log(`- Red local: http://192.168.137.220:${PORT}`);
});
