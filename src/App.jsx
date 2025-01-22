import './App.css'
import VideoGenerator from './components/VideoGenerator'
import Header from './components/Header'

function App() {

  return (
    <div className="flex justify-center items-center w-screen flex-col p-4 border h-screen relative">
      <Header />
      <div className="max-w-2xl flex flex-col gap-4">
        <VideoGenerator />
      </div>
    </div>
  )
}

export default App
