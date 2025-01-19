import { useState } from 'react'
import logoSlogan from './assets/images/logo_slogan.png'
import './App.css'
import VideoGenerator from './components/VideoGenerator'

function App() {

  return (
    <div className="flex justify-center items-center w-screen flex-col p-4">
      <div className="max-w-2xl flex flex-col gap-4">
        <img src={logoSlogan} alt="micespace logo" />
        <VideoGenerator />
      </div>
    </div>
  )
}

export default App
