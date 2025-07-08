import React from 'react'
import ReactDOM from 'react-dom/client'
import AppWithFavoritesProvider from './App.tsx'
import { BrowserRouter } from 'react-router-dom';
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppWithFavoritesProvider />
    </BrowserRouter>
  </React.StrictMode>,
)
