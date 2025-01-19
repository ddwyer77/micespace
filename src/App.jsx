import { useState } from 'react'
import logoSlogan from './assets/images/logo_slogan.png'
import './App.css'
import VideoGenerator from './components/VideoGenerator'

function App() {

  return (
    <div className="flex justify-center items-center w-screen flex-col gap-12">
      <div className="max-w-2xl">
        <img src={logoSlogan} className="" alt="React logo" />
        <VideoGenerator />
      </div>
    </div>
  )
}

export default App
