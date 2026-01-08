# Alpine Terrain - Procedural Mountains

An interactive 3D WebGL visualization of European Alps-style mountain terrain with real-time day/night cycle transitions.

## Features

- **Procedural Terrain Generation** - Mountains are generated using multi-octave Simplex noise with fractal Brownian motion (FBM) and ridged noise for realistic alpine ridges
- **Realistic Terrain Coloring** - Custom GLSL shaders blend colors based on altitude and slope:
  - Green grass in valleys
  - Dry alpine grass at mid elevations  
  - Rocky gray on steep slopes
  - Snow-capped peaks
- **Dynamic Day/Night Cycle** - Press Space to toggle between day and night with smooth 2.5 second transitions
- **Atmospheric Sky** - Gradient sky dome with sun/moon positioning and twinkling stars at night
- **Interactive Camera** - Orbit controls with damping for cinematic exploration
- **Fog & Atmosphere** - Distance fog that adapts to time of day

## Controls

| Input | Action |
|-------|--------|
| Mouse Drag | Rotate camera around terrain |
| Mouse Scroll | Zoom in/out |
| Spacebar | Toggle day/night cycle |

## Tech Stack

- **Three.js** (r160+) - 3D WebGL rendering
- **Vite** - Fast development server with HMR
- **Custom GLSL Shaders** - Terrain and sky materials
- **simplex-noise** - Procedural noise generation

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The development server runs at `http://localhost:3000`

## Project Structure

```
src/
├── main.js              # Application entry point
├── scene/
│   └── SceneManager.js  # Three.js scene setup
├── terrain/
│   ├── TerrainGenerator.js  # Procedural mesh generation
│   └── terrainShader.js     # Custom GLSL shaders
├── lighting/
│   ├── DayNightCycle.js     # Time-of-day controller
│   └── Sky.js               # Atmospheric sky dome
├── controls/
│   └── InputHandler.js      # Keyboard input
└── utils/
    └── noise.js             # Simplex noise utilities
```

## License

MIT
