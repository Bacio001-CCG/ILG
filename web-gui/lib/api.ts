"use server";
import axios from "axios";
import fs from "fs/promises";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "qa-logs.json");

async function logQA(question: string, answer: any) {
    try {
        let logs = [];

        try {
            const data = await fs.readFile(LOG_FILE, "utf-8");
            logs = JSON.parse(data);
        } catch {}

        logs.push({
            timestamp: new Date().toISOString(),
            question,
            answer,
        });

        await fs.writeFile(LOG_FILE, JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error("Failed to log Q&A:", error);
    }
}

export default async function API(content: string) {
    const response = await axios.get(
        "http://localhost:3001/?question=" + encodeURIComponent(content)
    );

    await logQA(content, response.data);

    return response.data;
}
