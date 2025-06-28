import React from 'react';
import CodeEditor from '../components/CodeEditor';
import {useParams} from 'react-router-dom';
import Header from "../components/Header";

const CodeEditorPage = () => {
    const {roomId} = useParams();
    const name = localStorage.getItem("user") || "guest"


    return (<div>
        <Header/>
        <main>
            <CodeEditor roomId={roomId} userId={name}/>
        </main>
    </div>)
}
export default CodeEditorPage;
