# Heroku Deployment Guide

## Prerequisites
- Heroku CLI installed
- Git repository initialized
- Heroku account

## Setup

1. **Login to Heroku**
```bash
heroku login
```

2. **Create Heroku App**
```bash
heroku create your-app-name
```

3. **Set Environment Variables**
```bash
heroku config:set TAVILY_API_KEY=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
heroku config:set NVIDIA_API_KEY=nvapi-your-key-here
heroku config:set NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
heroku config:set NEXT_PUBLIC_APP_URL=https://your-app-name.herokuapp.com
heroku config:set NODE_ENV=production
```

4. **Deploy**
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

## Default LLM Provider
The app is configured to use NVIDIA NIM as the default LLM provider. Users can add additional providers (OpenAI, Gemini, Anthropic, Groq, Ollama) through the settings UI.

## Required Environment Variables
- `TAVILY_API_KEY` - Search API (already configured with dev key)
- `NVIDIA_API_KEY` - NVIDIA NIM API key for LLM
- `NVIDIA_BASE_URL` - NVIDIA NIM base URL (default: https://integrate.api.nvidia.com/v1)
- `NEXT_PUBLIC_APP_URL` - Your Heroku app URL

## Optional Environment Variables
- `OPENAI_API_KEY` - OpenAI API key
- `GEMINI_API_KEY` - Google Gemini API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `GROQ_API_KEY` - Groq API key
- `OLLAMA_API_URL` - Ollama local instance URL

## Get NVIDIA NIM API Key
Visit https://build.nvidia.com/ to get a free NVIDIA NIM API key for the default LLM provider.
