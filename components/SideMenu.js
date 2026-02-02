// src/components/SideMenu.jsx
export default function SideMenu({ planet, onClose }) {
    return (
      <div className="absolute top-0 left-0 h-full w-64 bg-black/80 text-white p-5 z-10 shadow-xl">
        <h2 className="text-2xl font-bold mb-3">{planet.name}</h2>
        <p className="text-sm text-gray-300 mb-4">{planet.info}</p>
        <ul className="text-sm">
          <li><strong>Tamanho:</strong> {planet.size}x Terra</li>
          <li><strong>Órbita:</strong> {planet.orbitRadius} AU</li>
          <li><strong>Velocidade Orbital:</strong> {planet.speed}</li>
        </ul>
        <button
          onClick={onClose}
          className="mt-6 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
        >
          Fechar</button>
      </div>
    );
  }