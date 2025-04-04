import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { dracula } from "@uiw/codemirror-theme-dracula"; // Correct import
import { debounce } from "lodash";


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
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [iframeUrl, setIframeUrl] = useState(null)
  const [runProcess, setRunProcess] = useState(null);

  const [newFileName, setNewFileName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const [isPreviewPanelOpen, setIsPreviewPanelOpen] = useState(false);

  const messageBoxRef = React.useRef(null)

  const renderFileTree = (tree = {}, path = "") => {
    return Object.keys(tree).map((file) => {
      const currentPath = path ? `${path}/${file}` : file;

      if (typeof tree[file] === "object" && !tree[file].file) {
        return (
          <div key={currentPath} className="folder">
            <button
              onClick={() =>
                setOpenFolders((prev) =>
                  prev.includes(currentPath)
                    ? prev.filter((f) => f !== currentPath)
                    : [...prev, currentPath]
                )
              }
              className="folder-name text-lg flex cursor-pointer gap-2 hover:bg-gray-700 w-full p-2"
            >
              <i className="ri-folder-fill text-yellow-500"></i>
              <p
                className="font-semibold text-lg truncate w-full flex overflow-hidden whitespace-nowrap"
                title={file}
              >
                {file}
              </p>
            </button>
            {openFolders.includes(currentPath) && (
              <div className>{renderFileTree(tree[file], currentPath)}</div>
            )}
          </div>
        );
      } else {
        return (
          <button
            key={currentPath}
            onClick={() => {
              setCurrentFile(currentPath);
              setOpenFiles((prev) => [...new Set([...prev, currentPath])]);

              // Ensure new files have valid structure
              setFileTree((prevFileTree) => {
                const newTree = JSON.parse(JSON.stringify(prevFileTree));
                const parts = currentPath.split("/");
                let current = newTree;

                for (let i = 0; i < parts.length - 1; i++) {
                  if (!current[parts[i]] || typeof current[parts[i]] !== "object") {
                    current[parts[i]] = {}; // ✅ Ensure parent folder exists
                  }
                  current = current[parts[i]];
                }

                // ✅ Ensure file exists
                if (!current[parts[parts.length - 1]]) {
                  current[parts[parts.length - 1]] = { file: { contents: "" } };
                }

                return newTree;
              });
            }}
            className="tree-element cursor-pointer p-2 flex items-center content-start gap-2 hover:bg-gray-700 w-full"
          >
            <i className="ri-file-line text-blue-500"></i>

            {/* ✅ File Name with Ellipsis & Tooltip */}
            <p
              className="font-semibold text-lg truncate flex w-full overflow-hidden whitespace-nowrap"
              title={file} // ✅ Hover par pura naam dikhane ke liye
            >
              {file}
            </p>
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

    return current?.file?.contents ?? ""; // Ensure empty files are also handled
  };

  const saveMessageToDB = async (messageData) => {
    try {
      await axios.post('/projects/save-message', {
        projectId: project._id,
        sender: messageData.sender,
        message: messageData.message
      });
    } catch (err) {
      console.error('Error saving message:', err);
    }
  };

  const autoSave = debounce((updatedFileTree) => {
    axios.put("/projects/update-file-tree", {
      projectId: location.state.project._id,
      fileTree: updatedFileTree,
    }).then(res => {
      console.log("Auto-saved:", res.data);
    }).catch(err => {
      console.log("Error in auto-save:", err);
    });
  }, 1000);

  const handleCreateFile = () => {
    if (!newFileName.trim()) return; // Empty filename allow nahi hoga

    setFileTree((prevFileTree) => {
      const newTree = structuredClone(prevFileTree || {}); // ✅ Ensure tree is not undefined

      // ✅ Agar file already exist nahi karti, toh new file create karo
      if (!newTree[newFileName]) {
        newTree[newFileName] = { file: { contents: "" } }; // ✅ Empty file with content
      }

      return newTree;
    });

    setNewFileName("");
    setIsCreatingFile(false);
    setCurrentFile(newFileName);
    setOpenFiles((prevOpenFiles) => [...new Set([...prevOpenFiles, newFileName])]);
  };


  // const handleCreateFolder = () => {
  //   if (!newFolderName.trim()) return;

  //   setFileTree((prevFileTree) => {
  //     const newTree = structuredClone(prevFileTree);
  //     const parts = newFolderName.split("/");
  //     let current = newTree;

  //     // ✅ Ensure all parent folders exist
  //     for (let i = 0; i < parts.length; i++) {
  //       if (!current[parts[i]] || typeof current[parts[i]] !== "object") {
  //         current[parts[i]] = {}; // Creates folder if missing
  //       }
  //       current = current[parts[i]];
  //     }

  //     return newTree;
  //   });

  //   setNewFolderName("");
  //   setIsCreatingFolder(false);
  //   setOpenFolders((prevOpenFolders) => [...new Set([...prevOpenFolders, newFolderName])]);
  // };


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
    if (!user || user._id !== location.state.project.admin?._id) {
      alert("Only the admin can add collaborators.");
      return;
    }

    if (selectedUserIds.size === 0) {
      alert("Select users");
      return;
    }

    axios.put("/projects/add-user", {
      projectId: location.state.project._id,
      users: Array.from(selectedUserIds)
    })
      .then(res => {
        console.log(res.data);
        setIsModalOpen(false);
      })
      .catch(err => {
        console.log(err);
      });
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
    saveMessageToDB(outgoingMessage);
  }


  const writeAiMessage = (message) => {
    let content;
    try {
      const parsed = typeof message === 'string' ? JSON.parse(message) : message;
      content = typeof parsed.text === 'object' 
        ? JSON.stringify(parsed.text, null, 2)
        : parsed.text || parsed;
    } catch {
      content = typeof message === 'object' 
        ? JSON.stringify(message, null, 2) 
        : message;
    }
  
    // Check for structured content patterns
    const isStructured = /(\n|{|}|\[|\]|`|\\|\/)/.test(content);
  
    return (
      <div className={`ai-reply bg-gray-950 rounded p-2 ${
        isStructured ? 'overflow-auto' : 'overflow-visible'
      }`}>
        <Markdown>
          {isStructured ? `\`\`\`\n${content}\n\`\`\`` : content}
        </Markdown>
      </div>
    );
  };


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
        // Save all messages but only process non-AI messages
        if (data.sender._id === 'ai') {
          saveMessageToDB(data);
          setMessages(prev => [...prev, data]);
        } else {
          // Handle normal user messages
          setMessages(prev => [...prev, data]);
        }
      } catch (error) {
        console.error("Error handling message:", error);
      }
    });

    axios.get(`/projects/get-project/${location.state.project._id}`)
      .then(res => {
        const projectData = res.data.project;
        setProject(projectData);
        setFileTree(projectData.fileTree || {});

        // Handle messages with null check
        const messages = projectData.messages || [];
        const uniqueMessages = messages.reduce((acc, current) => {
          const exists = acc.some(item =>
            item.message === current.message &&
            item.sender._id === current.sender._id &&
            item.createdAt === current.createdAt
          );
          return exists ? acc : [...acc, current];
        }, []);

        setMessages(uniqueMessages);
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

  // collaborators normal karne ke liye
  useEffect(() => {
    if (!isModalOpen) {
      setSelectedUserIds(new Set()); // Modal band hone pe selectedUserIds empty ho jayega
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (!webContainer || !isInstalled) return;
    async function updateFiles() {
      try {
        await webContainer.mount(fileTree); // Sirf updated files mount karo
        console.log("Files updated in container without restart");
      } catch (error) {
        console.error("Error updating files:", error);
      }
    }
    updateFiles();
  }, [fileTree]); // Server restart nahi hoga, sirf file update hogi

  return (
    <main className='h-screen w-screen flex bg-gray-950 text-white '>
      <section className='left relative h-full flex flex-col max-w-70 bg-gray-800'>
        <div className="chats h-full flex flex-col">
          <header className='relative rounded-b flex items-center justify-between w-full bg-gray-950 p-3 px-4 h-12'>
            <div className=" w-full">
              <h2 className="text-white text-lg font-semibold whitespace-nowrap overflow-hidden max-w-[300px] cursor-pointer"
                title={project.name}>
                {project.name}
              </h2>
            </div>
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
  const isOutgoing = msg.sender._id === user._id;
  const isAI = msg.sender._id === 'ai';

  return (
    <div
      key={index}
      className={`message flex flex-col rounded-lg p-2 ${
        isAI ? 'max-w-full' : 'max-w-60'
      } bg-gray-700 text-white ${
        isOutgoing ? 'ml-auto' : 'self-start'
      }`}
    >
      {!isOutgoing && (
        <small
          className='text-xs'
          style={{ color: getColorForSender(msg.sender.name) }}
        >
          {msg.sender.name}
        </small>
      )}
      <div className='text-sm'>
        {isAI ? (
          writeAiMessage(msg.message)
        ) : (
          <div className='max-w-60 overflow-clip'>{msg.message}</div>
        )}
      </div>
    </div>
  );
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
            {project.users?.filter(user => user?._id).map(user => (
              <div
                key={user._id}
                className='user flex gap-2 items-center bg-gray-900 rounded-lg mx-1 hover:bg-gray-700 cursor-pointer'
              >
                <div className='profile rounded-full p-2 py-1 m-1 text-xl text-blue-500'>
                  <i className="ri-user-fill"></i>
                </div>
                <div className="userName text-white font-semibold text-xl">
                  {user.name} {user._id === project.admin?._id && <span className="text-yellow-600 text-sm">(admin)</span>}
                  <div className="email text-gray-400 text-xs pb-1">
                    {user.email}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      <section className="right flex flex-grow h-full overflow-hidden">
        <div className="explorer bg-gray-900 h-full w-48 flex flex-col border-r border-gray-700">
          <div className="flex items-center justify-around border-b border-gray-700 h-12">
            <div>EXPLORER</div>
            <div className="text-blue-500 text-xl cursor-pointer flex gap-2">
              <button onClick={() => setIsCreatingFile(true)} className="hover:text-blue-300">
                <i className="ri-file-add-line"></i>
              </button>
              {/* <button onClick={() => setIsCreatingFolder(true)} className="hover:text-blue-300">
                <i className="ri-folder-add-line"></i>
              </button> */}
            </div>
          </div>
          <div className="file-tree w-full">
            {/* Input for New File Name */}
            {isCreatingFile && (
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFile()}
                onBlur={() => setIsCreatingFile(false)}
                className="border p-2 rounded w-44 m-2 outline-none"
                placeholder="Enter file name..."
                autoFocus
              />
            )}

            {/* Input for New Folder Name */}
            {/* {isCreatingFolder && (
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                onBlur={() => setIsCreatingFolder(false)}
                className="border p-2 rounded w-44 m-2 outline-none"
                placeholder="Enter folder name..."
                autoFocus
              />
            )} */}

            {/* File Tree Rendering */}
            <div className="">{renderFileTree(fileTree)}</div>
          </div>
        </div>

        <div className="editor flex-grow h-full w-0 relative">


          {/* {currentFile && ( */}
          <div className="code-editor flex flex-col h-full bg-gray-800 w-full">


            {/* Tabs Section */}
            <div className="top h-12 min-h-12 pr-1 flex justify-between w-full bg-gray-900 border-b border-gray-700">
              <div className="tab flex flex-row overflow-y-auto">
                {openFiles.map((file) => (
                  <div key={file} className="header flex items-center hover:bg-gray-800 border-r border-gray-700 whitespace-nowrap px-2 gap-2">
                    <button
                      onClick={() => setCurrentFile(file)}
                      className=" text-white"
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
                      className="text-xl cursor-pointer  text-blue-500"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  </div>
                ))}
              </div>

              <div className="actions flex gap-2 py-1 ">
                <button
                  onClick={async () => {
                    if (isInstalling) return; // Prevent multiple installs
                    setIsInstalling(true);

                    await webContainer?.mount(fileTree);
                    const installProcess = await webContainer.spawn("npm", ["install"]);

                    installProcess.output.pipeTo(new WritableStream({
                      write(chunk) {
                        console.log(chunk);
                      }
                    }));

                    await installProcess.exit;
                    setIsInstalling(false);
                    setIsInstalled(true);
                    setIsPreviewPanelOpen(!isPreviewPanelOpen); // Open preview panel after autoSave
                  }}

                  className="text-xl text-blue-500 px-4 cursor-pointer bg-gray-950 rounded-lg hover:bg-gray-700"
                >
                  {isInstalling ? "Installing..." : "Install"}
                </button>


                <button
                  onClick={async () => {
                    if (runProcess) {
                      await runProcess.kill();
                    }

                    await webContainer.mount(fileTree); // Mount before running

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

                      // 🔹 Server run hone ke baad hi save karna
                      autoSave(fileTree);

                      // 🔹 Preview Panel ko open karna
                      setIsPreviewPanelOpen(!isPreviewPanelOpen);
                    });
                  }}

                  className="text-xl text-blue-500 px-4 cursor-pointer bg-gray-950 rounded-lg hover:bg-gray-700"
                >
                  Run
                </button>

                <button
                  onClick={() => setIsPreviewPanelOpen(!isPreviewPanelOpen)}
                  className='cursor-pointer text-blue-500 text-xl bg-gray-950 rounded-lg hover:bg-gray-700 mr-1'
                  title="preview">
                  <i className="ri-arrow-up-s-line p-2"></i>
                </button>


              </div>
            </div>

            {/* Code Editor Section */}
            <div className="bottom flex w-full flex-grow overflow-y-auto">

              {currentFile ? (
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

                      // 🔥 Hot Reload Bina Server Restart Kiye
                      webContainer.mount(fileTree);
                    }}

                  />
                </div>
              ) : (
                <div className="h-full w-full">
                  <div className="flex items-center justify-center h-full w-full text-white text-lg">
                    Select a file to edit
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* <button onClick={() => setReloadKey(prev => prev + 1)}>Reload</button> */}
          {iframeUrl && webContainer && (
            <div className={`preview h-full w-full box-border max-w-full flex flex-grow flex-col items-center bg-gray-900 absolute transition-all ${isPreviewPanelOpen ? 'translate-y-0' : '-translate-y-full'}`}>
              <div className="header h-12 min-h-12 px-1 flex justify-around w-full bg-gray-900 border-b border-gray-700">
                <input type="text"
                  onChange={(e) => setIframeUrl(e.target.value)}
                  value={iframeUrl}
                  className="w-[94%] p-2  text-white bg-gray-700 outline-none rounded-full m-1"
                />
                <button
                  onClick={() => setIsPreviewPanelOpen(!isPreviewPanelOpen)}
                  className='cursor-pointer text-blue-500 text-xl m-1 bg-gray-950 rounded-lg hover:bg-gray-700 p-2'>
                  <i className="ri-arrow-down-s-line text-blue-500"></i>
                </button>
              </div>
              <iframe key={reloadKey} src={iframeUrl} className="w-full h-full bg-white"></iframe>
            </div>
          )}
          {/* )} */}
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-none">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-[90%] max-w-md ">
            <h2 className="text-white text-xl font-semibold mb-4 text-center">Select a Collaborator</h2>
            <div className="addCollaborators max-h-50 overflow-y-auto flex flex-col gap-1">
              {users
                .filter(user => !project.users.some(projectUser => projectUser._id === user._id))
                .map(user => (
                  <div
                    key={user.id}
                    className={`user flex gap-2 items-center rounded-lg mx-1 cursor-pointer 
                      ${Array.from(selectedUserIds).includes(user._id) ? 'bg-gray-700 hover:bg-gray-700/70' : 'bg-gray-900 hover:bg-gray-650'}`}
                    onClick={() => handleUserClick(user._id)}
                  >
                    <div className='profile rounded-full p-2 py-1 m-1 text-xl text-blue-500'>
                      <i className="ri-user-fill"></i>
                    </div>
                    <div className="userName text-white font-semibold text-xl">
                      {user.name}
                      <div className="email text-gray-400 text-xs pb-1">
                        {user.email}
                      </div>
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