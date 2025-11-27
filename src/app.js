const express = require('express');
const router = require('./routes/router');
const pool = require('./config/db');
const logger = require('./config/logger');
const path = require('path');
const bikeService = require('./services/bikeService');

pool.query("SELECT NOW()", (err, res) => {
    if (err) {
        console.error('Error connecting to the database', err.stack);
    }
    else {
        console.log('Connected to the database:', res.rows);
    }
});

const app = express();

app.use('/static', express.static('public'))

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

app.use((err, req, res, next) => {
    logger.error(err.message);
    res.status(500).send('Something went wrong:(');
})

app.use('/api/v1', router);

app.get("/reserve/:bike_id", async (req, res) => {
    const bike_id = req.params.bike_id;

    res.render("reserve", {
        title: "Резервирование велосипеда",
        bike_id: bike_id
    });

});

app.get("/", async (req, res) => {  

    const { err, data } = await bikeService.getAllBikes();

    if (err) {
        res.status(500).send(err);
    }
    else {
        console.log(data);
        res.render("index", {
            title: "Велосипеды",
            bikes: data,
        });
    }

});

const PORT = process.env.PORT | 8080;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
})