import React, { useEffect, useRef, useState, useMemo } from 'react';
import './SpaceView.css';
import { useAudio } from './AudioManager';

const planetImageMap = {
  marte: '/images/Planets/Marte-Rotacionando.webm',
  lua: '/images/Planets/lua-rotacionando.webm',
  mercurio: '/images/Planets/Mercurio-Rotacionando.webm',
  venus: '/images/Planets/venus-rotacionando.webm',
  jupiter: '/images/Planets/jupiter_rotacionando.webm',
  proximacentaurib: '/images/Planets/proximacentaurib-rotacionando.webm',
  makemake: '/images/Planets/makemake-rotacionando.webm',
  ceres: '/images/Planets/ceres-rotacionando.webm',
  deimos: '/images/Planets/deimos-rotacionando.webm',
  eris: '/images/Planets/eris-rotacionando.webm',
  fobos: '/images/Planets/fobos-rotacionando.webm',
  haumea: '/images/Planets/haumea-rotacionando.webm',
  kaapa: '/images/Planets/kaapa-rotacionando.gif',
  saturno: '/images/Planets/saturno-rotacionando.webm',
  urano: '/images/Planets/urano-rotacionando.webm',
  netuno: '/images/Planets/Netuno-rotacionando.webm',
  plutao: '/images/Planets/plutao-rotacionando.webm',
  vesta: '/images/Planets/vesta-rotacionando.webm',
  io: '/images/Planets/io-rotacionando.webm',
  europa: '/images/Planets/europa-rotacionando.webm',
  calisto: '/images/Planets/calisto-rotacionando.gif',
  encelado: '/images/Planets/encelado-rotacionando.gif',
  ganimedes: '/images/Planets/ganimedes-rotacionando.webm',
  pallas: '/images/Planets/pallas-rotacionando.webm',
  kepler186f: '/images/Planets/kepler-rotacionando.webm',
  mimas: '/images/Planets/mimas-rotacionando.gif',
  tita: '/images/Planets/tita-rotacionando.gif',
  titania: '/images/Planets/titania-rotacionando.gif',
  oberon: '/images/Planets/oberon-rotacionando.webm',
  tritao: '/images/Planets/tritao-rotacionando.gif',
  caronte: '/images/Planets/caronte-rotacionando.webm',
  trappist1e: '/images/Planets/trappist-rotacionando.webm',
  acee: '/images/stations/ACEE-Rotacionando.gif',
  almaz: '/images/stations/ALMAZ-Rotacionando.gif',
  mol: '/images/stations/MOL-Rotacionando.gif',
  tiangong: '/images/stations/TIANGONG-Rotacionando.gif',
  skylab: '/images/stations/SKYLAB-Rotacionando.gif',
  salyut: '/images/stations/SALYUT-Rotacionando.webm',
  delfos: '/images/stations/DELFOS-Rotacionando.gif',
  boctok: '/images/stations/BOCTOK-Rotacionando.webm',
  proteu: '/images/Planets/proteu-rotacionando.webm'
};

const PLANET_MUSIC_CONFIG = {
  mercurio: { src: '/sounds/mercurio/mercurio.mp3', volume: 0.4 },
  marte: { src: '/sounds/marte/Marte.mp3', volume: 0.5 },
  venus: { src: '/sounds/Venus/venus.mp3', volume: 0.5 },
  lua: { src: '/sounds/lua/lua.mp3', volume: 0.5 },
  acee: { src: '/sounds/ACEE/EstacaoACEE.mp3', volume: 0.5 },
  caronte: { src: '/sounds/caronte/caronte.mp3', volume: 0.5 },
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
  trappist: { src: '/sounds/Trappist-1/Trappist-1.mp3', volume: 0.5 },
  oberon: { src: '/sounds/Titania/titaniaOberon.mp3', volume: 0.5 },
  pallas: { src: '/sounds/pallas/pallas.mp3', volume: 0.5 },
  proteu: { src: '/sounds/proteu/tritao.mp3', volume: 0.5 }
};

const STAR_HUES = [210, 120, 30, 0, 60];
const STAR_COLORS_HSL = STAR_HUES.map(hue => `hsl(${hue}, 100%, 80%)`);

