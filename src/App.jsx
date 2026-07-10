import React from 'react';
import { view } from '@risingstack/react-easy-state';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Game from './components/Game';
import ErrorBox from './components/ErrorBox';
import InfoBox from './components/InfoBox';
import ConnectionBanner from './components/ConnectionBanner';
import AdminApp from './components/admin/AdminApp';
import { StaticDataProvider } from './components/StaticDataProvider';

const App = view(() => (
  <BrowserRouter>
    <StaticDataProvider>
      <Routes>
        <Route path="/" element={<Game />} />
        <Route
          path="games/:gameSlug/facilitator"
          element={<Game view="facilitator" />}
        />
        <Route
          path="games/:gameSlug/projector"
          element={<Game view="projector" />}
        />
        <Route
          path="games/:gameSlug/review"
          element={<Game view="review" />}
        />
        <Route path="admin/*" element={<AdminApp />} />
      </Routes>
      <ErrorBox />
      <InfoBox />
      <ConnectionBanner />
    </StaticDataProvider>
  </BrowserRouter>
));

export default App;
