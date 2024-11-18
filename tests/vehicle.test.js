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

});

