// Init script that replaces window.WebSocket with a controllable mock so
// Playwright tests can drive the chess app's network layer without a backend.
//
// Usage in a spec:
//
//   await page.addInitScript(MOCK_WEBSOCKET_INIT_SCRIPT);
//   await page.goto('/game/test');
//   // Once the app has connected, deliver server messages:
//   await page.evaluate((msg) => window.__deliver(msg), { action: 'gameState', ... });
//   // And inspect what the client sent:
//   const sent = await page.evaluate(() => window.__sentMessages);
//
// The script must be a plain string passed to addInitScript so it runs in the
// page's browser context. It is intentionally JS (not TS): the test imports it
// as a string constant.

export const MOCK_WEBSOCKET_INIT_SCRIPT = `
(() => {
  const sent = [];
  let liveSocket = null;

  class MockWebSocket {
    constructor(url) {
      this.url = url;
      this.readyState = 0; // CONNECTING
      this.onopen = null;
      this.onmessage = null;
      this.onclose = null;
      this.onerror = null;
      liveSocket = this;
      // Fire onopen on the next macrotask so the consumer has time to
      // attach handlers (matches real WebSocket behavior).
      setTimeout(() => {
        this.readyState = 1; // OPEN
        if (this.onopen) this.onopen({});
      }, 0);
    }
    send(data) {
      try {
        sent.push(JSON.parse(data));
      } catch (e) {
        sent.push(data);
      }
    }
    close() {
      this.readyState = 3; // CLOSED
      if (this.onclose) this.onclose({});
    }
    addEventListener(type, fn) {
      if (type === 'open') this.onopen = fn;
      else if (type === 'message') this.onmessage = fn;
      else if (type === 'close') this.onclose = fn;
      else if (type === 'error') this.onerror = fn;
    }
    removeEventListener() {}
  }
  MockWebSocket.CONNECTING = 0;
  MockWebSocket.OPEN = 1;
  MockWebSocket.CLOSING = 2;
  MockWebSocket.CLOSED = 3;

  window.WebSocket = MockWebSocket;
  window.__sentMessages = sent;
  window.__deliver = (msg) => {
    if (!liveSocket) throw new Error('No live WebSocket to deliver to');
    if (liveSocket.onmessage) {
      liveSocket.onmessage({ data: JSON.stringify(msg) });
    }
  };
  window.__waitForSocket = () => new Promise((resolve) => {
    const tick = () => {
      if (liveSocket && liveSocket.readyState === 1) resolve();
      else setTimeout(tick, 10);
    };
    tick();
  });
})();
`;
