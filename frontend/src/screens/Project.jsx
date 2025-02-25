import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'


const Project = () => {

  const location = useLocation()

  console.log(location.state)

  return (
    <main className='h-screen w-screen flex'>

      <section className='left h-full flex flex-col min-w-70 bg-gray-800'>

        <header className='rounded-b flex justify-between items-center w-full bg-gray-900 p-3 px-4'>
          <h2 className='text-white text-lg font-semibold'>Chat</h2>
          <button className='cursor-pointer text-white text-xl'>
            <i className="ri-group-fill"></i>
          </button>
        </header>

        <div className='conversation-area flex flex-grow flex-col max-w-70 p-3 overflow-y-auto'>
          <div className='message-box flex-grow flex flex-col gap-2'>
            <div className='incoming message flex flex-col rounded-lg p-2 max-w-60 bg-gray-700 text-white self-start'>
              <small className='text-xs text-gray-400'>test@gmail.com</small>
              <p className='text-sm'>Lorem ipsum dolor sit amet. Lorem ium dolor s elit.</p>
            </div>
            <div className='outgoing message flex flex-col rounded-lg p-2 max-w-60 bg-blue-600 text-white self-end'>
              <small className='text-xs text-gray-300 text-right'>test@gmail.com</small>
              <p className='text-sm'>Lorem ipsum dolor sit amet. Lorem ium dolor s elit.</p>
            </div>
          </div>
        </div>

        <div className='inputField w-full flex items-center bg-gray-900 p-2 rounded-b'>
          <input
            className='p-2 px-4 border-none flex-grow outline-none bg-gray-700 text-white rounded-lg'
            type="text" placeholder='Type a message...' />
          <button className='text-blue-500 text-2xl px-2'>
            <i className='ri-send-plane-fill'></i>
          </button>
        </div>

      </section>

    </main>
  )
}

export default Project
