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
    giikerCube.init();
  };

  useEffect(() => {
    const listener = (e: any) => {
      setFacelets(e.detail.facelet as string);
    };
    window.addEventListener('cubeStateChanged' as any, listener);

    return () => window.removeEventListener('cubeStateChanged' as any, listener);
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
        <div className="underline text-5xl">Hello World</div>
        <div className="flex justify-center m-5">
          <button className="text-2xl m-auto w-full bg-slate-200 hover:bg-slate-300 p-5 rounded-2xl flex" onClick={() => connect()}>
            <div className="w-full text-center">
              Connect
            </div>
          </button>
        </div>
        <div className="flex w-full cube-container">
          <div ref={frontCubeRef as any} className="flex-1" />
          <div ref={backCubeRef as any} className="flex-1" />
        </div>

        <div className="m-5 text-left">
          <div className="underline text-2xl mb-3">
            This Template Uses:
          </div>
          <ul>
            <li>○ Yarn</li>
            <li>○ Typescript</li>
            <li>○ React</li>
            <li>○ Tailwind</li>
            <li>○ Absolute Paths (@/components/MyComponent)</li>
            <li>○ Vite</li>
            <li>○ Github Pages, For Easy Deployment</li>
            <li>○ Eslint</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default App;
