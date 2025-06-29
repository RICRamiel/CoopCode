import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BASE_URL from "../config/config";
import axios from "axios";

const LoginForm = () => {
    const [credentials, setCredentials] = useState({
        email: "", password: ""
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Извлекаем токены из кук при загрузке
    useEffect(() => {
        const cookies = document.cookie.split(';');
        const tokenCookies = cookies.filter(cookie => 
            cookie.trim().startsWith('access_token=') || 
            cookie.trim().startsWith('refresh_token=')
        );

        if (tokenCookies.length === 2) {
            const accessToken = tokenCookies[0].split('=')[1];
            const refreshToken = tokenCookies[1].split('=')[1];
            
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem("isAuth", "true");

            document.cookie = 'access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            document.cookie = 'refresh_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

            navigate('/profile');
        }
    }, []);

    const handleChange = (e) => {
        setCredentials({
            ...credentials, [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const response = await axios.post(BASE_URL + 'auth/login', credentials, {
                headers: { 'Content-Type': 'application/json' }
            });

            const { accessToken, refreshToken } = response.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem("isAuth", "true");

            navigate('/profile');
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка авторизации');
        }
    };

    const handleGoogleLogin = () => {
        // Полный редирект (не popup)
        window.location.href = `${BASE_URL}auth/oauth2/authorization/google`;
    };

    return (
        <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '300px',
            margin: '0 auto',
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginTop: '50px',
            backgroundColor: '#333'
        }}>
            <h2 style={{ color: "white", textAlign: 'center' }}>Форма Входа</h2>
            {error && <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>}
            
            <label style={{ marginBottom: '15px', color: 'white' }}>
                Электронная почта:
                <input
                    name="email"
                    type="email"
                    value={credentials.email}
                    onChange={handleChange}
                    required
                    style={{
                        width: '100%',
                        padding: '8px',
                        marginTop: '5px',
                        borderRadius: '4px',
                        border: '1px solid #555'
                    }}
                />
            </label>
            
            <label style={{ marginBottom: '20px', color: 'white' }}>
                Пароль:
                <input
                    name="password"
                    type="password"
                    value={credentials.password}
                    onChange={handleChange}
                    required
                    style={{
                        width: '100%',
                        padding: '8px',
                        marginTop: '5px',
                        borderRadius: '4px',
                        border: '1px solid #555'
                    }}
                />
            </label>
            
            <button
                type="submit"
                style={{
                    padding: '10px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginBottom: '10px'
                }}
            >
                Войти
            </button>
            
            <div style={{ textAlign: 'center', color: '#aaa', margin: '10px 0' }}>или</div>
            
            <button
                type="button"
                onClick={handleGoogleLogin}
                style={{
                    padding: '10px',
                    backgroundColor: '#4285F4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="white"
                    style={{ marginRight: '8px' }}
                >
                    <path d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.784-1.664-4.153-2.675-6.735-2.675-5.522 0-10 4.477-10 10s4.478 10 10 10c8.396 0 10-7.524 10-10 0-0.671-0.069-1.325-0.189-1.955h-9.811z" />
                </svg>
                Войти через Google
            </button>
        </form>
    );
};

export default LoginForm;