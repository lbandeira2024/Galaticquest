import React, { useState, useEffect, useRef, useMemo } from 'react';
import './MandalaVirtudes.css';

// --- Dados estáticos movidos para fora do componente para otimização ---

// Lista de todas as virtudes e seus IDs.
const VIRTUES = [
    { id: 'simplicidade', name: 'Simplicidade' },
    { id: 'protagonismo', name: 'Protagonismo' },
    { id: 'respeito-diversidade', name: 'Respeito à diversidade' },
    { id: 'conhecer-si', name: 'Conhecer a si mesmo' },
    { id: 'ter-proposito', name: 'Ter um propósito' },
    { id: 'agir-verdade', name: 'Agir com a verdade' },
    { id: 'coragem', name: 'Coragem' },
    { id: 'disciplina', name: 'Disciplina' },
    { id: 'perseveranca', name: 'Perseverança' },
    { id: 'humildade', name: 'Humildade' },
    { id: 'generosidade', name: 'Generosidade' },
    { id: 'paixao-pessoas', name: 'Paixão por Pessoas' }
];
const ALL_VIRTUE_IDS = VIRTUES.map(v => v.id);

// Mapeamento de IDs de desafios para nomes de Quizz
const QUIZZ_NAMES = {
    'CSD1': 'CSD Marte', 'CSD2': 'CSD Ceres', 'CSD3': 'CSD Netuno',
    'CSD4': 'CSD Plutão', 'CSD5': 'CSD Jupiter', 'CSD6': 'CSD Fobos',
    'CSD7': 'CSD Vênus', 'CSD8': 'CSD Saturno', 'CSD9': 'CSD Lua',
    'CSD10': 'CSD Haumea', 'CSD11': 'CSD Kappa', 'CSD12': 'CSD Trappist',
    'CSD13': 'CSD Makemake', 'CSD14': 'CSD Éris', 'CSD15': 'CSD Urano',
    'CSD16': 'CSD Mercurio', 'CSD17': 'CSD Deimos', 'CSD18': 'CSD Vesta', 'CSD19': 'CSD Próxima Cent',
    'CSD20': 'CSD Palla', 'CSD21': 'CSD Tritão', 'CSD22': 'CSD Europa', 'CSD23': 'CSD Kepler',
    'CSD24': 'CSD Encelado', 'CSD25': 'CSD Gaminedes',
};

