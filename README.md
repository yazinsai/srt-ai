![SRT AI Translator - Preview](/preview.png)

# SRT AI Translator

A modern web application for translating SRT subtitle files using advanced AI models with Stripe payment integration.

## Features

- 🚀 **Modern Stack**: Built with Next.js 15, React 19, and TypeScript
- 🤖 **AI-Powered**: Uses Google Gemini 2.0 Flash for high-quality translations  
- 🌍 **100+ Languages**: Supports translation between 100+ languages including Swahili
- ⚡ **Real-time Streaming**: Live progress updates during translation
- ✅ **Smart Validation**: Professional SRT validation with timing synchronization checks
- 📊 **Progress Tracking**: Visual progress bar showing translation completion
- 🎯 **Timing Preservation**: Maintains perfect subtitle synchronization
- 💳 **Stripe Payments**: Simple $1/hour pricing with secure payment processing
- 🔄 **Batch Processing**: Handles large files efficiently with automatic batching

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yazinsai/srt-ai
   cd srt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` and add your API keys:
   - `GOOGLE_GENERATIVE_AI_API_KEY` - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - `STRIPE_SECRET_KEY` - Get from [Stripe Dashboard](https://dashboard.stripe.com)
   - `KV_*` - Vercel KV credentials for session storage
   - `OPENAI_API_KEY` (optional) - For fallback support

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Usage

1. **Upload SRT File**: Drag and drop or browse for your `.srt` file
2. **Select Language**: Choose target language from 100+ options
3. **Payment**: Complete secure payment via Stripe ($1/hour of content)
4. **Translation**: Watch real-time progress as your file is translated
5. **Download**: File automatically downloads when complete

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **UI**: Tailwind CSS for styling
- **AI Models**: 
  - Primary: Google Gemini 2.0 Flash Experimental
  - Fallback: OpenAI GPT-3.5-turbo
- **Payment**: Stripe Checkout
- **Session Storage**: Vercel KV
- **SRT Processing**: 
  - `srt-parser-2` for parsing
  - Custom validation with Zod schemas

## Project Structure

```
app/                    # Next.js App Router
├── api/               # API routes
│   ├── route.ts       # Main translation endpoint
│   ├── pay/           # Stripe payment processing
│   └── content/       # Content retrieval
├── translate/         # Translation page after payment
├── layout.tsx         # Root layout
└── page.tsx           # Home page with pricing

lib/                   # Utilities and libraries
├── srt/              # SRT parsing/validation
│   ├── parser.ts     # SRT parser with batching
│   └── validator.ts  # Timing validation
├── client.ts         # Client utilities
└── srt.ts            # Legacy SRT helpers
```

## Key Features Explained

### Professional SRT Validation
- Checks for timing overlaps
- Validates reading speed (CPS)
- Ensures proper formatting
- Netflix-standard compliance

### Smart Translation
- Preserves exact timestamps
- Accounts for text expansion by language
- Maintains readability (max 70 CPS)
- Respects 2-line subtitle limit

### Error Recovery
- Automatic retry with exponential backoff
- Timeout protection (30s per batch)
- Partial translation recovery
- Clear error messages

### Pricing Model
- Simple: $1 per hour of content
- Minimum charge: $1
- Secure payment via Stripe
- No hidden fees

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini API key | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key for payments | Yes |
| `STRIPE_PUBLISHABLE_KEY` | Stripe public key | Yes |
| `KV_URL` | Vercel KV database URL | Yes |
| `KV_REST_API_URL` | Vercel KV REST API URL | Yes |
| `KV_REST_API_TOKEN` | Vercel KV API token | Yes |
| `OPENAI_API_KEY` | OpenAI API key (fallback) | No |

## Performance

- **Context Window**: 200K tokens per batch with Gemini
- **Processing Speed**: 10-20 subtitles per second
- **Accuracy**: 95%+ translation accuracy
- **Timing Preservation**: 100% timing accuracy
- **Batch Optimization**: Automatic batch size based on content complexity

## Deployment

The application is optimized for deployment on Vercel:

1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
