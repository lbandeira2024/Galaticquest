import React, { useEffect, useRef, useState, useMemo } from 'react';
import './SpaceView.css';
import { useAudio } from './AudioManager';

const planetImageMap = {
  marte: '/images/Planets/Marte-Rotacionando.webm',
  lua: '/images/Planets/Lua.png',
  mercurio: '/images/Planets/Mercurio-Rotacionando.gif',
  venus: '/images/Planets/venus-rotacionando.webm',
  jupiter: '/images/Planets/Jupiter_Rotacionando.webm',
  proximacentauri: '/images/Planets/proximacentauri-rotacionando.gif',
  makemake: '/images/Planets/makemake-rotacionando.gif',
  ceres: '/images/Planets/ceres-rotacionando.gif',
  deimos: '/images/Planets/deimos-rotacionando.gif',
  eris: '/images/Planets/eris-rotacionando.gif',
  fobos: '/images/Planets/fobos-rotacionando.gif',
  haumea: '/images/Planets/haumea-rotacionando.gif',
  kaapa: '/images/Planets/kaapa-rotacionando.gif',
  saturno: '/images/Planets/saturno-rotacionando.webm',
  urano: '/images/Planets/Urano.png',
  netuno: '/images/Planets/Netuno-rotacionando.gif',
  plutao: '/images/Planets/Plutao-Rotacionando.gif',
  vesta: '/images/Planets/vesta-rotacionando.gif',
  io: '/images/Planets/io-rotacionando.gif',
  europa: '/images/Planets/europa-rotacionando.gif',
  calisto: '/images/Planets/calisto-rotacionando.gif',
  encelado: '/images/Planets/encelado-rotacionando.gif',
  gaminedes: '/images/Planets/gaminedes-rotacionando.gif',
  pallas: '/images/Planets/pallas-rotacionando.gif',
  Kepler_186f: '/images/Planets/kepler-rotacionando.gif',
  mimas: '/images/Planets/mimas-rotacionando.gif',
  tita: '/images/Planets/tita-rotacionando.gif',
  titania: '/images/Planets/titania-rotacionando.gif',
  oberon: '/images/Planets/oberon-rotacionando.gif',
  tritao: '/images/Planets/tritao-rotacionando.gif',
  caronte: '/images/Planets/caronte-rotacionando.gif',
  trappist: '/images/Planets/trappist-rotacionando.gif',
  acee: '/images/stations/ACEE-Rotacionando.gif',
  almaz: '/images/stations/ALMAZ-Rotacionando.gif',
  mol: '/images/stations/MOL-Rotacionando.gif',
  tiangong: '/images/stations/TIANGONG-Rotacionando.gif',
  skylab: '/images/stations/SKYLAB-Rotacionando.gif',
  salyut: '/images/stations/SALYUT-Rotacionando.gif',
  delfos: '/images/stations/DELFOS-Rotacionando.gif',
  boktok: '/images/stations/BOKTOK-Rotacionando.webm'
};

// Cores pré-definidas para evitar criação de strings no loop
const STAR_HUES = [210, 120, 30, 0, 60];

