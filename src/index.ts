import express from "express";
import dotenv from "dotenv";

const app = express();
dotenv.config();
app.use(express.json());

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post("/gpt", async (req, res) => {
    let query: string = req.body.text;
    //integration with gpt
    let data = await require("./controller/gpt").HandleActionFromUserQuery(
        query
    );
    console.log("🚀 ~ file: index.ts:16 ~ app.post ~ data:", data);

    res.send(data);
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
