# Internetworks Chatbot (IVY)

AI-powered chatbot assistant for Internetworks, built with Next.js and OpenRouter API.

## Prerequisites

- Node.js (v18 or higher)
- npm

## Setup

1. **Navigate to the project directory:**
   ```bash
   cd Internetworks_chatbot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

   Then edit `.env.local` and add your API key:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   NEXT_PUBLIC_CALENDLY_URL= your_calendly_url
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Features

- Streaming AI chat responses
- Company knowledge base (services, team info)
- Calendly meeting booking integration
- Responsive design (mobile & desktop)

## Tech Stack

- Next.js 16
- TypeScript
- Tailwind CSS
- OpenAI SDK (OpenRouter)
- React 19
