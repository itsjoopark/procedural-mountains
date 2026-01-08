import * as THREE from 'three';
import { SkyPresets } from './Sky.js';
import { updateTerrainUniforms } from '../terrain/terrainShader.js';

/**
 * DayNightCycle - Controls smooth transitions between day and night lighting states
 */
export class DayNightCycle {
  constructor(sceneManager, sky, terrainMaterial) {
    this.sceneManager = sceneManager;
    this.sky = sky;
    this.terrainMaterial = terrainMaterial;
    
    // Current state: 0 = day, 1 = night
    this.currentState = 0;
    this.targetState = 0;
    
    // Transition progress (0-1, where 0 = at currentState, 1 = at targetState)
    this.transitionProgress = 0;
    this.transitionDuration = 2.5; // seconds for full transition
    this.isTransitioning = false;
    
    // Cached colors for interpolation
    this.dayColors = this.createDayState();
    this.nightColors = this.createNightState();
    
    // Current interpolated values
    this.currentColors = this.cloneState(this.dayColors);
    
    // UI indicator
    this.timeIndicator = document.getElementById('time-indicator');
    
    // Apply initial state
    this.applyState(this.currentColors);
  }
  
  /**
   * Create day lighting state
   */
  createDayState() {
    return {
      // Sun position (high in sky)
      sunPosition: new THREE.Vector3(100, 200, 80),
      sunDirection: new THREE.Vector3(0.4, 0.8, 0.3).normalize(),
      
      // Sun light
      sunColor: new THREE.Color(1.0, 0.98, 0.92),
      sunIntensity: 2.0,
      
      // Ambient light
      ambientColor: new THREE.Color(0.5, 0.6, 0.8),
      ambientIntensity: 0.5,
      
      // Hemisphere light
      hemiSkyColor: new THREE.Color(0.6, 0.75, 0.9),
      hemiGroundColor: new THREE.Color(0.3, 0.4, 0.25),
      hemiIntensity: 0.4,
      
      // Sky colors
      skyTopColor: new THREE.Color(0.15, 0.35, 0.75),
      skyMiddleColor: new THREE.Color(0.4, 0.6, 0.85),
      skyBottomColor: new THREE.Color(0.5, 0.55, 0.6),
      skyHorizonColor: new THREE.Color(0.65, 0.78, 0.88),
      skySunColor: new THREE.Color(1.0, 0.98, 0.92),
      skySunIntensity: 1.2,
      skyStarIntensity: 0.0,
      
      // Fog
      fogColor: new THREE.Color(0.6, 0.75, 0.9),
      fogDensity: 0.0008,
      
      // Terrain shader
      terrainDayNightMix: 0.0,
      
      // Renderer
      exposure: 1.0,
    };
  }
  
  /**
   * Create night lighting state
   */
  createNightState() {
    return {
      // Moon position (opposite side, lower)
      sunPosition: new THREE.Vector3(-80, 100, -60),
      sunDirection: new THREE.Vector3(-0.3, 0.6, -0.3).normalize(),
      
      // Moon light (dimmer, blue-ish)
      sunColor: new THREE.Color(0.6, 0.7, 0.9),
      sunIntensity: 0.3,
      
      // Ambient light (darker, blue)
      ambientColor: new THREE.Color(0.1, 0.12, 0.2),
      ambientIntensity: 0.3,
      
      // Hemisphere light
      hemiSkyColor: new THREE.Color(0.08, 0.1, 0.2),
      hemiGroundColor: new THREE.Color(0.02, 0.03, 0.05),
      hemiIntensity: 0.2,
      
      // Sky colors (dark with stars)
      skyTopColor: new THREE.Color(0.01, 0.01, 0.05),
      skyMiddleColor: new THREE.Color(0.03, 0.04, 0.1),
      skyBottomColor: new THREE.Color(0.02, 0.02, 0.05),
      skyHorizonColor: new THREE.Color(0.06, 0.07, 0.12),
      skySunColor: new THREE.Color(0.8, 0.85, 1.0), // Moon
      skySunIntensity: 0.5,
      skyStarIntensity: 1.0,
      
      // Fog (darker)
      fogColor: new THREE.Color(0.05, 0.06, 0.1),
      fogDensity: 0.0015,
      
      // Terrain shader
      terrainDayNightMix: 1.0,
      
      // Renderer
      exposure: 0.6,
    };
  }
  