const getPlanetScale = (planetName) => {
  const giants = ['jupiter', 'saturno', 'netuno'];
  const dwarfs = ['lua', 'ceres', 'plutao', 'makemake', 'eris', 'haumea', 'vesta', 'io', 'europa', 'calisto', 'encelado', 'ganimedes', 'pallas', 'mimas', 'tita', 'titania', 'oberon', 'tritao', 'caronte', 'fobos', 'deimos', 'kaapa'];
  const stations = ['acee', 'almaz', 'mol', 'tiangong', 'skylab', 'salyut', 'delfos', 'boctok'];

  if (planetName === 'proximacentaurib') return 0.65;
  if (giants.includes(planetName)) return 1.8;
  if (dwarfs.includes(planetName)) return 0.5;
  if (stations.includes(planetName)) return 0.35;
  return 1.0;
};

const resetStar = (star, width, height, isWarping) => {
  star.x = (Math.random() - 0.5) * width;
  const yBias = Math.random() - 0.5;
  star.y = (yBias * yBias * yBias) * height * 1.0;
  star.z = width + (Math.random() * (width * 0.5));

  const isDeepSpace = Math.random() > 0.3;
  star.size = (Math.random() * 2 + 0.8) * (isDeepSpace ? 0.6 : 1);
  star.hueIndex = Math.floor(Math.random() * 5);
  star.twinkleSpeed = Math.random() * 0.05 + 0.01;
  star.twinklePhase = Math.random() * Math.PI * 2;
  star.baseAlpha = isDeepSpace ? (Math.random() * 0.3 + 0.1) : (Math.random() * 0.6 + 0.4);
  star.baseSpeed = Math.random() * 15 + 1;
  star.isFastStar = false;
};

const resetFastStar = (star, width, height) => {
  star.x = (Math.random() - 0.5) * width;
  star.y = (Math.random() - 0.5) * height;
  star.z = Math.random() * width;
  star.size = Math.random() * 2 + 1.5;
  star.hueIndex = Math.floor(Math.random() * 5);
  star.baseAlpha = Math.random() * 0.7 + 0.2;
  star.dirX = (Math.random() - 0.5) * 4;
  star.dirY = (Math.random() - 0.5) * 4;
  star.isFastStar = true;
};

