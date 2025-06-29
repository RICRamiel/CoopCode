import {useNavigate} from "react-router-dom";

const RoomScrollButton = ({name, roomid}) => {
    const navigate = useNavigate();
    return (<button
            onClick={() => navigate(`/codeEditor/${roomid}`)}
            style={{
                padding: '12px 20px',
                background: '#2d4a4a',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.3s',
                fontSize: '16px',
                fontWeight: '500',
                ':hover': {
                    background: '#1e3636',
                }
            }}
        >
            {name}

        </button>

    );
}
export default RoomScrollButton;
