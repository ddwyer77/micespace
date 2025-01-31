import './App.css'
import React, { Fragment, useEffect, useState } from 'react';
import VideoGenerator from './components/VideoGenerator'
import Header from './components/Header';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Admin from './pages/Admin';
import SignIn from './components/SignIn';
import { initializeFirebase } from './utils/storage';

function App() {
  useEffect(() => {
    initializeFirebase();
}, []);
  return (
  <Router>
    <Fragment>
          <Header />
            <Routes>
              <Route exact path="/" element={<VideoGenerator />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            </Routes>
      </Fragment>
  </Router>
  )
}

export default App
