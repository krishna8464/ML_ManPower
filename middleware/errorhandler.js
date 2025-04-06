function errorHandler(err, req, res, next) {
    res.status(500).json({
        errorMessage: "Server error",
    });
}

module.exports = {
    errorHandler
}