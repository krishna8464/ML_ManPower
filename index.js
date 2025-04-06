const express = require("express");
const {connection} = require("./config/db");
const { Adminrouter } = require("./routes/adminroute")
require("dotenv").config();
const cors = require("cors")

const { logger } = require("./middleware/logger");
const { errorHandler } = require("./middleware/errorhandler");

const app = express();
app.use(express.json());
app.use(logger);
app.use(errorHandler);
app.use(cors({
    origin:"*"
}));

app.get("/",async(req,res)=>{
    try {
        res.send("Welcome to the ML_ManPower server");
    } catch (error) {
        res.send("something went wrong");
    }
});

 app.use("/admin",Adminrouter);

// Handle invalid routes
app.use(logger,(req, res) => {
    res.status(404).send({ error: 'Not found' });
});


app.listen(process.env.port,async()=>{
    try {
        await connection;
        console.log("Server is connected to DB");
    } catch (error) {
        console.log(error)
        console.log("Not able to connect to DB")
    }
    console.log(`The server is connected to ${process.env.port}`)
})
