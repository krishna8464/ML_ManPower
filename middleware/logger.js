const path = require("path");
const fs = require("fs");
const morgan = require("morgan");

const loggFile = fs.createWriteStream(path.join(__dirname, 'logBook.log'), { flags: 'a' })

const logger = morgan('combined', { stream: loggFile })

module.exports = {
    logger
}