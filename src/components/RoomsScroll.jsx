import {React, useEffect, useState} from "react";
import {jwtDecode} from "jwt-decode";
import api from "../api/api";
import RoomScrollButton from "./RoomScrollButton";
import {motion, AnimatePresence} from "framer-motion";

const RoomsScroll = () => {
    const [rooms, setRooms] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const token = localStorage.getItem("accessToken");

                if (!token) {
                    setError("Пользователь не аутентифицирован");
                    setLoading(false);
                    return;
                }

                const decoded = jwtDecode(token);
                const ownerId = decoded.id;

                const resp = await api.get(`/rooms/${ownerId}`);
                setRooms(resp.data);
            } catch (err) {
                console.error("Ошибка загрузки комнат:", err);
                setError("Не удалось загрузить комнаты");
            } finally {
                setLoading(false);
            }
        };

        fetchRooms();
    }, []);

    if (loading) {
        return (<div style={{padding: "5px"}}>
            <h1 style={{color: "white"}}>Room List</h1>
            <p  style={{color: "white"}}>Загрузка комнат...</p>
        </div>);
    }

    if (error) {
        return (<div style={{padding: "5px"}}>
            <h1 style={{color: "white"}}>Room List</h1>
            <p style={{color: "red"}}>{error}</p>
        </div>);
    }


    return (<div style={{padding: "5px"}}>
        <h1 style={{color: "white"}}>Room List</h1>

        {rooms.length === 0 ? (<p>Нет доступных комнат</p>) : (<div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxHeight: '600px',
            overflowY: 'auto',
            padding: '10px',
            background: '#3a5f5f',
            borderRadius: '8px'
        }}>
            {rooms.map(room => (<RoomScrollButton
                key={room.id} // Важно: уникальный ключ
                name={room.name}
                roomid={room.id}
            />))}
        </div>)}
    </div>);
}

export default RoomsScroll;
