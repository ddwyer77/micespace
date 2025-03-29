import './App.css'
import React, { Fragment, useEffect, useState } from 'react';
import VideoGenerator from './components/VideoGenerator'
import Header from './components/Header';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Admin from './pages/Admin';
import SignIn from './components/SignIn';
import Error from './pages/Error';
import Explore from './pages/Explore';
import Campaigns from './pages/Campaigns';
import Create from './pages/Create';
import Feed from './pages/VideoFeed';
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
              <Route exact path="/" element={<Explore />} />
              <Route path="/create" element={<Create />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/feed" element={<Feed />} />
              <Route path ="/error" element={<Error />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            </Routes>
      </Fragment>
  </Router>
  )
}

export default App
