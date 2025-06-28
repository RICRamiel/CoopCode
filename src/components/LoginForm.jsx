import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import BASE_URL from "../config/config";
import axios from "axios";


const LoginForm = () => {
    const [credentials, setCredentials] = useState({
        email: "", password: ""
    })


    const handleChange = (e) => {
        setCredentials({
            ...credentials, [e.target.name]: e.target.value
        });
    };

    const [error, setError] = useState('');
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("")
        try {
            // Отправка запроса на сервер
            const response = await axios.post(BASE_URL + 'auth/login', credentials, {
                headers: {'Content-Type': 'application/json'}
            });

            // Сохранение токенов
            const {accessToken, refreshToken} = response.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem("isAuth", "true")
            // Перенаправление на защищенную страницу
            navigate('/profile');
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка авторизации');
        }

        // navigate('/');
    };

    return (<form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '300px',
        margin: '0 auto',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        marginTop: '50px'
    }}>
        <h2 style={{
            color: "white"
        }}>Форма Входа</h2>
        {error && <div style={{color: 'red'}}>{error}</div>}
        <label style={{marginBottom: '10px', color:"white"}}>
            Электронная почта:
            <input
                name="email"
                type="text"
                value={credentials.email}
                onChange={handleChange}
                required
                style={{
                    width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box'
                }}
            />

        </label>
        <label style={{marginBottom: '20px', color:"white"}}>
            Пароль:
            <input
                name="password"
                type="password"
                value={credentials.password}
                onChange={handleChange}
                required
                style={{
                    width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box'
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
                cursor: 'pointer'
            }}
        >
            Войти
        </button>
    </form>);
};

export default LoginForm;
