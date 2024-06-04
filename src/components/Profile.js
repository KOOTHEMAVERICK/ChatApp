import React, { useState, useEffect } from 'react';
import './Profile.css';
import { Link } from 'react-router-dom';

function Profile() {
    const [userInfo, setUserInfo] = useState({});
    const [editing, setEditing] = useState(false); // State for toggle editing mode
    const [name, setName] = useState(''); // State for name input field
    const [email, setEmail] = useState(''); // State for email input field
    const [password, setPassword] = useState(''); // State for password input field
    const [phone, setPhone] = useState(''); // State for phone input field

    const userName = localStorage.getItem('username');

    useEffect(() => {
        // Fetch user info from server
        const fetchUserInfo = async () => {
            try {
                const response = await fetch(`http://localhost:3000/fetchUserInfo/${userName}`);
                const data = await response.json();
                setUserInfo(data.userInfo);
                // Set user info to input fields
                setName(data.userInfo.name);
                setEmail(data.userInfo.email);
                setPassword(data.userInfo.password);
                setPhone(data.userInfo.phone);
            } catch (error) {
                console.error('Failed to fetch user info:', error);
            }
        };

        fetchUserInfo();
    }, [userName]);

    // Function to handle profile update
    const handleUpdateProfile = async () => {
        try {
            // Make API call to update user profile
            const response = await fetch(`http://localhost:3000/updateProfile/${userName}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password, phone }),
            });
            const data = await response.json();
            console.log('Profile updated successfully:', data);
            // Store modified username in local storage
            localStorage.setItem('username', name);
            // Update local state with new user info
            setUserInfo(data.updatedUserInfo);
            // Exit editing mode
            setEditing(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
        }
    };

    // Function to handle profile deletion
    const handleDeleteProfile = async () => {
        if (window.confirm('Are you sure you want to delete your profile?')) {
            try {
                // Make API call to delete user profile
                const response = await fetch(`http://localhost:3000/deleteProfile/${userName}`, {
                    method: 'DELETE',
                });
                const data = await response.json();
                console.log('Profile deleted successfully:', data);
                // Redirect user to home page after profile deletion
                window.location.replace('/');
            } catch (error) {
                console.error('Failed to delete profile:', error);
            }
        }
    };

    return (
        <div className="profile-container">
            <div className="top-bar">
                <h2>{userName}님 회원정보</h2>
                <div className="user-controls">
                    <button className="chat-button">
                        <Link to="/chat" style={{ textDecoration: 'none', color: '#fff' }}>채팅 페이지로 이동</Link>
                    </button>
                    <button className="logout-button">
                        <Link to="/" style={{ textDecoration: 'none', color: '#fff' }}>로그아웃</Link>
                    </button>
                </div>
            </div>
            <div className="user-info">
                {editing ? (
                    <div>
                        <div className="form-group">
                            <label htmlFor="name">이름:</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름"/>
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">이메일:</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일"/>
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">비밀번호:</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                               placeholder="비밀번호"/>
                        </div>
                        <div className="form-group">
                            <label htmlFor="phoneNumber">전화번호:</label>
                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="전화번호"/>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="second-group">
                            <label htmlFor="name">이름:</label>
                            <p>{userInfo.name}</p>
                        </div>
                        <div className="second-group">
                            <label htmlFor="email">이메일:</label>
                            <p>{userInfo.email}</p>
                        </div>
                        <div className="second-group">
                            <label htmlFor="password">비밀번호:</label>
                            <p>{userInfo.password}</p>
                        </div>
                        <div className="second-group">
                            <label htmlFor="phoneNumber">전화번호:</label>
                            <p>{userInfo.phone}</p>
                        </div>
                    </div>
                )}
            </div>
            <div className="modify-control">
                <button className="delete-button" onClick={handleDeleteProfile}>회원탈퇴</button>
                {editing ? (
                    <button className="save-button" onClick={handleUpdateProfile}>저장</button>
                ) : (
                    <button className="edit-button" onClick={() => setEditing(true)}>수정</button>
                )}
            </div>
        </div>
    );
}

export default Profile;
