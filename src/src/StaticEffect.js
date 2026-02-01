import React, { useRef, useEffect } from 'react';

const StaticEffect = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const width = canvas.width;
        const height = canvas.height;
        let animationFrameId;

        // Função que desenha o ruído
        const drawNoise = () => {
            // Cria um buffer de imagem para manipulação rápida dos pixels
            const imageData = ctx.createImageData(width, height);
            const buffer32 = new Uint32Array(imageData.data.buffer);
            const len = buffer32.length;

            // Preenche o buffer com pixels de cor cinza aleatória
            for (let i = 0; i < len; i++) {
                // Gera um valor de cinza aleatório (0 a 255)
                const randomGray = Math.random() * 255;
                // Define a cor do pixel (R, G, B são iguais para escala de cinza, A é 255 para opaco)
                buffer32[i] =
                    (255 << 24) |        // Alpha
                    (randomGray << 16) | // Blue
                    (randomGray << 8) |  // Green
                    randomGray;          // Red
            }

            // Coloca a imagem gerada no canvas
            ctx.putImageData(imageData, 0, 0);
        };

        // Loop de animação
        const render = () => {
            drawNoise();
            animationFrameId = window.requestAnimationFrame(render);
        };

        render();

        // Limpa a animação quando o componente é desmontado
        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width="300"  // Largura base, o CSS vai esticar
            height="200" // Altura base, o CSS vai esticar
            style={{ width: '100%', height: '100%' }}
        />
    );
};

export default StaticEffect;