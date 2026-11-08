import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/500.css';
import '@fontsource/instrument-sans/600.css';
import '@fontsource/space-grotesk/700.css';
import './styles.css';
import { AuthProvider } from './auth';
import { Protegee } from './composants/Protegee';
import Connexion from './pages/Connexion';
import Inscription from './pages/Inscription';
import Introuvable from './pages/Introuvable';
import TableauDeBord from './pages/TableauDeBord';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route
            path="/"
            element={
              <Protegee>
                <TableauDeBord />
              </Protegee>
            }
          />
          <Route path="*" element={<Introuvable />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
