import React from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import Companies from './pages/Companies';
import Company from './pages/Company';
import Product from './pages/Product';
import './App.css';

function App() {
  return (
    <Router>
      <div className="container">
        <Routes>
          <Route path="/" element={<Companies />} />
          <Route path="/company/:id" element={<Company />} />
          <Route path="/company/:companyId/product/:productId" element={<Product />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;