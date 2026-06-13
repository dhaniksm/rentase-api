require('dotenv').config();

const express = require('express');
const cors = require('cors');
const vehicleRoutes = require('../routes/vehicleRoutes');
const rentalRoutes = require('../routes/rentalRoutes');
const paymentRoutes = require('../routes/paymentRoutes');
const locationRoutes = require('../routes/locationRoutes');
const dashboardRoutes = require('../routes/dashboardRoutes');
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("../swagger");

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCssUrl: "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css",
  })
);

module.exports = app;

app.get("/", (req, res) => {
  res.json({
    message: "RentEase API",
    docs: "/api-docs",
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'RentEase API Running'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
