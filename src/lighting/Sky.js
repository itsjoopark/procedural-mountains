import * as THREE from 'three';

/**
 * Vertex shader for sky dome
 */
const skyVertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Fragment shader for gradient sky with sun/moon and stars
 */
const skyFragmentShader = /* glsl */ `
  uniform vec3 uTopColor;
  uniform vec3 uMiddleColor;
  uniform vec3 uBottomColor;
  uniform vec3 uHorizonColor;
  uniform vec3 uSunColor;
  uniform vec3 uSunPosition;
  uniform float uSunSize;
  uniform float uSunIntensity;
  uniform float uStarIntensity;
  uniform float uTime;
  
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  
  // Hash function for stars
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  
  // Star field
  float stars(vec3 dir) {
    vec3 p = dir * 300.0;
    vec3 id = floor(p);
    vec3 f = fract(p);
    
    float star = 0.0;
    
    // Check neighboring cells
    for (int x = -1; x <= 1; x++) {
      for (int y = -1; y <= 1; y++) {
        for (int z = -1; z <= 1; z++) {
          vec3 neighbor = vec3(float(x), float(y), float(z));
          vec3 cellId = id + neighbor;
          
          float rnd = hash(cellId);
          
          // Only some cells have stars
          if (rnd > 0.97) {
            vec3 starPos = neighbor + vec3(hash(cellId + 1.0), hash(cellId + 2.0), hash(cellId + 3.0)) - f;
            float dist = length(starPos);
            
            // Star size and brightness variation
            float brightness = hash(cellId + 4.0);
            float size = 0.015 + brightness * 0.02;
            
            // Twinkling
            float twinkle = sin(uTime * 2.0 + rnd * 100.0) * 0.3 + 0.7;
            
            star += smoothstep(size, 0.0, dist) * brightness * twinkle;
          }
        }
      }
    }
    
    return star;
  }
  
  void main() {
    vec3 direction = normalize(vWorldPosition);
    
    // Calculate vertical gradient factor
    float y = direction.y;
    
    // Multi-stop gradient
    vec3 skyColor;
    
    if (y > 0.3) {
      // Upper sky
      float t = smoothstep(0.3, 1.0, y);
      skyColor = mix(uMiddleColor, uTopColor, t);
    } else if (y > 0.0) {
      // Middle to horizon
      float t = smoothstep(0.0, 0.3, y);
      skyColor = mix(uHorizonColor, uMiddleColor, t);
    } else {
      // Below horizon (ground reflection)
      float t = smoothstep(-0.3, 0.0, y);
      skyColor = mix(uBottomColor, uHorizonColor, t);
    }
    
    // Sun/Moon glow
    vec3 sunDir = normalize(uSunPosition);
    float sunDot = dot(direction, sunDir);
    
    // Sun disc
    float sunDisc = smoothstep(1.0 - uSunSize * 0.01, 1.0, sunDot);
    
    // Sun glow (larger, softer)
    float sunGlow = pow(max(0.0, sunDot), 8.0) * 0.5;
    float sunHalo = pow(max(0.0, sunDot), 64.0) * 1.5;
    
    // Add sun to sky
    skyColor += uSunColor * (sunDisc + sunGlow + sunHalo) * uSunIntensity;
    
    // Stars (only visible at night)
    if (uStarIntensity > 0.0 && y > 0.0) {
      float starField = stars(direction);
      skyColor += vec3(starField * uStarIntensity);
    }
    
    // Atmospheric scattering effect near horizon
    float horizonGlow = exp(-abs(y) * 5.0) * 0.3;
    skyColor += uHorizonColor * horizonGlow * (1.0 - uStarIntensity);
    
    gl_FragColor = vec4(skyColor, 1.0);
  }
`;

/**
 * Sky - Creates a dynamic gradient sky dome with sun/moon and stars
 */
export class Sky {
  constructor(radius = 1000) {
    this.radius = radius;
    this.mesh = null;
    this.material = null;
    
    this.createSky();
  }
  
