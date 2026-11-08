import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/500.css';
import '@fontsource/instrument-sans/600.css';
import '@fontsource/space-grotesk/700.css';
import './styles.css';
import { AuthProvider } from './auth';
import { EspacePro } from './composants/EspacePro';
import { Protegee } from './composants/Protegee';
import Connexion from './pages/Connexion';
import Inscription from './pages/Inscription';
import Introuvable from './pages/Introuvable';
import MesOffres from './pages/MesOffres';
import MonCompte from './pages/MonCompte';
import MotDePasseOublie from './pages/MotDePasseOublie';
import TableauDeBord from './pages/TableauDeBord';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
          {/* Espace connecté : barre latérale commune à toutes ces pages */}
          <Route
            element={
              <Protegee>
                <EspacePro />
              </Protegee>
            }
          >
            <Route index element={<TableauDeBord />} />
            <Route path="offres" element={<MesOffres />} />
            <Route path="compte" element={<MonCompte />} />
          </Route>
          <Route path="*" element={<Introuvable />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
