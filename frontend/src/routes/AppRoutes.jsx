import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from '../screens/Login'
import Register from '../screens/Register'
import Home from '../screens/Home'
import Project from '../screens/Project'
import UserAuth from '../auth/UserAuth'

const AppRoutes = () => {
    return (
        <div>
            <BrowserRouter>
                <Routes>
                    <Route path='/' element={<Register />}/>
                    <Route path='/login' element={<Login />}/>
                    <Route path='/home' element={<UserAuth><Home /></UserAuth>}/>
                    <Route path='/project' element={<UserAuth><Project /></UserAuth>}/>

                </Routes>
            </BrowserRouter>
        </div>
    )
}

export default AppRoutes
