import React from 'react';
import { createRoot } from 'react-dom/client';
import { App, Projector } from './App';
import './style.css';
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).has('output') ? <Projector /> : <App />);
