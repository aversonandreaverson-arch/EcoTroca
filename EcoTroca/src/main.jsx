import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'virtual:windi.css'

import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
