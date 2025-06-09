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
- [ ] Stop using window events and instead use a custom event emitter
- [ ] Fix the glitchy Gyro data
- [ ] Web interface needs to grab the battery data sooner
- [ ] EsLint + prettier need to be configured here
- [ ] Convert mathlib over to typescript + use a class instead

## How to spin up the example
Simply run `pnpm i` and `pnpm dev` to start the example app (chrome does not like localhost having bluetooth permissions, so I dev with a HTTPS CloudFlare tunnel, using `cloudflared tunnel --url http://localhost:3000`)

## Global Event Listeners

The code.js file dispatches several custom events that you can listen for in your application:

### 1. cubeStateChanged

This event is fired whenever the cube state changes (after a move is made). It provides detailed information about the current state of the cube.

```javascript
window.addEventListener('cubeStateChanged', (event) => {
  const { facelet, move, corners, edges, timestamp } = event.detail;
  
  // facelet: String representation of the cube state (e.g., "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB")
  // move: The move that was just performed (e.g., "R'")
  // corners: Array representing the corner pieces
  // edges: Array representing the edge pieces
  // timestamp: Time when the move was made
  
  console.log('Cube state changed:', facelet);
  console.log('Move performed:', move);
});
```

### 2. gyroData

This event provides gyroscope data from the cube, which can be used to detect cube orientation and motion.

```javascript
window.addEventListener('gyroData', (event) => {
  const { x, y, z, timestamp } = event.detail;
  
  // x, y, z: Gyroscope readings for each axis
  // timestamp: Time when the data was captured
  
  console.log('Gyroscope data:', { x, y, z });
});
```

### 3. move

This event is fired when a move is made on the cube, providing the move notation and timing information.

```javascript
window.addEventListener('move', (event) => {
  const { move, time } = event.detail;
  
  // move: The move that was performed (e.g., "R'")
  // time: Time taken to perform the move
  
  console.log('Move detected:', move, 'Time:', time);
});
```

### 4. cubeSolved

This event is fired when the cube is solved.

```javascript
window.addEventListener('cubeSolved', () => {
  console.log('Cube solved!');
  // Trigger celebration or next steps
});
```

### 5. unSolved

This event is fired when the cube is in an unsolved state.

```javascript
window.addEventListener('unSolved', () => {
  console.log('Cube is not solved');
});
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
import React, { useEffect, useState } from 'react';
import { btCube } from './code.js';

function CubeApp() {
  const [cubeState, setCubeState] = useState('');
  const [lastMove, setLastMove] = useState('');
  const [isSolved, setIsSolved] = useState(false);
  
  useEffect(() => {
    // Listen for cube state changes
    const handleStateChange = (e) => {
      setCubeState(e.detail.facelet);
      setLastMove(e.detail.move);
    };
    
    // Listen for solved state
    const handleSolved = () => {
      setIsSolved(true);
    };
    
    // Listen for unsolved state
    const handleUnsolved = () => {
      setIsSolved(false);
    };
    
    window.addEventListener('cubeStateChanged', handleStateChange);
    window.addEventListener('cubeSolved', handleSolved);
    window.addEventListener('unSolved', handleUnsolved);
    
    return () => {
      window.removeEventListener('cubeStateChanged', handleStateChange);
      window.removeEventListener('cubeSolved', handleSolved);
      window.removeEventListener('unSolved', handleUnsolved);
      
      // Disconnect from cube when component unmounts
      btCube.stop();
    };
  }, []);
  
  const connectCube = () => {
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
