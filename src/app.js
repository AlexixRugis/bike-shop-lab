const express = require('express');
const pool = require('./config/db');
const logger = require('./config/logger');
const path = require('path');
const bikeService = require('./services/bikeService');
const stationService = require('./services/stationService');
const reservationService = require('./services/reservationService');
const { body, validationResult } = require('express-validator');

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

app.use(express.urlencoded({ extended: false }))
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

app.use((err, req, res, next) => {
    logger.error(err.message);
    res.status(500).send('Something went wrong:(');
})

app.get("/reserve/:bike_id", async (req, res) => {

    const { err, data } = await stationService.getAllStations();

    if (err) {
        return res.status(500).send(err);
    }

    const bike_id = req.params.bike_id;
    const { data: bike } = await bikeService.getBike(bike_id);

    if (!bike) {
        return res.status(404).send("Велосипед не найден");
    }

    res.render("reserve", {
        title: "Резервирование велосипеда",
        bike: bike,
        stations: data,
        errors: null,
        link: null,
        old: null
    });

});

app.post("/reserve/:bike_id",
    [
        body("first_name").notEmpty().withMessage("Введите имя"),
        body("last_name").notEmpty().withMessage("Введите фамилию"),
        body("phone").isMobilePhone("ru-RU").withMessage("Неверный формат номера телефона"),
        body("start_station_id").notEmpty().withMessage("Выберите пункт выдачи"),
        body("start_timestamp").notEmpty().withMessage("Выберите дату и время проката")
            .custom(value => {
                const ts = new Date(value);
                if (ts < new Date()) throw new Error("Время не может быть в прошлом");
                return true;
            })
    ],
    async (req, res) => {
        const errorsRaw = validationResult(req);
        console.log(req.body);

        const { data: stations } = await stationService.getAllStations();
        const bike_id = req.params.bike_id;

        const { data: bike } = await bikeService.getBike(bike_id);

        if (!bike) {
            return res.status(404).send("Велосипед не найден");
        }

        if (!errorsRaw.isEmpty()) {

            const errors = {};
            errorsRaw.array().forEach(e => { errors[e.path] = e.msg });

            return res.status(400).render("reserve", {
                title: "Резервирование велосипеда",
                bike,
                stations,
                errors: errors,
                old: req.body,
                link: null
            });
        }

        const {
            first_name, last_name, patronymic,
            phone, start_station_id, start_timestamp
        } = req.body;

        const { err, data } = await reservationService.createReservation(
            first_name,
            last_name,
            patronymic,
            phone,
            bike_id,
            start_station_id,
            new Date(start_timestamp),
            bike.price_hour
        );

        if (err) {
            return res.status(500).send("Ошибка при создании резервации");
        }

        return res.render("reserve", {
            title: "Резервирование велосипеда",
            bike,
            stations,
            errors: null,
            link: `/rent/${data.pk}`,
            old: req.body
        });
    }
);

app.get("/rent/:id", async (req, res) => {
    const id = req.params.id;

    const { err, data: reservation } = await reservationService.getReservation(id);
    
    if (err || !reservation) {
        return res.status(404).send("Резервирование не найдено");
    }
    
    const { data: stations } = await stationService.getAllStations();
    const { data: bike } = await bikeService.getBike(reservation.bike_id);

    if (!stations || !bike) {
        return res.status(500).send("Внутренняя ошибка сервера!");
    }

    res.render("rent", {
        title: "Управление прокатом",
        bike,
        reservation,
        stations
    });
});

app.post("/rent/:id", async (req, res) => {
    const id = req.params.id;
    const action = req.body.action;

    if (action === "start") {
        const now = new Date();
        const { err } = await reservationService.startReservation(id, now);
        if (err) return res.status(500).send("Не удалось начать прокат");
        return res.redirect(`/rent/${id}`);
    }

    if (action === "end") {
        const now = new Date();
        const { station_id } = req.body;

        const { data: reservation } = await reservationService.getReservation(id);

        if (!reservation) {
            return req.status(404).send("Запись о прокате не найдена");
        }

        console.log(reservation);

        const { err } = await reservationService.endReservation(
            id,
            reservation.actual_start_timestamp,
            reservation.bike_price,
            station_id,
            now
        );

        if (err) return res.status(500).send("Не удалось завершить прокат");

        return res.redirect(`/rent/${id}`);
    }

    res.status(400).send("Неизвестное действие");
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