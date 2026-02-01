import React, { useState, useRef, useEffect } from 'react';
import './StellarMap.css';

const StellarMap = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedBody, setSelectedBody] = useState(null);
  const [stars, setStars] = useState([]);
  const [asteroids, setAsteroids] = useState([]);
  const [meteors, setMeteors] = useState([]);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [confirmedRoute, setConfirmedRoute] = useState(null);
  const [waveAnimation, setWaveAnimation] = useState(false);
  const [showRouteInfo, setShowRouteInfo] = useState(false);
  const containerRef = useRef(null);

  // Updated distances including all bodies (millions of km)
  const realDistances = {
    "Sol": 0,
    "Mercúrio": 57.9,
    "Vênus": 108.2,
    "Terra": 149.6,
    "Marte": 227.9,
    "Ceres": 413.7,
    "Júpiter": 778.3,
    "Saturno": 1427,
    "Urano": 2871,
    "Netuno": 4498,
    "Plutão": 5906,
    "Haumea": 6484,
    "Makemake": 6785,
    "Éris": 10125,
    "Lua": 0.384,
    "Fobos": 0.009,
    "Deimos": 0.023,
    "Io": 0.421,
    "Europa": 0.670,
    "Ganímedes": 1.07,
    "Calisto": 1.88,
    "Titã": 1.221,
    "Encélado": 0.238,
    "Mimas": 0.185,
    "Titânia": 0.436,
    "Oberon": 0.583,
    "Tritão": 0.354,
    "Caronte": 0.019,
    "Proxima Centauri b": 40230,
    "TRAPPIST-1e": 39140,
    "Kepler-186f": 49200,
    "ACEE": 0.564 // Distância fictícia para a estação espacial
  };

  useEffect(() => {
    const newStars = [];
    for (let i = 0; i < 500; i++) {
      newStars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 0.3 + Math.random() * 3,
        opacity: 0.1 + Math.random() * 0.9,
        delay: Math.random() * 10,
        duration: 3 + Math.random() * 7
      });
    }
    setStars(newStars);
    generateAsteroids();
    setMeteors(generateMeteorClusters());
  }, []);

  const generateAsteroids = () => {
    const newAsteroids = [];
    const asteroidCount = 100 + Math.floor(Math.random() * 100);
    for (let i = 0; i < asteroidCount; i++) {
      newAsteroids.push({
        id: i,
        x: 60 + Math.random() * 40,
        y: Math.random() * 100,
        size: 0.5 + Math.random() * 4,
        speed: 0.2 + Math.random() * 3,
        angle: Math.random() * 360,
        rotationSpeed: 0.01 + Math.random() * 0.1,
        rotation: Math.random() * 360
      });
    }
    setAsteroids(newAsteroids);
  };

  const solarSystem = {
    sun: {
      name: "Sol",
      radius: 50,
      color: "#ff6d00",
      x: 50,
      y: 50,
      rotationSpeed: 0
    },
    planets: [
      // Inner planets
      { name: "Mercúrio", radius: 8, color: "#b5b5b5", orbitRadius: 20, orbitSpeed: 0.0047 * 5, rotationSpeed: 0.0006, angle: 0, moons: [] },
      { name: "Vênus", radius: 12, color: "#e6c229", orbitRadius: 30, orbitSpeed: 0.0035 * 5, rotationSpeed: 0.0002, angle: 45, moons: [] },
      {
        name: "Terra", radius: 13, color: "#3498db", orbitRadius: 40, orbitSpeed: 0.0029 * 5, rotationSpeed: 0.006, angle: 90,
        moons: [{ name: "Lua", radius: 4, orbitRadius: 8, orbitSpeed: 0.0029 * 5, rotationSpeed: 0.0002, angle: 0 }]
      },
      {
        name: "ACEE",
        radius: 6,
        color: "#a020f0", // púrpura
        orbitRadius: 42,
        orbitSpeed: 0.003 * 5,
        rotationSpeed: 0,
        angle: 110,
        moons: [],
        isStation: true // Flag para impedir rotas
      },
      {
        name: "Marte", radius: 10, color: "#e74c3c", orbitRadius: 50, orbitSpeed: 0.0024 * 5, rotationSpeed: 0.006, angle: 135,
        moons: [
          { name: "Fobos", radius: 2.5, orbitRadius: 5, orbitSpeed: 0.03 * 5, rotationSpeed: 0.03, angle: 0 },
          { name: "Deimos", radius: 2, orbitRadius: 6, orbitSpeed: 0.01 * 5, rotationSpeed: 0.01, angle: 180 }
        ]
      },

      // Asteroid belt
      { name: "Ceres", radius: 5, color: "#aaa", orbitRadius: 60, orbitSpeed: 0.0018 * 5, rotationSpeed: 0.001, angle: 0, isDwarfPlanet: true, moons: [] },
      { name: "Vesta", radius: 4.5, color: "#bbb", orbitRadius: 62, orbitSpeed: 0.0017 * 5, rotationSpeed: 0.001, angle: 120, moons: [] },
      { name: "Pallas", radius: 4.5, color: "#ccc", orbitRadius: 64, orbitSpeed: 0.0016 * 5, rotationSpeed: 0.001, angle: 240, moons: [] },
      { name: "Cinturão", radius: 0, color: "transparent", orbitRadius: 65, orbitSpeed: 0, rotationSpeed: 0, angle: 0, isAsteroidBelt: true, moons: [] },

      // Gas giants
      {
        name: "Júpiter", radius: 28, color: "#f1c40f", orbitRadius: 80, orbitSpeed: 0.0013 * 5, rotationSpeed: 0.025, angle: 180,
        moons: [
          { name: "Io", radius: 4, orbitRadius: 12, orbitSpeed: 0.0008 * 5, rotationSpeed: 0.0008, angle: 0 },
          { name: "Europa", radius: 3.5, orbitRadius: 13, orbitSpeed: 0.0007 * 5, rotationSpeed: 0.0007, angle: 90 },
          { name: "Ganímedes", radius: 5, orbitRadius: 15, orbitSpeed: 0.0004 * 5, rotationSpeed: 0.0004, angle: 180 },
          { name: "Calisto", radius: 4.5, orbitRadius: 16, orbitSpeed: 0.0003 * 5, rotationSpeed: 0.0003, angle: 270 }
        ]
      },
      {
        name: "Saturno", radius: 24, color: "#f39c12", orbitRadius: 100, orbitSpeed: 0.00096 * 5, rotationSpeed: 0.022, angle: 225,
        moons: [
          { name: "Titã", radius: 5, orbitRadius: 18, orbitSpeed: 0.0003 * 5, rotationSpeed: 0.0003, angle: 0 },
          { name: "Encélado", radius: 3, orbitRadius: 14, orbitSpeed: 0.0005 * 5, rotationSpeed: 0.0005, angle: 120 },
          { name: "Mimas", radius: 2.5, orbitRadius: 12, orbitSpeed: 0.0007 * 5, rotationSpeed: 0.0007, angle: 240 }
        ],
        hasRings: true
      },
      {
        name: "Urano", radius: 18, color: "#1abc9c", orbitRadius: 120, orbitSpeed: 0.00068 * 5, rotationSpeed: 0.015, angle: 270,
        moons: [
          { name: "Titânia", radius: 4, orbitRadius: 15, orbitSpeed: 0.0002 * 5, rotationSpeed: 0.0002, angle: 0 },
          { name: "Oberon", radius: 3.8, orbitRadius: 16, orbitSpeed: 0.00018 * 5, rotationSpeed: 0.00018, angle: 180 }
        ]
      },
      {
        name: "Netuno", radius: 18, color: "#3498db", orbitRadius: 140, orbitSpeed: 0.00054 * 5, rotationSpeed: 0.016, angle: 315,
        moons: [
          { name: "Tritão", radius: 4.2, orbitRadius: 14, orbitSpeed: 0.00015 * 5, rotationSpeed: 0.00015, angle: 0 },
          { name: "Proteu", radius: 2.5, orbitRadius: 12, orbitSpeed: 0.00025 * 5, rotationSpeed: 0.00025, angle: 90 }
        ]
      },

      // Trans-Neptunian objects
      {
        name: "Plutão", radius: 5, color: "#d7bde2", orbitRadius: 150, orbitSpeed: 0.0004 * 5, rotationSpeed: 0.0008, angle: 0, isDwarfPlanet: true,
        moons: [
          { name: "Caronte", radius: 2.5, orbitRadius: 8, orbitSpeed: 0.0004 * 5, rotationSpeed: 0.0004, angle: 0 }
        ]
      },
      { name: "Haumea", radius: 4, color: "#aed6f1", orbitRadius: 155, orbitSpeed: 0.00035 * 5, rotationSpeed: 0.001, angle: 60, isDwarfPlanet: true, moons: [] },
      { name: "Makemake", radius: 4, color: "#f9e79f", orbitRadius: 158, orbitSpeed: 0.0003 * 5, rotationSpeed: 0.0008, angle: 120, isDwarfPlanet: true, moons: [] },
      { name: "Éris", radius: 5.5, color: "#d5dbdb", orbitRadius: 165, orbitSpeed: 0.00025 * 5, rotationSpeed: 0.0006, angle: 180, isDwarfPlanet: true, moons: [] },

      // Kuiper belt
      { name: "Kuiper", radius: 0, color: "transparent", orbitRadius: 170, orbitSpeed: 0, rotationSpeed: 0, angle: 0, isKuiperBelt: true, moons: [] },

      // Exoplanets (not to scale)
      { name: "Proxima Centauri b", radius: 10, color: "#e74c3c", orbitRadius: 200, orbitSpeed: 0.0001 * 5, rotationSpeed: 0.0005, angle: 0, isExoplanet: true, moons: [] },
      { name: "TRAPPIST-1e", radius: 9, color: "#3498db", orbitRadius: 210, orbitSpeed: 0.00009 * 5, rotationSpeed: 0.0006, angle: 90, isExoplanet: true, moons: [] },
      { name: "Kepler-186f", radius: 8, color: "#2ecc71", orbitRadius: 220, orbitSpeed: 0.00008 * 5, rotationSpeed: 0.0004, angle: 180, isExoplanet: true, moons: [] }
    ]
  };

  const generateMeteorClusters = () => {
    const planetsWithMeteors = solarSystem.planets.filter(p =>
      !["Sol", "Terra", "Lua", "Marte", "Mercúrio", "Vênus", "Ceres", "Vesta", "Pallas", "Plutão"].includes(p.name)
    );

    const newMeteors = [];

    planetsWithMeteors.forEach((planet, i) => {
      const clusterSize = 5 + Math.floor(Math.random() * 5);
      for (let j = 0; j < clusterSize; j++) {
        const angleOffset = Math.random() * 360;
        newMeteors.push({
          id: `m-${i}-${j}-${Date.now()}`,
          planetName: planet.name,
          orbitRadius: planet.orbitRadius + 3 + Math.random() * 5,
          angle: angleOffset,
          orbitSpeed: 0.002 + Math.random() * 0.002,
          size: 1 + Math.random() * 1.5,
        });
      }
    });

    return newMeteors;
  };

  useEffect(() => {
    const asteroidInterval = setInterval(() => {
      setAsteroids(prevAsteroids =>
        prevAsteroids.map(a => ({
          ...a,
          y: (a.y + a.speed) % 100,
          rotation: (a.rotation + a.rotationSpeed) % 360,
          x: a.x + (Math.sin(a.angle) * 0.2)
        }))
      );
      if (Math.random() < 0.05) {
        generateAsteroids();
      }
    }, 50);
    return () => clearInterval(asteroidInterval);
  }, []);

  useEffect(() => {
    const meteorInterval = setInterval(() => {
      setMeteors(prev =>
        prev.map(m => ({
          ...m,
          angle: (m.angle + m.orbitSpeed * 360) % 360
        }))
      );
    }, 50);
    return () => clearInterval(meteorInterval);
  }, []);

  const [rotationAngles, setRotationAngles] = useState({});

  const updateAngles = () => {
    const newRotationAngles = {};
    solarSystem.planets.forEach(planet => {
      if (planet.orbitSpeed > 0) planet.angle = (planet.angle + planet.orbitSpeed) % 360;
      if (planet.rotationSpeed > 0) {
        newRotationAngles[planet.name] = (rotationAngles[planet.name] || 0) + planet.rotationSpeed;
      }

      planet.moons.forEach(moon => {
        moon.angle = (moon.angle + moon.orbitSpeed) % 360;
        if (moon.name === "Lua") {
          newRotationAngles[moon.name] = moon.angle * 50;
        } else {
          newRotationAngles[moon.name] = (rotationAngles[moon.name] || 0) + moon.rotationSpeed;
        }
      });
    });
    setRotationAngles(newRotationAngles);
  };

  useEffect(() => {
    const interval = setInterval(updateAngles, 50);
    return () => clearInterval(interval);
  }, [rotationAngles]);

  const getTransferOptions = (selectedBody) => {
    if (selectedBody.name === "ACEE" || selectedBody.isStation) return [];


    // Definir as opções específicas para a Terra
    if (selectedBody.name === "Terra") {
      return [
        {
          type: 'direct',
          destination: "Lua",
          distance: Math.round(realDistances["Lua"] * 1e6),
          fuel: 'Baixo'
        },
        {
          type: 'hohmann',
          destination: "Mercúrio",
          distance: Math.round(Math.abs(realDistances["Mercúrio"] - realDistances["Terra"]) * 1e6),
          fuel: 'Moderado'
        },
        {
          type: 'hohmann',
          destination: "Vênus",
          distance: Math.round(Math.abs(realDistances["Vênus"] - realDistances["Terra"]) * 1e6),
          fuel: 'Moderado'
        },
        {
          type: 'hohmann',
          destination: "Marte",
          distance: Math.round(Math.abs(realDistances["Marte"] - realDistances["Terra"]) * 1e6),
          fuel: 'Moderado'
        }
      ];
    }
    // Regra fixa: se origem for Marte, permitir transferência direta para ACEE
    if (selectedBody.name === "Marte") {
      const options = [
        {
          type: 'direct',
          destination: "ACEE",
          distance: 564000,
          fuel: 'Baixo'
        }
      ];

      // Se quiser manter as outras opções para Marte, pode incluir abaixo:
      const extraOptions = [
        {
          type: 'hohmann',
          destination: "Ceres",
          distance: Math.round(Math.abs(realDistances["Ceres"] - realDistances["Marte"]) * 1e6),
          fuel: 'Alto'
        },
        {
          type: 'direct',
          destination: "Fobos",
          distance: Math.round(realDistances["Fobos"] * 1e6),
          fuel: 'Baixo'
        },
        {
          type: 'direct',
          destination: "Deimos",
          distance: Math.round(realDistances["Deimos"] * 1e6),
          fuel: 'Baixo'
        }
      ];
      return [...options, ...extraOptions];
    }

    const options = [];
    const currentOrbit = selectedBody.orbitRadius || 0;

    if (selectedBody.moons && selectedBody.moons.length > 0) {
      selectedBody.moons.forEach(moon => {
        options.push({
          type: 'direct',
          destination: moon.name,
          distance: Math.round(realDistances[moon.name] * 1e6),
          fuel: 'Baixo'
        });
      });
    }

    const planets = solarSystem.planets.filter(p => !p.isAsteroidBelt && !p.isKuiperBelt);
    const currentIndex = planets.findIndex(p => p.name === selectedBody.name);

    if (currentIndex > 0) {
      const innerPlanet = planets[currentIndex - 1];
      const distance = Math.abs(realDistances[innerPlanet.name] - realDistances[selectedBody.name]) * 1e6;
      options.push({
        type: 'hohmann',
        destination: innerPlanet.name,
        distance: Math.round(distance),
        fuel: distance < 100e6 ? 'Moderado' : 'Alto'
      });
    }

    if (currentIndex < planets.length - 1 && currentIndex >= 0) {
      const outerPlanet = planets[currentIndex + 1];
      const distance = Math.abs(realDistances[outerPlanet.name] - realDistances[selectedBody.name]) * 1e6;
      options.push({
        type: 'hohmann',
        destination: outerPlanet.name,
        distance: Math.round(distance),
        fuel: distance < 100e6 ? 'Moderado' : 'Alto'
      });
    }

    if (currentIndex >= 0 && currentIndex < planets.length - 2) {
      const distantPlanet = planets[currentIndex + 2];
      const distance = Math.abs(realDistances[distantPlanet.name] - realDistances[selectedBody.name]) * 1e6;
      options.push({
        type: 'gravity-assist',
        destination: distantPlanet.name,
        distance: Math.round(distance),
        fuel: 'Muito Alto'
      });
    }

    const parentPlanet = solarSystem.planets.find(p =>
      p.moons.some(m => m.name === selectedBody.name)
    );
    if (parentPlanet) {
      options.push({
        type: 'direct',
        destination: parentPlanet.name,
        distance: Math.round(realDistances[selectedBody.name] * 1e6),
        fuel: 'Baixo'
      });
    }

    // Ordenar por distância (menor primeiro) e retornar apenas as 4 primeiras
    return options
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 4);
  };

  const handleTransferSelect = (transfer) => {
    setSelectedTransfer(transfer);
    setShowTransferModal(true);
  };

  const calculateRotationAngle = () => {
    if (!confirmedRoute) return 0;

    const originBody = solarSystem.planets.find(p => p.name === confirmedRoute.origin) ||
      solarSystem.planets.flatMap(p => p.moons).find(m => m.name === confirmedRoute.origin) ||
      solarSystem.sun;

    const destinationBody = solarSystem.planets.find(p => p.name === confirmedRoute.destination) ||
      solarSystem.planets.flatMap(p => p.moons).find(m => m.name === confirmedRoute.destination);

    if (!originBody || !destinationBody) return 0;

    const originX = solarSystem.sun.x + Math.cos(originBody.angle) * (originBody.orbitRadius || 0);
    const originY = solarSystem.sun.y + Math.sin(originBody.angle) * (originBody.orbitRadius || 0);

    const destinationX = solarSystem.sun.x + Math.cos(destinationBody.angle) * destinationBody.orbitRadius;
    const destinationY = solarSystem.sun.y + Math.sin(destinationBody.angle) * destinationBody.orbitRadius;

    const angleRad = Math.atan2(destinationY - originY, destinationX - originX);
    return angleRad * (180 / Math.PI) + 90;
  };

  const handleConfirmTransfer = () => {
    const audio = new Audio('/sounds/03.system-selection.mp3');
    audio.play();

    setConfirmedRoute({
      ...selectedTransfer,
      origin: selectedBody.name
    });
    setWaveAnimation(true);
    setShowRouteInfo(true);
    setShowTransferModal(false); // Fechar o modal após confirmação
    setIsEditMode(false); // Resetar o modo de edição
  };

  useEffect(() => {
    if (confirmedRoute) {
      const originBody = solarSystem.planets.find(p => p.name === confirmedRoute.origin) ||
        solarSystem.planets.flatMap(p => p.moons).find(m => m.name === confirmedRoute.origin) ||
        solarSystem.sun;

      const destinationBody = solarSystem.planets.find(p => p.name === confirmedRoute.destination) ||
        solarSystem.planets.flatMap(p => p.moons).find(m => m.name === confirmedRoute.destination);

      if (originBody && destinationBody) {
        const originX = solarSystem.sun.x + Math.cos(originBody.angle) * (originBody.orbitRadius || 0);
        const originY = solarSystem.sun.y + Math.sin(originBody.angle) * (originBody.orbitRadius || 0);

        const destinationX = solarSystem.sun.x + Math.cos(destinationBody.angle) * destinationBody.orbitRadius;
        const destinationY = solarSystem.sun.y + Math.sin(destinationBody.angle) * destinationBody.orbitRadius;

        const midX = originX + (destinationX - originX) * 0.6;
        const midY = originY + (destinationY - originY) * 0.6;

        const iconContainer = document.querySelector('.artemis-icon-container');
        if (iconContainer) {
          iconContainer.style.left = `${midX}%`;
          iconContainer.style.top = `${midY}%`;
        }
      }
    }
  }, [confirmedRoute, rotationAngles]);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prevZoom => Math.min(Math.max(prevZoom * delta, 0.3), 8));
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, position]);

  return (
    <div className="stellar-map" ref={containerRef} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
      <div className="star-field">
        {stars.map(star => (
          <div key={`star-${star.id}`} className="star" style={{
            left: `${star.x}%`, top: `${star.y}%`, width: `${star.size}px`, height: `${star.size}px`,
            opacity: star.opacity, animationDelay: `${star.delay}s`, animationDuration: `${star.duration}s`
          }} />
        ))}
      </div>

      <div className="grid-3d"></div>

      {asteroids.map(asteroid => (
        <div key={`asteroid-${asteroid.id}`} className="asteroid" style={{
          left: `${asteroid.x}%`, top: `${asteroid.y}%`,
          width: `${asteroid.size}px`, height: `${asteroid.size}px`,
          transform: `translate(-50%, -50%) rotate(${asteroid.rotation}deg)`
        }} />
      ))}

      <div className="solar-system" style={{
        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${zoom})`,
        transition: isDragging ? 'none' : 'transform 0.3s ease'
      }}>
        <div className="celestial-body sun" style={{
          width: `${solarSystem.sun.radius}px`, height: `${solarSystem.sun.radius}px`,
          left: `${solarSystem.sun.x}%`, top: `${solarSystem.sun.y}%`
        }} onClick={() => setSelectedBody(solarSystem.sun)}>
          <div className="sun-fire"></div>
          <div className="sun-core"></div>
          <div className="sun-corona"></div>
          <span className="body-label">{solarSystem.sun.name}</span>
        </div>

        {solarSystem.planets.map((planet, index) => {
          const planetX = solarSystem.sun.x + Math.cos(planet.angle) * planet.orbitRadius;
          const planetY = solarSystem.sun.y + Math.sin(planet.angle) * planet.orbitRadius;

          return (
            <React.Fragment key={index}>
              <div className={`orbit ${planet.isAsteroidBelt ? 'asteroid-belt' : ''} ${planet.isKuiperBelt ? 'kuiper-belt' : ''}`} style={{
                width: `${planet.orbitRadius * 2}%`, height: `${planet.orbitRadius * 2}%`,
                left: `${solarSystem.sun.x}%`, top: `${solarSystem.sun.y}%`
              }}></div>

              {planet.radius > 0 && (
                <div className={`celestial-body planet 
                    ${planet.isExoplanet ? 'isExoplanet' : ''} 
                    ${planet.isDwarfPlanet ? 'dwarf-planet' : ''}
                    ${planet.isStation ? 'station' : ''}`}
                  style={{
                    width: `${planet.radius}px`, height: `${planet.radius}px`,
                    left: `${planetX}%`, top: `${planetY}%`,
                    background: planet.color,
                    transform: `
                      translate(-50%, -50%) 
                      rotate(${rotationAngles[planet.name] || 0}deg)
                    `,
                    boxShadow: `0 0 15px ${planet.color}`
                  }} onClick={() => setSelectedBody(planet)}>
                  {planet.hasRings && (
                    <div className="planet-rings" style={{
                      width: `${planet.radius * 2.5}px`,
                      height: `${planet.radius * 0.6}px`
                    }}></div>
                  )}

                  <div style={{
                    position: 'absolute',
                    left: '100%',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    transformStyle: 'preserve-3d'
                  }}>
                    <span className={`body-label 
                        ${planet.isExoplanet ? 'exoplanet-label' : ''}
                        ${planet.isDwarfPlanet ? 'dwarf-planet-label' : ''}`}>
                      {planet.name}
                    </span>
                  </div>

                  {planet.moons.map((moon, moonIndex) => {
                    const moonX = planetX + Math.cos(moon.angle) * moon.orbitRadius;
                    const moonY = planetY + Math.sin(moon.angle) * moon.orbitRadius;
                    return (
                      <div key={moonIndex} className="celestial-body moon" style={{
                        width: `${moon.radius}px`, height: `${moon.radius}px`,
                        left: `${moonX}%`, top: `${moonY}%`,
                        transform: `translate(-50%, -50%) rotate(${rotationAngles[moon.name] || 0}deg)`
                      }} onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBody(moon);
                      }}>
                        <div style={{
                          position: 'absolute',
                          left: '100%',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          transformStyle: 'preserve-3d'
                        }}>
                          <span className="body-label">{moon.name}</span>
                        </div>
                      </div>
                    );
                  })}

                  {meteors
                    .filter(m => m.planetName === planet.name)
                    .map(m => {
                      const mx = solarSystem.sun.x + Math.cos((m.angle * Math.PI) / 180) * m.orbitRadius;
                      const my = solarSystem.sun.y + Math.sin((m.angle * Math.PI) / 180) * m.orbitRadius;
                      return (
                        <div key={m.id} className="asteroid" style={{
                          left: `${mx}%`, top: `${my}%`,
                          width: `${m.size}px`, height: `${m.size}px`,
                          transform: `translate(-50%, -50%)`, opacity: 0.6,
                          background: 'linear-gradient(45deg, #aaa, #888)'
                        }} />
                      );
                    })}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {showRouteInfo && confirmedRoute && (
        <div className="route-info-panel">
          <h3>Rota de Transferência Atual</h3>
          <div className="route-visualization-container">
            <div className="route-origin">
              <div className="route-point-label">Origem</div>
              <div className="route-point-name">{confirmedRoute.origin}</div>
            </div>
            <div className="route-line">
              <div className="dotted-line"></div>
              <div className="artemis-icon-container">
                <img
                  src="/images/naves/Artemis1.ico"
                  alt="Artemis"
                  className="artemis-icon"
                  style={{
                    transform: `rotate(${calculateRotationAngle()}deg)`
                  }}
                />
                {waveAnimation && (
                  <>
                    <div className="wave-effect wave-1"></div>
                    <div className="wave-effect wave-2"></div>
                    <div className="wave-effect wave-3"></div>
                  </>
                )}
              </div>
            </div>
            <div className="route-destination">
              <div className="route-point-label">Destino</div>
              <div className="route-point-name">{confirmedRoute.destination}</div>
            </div>
          </div>
        </div>
      )}

      {selectedBody && (
        <div className="info-panel">
          <div className="info-panel-header">
            <h3>{selectedBody.name}</h3>
            <button className="close-button" onClick={() => setSelectedBody(null)}>×</button>
          </div>

          <div className="info-section">
            <h4 className="section-title">Informações Gerais</h4>
            <div className="info-row">
              <span className="info-label">Tipo:</span>
              <span className="info-value">
                {selectedBody.name === "Sol" ? "Estrela Tipo G" :
                  selectedBody.isAsteroidBelt ? "Cinturão de Asteroides" :
                    selectedBody.isKuiperBelt ? "Cinturão de Kuiper" :
                      selectedBody.isDwarfPlanet ? "Planeta Anão" :
                        selectedBody.isStation ? "Estação Espacial" :
                          selectedBody.radius < 5 ? "Lua" : "Planeta"}
              </span>
            </div>
            {selectedBody.orbitRadius && (
              <div className="info-row">
                <span className="info-label">Distância do Sol:</span>
                <span className="info-value">{(selectedBody.orbitRadius / 10).toFixed(1)} UA</span>
              </div>
            )}
            {selectedBody.orbitSpeed && (
              <div className="info-row">
                <span className="info-label">Velocidade orbital:</span>
                <span className="info-value">{(selectedBody.orbitSpeed * 10000).toFixed(2)} km/s</span>
              </div>
            )}
            {selectedBody.rotationSpeed && (
              <div className="info-row">
                <span className="info-label">Rotação:</span>
                <span className="info-value">{(Math.abs(selectedBody.rotationSpeed) * 10000).toFixed(2)} km/s</span>
              </div>
            )}
            {selectedBody.name === "Venus" && (
              <div className="info-row">
                <span className="info-label">Rotação:</span>
                <span className="info-value">Retrógrada</span>
              </div>
            )}
            {selectedBody.name === "Urano" && (
              <div className="info-row">
                <span className="info-label">Inclinação axial:</span>
                <span className="info-value">98°</span>
              </div>
            )}
          </div>

          <div className="info-section">
            <h4 className="section-title">Mapa de Transferência Orbital</h4>
            <div className="transfer-legend">
              <div className="legend-item">
                <div className="legend-color direct"></div>
                <span>Transferência direta (ex: Terra → Lua)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color hohmann"></div>
                <span>Transferência de Hohmann (ex: Terra → Marte)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color gravity-assist"></div>
                <span>Assistência gravitacional (ex: Júpiter → Saturno)</span>
              </div>
            </div>
            <div className="transfer-map">
              {getTransferOptions(selectedBody).length > 0 ? (
                <>
                  {getTransferOptions(selectedBody).map((option, index) => (
                    <div key={index} className={`transfer-route ${option.type}`} onClick={() => handleTransferSelect(option)}>
                      <div className="transfer-info">
                        <div className="transfer-destination-group">
                          <span className="transfer-label">Destino:</span>
                          <span className="transfer-destination">{option.destination}</span>
                        </div>
                        <div className="transfer-distance-group">
                          <span className="transfer-label">Distância:</span>
                          <span className="transfer-distance">{option.distance.toLocaleString()} km</span>
                        </div>
                        <div className="transfer-fuel-group">
                          <span className="transfer-label">Combustível:</span>
                          <span className="transfer-fuel">{option.fuel}</span>
                        </div>
                      </div>
                      <div className="transfer-line"></div>
                    </div>
                  ))}
                  {getTransferOptions(selectedBody).length === 4 && (
                    <p className="no-routes" style={{ fontSize: '10px', color: '#aaa', textAlign: 'center' }}>
                      Mostrando as 4 rotas mais próximas. Selecione um destino para detalhes.
                    </p>
                  )}
                </>
              ) : (
                <p className="no-routes">Nenhuma rota de transferência disponível</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showTransferModal && (
        <div className="transfer-confirm-modal">
          <div className="modal-content">
            <h3>Confirmar rota de transferência para {selectedTransfer.destination}</h3>
            <div className="modal-buttons">
              <button
                className="confirm-button"
                onClick={handleConfirmTransfer}
              >
                Confirmar
              </button>
              <button
                className="cancel-button"
                onClick={() => {
                  setShowTransferModal(false);
                  setConfirmedRoute(null);
                  setShowRouteInfo(false);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="zoom-controls">
        <button onClick={() => setZoom(prev => Math.min(prev * 1.2, 8))}>+</button>
        <button onClick={() => setZoom(prev => Math.max(prev / 1.2, 0.3))}>-</button>
        <button onClick={() => {
          setZoom(1);
          setPosition({ x: 0, y: 0 });
        }}>⟲</button>
      </div>
    </div>
  );
};

export default StellarMap;