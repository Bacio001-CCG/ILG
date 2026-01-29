import express from "express";
import { runAgent } from "../agent/index.js";
const app = express();
const port = 3001;

app.get("/", async (req, res) => {
    console.log(req.query.question);
    const { answer } = await runAgent(req.query.question);
    res.send(answer || "Sorry I couldn't find any info about that.");
});

app.listen(port, () => {
    console.log(`API listening on port ${port}`);
});
