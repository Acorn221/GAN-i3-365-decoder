import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { cubeSVG } from 'sr-visualizer';
import { giikerCube } from './code.js';
import '@/index.css';

const App = () => {
  const [count, setCount] = React.useState(0);
  const [showCount, setShowCount] = React.useState(true);
  const frontCubeRef = useRef<HTMLDivElement>();
  const backCubeRef = useRef<HTMLDivElement>();

  const [facelets, setFacelets] = useState('UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB');
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const [isConnected, setIsConnected] = useState(false);
  const [lastMove, setLastMove] = useState('');

  const convertCubeFormat = useCallback((cubeString: string): string => {
    const colorMap: Record<string, string> = {
      U: 'y', // Up face = yellow
      R: 'r', // Right face = red
      F: 'b', // Front face = blue
      D: 'w', // Down face = white
      L: 'o', // Left face = orange
      B: 'g', // Back face = green
    };

    return cubeString
      .split('')
      .map((face) => colorMap[face] || face)
      .join('');
  }, []);

  const connect = () => {
    giikerCube.init()
      .then(() => {
        console.log('Connected to cube');
        setIsConnected(true);
      })
      .catch((err) => console.error('Failed to connect:', err));
  };

  useEffect(() => {
    // Listen for cube state changes
    const stateListener = (e: any) => {
      setFacelets(e.detail.facelet as string);
      setLastMove(e.detail.move as string);
    };

    // Listen for gyroscope data
    const gyroListener = (e: any) => {
      setGyroData({
        x: e.detail.x,
        y: e.detail.y,
        z: e.detail.z,
      });
    };

    window.addEventListener('cubeStateChanged' as any, stateListener);
    window.addEventListener('gyroData' as any, gyroListener);

    return () => {
      window.removeEventListener('cubeStateChanged' as any, stateListener);
      window.removeEventListener('gyroData' as any, gyroListener);
    };
  }, []);

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
        <div className="flex justify-center m-5">
          <button className="text-2xl m-auto w-full bg-slate-200 hover:bg-slate-300 p-5 rounded-2xl flex" onClick={() => connect()}>
            <div className="w-full text-center">
              Connect Cube
            </div>
          </button>
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

                <div className="font-bold">Last Move:</div>
                <div>{lastMove || 'None'}</div>

                <div className="font-bold">Gyroscope X:</div>
                <div>{gyroData.x}</div>

                <div className="font-bold">Gyroscope Y:</div>
                <div>{gyroData.y}</div>

                <div className="font-bold">Gyroscope Z:</div>
                <div>{gyroData.z}</div>
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
          </ul>
          <div className="underline text-2xl mb-3">
            How To Use:
          </div>
          <ol className="list-decimal ml-5 space-y-2">
            <li>Click &ldquo;Connect Cube&rdquo; to pair with your GAN 356 i3</li>
            <li>Once connected, the 3D model will show the current state</li>
            <li>Make moves on the physical cube to see them reflected in real-time</li>
            <li>The app tracks all moves and cube state changes</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default App;
