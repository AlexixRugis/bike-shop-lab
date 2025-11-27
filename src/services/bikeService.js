const pool = require('../config/db');

exports.getAllBikes = async () => {
    try {
        const result = await pool.query('SELECT * from bikes');
        return {
            data: result.rows
        };
    } catch (err) {
        return {
            err: err.message
        };
    }
};