  /**
   * Clone a lighting state
   */
  cloneState(state) {
    return {
      sunPosition: state.sunPosition.clone(),
      sunDirection: state.sunDirection.clone(),
      sunColor: state.sunColor.clone(),
      sunIntensity: state.sunIntensity,
      ambientColor: state.ambientColor.clone(),
      ambientIntensity: state.ambientIntensity,
      hemiSkyColor: state.hemiSkyColor.clone(),
      hemiGroundColor: state.hemiGroundColor.clone(),
      hemiIntensity: state.hemiIntensity,
      skyTopColor: state.skyTopColor.clone(),
      skyMiddleColor: state.skyMiddleColor.clone(),
      skyBottomColor: state.skyBottomColor.clone(),
      skyHorizonColor: state.skyHorizonColor.clone(),
      skySunColor: state.skySunColor.clone(),
      skySunIntensity: state.skySunIntensity,
      skyStarIntensity: state.skyStarIntensity,
      fogColor: state.fogColor.clone(),
      fogDensity: state.fogDensity,
      terrainDayNightMix: state.terrainDayNightMix,
      exposure: state.exposure,
    };
  }
  
  /**
   * Interpolate between two states
   * @param {Object} from - Start state
   * @param {Object} to - End state
   * @param {number} t - Interpolation factor (0-1)
   * @param {Object} target - Target object to store result
   */
  lerpState(from, to, t, target) {
    // Use smooth easing for more natural transitions
    const eased = this.easeInOutCubic(t);
    
    // Interpolate vectors
    target.sunPosition.lerpVectors(from.sunPosition, to.sunPosition, eased);
    target.sunDirection.lerpVectors(from.sunDirection, to.sunDirection, eased).normalize();
    
    // Interpolate colors
    target.sunColor.lerpColors(from.sunColor, to.sunColor, eased);
    target.ambientColor.lerpColors(from.ambientColor, to.ambientColor, eased);
    target.hemiSkyColor.lerpColors(from.hemiSkyColor, to.hemiSkyColor, eased);
    target.hemiGroundColor.lerpColors(from.hemiGroundColor, to.hemiGroundColor, eased);
    target.skyTopColor.lerpColors(from.skyTopColor, to.skyTopColor, eased);
    target.skyMiddleColor.lerpColors(from.skyMiddleColor, to.skyMiddleColor, eased);
    target.skyBottomColor.lerpColors(from.skyBottomColor, to.skyBottomColor, eased);
    target.skyHorizonColor.lerpColors(from.skyHorizonColor, to.skyHorizonColor, eased);
    target.skySunColor.lerpColors(from.skySunColor, to.skySunColor, eased);
    target.fogColor.lerpColors(from.fogColor, to.fogColor, eased);
    
    // Interpolate scalars
    target.sunIntensity = THREE.MathUtils.lerp(from.sunIntensity, to.sunIntensity, eased);
    target.ambientIntensity = THREE.MathUtils.lerp(from.ambientIntensity, to.ambientIntensity, eased);
    target.hemiIntensity = THREE.MathUtils.lerp(from.hemiIntensity, to.hemiIntensity, eased);
    target.skySunIntensity = THREE.MathUtils.lerp(from.skySunIntensity, to.skySunIntensity, eased);
    target.skyStarIntensity = THREE.MathUtils.lerp(from.skyStarIntensity, to.skyStarIntensity, eased);
    target.fogDensity = THREE.MathUtils.lerp(from.fogDensity, to.fogDensity, eased);
    target.terrainDayNightMix = THREE.MathUtils.lerp(from.terrainDayNightMix, to.terrainDayNightMix, eased);
    target.exposure = THREE.MathUtils.lerp(from.exposure, to.exposure, eased);
  }
  
