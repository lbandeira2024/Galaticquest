import React, { useState } from 'react';
import './Planet.css';

const Planet = ({ name, radius, color, style }) => {
  const [useFallback, setUseFallback] = useState(false);
  const imagePath = `/images/planets/${name}.png`;

  return (
    <div className="planet" style={style}>
      {!useFallback ? (
        <img
          src={imagePath}
          alt={name}
          className="planet-img"
          style={{
            width: radius * 2,
            height: radius * 2,
            borderRadius: '50%',
          }}
          onError={() => setUseFallback(true)}
        />
      ) : (
        <div
          className="planet-fallback"
          style={{
            width: radius * 2,
            height: radius * 2,
            borderRadius: '50%',
            backgroundColor: color,
          }}
        />
      )}
    </div>
  );
};

export default Planet;
