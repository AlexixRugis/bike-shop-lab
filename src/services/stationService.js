const pool = require('../config/db');

exports.getStation = async (station_id) => {
    try {
        const result = await pool.query(`SELECT * FROM stations WHERE pk=$1`, [station_id]);
        return { data: result.rows[0] };
    } catch (err) {
        return { err: err.message };
    }
};

exports.getAllStations = async () => {
    try {
        const result = await pool.query(`SELECT * from stations`);
        return {
            data: result.rows
        };
    } catch (err) {
        return {
            err: err.message
        };
    }
};