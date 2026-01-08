/**
 * Simplex Noise implementation for procedural terrain generation
 * Uses the simplex-noise library for high-quality noise
 */

import { createNoise2D, createNoise3D } from 'simplex-noise';

// Create seeded noise functions
const noise2D = createNoise2D();
const noise3D = createNoise3D();

/**
 * Fractal Brownian Motion (FBM) - Multi-octave noise for realistic terrain
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} octaves - Number of noise layers
 * @param {number} persistence - Amplitude decay per octave (0-1)
 * @param {number} lacunarity - Frequency multiplier per octave
 * @param {number} scale - Base scale of the noise
 * @returns {number} - Noise value between -1 and 1
 */
export function fbm(x, y, octaves = 6, persistence = 0.5, lacunarity = 2.0, scale = 1.0) {
  let total = 0;
  let frequency = scale;
  let amplitude = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    total += noise2D(x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return total / maxValue;
}

/**
 * Ridged multi-fractal noise for sharp mountain ridges
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} octaves - Number of noise layers
 * @param {number} persistence - Amplitude decay
 * @param {number} lacunarity - Frequency multiplier
 * @param {number} scale - Base scale
 * @returns {number} - Noise value between 0 and 1
 */
export function ridgedNoise(x, y, octaves = 6, persistence = 0.5, lacunarity = 2.0, scale = 1.0) {
  let total = 0;
  let frequency = scale;
  let amplitude = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    let n = noise2D(x * frequency, y * frequency);
    // Create ridges by inverting absolute value
    n = 1.0 - Math.abs(n);
    // Square it to sharpen the ridges
    n = n * n;
    total += n * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return total / maxValue;
}

/**
 * Domain warping for more organic, natural-looking terrain
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} warpStrength - How much to warp the domain
 * @param {number} scale - Base scale
 * @returns {object} - Warped coordinates {x, y}
 */
export function domainWarp(x, y, warpStrength = 0.5, scale = 0.5) {
  const warpX = fbm(x, y, 4, 0.5, 2.0, scale);
  const warpY = fbm(x + 5.2, y + 1.3, 4, 0.5, 2.0, scale);
  
  return {
    x: x + warpX * warpStrength,
    y: y + warpY * warpStrength
  };
}

/**
 * Combined terrain height function for alpine mountains
 * Blends ridged noise with smooth fbm for realistic alpine terrain
 * @param {number} x - X coordinate (normalized 0-1)
 * @param {number} y - Y coordinate (normalized 0-1)
 * @returns {number} - Height value between 0 and 1
 */
export function alpineHeight(x, y) {
  // Apply domain warping for more organic shapes
  const warped = domainWarp(x, y, 0.4, 0.3);
  
  // Base terrain with smooth FBM
  const baseHeight = fbm(warped.x, warped.y, 5, 0.5, 2.0, 1.5);
  
  // Sharp ridges for mountain peaks
  const ridges = ridgedNoise(warped.x, warped.y, 5, 0.5, 2.2, 2.0);
  
  // Large-scale variation for valleys and peaks
  const largeScale = fbm(x, y, 3, 0.4, 2.0, 0.4);
  
  // Blend based on large-scale variation - valleys are smoother, peaks are ridged
  const ridgeBlend = Math.max(0, largeScale * 0.5 + 0.5);
  
  // Combine the noise layers
  let height = baseHeight * (1 - ridgeBlend * 0.6) + ridges * ridgeBlend * 0.8;
  
  // Add some fine detail
  const detail = fbm(x * 4, y * 4, 3, 0.4, 2.5, 4.0) * 0.1;
  height += detail;
  
  // Normalize to 0-1 range
  height = (height + 1) * 0.5;
  
  // Apply a power curve to create more dramatic peaks
  height = Math.pow(height, 1.3);
  
  // Create some flat valley areas
  if (height < 0.25) {
    height = height * 0.7 + 0.25 * 0.3;
  }
  
  return Math.max(0, Math.min(1, height));
}

export { noise2D, noise3D };

