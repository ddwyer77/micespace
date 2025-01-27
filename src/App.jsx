import './App.css'
import VideoGenerator from './components/VideoGenerator'
import Header from './components/Header';
import Feed from './components/Feed';

function App() {

  return (
    <div className="flex justify-center items-center w-screen flex-col p-4 min-h-screen mt-24 relative">
      <Header />
      <div className="max-w-2xl flex flex-col gap-4">
        <VideoGenerator />
        <Feed />
      </div>
    </div>
  )
}

export default App
