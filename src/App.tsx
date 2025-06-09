import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { cubeSVG } from 'sr-visualizer';
import { BTCube } from './code';
import '@/index.css';

const App = () => {
  // Create an instance of BTCube
  const btCubeRef = useRef<BTCube | null>(null);
  const [btCube, setBtCube] = useState<BTCube | null>(null);

  // Initialize the BTCube instance
  useEffect(() => {
    console.log('[App] Initializing BTCube instance');
    if (!btCubeRef.current) {
      const cube = new BTCube();
      console.log('[App] Created BTCube instance with ID:', (cube as any).getInstanceId?.());
      btCubeRef.current = cube;
      setBtCube(cube);

      // Test event emission from App component
      console.log('[App] Testing event emission');
      setTimeout(() => {
        if (btCubeRef.current) {
          console.log('[App] Emitting test event from App');
          btCubeRef.current.emit('cubeStateChanged', {
            facelet: 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB',
            move: 'R',
            timestamp: Date.now(),
            source: 'App',
          });
        }
      }, 1000);
    }
  }, []);
  const [count, setCount] = React.useState(0);
  const [showCount, setShowCount] = React.useState(true);
  const frontCubeRef = useRef<HTMLDivElement>();
  const backCubeRef = useRef<HTMLDivElement>();

  const [facelets, setFacelets] = useState('UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB');
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const [isConnected, setIsConnected] = useState(false);
  const [lastMove, setLastMove] = useState('');
  const [batteryLevel, setBatteryLevel] = useState(0);
  const [macAddress, setMacAddress] = useState(() => localStorage.getItem('cubeMacAddress') || '');

  // Save MAC address to local storage when it changes
  const handleMacAddressChange = (newMacAddress: string) => {
    setMacAddress(newMacAddress);
    localStorage.setItem('cubeMacAddress', newMacAddress);
  };

  // Helper function to get battery color class based on level
  const getBatteryColorClass = (level: number): string => {
    if (level > 60) return 'bg-green-500';
    if (level > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const convertCubeFormat = useCallback((cubeString: string): string => {
    const colorMap: Record<string, string> = {
      U: 'w', // Up face = white
      R: 'r', // Right face = red
      F: 'b', // Front face = blue
      D: 'y', // Down face = yellow
      L: 'o', // Left face = orange
      B: 'g', // Back face = green
    };

    return cubeString
      .split('')
      .map((face) => colorMap[face] || face)
      .join('');
  }, []);

  // Function to fetch and update battery level
  const updateBatteryLevel = () => {
    if (isConnected && btCube) {
      const cube = btCube.getCube();
      if (cube) {
        // Using type assertion to avoid TypeScript errors
        if (typeof cube.getBatteryLevel === 'function') {
          cube.getBatteryLevel()
            .then(([level, name]: [number, string]) => {
              setBatteryLevel(level);
            })
            .catch((err: Error) => console.error('Failed to get battery level:', err));
        }
      }
    }
  };

  const connect = () => {
    if (!macAddress.trim()) {
      alert('Please enter a MAC address before connecting.');
      return;
    }

    // Validate MAC address format
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(macAddress)) {
      alert('Please enter a valid MAC address in the format XX:XX:XX:XX:XX:XX');
      return;
    }

    if (!btCube) return;

    btCube.init(macAddress)
      .then(() => {
        console.log('Connected to cube');
        setIsConnected(true);
        // Get battery level immediately after connection
        updateBatteryLevel();

        // Request gyroscope data and battery level from the cube
        if (!btCube) return;
        const cube = btCube.getCube();
        if (cube) {
          // Using type assertion to avoid TypeScript errors
          const ganCube = cube as any;
          if (typeof ganCube.v2requestBattery === 'function') {
            ganCube.v2requestBattery()
              .then(() => console.log('Battery level requested'))
              .catch((err: Error) => console.error('Failed to request battery level:', err));
          }
        }
      })
      .catch((err: any) => console.error('Failed to connect:', err));
  };

  const disconnect = () => {
    if (!btCube) return;

    btCube.stop()
      .then(() => {
        console.log('Disconnected from cube');
        setIsConnected(false);
        setGyroData({ x: 0, y: 0, z: 0 });
        setLastMove('');
        setBatteryLevel(0);
      })
      .catch((err: any) => console.error('Failed to disconnect:', err));
  };

  // Set up a periodic battery level check
  useEffect(() => {
    let batteryInterval: number | null = null;

    if (isConnected) {
      // Update battery level every 30 seconds
      batteryInterval = window.setInterval(updateBatteryLevel, 30000);
    }

    return () => {
      if (batteryInterval) {
        clearInterval(batteryInterval);
      }
    };
  }, [isConnected]);

  useEffect(() => {
    // Listen for cube state changes and gyroscope data from the BTCube instance
    if (btCube) {
      console.log('[App] Setting up event listeners on BTCube instance with ID:', (btCube as any).getInstanceId?.());

      // State change listener
      const stateListener = (data: any) => {
        console.log('[App] Received cubeStateChanged event:', data);
        setFacelets(data.facelet as string);
        if (data?.move?.length <= 2) setLastMove(data.move);
      };

      // Gyroscope data listener
      const gyroListener = (data: any) => {
        console.log('[App] Received gyroData event:', data);
        setGyroData({
          x: data.x,
          y: data.y,
          z: data.z,
        });
      };

      // Register event listeners on the BTCube instance
      console.log('[App] Registering cubeStateChanged listener');
      btCube.on('cubeStateChanged', stateListener);

      console.log('[App] Registering gyroData listener');
      btCube.on('gyroData', gyroListener);

      // Test direct event emission
      setTimeout(() => {
        console.log('[App] Testing direct event emission after listeners are set up');
        btCube.emit('cubeStateChanged', {
          facelet: 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB',
          move: 'D',
          timestamp: Date.now(),
          source: 'App-after-listeners',
        });
      }, 500);

      // Clean up function to remove event listeners
      return () => {
        console.log('[App] Removing event listeners');
        btCube.off('cubeStateChanged', stateListener);
        btCube.off('gyroData', gyroListener);
      };
    }
    return undefined;
  }, [btCube]); // Dependency on btCube instance

  useEffect(() => {
    if (frontCubeRef.current) {
      frontCubeRef.current.innerHTML = '';
      cubeSVG(frontCubeRef.current, `r=x-270y-225x-20&size=300&fc=${convertCubeFormat(facelets)}` as any);
    }
  }, [frontCubeRef.current, facelets, convertCubeFormat]);

  useEffect(() => {
    if (backCubeRef.current) {
      backCubeRef.current.innerHTML = '';
      cubeSVG(backCubeRef.current, `r=x-90y-135x-20&size=300&fc=${convertCubeFormat(facelets)}` as any);
    }
  }, [backCubeRef.current, facelets, convertCubeFormat]);

  return (
    <div className="flex justify-center align-middle h-screen">
      <div className="bg-white m-auto p-10 rounded-xl w-3/4 md:w-1/2 text-center">
        <div className="underline text-5xl mb-4">GAN 356 i3 3x3</div>
        <div className="text-2xl mb-6">Bluetooth Smart Cube (Magnetic)</div>

        <div className="mb-4">
          <label htmlFor="macAddress" className="block text-lg font-medium mb-2">
            MAC Address:
            <input
              id="macAddress"
              type="text"
              value={macAddress}
              onChange={(e) => handleMacAddressChange(e.target.value)}
              placeholder="XX:XX:XX:XX:XX:XX"
              className="w-full p-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
              disabled={isConnected}
            />
          </label>
          <p className="text-sm text-gray-600 mt-1">
            Enter your cube&apos;s MAC address (format: XX:XX:XX:XX:XX:XX).
            <br />
            To find it: Go to
            {' '}
            <code className="bg-gray-100 px-1 rounded">
              chrome://bluetooth-internals/#devices
            </code>
            {' '}
            in Chrome, connect your cube, and look for the MAC address in the device list.
          </p>
        </div>

        <div className="flex justify-center m-5 gap-2">
          <button
            className={`text-2xl m-auto w-full p-5 rounded-2xl flex flex-1 ${
              isConnected
                ? 'bg-red-200 hover:bg-red-300'
                : 'bg-slate-200 hover:bg-slate-300'
            }`}
            onClick={() => {
              if (isConnected) {
                disconnect();
              } else {
                connect();
              }
            }}
          >
            <div className="w-full text-center">
              {isConnected ? 'Disconnect Cube' : 'Connect Cube'}
            </div>
          </button>
          {isConnected && (
            <button
              className="text-2xl m-auto flex-1 p-5 rounded-2xl flex bg-blue-200 hover:bg-blue-300"
              onClick={() => {
                // Set last move to None after reset
                setLastMove('None');

                if (!btCube) return;
                const cube = btCube.getCube();
                if (cube) {
                  // Using type assertion to avoid TypeScript errors
                  const ganCube = cube as any;
                  if (typeof ganCube.v2requestReset === 'function') {
                    ganCube.v2requestReset()
                      .then(() => {
                        console.log('Cube reset successful');
                        // Request updated state from the cube after reset
                        if (typeof ganCube.v2requestFacelets === 'function') {
                          return ganCube.v2requestFacelets();
                        }
                        return undefined;
                      })
                      .then(() => {
                        console.log('Cube state updated after reset');
                        // Last move is already set to "None" to indicate the reset operation
                      })
                      .catch((err: Error) => console.error('Failed to reset cube:', err));
                  }
                }
              }}
            >
              <div className="w-full text-center">
                Reset Cube Position
              </div>
            </button>
          )}
        </div>

        <div className="flex w-full cube-container">
          <div ref={frontCubeRef as any} className="flex-1" />
          <div ref={backCubeRef as any} className="flex-1" />
        </div>

        <div className="m-5 text-left">
          {isConnected && (
            <div className="mb-6 p-4 bg-slate-100 rounded-lg">
              <div className="underline text-2xl mb-3">
                Live Data:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-bold">Connection Status:</div>
                <div className="text-green-600">Connected</div>

                <div className="font-bold">MAC Address:</div>
                <div className="font-mono text-sm">{macAddress}</div>

                <div className="font-bold">Last Move:</div>
                <div>{lastMove || 'None'}</div>

                <div className="font-bold">Gyroscope X:</div>
                <div>{gyroData.x}</div>

                <div className="font-bold">Gyroscope Y:</div>
                <div>{gyroData.y}</div>

                <div className="font-bold">Gyroscope Z:</div>
                <div>{gyroData.z}</div>

                <div className="font-bold">Battery Level:</div>
                <div className="flex items-center">
                  <div className="mr-2">
                    {batteryLevel}
                    <span>%</span>
                  </div>
                  <div className="w-16 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getBatteryColorClass(batteryLevel)}`}
                      style={{ width: `${batteryLevel}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="underline text-2xl mb-3">
            Cube Features:
          </div>
          <ul className="mb-6">
            <li>○ Real-time Bluetooth connectivity</li>
            <li>○ Gyroscope for motion detection</li>
            <li>○ Move tracking and replay</li>
            <li>○ Battery level monitoring</li>
            <li>○ 3D visualization</li>
            <li>○ Reset cube position</li>
          </ul>
          <div className="underline text-2xl mb-3">
            How To Use:
          </div>
          <ol className="list-decimal ml-5 space-y-2">
            <li>
              Find your cube&apos;s MAC address by going to chrome://bluetooth-internals in Chrome,
              connecting your cube, and noting the MAC address from the device list
            </li>
            <li>Enter the MAC address in the field above (it will be saved automatically)</li>
            <li>Click &ldquo;Connect Cube&rdquo; to pair with your GAN 356 i3</li>
            <li>Once connected, the 3D model will show the current state</li>
            <li>Make moves on the physical cube to see them reflected in real-time</li>
            <li>The app tracks all moves and cube state changes</li>
            <li>Use the &ldquo;Reset Cube Position&rdquo; button to reset the cube&apos;s position when needed</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default App;
