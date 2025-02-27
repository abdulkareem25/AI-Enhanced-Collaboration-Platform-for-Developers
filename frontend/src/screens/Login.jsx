import { useState, useContext} from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../config/axios"
import {UserContext} from "../context/UserProvider"

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
 
  const {setUser} = useContext(UserContext)

  const navigate = useNavigate()

  const submitHandler = (e) => {
    e.preventDefault();
    axios.post('/users/login', {
      email,
      password
    }).then((res) => {
      console.log(res.data)

      localStorage.setItem('token', res.data.token)
      setUser(res.data.user)

      navigate('/home')
    }).catch((err) => {
      console.log(err.response.data)
    })
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-white text-2xl font-semibold mb-6 text-center">Login</h2>
        <form onSubmit={submitHandler}>
          <div className="mb-2">
            <label className="block text-gray-300 ">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-2">
            <label className="block text-gray-300 ">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-7"
          >
            Login
          </button>
        </form>
        <p className="text-gray-400 text-center mt-4">
          Don't have an account? <Link to="/" className="text-blue-400 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login