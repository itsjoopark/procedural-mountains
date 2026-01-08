import * as THREE from 'three';
import { alpineHeight } from '../utils/noise.js';
import { createTerrainMaterial } from './terrainShader.js';

/**
 * TerrainGenerator - Creates procedural alpine mountain terrain
 */
export class TerrainGenerator {
  constructor(options = {}) {
    this.width = options.width || 400;
    this.depth = options.depth || 400;
    this.segments = options.segments || 256;
    this.heightScale = options.heightScale || 120;
    this.mesh = null;
    this.geometry = null;
    this.material = null;
    
    // Store height data for potential use (collision, etc)
    this.heightData = [];
  }
  
  /**
   * Generate the terrain mesh
   * @returns {THREE.Mesh} The terrain mesh
   */
  generate() {
    this.geometry = this.createGeometry();
    this.material = createTerrainMaterial();
    
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    
    // Center the terrain
    this.mesh.position.set(0, 0, 0);
    
    return this.mesh;
  }
  
  /**
   * Create the terrain geometry with procedural heightmap
   * @returns {THREE.BufferGeometry}
   */
  createGeometry() {
    const geometry = new THREE.PlaneGeometry(
      this.width,
      this.depth,
      this.segments,
      this.segments
    );
    
    // Rotate to be horizontal (XZ plane)
    geometry.rotateX(-Math.PI / 2);
    
    const positions = geometry.attributes.position.array;
    const normals = geometry.attributes.normal.array;
    const uvs = geometry.attributes.uv.array;
    
    // Create new arrays for custom attributes
    const vertexCount = positions.length / 3;
    const heights = new Float32Array(vertexCount);
    const slopes = new Float32Array(vertexCount);
    
    // Apply heightmap to vertices
    for (let i = 0; i < vertexCount; i++) {
      const x = positions[i * 3];
      const z = positions[i * 3 + 2];
      
      // Normalize coordinates to 0-1 range for noise
      const nx = (x + this.width / 2) / this.width;
      const nz = (z + this.depth / 2) / this.depth;
      
      // Get height from noise function
      const height = alpineHeight(nx, nz);
      
      // Store raw height
      this.heightData.push(height);
      heights[i] = height;
      
      // Apply height to vertex
      positions[i * 3 + 1] = height * this.heightScale;
    }
    
    // Recompute normals after displacement
    geometry.computeVertexNormals();
    
    // Calculate slope for each vertex (for shader)
    const newNormals = geometry.attributes.normal.array;
    for (let i = 0; i < vertexCount; i++) {
      const ny = newNormals[i * 3 + 1]; // Y component of normal
      // Slope is inverse of how much the normal points up
      // 0 = flat, 1 = vertical cliff
      slopes[i] = 1.0 - Math.abs(ny);
    }
    
    // Add custom attributes
    geometry.setAttribute('aHeight', new THREE.BufferAttribute(heights, 1));
    geometry.setAttribute('aSlope', new THREE.BufferAttribute(slopes, 1));
    
    // Improve UVs for better texture mapping
    for (let i = 0; i < uvs.length; i += 2) {
      uvs[i] *= 8; // Tile texture 8x
      uvs[i + 1] *= 8;
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.uv.needsUpdate = true;
    
    return geometry;
  }
  
  /**
   * Get height at a specific world position
   * @param {number} x - World X coordinate
   * @param {number} z - World Z coordinate
   * @returns {number} Height at that position
   */
  getHeightAt(x, z) {
    // Normalize to terrain coordinates
    const nx = (x + this.width / 2) / this.width;
    const nz = (z + this.depth / 2) / this.depth;
    
    if (nx < 0 || nx > 1 || nz < 0 || nz > 1) {
      return 0;
    }
    
    return alpineHeight(nx, nz) * this.heightScale;
  }
  
  /**
   * Get the terrain mesh
   * @returns {THREE.Mesh}
   */
  getMesh() {
    return this.mesh;
  }
  
  /**
   * Get the terrain material for updating uniforms
   * @returns {THREE.ShaderMaterial}
   */
  getMaterial() {
    return this.material;
  }
  
  /**
   * Update terrain (for animation if needed)
   * @param {number} deltaTime
   */
  update(deltaTime) {
    // Could add subtle animation here if desired
  }
  
  /**
   * Dispose of terrain resources
   */
  dispose() {
    if (this.geometry) {
      this.geometry.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }
  }
}

