/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef, FormEvent } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Sliders,
  Droplets,
  Sun,
  Wind,
  ChevronRight,
  Loader2,
  Info,
  Download,
  BookOpen,
} from "lucide-react";

import { PREMADE_PLANTS } from "./data/premadePlants";
import { PlantStoryboard, PlayerSettings } from "./types";
import PlantVideoCanvas from "./components/PlantVideoCanvas";
import { synth } from "./utils/soundSynth";

// Import our beautiful AI generated assets
import fernAssetImg from "./assets/images/bioluminescent_fern_1780641050058.png";
import sunflowerAssetImg from "./assets/images/sunflower_golden_hour_1780641067411.png";
import blossomAssetImg from "./assets/images/cherry_blossom_bloom_1780641084469.png";

export default function App() {
  const [selectedStoryboard, setSelectedStoryboard] = useState<PlantStoryboard>(PREMADE_PLANTS[0]);
  const [settings, setSettings] = useState<PlayerSettings>({
    isPlaying: false,
    currentTime: 0.0,
    duration: 15.0,
    speed: 1.0,
    rainEnabled: false,
    sunIntensity: 1.0,
    windSpeed: 0.5,
    soundEnabled: false,
  });

  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationStage, setGenerationStage] = useState("");
  
  // Active export poster state
  const [showExportModal, setShowExportModal] = useState(false);

  // sound sync effects on component mount and settings changes
  useEffect(() => {
    synth.enable(settings.soundEnabled);
    return () => {
      synth.enable(false);
    };
  }, [settings.soundEnabled]);

  // High precision countdown tick loops
  useEffect(() => {
    if (!settings.isPlaying) return;
    let lastTime = performance.now();
    let frameId: number;

    const tick = (now: number) => {
      const delta = (now - lastTime) / 1000; // delta elapsed in seconds
      lastTime = now;

      setSettings((prev) => {
        let nextTime = prev.currentTime + delta * prev.speed;
        if (nextTime >= prev.duration) {
          nextTime = 0; // seamless loop restart
          if (prev.soundEnabled) synth.triggerWaterDrop();
        }
        return { ...prev, currentTime: nextTime };
      });

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [settings.isPlaying, settings.speed]);

  // Handle plant selector click
  const selectPlantSpecimen = (plant: PlantStoryboard) => {
    setSelectedStoryboard(plant);
    setSettings((prev) => ({ ...prev, currentTime: 0.0, isPlaying: false }));
    if (settings.soundEnabled) {
      synth.triggerGrowthPulse();
    }
  };

  // Trigger bespoke procedural blossom audio sparkles on canvas triggers
  const handleBloomAudioSparkle = () => {
    if (settings.soundEnabled) {
      synth.triggerBloomSparkle();
    }
  };

  // Generate a custom specimen using Gemini Full-Stack API
  const handleLaunchGeneration = async (e: FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;

    setIsGenerating(true);
    setGenerationError(null);

    // Dynamic feedback quotes to manage loading duration wait times
    const loadingStages = [
      "Contacting biome design core...",
      "Sequencing photosynthetic k-layers...",
      "Structuring capillary root matrix...",
      "Simulating 15-second cellular growth arcs...",
    ];
    let stageIndex = 0;
    setGenerationStage(loadingStages[0]);
    const stageTimer = setInterval(() => {
      stageIndex = (stageIndex + 1) % loadingStages.length;
      setGenerationStage(loadingStages[stageIndex]);
    }, 2800);

    try {
      const response = await fetch("/api/generate-timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: customPrompt }),
      });

      const data = await response.json();
      clearInterval(stageTimer);

      if (data.success && data.storyboard) {
        setSelectedStoryboard(data.storyboard);
        setSettings((prev) => ({ ...prev, currentTime: 0.0, isPlaying: false }));
        setCustomPrompt("");
        if (settings.soundEnabled) {
          synth.triggerBloomSparkle();
        }
      } else {
        throw new Error(data.error || "Failed to parse plant parameters from core.");
      }
    } catch (err: any) {
      clearInterval(stageTimer);
      setGenerationError(err.message || "An expected network error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Returns matched background images for premade assets to display in sidebars
  const getThumbnailAsset = (plantName: string) => {
    if (plantName.includes("Fern")) return fernAssetImg;
    if (plantName.includes("Sunflower")) return sunflowerAssetImg;
    if (plantName.includes("Sakura") || plantName.includes("Cherry")) return blossomAssetImg;
    return null;
  };

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text font-sans flex flex-col antialiased">
      
      {/* 1. APP HEADER */}
      <header className="border-b border-natural-border bg-white px-8 h-16 flex items-center justify-between sticky top-0 z-30 select-none shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sage rounded-lg flex items-center justify-center shadow-inner">
            <Sparkles className="w-4.5 h-4.5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-md sm:text-lg font-semibold tracking-tight text-natural-text flex items-center gap-2">
              Flora 15 <span className="text-sage font-normal italic font-serif">Studio</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-natural-muted font-light font-sans font-sans">
              Dynamic 15-Second Plant Growth Video Generator & Lab
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sounds toggle button */}
          <button
            id="audio-synth-toggle-btn"
            onClick={() => setSettings(p => ({ ...p, soundEnabled: !p.soundEnabled }))}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-xs font-mono transition-all cursor-pointer ${
              settings.soundEnabled
                ? "bg-forest/10 text-forest border-forest/35 shadow-sm hover:bg-forest/20 font-bold"
                : "bg-white text-natural-muted border-natural-border hover:bg-natural-divide"
            }`}
            title="Toggle procedural background soundtrack"
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{settings.soundEnabled ? "Procedural Audio ON" : "Mute Sound"}</span>
          </button>

          <button
            id="export-metrics-btn"
            onClick={() => setShowExportModal(true)}
            className="px-6 py-2 bg-forest text-white text-xs font-medium rounded-full shadow-sm hover:bg-forest-dark transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download visual sequence storyboard"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline font-mono">Export Deck</span>
          </button>
        </div>
      </header>

      {/* 2. DUAL LAYOUT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: ACTIVE VIDEO PLAYER (7 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          
          {/* VIDEO RENDER SCREEN FRAME */}
          <div className="relative aspect-video w-full bg-slate-900 rounded-3xl overflow-hidden border border-natural-border shadow-md">
            <PlantVideoCanvas
              storyboard={selectedStoryboard}
              settings={settings}
              onBloomTriggered={handleBloomAudioSparkle}
            />
          </div>

          {/* PLAYBACK CONTROL DECK */}
          <div className="bg-white border border-natural-border p-6 rounded-3xl shadow-sm flex flex-col gap-5">
            
            {/* TIMELINE SLIDER WITH PROGRESS INDICATOR */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-natural-muted select-none px-0.5">
                <span className="text-forest font-semibold">0.00s (Seed)</span>
                <span className="text-natural-text bg-natural-divide px-2.5 py-0.5 rounded-full font-medium text-[10px]">
                  FRAME {(settings.currentTime * 60).toFixed(0)} / 900
                </span>
                <span className="text-forest font-semibold">15.00s (Cycle Complete)</span>
              </div>
              
              <div className="relative group w-full flex items-center">
                {/* Horizontal time stamps on track background */}
                <input
                  id="video-timeline-scrub"
                  type="range"
                  min="0"
                  max="15"
                  step="0.05"
                  value={settings.currentTime}
                  onChange={(e) => {
                    const nextVal = parseFloat(e.target.value);
                    setSettings((p) => ({ ...p, currentTime: nextVal }));
                    if (settings.soundEnabled && Math.random() < 0.25) {
                      synth.triggerWaterDrop();
                    }
                  }}
                  className="w-full h-2 rounded-full bg-natural-divide appearance-none cursor-ew-resize accent-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/40"
                />
              </div>

              {/* Tick marks on every second of the 15-second video */}
              <div className="flex justify-between px-1 text-[9px] font-mono text-natural-light select-none">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((sec) => (
                  <span
                    key={sec}
                    onClick={() => setSettings((p) => ({ ...p, currentTime: sec }))}
                    className={`cursor-pointer hover:text-forest transition-colors ${
                      Math.floor(settings.currentTime) === sec ? "text-terracotta font-semibold" : ""
                    }`}
                  >
                    |{sec}s
                  </span>
                ))}
              </div>
            </div>

            {/* BUTTON REGULATORS (Play/Pause, speed, reverse, rain, sunshine, wind modifiers) */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              
              {/* PLAYBACK ACTION RIG */}
              <div className="flex items-center gap-2">
                <button
                  id="play-pause-toggle"
                  onClick={() => setSettings((p) => ({ ...p, isPlaying: !p.isPlaying }))}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md border ${
                    settings.isPlaying
                      ? "bg-white text-forest border-natural-border hover:bg-natural-bg"
                      : "bg-forest text-white hover:bg-forest-dark border-transparent"
                  }`}
                  title={settings.isPlaying ? "Pause Sequence" : "Start 15-Second Growth Video"}
                >
                  {settings.isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>

                <button
                  id="restart-timeline"
                  onClick={() => setSettings((p) => ({ ...p, currentTime: 0.0 }))}
                  className="w-9 h-9 rounded-full bg-white hover:bg-natural-bg text-natural-text border border-natural-border flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                  title="Reset video to initial state (0.0s)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* PLAYBACK SPEED SELECTOR */}
                <div className="flex items-center bg-natural-bg p-1 rounded-full border border-natural-border shadow-inner animate-fade-in">
                  {[0.5, 1.0, 1.5, 2.0].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setSettings((p) => ({ ...p, speed: spd }))}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono transition-all cursor-pointer ${
                        settings.speed === spd
                          ? "bg-forest text-white font-bold shadow-sm"
                          : "text-natural-muted hover:text-forest"
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* DYNAMIC ATMOSPHERIC OVERLAYS */}
              <div className="flex items-center gap-3 animate-fade-in">
                
                {/* 1. RAIN / MOISTURE ENABLER */}
                <button
                  id="rain-toggle-trigger"
                  onClick={() => {
                    setSettings((p) => ({ ...p, rainEnabled: !p.rainEnabled }));
                    if (!settings.rainEnabled && settings.soundEnabled) synth.triggerWaterDrop();
                  }}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-mono border transition-all cursor-pointer shadow-sm ${
                    settings.rainEnabled
                      ? "bg-mint-bg text-forest border-sage/60 font-bold"
                      : "bg-white text-natural-light border-natural-border hover:bg-natural-divide"
                  }`}
                  title="Inject hydration droplet precipitation into simulation viewport"
                >
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Rain: {settings.rainEnabled ? "ON" : "OFF"}</span>
                </button>

                {/* 2. SOLAR INTENSITY (SLIDER) */}
                <div className="flex items-center gap-2 bg-white border border-natural-border px-4 py-1.5 rounded-full select-none shadow-sm">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-mono text-natural-muted hidden sm:inline">Sun:</span>
                  <input
                    id="sunlight-intensity-slider"
                    type="range"
                    min="0.2"
                    max="1.8"
                    step="0.1"
                    value={settings.sunIntensity}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setSettings((p) => ({ ...p, sunIntensity: v }));
                    }}
                    className="w-16 h-1 bg-natural-divide rounded-lg appearance-none cursor-pointer accent-forest"
                  />
                  <span className="text-[10px] font-mono text-natural-text">{(settings.sunIntensity * 100).toFixed(0)}%</span>
                </div>

                {/* 3. WIND SWEEP SPEED */}
                <div className="flex items-center gap-2 bg-white border border-natural-border px-4 py-1.5 rounded-full select-none shadow-sm">
                  <Wind className="w-3.5 h-3.5 text-sage" />
                  <span className="text-[10px] font-mono text-natural-muted hidden sm:inline">Wind:</span>
                  <input
                    id="wind-speed-slider"
                    type="range"
                    min="0.0"
                    max="1.5"
                    step="0.1"
                    value={settings.windSpeed}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setSettings((p) => ({ ...p, windSpeed: v }));
                    }}
                    className="w-16 h-1 bg-natural-divide rounded-lg appearance-none cursor-pointer accent-forest"
                  />
                  <span className="text-[10px] font-mono text-natural-text">{settings.windSpeed.toFixed(1)}x</span>
                </div>

              </div>

            </div>

          </div>

          {/* SCIENTIFIC SPECIMEN SPEC SHEET */}
          <div className="border border-natural-border bg-white/60 p-6 rounded-3xl shadow-sm animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-natural-text font-bold text-sm tracking-tight">
                  {selectedStoryboard.plantName} Specimen Fact Sheet
                </h3>
                <span className="text-xs font-mono text-forest italic">
                  {selectedStoryboard.scientificName} &bull; Family {selectedStoryboard.family}
                </span>
              </div>
              <span className="bg-white px-2.5 py-1 rounded-full text-[10px] font-mono text-natural-muted border border-natural-border shadow-sm uppercase">
                COLOR HEX: {selectedStoryboard.primaryColor}
              </span>
            </div>
            <p className="text-xs text-natural-muted leading-relaxed font-sans">
              {selectedStoryboard.summary} This biological model runs on a deterministic 15-second lifecycle engine, synthesizing photosynthetic milestones frame-by-frame. Toggle modifiers like rain precipitation or sunlight levels to watch the plant respond computationally inside the rendering matrix.
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN: LAB SIDEBAR CONTROLS & AI GENERATOR (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* LAB MODULE I: LAUNCH / BREED CUSTOM SPECIMEN (AI SYSTEM) */}
          <div className="bg-white border border-natural-border p-6 shadow-sm rounded-3xl animate-fade-in">
            <div className="flex items-center gap-2 mb-3 select-none">
              <Sparkles className="w-4.5 h-4.5 text-forest" />
              <h2 className="text-sm font-bold text-natural-text tracking-tight">
                AI Specimen Bio-Design Lab
              </h2>
            </div>
            <p className="text-xs text-natural-muted mb-4 leading-relaxed font-sans">
              Type any real or imaginary plant name (e.g. <i>"Neon Pitcher Plant"</i>, <i>"Deep Sea Fire-Kelp"</i>). Gemini will compute a custom 15-second timeline with rich scientific captions and colors.
            </p>

            <form onSubmit={handleLaunchGeneration} className="flex flex-col gap-3">
              <div className="relative">
                <input
                  id="custom-specimen-prompt-input"
                  type="text"
                  placeholder="Enter plant description..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  disabled={isGenerating}
                  className="w-full bg-natural-bg border border-natural-border disabled:opacity-50 text-natural-text text-xs rounded-xl px-4 py-3 focus:outline-none focus:border-forest placeholder-natural-light font-sans shadow-inner"
                />
              </div>

              {generationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-600 font-sans leading-relaxed shadow-sm animate-fade-in">
                  <span className="font-semibold block mb-0.5">Biosynthesis Interrupted:</span>
                  {generationError}
                </div>
              )}

              <button
                type="submit"
                disabled={isGenerating || !customPrompt.trim()}
                className="w-full bg-forest hover:bg-forest-dark text-white font-semibold py-2.5 px-4 rounded-full text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:-translate-y-0.5"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>{generationStage}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    <span>Synthesize unique Specimen</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* LAB MODULE II: SPECIMEN LIBRARY SELECTOR */}
          <div className="bg-white border border-natural-border p-5 rounded-3xl shadow-sm flex flex-col gap-4 animate-fade-in">
            <div className="flex items-center justify-between select-none border-b border-natural-divide pb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-forest" />
                <h2 className="text-xs font-mono font-bold tracking-wider text-natural-muted uppercase">
                  Seed Vault Bank
                </h2>
              </div>
              <span className="text-[10px] font-bold text-natural-light uppercase tracking-widest bg-natural-divide/40 px-2.5 py-0.5 rounded-full text-right">Vault</span>
            </div>

            <div className="flex flex-col gap-2">
              {PREMADE_PLANTS.map((plant) => {
                const isSelected = selectedStoryboard.plantName === plant.plantName;
                const thumbnail = getThumbnailAsset(plant.plantName);

                return (
                  <button
                    key={plant.plantName}
                    id={`seed-bank-${plant.plantName.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => selectPlantSpecimen(plant)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 relative overflow-hidden group cursor-pointer ${
                      isSelected
                        ? "bg-[#F9F7F2] border-sage ring-1 ring-sage/20 shadow-sm"
                        : "bg-white border-natural-divide hover:bg-natural-bg"
                    }`}
                  >
                    {/* Image thumb */}
                    {thumbnail ? (
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-natural-border flex-shrink-0 relative">
                        <img
                          src={thumbnail}
                          alt={plant.plantName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-12 h-12 rounded-xl flex-shrink-0 border border-natural-border flex items-center justify-center font-bold text-xs"
                        style={{ backgroundColor: plant.bgColor, color: plant.primaryColor }}
                      >
                        {plant.plantName.charAt(0)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-semibold text-natural-text group-hover:text-forest truncate">
                          {plant.plantName}
                        </h4>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-forest flex-shrink-0 animate-pulse" />
                        )}
                      </div>
                      <p className="text-[10px] text-forest/85 italic truncate mb-0.5">
                        {plant.scientificName}
                      </p>
                      <p className="text-[10px] text-natural-light truncate font-light">
                        {plant.summary}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LAB MODULE III: TIMELINE STORYBOARD / KEY STAGES MAP (Jump-to points) */}
          <div className="bg-white border border-natural-border p-5 shadow-sm rounded-3xl flex flex-col gap-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-natural-divide pb-2">
              <div className="flex items-center gap-2 select-none">
                <Sliders className="w-4 h-4 text-forest" />
                <h2 className="text-xs font-mono font-bold tracking-wider text-natural-muted uppercase">
                  Growth Timeline Map
                </h2>
              </div>
              <span className="text-[9px] font-mono text-natural-light">Click second to jump</span>
            </div>

            <div className="max-h-72 overflow-y-auto pr-1 flex flex-col gap-2">
              {selectedStoryboard.stages.map((stg) => {
                const isActive = Math.round(settings.currentTime) === stg.time;
                return (
                  <button
                    key={`${stg.time}-${stg.title}`}
                    id={`timeline-jump-${stg.time}`}
                    onClick={() => {
                      setSettings((p) => ({ ...p, currentTime: stg.time }));
                      if (settings.soundEnabled) synth.triggerWaterDrop();
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex items-center gap-3 cursor-pointer ${
                      isActive
                        ? "bg-mint-bg border-sage/40 text-natural-text shadow-sm"
                        : "bg-white border-natural-divide text-natural-muted hover:border-natural-border hover:bg-natural-bg"
                    }`}
                  >
                    <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full leading-none flex-shrink-0 ${
                      isActive ? "bg-forest/15 text-forest" : "bg-[#F9F7F2] text-natural-light border border-natural-border"
                    }`}>
                      {stg.time}s
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium truncate ${isActive ? "text-forest font-semibold" : "text-natural-text"}`}>
                          {stg.title}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-40 text-natural-text" />
                      </div>
                      <p className="text-[10px] text-natural-muted truncate mt-0.5 font-light leading-relaxed">
                        {stg.narration}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </main>

      {/* 3. EXPORT PRESENTATION MODAL / WATERMARK POSTER */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#FDFCF9] border border-natural-border rounded-3xl max-w-2xl w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <button
              id="close-export-modal"
              onClick={() => setShowExportModal(false)}
              className="absolute top-4 right-4 bg-white hover:bg-natural-bg text-natural-text hover:text-forest w-8 h-8 rounded-full flex items-center justify-center border border-natural-border cursor-pointer text-xs shadow-sm transition-all"
            >
              &times;
            </button>

            <div className="border-b border-natural-divide pb-4 mb-5">
              <h3 className="text-lg font-bold text-natural-text flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-forest animate-pulse" />
                Specimen Deck & Sequence Outline
              </h3>
              <p className="text-xs text-natural-muted">
                15-Second Biological sequence parameters compiled successfully.
              </p>
            </div>

            {/* Poster contents */}
            <div className="bg-white p-6 rounded-2xl border border-natural-border font-mono text-xs text-natural-text flex flex-col gap-4 shadow-sm select-all">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-natural-divide pb-3">
                <div>
                  <div className="text-forest font-bold text-sm tracking-wide">{selectedStoryboard.plantName.toUpperCase()}</div>
                  <div className="text-[10px] text-natural-muted italic uppercase">Systematic Binomial Identifier: {selectedStoryboard.scientificName}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-natural-muted uppercase">TIMESCALE: 00:15 SEC LIMIT</div>
                  <div className="text-[10px] text-forest bg-mint-bg border border-sage/35 px-2 py-0.5 mt-0.5 rounded uppercase">Verified Model: G-3.5-F</div>
                </div>
              </div>

              <div>
                <span className="font-semibold text-forest block mb-1">BIOME SUMMARY SPEC:</span>
                <p className="text-natural-muted font-sans leading-relaxed text-xs">
                  {selectedStoryboard.summary}
                </p>
              </div>

              {/* Milestone listings */}
              <div>
                <span className="font-semibold text-forest block mb-2 uppercase">Computed Lifecyle Milestones (15-second chronology):</span>
                <div className="space-y-2 border-l border-natural-border pl-3 ml-2.5 max-h-56 overflow-y-auto">
                  {selectedStoryboard.stages.map((stg) => (
                    <div key={stg.time} className="relative">
                      <div className="absolute -left-[19.5px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-sage" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-forest font-bold text-[10px] bg-natural-bg px-2 py-0.5 rounded-full border border-natural-border">
                            +{stg.time.toString().padStart(2, "0")}s
                          </span>
                          <span className="text-natural-text font-semibold text-xs">{stg.title}</span>
                        </div>
                        <p className="text-[11px] text-natural-muted font-sans mt-0.5 leading-relaxed">
                          {stg.narration} <i>(Height: {(stg.growthRatio * 100).toFixed(0)}%, Bloom: {(stg.flowerBloom * 100).toFixed(0)}%)</i>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-natural-divide pt-3 flex items-center justify-between text-[10px] text-natural-light">
                <span>COMPILED: {new Date().toISOString().split("T")[0]}</span>
                <span>METADATA_CHLOROPHYST_DECAY: APPROVED</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 font-sans">
              <button
                id="export-print-btn"
                onClick={() => {
                  window.print();
                }}
                className="bg-forest hover:bg-forest-dark text-white font-semibold py-2 px-5 rounded-full text-xs transition-colors cursor-pointer shadow-sm"
              >
                Print Sequence Brief
              </button>
              <button
                id="close-export-btn"
                onClick={() => setShowExportModal(false)}
                className="bg-natural-divide hover:bg-natural-border text-natural-text py-2 px-5 rounded-full text-xs border border-natural-border transition-colors cursor-pointer shadow-sm"
              >
                Dismiss Lab Deck
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. FOOTER */}
      <footer className="border-t border-natural-border bg-white py-5 px-8 flex justify-between items-center text-[10px] text-natural-muted font-sans tracking-wide select-none shadow-inner">
        <span>15 Seconds Duration Sequence Simulator</span>
        <div className="flex gap-4 font-mono">
          <span>FULL HD (1920x1080)</span>
          <span>&bull;</span>
          <span>30 FPS</span>
        </div>
      </footer>

    </div>
  );
}
