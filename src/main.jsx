import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { IciI18nProvider } from './i18n/IciI18nContext.jsx'
import './styles/global.css'
import './styles/ici.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <IciI18nProvider>
      <App />
    </IciI18nProvider>
  </React.StrictMode>
)
