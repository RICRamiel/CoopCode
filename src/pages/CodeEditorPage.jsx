import React from 'react';
import CodeEditor from '../components/CodeEditor';

const CodeEditorPage = () => {
    const userId = localStorage.getItem("userId");
    const roomId = localStorage.getItem("roomId");
    return (<div>
        <main>
            <CodeEditor roomId={roomId} userId={userId}/>
        </main>
    </div>)
}
export default CodeEditorPage;
