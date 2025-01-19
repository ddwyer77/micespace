import { useState } from 'react'
import logo from './assets/images/logo.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <img src={logo} style={{ width: '400px', height: '400px' }} alt="React logo" />
      <h1>MiceSpace</h1>
    </>
  )
}

export default App
