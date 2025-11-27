const bikeService = require('../services/bikeService');

exports.getBikes = async (req, res) => {
    const { err, data } = await bikeService.getAllBikes();
    if (data) {
        res.status(200).json(data);
    } else {
        res.status(500).json({ error: err.message });
    }
};