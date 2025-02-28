import React, { useState, useEffect, useContext } from 'react'
import { useLocation, useNavigate, } from 'react-router-dom'
import axios from '../config/axios.js'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket.js'
import  { UserContext } from '../context/UserProvider.jsx'


const Project = () => {

  const location = useLocation()

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [project, setProject] = useState(location.state.project)
  const [message, setMessage] = useState('')
  const { user } = useContext(UserContext)
  const messageBoxRef = React.useRef(null);

  const [users, setUsers] = useState([])

  const handleUserClick = (id) => {
    setSelectedUserIds(prevSelectedUserId => {
      const newSeletedUserId = new Set(prevSelectedUserId)
      if (newSeletedUserId.has(id)) {
        newSeletedUserId.delete(id)
      } else {
        newSeletedUserId.add(id)
      }
      return newSeletedUserId
    })
  };

  function addCollaborators() {

    axios.put("/projects/add-user", {
      projectId: location.state.project._id,
      users: Array.from(selectedUserIds)
    }).then(res => {
      console.log(res.data)
      setIsModalOpen(false)
    }).catch(err => {
      console.log(err)
    })

  }



  function send() { 
    const trimmedMessage = message.trim(); // Remove extra spaces
  
    if (trimmedMessage === "") return; // Prevent sending empty messages
  
    sendMessage('project-message', {
      message: trimmedMessage,
      sender: user.name
    });
  
    appendOutgoingMessage(trimmedMessage); // Display the message
  
    setMessage(""); // Clear input field
  }

  useEffect(() => {

    initializeSocket(project._id)

    receiveMessage('project-message', data => {
      console.log(data)
      appendIncomingMessage(data)
    })

    axios.get(`/projects/get-project/${location.state.project._id}`).then(res => {
      console.log(res.data.project)
      setProject(res.data.project)
    })

    axios.get('/users/all')
      .then(res => {

        setUsers(res.data.users)

      })
      .catch(err => {

        console.log(err)

      })

  }, [])


  function appendIncomingMessage(messageObject) {
    if (!messageBoxRef.current) return; // Prevent errors
  
    const message = document.createElement('div');
    message.classList.add('message', 'flex', 'flex-col', 'rounded-lg', 'p-2', 'max-w-60', 'bg-gray-700', 'text-white', 'self-start');
    message.innerHTML = `<small class='text-xs text-blue-500'>${messageObject.sender}</small>
                  <p class='text-sm'>${messageObject.message}</p>`;
  
    messageBoxRef.current.appendChild(message);
    scrollToBottom();
  }
  

  function appendOutgoingMessage(message) {
    if (!messageBoxRef.current) return; // Prevent errors
  
    const newMessage = document.createElement('div');
    newMessage.classList.add('ml-auto', 'message', 'flex', 'flex-col', 'rounded-lg', 'p-2', 'max-w-60', 'bg-gray-700', 'text-white', 'self-start');
    newMessage.innerHTML = `<p class='text-sm'>${message}</p>`;
  
    messageBoxRef.current.appendChild(newMessage);
    scrollToBottom();
  }

  function scrollToBottom() {
    if (messageBoxRef.current) {
      messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
    }
  }


  return (
    <main className='h-screen w-screen flex bg-gray-900'>

      <section className='left relative h-full flex flex-col min-w-70 bg-gray-800'>

        <div className="chats h-full flex flex-col">
          <header className='rounded-b flex justify-between items-center w-full bg-gray-950 p-3 px-4'>
            <h2 className='text-white text-lg font-semibold'>{project.name}</h2>
            <button
              onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
              className='cursor-pointer text-blue-500 text-xl'>
              <i className="ri-group-fill"></i>
            </button>
          </header>

          <div className='conversation-area flex flex-grow flex-col max-w-70 p-2 overflow-y-auto'>
            <div 
            ref={messageBoxRef}
            className='message-box flex-grow flex flex-col gap-2 overflow-y-auto scrollbar-hide'>
              
            </div>
          </div>

          <div className='inputField w-full flex items-center bg-gray-950 p-2 rounded-b'>
            <input
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              className='p-2 px-4 border-none flex-grow outline-none bg-gray-700 text-white rounded-lg'
              type="text" placeholder='Type a message...' />
            <button 
            onClick={send}
            className='text-blue-500 text-2xl px-2 cursor-pointer'>
              <i className='ri-send-plane-fill'></i>
            </button>
          </div>
        </div>

        <div className={`sidePanel flex flex-col gap-2 h-full w-full absolute bg-gray-800 transition-all ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'}`}>

          <header className='rounded-b flex justify-between items-center p-3 px-4 bg-gray-950 '>
            <div className='flex gap-1'>
              <i className={project.users.length <= 1 ? "ri-user-fill text-xl text-blue-500" : "ri-group-fill text-blue-500 text-xl"}></i>
              <h2 className='text-white text-lg font-semibold items-center'>{project.users.length <= 1 ? `Collaborator :` : `Collaborators :`} {project.users.length}</h2>
            </div>
            <div className="buttons flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(!isModalOpen)}
                className='addCollaborator text-xl text-blue-500 cursor-pointer'>
                <i className="ri-user-add-fill"></i>
              </button>
              <button
                onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                className='text-xl cursor-pointer'>
                <i className="ri-close-large-line text-blue-500"></i>
              </button>
            </div>
          </header>

          <div className="users flex flex-col gap-2 ">

            {project.users && project.users.map(user => {

              return (
                <div className='user 
              flex gap-2 items-center bg-gray-900 rounded-lg mx-1 hover:bg-gray-700 cursor-pointer'>

                  <div className='profile
                 rounded-full p-2 py-1 m-1 text-xl text-blue-500'>
                    <i className="ri-user-fill"></i>
                  </div>

                  <div className="userName text-white font-semibold text-xl">
                    {user.name}
                  </div>

                </div>
              )

            })}
          </div>
        </div>

      </section>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-none">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-[90%] max-w-md ">
            <h2 className="text-white text-xl font-semibold mb-4 text-center">Select a Collaborator</h2>
            <div className="addCollaborators max-h-50 overflow-y-auto flex flex-col gap-1">
              {users.map(user => (
                <div
                  key={user.id}
                  className={`user flex gap-2 items-center rounded-lg mx-1 cursor-pointer ${Array.from(selectedUserIds).indexOf(user._id) !== -1 ? 'bg-gray-700' : 'bg-gray-900'} hover:bg-gray-700`}
                  onClick={() => handleUserClick(user._id)}
                >

                  <div className='profile rounded-full p-2 py-1 m-1 text-xl text-blue-500'>
                    <i className="ri-user-fill"></i>
                  </div>

                  <div className="userName text-white font-semibold text-xl">
                    {user.name}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between gap-4 mt-4 mx-2">
              <button
                onClick={() => setIsModalOpen(!isModalOpen)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Close
              </button>
              <button
                onClick={addCollaborators}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Add Collaborator
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  )
}

export default Project
