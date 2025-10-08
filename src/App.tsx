import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { OnboardingPage } from '@/pages/Onboarding';
import { HomePage } from '@/pages/Home';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OnboardingPage />} />
        <Route path="/home" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
