import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * SceneManager - Handles Three.js scene setup, camera, renderer, and controls
 */
export class SceneManager {
  constructor(container) {
    this.container = container;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.initLights();
    
    this.setupResize();
  }
  
  initScene() {
    this.scene = new THREE.Scene();
    // Initial fog will be set by DayNightCycle
    this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.0008);
  }
  
  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      60, // FOV
      this.width / this.height, // Aspect ratio
      0.1, // Near plane
      2000 // Far plane
    );
    
    // Position camera for a nice initial view
    this.camera.position.set(150, 120, 200);
    this.camera.lookAt(0, 30, 0);
  }
  
  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    this.container.appendChild(this.renderer.domElement);
  }
  
  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    
    // Smooth damping for cinematic feel
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    // Zoom limits
    this.controls.minDistance = 50;
    this.controls.maxDistance = 500;
    
    // Angle constraints - prevent going below terrain
    this.controls.maxPolarAngle = Math.PI * 0.48; // Slightly above horizon
    this.controls.minPolarAngle = Math.PI * 0.1; // Not too high
    
    // Pan settings
    this.controls.enablePan = true;
    this.controls.panSpeed = 0.8;
    
    // Target center of terrain
    this.controls.target.set(0, 20, 0);
    
    // Smooth rotation
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 1.0;
  }
  
  initLights() {
    // Main directional light (sun)
    this.sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    this.sunLight.position.set(100, 150, 80);
    this.sunLight.castShadow = true;
    
    // Shadow settings
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 500;
    this.sunLight.shadow.camera.left = -200;
    this.sunLight.shadow.camera.right = 200;
    this.sunLight.shadow.camera.top = 200;
    this.sunLight.shadow.camera.bottom = -200;
    this.sunLight.shadow.bias = -0.0005;
    
    this.scene.add(this.sunLight);
    
    // Ambient light for fill
    this.ambientLight = new THREE.AmbientLight(0x6B8CAE, 0.4);
    this.scene.add(this.ambientLight);
    
    // Hemisphere light for natural sky/ground color variation
    this.hemisphereLight = new THREE.HemisphereLight(
      0x87CEEB, // Sky color
      0x3D5C3D, // Ground color
      0.3
    );
    this.scene.add(this.hemisphereLight);
  }
  
  setupResize() {
    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      
      this.renderer.setSize(this.width, this.height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }
  
  add(object) {
    this.scene.add(object);
  }
  
  remove(object) {
    this.scene.remove(object);
  }
  
  update() {
    this.controls.update();
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  
  // Getters for external access
  getScene() {
    return this.scene;
  }
  
  getCamera() {
    return this.camera;
  }
  
  getRenderer() {
    return this.renderer;
  }
  
  getSunLight() {
    return this.sunLight;
  }
  
  getAmbientLight() {
    return this.ambientLight;
  }
  
  getHemisphereLight() {
    return this.hemisphereLight;
  }
}

