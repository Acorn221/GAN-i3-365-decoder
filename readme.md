# Rubik's Cube Bluetooth Library

This library provides an interface for connecting to and interacting with Bluetooth-enabled Rubik's cubes, specifically the GAN 356 i3 3x3 Bluetooth Smart Cube. It allows you to track moves, monitor cube state, and receive gyroscope data. The package is fully minified for optimal performance and minimal size.

> [!NOTE]
> Credit to [CSTimer](https://github.com/cs0x7f/cstimer) for the original code that this project is based on. It has been refactored and made more modular for easier use.

## Installation

```bash
npm install gan-i360-bluetooth
```

## Getting Started

### Using the BTCube class

```javascript
import { BTCube } from 'gan-i360-bluetooth';

// Create a new BTCube instance
const btCube = new BTCube();

// Initialize the connection to the cube
btCube.init()
  .then(() => console.log('Connected to cube'))
  .catch(err => console.error('Failed to connect:', err));

// Set a callback for cube state changes
btCube.setCallback((state, moves, timestamps, deviceName) => {
  console.log('Cube state:', state);
  console.log('Moves:', moves);
  console.log('Device:', deviceName);
});

// Disconnect from the cube when done
btCube.stop();
```

### Direct access to GanCube

```javascript
import { GanCube } from 'gan-i360-bluetooth';

// Create a new GanCube instance
const ganCube = new GanCube();

// The GanCube class is typically used through BTCube,
// but can be accessed directly for advanced usage
```

## TODO
- [x] Stop using window events and instead use a custom event emitter
- [ ] Fix the glitchy Gyro data
- [ ] Web interface needs to grab the battery data sooner
- [ ] EsLint + prettier need to be configured here
- [ ] Convert mathlib over to typescript + use a class instead

## How to spin up the example
Simply run `pnpm i` and `pnpm dev` to start the example app (chrome does not like localhost having bluetooth permissions, so I dev with a HTTPS CloudFlare tunnel, using `cloudflared tunnel --url http://localhost:3000`)

## Class-Based Event System

The library uses an object-oriented event system where each cube instance emits its own events. This replaces the previous window-based events with a more encapsulated approach.

### Using the Event System

```javascript
import { BTCube } from 'gan-i360-bluetooth';

// Create a cube instance
const btCube = new BTCube();

// Listen for cube state changes
btCube.on('cubeStateChanged', (data) => {
  const { facelet, move, corners, edges, timestamp } = data;
  
  // facelet: String representation of the cube state (e.g., "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB")
  // move: The move that was just performed (e.g., "R'")
  // corners: Array representing the corner pieces
  // edges: Array representing the edge pieces
  // timestamp: Time when the move was made
  
  console.log('Cube state changed:', facelet);
  console.log('Move performed:', move);
});

// Listen for gyroscope data
btCube.on('gyroData', (data) => {
  const { x, y, z, timestamp } = data;
  
  // x, y, z: Gyroscope readings for each axis
  // timestamp: Time when the data was captured
  
  console.log('Gyroscope data:', { x, y, z });
});

// Listen for move events
btCube.on('move', (data) => {
  const { move, time } = data;
  
  // move: The move that was performed (e.g., "R'")
  // time: Time taken to perform the move
  
  console.log('Move detected:', move, 'Time:', time);
});

// Listen for solved state
btCube.on('cubeSolved', () => {
  console.log('Cube solved!');
  // Trigger celebration or next steps
});

// Listen for unsolved state
btCube.on('unSolved', () => {
  console.log('Cube is not solved');
});

// Remove event listeners when done
btCube.off('cubeStateChanged', yourListenerFunction);

// Or clear all listeners
btCube.clearAllListeners();
```

## Useful Methods

### Logging Cube State

You can manually log the current state of the cube:

```javascript
// Import the GanCube module if needed
import { btCube } from './code.js';

// Get the cube instance
const cube = btCube.getCube();

// Log the current state
const state = cube.logCubeState();
console.log(state);
```

### Disconnecting from the Cube

To properly disconnect from the cube:

```javascript
btCube.stop();
```

## Example Usage in React

```jsx
import React, { useEffect, useState, useRef } from 'react';
import { BTCube } from 'gan-i360-bluetooth';

function CubeApp() {
  const btCubeRef = useRef(null);
  const [btCube, setBtCube] = useState(null);
  const [cubeState, setCubeState] = useState('');
  const [lastMove, setLastMove] = useState('');
  const [isSolved, setIsSolved] = useState(false);
  
  // Initialize the cube instance
  useEffect(() => {
    if (!btCubeRef.current) {
      btCubeRef.current = new BTCube();
      setBtCube(btCubeRef.current);
    }
    
    return () => {
      // Disconnect from cube when component unmounts
      if (btCubeRef.current) {
        btCubeRef.current.stop();
      }
    };
  }, []);
  
  // Set up event listeners
  useEffect(() => {
    if (!btCube) return;
    
    // Listen for cube state changes
    const handleStateChange = (data) => {
      setCubeState(data.facelet);
      if (data.move?.length <= 2) {
        setLastMove(data.move);
      }
    };
    
    // Listen for solved state
    const handleSolved = () => {
      setIsSolved(true);
    };
    
    // Listen for unsolved state
    const handleUnsolved = () => {
      setIsSolved(false);
    };
    
    // Register event listeners on the BTCube instance
    btCube.on('cubeStateChanged', handleStateChange);
    btCube.on('cubeSolved', handleSolved);
    btCube.on('unSolved', handleUnsolved);
    
    return () => {
      // Remove event listeners when component unmounts
      btCube.off('cubeStateChanged', handleStateChange);
      btCube.off('cubeSolved', handleSolved);
      btCube.off('unSolved', handleUnsolved);
    };
  }, [btCube]);
  
  const connectCube = () => {
    if (!btCube) return;
    
    btCube.init()
      .then(() => console.log('Connected to cube'))
      .catch(err => console.error('Failed to connect:', err));
  };
  
  return (
    <div>
      <button onClick={connectCube}>Connect to Cube</button>
      <div>Cube State: {cubeState}</div>
      <div>Last Move: {lastMove}</div>
      <div>Solved: {isSolved ? 'Yes' : 'No'}</div>
    </div>
  );
}
```

## Technical Notes

- The cube communicates using Bluetooth Low Energy (BLE)
- This has only been tested on the "GAN V2 protocol"
- Move notation follows standard Rubik's cube notation (U, R, F, D, L, B with ' for counterclockwise)
- The facelet representation uses the following convention:
  - U: Up face (yellow)
  - R: Right face (red)
  - F: Front face (blue)
  - D: Down face (white)
  - L: Left face (orange)
  - B: Back face (green)

## Publishing

If you're maintaining this package, here's how to publish a new version:

1. Update the version in package.json
2. Build the library:
   ```bash
   pnpm run build:lib
   ```
3. Publish to npm:
   ```bash
   npm publish
   ```

## License

This project is licensed under the MIT License.