  /**
   * Smooth easing function
   */
  easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  /**
   * Apply a lighting state to the scene
   * @param {Object} state
   */
  applyState(state) {
    // Update sun light
    const sunLight = this.sceneManager.getSunLight();
    sunLight.position.copy(state.sunPosition);
    sunLight.color.copy(state.sunColor);
    sunLight.intensity = state.sunIntensity;
    
    // Update ambient light
    const ambientLight = this.sceneManager.getAmbientLight();
    ambientLight.color.copy(state.ambientColor);
    ambientLight.intensity = state.ambientIntensity;
    
    // Update hemisphere light
    const hemiLight = this.sceneManager.getHemisphereLight();
    hemiLight.color.copy(state.hemiSkyColor);
    hemiLight.groundColor.copy(state.hemiGroundColor);
    hemiLight.intensity = state.hemiIntensity;
    
    // Update sky
    this.sky.updateUniforms({
      topColor: state.skyTopColor,
      middleColor: state.skyMiddleColor,
      bottomColor: state.skyBottomColor,
      horizonColor: state.skyHorizonColor,
      sunColor: state.skySunColor,
      sunPosition: state.sunPosition,
      sunIntensity: state.skySunIntensity,
      starIntensity: state.skyStarIntensity,
    });
    
    // Update fog
    const scene = this.sceneManager.getScene();
    scene.fog.color.copy(state.fogColor);
    scene.fog.density = state.fogDensity;
    
    // Update terrain shader
    if (this.terrainMaterial) {
      updateTerrainUniforms(this.terrainMaterial, {
        sunDirection: state.sunDirection,
        sunColor: state.sunColor,
        sunIntensity: state.sunIntensity,
        ambientColor: state.ambientColor,
        ambientIntensity: state.ambientIntensity,
        dayNightMix: state.terrainDayNightMix,
        fogColor: state.fogColor,
        fogDensity: state.fogDensity,
      });
    }
    
    // Update renderer exposure
    const renderer = this.sceneManager.getRenderer();
    renderer.toneMappingExposure = state.exposure;
  }
  
  /**
   * Toggle between day and night
   */
  toggle() {
    if (this.isTransitioning) {
      // If currently transitioning, reverse direction
      this.targetState = this.targetState === 0 ? 1 : 0;
    } else {
      // Start new transition
      this.targetState = this.currentState === 0 ? 1 : 0;
      this.isTransitioning = true;
      this.transitionProgress = 0;
    }
    
    // Update UI
    this.updateUI();
  }
  
  /**
   * Update UI indicator
   */
  updateUI() {
    if (this.timeIndicator) {
      const targetName = this.targetState === 0 ? 'Day' : 'Night';
      this.timeIndicator.textContent = targetName;
    }
  }
  
  /**
   * Check if currently day
   * @returns {boolean}
   */
  isDay() {
    return this.currentState === 0 && !this.isTransitioning;
  }
  
  /**
   * Check if currently night
   * @returns {boolean}
   */
  isNight() {
    return this.currentState === 1 && !this.isTransitioning;
  }
  
  /**
   * Update the day/night cycle (call each frame)
   * @param {number} deltaTime - Time since last frame in seconds
   * @param {number} elapsedTime - Total elapsed time
   */
  update(deltaTime, elapsedTime) {
    // Update sky time for star twinkling
    this.sky.update(elapsedTime);
    
    // Update terrain time for any time-based effects
    if (this.terrainMaterial) {
      updateTerrainUniforms(this.terrainMaterial, { time: elapsedTime });
    }
    
    // Handle transition
    if (this.isTransitioning) {
      this.transitionProgress += deltaTime / this.transitionDuration;
      
      if (this.transitionProgress >= 1) {
        // Transition complete
        this.transitionProgress = 1;
        this.currentState = this.targetState;
        this.isTransitioning = false;
      }
      
      // Determine interpolation direction
      const fromState = this.currentState === 0 ? this.dayColors : this.nightColors;
      const toState = this.targetState === 0 ? this.dayColors : this.nightColors;
      
      // Interpolate and apply
      this.lerpState(fromState, toState, this.transitionProgress, this.currentColors);
      this.applyState(this.currentColors);
    }
  }
  
  /**
   * Set transition duration
   * @param {number} duration - Duration in seconds
   */
  setTransitionDuration(duration) {
    this.transitionDuration = duration;
  }
  
  /**
   * Get current interpolated state value (0 = day, 1 = night)
   * @returns {number}
   */
  getCurrentValue() {
    if (!this.isTransitioning) {
      return this.currentState;
    }
    
    // Calculate actual interpolated value
    const direction = this.targetState > this.currentState ? 1 : -1;
    return this.currentState + direction * this.easeInOutCubic(this.transitionProgress);
  }
}

