import React, { useEffect, useRef, useState, useMemo } from 'react';
import './SpaceView.css';
import { useAudio } from './AudioManager';

const planetImageMap = {
  marte: '/images/Planets/Marte-Rotacionando.webm',
  lua: '/images/Planets/lua-rotacionando.webm',
  mercurio: '/images/Planets/Mercurio-Rotacionando.webm',
  venus: '/images/Planets/venus-rotacionando.webm',
  jupiter: '/images/Planets/jupiter_rotacionando.webm',
  proximacentaurib: '/images/Planets/proximacentaurib-rotacionando.gif',
  makemake: '/images/Planets/makemake-rotacionando.gif',
  ceres: '/images/Planets/ceres-rotacionando.webm',
  deimos: '/images/Planets/deimos-rotacionando.gif',
  eris: '/images/Planets/eris-rotacionando.gif',
  fobos: '/images/Planets/fobos-rotacionando.gif',
  haumea: '/images/Planets/haumea-rotacionando.gif',
  kaapa: '/images/Planets/kaapa-rotacionando.gif',
  saturno: '/images/Planets/saturno-rotacionando.webm',
  urano: '/images/Planets/urano-rotacionando.webm',
  netuno: '/images/Planets/Netuno-rotacionando.gif',
  plutao: '/images/Planets/Plutao-Rotacionando.gif',
  vesta: '/images/Planets/vesta-rotacionando.gif',
  io: '/images/Planets/io-rotacionando.gif',
  europa: '/images/Planets/europa-rotacionando.gif',
  calisto: '/images/Planets/calisto-rotacionando.gif',
  encelado: '/images/Planets/encelado-rotacionando.gif',
  ganimedes: '/images/Planets/ganimedes-rotacionando.gif',
  pallas: '/images/Planets/pallas-rotacionando.gif',
  kepler186f: '/images/Planets/kepler-rotacionando.webm',
  mimas: '/images/Planets/mimas-rotacionando.gif',
  tita: '/images/Planets/tita-rotacionando.gif',
  titania: '/images/Planets/titania-rotacionando.gif',
  oberon: '/images/Planets/oberon-rotacionando.gif',
  tritao: '/images/Planets/tritao-rotacionando.gif',
  caronte: '/images/Planets/caronte-rotacionando.gif',
  trappist1e: '/images/Planets/trappist-rotacionando.gif',
  acee: '/images/stations/ACEE-Rotacionando.gif',
  almaz: '/images/stations/ALMAZ-Rotacionando.gif',
  mol: '/images/stations/MOL-Rotacionando.gif',
  tiangong: '/images/stations/TIANGONG-Rotacionando.gif',
  skylab: '/images/stations/SKYLAB-Rotacionando.gif',
  salyut: '/images/stations/SALYUT-Rotacionando.webm',
  delfos: '/images/stations/DELFOS-Rotacionando.gif',
  boctok: '/images/stations/BOCTOK-Rotacionando.webm'
};

