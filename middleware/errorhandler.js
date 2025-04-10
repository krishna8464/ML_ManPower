function errorHandler(err, req, res, next) {
    console.error(err); // log full error
    res.status(500).json({
        errorMessage: "Server error",
    });
}

module.exports = {
    errorHandler
}