import React, { useContext, useState, useEffect } from 'react'
import { UserContext } from '../context/UserProvider.jsx'
import axios from '../config/axios'
import { useNavigate } from 'react-router-dom'

const Home = () => {

  const { user } = useContext(UserContext)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [project, setProject] = useState([])

  const [loggedInUser, setLoggedInUser] = useState([])

  const navigate = useNavigate()

  function createProject(e) {
    e.preventDefault()
    console.log({ projectName })

    axios.post('/projects/create', {
      name: projectName,

    })
      .then((res) => {
        console.log(res)
        setIsModalOpen(false)
      })
      .catch((error) => {
        console.log(error)
      })
  }

  useEffect(() => {

    axios.get('/projects/all')
      .then((res) => {

        setProject(res.data.projects)
        

      })
      .catch(err => {
        console.log(err)
      })

      axios.get('/users/all').then(res => {

        setLoggedInUser(res.data.loggedInUser.name)
  
      }).catch(err => {
  
        console.log(err)
  
      })
    },
  [])

  return (
    <main className='text-white bg-gray-900 h-screen'>
      <header className='p-10 text-5xl font-semibold'>Hello, <span className='text-blue-500'>{loggedInUser}</span> </header>
      <section className='flex items-center justify-center box-border flex-col h-[70%]'>
      <h1 className='mb-2.5 text-2xl font-semibold'>Create a new Project</h1>
      <div className=''>
        <button
          onClick={() => setIsModalOpen(true)}
          className='bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-7 rounded-lg shadow-md transition-all duration-300 cursor-pointer'><span className='mr-2'>New Project</span>
          <i className="ri-add-large-fill"></i>
        </button>
      </div>
      <h1 className='mb-2 mt-2.5 text-2xl font-semibold'>Your Projects</h1>
      <div className='flex w-[80%] gap-1 justify-center'>
        {
          project.map((project) => (
            <div key={project._id}
              onClick={() => {
                navigate(`/project`, {
                  state: { project }
                })
              }}
              className=' project bg-white text-blue-600 hover:bg-blue-200 font-semibold py-3 px-5 rounded-lg shadow-md transition-all duration-300 cursor-pointer flex gap-2 flex-col justify-center'>
              <h1 className='font-bold flex text-center justify-center '>{project.name}</h1>

              <div className='flex gap-1 justify-center items-center'>
                <h1 >
                  <i className={project.users.length <= 1 ? "ri-user-fill" : "ri-group-fill"}></i>
                  {project.users.length <=1 ? `Collaborator :` : `Collaborators :`}
                </h1>
                {project.users.length}
              </div>
            </div>
          ))
        }
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-transparent bg-opacity-50 backdrop-blur-sm ">
          <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-[400px]">
            <h2 className="text-white text-xl font-semibold mb-4 text-center">Enter Project Name</h2>

            <form
              onSubmit={createProject}>
              <input
                type="text"
                onChange={(e) => { setProjectName(e.target.value) }}
                value={projectName}
                className="w-full px-4 py-2 mb-4 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Project Name"
                // onClick={() => {setProjectName('')}}
                required
              />

              <div className="flex justify-between gap-4">
                <button
                  type="button"
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </section>
    </main>
  )
}

export default Home
