import express from "express";
import dotenv from "dotenv";
import { HandleActionFromUserQuery } from "./controllers/index.js";
dotenv.config();

const app = express();

app.use(express.json());
app.set("view engine", "ejs");

app.use(express.static("./public")); //to access the css files, images, js files, just like that by ex: /css/style.css

app.get("/", (req, res) => {
    res.render("pages/index");
});

app.post("/gpt", async (req, res) => {
    let query = req.body.text;

    let data = await HandleActionFromUserQuery(query);
    console.log("🚀 ~ file: server.js:22 ~ app.post ~ data:", data);

    res.send(data);
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
