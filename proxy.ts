import express, { Request, Response } from "express";
import { HeliconeManualLogger } from "@helicone/helpers";

// Define types for Ollama requests
interface ChatMessage {
  role: string;
  content: string;
}

interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  options?: Record<string, unknown>;
}

interface GenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: Record<string, unknown>;
}

interface OllamaResponse {
  id: string;
  model: string;
  created_at: string;
  message?: {
    role: string;
    content: string;
  };
  response?: string;
  done: boolean;
}

const app = express();
app.use(express.json());

// Initialize Helicone logger
const logger = new HeliconeManualLogger({
  apiKey: process.env.HELICONE_API_KEY || ""
});

// Get Ollama version
app.get("/api/version", async (req: Request, res: Response) => {
  try {
    const response = await fetch("http://localhost:11434/api/version");
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching version:", error);
    res.status(500).json({ error: "Failed to fetch version" });
  }
});

// Get available tags
app.get("/api/tags", async (req: Request, res: Response) => {
  try {
    const response = await fetch("http://localhost:11434/api/tags");
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
});

// Proxy requests to Ollama and log them to Helicone
app.post("/api/chat", async (req: Request, res: Response) => {
  const reqBody = req.body as ChatRequest;
  console.log("Received chat request:", JSON.stringify(reqBody, null, 2));

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
        const errorText = await response.text()
        console.error("Ollama API error:", errorText)
        throw new Error(`Ollama API error: ${response.status} ${errorText}`)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let finalResponse: OllamaResponse | null = null
      let accumulatedContent = ""

      if (!reader) {
        throw new Error("No response body received from Ollama")
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const jsonResponse = JSON.parse(line) as OllamaResponse
            if (jsonResponse.message?.content) {
              accumulatedContent += jsonResponse.message.content
            }

            if (jsonResponse.done) {
              // Create final response with accumulated content
              finalResponse = {
                ...jsonResponse,
                message: {
                  role: "assistant",
                  content: accumulatedContent
                }
              }
              resultRecorder.appendResults(finalResponse)
              return finalResponse
            }
          } catch (parseError) {
            console.error("Failed to parse chunk:", line)
          }
        }
      }

      if (!finalResponse) {
        throw new Error("No valid response received from Ollama")
      }

      return finalResponse
    });

    res.json(result)
  } catch (error) {
    console.error("Error:", error)
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to process request" })
  }
});

// Handle generation requests
app.post("/api/generate", async (req: Request, res: Response) => {
  const reqBody = req.body as GenerateRequest;
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

      const resBody = (await response.json()) as OllamaResponse;
      resultRecorder.appendResults(resBody);
      return resBody;
    });

    res.json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
});

const PORT = 3100;
app.listen(PORT, () => {
  console.log(`Ollama proxy with Helicone logging running on port ${PORT}`);
});
