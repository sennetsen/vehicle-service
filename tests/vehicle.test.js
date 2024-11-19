/** This file contains the tests for the Vehicle Service API. 
  * The tests are written with the Jest testing framework, and the 
  * Supertest library is used to test these HTTP requests.
  * All tests initialize the database before each test, and clear the 
  * database of all records after all tests are complete so that each test 
  * does not interfere with the results of another test.
  */

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

/* Set of test vehicles of varying vins, manufacturers, models, years, 
  horsepower, purchase prices, and fuel types. */
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

const broken_audi = {
  vin: '123456',
  manufacturer_name: 'Audi',
  description: 'Gasoline car',
  horse_power: 400,
  model_name: 'A4',
  model_year: 2023,  
  purchase_price: -70.12,
};

// Clear the vehicle table in the database before each test
async function clearVehicles() {
  try {
    await pool.query('DELETE FROM vehicle');
    console.log('All rows cleared from vehicle table');
  } catch (err) {
    console.error('Error: could not clear the vehicle table: ', err);
  }
}

describe('Vehicle Service API', () => {
  // Clear the vehicle table in the database before each test
  beforeEach(async () => {
    await clearVehicles();
  });

  // Clear the database of all vehicle records after all tests are complete
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

  // Test 5: DELETE /vehicle/:vin should delete a vehicle and return a success message
  it('should delete a vehicle and return a success message', async () => {
    // Send a Tesla Model S to the database
    await request(app).post('/vehicle').send(tesla_model_s);

    const deleteRes = await request(app).delete(`/vehicle/${tesla_model_s.vin}`);
    expect(deleteRes.status).toBe(204);

    // Check that the vehicle was correctly deleted from the database
    const getRes = await request(app).get(`/vehicle/${tesla_model_s.vin}`);
    expect(getRes.status).toBe(404);
  });

  // Test 6: DELETE /vehicle/:vin should return a 404 error if the vehicle is not found
  it('should return a 404 error if the vehicle is not found', async () => {
    // Send a Tesla Model S and a Toyota Prius to the database
    await request(app).post('/vehicle').send(tesla_model_s);
    await request(app).post('/vehicle').send(toyota_prius);
      
    // Attempt to delete a vehicle that does not exist currently in the database
    const res = await request(app).delete(`/vehicle/${toyota_corolla.vin}`);
    expect(res.status).toBe(404);
  });

  // Test 7: POST /vehicle should return a 422 error if the vehicle is missing required fields
  it('should return a 422 error if the vehicle is missing a required field', async () => {
    // Send a broken Audi vehicle record to the database
    const res = await request(app).post('/vehicle').send(broken_audi);
    expect(res.status).toBe(422);
    expect(res.body).toEqual({
      errors: {
        fuel_type: 'Fuel type is required and must be a string',
        purchase_price: 'Purchase price is required and must be a number greater than or equal to 0'
      }
    });
  });

  // Test 8: PUT /vehicle/:vin should return a 422 error (validation error) if the vehicle is missing required fields
  it('should return a 422 error if the vehicle is missing required fields', async () => {
    // Send a broken Audi vehicle record to the database
    const res = await request(app).put(`/vehicle/${broken_audi.vin}`).send(broken_audi);
    expect(res.status).toBe(422);
  });

  // Test 9: Error handling for malformed JSON requests (SyntaxErrors)
  it('should return a 400 error if the request body is malformed JSON', async () => {
    // Send a malformed JSON request
    const malformedJSON = "{ 'vin': '123ABC', 'manufacturer_name':: 'Toyota' ";
    const res = await request(app)
      .post('/vehicle')
      .set('Content-Type', 'application/json')
      .send(malformedJSON);
    expect(res.status).toBe(400);
  });

});

