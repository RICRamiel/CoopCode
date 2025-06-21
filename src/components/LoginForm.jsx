import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import useLocalStorage from "../components/useLocalStorage";


const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const [userId, setName] = useLocalStorage('userId', '-1');
    const [roomId, setRoom] = useLocalStorage('roomId', '0');
    const handleSubmit = (e) => {
        e.preventDefault();
        // Здесь должна быть логика аутентификации
        alert(`Вход выполнен для пользователя: ${username}`);
        setName(username)
        setRoom("abc")
        navigate('/');
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
        <h2>Форма Входа</h2>
        <label style={{marginBottom: '10px'}}>
            Имя пользователя:
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                    width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box'
                }}
            />

        </label>
        <label style={{marginBottom: '20px'}}>
            Пароль:
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
