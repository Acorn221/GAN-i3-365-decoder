import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { cubePNG, cubeSVG } from 'sr-visualizer';
import { giikerCube } from './code.js';
import '@/index.css';

const App = () => {
  const cubeFront = useRef<HTMLDivElement>();
  // const cubeBack = useRef<HTMLDivElement>();
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

  const connect = useCallback(() => {
    giikerCube.init();
  }, []);

  useEffect(() => {
    const listener = (e: any) => {
      setFacelets(e.detail.facelet as string);
    };
    window.addEventListener('cubeStateChanged' as any, listener);

    return () => window.removeEventListener('cubeStateChanged' as any, listener);
  }, []);

  useEffect(() => {
    if (cubeFront.current) {
      cubeFront.current.innerHTML = '';
      cubePNG(cubeFront.current, `r=x-90y-135x-20&size=300&fc=${convertCubeFormat(facelets)}` as any);
    }
  }, [cubeFront.current, facelets, convertCubeFormat]);

  // useEffect(() => {
  //   if (cubeBack.current) {
  //     cubeBack.current.innerHTML = '';
  //     cubeSVG(cubeBack.current, `r=x-270y-225x-20&size=300&fc=${convertCubeFormat(facelets)}` as any);
  //   }
  // }, [cubeBack.current, facelets, convertCubeFormat]);

  return (
    <div className="flex justify-center align-middle h-screen">
      <div className="bg-white m-auto p-10 rounded-xl w-3/4 md:w-1/2 text-center">
        <div className="underline text-5xl">Hello World</div>
        <div className="flex justify-center m-5">
          <button className="text-2xl m-auto w-full bg-slate-200 hover:bg-slate-300 p-5 rounded-2xl flex text-center" onClick={() => connect()}>
            Connect
          </button>
        </div>
        {/* <div className="h-64 grid grid-cols-2"> */}
        <div ref={cubeFront.current as any} />
        {/* <div ref={cubeBack.current as any} /> */}
        {/* </div> */}
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
