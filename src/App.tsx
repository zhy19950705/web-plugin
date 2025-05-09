import { useState } from 'react'
import UpdateElectron from '@/components/update'
import './App.css'
import Login from '@/components/Login'

function App() {
  const [count, setCount] = useState(0)
  return (
    <div className='App'>
      <Login />
      {/* <UpdateElectron /> */}
    </div>
  )
}

export default App