const PLANET_MUSIC_CONFIG = {
  mercurio: { src: '/sounds/mercurio/mercurio.mp3', volume: 0.4 },
  marte: { src: '/sounds/marte/Marte.mp3', volume: 0.5 },
  venus: { src: '/sounds/Venus/venus.mp3', volume: 0.5 },
  lua: { src: '/sounds/lua/lua.mp3', volume: 0.5 },
  acee: { src: '/sounds/ACEE/EstacaoACEE.mp3', volume: 0.5 },
  caronte: { src: '/sounds/carote/caronte.mp3', volume: 0.5 },
  ceres: { src: '/sounds/ceres/ceres.mp3', volume: 0.5 },
  eris: { src: '/sounds/Eris/Eris.mp3', volume: 0.5 },
  haumea: { src: '/sounds/haumea/Haumea.mp3', volume: 0.5 },
  jupiter: { src: '/sounds/jupiter/jupiter.mp3', volume: 0.5 },
  kepler186f: { src: '/sounds/Kepler/kepler.mp3', volume: 0.5 },
  io: { src: '/sounds/LuasJupiter/luasJupiter.mp3', volume: 0.5 },
  europa: { src: '/sounds/LuasJupiter/luasJupiter.mp3', volume: 0.5 },
  calisto: { src: '/sounds/LuasJupiter/luasJupiter.mp3', volume: 0.5 },
  ganimedes: { src: '/sounds/LuasJupiter/luasJupiter.mp3', volume: 0.5 },
  fobos: { src: '/sounds/luasMarte/luasMarte.mp3', volume: 0.5 },
  deimos: { src: '/sounds/luasMarte/luasMarte.mp3', volume: 0.5 },
  tita: { src: '/sounds/luasSaturno/tita_.encelado_mimas.mp3', volume: 0.5 },
  encelado: { src: '/sounds/luasSaturno/tita_.encelado_mimas.mp3', volume: 0.5 },
  mimas: { src: '/sounds/luasSaturno/tita_.encelado_mimas.mp3', volume: 0.5 },
  makemake: { src: '/sounds/makemake/makemake.mp3', volume: 0.5 },
  netuno: { src: '/sounds/netuno/Netuno.mp3', volume: 0.5 },
  plutao: { src: '/sounds/Plutao/plutao.mp3', volume: 0.5 },
  proximacentaurib: { src: '/sounds/ProximaC/proximaCentauri.mp3', volume: 0.5 },
  saturno: { src: '/sounds/saturno/Saturno.mp3', volume: 0.5 },
  titania: { src: '/sounds/Titania/titaniaOberon.mp3', volume: 0.5 },
  trappist1e: { src: '/sounds/Trappist-1/Trappist-1.mp3', volume: 0.5 },
  tritao: { src: '/sounds/tritao/tritao.mp3', volume: 0.5 },
  urano: { src: '/sounds/urano/Urano.mp3', volume: 0.5 },
  vesta: { src: '/sounds/Vesta/DIMORPHOS_Vesta.mp3', volume: 0.5 },
  kepler186f: { src: '/sounds/Kepler/kepler.mp3', volume: 0.5 },
  trappist: { src: '/sounds/Trappist-1/Trappist-1.mp3', volume: 0.5 },
  caronte: { src: '/sounds/caronte/caronte.mp3', volume: 0.5 },
  oberon: { src: '/sounds/Titania/titaniaOberon.mp3', volume: 0.5 },
  pallas: { src: '/sounds/pallas/pallas.mp3', volume: 0.5 }
};

const STAR_HUES = [210, 120, 30, 0, 60];
const STAR_COLORS_HSL = STAR_HUES.map(hue => `hsl(${hue}, 100%, 80%)`);

const getPlanetScale = (planetName) => {
  // Urano removido da lista abaixo
  const giants = ['jupiter', 'saturno', 'netuno'];
  const dwarfs = ['lua', 'ceres', 'plutao', 'makemake', 'eris', 'haumea', 'vesta', 'io', 'europa', 'calisto', 'encelado', 'ganimedes', 'pallas', 'mimas', 'tita', 'titania', 'oberon', 'tritao', 'caronte', 'fobos', 'deimos', 'kaapa'];
  const stations = ['acee', 'almaz', 'mol', 'tiangong', 'skylab', 'salyut', 'delfos', 'boctok'];

  if (giants.includes(planetName)) return 1.8;
  if (dwarfs.includes(planetName)) return 0.5;
  if (stations.includes(planetName)) return 0.35;
  return 1.0; // Os planetas rochosos (e agora Urano) usarão esta escala
};

