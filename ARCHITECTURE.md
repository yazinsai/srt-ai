# Architecture: Server/Client Separation

This document outlines the clear separation between server-side and client-side code in the SRT AI Translator application.

## Overview

The application follows Next.js 15 App Router best practices with strict separation between server and client components.

## Server Components (Default)

Server Components run only on the server and have access to:
- Environment variables
- Database connections (Vercel KV)
- File system operations
- API keys and secrets

### Server-Only Files:
- `app/layout.tsx` - Root layout with metadata
- `app/translate/page.tsx` - Server component that validates payment
- `app/api/*` - All API routes run server-side
- `lib/srt/*` - SRT parsing/validation utilities

## Client Components ('use client')

Client Components run in the browser and handle:
- User interactions
- Form submissions
- State management
- Browser APIs

### Client-Only Files:
- `app/page.tsx` - Home page with interactive form
- `app/translate/page.client.tsx` - Translation UI with progress
- `components/Form.tsx` - File upload and language selection
- `components/Timestamp.tsx` - UI component

## API Routes (Server-Side)

All API routes use Edge Runtime for better performance:

### `/api/route.ts`
- Main translation endpoint
- Uses Gemini API (server-side only)
- Streams translated content
- Progress tracking

### `/api/pay/route.ts`
- Stripe payment processing
- Creates checkout sessions
- Stores session in Vercel KV

### `/api/content/route.ts`
- Retrieves original content
- Validates session

## Library Organization

### Server-Side Libraries (`lib/srt/`)
- `parser.ts` - SRT parsing with validation
- `validator.ts` - Timing and format validation
- No browser APIs used
- Can use Node.js features

### Shared Utilities (`lib/`)
- `client.ts` - Client-side parsing helpers
- `srt.ts` - Legacy SRT utilities
- Pure JavaScript functions
- No environment variables

## Data Flow

1. **Client**: User uploads file and selects language
2. **Server**: Payment processing via Stripe
3. **Server**: Session stored in Vercel KV
4. **Client**: Redirected to translation page
5. **Server**: Validates payment and retrieves session
6. **Client**: Initiates translation request
7. **Server**: Processes translation with Gemini API
8. **Server**: Streams results back to client
9. **Client**: Displays progress and downloads file

## Security Considerations

### Server-Side Only:
- API keys (Gemini, OpenAI, Stripe)
- Payment processing
- Session validation
- Database access

### Client-Side Never Has:
- Direct API key access
- Payment credentials
- Database connections
- Sensitive business logic

## Environment Variables

Only accessible server-side:
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `STRIPE_SECRET_KEY`
- `KV_*` (Vercel KV credentials)
- `OPENAI_API_KEY`

## Build Optimization

- Server Components reduce client bundle size
- Edge Runtime for faster API responses
- Streaming for real-time updates
- Proper code splitting

## TypeScript Configuration

Strict mode enabled with:
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `forceConsistentCasingInFileNames: true`

Ensures type safety across server/client boundary.

## Testing Separation

To verify proper separation:
1. Check that `process.env` is only used in server files
2. Ensure browser APIs aren't used in server components
3. Validate that API keys aren't exposed to client
4. Confirm streaming works correctly

## Best Practices

1. Default to Server Components
2. Use 'use client' only when needed
3. Keep API logic in route handlers
4. Validate on server, display on client
5. Stream large responses
6. Use Edge Runtime for APIs