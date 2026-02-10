import React, { useState, useRef, useEffect, useReducer, useCallback, useMemo } from 'react';
import './StellarMapPlan.css';
import transferDistances from './fixed_transfer_distances.json';
import { useConfig } from '../ConfigContext';

// --- CONSTANTES E DADOS ESTÁTICOS ---
const MAX_FOOD = 30 * 1200 * 36;
const MAX_OXYGEN = 242000;
const OXYGEN_PER_PERSON_PER_DAY = 0.84;
const CREW_SIZE = 10;
const FOOD_PER_KM = 30;
const MAX_FUEL = 98000;

// LISTA DE ÁGUA: Nomes devem ser IDÊNTICOS aos do solarSystem (sem acentos se lá não tiver)
const hasWaterList = new Set([
    "Marte", "Mercurio", "Ceres", "Plutao", "Haumea", "Eris", "Makemake",
    "Lua", "Europa", "Ganímedes", "Calisto", "Titã", "Encelado", "Tritao",
    "Caronte", "Titania", "Oberon", "Vesta", "TRAPPIST-1e", "Kepler-186f",
    "Terra", "Proxima Centauri b", "Jupiter"
]);

const realDistances = {
    "Sol": 0, "Mercurio": 57.9, "Venus": 108.2, "Terra": 149.6, "Marte": 227.9, "Ceres": 413.7, "Jupiter": 778.3,
    "Saturno": 1427, "Urano": 2871, "Netuno": 4498, "Plutao": 5906, "Haumea": 6484, "Makemake": 6785, "Eris": 10125,
    "Lua": 0.384, "Fobos": 0.009, "Deimos": 0.023, "Io": 0.421, "Europa": 0.670, "Ganímedes": 1.07, "Calisto": 1.88,
    "Titã": 1.221, "Encelado": 0.238, "Mimas": 0.185, "Titania": 0.436, "Oberon": 0.583, "Tritao": 0.354, "Caronte": 0.019,
    "Proxima Centauri b": 40230, "TRAPPIST-1e": 39140, "Kepler-186f": 49200, "ACEE": 0.564, "Salyut": 6206,
    "Delfos": 2875, "Mol": 4500, "Skylab": 115, "Almaz": 6000, "Tiangong": 1500, "Boktok": 39142
};