// --- Regras de negócio centralizadas, extraídas do arquivo PPT fornecido ---
const VIRTUE_RULES = {
    'CSD1-A': {
        special: ['agir-verdade', 'humildade', 'generosidade', 'paixao-pessoas', 'simplicidade', 'protagonismo', 'respeito-diversidade'],
        green: ['perseveranca', 'disciplina', 'coragem', 'ter-proposito', 'conhecer-si'],
    },
    'CSD1-B': {
        special: ['conhecer-si', 'disciplina', 'agir-verdade', 'humildade', 'generosidade', 'paixao-pessoas', 'simplicidade', 'protagonismo', 'respeito-diversidade'],
        green: ['perseveranca', 'coragem', 'ter-proposito'], showImage: true
    },

    'CSD1-C': {
        special: ['disciplina', 'ter-proposito'],
        green: ['coragem', 'perseveranca', 'protagonismo'],
        red: ['conhecer-si', 'humildade', 'paixao-pessoas', 'agir-verdade', 'simplicidade', 'respeito-diversidade', 'generosidade'],
    },
    'CSD1-D': {
        special: ['respeito-diversidade'],
        red: ['conhecer-si', 'coragem', 'humildade', 'disciplina', 'paixao-pessoas', 'agir-verdade', 'perseveranca', 'simplicidade', 'ter-proposito', 'generosidade', 'protagonismo'],
    },
    'CSD2-A': {
        red: ['humildade'],
        green: ['respeito-diversidade', 'conhecer-si', 'coragem', 'humildade', 'disciplina', 'paixao-pessoas', 'agir-verdade', 'perseveranca', 'simplicidade', 'ter-proposito', 'generosidade', 'protagonismo'], showImage: true
    },
    'CSD2-B': {
        red: ['conhecer-si'],
        green: ['humildade', 'respeito-diversidade', 'coragem', 'humildade', 'disciplina', 'paixao-pessoas', 'agir-verdade', 'perseveranca', 'simplicidade', 'ter-proposito', 'generosidade', 'protagonismo'],
    },

    'CSD2-C': {
        special: ['disciplina', 'agir-verdade', 'ter-proposito', 'conhecer-si', 'simplicidade', 'respeito-diversidade'],
        red: ['humildade', 'generosidade'],
        green: ['coragem', 'paixao-pessoas', 'perseveranca', 'protagonismo'],
    },
    'CSD2-D': {
        special: ['ter-proposito'],
        red: ALL_VIRTUE_IDS.filter(id => id !== 'ter-proposito'),
    },
    'CSD3-A': {
        special: ['coragem', 'generosidade', 'paixao-pessoas', 'protagonismo', 'respeito-diversidade'],
        red: ['simplicidade', 'perseveranca', 'ter-proposito'],
        green: ['conhecer-si', 'humildade', 'disciplina', 'agir-verdade'],
    },
    'CSD3-B': {
        special: ['humildade', 'protagonismo', 'disciplina', 'coragem', 'agir-verdade', 'ter-proposito'],
        red: ['conhecer-si', 'paixao-pessoas', 'perseveranca', 'simplicidade', 'respeito-diversidade', 'generosidade'],
    },
    'CSD3-C': { green: ALL_VIRTUE_IDS, showImage: true },

    'CSD3-D': {
        special: ['humildade', 'agir-verdade', 'conhecer-si'],
        red: ['coragem', 'protagonismo', 'respeito-diversidade', 'generosidade', 'paixao-pessoas', 'disciplina', 'perseveranca', 'simplicidade', 'ter-proposito'],
    },

    'CSD4-A': {
        green: ['perseveranca', 'coragem', 'ter-proposito', 'protagonismo'],
        red: ['conhecer-si', 'humildade', 'disciplina', 'paixao-pessoas', 'agir-verdade', 'simplicidade', 'respeito-diversidade', 'generosidade'],
    },
    'CSD4-B': {
        green: ALL_VIRTUE_IDS.filter(id => id !== 'simplicidade'),
        red: ['simplicidade'], showImage: true
    },
    'CSD4-C': {
        special: ['perseveranca', 'coragem', 'ter-proposito'],
        red: ['conhecer-si', 'humildade', 'disciplina', 'paixao-pessoas', 'agir-verdade', 'simplicidade', 'respeito-diversidade', 'generosidade', 'protagonismo'],
    },

    'CSD4-D': {
        special: ['coragem', 'ter-proposito'],
        red: ['perseveranca', 'conhecer-si', 'humildade', 'disciplina', 'paixao-pessoas', 'agir-verdade', 'simplicidade', 'respeito-diversidade', 'generosidade', 'protagonismo'],
    },

    'CSD5-A': {
        green: ['disciplina', 'ter-proposito'],
        red: ['coragem', 'perseveranca', 'conhecer-si', 'humildade', 'paixao-pessoas', 'agir-verdade', 'simplicidade', 'respeito-diversidade', 'generosidade', 'protagonismo'],
    },

    'CSD5-B': {
        green: ['protagonismo'],
        special: ['disciplina', 'simplicidade'],
        red: ['ter-proposito', 'coragem', 'perseveranca', 'conhecer-si', 'humildade', 'paixao-pessoas', 'agir-verdade', 'respeito-diversidade', 'generosidade', 'protagonismo'],
    },

    'CSD5-C': {
        special: ['agir-verdade', 'respeito-diversidade', 'generosidade'],
        red: ['ter-proposito', 'coragem', 'perseveranca', 'conhecer-si', 'humildade', 'paixao-pessoas', 'protagonismo', 'disciplina', 'simplicidade'], showImage: true
    },

    'CSD5-D': {
        special: ['agir-verdade', 'paixao-pessoas', 'generosidade'],
        red: ['respeito-diversidade', 'ter-proposito', 'coragem', 'perseveranca', 'conhecer-si', 'humildade', 'protagonismo', 'disciplina', 'simplicidade'],
    },

    'CSD6-A': {
        special: ['coragem', 'disciplina', 'ter-proposito', 'protagonismo'],
        red: ['agir-verdade', 'paixao-pessoas', 'generosidade', 'respeito-diversidade', 'perseveranca', 'conhecer-si', 'humildade', 'simplicidade'],
    },

    'CSD6-B': {
        special: ['coragem', 'ter-proposito'],
        red: ['protagonismo', 'disciplina', 'agir-verdade', 'paixao-pessoas', 'generosidade', 'respeito-diversidade', 'perseveranca', 'conhecer-si', 'humildade', 'simplicidade'],
    },

    'CSD6-C': {
        red: ['humildade', 'paixao-pessoas', 'simplicidade', 'agir-verdade', 'respeito-diversidade'],
        green: ['coragem', 'ter-proposito', 'protagonismo', 'disciplina', 'generosidade', 'perseveranca', 'conhecer-si'],
    },

    'CSD6-D': {
        red: ['paixao-pessoas', 'generosidade', 'disciplina'],
        green: ['humildade', 'coragem', 'ter-proposito', 'protagonismo', 'perseveranca', 'conhecer-si', 'simplicidade', 'agir-verdade', 'respeito-diversidade'],
    },

    'CSD7-A': {
        special: ['coragem', 'agir-verdade', 'ter-proposito', 'protagonismo', 'perseveranca'],
        green: ['disciplina'],
        red: ['humildade', 'conhecer-si', 'simplicidade', 'respeito-diversidade', 'paixao-pessoas', 'generosidade'],
    },

    'CSD7-B': {
        special: ['disciplina', 'coragem', 'protagonismo', 'perseveranca', 'generosidade', 'ter-proposito'],
        red: ['humildade', 'conhecer-si', 'simplicidade', 'respeito-diversidade', 'paixao-pessoas', 'agir-verdade'], showImage: true
    },

    'CSD7-C': {
        special: ['paixao-pessoas', 'generosidade', 'ter-proposito', 'conhecer-si'],
        red: ['disciplina', 'coragem', 'protagonismo', 'perseveranca', 'humildade', 'simplicidade', 'respeito-diversidade', 'agir-verdade'],
    },

    'CSD7-D': {
        special: ['ter-proposito', 'perseveranca', 'disciplina', 'protagonismo'],
        green: ['coragem'],
        red: ['paixao-pessoas', 'generosidade', 'conhecer-si', 'humildade', 'simplicidade', 'respeito-diversidade', 'agir-verdade'],
    },


    'CSD8-A': {
        special: ['protagonismo', 'respeito-diversidade'],
        green: ['conhecer-si', 'humildade', 'ter-proposito', 'perseveranca', 'coragem'],
        red: ['paixao-pessoas', 'generosidade', 'simplicidade', 'agir-verdade', 'disciplina',],
    },

    'CSD8-B': {
        special: ['protagonismo', 'generosidade', 'respeito-diversidade', 'conhecer-si', 'ter-proposito', 'agir-verdade'],
        green: ['humildade', 'paixao-pessoas'],
        red: ['simplicidade', 'disciplina', 'perseveranca', 'coragem'],
    },

    'CSD8-C': {
        green: ['disciplina', 'perseveranca', 'coragem', 'protagonismo', 'generosidade', 'respeito-diversidade', 'conhecer-si', 'ter-proposito', 'agir-verdade'],
        red: ['simplicidade', 'humildade', 'paixao-pessoas'],
    },

    'CSD8-D':
        { green: ALL_VIRTUE_IDS, showImage: true },


    'CSD9-A': {
        special: ['humildade', 'agir-verdade'],
        red: ['conhecer-si', 'paixao-pessoas', 'generosidade'],
        green: ['protagonismo', 'respeito-diversidade', 'ter-proposito', 'simplicidade', 'disciplina', 'perseveranca', 'coragem'],
    },

    'CSD9-B': {
        special: ['paixao-pessoas'],
        red: ['humildade', 'conhecer-si', 'generosidade', 'simplicidade'],
        green: ['agir-verdade', 'protagonismo', 'respeito-diversidade', 'ter-proposito', 'disciplina', 'perseveranca', 'coragem'],
    },

    'CSD9-C': {
        special: ['humildade'],
        red: ['conhecer-si'],
        green: ['generosidade', 'simplicidade', 'paixao-pessoas', 'agir-verdade', 'protagonismo', 'respeito-diversidade', 'ter-proposito', 'disciplina', 'perseveranca', 'coragem'], showImage: true
    },

    'CSD9-D': {
        special: ['humildade', 'paixao-pessoas', 'disciplina', 'agir-verdade'],
        red: ['conhecer-si', 'generosidade', 'simplicidade'],
        green: ['protagonismo', 'respeito-diversidade', 'ter-proposito', 'perseveranca', 'coragem'],
    },

    'CSD10-A': {
        special: ['humildade', 'paixao-pessoas', 'generosidade', 'respeito-diversidade', 'disciplina', 'perseveranca', 'agir-verdade'],
        red: ['conhecer-si', 'simplicidade'],
        green: ['protagonismo', 'ter-proposito', 'coragem'],
    },

    'CSD10-B': {
        special: ['paixao-pessoas', 'generosidade', 'respeito-diversidade', 'disciplina', 'conhecer-si', 'simplicidade'],
        red: ['agir-verdade'],
        green: ['protagonismo', 'humildade', 'perseveranca', 'ter-proposito', 'coragem'], showImage: true
    },

    'CSD10-C': {
        special: ['respeito-diversidade', 'conhecer-si', 'ter-proposito'],
        red: ['agir-verdade', 'disciplina', 'humildade', 'paixao-pessoas', 'generosidade', 'simplicidade'],
        green: ['protagonismo', 'perseveranca', 'coragem'],
    },

    'CSD10-D': {
        special: ['perseveranca', 'disciplina', 'respeito-diversidade'],
        red: ['agir-verdade', 'humildade', 'paixao-pessoas', 'generosidade', 'simplicidade', 'conhecer-si', 'ter-proposito'],
        green: ['protagonismo', 'coragem'],
    },

    'CSD11-A': {
        special: ['coragem'],
        red: ['agir-verdade', 'simplicidade', 'conhecer-si', 'ter-proposito', 'protagonismo', 'perseveranca', 'disciplina', 'respeito-diversidade'],
        green: ['humildade', 'generosidade', 'paixao-pessoas'],
    },

    'CSD11-B': {
        red: ['simplicidade', 'conhecer-si'],
        green: ['coragem', 'agir-verdade', 'humildade', 'generosidade', 'paixao-pessoas', 'ter-proposito', 'protagonismo', 'perseveranca', 'disciplina', 'respeito-diversidade'],
    },

    'CSD11-C': {
        red: ['simplicidade', 'disciplina'],
        green: ['humildade', 'generosidade', 'paixao-pessoas', 'agir-verdade', 'coragem', 'conhecer-si', 'ter-proposito', 'protagonismo', 'perseveranca', 'respeito-diversidade'],
    },

    'CSD11-D': { green: ALL_VIRTUE_IDS, showImage: true },

    'CSD12-A': {
        red: ['disciplina', 'generosidade', 'simplicidade'],
        green: ['coragem', 'respeito-diversidade', 'humildade', 'paixao-pessoas', 'agir-verdade', 'conhecer-si', 'ter-proposito', 'protagonismo', 'perseveranca'], showImage: true,
    },

    'CSD12-B': {
        special: ['disciplina'],
        red: ['conhecer-si', 'generosidade'],
        green: ['humildade', 'paixao-pessoas', 'agir-verdade', 'simplicidade', 'ter-proposito', 'protagonismo', 'perseveranca', 'respeito-diversidade', 'coragem'],
    },

    'CSD12-C': {
        red: ['conhecer-si', 'disciplina'],
        green: ['generosidade', 'humildade', 'paixao-pessoas', 'agir-verdade', 'simplicidade', 'ter-proposito', 'protagonismo', 'perseveranca', 'respeito-diversidade', 'coragem'],
    },

    'CSD12-D': {
        special: ['disciplina', 'coragem', 'agir-verdade', 'respeito-diversidade'],
        red: ['conhecer-si', 'generosidade', 'humildade', 'paixao-pessoas', 'simplicidade', 'perseveranca'],
        green: ['ter-proposito', 'protagonismo'],
    },

    'CSD13-A': {
        special: ['disciplina', 'generosidade', 'simplicidade'],
        green: ['ter-proposito', 'protagonismo', 'conhecer-si', 'humildade', 'paixao-pessoas', 'perseveranca', 'coragem', 'agir-verdade', 'respeito-diversidade'],
    },

    'CSD13-B': {

        special: ['conhecer-si'],
        red: ['disciplina', 'agir-verdade', 'generosidade', 'paixao-pessoas', 'simplicidade'],
        green: ['ter-proposito', 'protagonismo', 'coragem', 'respeito-diversidade', 'humildade', 'perseveranca'],
    },

    'CSD13-C': {
        special: ['disciplina', 'conhecer-si'],
        red: ['humildade'],
        green: ['ter-proposito', 'protagonismo', 'generosidade', 'paixao-pessoas', 'simplicidade', 'perseveranca', 'coragem', 'agir-verdade', 'respeito-diversidade'], showImage: true,
    },

    'CSD13-D': {
        special: ['disciplina', 'perseveranca', 'agir-verdade', 'ter-proposito', 'protagonismo'],
        red: ['generosidade', 'paixao-pessoas', 'simplicidade', 'respeito-diversidade', 'humildade', 'conhecer-si'],
        green: ['coragem'],
    },

    'CSD14-A': {
        special: ['conhecer-si'],
        red: ['coragem', 'generosidade', 'paixao-pessoas', 'simplicidade', 'respeito-diversidade', 'humildade', 'disciplina', 'perseveranca', 'agir-verdade', 'ter-proposito', 'protagonismo'],
    },

    'CSD14-B': {
        special: ['generosidade', 'simplicidade'],
        green: ['humildade', 'disciplina', 'conhecer-si', 'ter-proposito', 'protagonismo', 'paixao-pessoas', 'perseveranca', 'coragem', 'agir-verdade', 'respeito-diversidade'], showImage: true,
    },

    'CSD14-C': {
        special: ['agir-verdade', 'ter-proposito', 'respeito-diversidade'],
        red: ['disciplina', 'perseveranca', 'generosidade', 'paixao-pessoas', 'simplicidade', 'humildade', 'conhecer-si', 'coragem'],
        green: ['protagonismo'],
    },

    'CSD14-D': {
        special: ['generosidade', 'paixao-pessoas', 'protagonismo', 'agir-verdade', 'perseveranca', 'ter-proposito', 'humildade', 'conhecer-si'],
        green: ['disciplina', 'coragem', 'simplicidade', 'respeito-diversidade'],

    },

    'CSD15-A': {
        special: ['simplicidade'],
        red: ['generosidade', 'humildade', 'paixao-pessoas', 'conhecer-si', 'perseveranca', 'respeito-diversidade'],
        green: ['protagonismo', 'disciplina', 'coragem', 'agir-verdade', 'ter-proposito'],
    },

    'CSD15-B': {
        special: ['generosidade', 'disciplina', 'agir-verdade', 'ter-proposito'],
        red: ['simplicidade', 'humildade', 'conhecer-si', 'perseveranca'],
        green: ['protagonismo', 'coragem', 'paixao-pessoas', 'respeito-diversidade'],
    },

    'CSD15-C': {
        green: ALL_VIRTUE_IDS, showImage: true
    },

    'CSD15-D': {
        special: ['generosidade', 'disciplina', 'agir-verdade', 'ter-proposito', 'conhecer-si', 'perseveranca', 'simplicidade', 'paixao-pessoas', 'respeito-diversidade'],
        red: ['humildade'],
        green: ['protagonismo', 'coragem'],
    },

    'CSD16-A': {
        green: ['protagonismo', 'coragem', 'generosidade', 'disciplina', 'agir-verdade', 'ter-proposito', 'conhecer-si', 'perseveranca', 'simplicidade', 'paixao-pessoas', 'respeito-diversidade'],
        red: ['humildade'], showImage: true
    },

    'CSD16-B': {
        special: ['disciplina', 'perseveranca', 'simplicidade', 'respeito-diversidade'],
        red: ['humildade', 'generosidade', 'agir-verdade', 'conhecer-si', 'paixao-pessoas'],
        green: ['protagonismo', 'coragem', 'ter-proposito'],
    },

    'CSD16-C': {
        special: ['simplicidade'],
        red: ['coragem', 'humildade', 'generosidade', 'agir-verdade', 'conhecer-si', 'paixao-pessoas', 'disciplina', 'perseveranca', 'respeito-diversidade'],
        green: ['protagonismo', 'ter-proposito'],
    },

    'CSD16-D': {
        special: ['paixao-pessoas', 'ter-proposito'],
        red: ['simplicidade', 'humildade', 'generosidade', 'agir-verdade', 'conhecer-si', 'disciplina', 'perseveranca', 'respeito-diversidade'],
        green: ['protagonismo', 'coragem'],
    },

    'CSD17-A': {
        green: ['protagonismo', 'coragem', 'paixao-pessoas', 'ter-proposito', 'simplicidade', 'humildade', 'generosidade', 'agir-verdade', 'disciplina', 'respeito-diversidade'],
        red: ['conhecer-si', 'perseveranca'],
    },

    'CSD17-B': { green: ALL_VIRTUE_IDS, showImage: true },

    'CSD17-C': {
        special: ['coragem', 'ter-proposito', 'agir-verdade', 'protagonismo'],
        red: ['paixao-pessoas', 'simplicidade', 'humildade', 'generosidade', 'conhecer-si', 'disciplina', 'perseveranca', 'respeito-diversidade'],
    },

    'CSD17-D': {
        special: ['agir-verdade', 'ter-proposito', 'protagonismo', 'disciplina'],
        red: ['paixao-pessoas', 'humildade', 'generosidade', 'simplicidade'],
        green: ['conhecer-si', 'perseveranca', 'respeito-diversidade', 'coragem'],
    },

    'CSD18-A': { green: ALL_VIRTUE_IDS, showImage: true },

    'CSD18-B': {
        green: ['humildade', 'respeito-diversidade', 'conhecer-si'],
        red: ['agir-verdade', 'ter-proposito', 'protagonismo', 'disciplina', 'paixao-pessoas', 'perseveranca', 'coragem', 'generosidade', 'simplicidade'],
    },

    'CSD18-C': {
        red: ['respeito-diversidade', 'conhecer-si', 'ter-proposito',],
        green: ['humildade', 'agir-verdade', 'protagonismo', 'disciplina', 'paixao-pessoas', 'perseveranca', 'coragem', 'generosidade', 'simplicidade'],
    },

    'CSD18-D': {
        red: ['agir-verdade', 'disciplina', 'paixao-pessoas', 'humildade', 'generosidade', 'simplicidade', 'conhecer-si', 'perseveranca', 'respeito-diversidade',],
        green: ['coragem', 'ter-proposito', 'protagonismo'],
    },

    'CSD19-A': {
        red: ALL_VIRTUE_IDS
    },

    'CSD19-B': {
        special: ['ter-proposito', 'coragem', 'simplicidade', 'protagonismo'],
        red: ['agir-verdade', 'paixao-pessoas', 'humildade', 'generosidade', 'disciplina', 'conhecer-si', 'perseveranca', 'respeito-diversidade'],
    },

    'CSD19-C': {
        special: ['ter-proposito', 'perseveranca', 'protagonismo'],
        red: ['agir-verdade', 'paixao-pessoas', 'humildade', 'generosidade', 'disciplina', 'conhecer-si', 'respeito-diversidade', 'coragem', 'simplicidade'],
    },

    'CSD19-D': { green: ALL_VIRTUE_IDS, showImage: true },

    'CSD20-A': {
        special: ['ter-proposito', 'perseveranca', 'coragem', 'protagonismo', 'simplicidade'],
        red: ['agir-verdade', 'paixao-pessoas', 'humildade', 'generosidade', 'disciplina', 'conhecer-si', 'respeito-diversidade'],
    },

    'CSD20-B': {
        red: ['humildade', 'conhecer-si'],
        green: ['ter-proposito', 'perseveranca', 'coragem', 'protagonismo', 'simplicidade', 'agir-verdade', 'paixao-pessoas', 'generosidade', 'disciplina', 'respeito-diversidade'], showImage: true
    },

    'CSD20-C': {
        special: ['agir-verdade', 'protagonismo'],
        red: ['conhecer-si', 'paixao-pessoas', 'humildade', 'generosidade', 'respeito-diversidade'],
        green: ['perseveranca', 'coragem', 'disciplina', 'simplicidade', 'ter-proposito'],
    },

    'CSD20-D': {
        red: ['coragem', 'agir-verdade', 'simplicidade', 'conhecer-si', 'protagonismo'],
        green: ['perseveranca', 'disciplina', 'ter-proposito', 'paixao-pessoas', 'humildade', 'generosidade', 'respeito-diversidade'],
    },

    'CSD21-A': {
        red: ['humildade', 'generosidade', 'respeito-diversidade'],
        green: ['perseveranca', 'disciplina', 'ter-proposito', 'paixao-pessoas', 'coragem', 'agir-verdade', 'simplicidade', 'conhecer-si', 'protagonismo'],
    },

    'CSD21-B': {
        special: ['agir-verdade', 'respeito-diversidade', 'protagonismo'],
        red: ['conhecer-si', 'paixao-pessoas', 'generosidade', 'perseveranca', 'coragem', 'disciplina', 'simplicidade', 'ter-proposito'],
        green: ['humildade'],
    },

    'CSD21-C': {
        green: ALL_VIRTUE_IDS, showImage: true
    },

    'CSD21-D': {
        red: ['agir-verdade', 'disciplina', 'respeito-diversidade', 'conhecer-si'],
        green: ['coragem', 'simplicidade', 'protagonismo', 'perseveranca', 'ter-proposito', 'paixao-pessoas', 'humildade', 'generosidade'],
    },

    'CSD22-A': {
        green: ALL_VIRTUE_IDS, showImage: true
    },

    'CSD22-B': {
        special: ['simplicidade'],
        red: ['paixao-pessoas', 'generosidade', 'respeito-diversidade'],
        green: ['humildade', 'conhecer-si', 'perseveranca', 'coragem', 'disciplina', 'ter-proposito', 'agir-verdade', 'protagonismo'],
    },

    'CSD22-C': {
        special: ['agir-verdade'],
        red: ['humildade', 'conhecer-si', 'perseveranca', 'coragem', 'disciplina', 'ter-proposito', 'protagonismo', 'simplicidade', 'paixao-pessoas', 'generosidade', 'respeito-diversidade'],
    },

    'CSD22-D': {
        special: ['humildade', 'perseveranca', 'coragem', 'disciplina', 'ter-proposito', 'protagonismo', 'generosidade'],
        red: ['agir-verdade', 'conhecer-si', 'respeito-diversidade', 'simplicidade', 'paixao-pessoas'],
    },

    'CSD23-A': {
        special: ['conhecer-si', 'simplicidade', 'humildade', 'perseveranca', 'coragem', 'disciplina', 'ter-proposito', 'protagonismo'],
        red: ['paixao-pessoas', 'generosidade', 'respeito-diversidade', 'agir-verdade'],
    },

    'CSD23-B': {
        green: ['conhecer-si', 'humildade', 'perseveranca', 'coragem', 'disciplina', 'ter-proposito', 'protagonismo', 'paixao-pessoas', 'generosidade', 'respeito-diversidade', 'agir-verdade'],
        red: ['simplicidade'],
    },

    'CSD23-C': { green: ALL_VIRTUE_IDS, showImage: true },

    'CSD23-D': { red: ALL_VIRTUE_IDS },

    'CSD24-A': {

        red: ['paixao-pessoas', 'generosidade', 'humildade', 'simplicidade', 'respeito-diversidade', 'disciplina'],
        special: ['conhecer-si', 'perseveranca', 'coragem', 'ter-proposito', 'agir-verdade', 'protagonismo'],
    },

    'CSD24-B': {

        red: ['conhecer-si', 'disciplina', 'simplicidade', 'paixao-pessoas', 'generosidade', 'respeito-diversidade'],
        green: ['humildade', 'perseveranca', 'coragem', 'ter-proposito', 'agir-verdade', 'protagonismo'],
    },

    'CSD24-C': {
        red: ALL_VIRTUE_IDS
    },

    'CSD24-D': {
        green: ALL_VIRTUE_IDS, showImage: true
    },

    'CSD25-A': {
        green: ALL_VIRTUE_IDS, showImage: true
    },

    'CSD25-B': {
        red: ['humildade', 'conhecer-si'],
        special: ['perseveranca', 'coragem', 'disciplina', 'ter-proposito', 'agir-verdade', 'protagonismo', 'paixao-pessoas', 'generosidade', 'respeito-diversidade', 'simplicidade'],
    },

    'CSD25-C': {
        special: ['disciplina', 'ter-proposito', 'simplicidade', 'generosidade'],
        red: ['agir-verdade', 'humildade', 'conhecer-si', 'perseveranca', 'coragem', 'protagonismo', 'paixao-pessoas', 'respeito-diversidade'],
    },

    'CSD25-D': {
        red: ALL_VIRTUE_IDS,
    },
};

