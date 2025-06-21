import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import LoginForm from "./LoginForm";

const RegisterForm = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Здесь должна быть логика аутентификации
        alert(`Зарегистрирован пользователь: ${username}`);
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
        <h2>Форма Регистрации</h2>
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
        <label style={{marginBottom: '10px'}}>
            Электронная почта:
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
        <label style={{marginBottom: '20px'}}>
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
