# Project Aria - Voice Browser Agent

A sophisticated voice-controlled browser automation agent built with Next.js 14, TypeScript, and modern AI technologies.

## 🚀 Features

- **Voice Recognition**: Powered by Deepgram's advanced speech-to-text API
- **Intent Parsing**: Intelligent command interpretation using OpenRouter AI models
- **Browser Automation**: Seamless web interaction using Stagehand
- **Real-time UI**: Modern, responsive interface with live action history
- **TypeScript**: Full type safety and excellent developer experience

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Voice Processing**: Deepgram STT API
- **AI Integration**: OpenRouter (Gemini/GPT-4)
- **Browser Automation**: Stagehand
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React

## 📦 Installation

1. **Clone and setup the project:**
   ```bash
   cd project-aria
   npm install
   ```

2. **Environment Configuration:**
   ```bash
   # Copy the example environment file
   cp env.example .env.local
   
   # Edit .env.local and add your API keys:
   # DEEPGRAM_API_KEY=your_deepgram_api_key_here
   # OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

3. **Get your API keys:**
   - **Deepgram**: Sign up at [console.deepgram.com](https://console.deepgram.com/)
   - **OpenRouter**: Get your key at [openrouter.ai/keys](https://openrouter.ai/keys)

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

1. **Grant Microphone Permission**: Click "Allow" when prompted for microphone access
2. **Start Recording**: Click the microphone button to begin voice recording
3. **Speak Your Command**: Say commands like:
   - "Go to wikipedia.org"
   - "Click on the English link"
   - "Type 'artificial intelligence' in the search box"
   - "Click the search button"
4. **View Results**: Watch your commands execute and see the history in real-time

## 🏗️ Project Structure

```
project-aria/
├── src/
│   ├── app/
│   │   ├── globals.css          # Global styles and CSS variables
│   │   ├── layout.tsx           # Root layout component
│   │   └── page.tsx             # Main application page
│   ├── lib/
│   │   └── utils.ts             # Utility functions
│   └── types/
│       └── index.ts             # TypeScript type definitions
├── public/                      # Static assets
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
├── next.config.js               # Next.js configuration
├── package.json                 # Dependencies and scripts
├── tailwind.config.ts           # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DEEPGRAM_API_KEY` | Your Deepgram API key for speech-to-text | Yes |
| `OPENROUTER_API_KEY` | Your OpenRouter API key for AI processing | Yes |
| `NEXT_PUBLIC_APP_NAME` | Application name (optional) | No |

### Customization

- **Styling**: Modify `src/app/globals.css` and `tailwind.config.ts`
- **Types**: Add new types in `src/types/index.ts`
- **Utilities**: Extend functionality in `src/lib/utils.ts`

## 🚀 Deployment

This project can be deployed on any platform that supports Node.js:

- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **Render**
- **Fly.io**

Make sure to set your environment variables in your deployment platform.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Deepgram](https://deepgram.com/) for excellent speech-to-text capabilities
- [OpenRouter](https://openrouter.ai/) for AI model access
- [Next.js](https://nextjs.org/) for the amazing React framework
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Lucide](https://lucide.dev/) for beautiful icons

---

**Project Aria** - Bringing voice control to web automation 🎤✨

## Stagehand setup

Add required Browserbase/OpenAI env vars to `.env.local`:

```bash
BROWSERBASE_API_KEY=your_browserbase_api_key
BROWSERBASE_PROJECT_ID=your_project_id
OPENAI_API_KEY=your_openai_key
# Recommended defaults with upgraded plan
BROWSERBASE_USE_PROXIES=true
BROWSERBASE_KEEP_ALIVE=true
# Optional tuning
BROWSERBASE_REGION=us-east
BROWSERBASE_OS=linux
# Advanced stealth is a Scale plan feature
BROWSERBASE_ADVANCED_STEALTH=false
```

The backend initializes Stagehand in `utils/browserbase.ts`. All API routes set `export const runtime = 'nodejs'` to ensure server execution.

### Gotchas (Stagehand v2.5.0)

- The `Stagehand` constructor in `@browserbasehq/stagehand@2.5.0` does not accept a `headless` option on `ConstructorParams`. Do not pass it or TypeScript will raise TS2353. Use the Browserbase live view `debugUrl` for visibility.
- Live view URL comes from the session as `debugUrl`. The helper `Browser.getSessionViewUrl()` exposes it and the UI renders it via `components/BrowserView.tsx`.
- With proxies enabled, Google is less likely to flag traffic as bot. If a 402 occurs (plan limit), the code will retry without proxies. Control default via `BROWSERBASE_USE_PROXIES`.
- Use `BROWSERBASE_KEEP_ALIVE=true` for longer-running sessions; monitor usage on your plan.
- If `BROWSERBASE_OS` is not `linux` and `BROWSERBASE_ADVANCED_STEALTH` is false, the code forces `linux` to avoid incompatibilities.
- Ensure `OPENAI_API_KEY`, `BROWSERBASE_API_KEY`, and `BROWSERBASE_PROJECT_ID` are set; initialization will throw otherwise.
- Keep these routes on the Node.js runtime: `/api/agent/session`, `/api/agent/action`, `/api/agent/converse`, `/api/agent/intent`.