const MandalaVirtudes = ({ onClose, groupId }) => {
    const [virtueStates, setVirtueStates] = useState({});
    const [csdSpecificLetter, setCsdSpecificLetter] = useState(null);
    const [showCupertinoImage, setShowCupertinoImage] = useState(false);
    const [quizzChallenges, setQuizzChallenges] = useState([]);
    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!groupId) {
            setQuizzChallenges([]);
            return;
        }
        setQuizzChallenges([]);
        const fetchAllChallenges = async () => {
            try {
                const response = await fetch(`http://localhost:5000/group/${groupId}/all-cds-challenges`);
                const data = await response.json();
                if (data.success && Array.isArray(data.challenges)) {
                    setQuizzChallenges(data.challenges);
                } else {
                    setQuizzChallenges([]);
                }
            } catch (error) {
                console.error("Falha ao buscar os desafios do grupo:", error);
                setQuizzChallenges([]);
            }
        };
        fetchAllChallenges();
    }, [groupId]);

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setContainerSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const challengesMap = useMemo(() => new Map(quizzChallenges.map(c => [c.desafioId, c])), [quizzChallenges]);

    const getQuizzLinkText = (desafioId) => QUIZZ_NAMES[desafioId] || `QUIZZ ${desafioId.replace('CSD', '')}`;

    const handleQuizzClick = (challenge) => {
        const { desafioId, escolhaIdLetter } = challenge;
        const ruleKey = `${desafioId}-${escolhaIdLetter}`;
        const rule = VIRTUE_RULES[ruleKey];

        setShowCupertinoImage(rule?.showImage || false);
        setCsdSpecificLetter(escolhaIdLetter);

        const newStates = {};

        if (rule) {
            const redIds = rule.red || [];
            const specialIds = rule.special || [];

            ALL_VIRTUE_IDS.forEach(id => {
                if (redIds.includes(id)) {
                    newStates[id] = 'red';
                } else if (specialIds.includes(id)) {
                    newStates[id] = 'special';
                } else {
                    newStates[id] = 'green';
                }
            });
        } else {
            ALL_VIRTUE_IDS.forEach(id => {
                newStates[id] = 'blue';
            });
        }
        setVirtueStates(newStates);
    };

    const renderVirtues = () => {
        const faceCenterX = containerSize.width * 0.47;
        const faceCenterY = containerSize.height * 0.499;
        const orbitRadius = Math.min(containerSize.width, containerSize.height) * 0.18 * 2.37;

        const stateToClassMap = {
            red: 'filled-dot-red',
            special: 'filled-dot-special',
            green: 'filled-dot',
            blue: 'filled-dot-blue',
        };

        return VIRTUES.map((virtue, index) => {
            const angle = (index * 30) * (Math.PI / 180);
            const x = faceCenterX + orbitRadius * Math.cos(angle) - containerSize.width / 2;
            const y = faceCenterY + orbitRadius * Math.sin(angle) - containerSize.height / 2;

            const state = virtueStates[virtue.id] || 'empty';
            const dotClass = stateToClassMap[state] || 'empty-dot';

            return (
                <div key={virtue.id} className="virtue-item" style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={dotClass} />
                        <div className="virtue-name-full">{virtue.name}</div>
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="mandala-virtudes-container" ref={containerRef}>
            <div className="mandala-virtudes-layout">
                <div className="mandala-sidebar">
                    <h3 className="journey-question">Nossa Jornada está sendo virtuosa?</h3>
                    <div className="virtue-legend">
                        <div><span className="legend-dot green" /><span>A virtude se aplica</span></div>
                        <div><span className="legend-dot red" /><span>A virtude não se aplica</span></div>
                        <div><span className="legend-dot yellow" /><span>O vício aparece como decisão</span></div>
                    </div>
                    <div className="quizz-link-container">
                        {Array.from({ length: 25 }).map((_, index) => {
                            const expectedChallengeId = `CSD${index + 1}`;
                            const challenge = challengesMap.get(expectedChallengeId);
                            return (
                                <div
                                    key={index}
                                    onClick={challenge ? () => handleQuizzClick(challenge) : undefined}
                                    className={`quizz-link ${challenge ? '' : 'quizz-link-empty'}`}
                                >
                                    {challenge ? getQuizzLinkText(challenge.desafioId) : `Vazio ${index + 1}`}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="mandala-circle-wrapper">
                    <div className="mandala-circle">
                        {containerSize.width > 0 && renderVirtues()}
                        <button className="close-button" onClick={onClose}>&times;</button>
                    </div>
                    {csdSpecificLetter && (
                        <div className="csd-letter-display">{csdSpecificLetter}</div>
                    )}
                    {showCupertinoImage && (
                        <div style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 1006 }}>
                            <img src="../images/ST CUPERTINO/st_cupertino_comemorando.gif" alt="St Cupertino Comemorando" style={{ maxWidth: '300px', height: '210px' }} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MandalaVirtudes;