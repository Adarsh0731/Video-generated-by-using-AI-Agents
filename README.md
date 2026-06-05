Flora 15 - Interactive Plant Growth Sequencer & Lab
An interactive, full-stack 15-second generative plant growth video sequencer and custom bio-design simulator. Combining standard visual canvas rendering, a full-stack Node.js server powered by Gemini AI, procedural Web Audio API audio synthesis, and an elegant, organic user interface with the custom "Natural Tones" styling.
🎨 Visual Identity & Styling: "Natural Tones"
This application features a custom, hand-crafted design language called Natural Tones which conveys a professional, organic, and earth-conscious aesthetic:
Color Palette:
Background: Soft off-white ceramic canvas (#FDFCF9)
Text: Deep forest charcoal (#3E4A42)
Accents: Muted sage green (#8DA399), deep timber forest (#4A6357), and warm terracotta clay (#C87959)
Secondary Fills: Organic mint-grey (#E2E8E4) and cream divide lines (#F2EFE9)
Typography: Paired display headers in the editorial Lora serif alongside modern Plus Jakarta Sans for interfaces and JetBrains Mono for low-level scientific coordinates and timeline telemetry.
Micro-interactions: Subtle CSS animations, pulse indicators, customized organic scrollbars, and dynamic state-aware transition overlays that respond to atmospheric modifications.
✨ Features
Dynamic Plant Growth Sequencer: Watch biological specimens evolve frame-by-frame from seed to fully bloomed foliage using standard HTML canvas visual synthesis.
AI Specimen Bio-Design Lab: Harnesses the full-stack server-side Gemini API via the official @google/genai SDK. Enter any custom plant name (real or imaginary, e.g., "Helios Candelabra" or "Deep Sea Coral-Orchid"), and the model will procedurally compute scientific summaries, taxonomy, and a dedicated 15-second growth timeline.
Interactive Chronological Controls: Drag the 15-second timeline slider, select play/pause, adjust playback speed (0.5x to 2x), or jump instantly to growth milestones (e.g., Sprouting, Vegetative, Mature Bloom).
Procedural Soundscape Synth: Implements a dedicated synthesizer powered by the Web Audio API that generates rich ambient chords, resonant rain drops, and custom audio sweeps matched to the active animation context.
Dynamic Atmospheric Modifiers:
Moisture Infusion: Toggle water-drop rain precipitation with dynamic rendering inside the canvas frame.
Solar Intensity: Adjust sunlight levels to watch lighting, color hues, and bloom rates dynamically interact.
Wind Sweep Speeds: Slide wind parameters to increase the organic swaying and branch-bending of the plant structure.
Specimen Fact Sheet & Exporter: Instantly compile a full high-fidelity storyboard summary brief of the active specimen. Includes a printable brief containing calculated botanical milestones, biome statistics, and taxonomic identifiers.
🛠️ Architecture
Flora 15 is built as a highly optimized, production-ready full-stack application:
code
Code
├── server.ts              # Express.js backend serving API routes and bundling Vite SPA middleware
├── src/
│   ├── main.tsx           # React SPA Entrypoint 
│   ├── App.tsx            # Main application shell housing the control decks, seed vaults, and modals
│   ├── components/
│   │   ├── PlantVideoCanvas.tsx   # Canvas visual engine render pipeline, physics sway, and particle precipitation
│   │   └── AudioSynth.ts          # Web Audio API ambient oscillator synthesizer and sound FX triggering module
│   ├── index.css          # Tailwind CSS global configuration, @theme declarations, and custom scrollbar animations
│   └── declaration.d.ts   # TypeScript asset support declarations
├── vite.config.ts         # Vite compilation asset pipelines
├── package.json           # Scripts, dependencies, and metadata configuration
└── .env.example           # Recommended environment boilerplate
⚙️ Direct Setup & Running Locally
Prerequisites
Node.js (v18 or higher recommended)
A Gemini API Key from Google AI Studio
1. Installation
Clone the repository and install all required local dependencies:
code
Bash
npm install
2. Configure Environment Variables
Create a .env file in the root directory and add your Gemini API key:
code
Env
GEMINI_API_KEY=your_actual_gemini_api_key_here
3. Start the Development Server
Run the local full-stack server. The Express back-end will automatically spin up on port 3050 (or your configured port) with hot-reloading:
code
Bash
npm run dev
4. Build for Production
To bundle and compile both the client SPA asset tree and the backend Express server into optimized standalone build files:
code
Bash
npm run build
This compiles the server into a bundle at dist/server.cjs and outputs static client files into dist/.
To launch the compiled server:
code
Bash
npm run start
⚡ Technical Highlights
Server-Side API Proxying: The Gemini API keys remain completely secure, loaded privately in Node.js server-side memory (process.env.GEMINI_API_KEY) and served via tailored Express endpoints (/api/*), preventing client-side key leakage.
Native ESM Type Stripping & Fast Building: Bundles backend code with esbuild formats cleanly to CommonJS (.cjs), automatically bypassing strict relative runtime path imports.
Deterministic Coordinate Animation: Smooth, hardware-accelerated Bezier curve calculations simulate realistic architectural leaf structure growth, ensuring consistent growth proportions regardless of browser resize triggers.
