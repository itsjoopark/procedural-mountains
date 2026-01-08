/**
 * Alpine Terrain - Procedural Mountains
 * 
 * An interactive 3D visualization of European Alps-style mountain terrain
 * Built with Three.js and WebGL
 * 
 * Controls:
 * - Mouse drag: Rotate camera
 * - Mouse scroll: Zoom in/out
 * - Spacebar: Toggle day/night
 */

import * as THREE from 'three';
import { SceneManager } from './scene/SceneManager.js';
import { TerrainGenerator } from './terrain/TerrainGenerator.js';
import { Sky } from './lighting/Sky.js';
import { DayNightCycle } from './lighting/DayNightCycle.js';
import { InputHandler, KeyCodes } from './controls/InputHandler.js';

class AlpineTerrain {
  constructor() {
    this.container = document.getElementById('canvas-container');
    
    // Initialize core components
    this.sceneManager = new SceneManager(this.container);
    
    // Initialize terrain
    this.terrainGenerator = new TerrainGenerator({
      width: 400,
      depth: 400,
      segments: 256,
      heightScale: 120,
    });
    
    // Initialize sky
    this.sky = new Sky(1000);
    
    // Initialize input handler
    this.inputHandler = new InputHandler();
    
    // Clock for animation
    this.clock = new THREE.Clock();
    
    // Build the scene
    this.setupScene();
    
    // Initialize day/night cycle (after terrain is built)
    this.dayNightCycle = new DayNightCycle(
      this.sceneManager,
      this.sky,
      this.terrainGenerator.getMaterial()
    );
    
    // Setup controls
    this.setupControls();
    
    // Start animation loop
    this.animate();
    
    console.log('Alpine Terrain initialized');
    console.log('Press SPACE to toggle day/night');
  }
  
  /**
   * Setup the 3D scene with terrain and sky
   */
  setupScene() {
    // Add sky dome
    this.sceneManager.add(this.sky.getMesh());
    
    // Generate and add terrain
    const terrainMesh = this.terrainGenerator.generate();
    this.sceneManager.add(terrainMesh);
    
    // Add some atmospheric depth
    this.addAtmosphericElements();
  }
  
  /**
   * Add atmospheric elements for visual depth
   */
  addAtmosphericElements() {
    // The fog is already set in SceneManager and controlled by DayNightCycle
    // This method can be extended for additional atmospheric effects
    
    // Optional: Add ground plane for depth at edges
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3320,
      roughness: 1.0,
      metalness: 0.0,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -5; // Just below terrain
    ground.receiveShadow = true;
    this.sceneManager.add(ground);
  }
  
  /**
   * Setup input controls
   */
  setupControls() {
    // Spacebar toggles day/night
    this.inputHandler.onKeyDown(KeyCodes.SPACE, () => {
      this.dayNightCycle.toggle();
    });
  }
  
  /**
   * Main animation loop
   */
  animate() {
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();
    
    // Update day/night cycle
    this.dayNightCycle.update(deltaTime, elapsedTime);
    
    // Update terrain (for any time-based effects)
    this.terrainGenerator.update(deltaTime);
    
    // Update scene (controls, etc.)
    this.sceneManager.update();
    
    // Render
    this.sceneManager.render();
  }
  
  /**
   * Cleanup resources
   */
  dispose() {
    this.terrainGenerator.dispose();
    this.sky.dispose();
    this.inputHandler.dispose();
  }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new AlpineTerrain();
});

