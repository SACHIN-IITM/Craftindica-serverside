require('dotenv').config();


const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = 3000; 

app.use(cors());
app.use(bodyParser.json());


const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
  
      if (result.rows.length > 0) {
        res.json({ success: true, token: 'craftindica' });
      } else {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
    } catch (error) {
      console.error('Error during login:', error.message);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

app.post('/api/add-record', async (req, res) => {
    const newRecord = req.body;

    const insertQuery = 'INSERT INTO company_employee(name, salary, currency, department, sub_department, on_contract) VALUES($1, $2, $3, $4, $5, $6) RETURNING *';
    const values = [newRecord.name, newRecord.salary, newRecord.currency, newRecord.department, newRecord.sub_department, newRecord.on_contract || false];

    try {
        const result = await pool.query(insertQuery, values);
        res.json({ message: 'Record added successfully', record: result.rows[0] });
    } catch (error) {
        console.error('Error inserting record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.delete('/api/delete-record/:id', async (req, res) => {
    const recordId = req.params.id;

    const deleteQuery = 'DELETE FROM company_employee WHERE id = $1 RETURNING *';

    try {
        const result = await pool.query(deleteQuery, [recordId]);

        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Record not found' });
        } else {
            res.json({ message: 'Record deleted successfully', record: result.rows[0] });
        }
    } catch (error) {
        console.error('Error deleting record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/employees', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM company_employee');
        const employeeData = result.rows;
        res.json(employeeData);
    } catch (error) {
        console.error('Error fetching employee data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/salary-statistics', async (req, res) => {
    const statisticsQuery = 'SELECT AVG(salary) AS mean_salary, MIN(salary) AS min_salary, MAX(salary) AS max_salary FROM company_employee';

    try {
        const result = await pool.query(statisticsQuery);
        const statistics = result.rows[0];
        res.json(statistics);
    } catch (error) {
        console.error('Error fetching salary statistics:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/contract-salary-summary', async (req, res) => {
    const summaryQuery = 'SELECT AVG(salary) AS mean_salary, MIN(salary) AS min_salary, MAX(salary) AS max_salary FROM company_employee WHERE on_contract = true';

    try {
        const result = await pool.query(summaryQuery);
        const summaryStatistics = result.rows[0];
        res.json(summaryStatistics);
    } catch (error) {
        console.error('Error fetching contract salary summary:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/department-salary-summary', async (req, res) => {
    const summaryQuery = 'SELECT department, AVG(salary) AS mean_salary, MIN(salary) AS min_salary, MAX(salary) AS max_salary FROM company_employee GROUP BY department';

    try {
        const result = await pool.query(summaryQuery);
        const departmentalSummary = result.rows;
        res.json(departmentalSummary);
    } catch (error) {
        console.error('Error fetching departmental salary summary:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/detailed-department-salary-summary', async (req, res) => {
    const summaryQuery = 'SELECT department, sub_department, AVG(salary) AS mean_salary, MIN(salary) AS min_salary, MAX(salary) AS max_salary FROM company_employee GROUP BY department, sub_department';

    try {
        const result = await pool.query(summaryQuery);
        const detailedDepartmentalSummary = result.rows;
        res.json(detailedDepartmentalSummary);
    } catch (error) {
        console.error('Error fetching detailed departmental salary summary:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
