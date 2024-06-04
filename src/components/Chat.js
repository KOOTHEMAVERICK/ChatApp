import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './Chat.css';
import {Link} from "react-router-dom";

const socket = io('http://localhost:3000', {
    transports: ['websocket'], // 웹소켓 사용
    withCredentials: true, // CORS 허용
});

function Chat() {
    const [rooms, setRooms] = useState([]); // 빈 배열로 초기화
    const [currentRoom, setCurrentRoom] = useState('');
    const [messages, setMessages] = useState({});
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [userName, setUserName] = useState(localStorage.getItem('username')); // Retrieve username from local storage
    const [showCreateRoomPrompt, setShowCreateRoomPrompt] = useState(false);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await fetch('http://localhost:3000/fetchRooms');
                const data = await response.json();
                setRooms(data.rooms.map(room => room.name));
            } catch (error) {
                console.error('Failed to fetch rooms:', error);
            }
        };
        fetchRooms();

        socket.on('receiveMessage', handleReceiveMessage);

        return () => {
            socket.off('receiveMessage');
        };
    }, []);

    useEffect(() => {
        if (currentRoom) {
            socket.emit('joinRoom', currentRoom);

            const fetchMessages = async (room) => {
                try {
                    const response = await fetch(`http://localhost:3000/fetchMessages/${room}`);
                    const data = await response.json();
                    setMessages((prevMessages) => ({
                        ...prevMessages,
                        [room]: data.messages
                    }));
                } catch (error) {
                    console.error('Failed to fetch messages:', error);
                }
            };
            fetchMessages(currentRoom);
        }
    }, [currentRoom]);

    const handleReceiveMessage = (data) => {
        setMessages((prevMessages) => ({
            ...prevMessages,
            [data.room]: [...(prevMessages[data.room] || []), data]
        }));
    };

    const sendMessage = async () => {
        if (!message.trim()) return;

        const msgData = { room: currentRoom, userName, message };

        try {
            const response = await fetch('http://localhost:3000/saveMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(msgData),
            });

            const data = await response.json();
            if (response.ok) {
                socket.emit('sendMessage', msgData);
                setMessage('');
            } else {
                console.error('Failed to save message:', data.error);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleSearch = async () => {
        try {
            const response = await fetch('http://localhost:3000/searchRoom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ searchTerm })
            });
            const data = await response.json();

            if (!data.exists) {
                setShowCreateRoomPrompt(true);
            } else {
                setRooms([...rooms]);
                setCurrentRoom(data.room.name);
                setShowCreateRoomPrompt(false);
            }
        } catch (err) {
            console.error('Search failed', err);
        }
    };

    const createRoom = async () => {
        try {
            const response = await fetch('http://localhost:3000/createRoom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: searchTerm })
            });
            const data = await response.json();

            if (response.ok) {
                setRooms([...rooms, searchTerm]);
                setCurrentRoom(searchTerm);
                setShowCreateRoomPrompt(false);
            } else {
                alert(data.error);
            }
        } catch (err) {
            console.error('Failed to create room', err);
        }
    };

    const filteredRooms = rooms.filter(room => room.toLowerCase().includes(searchTerm.toLowerCase()));

    const searchKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const sendKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <div className="chat-container">
            <div className="sidebar">
                <div className="top-bar">
                <div className="top-bar-left">
                    <input
                        type="text"
                        placeholder="채팅방 검색"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                        onKeyPress={searchKeyPress}
                    />
                    <button className="search-button" onClick={handleSearch}>검색</button>
                </div>
                </div>
                <div className="room-list">
                    {filteredRooms.map((room) => (
                        <div
                            key={room}
                            className={`room ${room === currentRoom ? 'active' : ''}`}
                            onClick={() => setCurrentRoom(room)}
                        >
                            <span className="room-name">{room}</span>
                        </div>
                    ))}
                    {showCreateRoomPrompt && (
                        <div className="create-room-prompt">
                            <p>채팅방을 찾을 수 없습니다.<br></br>새로운 채팅방을 만들겠습니까?</p>
                            <div className="prompt-buttons">
                                <button className="prompt-button no-button"
                                        onClick={() => setShowCreateRoomPrompt(false)}>아니오
                                </button>
                                <button className="prompt-button yes-button" onClick={createRoom}>예</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="main-chat">
                <div className="top-bar">
                <div className="top-bar-right">
                    <h2 className="room-name">{currentRoom}</h2>
                    <div className="user-controls">
                        <button className="user-button"><Link to="/profile" style={{ textDecoration: 'none', color: '#fff' }}>{userName}님</Link></button>
                        <button className="logout-button"><Link to="/" style={{ textDecoration: 'none', color: '#fff' }}>로그아웃</Link></button>
                    </div>
                </div>
                </div>
                {currentRoom && (
                    <div className="chat-window">
                        <div className="messages">
                            {(messages[currentRoom] || []).map((msg, index) => (
                                <div key={index} className={`message ${msg.userName === userName ? 'own-message' : 'other-message'}`}>
                                    <div className="message-info">
                                        <strong>{msg.userName}</strong>
                                    </div>
                                    <div className="message-content">
                                        {msg.message}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bottom-bar">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="메시지 입력..."
                                className="input-box"
                                onKeyPress={sendKeyPress}
                            />
                            <button className="send-button" onClick={sendMessage}>전송</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Chat;
