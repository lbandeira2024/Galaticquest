import React from 'react';

// ErrorBoundary — captura qualquer erro de RENDER que escape das blindagens
// pontuais (ex: as adicionadas em DecolagemMarte.js) e mostra o erro na tela
// em vez de deixar o React desmontar tudo silenciosamente (tela branca).
//
// IMPORTANTE: Error Boundary só pega erros de RENDER (JSX, corpo do
// componente). Erros dentro de setTimeout/setInterval/requestAnimationFrame
// ou dentro de handlers async (como o game loop) NÃO passam por aqui — esses
// precisam do try/catch manual que já existe no gameLoop. As duas coisas se
// complementam: o try/catch já cobre o loop, o ErrorBoundary cobre o render.
//
// USO:
//   import ErrorBoundary from './ErrorBoundary';
//   ...
//   <ErrorBoundary>
//     <DecolagemMarte {...props} />
//   </ErrorBoundary>
//
// Coloque o mais perto possível de DecolagemMarte (não precisa ser no
// App.js inteiro) para não perder o resto do app (menu, login, etc.) se
// só a tela de voo quebrar.

class ErrorBoundary extends React.Component {
  
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {

    // Log completo no console — é isso que faltava pra "ver o erro" em vez
    // de só a tela branca. Copie esse stack e me manda se acontecer de novo.
    console.error('[ERROR BOUNDARY] Crash capturado no render:', error);
    console.error('[ERROR BOUNDARY] Component stack:', errorInfo?.componentStack);
    this.setState({ errorInfo });

    // Opcional: enviar pro backend pra registrar sem depender do jogador
    // abrir o console. Descomente e ajuste a URL se quiser isso.
    // fetch(`${API_BASE_URL}/log-client-error`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     message: error?.message,
    //     stack: error?.stack,
    //     componentStack: errorInfo?.componentStack,
    //     timestamp: new Date().toISOString(),
    //   }),
    // }).catch(() => {});
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a1a',
          color: '#00aaff',
          fontFamily: 'monospace',
          textAlign: 'center',
          padding: '24px',
        }}>
          <h2 style={{ color: '#ff4444', marginBottom: '12px' }}>
            ⚠ Erro na tela de voo
          </h2>
          <p style={{ maxWidth: '480px', marginBottom: '16px' }}>
            Algo deu errado e o jogo não conseguiu continuar renderizando.
            O erro foi registrado no console (F12) para diagnóstico.
          </p>
          <pre style={{
            maxWidth: '90vw',
            overflow: 'auto',
            background: '#111',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.8em',
            color: '#ff8888',
            textAlign: 'left',
          }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            onClick={this.handleReload}
            style={{
              marginTop: '20px',
              padding: '10px 24px',
              background: '#00aaff',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;