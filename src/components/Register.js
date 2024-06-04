import React, { useState } from 'react';
import './Register.css';
import {Link} from "react-router-dom";

const Register = () => {
    // State variables to store user input
    const [id, setId] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [showSuccessPopup, setShowSuccessPopup] = useState(false); // State variable for success pop-up window


    // Function to handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            // Send a POST request to the server to insert a new record into the Customer table
            const response = await fetch('http://localhost:3000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password, phoneNumber }),
            });

            const data = await response.json();

            // Handle response from the server
            if (response.ok) {
                // Registration successful
                setShowSuccessPopup(true); // Show success pop-up window
            } else {
                // Registration failed
                alert(data.error);
            }
        } catch (error) {
            alert('Network error');
        }
    };

    return (
        <div className="register-container">
            <h2>회원가입</h2>
            <form >
                <div className="form-group">
                    <label htmlFor="name">이름:</label>
                    <input type="name" id="name" value={name} onChange={(e) => setName(e.target.value)} required/>
                </div>
                <div className="form-group">
                    <label htmlFor="email">이메일:</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required/>
                </div>
                <div className="form-group">
                    <label htmlFor="password">비밀번호:</label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)}
                           required/>
                </div>
                <div className="form-group">
                    <label htmlFor="phoneNumber">전화번호:</label>
                    <input type="phoneNumber" id="phoneNumber" value={phoneNumber}
                           onChange={(e) => setPhoneNumber(e.target.value)} required/>
                </div>
                <div className="button-container">
                    <button className="button" type="submit"><Link to="/" style={{ textDecoration: 'none', color: '#fff' }}>취소</Link></button>
                    <button className="button" type="submit" onClick={handleSubmit}>회원가입</button>
                </div>
            </form>
            {showSuccessPopup && (
            <div className="success-popup">
                <p>회원가입이 성공적으로 완료되었습니다!</p>
                <button className="confirm-button">
                    <Link to="/" style={{ textDecoration: 'none', color: '#fff' }}>확인</Link>
                </button>
            </div>
            )}
        </div>
);
};

export default Register;