const solarSystem = {
    sun: { name: "Sol", radius: 50, color: "#ff6d00", x: 50, y: 50, rotationSpeed: 0 },
    planets: [
        { name: "Mercurio", radius: 8, color: "#DE820D", orbitRadius: 20, orbitSpeed: 0.0047 / 2, rotationSpeed: 0.0006, angle: 0, moons: [] },
        { name: "Venus", radius: 12, color: "#e6c229", orbitRadius: 30, orbitSpeed: 0.0035 / 2, rotationSpeed: 0.0002, angle: 45, moons: [] },
        { name: "Terra", radius: 13, color: "#3498db", orbitRadius: 40, orbitSpeed: 0.0029 / 2, rotationSpeed: 0.006, angle: 90, moons: [{ name: "Lua", radius: 4, orbitRadius: 8, orbitSpeed: 0.0029 / 2, rotationSpeed: 0.0002, angle: 0 }] },
        { name: "ACEE", radius: 6, color: "#a020f0", orbitRadius: 42, orbitSpeed: 0.003 / 2, rotationSpeed: 0, angle: 116, moons: [], isStation: true },
        { name: "Salyut", radius: 6, color: "#a020f0", orbitRadius: 140, orbitSpeed: 0.0004 / 2, rotationSpeed: 0, angle: 0, moons: [], isStation: true },
        { name: "Delfos", radius: 6, color: "#a020f0", orbitRadius: 118, orbitSpeed: 0.0004 / 2, rotationSpeed: 0, angle: 200, moons: [], isStation: true },
        { name: "Mol", radius: 6, color: "#a020f0", orbitRadius: 140, orbitSpeed: 0.0004 / 2, rotationSpeed: 0, angle: 315, moons: [], isStation: true },
        { name: "Skylab", radius: 6, color: "#a020f0", orbitRadius: 33, orbitSpeed: 0.0004 / 2, rotationSpeed: 0, angle: 46, moons: [], isStation: true },
        { name: "Almaz", radius: 6, color: "#a020f0", orbitRadius: 157, orbitSpeed: 0.0004 / 2, rotationSpeed: 0, angle: 60, moons: [], isStation: true },
        { name: "Tiangong", radius: 6, color: "#a020f0", orbitRadius: 110, orbitSpeed: 0.0004 / 2, rotationSpeed: 0, angle: 180, moons: [], isStation: true },
        { name: "Marte", radius: 10, color: "#e74c3c", orbitRadius: 50, orbitSpeed: 0.0024 / 2, rotationSpeed: 0.006, angle: 135, moons: [{ name: "Fobos", radius: 2.5, orbitRadius: 5, orbitSpeed: 0.03 / 2, rotationSpeed: 0.03, angle: 0 }, { name: "Deimos", radius: 2, orbitRadius: 6, orbitSpeed: 0.01 / 2, rotationSpeed: 0.01, angle: 180 }] },
        { name: "Ceres", radius: 5, color: "#aaa", orbitRadius: 60, orbitSpeed: 0.0018 / 2, rotationSpeed: 0.001, angle: 0, isDwarfPlanet: true, moons: [] },
        { name: "Vesta", radius: 4.5, color: "#bbb", orbitRadius: 62, orbitSpeed: 0.0017 / 2, rotationSpeed: 0.001, angle: 120, moons: [] },
        { name: "Pallas", radius: 4.5, color: "#ccc", orbitRadius: 64, orbitSpeed: 0.0016 / 2, rotationSpeed: 0.001, angle: 240, moons: [] },
        { name: "Cinturão", radius: 0, color: "transparent", orbitRadius: 65, orbitSpeed: 0, rotationSpeed: 0, angle: 0, isAsteroidBelt: true, moons: [] },
        { name: "Jupiter", radius: 28, color: "#f1c40f", orbitRadius: 80, orbitSpeed: 0.0013 / 2, rotationSpeed: 0.025, angle: 180, moons: [{ name: "Io", radius: 4, orbitRadius: 12, orbitSpeed: 0.0008 / 2, rotationSpeed: 0.0008, angle: 0 }, { name: "Europa", radius: 3.5, orbitRadius: 13, orbitSpeed: 0.0007 / 2, rotationSpeed: 0.0007, angle: 90 }, { name: "Ganímedes", radius: 5, orbitRadius: 15, orbitSpeed: 0.0004 / 2, rotationSpeed: 0.0004, angle: 180 }, { name: "Calisto", radius: 4.5, orbitRadius: 16, orbitSpeed: 0.0003 / 2, rotationSpeed: 0.0003, angle: 270 }] },
        { name: "Saturno", radius: 24, color: "#f39c12", orbitRadius: 100, orbitSpeed: 0.00096 / 2, rotationSpeed: 0.022, angle: 225, moons: [{ name: "Titã", radius: 5, orbitRadius: 18, orbitSpeed: 0.0003 / 2, rotationSpeed: 0.0003, angle: 0 }, { name: "Encelado", radius: 3, orbitRadius: 14, orbitSpeed: 0.0005 / 2, rotationSpeed: 0.0005, angle: 120 }, { name: "Mimas", radius: 2.5, orbitRadius: 12, orbitSpeed: 0.0007 / 2, rotationSpeed: 0.0007, angle: 240 }], hasRings: true },
        { name: "Urano", radius: 18, color: "#1abc9c", orbitRadius: 120, orbitSpeed: 0.00068 / 2, rotationSpeed: 0.015, angle: 270, moons: [{ name: "Titania", radius: 4, orbitRadius: 15, orbitSpeed: 0.0002 / 2, rotationSpeed: 0.0002, angle: 0 }, { name: "Oberon", radius: 3.8, orbitRadius: 16, orbitSpeed: 0.00018 / 2, rotationSpeed: 0.00018, angle: 180 }] },
        { name: "Netuno", radius: 18, color: "#3498db", orbitRadius: 140, orbitSpeed: 0.00054 / 2, rotationSpeed: 0.016, angle: 315, moons: [{ name: "Tritao", radius: 4.2, orbitRadius: 14, orbitSpeed: 0.00015 / 2, rotationSpeed: 0.00015, angle: 0 }, { name: "Proteu", radius: 2.5, orbitRadius: 12, orbitSpeed: 0.00025 / 2, rotationSpeed: 0.00025, angle: 90 }] },
        { name: "Plutao", radius: 5, color: "#d7bde2", orbitRadius: 150, orbitSpeed: 0.0004 / 2, rotationSpeed: 0.0008, angle: 0, isDwarfPlanet: true, moons: [{ name: "Caronte", radius: 2.5, orbitRadius: 8, orbitSpeed: 0.0004 / 2, rotationSpeed: 0.0004, angle: 0 }] },
        { name: "Haumea", radius: 4, color: "#aed6f1", orbitRadius: 155, orbitSpeed: 0.00035 / 2, rotationSpeed: 0.001, angle: 60, isDwarfPlanet: true, moons: [] },
        { name: "Makemake", radius: 4, color: "#f9e79f", orbitRadius: 158, orbitSpeed: 0.0003 / 2, rotationSpeed: 0.0008, angle: 120, isDwarfPlanet: true, moons: [] },
        { name: "Eris", radius: 5.5, color: "#d5dbdb", orbitRadius: 165, orbitSpeed: 0.00025 / 2, rotationSpeed: 0.0006, angle: 180, isDwarfPlanet: true, moons: [] },
        { name: "Kuiper", radius: 0, color: "transparent", orbitRadius: 170, orbitSpeed: 0, rotationSpeed: 0, angle: 0, isKuiperBelt: true, moons: [] },
        { name: "Proxima Centauri b", radius: 10, color: "#e74c3c", orbitRadius: 200, orbitSpeed: 0.0001 / 2, rotationSpeed: 0.0005, angle: 0, isExoplanet: true, moons: [] },
        { name: "TRAPPIST-1e", radius: 9, color: "#3498db", orbitRadius: 210, orbitSpeed: 0.00009 / 2, rotationSpeed: 0.0006, angle: 90, isExoplanet: true, moons: [] },
        { name: "Boktok", radius: 6, color: "#a020f0", orbitRadius: 210.8, orbitSpeed: 0.00009 / 2, rotationSpeed: 0, angle: 90.5, moons: [], isStation: true },
        { name: "Kepler-186f", radius: 8, color: "#2ecc71", orbitRadius: 220, orbitSpeed: 0.00008 / 2, rotationSpeed: 0.0004, angle: 180, isExoplanet: true, moons: [] }
    ]
};

