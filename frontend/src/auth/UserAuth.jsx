import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../context/UserProvider.jsx';
import { useNavigate } from 'react-router-dom';

const UserAuth = ({ children }) => {
    const { user, setUser } = useContext(UserContext);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
            navigate('/login');
            return;
        }

        if (!user) {
            setUser(JSON.parse(storedUser)); // ✅ User ko set karna agar null ho
        }

        setLoading(false);
    }, [user, setUser, navigate]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return <>{children}</>;
};

export default UserAuth;
