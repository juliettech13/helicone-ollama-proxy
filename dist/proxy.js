import express from "express";
import { HeliconeManualLogger } from "@helicone/helpers";
const app = express();
app.use(express.json());
const logger = new HeliconeManualLogger({
    apiKey: process.env.HELICONE_API_KEY || ""
});
app.get("/api/version", async (req, res) => {
    try {
        const response = await fetch("http://localhost:11434/api/version");
        const data = await response.json();
        res.json(data);
    }
    catch (error) {
        console.error("Error fetching version:", error);
        res.status(500).json({ error: "Failed to fetch version" });
    }
});
app.get("/api/tags", async (req, res) => {
    try {
        const response = await fetch("http://localhost:11434/api/tags");
        const data = await response.json();
        res.json(data);
    }
    catch (error) {
        console.error("Error fetching tags:", error);
        res.status(500).json({ error: "Failed to fetch tags" });
    }
});
app.post("/api/chat", async (req, res) => {
    const reqBody = req.body;
    console.log("Received chat request:", JSON.stringify(reqBody, null, 2));
    console.log("Forwarding to Ollama at: http://localhost:11434/api/chat");
    try {
        const result = await logger.logRequest(reqBody, async (resultRecorder) => {
            const response = await fetch("http://localhost:11434/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(reqBody)
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Ollama API error:", errorText);
                throw new Error(`Ollama API error: ${response.status} ${errorText}`);
            }
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let finalResponse = null;
            let accumulatedContent = "";
            if (!reader) {
                throw new Error("No response body received from Ollama");
            }
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());
                for (const line of lines) {
                    try {
                        const jsonResponse = JSON.parse(line);
                        if (jsonResponse.message?.content) {
                            accumulatedContent += jsonResponse.message.content;
                        }
                        if (jsonResponse.done) {
                            finalResponse = {
                                ...jsonResponse,
                                message: {
                                    role: "assistant",
                                    content: accumulatedContent
                                }
                            };
                            resultRecorder.appendResults(finalResponse);
                            return finalResponse;
                        }
                    }
                    catch (parseError) {
                        console.error("Failed to parse chunk:", line);
                    }
                }
            }
            if (!finalResponse) {
                throw new Error("No valid response received from Ollama");
            }
            return finalResponse;
        });
        res.json(result);
    }
    catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error instanceof Error ? error.message : "Failed to process request" });
    }
});
app.post("/api/generate", async (req, res) => {
    const reqBody = req.body;
    console.log("Received generate request:", JSON.stringify(reqBody, null, 2));
    console.log("Forwarding to Ollama at: http://localhost:11434/api/generate");
    try {
        const result = await logger.logRequest(reqBody, async (resultRecorder) => {
            const response = await fetch("http://localhost:11434/api/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(reqBody),
            });
            const resBody = (await response.json());
            resultRecorder.appendResults(resBody);
            return resBody;
        });
        res.json(result);
    }
    catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Failed to process request" });
    }
});
const PORT = 3100;
app.listen(PORT, () => {
    console.log(`Ollama proxy with Helicone logging running on port ${PORT}`);
});
//# sourceMappingURL=proxy.js.map