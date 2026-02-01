// src/components/Planeta3D.jsx
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const Planeta3D = ({ imagem }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1000);
    camera.position.z = 2.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(200, 200); // Tamanho fixo do planeta
    mountRef.current.appendChild(renderer.domElement);

    const light = new THREE.PointLight(0xffffff, 1.5);
    light.position.set(5, 5, 5);
    scene.add(light);

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(imagem);
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const material = new THREE.MeshStandardMaterial({ map: texture });
    const planet = new THREE.Mesh(geometry, material);
    scene.add(planet);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      mountRef.current.removeChild(renderer.domElement);
    };
  }, [imagem]);

  return <div ref={mountRef} style={{ width: 200, height: 200 }} />;
};

export default Planeta3D;
