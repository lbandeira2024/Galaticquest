// src/components/BackgroundAudio.jsx
import { useEffect, useRef } from 'react';

export default function BackgroundAudio({ url }) {
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = 0.3;
    audio.play();
    audioRef.current = audio;
    return () => audio.pause();
  }, [url]);

  return null;
}
