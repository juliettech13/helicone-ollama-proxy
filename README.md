# Ollama Proxy with Helicone Logging

A powerful Express.js proxy server that connects Ollama with Helicone for advanced LLM observability and monitoring of your local Llama requests.

## 🌟 Overview

This proxy server acts as a bridge between your Ollama instance and Helicone's powerful observability platform. It enables you to monitor, track, and analyze all your Ollama LLM interactions while being able to run your local Llama models.

You use this proxy server as the endpoint for your LLM requests, which takes charge of logging the requests to Helicone and serving the responses from your local Ollama instance.

![Architecture Diagram](https://res.cloudinary.com/dacofvu8m/image/upload/v1744402766/CleanShot_2025-04-11_at_13.18.43_cakrzh.png)

## ✨ Features

- Seamless integration between Ollama and Helicone
- Full support for Ollama's chat and generation endpoints
- Automatic request/response logging
- Version and model tag checking endpoints

## 🚀 Getting Started

### Prerequisites

- Node.js (14.x or higher)
- Ollama installed locally
- Helicone API key

### Environment Setup

1. Sign up for a free account at [Helicone](https://www.helicone.ai) and get your API key from the dashboard settings.

2. Create a `.env` file in your project root:
```env
HELICONE_API_KEY=your_helicone_api_key_here
```

### Installation & Setup

1. Install dependencies:
```bash
npm install
```

2. Start your local Ollama server:
```bash
ollama serve
```
This command starts the Ollama server locally on port 11434. The server must be running for the proxy to work. You can also determine the specific model you want to use by running `ollama list` to see all the models available.

3. Start the proxy server:
```bash
npm start
```

The server will start on port 3100 by default.

### Testing the Setup

To verify that everything is working correctly, you can send a test request:

```bash
curl -X POST http://localhost:3100/api/chat \
  -H "Content-Type: application/json" \
  -d '{"model":"llama2","messages":[{"role":"user","content":"Hello"}]}'
```

After running this command:
1. You should see a response from the Ollama model being served from your local machine in your terminal
2. Log into your [Helicone dashboard](https://www.helicone.ai) to see the request logged with all its details in the Requests view.
3. The dashboard will show metrics like response time, token usage, and request status, etc.

If you can see the request in your Helicone dashboard, congratulations! Your setup is working correctly.

## 📡 API Endpoints

### Chat Completion
```bash
POST http://localhost:3100/api/chat
```

Example request:
```json
{
  "model": "llama2",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ]
}
```

### Text Generation
```bash
POST http://localhost:3100/api/generate
```

Example request:
```json
{
  "model": "llama2",
  "prompt": "Write a story about a space cat"
}
```

### Utility Endpoints
- `GET /api/version` - Get Ollama version
- `GET /api/tags` - List available models

## 🔍 Helicone Integration

This proxy automatically integrates with [Helicone](https://www.helicone.ai), a powerful LLM observability platform that provides:

- Detailed request/response logging
- Cost tracking and analytics
- Latency monitoring
- User behavior analytics
- Custom property tracking
- Advanced filtering and search capabilities

By using Helicone, you gain unprecedented visibility into your LLM operations, helping you:
- Optimize costs and performance
- Debug issues faster
- Understand usage patterns
- Make data-driven decisions about your LLM implementation

## 🛠️ Technical Details

The proxy server handles both streaming and non-streaming responses from Ollama, ensuring compatibility with various client implementations while maintaining detailed logging through Helicone.

## 📝 License

MIT Open Source

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