const calculatePercentage = (value, max) => Math.min(Math.round((value / max) * 100), 100);

// --- HELPER DE DISTÂNCIA CORRIGIDO ---
// Agora suporta 'S.O.S próximo a X' para calcular combustível baseado no host real
const getDistanceValue = (name) => {
    // Se o nome está no mapa padrão, retorna
    if (realDistances[name]) return realDistances[name];

    // Se for um SOS, extrai o nome do host e retorna a distância dele (coerência física)
    if (name.includes("S.O.S próximo a ")) {
        const host = name.replace("S.O.S próximo a ", "");
        if (realDistances[host]) {
            // Retorna a distância do planeta + um offset mínimo
            return realDistances[host] + 0.355;
        }
    }
    return 0;
};

const getDistanceFromJSON = (from, to) => {
    const formatName = (name) => name.replace(/ /g, '_').replace(/-/g, '_');
    const key1 = `${formatName(from)}_${formatName(to)}`;
    const key2 = `${formatName(to)}_${formatName(from)}`;
    if (transferDistances[key1]) return transferDistances[key1];
    if (transferDistances[key2]) return transferDistances[key2];

    const distanceFrom = getDistanceValue(from);
    const distanceTo = getDistanceValue(to);
    return Math.abs(distanceFrom - distanceTo) * 1e6;
};

