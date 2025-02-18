import './App.css'
import React, { Fragment, useEffect, useState } from 'react';
import VideoGenerator from './components/VideoGenerator'
import Header from './components/Header';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Admin from './pages/Admin';
import SignIn from './components/SignIn';
import Error from './pages/Error';
import { initializeFirebase } from './utils/storage';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  useEffect(() => {
    initializeFirebase();
}, []);
  return (
  <Router>
    <Fragment>
          <Header />
          <ToastContainer position="top-left" autoClose={6000} />
            <Routes>
              <Route exact path="/" element={<VideoGenerator />} />
              <Route path ="/error" element={<Error />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            </Routes>
      </Fragment>
  </Router>
  )
}

export default App
