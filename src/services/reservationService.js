const pool = require('../config/db');

function calculateCost(start_timestamp, end_timestamp, cost_per_hour) {
    const diff_ms = end_timestamp - start_timestamp;
    const diff_hours = diff_ms / 3600000;

    const hours = Math.max(1, Math.ceil(diff_hours));

    return cost_per_hour * hours;
}

exports.createReservation = async (
    first_name,
    last_name,
    patronymic,
    phone,
    bike_id,
    start_station_id,
    start_timestamp,
    bike_price
) => {
    try {
        const result = await pool.query(
                `INSERT INTO reservations 
                 (first_name, last_name, patronymic, phone, bike_id, start_station_id, start_timestamp, bike_price)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING pk`,
                [
                    first_name,
                    last_name,
                    patronymic,
                    phone,
                    bike_id,
                    start_station_id,
                    start_timestamp,
                    bike_price
                ]
            );
        return {
            data: result.rows[0]
        };
    } catch (err) {
        return {
            err: err.message
        };
    }
};

exports.startReservation = async (reservation_id, start_timestamp) => {
    try {
        const result = await pool.query(
            `UPDATE reservations SET actual_start_timestamp=$1 WHERE pk=$2`,
            [start_timestamp, reservation_id]
        );
        return {
            data: result.rows[0]
        };
    } catch (err) {
        return {
            err: err.message
        };
    }
};

exports.endReservation = async (reservation_id, start_timestamp, reservation_price, end_station_id, end_timestamp) => {
    try {
        const final_price = calculateCost(
            start_timestamp,
            end_timestamp,
            reservation_price
        );

        const result = await pool.query(
            `UPDATE reservations 
             SET end_station_id=$1, end_timestamp=$2, bike_price=$3 
             WHERE pk=$4`,
            [end_station_id, end_timestamp, final_price, reservation_id]
        );

        return {
            data: result.rows[0]
        }
    } catch (err) {
        return {
            err: err.message
        };
    }
};

exports.getReservation = async (reservation_id) => {
    try {
        const result = await pool.query(
            `SELECT * FROM reservations WHERE pk=$1`,
            [reservation_id]
        );
        return {
            data: result.rows[0]
        };
    } catch (err) {
        return {
            err: err.message
        };
    }
};