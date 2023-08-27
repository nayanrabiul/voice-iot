import express from "express";
import dotenv from "dotenv";

const app = express();
dotenv.config();
app.use(express.json());

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post("/gpt", (req, res) => {
    let query: string = req.body.text;
    //integration with gpt
    let data = require("./controller/gpt").ActionFromUserQuery(res, query);

    res.status(200).json(data);

    //return response
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
