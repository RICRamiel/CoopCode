import React, {useEffect, useState} from 'react';
import api from '../api/api';
import Header from "../components/Header";

const ProfilePage = () => {

    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/account');
                setData(response.data);
                return response.data;
            } catch (err) {
                setError('Ошибка загрузки данных');
            }
        };

        fetchData().then(r => localStorage.setItem("user", r.name));
    }, []);

    return (<div>
        <Header/>
        <h1>Защищенная страница</h1>
        {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
        {error && <div style={{color: 'red'}}>{error}</div>}
    </div>);
}

export default ProfilePage;