const SpaceView = ({
  distance = 225000000,
  forceLarge = false,
  isWarpActive = false,
  isPaused = false,
  selectedPlanet = { nome: 'marte' },
  isDeparting = false
}) => {
  const NORMAL_SPEED = 1.0;
  const WARP_SPEED = 80.0;

  const canvasRef = useRef(null);
  const planetContainerRef = useRef(null);
  const planetImageRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(0);

  // Refs para valores que mudam frequentemente
  const distanceRef = useRef(distance);
  const forceLargeRef = useRef(forceLarge);
  const isDepartingRef = useRef(isDeparting);

  const [planetImageLoaded, setPlanetImageLoaded] = useState(false);
  const [planetImage, setPlanetImage] = useState('');
  const [planetName, setPlanetName] = useState('marte');

  const isWarpActiveRef = useRef(isWarpActive);
  const currentStarSpeedRef = useRef(NORMAL_SPEED);
  const targetStarSpeedRef = useRef(NORMAL_SPEED);

  const velocity = useRef({ x: 0, y: 0 });
  const position = useRef({ x: 0, y: 0 });
  const starsRef = useRef([]);

  // Atualiza refs quando props mudam
  useEffect(() => { distanceRef.current = distance; }, [distance]);
  useEffect(() => { forceLargeRef.current = forceLarge; }, [forceLarge]);
  useEffect(() => { isDepartingRef.current = isDeparting; }, [isDeparting]);

  const { playTrack } = useAudio();

  // Inicializa estrelas
  useEffect(() => {
    if (starsRef.current.length === 0) {
      starsRef.current = Array.from({ length: 800 }, () => ({
        x: (Math.random() - 0.5) * window.innerWidth,
        y: (Math.random() - 0.5) * window.innerHeight,
        z: Math.random() * window.innerWidth,
        size: Math.random() * 2 + 1,
        baseSpeed: 1,
        hueIndex: Math.floor(Math.random() * 5)
      }));
    }
    const img = new Image();
    img.src = '/images/Vluz-Dobra.gif';
  }, []);

  // Fast Stars
  const fastStars = useMemo(() => {
    const starClasses = ['star-blue', 'star-green', 'star-orange', 'star-red', 'star-yellow'];
    return Array.from({ length: 80 }, (_, i) => ({
      id: `fast-star-${i}`,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 1.5}px`,
      delay: `${Math.random() * 2}s`,
      duration: `${Math.random() * 0.5 + 0.4}s`,
      dirX: (Math.random() - 0.5) * 2,
      dirY: (Math.random() - 0.5) * 2,
      opacity: Math.random() * 0.7 + 0.2,
      colorClass: starClasses[Math.floor(Math.random() * starClasses.length)]
    }));
  }, []);

  useEffect(() => {
    isWarpActiveRef.current = isWarpActive;
    targetStarSpeedRef.current = isWarpActive ? WARP_SPEED : NORMAL_SPEED;
  }, [isWarpActive]);

  useEffect(() => {
    const targetAudioSrc = isWarpActive
      ? '/sounds/04.Dobra_Espacial_Becoming_one_with_Neytiri.mp3'
      : '/sounds/02.Navigating-Flying.mp3';
    playTrack(targetAudioSrc, { loop: true, isPrimary: false });
  }, [isWarpActive, playTrack]);

  // Carregamento da Imagem
  useEffect(() => {
    let planetNameFromProps = selectedPlanet?.nome || 'marte';
    const planetNameNormalized = planetNameFromProps.toString().toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
    setPlanetName(planetNameNormalized);

    let imagePath;
    if (planetNameNormalized === 'boctok') {
      imagePath = planetImageMap['boktok'];
    } else {
      imagePath = planetImageMap[planetNameNormalized] || '/images/planets/Marte-Rotacionando.gif';
    }

    // Ao mudar o planeta, setamos loaded false para evitar glitches
    setPlanetImageLoaded(false);
    setPlanetImage(imagePath);

    if (imagePath && imagePath.endsWith('.webm')) {
      // Para vídeo, assumimos carregamento rápido
      setTimeout(() => setPlanetImageLoaded(true), 100);
    } else {
      const img = new Image();
      img.src = imagePath;
      img.onload = () => setPlanetImageLoaded(true);
      img.onerror = () => {
        setPlanetImage('/images/planets/Marte-Rotacionando.gif');
        setPlanetImageLoaded(true);
      };
    }
  }, [selectedPlanet]);

  // === LOOP DE ANIMAÇÃO ===
  useEffect(() => {
    if (isPaused) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    lastTimeRef.current = performance.now();

    const animate = (timestamp) => {
      const now = timestamp || performance.now();
      let dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      if (dt > 0.1) dt = 0.016;

      const diff = targetStarSpeedRef.current - currentStarSpeedRef.current;
      if (Math.abs(diff) < 0.1) currentStarSpeedRef.current = targetStarSpeedRef.current;
      else currentStarSpeedRef.current += diff * (dt * 5);

      const speedFactor = currentStarSpeedRef.current * 60;
      const isWarping = isWarpActiveRef.current;
      const starSpeedHigh = currentStarSpeedRef.current > 5;

      if (!isWarping) {
        const time = now * 0.0005;
        velocity.current.x = Math.sin(time) * 0.05;
        velocity.current.y = Math.cos(time * 0.8) * 0.05;
        position.current.x += velocity.current.x;
        position.current.y += velocity.current.y;
      }

      if (planetContainerRef.current) {
        // === CORREÇÃO: Removido o xOffset que jogava Júpiter para fora da tela ===
        planetContainerRef.current.style.transform = `translate(calc(-50% + ${position.current.x}px), calc(-50% + ${position.current.y}px))`;
      }

      // === LÓGICA DE OPACIDADE E ESCALA ===
      if (planetImageRef.current && planetImageLoaded && !isWarping) {
        const dist = distanceRef.current;
        const force = forceLargeRef.current;
        const departing = isDepartingRef.current;

        // 1. Controle de Opacidade
        let opacity = 0; // Padrão é INVISÍVEL

        if (departing) {
          opacity = 1; // Controlado pelo CSS .departing
        } else {
          const VIEW_DISTANCE_THRESHOLD = 50000000; // 50 milhões km
          if (dist <= VIEW_DISTANCE_THRESHOLD) {
            const fadeEnd = 40000000;
            if (dist <= fadeEnd) {
              opacity = 1;
            } else {
              // Fade out suave entre 40M e 50M km
              opacity = 1 - (dist - fadeEnd) / (VIEW_DISTANCE_THRESHOLD - fadeEnd);
            }
          }
        }
        planetImageRef.current.style.opacity = Math.max(0, Math.min(1, opacity));

        // 2. Controle de Escala
        let scale = 1.0;
        if (force) {
          scale = 2.25;
        } else {
          const MAX_DIST = 50000000;
          if (dist >= MAX_DIST) {
            scale = 0.05; // Escala mínima se longe
          } else {
            const progress = Math.max(0, 1 - (dist / MAX_DIST));
            scale = 0.05 + Math.pow(progress, 3) * 2.25;
          }
        }
        // === CORREÇÃO: Fator base normalizado para todos os planetas ===
        scale *= 1.0;

        planetImageRef.current.style.transform = `scale(${scale})`;
      }

      // Renderização das Estrelas
      ctx.fillStyle = '#000014';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const starArray = starsRef.current;
      const velX = velocity.current.x * 0.1;
      const velY = velocity.current.y * 0.1;

      for (let i = 0; i < starArray.length; i++) {
        const star = starArray[i];
        const moveDistance = (speedFactor + (star.baseSpeed || 0)) * dt;
        star.z -= moveDistance;

        if (star.z <= 0) {
          star.z = width;
          star.x = (Math.random() - 0.5) * width;
          star.y = (Math.random() - 0.5) * height;
          if (isWarping) star.hueIndex = Math.floor(Math.random() * 5);
        }

        const scale = 400 / (star.z + 1);
        let drawX = star.x;
        let drawY = star.y;

        if (!isWarping) {
          drawX += velX;
          drawY += velY;
        }

        const x = centerX + drawX * scale;
        const y = centerY + drawY * scale;

        if (x < 0 || x > width || y < 0 || y > height) continue;

        const size = scale * star.size * 0.3;

        if (starSpeedHigh) {
          const brightness = Math.min(1.0, scale * 1.5);
          ctx.fillStyle = `hsla(${STAR_HUES[star.hueIndex]}, 100%, 80%, ${brightness})`;
          ctx.fillRect(x, y, size * 1.5, size * 1.5);
        } else {
          const opacity = Math.min(1, scale * 1.5);
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.fillRect(x, y, size, size);
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isPaused, selectedPlanet, planetImageLoaded]);

  const isStation = ['acee', 'almaz', 'mol', 'tiangong', 'skylab', 'salyut', 'delfos', 'boktok', 'boctok'].includes(planetName);
  const baseSize = forceLarge ? '50vmin' : '40vmin';

  return (
    <div className={`space-view-container ${isWarpActive ? 'warp-active' : ''} ${isPaused ? 'paused' : ''}`}>
      <div className={`warp-overlay-container ${isWarpActive && !isPaused ? 'active' : ''}`}>
        <div className="tunnel-effect"></div>
        <div className="warp-horizon-constant"></div>
        <div className="warp-horizon-pulse"></div>
        <img src="/images/Vluz-Dobra.gif" alt="Dobra Espacial" className="warp-light-effect" />
        {fastStars.map(star => (
          <div key={star.id} className={`fast-star ${star.colorClass}`} style={{
            top: star.top, left: star.left,
            width: star.size, height: star.size,
            animationDelay: star.delay, animationDuration: star.duration,
            '--dir-x': star.dirX, '--dir-y': star.dirY,
            opacity: star.opacity
          }} />
        ))}
      </div>
      <canvas ref={canvasRef} className="stars"></canvas>

      <div
        ref={planetContainerRef}
        className={`planet-container ${isDeparting ? 'departing' : ''}`}
        style={{
          display: !isWarpActive && planetImageLoaded ? 'flex' : 'none',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {planetImage && planetImage.endsWith('.webm') ? (
          <video
            key={planetName} /* FIX: Garante que o elemento seja recriado ao trocar de planeta, evitando transição de tamanho */
            ref={planetImageRef}
            src={planetImage}
            className={`planet-image ${planetName}-planet ${isStation ? 'is-station' : ''}`}
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: baseSize,
              height: baseSize,
              zIndex: forceLarge ? 1000 : 10,
              objectFit: 'contain',
              transformOrigin: 'center center',
              willChange: 'transform, opacity',
              opacity: 0 /* FIX: Inicia invisível para evitar flash antes do cálculo da distância */
            }}
          />
        ) : (
          <img
            key={planetName} /* FIX: Garante que o elemento seja recriado ao trocar de planeta, evitando transição de tamanho */
            ref={planetImageRef}
            src={planetImage}
            alt={`Planet ${planetName}`}
            className={`planet-image ${planetName}-planet ${isStation ? 'is-station' : ''}`}
            style={{
              width: baseSize,
              height: baseSize,
              zIndex: forceLarge ? 1000 : 10,
              transformOrigin: 'center center',
              willChange: 'transform, opacity',
              opacity: 0 /* FIX: Inicia invisível para evitar flash antes do cálculo da distância */
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SpaceView;