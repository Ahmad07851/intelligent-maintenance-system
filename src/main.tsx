import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== "undefined") {
  window.alert = (message: string) => {
    // Safe DOM alert modal to bypass iframe block
    const existing = document.getElementById("custom-alert-overlay");
    if (existing) {
      existing.remove();
    }

    const overlay = document.createElement("div");
    overlay.id = "custom-alert-overlay";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.backgroundColor = "rgba(15, 23, 42, 0.65)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "999999";
    overlay.style.padding = "16px";

    overlay.innerHTML = `
      <div style="background-color: white; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); border: 1px solid #E2E8F0; max-width: 400px; width: 100%; padding: 24px; font-family: sans-serif; box-sizing: border-box;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div style="background-color: #FEF3C7; border-radius: 50%; padding: 8px; color: #D97706; display: flex; align-items: center; justify-content: center;">
            <svg style="width: 24px; height: 24px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <span style="font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; display: block;">System Message</span>
            <span style="font-size: 14px; font-weight: 700; color: #1E293B;">Intelligent CMMS</span>
          </div>
        </div>
        <p style="font-size: 13px; color: #475569; line-height: 1.5; margin: 16px 0; font-weight: 500;">${message}</p>
        <button id="custom-alert-btn" style="width: 100%; background-color: #0F172A; hover:background-color: #1E293B; color: white; border: none; border-radius: 8px; padding: 10px; font-size: 12px; font-weight: 700; cursor: pointer; transition: background-color 0.2s;">
          Acknowledge
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    const btn = document.getElementById("custom-alert-btn");
    if (btn) {
      btn.focus();
      btn.onclick = () => {
        overlay.remove();
      };
    }
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
