import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const nameRef = useRef(null); // Reference to the username input
  const authRef = useRef(null); // Reference to show error message
  const navigate = useNavigate();

  // Handle pressing Enter key to join room
  useEffect(() => {
    const handleEnter = (e) => {
      if (e.key === 'Enter') {
        handleJoin();
      }
    };

    document.addEventListener('keydown', handleEnter);
    return () => document.removeEventListener('keydown', handleEnter);
  }, []);

  // Handle join button click
  const handleJoin = () => {
    const name = nameRef.current.value.trim();

    if (!name) {
      authRef.current.innerText = 'Name is required';
      authRef.current.classList.add('text-red-500');
      return;
    }

    authRef.current.innerText = '';
    navigate('/room');
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-4 items-center">
        <h1 className="text-2xl font-bold text-gray-800">Enter Room</h1>

        {/* Username Input */}
        <input
          type="text"
          placeholder="Enter your name"
          ref={nameRef}
          className="w-full px-4 py-3 border-2 border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        {/* Error Message */}
        <p ref={authRef} className="h-4 text-sm text-red-500"></p>

        {/* Join Button */}
        <button
          onClick={handleJoin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition duration-300"
        >
          Join
        </button>
      </div>
    </main>
  );
};

export default Home;