const SpaceView = ({
  distance = 225000000,
  forceLarge = false,
  isWarpActive = false,
  isPaused = false,
  selectedPlanet = { nome: 'marte' },
  isDeparting = false,
  isActive = true
}) => {
  const NORMAL_SPEED = 1.0;
  const WARP_SPEED = 80.0;

  const canvasRef = useRef(null);
  const planetContainerRef = useRef(null);
  const planetImageRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(0);

  const distanceRef = useRef(distance);
  const forceLargeRef = useRef(forceLarge);
  const isDepartingRef = useRef(isDeparting);
  const isWarpActiveRef = useRef(isWarpActive);
  const currentVisualDistanceRef = useRef(distance);

  const [planetImageLoaded, setPlanetImageLoaded] = useState(false);
  const [planetImage, setPlanetImage] = useState('');
  const [planetName, setPlanetName] = useState('marte');

  const currentStarSpeedRef = useRef(NORMAL_SPEED);
  const targetStarSpeedRef = useRef(NORMAL_SPEED);

  const velocity = useRef({ x: 0, y: 0 });
  const position = useRef({ x: 0, y: 0 });
  const starsRef = useRef([]);

  const { playTrack } = useAudio();

  useEffect(() => { distanceRef.current = distance; }, [distance]);
  useEffect(() => { forceLargeRef.current = forceLarge; }, [forceLarge]);
  useEffect(() => { isDepartingRef.current = isDeparting; }, [isDeparting]);

  useEffect(() => {
    isWarpActiveRef.current = isWarpActive;
    targetStarSpeedRef.current = isWarpActive ? WARP_SPEED : NORMAL_SPEED;
  }, [isWarpActive]);

  useEffect(() => {
    if (starsRef.current.length === 0) {
      starsRef.current = Array.from({ length: 250 }, () => ({
        x: (Math.random() - 0.5) * window.innerWidth,
        y: (Math.random() - 0.5) * window.innerHeight,
        z: Math.random() * window.innerWidth,
        size: Math.random() * 2 + 1,
        baseSpeed: 1,
        hueIndex: Math.floor(Math.random() * 5)
      }));
    }
  }, []);

  const fastStars = useMemo(() => {
    const starClasses = ['star-blue', 'star-green', 'star-orange', 'star-red', 'star-yellow'];
    return Array.from({ length: 30 }, (_, i) => ({
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

  const isNearPlanet = distance <= 1000;

  useEffect(() => {
    if (!isActive) return;

    let targetAudioSrc = '/sounds/02.Navigating-Flying.mp3';
    let targetVolume = 1.0;

    if (isWarpActive) {
      targetAudioSrc = '/sounds/04.Dobra_Espacial_Becoming_one_with_Neytiri.mp3';
      targetVolume = 1.0;
    } else if (isNearPlanet && PLANET_MUSIC_CONFIG[planetName]) {
      targetAudioSrc = PLANET_MUSIC_CONFIG[planetName].src;
      targetVolume = PLANET_MUSIC_CONFIG[planetName].volume;
    }

    playTrack(targetAudioSrc, {
      loop: true,
      isPrimary: true,
      volume: targetVolume,
      fade: true
    });
  }, [isWarpActive, isNearPlanet, planetName, playTrack, isActive]);

  useEffect(() => {
    let planetNameFromProps = selectedPlanet?.nome || 'marte';
    const planetNameNormalized = planetNameFromProps.toString().toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
    setPlanetName(planetNameNormalized);

    currentVisualDistanceRef.current = distanceRef.current;

    let imagePath = planetImageMap[planetNameNormalized] || '/images/planets/Marte-Rotacionando.gif';

    setPlanetImageLoaded(false);
    setPlanetImage(imagePath);

    if (!imagePath || !imagePath.endsWith('.webm')) {
      const img = new Image();
      img.src = imagePath;
      img.onload = () => {
        setPlanetImageLoaded(true);
        if (planetImageRef.current) planetImageRef.current.style.opacity = 0;
      };
      img.onerror = () => {
        setPlanetImage('/images/planets/Marte-Rotacionando.gif');
        setPlanetImageLoaded(true);
      };
    }
  }, [selectedPlanet?.nome]);

  useEffect(() => {
    if (isPaused || !isActive) {
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

    const planetNameNormalized = (selectedPlanet?.nome || 'marte')
      .toString()
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");
    const typeScale = getPlanetScale(planetNameNormalized);

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
        planetContainerRef.current.style.transform = `translate(calc(-50% + ${position.current.x}px), calc(-50% + ${position.current.y}px))`;
      }

      const targetDist = distanceRef.current;
      if (Math.abs(targetDist - currentVisualDistanceRef.current) > 5000000) {
        currentVisualDistanceRef.current = targetDist;
      } else {
        currentVisualDistanceRef.current += (targetDist - currentVisualDistanceRef.current) * 0.1;
      }

      if (Math.abs(targetDist - currentVisualDistanceRef.current) < 100) {
        currentVisualDistanceRef.current = targetDist;
      }

      if (planetImageRef.current && planetImageLoaded && !isWarping) {
        const visualDist = currentVisualDistanceRef.current;
        const force = forceLargeRef.current;
        const departing = isDepartingRef.current;

        let opacity = 0;
        if (departing) {
          opacity = 1;
        } else {
          const FADE_START_DIST = 100000000;
          if (visualDist <= 0) {
            opacity = 1;
          } else {
            opacity = Math.max(0, Math.min(1, 1 - (visualDist / FADE_START_DIST)));
          }
        }
        planetImageRef.current.style.opacity = opacity;

        let scale = 1.0;
        if (force) {
          scale = 2.8 * typeScale;
        } else {
          if (departing) {
            scale = Math.max(0.05, (2.5 * typeScale) / (1 + (visualDist / 100000)));
          } else {
            const MAX_SCALE = 2.8 * typeScale;
            const MIN_SCALE = 0.05;
            const OPTICAL_FACTOR = 1500000;
            scale = MAX_SCALE / (1 + (visualDist / OPTICAL_FACTOR));
            scale = Math.max(MIN_SCALE, scale);
          }
        }
        planetImageRef.current.style.transform = `scale(${scale})`;
      }

      ctx.globalAlpha = 1.0;
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
        ctx.globalAlpha = Math.min(1.0, scale * 1.5);

        if (starSpeedHigh) {
          ctx.fillStyle = STAR_COLORS_HSL[star.hueIndex];
          ctx.fillRect(x, y, size * 1.5, size * 1.5);
        } else {
          ctx.fillStyle = '#ffffff';
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
  }, [isPaused, isActive, planetImageLoaded, selectedPlanet]);

  const isStation = ['acee', 'almaz', 'mol', 'tiangong', 'skylab', 'salyut', 'delfos', 'boctok'].includes(planetName);
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
            key={planetName}
            ref={planetImageRef}
            src={planetImage}
            className={`planet-image ${planetName}-planet ${isStation ? 'is-station' : ''}`}
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={() => {
              setPlanetImageLoaded(true);
              if (planetImageRef.current) planetImageRef.current.style.opacity = 0;
            }}
            style={{
              width: baseSize,
              height: baseSize,
              zIndex: forceLarge ? 1000 : 10,
              objectFit: 'contain',
              transformOrigin: 'center center',
              willChange: 'transform, opacity'
            }}
          />
        ) : (
          <img
            key={planetName}
            ref={planetImageRef}
            src={planetImage}
            alt={`Planet ${planetName}`}
            className={`planet-image ${planetName}-planet ${isStation ? 'is-station' : ''}`}
            style={{
              width: baseSize,
              height: baseSize,
              zIndex: forceLarge ? 1000 : 10,
              transformOrigin: 'center center',
              willChange: 'transform, opacity'
            }}
          />
        )}
      </div>
    </div>
  );
};

export default React.memo(SpaceView, (prevProps, nextProps) => {
  return (
    prevProps.selectedPlanet?.nome === nextProps.selectedPlanet?.nome &&
    prevProps.isWarpActive === nextProps.isWarpActive &&
    prevProps.isPaused === nextProps.isPaused &&
    prevProps.forceLarge === nextProps.forceLarge &&
    prevProps.isDeparting === nextProps.isDeparting &&
    prevProps.distance === nextProps.distance &&
    prevProps.isActive === nextProps.isActive
  );
});