/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PlantStoryboardStage {
  time: number; // 0 to 15 seconds
  title: string;
  narration: string;
  particleIntensity: number; // 0 to 100 representing solar radiation or rainfall density
  growthRatio: number; // 0.0 to 1.0 (stem/sprout height)
  rootRatio: number; // 0.0 to 1.0 (root depth)
  flowerBloom: number; // 0.0 to 1.0 (flower size/bloom state)
  leafCount: number; // 0 to 20 leaves
  windSway: number; // 0.0 to 1.0 (sway physics multiplier)
}

export interface PlantStoryboard {
  plantName: string;
  scientificName: string;
  family: string;
  summary: string;
  primaryColor: string; // hex color for stem/flowers
  flowerColor: string; // hex color for flowers
  bgColor: string; // hex background color for context
  stages: PlantStoryboardStage[];
}

export interface PlayerSettings {
  isPlaying: boolean;
  currentTime: number; // 0.0 to 15.0 seconds
  duration: number; // constant 15
  speed: number; // 0.5, 1.0, 1.5, 2.0
  rainEnabled: boolean;
  sunIntensity: number; // 0.5 to 1.5
  windSpeed: number; // 0.0 to 1.5
  soundEnabled: boolean;
}
