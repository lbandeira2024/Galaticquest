import React, { useState, useEffect, useRef } from 'react';
import './CloudAnimation.css';

const CloudAnimation = ({ audioTime }) => {
  const [currentImage, setCurrentImage] = useState('ACEE.png');
  const [opacity, setOpacity] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [effectClass, setEffectClass] = useState('');
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5,
      speed: Math.random() * 0.5,
    }));

    const animateStars = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";

      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
        star.y += star.speed;
        if (star.y > canvas.height) star.y = 0;
      });

      requestAnimationFrame(animateStars);
    };

    animateStars();

    return () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, []);

  useEffect(() => {
    if (audioTime < 12) {
      // ACEE.png - imagem estática centralizada
      setPosition({ x: 0, y: 0 });
      setScale(1);
      setEffectClass('image-acee');
      setOpacity(1);
      if (currentImage !== 'ACEE.png') {
        setCurrentImage('ACEE.png');
      }
    }
    else if (audioTime >= 16 && audioTime < 25) {
      // clouds.gif - com efeitos de movimento
      if (currentImage !== 'clouds.gif') {
        setCurrentImage('clouds.gif');
        setOpacity(0.95);
      }
      const shakeIntensity = 0.3;
      const moveX = Math.sin(audioTime * 0.5) * 20 * shakeIntensity;
      const moveY = Math.cos(audioTime * 0.3) * 10 * shakeIntensity;
      setPosition({ x: moveX, y: moveY });
      setScale(1 + Math.sin(audioTime * 0.2) * 0.05);
      setEffectClass('image-cloud');
    } else if (audioTime >= 25 && audioTime < 35) {
      // estatica.png - com efeito de ruído
      if (currentImage !== 'estatica.png') {
        setCurrentImage('estatica.png');
        setOpacity(0.95);
      }
      setEffectClass('static-noise');
      setPosition({
        x: Math.random() * 10 - 5,
        y: Math.random() * 10 - 5
      });
    } else if (audioTime >= 35) {
      // Fase final - apenas estrelas
      setCurrentImage('');
      setEffectClass('');
      setOpacity(0);
    }
  }, [audioTime, currentImage]);

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        zIndex: -1
      }} />

      <canvas
        ref={canvasRef}
        className="stars-canvas"
        style={{
          opacity: audioTime >= 35 ? 1 : 0,
          transition: 'opacity 3s ease-in-out',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 0
        }}
      />

      {currentImage && (
        <div
          className={`image-transition ${effectClass}`}
          style={{
            backgroundImage: `url(${process.env.PUBLIC_URL}/images/${currentImage})`,
            opacity: opacity,
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
        />
      )}
    </>
  );
};

export default CloudAnimation;