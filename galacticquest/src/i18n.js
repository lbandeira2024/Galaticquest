import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

i18n
    .use(HttpApi) // Carrega traduções de um servidor (neste caso, da pasta /public)
    .use(LanguageDetector) // Detecta o idioma do usuário
    .use(initReactI18next) // Passa a instância do i18n para o react-i18next
    .init({
        supportedLngs: ['pt', 'en', 'es', 'it'], // Idiomas suportados
        fallbackLng: 'pt', // Idioma padrão caso a detecção falhe
        detection: {
            order: ['cookie', 'localStorage', 'path', 'subdomain'],
            caches: ['cookie'],
        },
        backend: {
            // Caminho para os arquivos de tradução na pasta /public
            loadPath: '/locales/{{lng}}/translation.json',
        },
        react: {
            useSuspense: false,
        },
    });

export default i18n;