const estimateFuel = (distance, transferType) => {
    const fuelFactors = { 'direct': 0.5, 'hohmann': 1.0, 'gravity-assist': 1.8 };
    const baseFuel = distance / 5000;
    return Math.round(baseFuel * (fuelFactors[transferType] || 1.0));
};

const initialRouteState = {
    distance: 0, fuel: 0, food: 0, oxygen: 0, steps: [],
    fuelPercentage: 0, foodPercentage: 0, oxygenPercentage: 0,
};

function routeReducer(state, action) {
    let newSteps = [...state.steps];
    switch (action.type) {
        case 'SET_SAVED_ROUTE':
            newSteps = action.payload.steps;
            break;
        case 'ADD_STEP':
            if (newSteps.some(step => step.name === action.payload.destination)) return state;
            if (newSteps.length === 0) {
                newSteps.push({ name: "Terra", distance: 0, fuel: 0, from: "Origem" });
            }
            const lastStep = newSteps[newSteps.length - 1];
            const distance = getDistanceFromJSON(lastStep.name, action.payload.destination);
            newSteps.push({
                name: action.payload.destination,
                distance: distance,
                fuel: estimateFuel(distance, 'direct'),
                from: lastStep.name,
                type: 'direct'
            });
            break;
        case 'REMOVE_STEP':
            if (action.payload.index === 0) return state;
            newSteps.splice(action.payload.index, 1);
            break;
        case 'REORDER_STEP':
            const { index, direction } = action.payload;
            const targetIndex = index + (direction === 'up' ? -1 : 1);
            if (index === 0 || targetIndex === 0) return state;
            if (index >= newSteps.length || targetIndex >= newSteps.length) return state;
            [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
            break;
        case 'CLEAR_ROUTE':
            return { ...initialRouteState, steps: [{ name: "Terra", distance: 0, fuel: 0, from: "Origem" }] };
        default:
            throw new Error();
    }
    for (let i = 1; i < newSteps.length; i++) {
        const fromBody = newSteps[i - 1].name;
        const toBody = newSteps[i].name;
        const distance = getDistanceFromJSON(fromBody, toBody);
        newSteps[i] = {
            ...newSteps[i],
            distance: distance,
            fuel: estimateFuel(distance, newSteps[i].type || 'direct'),
            from: fromBody,
        };
    }
    const totalDistance = newSteps.reduce((sum, step) => sum + (step.distance || 0), 0);
    const totalFuel = newSteps.reduce((sum, step) => sum + (step.fuel || 0), 0);
    const totalFood = Math.round(totalDistance * FOOD_PER_KM);
    const totalOxygen = Math.round(totalDistance * OXYGEN_PER_PERSON_PER_DAY * CREW_SIZE);
    return {
        steps: newSteps, distance: totalDistance, fuel: totalFuel, food: totalFood, oxygen: totalOxygen,
        fuelPercentage: calculatePercentage(totalFuel, MAX_FUEL),
        foodPercentage: calculatePercentage(totalFood, MAX_FOOD),
        oxygenPercentage: calculatePercentage(totalOxygen, MAX_OXYGEN),
    };
}

const StellarMapPlan = ({ onRouteComplete, onRouteReset, onCloseMap, initialRoute, currentIndex, onSosDetected, allowSos, sosSignalData }) => {
    const { apiBaseUrl } = useConfig();
    const API_BASE_URL = apiBaseUrl;

    const [plannedRoute, dispatchRouteAction] = useReducer(routeReducer, initialRouteState);
    const [isRouteConfirmed, setIsRouteConfirmed] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [selectedBody, setSelectedBody] = useState(null);
    const [waveAnimation, setWaveAnimation] = useState(false);
    const [hoveredStep, setHoveredStep] = useState(null);
    const [rotationAngles, setRotationAngles] = useState({});
    const [userId, setUserId] = useState(null);

    // O S.O.S agora é gerenciado pelo componente pai e passado via prop
    const sosSignal = sosSignalData;

    const containerRef = useRef(null);
    const [isLoadingProgress, setIsLoadingProgress] = useState(false);

    const stars = useMemo(() => Array.from({ length: 500 }, (_, i) => ({
        id: i, x: Math.random() * 100, y: Math.random() * 100, size: 0.3 + Math.random() * 3,
        opacity: 0.1 + Math.random() * 0.9, delay: Math.random() * 10, duration: 3 + Math.random() * 7
    })), []);

    // Verifica se o SOS já foi adicionado na rota atual
    const isSosAdded = useMemo(() => {
        if (!sosSignal) return false;
        return plannedRoute.steps.some(step => step.name === sosSignal.name);
    }, [plannedRoute.steps, sosSignal]);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser && storedUser._id) setUserId(storedUser._id);
    }, []);

    useEffect(() => {
        if (initialRoute && initialRoute.length > 0) {
            dispatchRouteAction({ type: 'SET_SAVED_ROUTE', payload: { steps: initialRoute } });
            setIsRouteConfirmed(true);
        }
    }, [initialRoute, currentIndex]);

    useEffect(() => {
        const updateAngles = () => {
            const newRotationAngles = {};
            solarSystem.planets.forEach(planet => {
                // Atualiza ângulo orbital (posição na órbita)
                if (planet.orbitSpeed > 0) planet.angle = (planet.angle + planet.orbitSpeed) % 360;
                // Atualiza ângulo de rotação (giro do planeta)
                if (planet.rotationSpeed > 0) newRotationAngles[planet.name] = (rotationAngles[planet.name] || 0) + planet.rotationSpeed;

                planet.moons.forEach(moon => {
                    moon.angle = (moon.angle + moon.orbitSpeed) % 360;
                    newRotationAngles[moon.name] = (rotationAngles[moon.name] || 0) + moon.rotationSpeed;
                });
            });
            setRotationAngles(prev => ({ ...prev, ...newRotationAngles }));
        };
        const interval = setInterval(updateAngles, 50);
        return () => clearInterval(interval);
    }, [rotationAngles]);

    const visitedDestinations = useMemo(() =>
        plannedRoute.steps.slice(0, currentIndex + 1).map(step => step.name),
        [plannedRoute.steps, currentIndex]
    );

    const nextDestination = useMemo(() =>
        (currentIndex + 1 < plannedRoute.steps.length) ? plannedRoute.steps[currentIndex + 1].name : null,
        [plannedRoute.steps, currentIndex]
    );

    const handleBodyClick = useCallback((body) => {
        if (isRouteConfirmed) return;
        if (visitedDestinations.includes(body.name)) return;
        if (body.name === "Sol" || (body.name === "Terra" && plannedRoute.steps.length > 1)) {
            setSelectedBody(body);
            return;
        }
        dispatchRouteAction({ type: 'ADD_STEP', payload: { destination: body.name } });
    }, [isRouteConfirmed, visitedDestinations, plannedRoute.steps.length]);

    const handleRemoveStep = useCallback((index) => {
        if (index <= (currentIndex + 1)) return;
        dispatchRouteAction({ type: 'REMOVE_STEP', payload: { index } });
    }, [currentIndex]);

    const handleMoveStep = useCallback((index, direction) => {
        if (index <= (currentIndex + 1)) return;
        const targetIndex = index + (direction === 'up' ? -1 : 1);
        if (targetIndex === currentIndex + 1) return;
        dispatchRouteAction({ type: 'REORDER_STEP', payload: { index, direction } });
    }, [currentIndex]);

    const handleConfirmRoute = useCallback(() => {
        if (plannedRoute.steps.length === 0) return;
        new Audio('/sounds/03.system-selection.mp3').play();
        setWaveAnimation(true);
        setIsRouteConfirmed(true);
        if (onRouteComplete) onRouteComplete(plannedRoute);
        if (onCloseMap) onCloseMap({ newPlannedRoute: plannedRoute.steps, newRouteIndex: currentIndex });
        setTimeout(() => setWaveAnimation(false), 5000);
    }, [plannedRoute, onRouteComplete, onCloseMap, currentIndex]);

    const handleEditRoute = useCallback(() => setIsRouteConfirmed(false), []);
    const handleClearRoute = useCallback(() => {
        if (!isRouteConfirmed) dispatchRouteAction({ type: 'CLEAR_ROUTE' });
    }, [isRouteConfirmed]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const handleMouseDown = (e) => {
            if (e.target.closest('button')) return;
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        };
        const handleMouseMove = (e) => {
            if (isDragging) setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        };
        const handleMouseUp = () => setIsDragging(false);
        const handleWheel = (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setZoom(prev => Math.min(Math.max(prev * delta, 0.3), 8));
        };
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

    const getWarning = (value, max, type) => {
        if (value >= max) return `Limite de ${type} alcançado!`;
        if (value >= max * 0.8) return `Limite de ${type} próximo!`;
        return null;
    };

    const getWarningClass = (value, max) => {
        if (value >= max) return 'limit-reached';
        if (value >= max * 0.8) return 'danger';
        if (value >= max * 0.6) return 'warning';
        return '';
    };

    return (
        <div className="stellar-map" ref={containerRef} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
            {plannedRoute.steps.length > 0 && (
                <div className="route-display-panel ultimate">
                    <div className="actions-ultimate">
                        <button className={`action-ultimate ${isRouteConfirmed ? 'edit' : 'confirm'}`}
                            onClick={isRouteConfirmed ? handleEditRoute : handleConfirmRoute}
                            disabled={plannedRoute.steps.length <= 1}>
                            <span className="button-icon">{isRouteConfirmed ? '✎' : '✓'}</span>
                            {isRouteConfirmed ? 'EDITAR' : 'CONFIRMAR'}
                        </button>
                        <button className="action-ultimate clear" onClick={handleClearRoute} disabled={isRouteConfirmed || currentIndex > 0}>
                            <span className="button-icon">×</span> LIMPAR
                        </button>
                    </div>

                    <div className="resources-ultimate">
                        <div className="resource-ultimate fuel-ultimate">
                            <img src="/images/Plan/Combustivel-port.png" alt="Fuel" className="resource-icon-ultimate" />
                            <div className="resource-value-ultimate">{Math.round(plannedRoute.fuelPercentage)}%</div>
                            <div className={`resource-warning ${getWarningClass(plannedRoute.fuel, MAX_FUEL)}`} style={{ display: getWarning(plannedRoute.fuel, MAX_FUEL, 'combustível') ? 'block' : 'none' }}>
                                {getWarning(plannedRoute.fuel, MAX_FUEL, 'combustível')}
                            </div>
                        </div>
                        <div className="resource-ultimate oxygen-ultimate">
                            <img src="/images/Plan/Oxigenio-port.png" alt="O2" className="resource-icon-ultimate" />
                            <div className="resource-value-ultimate">{Math.round(plannedRoute.oxygenPercentage)}%</div>
                            <div className={`resource-warning ${getWarningClass(plannedRoute.oxygen, MAX_OXYGEN)}`} style={{ display: getWarning(plannedRoute.oxygen, MAX_OXYGEN, 'oxigênio') ? 'block' : 'none' }}>
                                {getWarning(plannedRoute.oxygen, MAX_OXYGEN, 'oxigênio')}
                            </div>
                        </div>
                        <div className="resource-ultimate food-ultimate">
                            <img src="/images/Plan/Comida-port.png" alt="Food" className="resource-icon-ultimate" />
                            <div className="resource-value-ultimate">{Math.round(plannedRoute.foodPercentage)}%</div>
                            <div className={`resource-warning ${getWarningClass(plannedRoute.food, MAX_FOOD)}`} style={{ display: getWarning(plannedRoute.food, MAX_FOOD, 'provisões') ? 'block' : 'none' }}>
                                {getWarning(plannedRoute.food, MAX_FOOD, 'provisões')}
                            </div>
                        </div>
                    </div>

                    <div className="route-container">
                        <div className="route-ultimate">
                            {plannedRoute.steps.map((step, index) => {
                                const markerClass = index <= currentIndex ? "origin-marker" : index === currentIndex + 1 ? "next-destination-marker" : "normal-marker";
                                const isStepLocked = index <= (currentIndex + 1);
                                const displayName = hasWaterList.has(step.name) ? `${step.name} 💧` : step.name;

                                return (
                                    <div key={index} className="step-ultimate" onMouseEnter={() => !isRouteConfirmed && setHoveredStep(index)} onMouseLeave={() => !isRouteConfirmed && setHoveredStep(null)}>
                                        <div className={`step-marker ${markerClass}`}></div>
                                        <div className="step-content">
                                            <span className="step-name">{displayName}</span>
                                            <span className="step-distance">{index === 0 ? "PONTO DE PARTIDA" : `${step.distance.toLocaleString()} km`}</span>
                                        </div>
                                        {hoveredStep === index && !isRouteConfirmed && index > 0 && (
                                            <div className="step-move-controls">
                                                <button className="move-step-button up" onClick={() => handleMoveStep(index, 'up')} disabled={isLoadingProgress || isStepLocked}></button>
                                                <button className="move-step-button down" onClick={() => handleMoveStep(index, 'down')} disabled={isLoadingProgress || isStepLocked || index >= plannedRoute.steps.length - 1}></button>
                                            </div>
                                        )}
                                        {index > 0 && <button className="remove-step" onClick={() => handleRemoveStep(index)} disabled={isLoadingProgress || isRouteConfirmed || isStepLocked}>×</button>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            <div className="star-field">
                {stars.map(star => <div key={`star-${star.id}`} className="star" style={{ left: `${star.x}%`, top: `${star.y}%`, width: `${star.size}px`, height: `${star.size}px`, opacity: star.opacity, animationDelay: `${star.delay}s`, animationDuration: `${star.duration}s` }} />)}
            </div>
            <div className="grid-3d"></div>

            <div className="solar-system" style={{
                transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.3s ease'
            }}>
                <div className="celestial-body sun" style={{
                    width: `${solarSystem.sun.radius}px`, height: `${solarSystem.sun.radius}px`,
                    left: `${solarSystem.sun.x}%`, top: `${solarSystem.sun.y}%`
                }} onClick={(e) => { e.stopPropagation(); handleBodyClick(solarSystem.sun); }}>
                    <div className="sun-fire"></div>
                    <div className="sun-core"></div>
                    <div className="sun-corona"></div>
                    <span className="body-label">{solarSystem.sun.name}</span>
                </div>

                {/* --- RENDERIZAÇÃO CORRIGIDA DO S.O.S --- */}
                {/* Calcula a posição baseada no planeta HOSPEDEIRO, não no Sol */}
                {sosSignal && !isSosAdded && (() => {
                    const hostName = sosSignal.name.replace("S.O.S próximo a ", "");
                    const hostPlanet = solarSystem.planets.find(p => p.name === hostName);

                    if (!hostPlanet) return null;

                    const hostX = solarSystem.sun.x + Math.cos(hostPlanet.angle) * hostPlanet.orbitRadius;
                    const hostY = solarSystem.sun.y + Math.sin(hostPlanet.angle) * hostPlanet.orbitRadius;

                    const sosOffsetX = 3;
                    const sosOffsetY = -3;

                    return (
                        <div className="celestial-body sos-signal"
                            style={{
                                left: `${hostX + sosOffsetX}%`,
                                top: `${hostY + sosOffsetY}%`,
                                transform: 'translate(-50%, -50%)',
                                position: 'absolute'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleBodyClick({ name: sosSignal.name });
                            }}
                        >
                            <div className="sos-pulse"></div>
                            <div className="label-container">
                                <span className="body-label sos-label">{sosSignal.name}</span>
                            </div>
                        </div>
                    );
                })()}

                {/* --- RENDERIZAÇÃO DOS PLANETAS --- */}
                {solarSystem.planets.map((planet, index) => {
                    const planetX = solarSystem.sun.x + Math.cos(planet.angle) * planet.orbitRadius;
                    const planetY = solarSystem.sun.y + Math.sin(planet.angle) * planet.orbitRadius;
                    const planetStatus = planet.name === nextDestination ? 'next-destination'
                        : visitedDestinations.includes(planet.name) ? 'visited'
                            : '';
                    return (
                        <React.Fragment key={index}>
                            <div className={`orbit ${planet.isAsteroidBelt ? 'asteroid-belt' : ''} ${planet.isKuiperBelt ? 'kuiper-belt' : ''}`} style={{
                                width: `${planet.orbitRadius * 2}%`, height: `${planet.orbitRadius * 2}%`,
                                left: `${solarSystem.sun.x}%`, top: `${solarSystem.sun.y}%`
                            }}></div>
                            {(planet.radius > 0 || planet.isStation) && (
                                <div className={`celestial-body ${planet.isStation ? 'station' : 'planet'}
                                    ${planet.isExoplanet ? 'isExoplanet' : ''}
                                    ${planet.isDwarfPlanet ? 'dwarf-planet' : ''}
                                    ${planetStatus}`}
                                    style={{
                                        width: `${planet.radius}px`, height: `${planet.radius}px`,
                                        left: `${planetX}%`, top: `${planetY}%`,
                                        background: planet.color,
                                        transform: `translate(-50%, -50%) rotate(${rotationAngles[planet.name] || 0}deg)`,
                                        boxShadow: planet.isStation ? `0 0 8px ${planet.color}` : `0 0 15px ${planet.color}`
                                    }}
                                    onClick={(e) => { e.stopPropagation(); handleBodyClick(planet); }}>
                                    {planet.hasRings && (
                                        <div className="planet-rings" style={{
                                            width: `${planet.radius * 2.5}px`,
                                            height: `${planet.radius * 0.6}px`
                                        }}></div>
                                    )}

                                    <div className="label-container">
                                        <span className={`body-label
                                            ${planet.isExoplanet ? 'exoplanet-label' : ''}
                                            ${planet.isDwarfPlanet ? 'dwarf-planet-label' : ''}`}>
                                            {planet.name}
                                        </span>
                                    </div>

                                    {planet.moons.map((moon, moonIndex) => {
                                        const moonX = planetX + Math.cos(moon.angle) * moon.orbitRadius;
                                        const moonY = planetY + Math.sin(moon.angle) * moon.orbitRadius;
                                        const moonStatus = moon.name === nextDestination ? 'next-destination'
                                            : visitedDestinations.includes(moon.name) ? 'visited'
                                                : '';
                                        return (
                                            <div key={moonIndex} className={`celestial-body moon ${moonStatus}`} style={{
                                                width: `${moon.radius}px`, height: `${moon.radius}px`,
                                                left: `${moonX}%`, top: `${moonY}%`,
                                                transform: `translate(-50%, -50%) rotate(${rotationAngles[moon.name] || 0}deg)`
                                            }} onClick={(e) => { e.stopPropagation(); handleBodyClick(moon); }}>

                                                <div className="label-container">
                                                    <span className="body-label moon-label">{moon.name}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
            {selectedBody && (
                <div className="info-panel">
                    <div className="info-panel-header">
                        <h3>{selectedBody.name}</h3>
                        <button className="close-button" onClick={() => setSelectedBody(null)}>×</button>
                    </div>
                    {selectedBody.description && (
                        <div className="info-section">
                            <p style={{ color: '#b2ff59', fontStyle: 'italic' }}>{selectedBody.description}</p>
                        </div>
                    )}
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

export default StellarMapPlan;