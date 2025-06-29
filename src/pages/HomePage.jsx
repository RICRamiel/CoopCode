import React from 'react';
import Header from '../components/Header';
import MainButtons from '../components/MainButtons';
import RoomsScroll from "../components/RoomsScroll";

const HomePage = () => {
    return (
        <div className="custom-scrollbar" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '80%',
            overflow: 'hidden'
        }}>
            <Header/>

            <div style={{
                display: 'flex',
                flex: 1,
                position: 'relative'
            }}>
                <div style={{
                    width: '300px',
                    overflowY: 'auto',
                    background: '#457575'
                }}>
                    <RoomsScroll/>
                </div>

                <div style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: '#3a5f5f'
                }}>
                    <MainButtons/>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
