import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import 'leaflet/dist/leaflet.css';
import './i18n';
import App from './app';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

registerSW({
  immediate: true,
  onOfflineReady() {
    // Surface a trace so QA can verify caching during preview builds.
    console.info('Stereonet Explorer is ready to work offline.');
  }
});

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
