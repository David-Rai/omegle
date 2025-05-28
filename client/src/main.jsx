import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { SocketProvider } from './context/Socket.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Room from './pages/Room.jsx'
import { PeerProvider } from './context/PeerConnection.jsx'
import { RoomProvider } from './context/RoomName.jsx'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/room',
    element: <Room />
  }
])

createRoot(document.getElementById('root')).render(
  <SocketProvider>
    <PeerProvider>
      <RoomProvider>
        <RouterProvider router={router} />
        <ToastContainer position="top-right" autoClose={1500} />
      </RoomProvider>
    </PeerProvider>
  </SocketProvider>
)
