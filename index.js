const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const types = require('pg').types;

types.setTypeParser(23, parseInt); // Type for INTEGER
types.setTypeParser(1700, parseFloat); // Type for NUMERIC/DECIMAL

dotenv.config();

const app = express();
const PORT = 3000;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const validate = (vehicle) => {
  const errors = {};
  if (!vehicle.vin || typeof vehicle.vin !== 'string') {
    errors.vin = 'VIN is required and must be a string';
  }
  if (!vehicle.manufacturer_name || typeof vehicle.manufacturer_name !== 'string') {
    errors.manufacturer_name = 'Manufacturer name is required and must be a string';
  }
  if (!vehicle.description || typeof vehicle.description !== 'string') {
    errors.description = 'Description is required and must be a string';
  }
  if (!vehicle.horse_power || !Number.isInteger(vehicle.horse_power) || vehicle.horse_power < 0) {
    errors.horse_power = 'Horsepower is required and must be an integer greater than or equal to 0';
  }
  if (!vehicle.model_name || typeof vehicle.model_name !== 'string') {
    errors.model_name = 'Model name is required and must be a string';
  }
  if (!vehicle.model_year || typeof vehicle.model_year !== 'number' || vehicle.model_year < 0) {
    errors.model_year = 'Model year is required and must be an integer greater than or equal to 0';
  }
  if (!vehicle.purchase_price || typeof vehicle.purchase_price !== 'number' || vehicle.purchase_price < 0) {
    errors.purchase_price = 'Purchase price is required and must be a number greater than or equal to 0';
  }
  if (!vehicle.fuel_type || typeof vehicle.fuel_type !== 'string') {
    errors.fuel_type = 'Fuel type is required and must be a string';
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

app.use(bodyParser.json());

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON request.' });
  }
});



app.get('/', (req, res) => {
  res.send('Welcome to the Vehicle Service API.');
});

app.get('/vehicle', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehicle');
    res.status(200).json(result.rows);
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/vehicle', async (req, res) => {
  const errors = validate(req.body);
  if (errors) {
    return res.status(422).json({ errors });
  }

  const { vin, manufacturer_name, description, horse_power, model_name, model_year, purchase_price, fuel_type } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Vehicle (vin, manufacturer_name, description, horse_power, model_name, model_year, purchase_price, fuel_type) VALUES ($1, $2, $3, $4::integer, $5, $6::integer, $7::decimal, $8) RETURNING *',
      [vin, manufacturer_name, description, horse_power, model_name, model_year, purchase_price, fuel_type]
    );

    res.status(201).json(result.rows[0]);
  }
  catch (err) {
    res.status(500).json({ error: 'An error occurred creating the vehicle.' });
  }
});

app.get('/vehicle/{:vin}', async (req, res) => {
  const errors = validate(req.params.body);
  if (errors) {
    return res.status(422).json({ errors });
  }

  const { vin } = req.params;
  if (!vehicle.description || typeof vehicle.description !== 'string') {
    return res.status(400).json({ error: 'Description is required and must be a string' });
  }

  try {
    const result = await pool.query('SELECT * FROM vehicle WHERE vin = $1', [req.params.vin]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.status(200).json(result.rows[0]);
  }
  catch (err) {
    res.status(500).json({ error: 'An error occurred retrieving the vehicle.' });
  }
})

app.put('/vehicle/{:vin}', async (req, res) => {
  const errors = validate(req.body);
  if (errors) {
    return res.status(422).json({ errors });
  }

  const { vin } = req.params;
  const { manufacturer_name, description, horse_power, model_name, model_year, purchase_price, fuel_type } = req.body;

  try {
    const result = await pool.query(
      'UPDATE vehicle SET manufacturer_name = $1, description = $2, horse_power = $3, model_name = $4, model_year = $5, purchase_price = $6, fuel_type = $7 WHERE vin = $8 RETURNING *',
      [manufacturer_name, description, horse_power, model_name, model_year, purchase_price, fuel_type, vin]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.status(200).json(result.rows[0]);
  }
  catch (err) {
    res.status(500).json({ error: 'An error occurred updating the vehicle.' });
  }
});

app.delete('/vehicle/{:vin}', async (req, res) => {
  const { vin } = req.params;

  try {
    const result = await pool.query('DELETE FROM vehicle WHERE vin = $1', [vin]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
  }
  catch (err) {
    res.status(500).json({ error: 'An error occurred deleting the vehicle.' });
  }
});



if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Vehicle Service server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;


