# GAN 356 i3 3x3 Bluetooth Smart Cube - Developer Guide

This project provides an interface for connecting to and interacting with the GAN 356 i3 3x3 Bluetooth Smart Cube. Below is a guide on how to use the code.js file and its global event listeners.

## Getting Started

1. Import the giikerCube module:
```javascript
import { giikerCube } from './code.js';
```

2. Initialize the connection to the cube:
```javascript
giikerCube.init();
```

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
import { giikerCube } from './code.js';

// Get the cube instance
const cube = giikerCube.getCube();

// Log the current state
const state = cube.logCubeState();
console.log(state);
```

### Disconnecting from the Cube

To properly disconnect from the cube:

```javascript
giikerCube.stop();
```

## Example Usage in React

```jsx
import React, { useEffect, useState } from 'react';
import { giikerCube } from './code.js';

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
      giikerCube.stop();
    };
  }, []);
  
  const connectCube = () => {
    giikerCube.init()
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
- The code supports both the original GAN protocol and the newer V2 protocol
- Move notation follows standard Rubik's cube notation (U, R, F, D, L, B with ' for counterclockwise)
- The facelet representation uses the following convention:
  - U: Up face (yellow)
  - R: Right face (red)
  - F: Front face (blue)
  - D: Down face (white)
  - L: Left face (orange)
  - B: Back face (green)
