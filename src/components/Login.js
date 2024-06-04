import React, { useState } from 'react';
import './Login.css';
import { Link } from 'react-router-dom';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showSuccessPopup, setShowSuccessPopup] = useState(false); // State variable for success pop-up window

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Extract username from response data
                const { id, username } = data;
                // Store username in local storage
                localStorage.setItem('username', username);
                // Redirect to chat page
                setShowSuccessPopup(true);
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('Network error');
        }
    };

    const loginKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    return (
        <div className="login-container">
            <h2>챗앱 로그인</h2>
            <form>
            <div className="form-group">
                <label htmlFor="email">아이디:</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div className="form-group">
                <label htmlFor="password">비밀번호:</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    onKeyPress={loginKeyPress}
                />
            </div>
            <div className="login-button-container">
                <button className="login-button" ><Link to="/register" style={{ textDecoration: 'none', color: '#fff' }}>회원가입</Link></button>
                <button type="submit" className="login-button" onClick={handleSubmit}>로그인</button>
            </div>
            </form>
            {showSuccessPopup && (
                <div className="success-popup">
                    <p>로그인에 성공했습니다!</p>
                    <button className="confirm-button">
                        <Link to="/chat" style={{ textDecoration: 'none', color: '#fff' }}>확인</Link>
                    </button>
                </div>
            )}
        </div>
    );
}

export default Login;
