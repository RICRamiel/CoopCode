import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import LoginForm from "./LoginForm";
import axios from "axios";
import BASE_URL from "../config/config";

const RegisterForm = () => {
    const [credentials, setCredentials] = useState({
        "name": "", "email": "", "password": ""
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const handleChange = (e) => {
        setCredentials({
            ...credentials, [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (credentials.password !== confirmPassword) {
            alert("Passwords don't match");

        } else {
            setError("")
            try {
                // Отправка запроса на сервер
                const response = await axios.post(BASE_URL + 'auth/register', credentials, {
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
                setError(err.message.value || 'Ошибка регистрации');
                alert(error)
            }
        }
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
        <h2 style={{color:"white"}}>Форма Регистрации</h2>
        <label style={{marginBottom: '10px', color:"white"}}>
            Имя пользователя:
            <input
                name="name"
                type="text"
                value={credentials.name}
                onChange={handleChange}
                required
                style={{
                    width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box'
                }}
            />
        </label>
        <label style={{marginBottom: '10px', color:"white"}}>
            Электронная почта:
            <input
                name="email"
                type="email"
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
        <label style={{marginBottom: '20px', color:"white"}}>
            Подтверждение пароля:
            <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            Зарегистрироваться
        </button>
    </form>);
}

export default RegisterForm;
