import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { dracula } from "@uiw/codemirror-theme-dracula"; // Correct import


import React, { useState, useEffect, useContext } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from '../config/axios.js'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket.js'
import { UserContext } from '../context/UserProvider.jsx'
import Markdown from 'markdown-to-jsx'
import { getWebContainer } from "../config/webContainer.js";

const Project = () => {
  const location = useLocation()
  const { user } = useContext(UserContext)

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [project, setProject] = useState(location.state.project)
  const [message, setMessage] = useState('')
  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [fileTree, setFileTree] = useState({})
  const [currentFile, setCurrentFile] = useState(null)

  const [openFiles, setOpenFiles] = useState([])
  const [openFolders, setOpenFolders] = useState([])

  const [webContainer, setWebContainer] = useState(null)
  const [reloadKey, setReloadKey] = useState(0);
  const [iframeUrl, setIframeUrl] = useState(null)
  const [runProcess, setRunProcess] = useState(null);

  const messageBoxRef = React.useRef(null)

  const renderFileTree = (tree, path = "") => {
    return Object.keys(tree).map((file) => {
      const currentPath = path ? `${path}/${file}` : file;
      if (typeof tree[file] === "object" && !tree[file].file) {
        return (
          <div key={currentPath} className="folder p-2">
            <button
              onClick={() =>
                setOpenFolders((prev) =>
                  prev.includes(currentPath)
                    ? prev.filter((f) => f !== currentPath)
                    : [...prev, currentPath]
                )
              }
              className="folder-name font-semibold text-lg cursor-pointer hover:bg-gray-700 w-full p-2"
            >
              <i className="ri-folder-fill text-yellow-500"></i> {file}
            </button>
            {openFolders.includes(currentPath) && (
              <div className="pl-4">{renderFileTree(tree[file], currentPath)}</div>
            )}
          </div>
        );
      } else {
        return (
          <button
            key={currentPath}
            onClick={() => {
              if (!tree[file]?.file) return;
              setCurrentFile(currentPath);
              setOpenFiles([...new Set([...openFiles, currentPath])]);
            }}
            className="tree-element cursor-pointer p-2 flex items-center gap-2 hover:bg-gray-700 w-full"
          >
            <i className="ri-file-code-line text-blue-500"></i>
            <p className="font-semibold text-lg">{file}</p>
          </button>
        );
      }
    });
  };


  const getFileContent = (path, tree) => {
    if (!tree || !path) return "";
    const parts = path.split("/");
    let current = tree;

    for (let i = 0; i < parts.length; i++) {
      if (!current[parts[i]]) return "";
      current = current[parts[i]];
    }

    return current?.file?.contents || "";
  };


  const handleUserClick = (id) => {
    setSelectedUserIds(prevSelectedUserIds => {
      const newSelectedUserIds = new Set(prevSelectedUserIds)
      if (newSelectedUserIds.has(id)) {
        newSelectedUserIds.delete(id)
      } else {
        newSelectedUserIds.add(id)
      }
      return newSelectedUserIds
    })
  }

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


  function getColorForSender(sender) {
    let hash = 0
    for (let i = 0; i < sender.length; i++) {
      hash = sender.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 100%, 80%)`
  }


  function send() {
    const trimmedMessage = message.trim()
    if (trimmedMessage === "") return

    const outgoingMessage = {
      sender: { _id: user._id, name: user.name },
      message: trimmedMessage
    }

    sendMessage('project-message', outgoingMessage)
    setMessages(prevMessages => [...prevMessages, outgoingMessage])
    setMessage("")
  }


  function writeAiMessage(message) {

    const messageObject = JSON.parse(message)

    return (
      <div className='ai-reply bg-gray-950 rounded p-0.5 overflow-auto'>
        <Markdown
          children={messageObject.text}
        />
      </div>
    )
  }




  useEffect(() => {

    initializeSocket(project._id)

    if (!webContainer) {
      getWebContainer().then(container => {
        setWebContainer(container);
        console.log("Container Started");
      })
    }

    receiveMessage('project-message', data => {
      console.log("Received Data:", data);

      try {
        // Directly use data.message if it's already an object
        const message = typeof data.message === "string" ? JSON.parse(data.message) : data.message;
        console.log("Parsed Message:", message);

        webContainer?.mount(message.fileTree)

        if (message.fileTree) {
          console.log("File Tree:", message.fileTree);
          setFileTree(message.fileTree);
        }

        setMessages(prevMessages => [...prevMessages, data]);
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    });

    axios.get(`/projects/get-project/${location.state.project._id}`)
      .then(res => {
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

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    if (messageBoxRef.current) {
      messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight
    }
  }, [messages])



//auto reloading server
useEffect(() => {
  if (!webContainer) return;

  async function restartServer() {
    if (runProcess) {
      await runProcess.kill(); // Stop current process
    }

    await webContainer.mount(fileTree); // Update files
    const process = await webContainer.spawn("npm", ["start"]);
    setRunProcess(process);

    process.output.pipeTo(new WritableStream({
      write(chunk) {
        console.log(chunk);
      }
    }));

    webContainer.on("server-ready", (port, url) => {
      console.log("Server running on:", url);
      setIframeUrl(url);
    });
  }

  restartServer();
}, [fileTree]); // Runs whenever fileTree updates



  return (
    <main className='h-screen w-screen flex bg-gray-950 text-white '>
      <section className='left relative h-full flex flex-col max-w-70 bg-gray-800'>
        <div className="chats h-full flex flex-col">
          <header className='rounded-b flex justify-between w-full bg-gray-950 p-3 px-4 h-12'>
            <h2 className="relative text-white text-lg font-semibold whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px] cursor-pointer group">
              {project.name}

              {/* Tooltip - Fixed position taake screen ke andar rahe */}
              <span className="fixed left-1/4 top-14 transform -translate-x-1/2 hidden group-hover:flex 
                     bg-black text-white text-sm px-3 py-1 rounded-md shadow-lg max-w-[90vw] w-max 
                     whitespace-normal break-words z-50">
                {project.name}
              </span>
            </h2>
            <button
              onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
              className='cursor-pointer text-blue-500 text-xl'>
              <i className="ri-group-fill"></i>
            </button>
          </header>

          <div className='conversation-area flex flex-grow flex-col max-w-70 p-2 overflow-y-auto'>
            <div
              ref={messageBoxRef}
              className='message-box flex-grow flex flex-col gap-2 overflow-y-auto'
            >
              {messages.map((msg, index) => {
                const isOutgoing = msg.sender._id === user._id
                return (
                  <div
                    key={index}
                    className={`message flex flex-col rounded-lg p-2 ${msg.sender._id === 'ai' ? 'max-w-full' : 'max-w-60'} bg-gray-700 text-white ${isOutgoing ? 'ml-auto' : 'self-start'}`}
                  >
                    {!isOutgoing && (
                      <small className='text-xs' style={{ color: getColorForSender(msg.sender.name) }}>
                        {msg.sender.name}
                      </small>
                    )}
                    <p className='text-sm'>
                      {msg.sender._id === 'ai' ?
                        writeAiMessage(msg.message)
                        : <div className='max-w-60 overflow-clip'>{msg.message}</div>}
                    </p>
                  </div>
                )
              })}
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
              <h2 className='text-white text-lg font-semibold items-center'>
                {project.users.length <= 1 ? `Collaborator :` : `Collaborators :`} {project.users.length}
              </h2>
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
            {project.users && project.users.map(user => (
              <div
                key={user._id}
                className='user flex gap-2 items-center bg-gray-900 rounded-lg mx-1 hover:bg-gray-700 cursor-pointer'
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
        </div>
      </section>

      <section className="right flex flex-grow h-full">
        <div className="explorer bg-gray-900 h-full w-48 flex flex-col border-r border-gray-700">
          <div className="flex items-center justify-around border-b border-gray-700 h-12">
            <div>EXPLORER</div>
            <div className="text-blue-500 text-xl cursor-pointer">
              <button><i className="ri-folder-add-line"></i></button>
              <button><i className="ri-file-add-line"></i></button>
            </div>
          </div>
          <div className="file-tree w-full p-2">{renderFileTree(fileTree)}</div>
        </div>

        <div className="editor flex-grow h-full w-0 relative">


          {/* {currentFile && ( */}
          <div className="code-editor flex flex-col h-full bg-gray-950 w-full">


            {/* Tabs Section */}
            <div className="top h-12 px-1 flex justify-between w-full bg-gray-900 border-b border-gray-700">
              <div className="tab flex flex-row overflow-y-auto">
                {openFiles.map((file) => (
                  <div key={file} className="header flex items-center hover:bg-gray-800 border-r border-gray-700 whitespace-nowrap">
                    <button
                      onClick={() => setCurrentFile(file)}
                      className="p-2 text-white"
                    >
                      <p className="font-semibold text-lg">{file}</p>
                    </button>
                    <button
                      onClick={() => {
                        const updatedFiles = openFiles.filter((f) => f !== file);
                        setOpenFiles(updatedFiles);
                        if (currentFile === file) {
                          setCurrentFile(updatedFiles.length > 0 ? updatedFiles[0] : null);
                        }
                      }}
                      className="text-xl cursor-pointer pr-2 text-blue-500"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  </div>
                ))}
              </div>

              <div className="actions flex gap-2 py-1 ">
                <button
                  onClick={async () => {
                    await webContainer?.mount(fileTree)

                    
                    const installProcess = await webContainer.spawn("npm", ["install"]);

                    installProcess.output.pipeTo(new WritableStream({
                      write(chunk) {
                        console.log(chunk);
                      }
                    }))


                    // const isProcess = await webContainer?.spawn('ls')

                    // isProcess.output.pipeTo(new WritableStream({
                    //   write(chunk) {
                    //     console.log(chunk);
                    //   }
                    // }))

                  }}

                  className="text-xl text-blue-500 px-4 cursor-pointer bg-gray-950 rounded-lg hover:bg-gray-700"
                >
                  Install
                </button>


                <button
                  onClick={async () => {
                    
                    if (runProcess) {
                      await runProcess.kill();
                    } else {
                      console.log("Process is not running.");
                    }


                    await webContainer.mount(fileTree); // Mount before running

                    const process = await webContainer.spawn("npm", ["start"]);

                    setRunProcess(process);

                    // console.log("Process started:", process);


                    process.output.pipeTo(new WritableStream({
                      write(chunk) {
                        console.log(chunk);
                      }
                    }));

                    webContainer.on("server-ready", (port, url) => {
                      console.log("Server running on:", url);
                      setIframeUrl(url);
                    });
                  }}
                  className="text-xl text-blue-500 px-4 cursor-pointer bg-gray-950 rounded-lg hover:bg-gray-700"
                >
                  Run
                </button>


              </div>
            </div>

            {/* Code Editor Section */}
            <div className="bottom flex w-full flex-grow overflow-y-auto">

              {currentFile && getFileContent(currentFile, fileTree) ? (
                <div className="h-full w-full">
                  <CodeMirror
                    key={currentFile} // Ensures re-render on file change
                    value={getFileContent(currentFile, fileTree) || ""}
                    className=" w-full h-full"
                    theme={dracula}
                    extensions={[javascript()]}
                    height="100%"
                    onChange={(value) => {
                      setFileTree((prevFileTree) => {
                        const newTree = structuredClone(prevFileTree);
                        const parts = currentFile.split("/");
                        let current = newTree;

                        for (let i = 0; i < parts.length - 1; i++) {
                          if (!current[parts[i]]) return prevFileTree;
                          current = current[parts[i]];
                        }

                        if (current[parts[parts.length - 1]]?.file) {
                          current[parts[parts.length - 1]].file.contents = value;
                        }

                        return newTree;
                      });
                    }}
                  />
                </div>








              ) : (
                <div className="h-full w-full">
                  <CodeMirror
                    key="empty-editor"
                    value=""
                    className="w-full h-full"
                    theme={dracula}
                    extensions={[javascript()]}
                    height="100%"
                    placeholder="Start writing your code here..."
                    onChange={(value) => {
                      console.log("Editing empty file:", value);
                    }}
                  />
                </div>
              )}
            </div>
            {/* <button onClick={() => setReloadKey(prev => prev + 1)}>Reload</button> */}
            {iframeUrl && webContainer && (
              <iframe key={reloadKey} src={iframeUrl} className="w-full h-full bg-white"></iframe>
            )}
          </div>
          {/* )} */}
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
  );
}


export default Project