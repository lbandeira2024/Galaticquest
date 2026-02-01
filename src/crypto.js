import CryptoJS from 'crypto-js';

// NOVA CHAVE SECRETA DE 256 BITS PARA MELHOR OFUSCAÇÃO.
// É uma string longa e aleatória, ideal para ser usada como chave simétrica.
// Mantenha-a como um segredo.
const SECRET_KEY = "GQ_256BitKey!#@$ACEE-MissionToMars-Alpha-2025-Xyz7890";

/**
 * Criptografa um objeto JavaScript em uma string Base64 segura para URL.
 * @param {object} data - O objeto contendo os parâmetros do jogador.
 * @returns {string} O texto cifrado codificado com encodeURIComponent.
 */
export const encryptData = (data) => {
    try {
        const jsonString = JSON.stringify(data);
        // Criptografa usando AES
        const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
        // Codifica o resultado final em Base64 seguro para URL, substituindo + e /
        return encodeURIComponent(encrypted);
    } catch (e) {
        console.error("Erro na criptografia:", e);
        return "";
    }
};

/**
 * Descriptografa uma string Base64 segura para URL de volta para um objeto JavaScript.
 * @param {string} encryptedText - O texto cifrado lido da URL.
 * @returns {object|null} O objeto descriptografado ou null em caso de falha.
 */
export const decryptData = (encryptedText) => {
    if (!encryptedText) return null;
    try {
        // Primeiro, decodifica a URL (reverte encodeURIComponent)
        const decodedText = decodeURIComponent(encryptedText);
        // Descriptografa
        const bytes = CryptoJS.AES.decrypt(decodedText, SECRET_KEY);
        const decryptedJson = bytes.toString(CryptoJS.enc.Utf8);

        // Retorna o objeto JSON
        return JSON.parse(decryptedJson);
    } catch (e) {
        // Isso pode ocorrer se a chave for errada ou o dado for manipulado
        console.error("Erro na descriptografia (dado inválido ou chave incorreta):", e);
        return null;
    }
};