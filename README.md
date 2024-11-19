# Apollo Vehicle API Service

A RESTful API service for managing vehicle data using Node.js, Express, and PostgreSQL.

## Requirements

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm (Node Package Manager)

## How to setup

1. Clone the repository:
```bash
git clone https://github.com/sennet-sen/vehicle-service.git
```

2. Install the necessary dependencies (based on the entities listed in package.json):
```bash
npm install
```
3. Create a `.env` file in the project directory with the following environment variables:
```bash
DB_USER=your_postgres_username
DB_HOST=localhost
DB_NAME=your_database_name
DB_PASSWORD=your_postgres_password
DB_PORT=5432
```

4. Create a PostgreSQL database as follows, and run the following SQL query to create the vehicle table:
```sql
CREATE DATABASE vehicle_service;

CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE vehicle (
    vin CITEXT PRIMARY KEY,
    manufacturer_name VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    horse_power INTEGER NOT NULL,
    model_name VARCHAR NOT NULL,
    model_year INTEGER NOT NULL,
    purchase_price DECIMAL(1000, 2) NOT NULL,
    fuel_type VARCHAR NOT NULL
);
```

5. Now the server is ready to start. Start it with the following command:
```bash
npm start
```

## Vehicle ServiceAPI Endpoints

### GET /vehicle
Returns a list of all vehicles in the database.

### GET /vehicle/{vin}
Returns a specific vehicle by searching for its VIN.

### POST /vehicle
Creates a new vehicle object. Required fields include:
- vin (string)
- manufacturer_name (string)
- description (string)
- horse_power (integer)
- model_name (string)
- model_year (integer)
- purchase_price (decimal)
- fuel_type (string)

### PUT /vehicle/{vin}
Updates an existing vehicle. It requires the same fields as POST.

### DELETE /vehicle/{vin}
Deletes a vehicle by searching for its VIN.

## Running Tests via Jest and Supertest in the Command Line

To run the test suite, run the following command in the terminal:
```bash
npm test
```

## Error Handling

The API returns the following HTTP status codes, as appropriate:
- 200: Success
- 201: Vehicle object created
- 400: Bad/misformed request
- 404: Vehicle object not found
- 422: Validation error
- 500: Internal server error