const generateStar = (width, height, isWarping, isFast = false) => {
  const star = {};
  if (isFast) {
    resetFastStar(star, width, height);
  } else {
    resetStar(star, width, height, isWarping);
    star.z = Math.random() * width;
  }
  return star;
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
  const scaleWrapperRef = useRef(null);
  const planetImageRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(0);

  const distanceRef = useRef(distance);
  const forceLargeRef = useRef(forceLarge);
  const isDepartingRef = useRef(isDeparting);
  const isWarpActiveRef = useRef(isWarpActive);
  const currentVisualDistanceRef = useRef(distance);

  const isPageVisibleRef = useRef(true);

  const [planetImageLoaded, setPlanetImageLoaded] = useState(false);
  const [planetImage, setPlanetImage] = useState('');
  const [planetName, setPlanetName] = useState('marte');

  const currentStarSpeedRef = useRef(NORMAL_SPEED);
  const targetStarSpeedRef = useRef(NORMAL_SPEED);

  const velocity = useRef({ x: 0, y: 0 });
  const position = useRef({ x: 0, y: 0 });

  const starsRef = useRef([]);
  const fastStarsRef = useRef([]);

  const { playTrack } = useAudio();
  const currentTrackRef = useRef(null);

  useEffect(() => { distanceRef.current = distance; }, [distance]);
  useEffect(() => { forceLargeRef.current = forceLarge; }, [forceLarge]);
  useEffect(() => { isDepartingRef.current = isDeparting; }, [isDeparting]);

  useEffect(() => {
    isWarpActiveRef.current = isWarpActive;
    targetStarSpeedRef.current = isWarpActive ? WARP_SPEED : NORMAL_SPEED;
  }, [isWarpActive]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (starsRef.current.length === 0) {
      starsRef.current = Array.from({ length: 800 }, () => generateStar(window.innerWidth, window.innerHeight, false));
      fastStarsRef.current = Array.from({ length: 40 }, () => generateStar(window.innerWidth, window.innerHeight, false, true));
    }
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

    if (currentTrackRef.current !== targetAudioSrc) {
      playTrack(targetAudioSrc, { loop: true, isPrimary: true, volume: targetVolume, fade: true });
      currentTrackRef.current = targetAudioSrc;
    }
  }, [isWarpActive, isNearPlanet, planetName, playTrack, isActive]);

  useEffect(() => {
    let planetNameFromProps = selectedPlanet?.nome || 'marte';
    const planetNameNormalized = planetNameFromProps.toString().toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
    setPlanetName(planetNameNormalized);
    currentVisualDistanceRef.current = distanceRef.current;

    let imagePath = planetImageMap[planetNameNormalized] || '/images/Planets/Marte-Rotacionando.gif';
    setPlanetImageLoaded(false);
    setPlanetImage(imagePath);

    if (!imagePath || !imagePath.endsWith('.webm')) {
      const img = new Image();
      img.src = imagePath;
      img.onload = () => {
        setPlanetImageLoaded(true);
        if (scaleWrapperRef.current) scaleWrapperRef.current.style.opacity = 0;
      };
      img.onerror = () => {
        setPlanetImage('/images/Planets/Marte-Rotacionando.gif');
        setPlanetImageLoaded(true);
      };
    }
  }, [selectedPlanet?.nome]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let resizeTimeout;
    const resizeCanvas = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        }
      }, 200);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    lastTimeRef.current = performance.now();

    const typeScale = getPlanetScale(planetName);
    const angleRotation = -15 * (Math.PI / 180);
    const cosAngle = Math.cos(angleRotation);
    const sinAngle = Math.sin(angleRotation);

    let currentCtxAlpha = 1.0;

    const animate = (timestamp) => {
      if (isPaused || !isActive || !isPageVisibleRef.current) {
        lastTimeRef.current = timestamp || performance.now();
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const now = timestamp || performance.now();
      let dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      dt = Math.min(dt, 0.02);

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

      if (scaleWrapperRef.current && planetImageLoaded && !isWarping) {
        const visualDist = currentVisualDistanceRef.current;
        const force = forceLargeRef.current;
        const departing = isDepartingRef.current;

        let opacity = departing ? 1 : (visualDist <= 0 ? 1 : Math.max(0, Math.min(1, 1 - (visualDist / 100000000))));
        scaleWrapperRef.current.style.opacity = opacity;

        let scale = 1.0;
        if (force) {
          scale = 2.8 * typeScale;
        } else {
          scale = departing
            ? Math.max(0.05, (2.5 * typeScale) / (1 + (visualDist / 100000)))
            : Math.max(0.05, (2.8 * typeScale) / (1 + (visualDist / 1500000)));
        }

        let transformStr = `scale(${scale})`;
        if (planetName === 'proximacentaurib') {
          const offsetFactor = Math.max(0, 1 - (visualDist / 1000000));
          transformStr = `translate(${25 * offsetFactor}%, ${20 * offsetFactor}%) scale(${scale})`;
        }
        scaleWrapperRef.current.style.transform = transformStr;
      }

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const starArray = starsRef.current;
      const fastStarArray = fastStarsRef.current;
      const velX = velocity.current.x * 0.1;
      const velY = velocity.current.y * 0.1;

      if (currentCtxAlpha !== 1.0) { ctx.globalAlpha = 1.0; currentCtxAlpha = 1.0; }
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < starArray.length; i++) {
        const star = starArray[i];
        star.z -= (speedFactor + star.baseSpeed) * dt;
        star.twinklePhase += star.twinkleSpeed;

        if (star.z <= 0) resetStar(star, width, height, isWarping);

        const scale = 400 / (star.z + 1);
        let drawX = star.x;
        let drawY = star.y;

        if (!isWarping) {
          drawX += velX;
          drawY += velY;
          const rotatedX = drawX * cosAngle - drawY * sinAngle;
          const rotatedY = drawX * sinAngle + drawY * cosAngle;
          drawX = rotatedX;
          drawY = rotatedY;
        }

        const x = centerX + drawX * scale;
        const y = centerY + drawY * scale;

        if (x < 0 || x > width || y < 0 || y > height) continue;

        const size = scale * star.size * 0.3;
        const twinkleAlpha = star.baseAlpha * (0.4 + Math.abs(Math.sin(star.twinklePhase)) * 0.6);
        const targetAlpha = Math.min(1.0, scale * 1.5) * (isWarping ? 1 : twinkleAlpha);

        if (currentCtxAlpha !== targetAlpha) {
          ctx.globalAlpha = targetAlpha;
          currentCtxAlpha = targetAlpha;
        }

        if (starSpeedHigh) {
          ctx.fillStyle = STAR_COLORS_HSL[star.hueIndex];
          ctx.fillRect(x, y, size * 1.5, size * 1.5);
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, y, size, size);
        }
      }

      if (isWarping) {
        for (let i = 0; i < fastStarArray.length; i++) {
          const star = fastStarArray[i];

          star.x += star.dirX * WARP_SPEED * 0.5 * dt;
          star.y += star.dirY * WARP_SPEED * 0.5 * dt;

          const x = centerX + star.x;
          const y = centerY + star.y;

          if (x < 0 || x > width || y < 0 || y > height) {
            resetFastStar(star, width, height);
            continue;
          }

          if (currentCtxAlpha !== star.baseAlpha) {
            ctx.globalAlpha = star.baseAlpha;
            currentCtxAlpha = star.baseAlpha;
          }

          ctx.fillStyle = STAR_COLORS_HSL[star.hueIndex];
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - (star.dirX * 15), y - (star.dirY * 15));
          ctx.lineWidth = star.size;
          ctx.strokeStyle = STAR_COLORS_HSL[star.hueIndex];
          ctx.stroke();
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', resizeCanvas);
      clearTimeout(resizeTimeout);
    };
  }, [isPaused, isActive, planetImageLoaded, planetName]);

  const isStation = ['acee', 'almaz', 'mol', 'tiangong', 'skylab', 'salyut', 'delfos', 'boctok'].includes(planetName);
  const baseSize = forceLarge ? '50vmin' : '40vmin';

  return (
    <div className={`space-view-container ${isWarpActive ? 'warp-active' : ''} ${isPaused ? 'paused' : ''}`}>
      <div className="galactic-nebula"></div>

      <div className={`warp-overlay-container ${isWarpActive && !isPaused ? 'active' : ''}`}>
        <div className="tunnel-effect"></div>
        <div className="warp-horizon-constant"></div>
        <div className="warp-horizon-pulse"></div>
        <img src="/images/Vluz-Dobra.gif" alt="Dobra Espacial" className="warp-light-effect" />
      </div>

      <canvas ref={canvasRef} className="stars"></canvas>

      <div
        ref={planetContainerRef}
        className={`planet-container ${isDeparting ? 'departing' : ''}`}
        style={{
          display: !isWarpActive && planetImageLoaded ? 'flex' : 'none',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}
      >
        <div
          ref={scaleWrapperRef}
          style={{
            position: 'relative', width: baseSize, height: baseSize, display: 'flex',
            justifyContent: 'center', alignItems: 'center', willChange: 'transform, opacity',
            transformStyle: 'preserve-3d'
          }}
        >
          {planetName === 'proximacentaurib' && (
            <video src="/images/Planets/solProximaB.webm" autoPlay loop muted playsInline
              style={{
                position: 'absolute', width: '180%', height: '180%', top: '-60%', left: '-70%', opacity: 1, zIndex: 5,
                transform: 'translateZ(-20px)', filter: 'drop-shadow(0 0 80px rgba(255, 160, 50, 0.9))',
                mixBlendMode: 'screen', pointerEvents: 'none'
              }}
            />
          )}

          {planetImage && planetImage.endsWith('.webm') ? (
            <video key={planetName} ref={planetImageRef} src={planetImage}
              className={`planet-image ${planetName}-planet ${isStation ? 'is-station' : ''}`}
              autoPlay loop muted playsInline
              onLoadedData={() => {
                setPlanetImageLoaded(true);
                if (scaleWrapperRef.current) scaleWrapperRef.current.style.opacity = 0;
              }}
              style={{ width: '100%', height: '100%', zIndex: forceLarge ? 1000 : 10, objectFit: 'contain', transformOrigin: 'center center' }}
            />
          ) : (
            <img key={planetName} ref={planetImageRef} src={planetImage} alt={`Planet ${planetName}`}
              className={`planet-image ${planetName}-planet ${isStation ? 'is-station' : ''}`}
              style={{ width: '100%', height: '100%', zIndex: forceLarge ? 1000 : 10, transformOrigin: 'center center' }}
            />
          )}
        </div>
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