.route - monitor {
  padding: 15px;
  color: #fff;
  font - family: 'Courier New', monospace;
  text - align: center;
}

.route - monitor h4 {
  margin - bottom: 15px;
  font - size: 1em;
  color: rgba(11, 223, 50, 0.789);
  text - shadow: 0 0 5px rgba(13, 255, 0, 0.848);
}

.route - box {
  display: flex;
  align - items: center;
  justify - content: space - between;
  background: rgba(0, 20, 40, 0.8);
  border: 1px solid rgba(0, 180, 255, 0.3);
  border - radius: 15px; /* Borda um pouco mais suave */
  padding: 10px 15px; /* Encolhido para poupar espaço */
  box - shadow: inset 0 0 15px rgba(0, 80, 150, 0.4);
  min - height: 80px; /* Reduzido drasticamente de 140px */
  height: auto;
  position: relative;
  flex - direction: column;
}

.planet {
  font - size: 0.8em;
  text - align: center;
}

.planet - icon {
  width: 24px;   /* Caixa do ícone bem menor */
  height: 24px;
  font - size: 20px; /* Ícone menor */
  display: flex;
  align - items: center;
  justify - content: center;
  margin: 0 auto;
  line - height: 1;
}

.planet span {
  display: block;
  margin - top: 3px; /* Aproximou o texto do planeta */
  font - size: 0.7em;
  color: #7f7;
  text - shadow: 0 0 3px #7f7;
}

/* Transição normal */
.route - line.current - position {
  transition: left 0.8s cubic - bezier(0.25, 0.1, 0.25, 1);
}

.route - line {
  width: 100 %;
  height: 1px;
  background: repeating - linear - gradient(to right,
    yellow 0 1px,
    transparent 3px 5px);
  position: relative;
  margin: 15px 0; /* REDUZIDO de 40px para 15px! (Poupa muita altura) */
}

.current - position {
  position: absolute;
  top: 0;
  transform: translate(-50 %, -50 %);
  display: flex;
  flex - direction: column;
  align - items: center;
  gap: 5px;
  will - change: left;
  /* Otimização de performance */
}

.current - position span {
  font - size: 0.65em;
  color: orange;
  text - shadow: 0 0 4px orange;
}

/* Durante dobra espacial */
.is - dobra - active.route - line.current - position {
  transition: left 0.2s linear;
}

.pulse - dot {
  width: 8px; /* Ponto da nave um pouco mais discreto */
  height: 8px;
  background - color: orange;
  border - radius: 50 %;
  animation: pulse 1.5s infinite;
  margin - bottom: 12px; /* Reduzido de 25px */
}

@keyframes pulse {
  0 % {
    transform: scale(1);
    opacity: 1;
  }

  50 % {
    transform: scale(1.5);
    opacity: 0.5;
  }

  100 % {
    transform: scale(1);
    opacity: 1;
  }
}

.distance - readout {
  margin - top: 12px; /* Reduzido de 25px */
  font - size: 0.75em;
  color: yellow;
  text - shadow: 0 0 4px yellow;
}