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
    const vehicle = {
      vin: '1A2B3C4D5E6F7G8H9',
      manufacturer_name: 'Toyota',
      description: 'Compact car',
      horse_power: 120,
      model_name: 'Corolla',
      model_year: 2022,
      purchase_price: 20000.08,
      fuel_type: 'Gasoline',
    };

    const res = await request(app).post('/vehicle').send(vehicle);
    expect(res.status).toBe(201);
    expect(res.body).toEqual(vehicle);
  });

  it('should return a vehicle by vin', async () => {
    const vehicle = {
      vin: 'ABCDEF',
      manufacturer_name: 'Toyota',
      description: 'Compact car',
      horse_power: 120,
      model_name: 'Corolla',
      model_year: 2022,
      purchase_price: 20000.0,
      fuel_type: 'Gasoline',
    };

    await request(app).post('/vehicle').send(vehicle);
    const res = await request(app).get(`/vehicle/${vehicle.vin}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining(vehicle));
  });

  it('should update a vehicle and return the updated vehicle object', async () => {
    const vehicle = {
      vin: '123ABC',
      manufacturer_name: 'Toyota',
      description: 'Compact car',
      horse_power: 120,
      model_name: 'Corolla',
      model_year: 2022,
      purchase_price: 20000.0,
      fuel_type: 'Gasoline',
    };

    const new_manufacturer_name = 'Honda';
    const new_description = 'Updated description';
    const new_horse_power = 200;
    const new_purchase_price = 37234.13;

    await request(app).post('/vehicle').send(vehicle);

    const updatedVehicle = {
        ...vehicle,
        manufacturer_name: 'Honda',
        model_name: 'CRV',
        description: 'Luxury SUV',
        horse_power: 200,
        purchase_price: 37234.13
    };

    const res = await request(app).put(`/vehicle/${vehicle.vin}`).send(updatedVehicle);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining(updatedVehicle));

    const get_res = await request(app).get(`/vehicle/${vehicle.vin}`);
    expect(get_res.status).toBe(200);
    expect(get_res.body).toEqual(expect.objectContaining(updatedVehicle));
  });

});

