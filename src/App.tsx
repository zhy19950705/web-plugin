import { useState } from 'react'
import { Button } from 'antd'
import UpdateElectron from '@/components/update'
import logoVite from './assets/logo-vite.svg'
import logoElectron from './assets/logo-electron.svg'
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