import * as THREE from 'three';

/**
 * Vertex shader for terrain
 * Passes height and slope to fragment shader
 */
const vertexShader = /* glsl */ `
  attribute float aHeight;
  attribute float aSlope;
  
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vHeight;
  varying float vSlope;
  varying float vFogDepth;
  
  void main() {
    vUv = uv;
    vHeight = aHeight;
    vSlope = aSlope;
    vNormal = normalize(normalMatrix * normal);
    
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    vec4 mvPosition = viewMatrix * worldPosition;
    vFogDepth = -mvPosition.z;
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;

/**
 * Fragment shader for terrain
 * Creates realistic alpine coloring based on altitude and slope
 */
const fragmentShader = /* glsl */ `
  uniform vec3 uSunDirection;
  uniform vec3 uSunColor;
  uniform float uSunIntensity;
  uniform vec3 uAmbientColor;
  uniform float uAmbientIntensity;
  uniform float uTime;
  uniform float uDayNightMix; // 0 = day, 1 = night
  
  // Fog uniforms
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vHeight;
  varying float vSlope;
  varying float vFogDepth;
  
  // Color palette for alpine terrain
  const vec3 deepGrassColor = vec3(0.15, 0.32, 0.12);
  const vec3 grassColor = vec3(0.22, 0.42, 0.15);
  const vec3 lightGrassColor = vec3(0.35, 0.52, 0.22);
  const vec3 dryGrassColor = vec3(0.45, 0.42, 0.25);
  const vec3 rockColorDark = vec3(0.28, 0.26, 0.24);
  const vec3 rockColor = vec3(0.42, 0.40, 0.38);
  const vec3 rockColorLight = vec3(0.55, 0.53, 0.50);
  const vec3 snowColor = vec3(0.95, 0.97, 1.0);
  const vec3 iceColor = vec3(0.85, 0.92, 0.98);
  
  // Night versions (darker, blue tinted)
  const vec3 nightGrassColor = vec3(0.05, 0.08, 0.12);
  const vec3 nightRockColor = vec3(0.12, 0.12, 0.15);
  const vec3 nightSnowColor = vec3(0.35, 0.40, 0.55);
  
  // Pseudo-random function for variation
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  
  // Smooth noise for color variation
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  
  // FBM for detail variation
  float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      if (i >= octaves) break;
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
  
  void main() {
    // Calculate base terrain zones based on height
    float height = vHeight;
    float slope = vSlope;
    
    // Add some noise variation to boundaries
    vec2 detailUv = vUv * 32.0;
    float boundaryNoise = fbm(detailUv, 4) * 0.15;
    
    // Zone thresholds (with noise variation)
    float valleyLine = 0.2 + boundaryNoise;
    float grassLine = 0.35 + boundaryNoise;
    float treeLine = 0.55 + boundaryNoise * 0.8;
    float rockLine = 0.72 + boundaryNoise * 0.5;
    float snowLine = 0.82 + boundaryNoise * 0.3;
    
    // Calculate day colors
    vec3 dayColor;
    
    // Valley / Low grass
    if (height < valleyLine) {
      float t = smoothstep(0.0, valleyLine, height);
      dayColor = mix(deepGrassColor, grassColor, t);
    }
    // Grass / Meadow zone
    else if (height < grassLine) {
      float t = smoothstep(valleyLine, grassLine, height);
      vec3 grassVariation = mix(grassColor, lightGrassColor, noise(vUv * 20.0));
      dayColor = mix(grassColor, grassVariation, t);
    }
    // Transition to alpine / dry grass
    else if (height < treeLine) {
      float t = smoothstep(grassLine, treeLine, height);
      vec3 alpineGrass = mix(lightGrassColor, dryGrassColor, fbm(vUv * 15.0, 3));
      dayColor = mix(lightGrassColor, alpineGrass, t);
    }
    // Rock zone
    else if (height < rockLine) {
      float t = smoothstep(treeLine, rockLine, height);
      vec3 rockVariation = mix(rockColorDark, rockColor, noise(vUv * 25.0));
      dayColor = mix(dryGrassColor, rockVariation, t);
    }
    // High rock / pre-snow
    else if (height < snowLine) {
      float t = smoothstep(rockLine, snowLine, height);
      vec3 highRock = mix(rockColor, rockColorLight, fbm(vUv * 30.0, 3));
      dayColor = mix(rockColor, highRock, t);
    }
    // Snow cap
    else {
      float t = smoothstep(snowLine, 1.0, height);
      vec3 snowVariation = mix(iceColor, snowColor, noise(vUv * 40.0) * 0.5 + 0.5);
      dayColor = mix(rockColorLight, snowVariation, t);
    }
    
    // Slope-based rock exposure (steep areas show more rock)
    float slopeRockFactor = smoothstep(0.4, 0.7, slope);
    vec3 slopeRockColor = mix(rockColorDark, rockColor, noise(vUv * 20.0));
    
    // Don't apply rock to snow zones as much
    float snowProtection = smoothstep(snowLine - 0.1, snowLine + 0.1, height);
    slopeRockFactor *= (1.0 - snowProtection * 0.7);
    
    dayColor = mix(dayColor, slopeRockColor, slopeRockFactor * 0.8);
    
    // Calculate night colors (blue-shifted, darker)
    vec3 nightColor;
    if (height < treeLine) {
      nightColor = nightGrassColor;
    } else if (height < snowLine) {
      float t = smoothstep(treeLine, snowLine, height);
      nightColor = mix(nightGrassColor, nightRockColor, t);
    } else {
      float t = smoothstep(snowLine, 1.0, height);
      nightColor = mix(nightRockColor, nightSnowColor, t);
    }
    
    // Blend day/night base color
    vec3 baseColor = mix(dayColor, nightColor, uDayNightMix);
    
    // Lighting calculation
    vec3 normal = normalize(vNormal);
    
    // Sun/moon directional light
    float NdotL = max(dot(normal, uSunDirection), 0.0);
    
    // Softer shadows with ambient occlusion approximation
    float ao = 1.0 - slope * 0.3; // Steep slopes are darker
    
    // Day lighting
    vec3 directLight = uSunColor * uSunIntensity * NdotL;
    vec3 ambient = uAmbientColor * uAmbientIntensity * ao;
    
    // Combine lighting
    vec3 finalColor = baseColor * (directLight + ambient);
    
    // Add subtle rim lighting for depth (especially nice at sunset)
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float rimFactor = 1.0 - max(dot(viewDir, normal), 0.0);
    rimFactor = pow(rimFactor, 3.0) * 0.15;
    finalColor += uSunColor * rimFactor * (1.0 - uDayNightMix);
    
    // Snow sparkle effect during day
    if (height > snowLine && uDayNightMix < 0.5) {
      float sparkle = pow(noise(vUv * 200.0 + uTime * 0.1), 8.0);
      finalColor += vec3(sparkle * 0.3 * (1.0 - uDayNightMix * 2.0));
    }
    
    // Apply fog
    float fogFactor = 1.0 - exp(-uFogDensity * vFogDepth);
    fogFactor = clamp(fogFactor, 0.0, 1.0);
    finalColor = mix(finalColor, uFogColor, fogFactor);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/**
 * Create the terrain shader material
 * @returns {THREE.ShaderMaterial}
 */
export function createTerrainMaterial() {
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uSunDirection: { value: new THREE.Vector3(0.5, 0.7, 0.3).normalize() },
      uSunColor: { value: new THREE.Color(1.0, 0.95, 0.8) },
      uSunIntensity: { value: 1.2 },
      uAmbientColor: { value: new THREE.Color(0.4, 0.5, 0.7) },
      uAmbientIntensity: { value: 0.4 },
      uTime: { value: 0 },
      uDayNightMix: { value: 0 }, // 0 = day, 1 = night
      uFogColor: { value: new THREE.Color(0.6, 0.75, 0.9) },
      uFogDensity: { value: 0.0012 },
    },
    side: THREE.FrontSide,
  });
  
  return material;
}

/**
 * Update terrain material uniforms for day/night cycle
 * @param {THREE.ShaderMaterial} material 
 * @param {Object} params 
 */
export function updateTerrainUniforms(material, params) {
  if (params.sunDirection) {
    material.uniforms.uSunDirection.value.copy(params.sunDirection).normalize();
  }
  if (params.sunColor) {
    material.uniforms.uSunColor.value.copy(params.sunColor);
  }
  if (params.sunIntensity !== undefined) {
    material.uniforms.uSunIntensity.value = params.sunIntensity;
  }
  if (params.ambientColor) {
    material.uniforms.uAmbientColor.value.copy(params.ambientColor);
  }
  if (params.ambientIntensity !== undefined) {
    material.uniforms.uAmbientIntensity.value = params.ambientIntensity;
  }
  if (params.time !== undefined) {
    material.uniforms.uTime.value = params.time;
  }
  if (params.dayNightMix !== undefined) {
    material.uniforms.uDayNightMix.value = params.dayNightMix;
  }
  if (params.fogColor) {
    material.uniforms.uFogColor.value.copy(params.fogColor);
  }
  if (params.fogDensity !== undefined) {
    material.uniforms.uFogDensity.value = params.fogDensity;
  }
}

