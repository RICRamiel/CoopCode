import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import api from "../api/api";

const MiniProfile = ({setIsAuth}) => {
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/account');
                setData(response.data);

            } catch (err) {
                setError('Ошибка загрузки данных');
            }
        };

        fetchData();
    }, []);
    const handleLogout = async (e) => {
        try {
            await api.post('/auth/revoke', {"value": localStorage.getItem("refreshToken")});
        } catch (err) {
            console.log(err)
        }
        localStorage.clear()
        setIsAuth(false)
        navigate('/')
        window.location.reload()
    }


    return (<div>
        <button onClick={() => navigate('/profile')} className="btn btn-primary" style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: "10px"
        }}>
            {data && data.name}
        </button>
        <button onClick={handleLogout} style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: "10px"
        }}>
            Выход
        </button>
    </div>)
}

const HeaderButtons = () => {
    const navigate = useNavigate();
    return (<div>
            <button
                onClick={() => navigate('/login')}
                style={{
                    padding: '8px 16px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginRight: "10px"
                }}
            >
                Вход
            </button>
            <button
                onClick={() => navigate('/registration')}
                style={{
                    padding: '8px 16px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Регистрация
            </button>
        </div>

    )
}

const Header = () => {
    const navigate = useNavigate();
    const [isAuth, setIsAuth] = React.useState(!!localStorage.getItem("accessToken"));

    return (<header style={{
        display: 'flex', justifyContent: 'flex-end', padding: '20px',
    }}>
        <button onClick={() => navigate('/')} style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: "10px"
        }}>
            Главная
        </button>
        {!isAuth && <HeaderButtons/>}
        {isAuth && <MiniProfile setIsAuth={setIsAuth}/>}
    </header>);
};

export default Header;
