![SRT AI Translator - Preview](/preview.png)

# SRT AI Translator

Translate SRT files to any language, using AI magic ✨

Say goodbye to subpar auto-generated captions and elevate the user experience with high-quality translations! 🎉

## Overview

SRT AI Translator leverages the power of AI to provide accurate and natural-sounding translations for SRT subtitle files in any language. This easy-to-use tool ensures that viewers can enjoy video content without the frustration of poorly-translated captions.

## Getting Started

Follow these simple steps to set up SRT AI Translator and start enjoying better translations:

### Prerequisites

- An OpenAI API key (grab it [here](https://platform.openai.com/account/api-keys), if you don't have one already)

### Docker

#### Build

To build the Docker image with the name `srt-ai`, use the following command:

```bash
docker build -t srt-ai .
```

#### Run

Before running the application, ensure that the environment variable `OPENAI_API_KEY` is set.

##### Using docker run

```
docker run -p 3000:3000 -e OPENAI_API_KEY=<your_api_key> srt-ai
```

##### Using docker compose

1. Copy the provided example environment file:

```bash
cp .env.example .env.local
```

2. Update the .env.local file with your `OPENAI_API_KEY`.

3. Run the application using Docker Compose:

```
docker compose up
```

This will read the environment variables from the .env.local file and start the application, exposing it on port 3000.

### Manual

#### Prerequisites

- Node.js and npm installed on your machine

#### Installation

1. Clone the repo `git clone https://github.com/yazinsai/srt-ai`
2. Rename `.env.example` to `.env.local` and paste your OpenAI Key.
3. Install dependencies using `npm install`
4. Start locally using `npm run dev`

You should now be able to access the repo at [`http://localhost:3000/`](http://localhost:3000/) in your browser.
