require('dotenv').config();

const express = require('express');
const cors = require('cors');
const vehicleRoutes = require('../routes/vehicleRoutes');
const rentalRoutes = require('../routes/rentalRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/rentals', rentalRoutes);

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
