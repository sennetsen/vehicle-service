const request = require('supertest');
const app = require('../index');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Set of test vehicles of varying vins, manufacturers, models, years, horsepower, 
// technologies,and prices
const toyota_corolla = {
  vin: '1A2B3C4D5E6F7G8H9',
  manufacturer_name: 'Toyota',
  description: 'Compact car',
  horse_power: 120,
  model_name: 'Corolla',
  model_year: 2022,
  purchase_price: 20000.08,
  fuel_type: 'Gasoline',
};

const bmw_x5 = {
  vin: 'ABCDEF',
  manufacturer_name: 'BMW',
  description: 'Luxury SUV',
  horse_power: 300,
  model_name: 'X5',
  model_year: 2014,
  purchase_price: 50000.0,
  fuel_type: 'Gasoline',
};

const tesla_model_s = {
  vin: '123456',
  manufacturer_name: 'Tesla',
  description: 'Electric car',
  horse_power: 400,
  model_name: 'Model S',
  model_year: 2023,
  purchase_price: 70330.12,
  fuel_type: 'Electric',
};

const toyota_prius = {
  vin: '7890AB',
  manufacturer_name: 'Toyota',
  description: 'Hybrid car',
  horse_power: 120,
  model_name: 'Prius',
  model_year: 2006,
  purchase_price: 25000.0,
  fuel_type: 'Hybrid',
};

async function clearVehicles() {
  try {
    await pool.query('DELETE FROM vehicle');
    console.log('All rows cleared from vehicle table');
  } catch (err) {
    console.error('Error: could not clear the vehicle table: ', err);
  }
}

describe('Vehicle Service API', () => {
  beforeEach(async () => {
    await clearVehicles();
  });

  afterAll(async () => {
    await clearVehicles();
    await pool.end();
  });

  // Test 1: GET /vehicle should return an empty list of vehicles
  it('should return a list of vehicles in JSON format', async () => {
    const res = await request(app).get('/vehicle');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // Test 2: POST /vehicle should add a new vehicle and return it
  it('should add a new vehicle and return it', async () => {
    // Send a Toyota Corolla to the database
    const res = await request(app).post('/vehicle').send(toyota_corolla);
    expect(res.status).toBe(201);
    expect(res.body).not.toEqual(bmw_x5);
    expect(res.body).toEqual(toyota_corolla);
  });

  // Test 3: GET /vehicle/:vin should return a vehicle by vin
  it('should return a vehicle by vin', async () => {
    // Request a Toyota Corolla from the database
    await request(app).post('/vehicle').send(toyota_corolla);
    const res = await request(app).get(`/vehicle/${toyota_corolla.vin}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(toyota_corolla);
  });

  // Test 4: PUT /vehicle/:vin should update a vehicle and return its updated vehicle object
  it('should update a vehicle and return the updated vehicle object', async () => {
    const new_manufacturer_name = 'Honda';
    const new_description = 'Updated description';
    const new_horse_power = 200;
    const new_purchase_price = 37234.13;

    // Send a BMW X5 to the database
    await request(app).post('/vehicle').send(bmw_x5);

    const updatedVehicle = {
        ...bmw_x5,
        manufacturer_name: 'Honda',
        model_name: 'CRV',
        description: 'Luxury SUV',
        horse_power: 200,
        purchase_price: 37234.13
    };

    const res = await request(app).put(`/vehicle/${bmw_x5 .vin}`).send(updatedVehicle);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedVehicle);

    // Check that the vehicle was correctly updated in the database
    const get_res = await request(app).get(`/vehicle/${bmw_x5.vin}`);
    expect(get_res.status).toBe(200);
    expect(get_res.body).toEqual(updatedVehicle);
  });

});

