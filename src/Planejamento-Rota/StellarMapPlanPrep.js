import React, { useState, useRef, useEffect } from 'react';
import './StellarMapPlanPrep.css';
import transferDistances from './fixed_transfer_distances.json';

const StellarMapPlanPrep = ({ onRouteComplete, onRouteReset }) => {

    const [userId, setUserId] = useState(null); // << Adicionar
    const [isEditing, setIsEditing] = useState(false);
    const [routeConfirmed, setRouteConfirmed] = useState(false);
    const [currentLocation, setCurrentLocation] = useState("Marte"); // Estado da posição atual
    const calculatePercentage = (value, max) => Math.min(Math.round((value / max) * 100), 100);
    const MAX_FOOD = 30 * 360 * 36; // 30 items/day * 120 days (12 months)
    const MAX_OXYGEN = 200000 * 1 * 10; // 200000 kg por 1 ano para 1 pessoa
    const OXYGEN_PER_PERSON_PER_DAY = 0.84; // kg
    const CREW_SIZE = 10; // 10 people
    const FOOD_PER_KM = 30; // 30 items per km per day
    const MAX_FUEL = 9800; // Maximum fuel limit 9800 indicado
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
    const [selectedRoute, setSelectedRoute] = useState([]);
    const [plannedRoute, setPlannedRoute] = useState({
        distance: 0,
        fuel: 0,
        steps: []
    });

    const handleConfirmOrEdit = () => {
        if (!isEditing) { // Modo "Confirmar"
            if (plannedRoute.steps.length < 2) return; // Precisa de origem e destino
            setIsEditing(true);
            setRouteConfirmed(true);
            savePlannedRoute(plannedRoute); // Salva a rota
            if (onRouteComplete) onRouteComplete(plannedRoute);
        } else { // Modo "Editar" (libera a edição)
            setIsEditing(false);
            setRouteConfirmed(false);
            if (onRouteReset) onRouteReset();
        }
    };

    const containerRef = useRef(null);

    const realDistances = {
        "Sol": 0,
        "Mercurio": 57.9,
        "Venus": 108.2,
        "Terra": 149.6,
        "Marte": 227.9,
        "Ceres": 413.7,
        "Jupiter": 778.3,
        "Saturno": 1427,
        "Urano": 2871,
        "Netuno": 4498,
        "Plutao": 5906,
        "Haumea": 6484,
        "Makemake": 6785,
        "Eris": 10125,
        "Lua": 0.384,
        "Fobos": 0.009,
        "Deimos": 0.023,
        "Io": 0.421,
        "Europa": 0.670,
        "Ganímedes": 1.07,
        "Calisto": 1.88,
        "Titã": 1.221,
        "Encelado": 0.238,
        "Mimas": 0.185,
        "Titania": 0.436,
        "Oberon": 0.583,
        "Tritao": 0.354,
        "Caronte": 0.019,
        "Proxima Centauri b": 40230,
        "TRAPPIST-1e": 39140,
        "Kepler-186f": 49200,
        "ACEE": 0.564
    };

    useEffect(() => {
        const storedUser = JSON.parse(sessionStorage.getItem('user')); // Use sessionStorage
        if (storedUser && storedUser._id) {
            setUserId(storedUser._id);
        }
    }, []);

    useEffect(() => {
        if (!userId) return;
        const fetchUserData = async () => {
            try {
                const response = await fetch(`http://localhost:5000/${userId}/game-data`);
                const data = await response.json();
                if (data.success && data.rotaPlanejada && data.rotaPlanejada.length > 0) {
                    // (Lógica idêntica à do StellarMapPlan.js para calcular e setar o estado)
                    const totalDistance = data.rotaPlanejada.reduce((sum, step) => sum + (step.distance || 0), 0);
                    const totalFuel = data.rotaPlanejada.reduce((sum, step) => sum + (step.fuel || 0), 0);
                    // ... etc ...
                    setPlannedRoute({
                        // ... setar todos os campos ...
                    });
                    setIsEditing(true); // Bloqueia para edição
                    setRouteConfirmed(true);
                }
            } catch (error) {
                console.error("StellarMapPlanPrep: Erro ao buscar dados:", error);
            }
        };
        fetchUserData();
    }, [userId]);

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

    const savePlannedRoute = async (routeToSave) => {
        if (!userId) return;
        try {
            await fetch('http://localhost:5000/save-planned-route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, routeSteps: routeToSave.steps }),
            });
        } catch (error) {
            console.error("Erro ao salvar rota em Prep:", error);
        }
    };


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
    const getDistanceFromJSON = (from, to) => {

        // Padroniza os nomes para coincidir com as chaves do JSON
        const formatName = (name) => name.replace(/ /g, '_').replace(/-/g, '_');

        const key1 = `${formatName(from)}_${formatName(to)}`;
        const key2 = `${formatName(to)}_${formatName(from)}`;

        if (transferDistances[key1]) return transferDistances[key1];
        if (transferDistances[key2]) return transferDistances[key2];

        // Fallback para cálculo aproximado se não encontrar no JSON
        console.warn(`Distância não encontrada no JSON para ${from} -> ${to}`);
        const distanceFrom = realDistances[from] || 0;
        const distanceTo = realDistances[to] || 0;
        return Math.abs(distanceFrom - distanceTo) * 1e6;
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
            { name: "Mercurio", radius: 8, color: "#b5b5b5", orbitRadius: 20, orbitSpeed: 0.0047 * 5, rotationSpeed: 0.0006, angle: 0, moons: [] },
            { name: "Venus", radius: 12, color: "#e6c229", orbitRadius: 30, orbitSpeed: 0.0035 * 5, rotationSpeed: 0.0002, angle: 45, moons: [] },
            {
                name: "Terra", radius: 13, color: "#3498db", orbitRadius: 40, orbitSpeed: 0.0029 * 5, rotationSpeed: 0.006, angle: 90,
                moons: [{ name: "Lua", radius: 4, orbitRadius: 8, orbitSpeed: 0.0029 * 5, rotationSpeed: 0.0002, angle: 0 }]
            },
            {
                name: "ACEE",
                radius: 6,
                color: "#a020f0",
                orbitRadius: 42,
                orbitSpeed: 0.003 * 5,
                rotationSpeed: 0,
                angle: 110,
                moons: [],
                isStation: true
            },
            {
                name: "Marte", radius: 10, color: "#e74c3c", orbitRadius: 50, orbitSpeed: 0.0024 * 5, rotationSpeed: 0.006, angle: 135,
                moons: [
                    { name: "Fobos", radius: 2.5, orbitRadius: 5, orbitSpeed: 0.03 * 5, rotationSpeed: 0.03, angle: 0 },
                    { name: "Deimos", radius: 2, orbitRadius: 6, orbitSpeed: 0.01 * 5, rotationSpeed: 0.01, angle: 180 }
                ]
            },
            { name: "Ceres", radius: 5, color: "#aaa", orbitRadius: 60, orbitSpeed: 0.0018 * 5, rotationSpeed: 0.001, angle: 0, isDwarfPlanet: true, moons: [] },
            { name: "Vesta", radius: 4.5, color: "#bbb", orbitRadius: 62, orbitSpeed: 0.0017 * 5, rotationSpeed: 0.001, angle: 120, moons: [] },
            { name: "Pallas", radius: 4.5, color: "#ccc", orbitRadius: 64, orbitSpeed: 0.0016 * 5, rotationSpeed: 0.001, angle: 240, moons: [] },
            { name: "Cinturão", radius: 0, color: "transparent", orbitRadius: 65, orbitSpeed: 0, rotationSpeed: 0, angle: 0, isAsteroidBelt: true, moons: [] },
            {
                name: "Jupiter", radius: 28, color: "#f1c40f", orbitRadius: 80, orbitSpeed: 0.0013 * 5, rotationSpeed: 0.025, angle: 180,
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
                    { name: "Encelado", radius: 3, orbitRadius: 14, orbitSpeed: 0.0005 * 5, rotationSpeed: 0.0005, angle: 120 },
                    { name: "Mimas", radius: 2.5, orbitRadius: 12, orbitSpeed: 0.0007 * 5, rotationSpeed: 0.0007, angle: 240 }
                ],
                hasRings: true
            },
            {
                name: "Urano", radius: 18, color: "#1abc9c", orbitRadius: 120, orbitSpeed: 0.00068 * 5, rotationSpeed: 0.015, angle: 270,
                moons: [
                    { name: "Titania", radius: 4, orbitRadius: 15, orbitSpeed: 0.0002 * 5, rotationSpeed: 0.0002, angle: 0 },
                    { name: "Oberon", radius: 3.8, orbitRadius: 16, orbitSpeed: 0.00018 * 5, rotationSpeed: 0.00018, angle: 180 }
                ]
            },
            {
                name: "Netuno", radius: 18, color: "#3498db", orbitRadius: 140, orbitSpeed: 0.00054 * 5, rotationSpeed: 0.016, angle: 315,
                moons: [
                    { name: "Tritao", radius: 4.2, orbitRadius: 14, orbitSpeed: 0.00015 * 5, rotationSpeed: 0.00015, angle: 0 },
                    { name: "Proteu", radius: 2.5, orbitRadius: 12, orbitSpeed: 0.00025 * 5, rotationSpeed: 0.00025, angle: 90 }
                ]
            },
            {
                name: "Plutao", radius: 5, color: "#d7bde2", orbitRadius: 150, orbitSpeed: 0.0004 * 5, rotationSpeed: 0.0008, angle: 0, isDwarfPlanet: true,
                moons: [
                    { name: "Caronte", radius: 2.5, orbitRadius: 8, orbitSpeed: 0.0004 * 5, rotationSpeed: 0.0004, angle: 0 }
                ]
            },
            { name: "Haumea", radius: 4, color: "#aed6f1", orbitRadius: 155, orbitSpeed: 0.00035 * 5, rotationSpeed: 0.001, angle: 60, isDwarfPlanet: true, moons: [] },
            { name: "Makemake", radius: 4, color: "#f9e79f", orbitRadius: 158, orbitSpeed: 0.0003 * 5, rotationSpeed: 0.0008, angle: 120, isDwarfPlanet: true, moons: [] },
            { name: "Eris", radius: 5.5, color: "#d5dbdb", orbitRadius: 165, orbitSpeed: 0.00025 * 5, rotationSpeed: 0.0006, angle: 180, isDwarfPlanet: true, moons: [] },
            { name: "Kuiper", radius: 0, color: "transparent", orbitRadius: 170, orbitSpeed: 0, rotationSpeed: 0, angle: 0, isKuiperBelt: true, moons: [] },
            { name: "Proxima Centauri b", radius: 10, color: "#e74c3c", orbitRadius: 200, orbitSpeed: 0.0001 * 5, rotationSpeed: 0.0005, angle: 0, isExoplanet: true, moons: [] },
            { name: "TRAPPIST-1e", radius: 9, color: "#3498db", orbitRadius: 210, orbitSpeed: 0.00009 * 5, rotationSpeed: 0.0006, angle: 90, isExoplanet: true, moons: [] },
            { name: "Kepler-186f", radius: 8, color: "#2ecc71", orbitRadius: 220, orbitSpeed: 0.00008 * 5, rotationSpeed: 0.0004, angle: 180, isExoplanet: true, moons: [] }
        ]
    };

    const generateMeteorClusters = () => {
        const planetsWithMeteors = solarSystem.planets.filter(p =>
            !["Sol", "Terra", "Lua", "Marte", "Mercurio", "Venus", "Ceres", "Vesta", "Pallas", "Plutao"].includes(p.name)
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

    // Função para estimar o combustível necessário
    const estimateFuel = (distance, transferType) => {
        // Ajuste os multiplicadores conforme necessário
        const fuelFactors = {
            'direct': 0.5,    // Menos combustível para órbitas diretas
            'hohmann': 1.0,   // Combustível padrão para transferência de Hohmann
            'gravity-assist': 1.8 // Mais combustível para assistência gravitacional
        };

        // Base de 1L para cada 5000km (ajuste conforme necessário)
        const baseFuel = distance / 5000;
        return Math.round(baseFuel * fuelFactors[transferType]);
    };

    const getTransferOptions = (selectedBody) => {
        if (selectedBody.name === "Sol" || selectedBody.name === "ACEE") {
            return [];
        }

        // Caso especial para Terra
        if (selectedBody.name === "Terra") {
            const options = [];

            // 1. Adicionar Lua (se existir)
            if (selectedBody.moons && selectedBody.moons.length > 0) {
                selectedBody.moons.forEach(moon => {
                    const distance = getDistanceFromJSON("Terra", moon.name);
                    options.push({
                        type: 'direct',
                        destination: moon.name,
                        distance: distance,
                        fuel: estimateFuel(distance, 'direct')
                    });
                });
            }

            // 2. Adicionar Mercurio (estação espacial)
            const acee = solarSystem.planets.find(p => p.name === "Mercurio");
            if (acee) {
                const distance = getDistanceFromJSON("Terra", "Mercurio");
                options.push({
                    type: 'hohmann',
                    destination: "Mercurio",
                    distance: distance,
                    fuel: estimateFuel(distance, 'hohmann')
                });
            }

            // 3. Adicionar planetas adjacentes (Mercúrio e Marte)
            const planetsInOrder = solarSystem.planets
                .filter(p => !p.isAsteroidBelt && !p.isKuiperBelt && !p.isStation)
                .sort((a, b) => a.orbitRadius - b.orbitRadius);

            const earthIndex = planetsInOrder.findIndex(p => p.name === "Terra");

            // Mercúrio (planeta interior)
            if (earthIndex > 0) {
                const mercury = planetsInOrder[earthIndex - 1];
                const distance = getDistanceFromJSON("Terra", mercury.name);
                options.push({
                    type: 'hohmann',
                    destination: mercury.name,
                    distance: distance,
                    fuel: estimateFuel(distance, 'hohmann')
                });
            }

            // Marte (planeta exterior)
            if (earthIndex < planetsInOrder.length - 1) {
                const mars = planetsInOrder[earthIndex + 1];
                const distance = getDistanceFromJSON("Terra", mars.name);
                options.push({
                    type: 'hohmann',
                    destination: mars.name,
                    distance: distance,
                    fuel: estimateFuel(distance, 'hohmann')
                });
            }

            return options;
        }

        // Função para calcular a distância entre dois corpos em km
        const calculateDistance = (body1, body2) => {
            // Cria a chave para buscar no JSON (formato "Body1_Body2")
            const key1 = `${body1.name}_${body2.name}`.replace(/ /g, '_');
            const key2 = `${body2.name}_${body1.name}`.replace(/ /g, '_');

            // Tenta encontrar a distância em qualquer ordem
            if (transferDistances[key1]) {
                return transferDistances[key1];
            }
            if (transferDistances[key2]) {
                return transferDistances[key2];
            }

            // Fallback para o cálculo original se não encontrar no JSON
            if (body1.name === "Sol") return realDistances[body2.name] * 1e6;
            if (body2.name === "Sol") return realDistances[body1.name] * 1e6;

            const isMoonOf = (moon, planet) =>
                solarSystem.planets.some(p => p.name === planet && p.moons.some(m => m.name === moon));

            if (isMoonOf(body1.name, body2.name)) {
                return realDistances[body1.name] * 1e6;
            }
            if (isMoonOf(body2.name, body1.name)) {
                return realDistances[body2.name] * 1e6;
            }

            const distance1 = realDistances[body1.name];
            const distance2 = realDistances[body2.name];

            if (body1.orbitRadius === body2.orbitRadius && body1.isAsteroidBelt) {
                return Math.abs(distance1 - distance2) * 1e5;
            }

            const minDistance = Math.abs(distance1 - distance2) * 1e6;
            const maxDistance = (distance1 + distance2) * 1e6;

            return Math.round((minDistance + maxDistance) / 2);
        };

        // Função para determinar o tipo de transferência
        const getTransferType = (fromBody, toBody) => {
            // Se é uma lua do planeta atual
            if (fromBody.moons.some(m => m.name === toBody.name)) {
                return 'direct';
            }

            // Se é o planeta pai de uma lua
            const parentPlanet = solarSystem.planets.find(p =>
                p.moons.some(m => m.name === fromBody.name));
            if (parentPlanet && parentPlanet.name === toBody.name) {
                return 'direct';
            }

            // Se estão em órbitas adjacentes
            const planets = solarSystem.planets.filter(p => !p.isAsteroidBelt && !p.isKuiperBelt);
            const fromIndex = planets.findIndex(p => p.name === fromBody.name);
            const toIndex = planets.findIndex(p => p.name === toBody.name);


            if (Math.abs(fromIndex - toIndex) === 1) {
                return 'hohmann';
            }

            // Para órbitas mais distantes
            return 'gravity-assist';
        };



        // Gerar opções de transferência
        const options = [];

        // 1. Adicionar luas se for um planeta com luas
        if (selectedBody.moons && selectedBody.moons.length > 0) {
            selectedBody.moons.forEach(moon => {
                const distance = calculateDistance(selectedBody, { name: moon.name });
                options.push({
                    type: 'direct',
                    destination: moon.name,
                    distance: distance,
                    fuel: estimateFuel(distance, 'direct')
                });
            });
        }

        // 2. Adicionar planeta pai se for uma lua
        const parentPlanet = solarSystem.planets.find(p =>
            p.moons.some(m => m.name === selectedBody.name));
        if (parentPlanet) {
            const distance = calculateDistance(selectedBody, parentPlanet);
            options.push({
                type: 'direct',
                destination: parentPlanet.name,
                distance: distance,
                fuel: estimateFuel(distance, 'direct')
            });
        }

        // 3. Adicionar planetas adjacentes
        const planets = solarSystem.planets.filter(p => !p.isAsteroidBelt && !p.isKuiperBelt);
        const currentIndex = planets.findIndex(p => p.name === selectedBody.name);

        if (currentIndex > 0) {
            const innerPlanet = planets[currentIndex - 1];
            const distance = calculateDistance(selectedBody, innerPlanet);
            const transferType = getTransferType(selectedBody, innerPlanet);
            options.push({
                type: transferType,
                destination: innerPlanet.name,
                distance: distance,
                fuel: estimateFuel(distance, transferType)
            });
        }

        if (currentIndex < planets.length - 1 && currentIndex >= 0) {
            const outerPlanet = planets[currentIndex + 1];
            const distance = calculateDistance(selectedBody, outerPlanet);
            const transferType = getTransferType(selectedBody, outerPlanet);
            options.push({
                type: transferType,
                destination: outerPlanet.name,
                distance: distance,
                fuel: estimateFuel(distance, transferType)
            });
        }


        // 5. Ordenar por distância e limitar a 4 opções
        return options
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 4);
    };
    // Se não há etapas ou a primeira não é Terra, comece com Terra
    const needsEarth = plannedRoute.steps.length === 0 || plannedRoute.steps[0].name !== "Terra";

    const handleTransferSelect = (transfer) => {
        // Não permitir adicionar se já está na rota
        if (plannedRoute.steps.some(step => step.name === transfer.destination)) {
            return;
        }

        let newSteps = [];

        // Se não há etapas ou a primeira não é Terra, começar com Terra
        if (plannedRoute.steps.length === 0 || plannedRoute.steps[0].name !== "Terra") {
            newSteps = [
                {
                    name: "Terra",
                    distance: 0,
                    fuel: 0,
                    from: "Origem"
                }
            ];
        } else {
            newSteps = [...plannedRoute.steps];
        }
        // Obter o último ponto da rota (será a origem para o novo destino)
        const lastStep = newSteps[newSteps.length - 1];
        const fromBody = lastStep.name;

        // Adicionar o novo destino com distância calculada do JSON
        newSteps.push({
            name: transfer.destination,
            distance: getDistanceFromJSON(fromBody, transfer.destination),
            fuel: estimateFuel(getDistanceFromJSON(fromBody, transfer.destination), transfer.type),
            from: fromBody
        });


        // Calculate totals
        const totalDistance = newSteps.reduce((sum, step) => sum + step.distance, 0);
        const totalFuel = newSteps.reduce((sum, step) => sum + step.fuel, 0);
        const totalFood = Math.round(totalDistance * FOOD_PER_KM);
        const totalOxygen = Math.round(totalDistance * OXYGEN_PER_PERSON_PER_DAY * CREW_SIZE);

        setPlannedRoute({
            steps: newSteps,
            distance: totalDistance,
            fuel: totalFuel,
            food: totalFood,
            oxygen: totalOxygen,
            fuelPercentage: calculatePercentage(totalFuel, MAX_FUEL),
            foodPercentage: calculatePercentage(totalFood, MAX_FOOD),
            oxygenPercentage: calculatePercentage(totalOxygen, MAX_OXYGEN)
        });
        setSelectedBody(null);
    };
    const handleRemoveStep = (index) => {
        // Não permitir remover a Terra
        if (index === 0 && plannedRoute.steps[index].name === "Terra") {
            return;
        }

        setPlannedRoute(prev => {
            const newSteps = [...prev.steps];
            newSteps.splice(index, 1);

            // Recalcular todas as etapas subsequentes
            for (let i = 1; i < newSteps.length; i++) {
                const fromBody = newSteps[i - 1].name;
                const toBody = newSteps[i].name;

                newSteps[i] = {
                    ...newSteps[i],
                    distance: getDistanceFromJSON(fromBody, toBody),
                    fuel: estimateFuel(getDistanceFromJSON(fromBody, toBody), newSteps[i].type || 'hohmann'),
                    from: fromBody
                };
            }

            const totalDistance = newSteps.reduce((sum, step) => sum + step.distance, 0);
            const totalFuel = newSteps.reduce((sum, step) => sum + step.fuel, 0);
            const totalFood = Math.round(totalDistance * FOOD_PER_KM);
            const totalOxygen = Math.round(totalDistance * OXYGEN_PER_PERSON_PER_DAY * CREW_SIZE);

            return {
                steps: newSteps,
                distance: totalDistance,
                fuel: totalFuel,
                food: totalFood,
                oxygen: totalOxygen
            };
        });
    };

    const handleConfirmRoute = () => {
        if (plannedRoute.steps.length === 0 || plannedRoute.fuel >= MAX_FUEL) return;

        const audio = new Audio('/sounds/03.system-selection.mp3');
        audio.play();

        setRouteConfirmed(!routeConfirmed); // Toggle between confirmed and edit states
        setWaveAnimation(true);

        setTimeout(() => {
            setWaveAnimation(false);
        }, 5000);
    };
    const handleClear = () => {
        if (isEditing) return; // Não permite limpar se a rota estiver travada
        setPlannedRoute({ distance: 0, fuel: 0, steps: [], food: 0, oxygen: 0, fuelPercentage: 0, foodPercentage: 0, oxygenPercentage: 0 });
        setConfirmedRoute(false);
        setIsEditing(false);
        savePlannedRoute({ steps: [] }); // Limpa no backend
    };
    const handleClearRoute = () => {
        setPlannedRoute({
            distance: 0,
            fuel: 0,
            steps: [],
            food: 0,
            oxygen: 0,
            fuelPercentage: 0,
            foodPercentage: 0,
            oxygenPercentage: 0
        });
        setSelectedBody(null);
        setSelectedRoute([]);
        setRouteConfirmed(false);
    };

    const handleEditRoute = () => {
        playSound("/sounds/03.system-selection.mp3");
        setRouteConfirmed(false);
        setRoutePlanned(false);
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
    const getFoodWarningClass = (food) => {
        if (food >= MAX_FOOD) return 'limit-reached';
        if (food >= MAX_FOOD * 0.8) return 'danger';
        if (food >= MAX_FOOD * 0.6) return 'warning';
        return '';
    };

    const getOxygenWarningClass = (oxygen) => {
        if (oxygen >= MAX_OXYGEN) return 'limit-reached';
        if (oxygen >= MAX_OXYGEN * 0.8) return 'danger';
        if (oxygen >= MAX_OXYGEN * 0.6) return 'warning';
        return '';
    };

    const getFoodWarningMessage = (food) => {
        if (food >= MAX_FOOD) return 'Limite de provisões alcançado!';
        if (food >= MAX_FOOD * 0.8) return 'Limite de provisões próximo!';
        if (food >= MAX_FOOD * 0.6) return 'Atenção: Uso de provisões elevado';
        return null;
    };

    const getOxygenWarningMessage = (oxygen) => {
        if (oxygen >= MAX_OXYGEN) return 'Limite de oxigênio alcançado!';
        if (oxygen >= MAX_OXYGEN * 0.8) return 'Limite de oxigênio próximo!';
        if (oxygen >= MAX_OXYGEN * 0.6) return 'Atenção: Uso de oxigênio elevado';
        return null;
    };
    const getFuelWarningClass = (fuel) => {
        if (fuel >= MAX_FUEL) return 'limit-reached';
        if (fuel >= MAX_FUEL * 0.8) return 'danger';
        if (fuel >= MAX_FUEL * 0.6) return 'warning';
        return '';
    };

    const getFuelWarningMessage = (fuel) => {
        if (fuel >= MAX_FUEL) return 'Limite de combustível alcançado!';
        if (fuel >= MAX_FUEL * 0.8) return 'Limite de combustível próximo!';
        if (fuel >= MAX_FUEL * 0.6) return 'Atenção: Uso de combustível elevado';
        return null;
    };

    return (
        <div className="stellar-map" ref={containerRef} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
            {plannedRoute.steps.length > 0 && (
                <div className="route-display-panel ultimate">
                    {/* Botões de ação */}
                    <div className="actions-ultimate">
                        <button
                            className="route-button confirm"
                            onClick={handleConfirmOrEdit}
                        >
                            {isEditing ? "Editar" : "Confirmar"}
                        </button>

                        <button
                            className="route-button clear"
                            onClick={handleClear}
                            disabled={isEditing}
                        >
                            Limpar
                        </button>
                    </div>

                    {/* Indicadores de recursos */}
                    <div className="resources-ultimate">
                        {/* Combustível */}
                        <div className="resource-ultimate fuel-ultimate">
                            <img
                                src="/images/plan/Combustivel-port.png"
                                alt="Combustível"
                                className="resource-icon-ultimate"
                            />
                            <div className="resource-value-ultimate">
                                {Math.round(plannedRoute.fuelPercentage)}%
                            </div>
                            <div
                                className={`resource-warning ${getFuelWarningClass(plannedRoute.fuel)}`}
                                style={{ display: getFuelWarningMessage(plannedRoute.fuel) ? 'block' : 'none' }}
                            >
                                {getFuelWarningMessage(plannedRoute.fuel)}
                            </div>
                        </div>

                        {/* Oxigênio */}
                        <div className="resource-ultimate oxygen-ultimate">
                            <img
                                src="/images/plan/Oxigenio-port.png"
                                alt="Oxigênio"
                                className="resource-icon-ultimate"
                            />
                            <div className="resource-value-ultimate">
                                {Math.round(plannedRoute.oxygenPercentage)}%
                            </div>
                            <div
                                className={`resource-warning ${getOxygenWarningClass(plannedRoute.oxygen)}`}
                                style={{ display: getOxygenWarningMessage(plannedRoute.oxygen) ? 'block' : 'none' }}
                            >
                                {getOxygenWarningMessage(plannedRoute.oxygen)}
                            </div>
                        </div>

                        {/* Provisões */}
                        <div className="resource-ultimate food-ultimate">
                            <img
                                src="/images/plan/Comida-port.png"
                                alt="Provisões"
                                className="resource-icon-ultimate"
                            />
                            <div className="resource-value-ultimate">
                                {Math.round(plannedRoute.foodPercentage)}%
                            </div>
                            <div
                                className={`resource-warning ${getFoodWarningClass(plannedRoute.food)}`}
                                style={{ display: getFoodWarningMessage(plannedRoute.food) ? 'block' : 'none' }}
                            >
                                {getFoodWarningMessage(plannedRoute.food)}
                            </div>
                        </div>
                    </div>

                    {/* Visualização da rota */}
                    <div className="route-container">
                        <div className="route-ultimate">
                            {plannedRoute.steps.map((step, index) => (
                                <div key={index} className="step-ultimate">
                                    {/* Marcador - adicione a classe current-location-marker apenas para Marte */}
                                    <div className={` step-marker ${step.name === "Terra" ? "earth-marker" : ""} ${step.name === "Marte" ? "current-location-marker" : "normal-marker"}`}></div>
                                    {/* Container do nome e distância */}
                                    <div className="step-content">
                                        <span className="step-name">{step.name}</span>
                                        <span className="step-distance">
                                            {index === 0 ? "ROTA PLANEJADA" : `${step.distance.toLocaleString()} km`}
                                        </span>
                                    </div>

                                    {/* Botão de remoção (exceto para a Terra) */}
                                    {index > 0 && (
                                        <button className="remove-step" onClick={() => handleRemoveStep(index)}>
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

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
                                    }} onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedBody(planet);

                                        if (planet.name !== "Terra" && planet.name !== "Sol" && planet.name !== "ACEE") {
                                            const transferOption = {
                                                type: 'direct', // ou 'hohmann' dependendo da distância
                                                destination: planet.name,
                                                distance: getDistanceFromJSON(
                                                    plannedRoute.steps.length > 0
                                                        ? plannedRoute.steps[plannedRoute.steps.length - 1].name
                                                        : "Terra",
                                                    planet.name
                                                ),
                                                fuel: estimateFuel(
                                                    getDistanceFromJSON(
                                                        plannedRoute.steps.length > 0
                                                            ? plannedRoute.steps[plannedRoute.steps.length - 1].name
                                                            : "Terra",
                                                        planet.name
                                                    ),
                                                    'direct'
                                                )
                                            };
                                            handleTransferSelect(transferOption);
                                        }
                                    }}>
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

                                                // if (moon.name !== "Lua") {
                                                const transferOption = getTransferOptions(selectedBody || solarSystem.planets.find(p => p.name === "Terra"))
                                                    .find(opt => opt.destination === moon.name);

                                                if (transferOption) {
                                                    handleTransferSelect(transferOption);
                                                }
                                            }
                                                //}
                                            }>
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
                        <h4 className="section-title">Mapa de Transferência Orbital Sugerido</h4>
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
                                        <div
                                            key={index}
                                            className={`transfer-route ${option.type}`}
                                            onClick={() => handleTransferSelect(option)}
                                        >
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
                                                    <span className="transfer-fuel">
                                                        {option.fuel}
                                                    </span>
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
                            <button className="confirm-button" onClick={handleConfirmRoute}>Sim</button>
                            <button className="cancel-button" onClick={() => setShowTransferModal(false)}>Não</button>
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

export default StellarMapPlanPrep;