# Workout Analyzer AI

**[Bahasa Indonesia](README.md) | [English](README-EN.md)**

A personal web application to analyze Strava workout activities using Google Gemini AI. This project fetches detailed activity data (including streams, segments, and splits) and provides deep physiological insights.

## Key Features

- **Strava Integration**: Seamless OAuth authentication to securely fetch your activity history.
- **Deep Data Analysis**: Displays comprehensive metrics such as:
  - Heart Rate (Avg/Max/Zones)
  - Speed & Pace
  - Power & Watts (with W/kg calculations)
  - Cadence
  - Elevation & Gradient
  - Calories & Energy Output
  - Detailed Segment Efforts & Splits
- **AI-Powered Coach**: Uses **Gemini 3 Flash Preview** to analyze your workout data. The AI acts as a supportive yet objective coach, providing:
  - Physiological breakdown (HR Zones, Cardiac Drift)
  - Performance analysis (Decoupling, Efficiency, Pacing)
  - Actionable advice for future sessions
  - Nutrition & Recovery protocols (localized for Indonesian food context)
- **Interactive Charts**: Visualize Heart Rate vs Time or Speed vs Time with an interactive, responsive chart.
- **Smart Caching**: Activities are cached locally to minimize API calls to Strava and ensure fast load times.
- **Privacy Focused**: All data is processed client-side or via secure serverless functions. Your Strava tokens are stored locally in your browser.

## Project Structure

```bash
src/
├── app/                  # Next.js App Router pages
│   ├── api/              # API Routes (Strava proxy & Gemini)
│   ├── activity/[id]/    # Activity Detail Page
│   └── ...
├── components/           # React Components (UI, Charts, Lists)
├── store/                # Zustand State Management
├── utils/                # Helper functions
│   ├── gemini.ts         # AI Prompt Construction (Logic here)
│   ├── strava.ts         # Formatting utilities
│   └── storage.ts        # LocalStorage helpers
└── types/                # TypeScript definitions
```

## AI Prompt Configuration

The core logic for the AI analysis is located in:  
`src/utils/gemini.ts`

This file builds a dynamic system prompt based on the user's physiological profile (age, weight, RHR) and the specific activity data (splits, heart rate drift, etc.).

### Prompt Strategy (English Translation)

The prompt instructs the AI to behave as a **"Supportive Performance Coach"**.
Key sections of the prompt include:

1.  **Summary & Quality Score**: A big-picture view of the session.
2.  **Zone Analysis**: Explaining what happened to the body physiologically in simple terms.
3.  **Performance Detective (Cause & Effect)**:
    - **Decoupling**: Analyzing if speed dropped while heart rate rose (indicating fatigue/bonking).
    - **Efficiency**: Evaluating power output relative to heart rate.
4.  **Nutrition & Recovery**: specific carb/protein targets and hydration based on intensity.
5.  **Next Steps**: Concrete advice for the next workout.

_Note: The actual prompt in the code is customized to output in **Indonesian** to suit the primary user, but the structure is universal._

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, Shadcn UI
- **Visualization**: Recharts
- **State Management**: Zustand
- **AI**: Google Generative AI SDK
- **Deployment**: Vercel (Recommended)

## Getting Started

1.  **Clone the repo**:

    ```bash
    git clone https://github.com/Mysteriza/workoutAnalyzer-AI.git
    cd workoutAnalyzer-AI
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env.local` file in the root directory:

    ```env
    STRAVA_CLIENT_ID=your_strava_client_id
    STRAVA_CLIENT_SECRET=your_strava_client_secret
    GEMINI_API_KEY=your_gemini_api_key
    NEXT_PUBLIC_BASE_URL=http://localhost:3000
    MONGODB_URI=your_mongodb_connection_string
    AUTH_SECRET=your_generated_secret_key
    ```

4.  **Run Development Server**:

    ```bash
    npm run dev
    ```

5.  **Build for Production**:
    ```bash
    npm run build
    npm start
    ```

## License

MIT License. Feel free to fork and modify for your own training needs.
