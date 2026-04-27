/*
 * Echo helper
 *
 * Exports: createEcho(token) -> Promise<Echo|null>
 * - Returns a configured Echo instance (laravel-echo) using socket.io-client.
 * - If no token or running on server, returns null.
 * - Call `echo.disconnect()` to clean up.
 *
 * Install:
 *   npm install laravel-echo socket.io-client
 * or
 *   yarn add laravel-echo socket.io-client
 *
 * Notes:
 * - Uses dynamic imports so the module can be loaded in browser-only codepaths.
 * - Host is taken from `import.meta.env.VITE_WS_URL` or `window.location.origin`.
 */

export async function createEcho(token) {
  if (!token) return null;
  if (typeof window === 'undefined') return null;

  try {
    const wsHost = import.meta.env.VITE_WS_URL || window.location.origin;

    // dynamic import so bundlers don't try to include server-only code on SSR
    const ioModule = await import('socket.io-client');
    const EchoModule = await import('laravel-echo');

    // socket.io-client may expose default or named export
    const io = ioModule.io || ioModule.default || ioModule;
    const Echo = EchoModule.default || EchoModule;

    // some Echo builds expect a global `io` variable
    try { window.io = io; } catch (e) { /* ignore */ }

    const echo = new Echo({
      broadcaster: 'socket.io',
      host: wsHost,
      client: io,
      auth: { headers: { Authorization: 'Bearer ' + token } },
      transports: ['websocket', 'polling'],
    });

    // safe disconnect helper
    echo.disconnectSafe = () => {
      try { echo.disconnect(); } catch (e) { /* ignore */ }
    };

    return echo;
  } catch (err) {
    // don't throw — return null when echo cannot be initialized
    console.warn('createEcho failed to initialize:', err);
    return null;
  }
}

export default createEcho;
