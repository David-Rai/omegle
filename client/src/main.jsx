import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { SocketProvider } from './context/Socket.jsx'
import {createBrowserRouter,RouterProvider} from 'react-router-dom'
import Home from './pages/Home.jsx'
import Room from './pages/Room.jsx'

const router=createBrowserRouter([
  {
    path:'/',
    element:<Home />
  },
  {
    path:'/room',
    element:<Room />
  }
])

createRoot(document.getElementById('root')).render(
<SocketProvider>
<RouterProvider router={router} />
</SocketProvider>
)