  createSky() {
    // Create a large sphere for the sky dome
    const geometry = new THREE.SphereGeometry(this.radius, 64, 32);
    
    this.material = new THREE.ShaderMaterial({
      vertexShader: skyVertexShader,
      fragmentShader: skyFragmentShader,
      uniforms: {
        // Day colors (default)
        uTopColor: { value: new THREE.Color(0.2, 0.4, 0.8) },
        uMiddleColor: { value: new THREE.Color(0.4, 0.6, 0.9) },
        uBottomColor: { value: new THREE.Color(0.5, 0.6, 0.7) },
        uHorizonColor: { value: new THREE.Color(0.7, 0.8, 0.9) },
        uSunColor: { value: new THREE.Color(1.0, 0.95, 0.8) },
        uSunPosition: { value: new THREE.Vector3(100, 150, 80) },
        uSunSize: { value: 1.5 },
        uSunIntensity: { value: 1.0 },
        uStarIntensity: { value: 0.0 },
        uTime: { value: 0 },
      },
      side: THREE.BackSide, // Render inside of sphere
      depthWrite: false,
    });
    
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.renderOrder = -1; // Render before other objects
  }
  
  /**
   * Get the sky mesh
   * @returns {THREE.Mesh}
   */
  getMesh() {
    return this.mesh;
  }
  
  /**
   * Get the sky material for updating uniforms
   * @returns {THREE.ShaderMaterial}
   */
  getMaterial() {
    return this.material;
  }
  
  /**
   * Update sky uniforms
   * @param {Object} params
   */
  updateUniforms(params) {
    if (params.topColor) {
      this.material.uniforms.uTopColor.value.copy(params.topColor);
    }
    if (params.middleColor) {
      this.material.uniforms.uMiddleColor.value.copy(params.middleColor);
    }
    if (params.bottomColor) {
      this.material.uniforms.uBottomColor.value.copy(params.bottomColor);
    }
    if (params.horizonColor) {
      this.material.uniforms.uHorizonColor.value.copy(params.horizonColor);
    }
    if (params.sunColor) {
      this.material.uniforms.uSunColor.value.copy(params.sunColor);
    }
    if (params.sunPosition) {
      this.material.uniforms.uSunPosition.value.copy(params.sunPosition);
    }
    if (params.sunSize !== undefined) {
      this.material.uniforms.uSunSize.value = params.sunSize;
    }
    if (params.sunIntensity !== undefined) {
      this.material.uniforms.uSunIntensity.value = params.sunIntensity;
    }
    if (params.starIntensity !== undefined) {
      this.material.uniforms.uStarIntensity.value = params.starIntensity;
    }
    if (params.time !== undefined) {
      this.material.uniforms.uTime.value = params.time;
    }
  }
  
  /**
   * Update sky (called each frame)
   * @param {number} time
   */
  update(time) {
    this.material.uniforms.uTime.value = time;
  }
  
  /**
   * Dispose of sky resources
   */
  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.material.dispose();
    }
  }
}

/**
 * Sky color presets for different times of day
 */
export const SkyPresets = {
  day: {
    topColor: new THREE.Color(0.15, 0.35, 0.75),
    middleColor: new THREE.Color(0.4, 0.6, 0.85),
    bottomColor: new THREE.Color(0.5, 0.55, 0.6),
    horizonColor: new THREE.Color(0.65, 0.75, 0.85),
    sunColor: new THREE.Color(1.0, 0.98, 0.92),
    sunIntensity: 1.2,
    starIntensity: 0.0,
  },
  
  sunset: {
    topColor: new THREE.Color(0.15, 0.25, 0.5),
    middleColor: new THREE.Color(0.5, 0.35, 0.4),
    bottomColor: new THREE.Color(0.3, 0.25, 0.3),
    horizonColor: new THREE.Color(0.95, 0.55, 0.3),
    sunColor: new THREE.Color(1.0, 0.5, 0.2),
    sunIntensity: 1.5,
    starIntensity: 0.0,
  },
  
  night: {
    topColor: new THREE.Color(0.02, 0.02, 0.08),
    middleColor: new THREE.Color(0.05, 0.05, 0.12),
    bottomColor: new THREE.Color(0.03, 0.03, 0.06),
    horizonColor: new THREE.Color(0.08, 0.08, 0.15),
    sunColor: new THREE.Color(0.8, 0.85, 1.0), // Moon color
    sunIntensity: 0.4,
    starIntensity: 1.0,
  },
  
  dawn: {
    topColor: new THREE.Color(0.12, 0.18, 0.4),
    middleColor: new THREE.Color(0.4, 0.35, 0.5),
    bottomColor: new THREE.Color(0.25, 0.2, 0.25),
    horizonColor: new THREE.Color(0.85, 0.5, 0.4),
    sunColor: new THREE.Color(1.0, 0.6, 0.4),
    sunIntensity: 1.0,
    starIntensity: 0.2,
  },
};

