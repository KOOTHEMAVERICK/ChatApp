const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const moment = require('moment');

const app = express();
const port = 3000;
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors({origin: 'http://localhost:3001'}));
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'chatapp',
    password: 'chatapp',
    database: 'chatappdb'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database.');
});

// 로그인을 진행하는 login 함수
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT id, name FROM Customer WHERE email = ? AND password = ?';
    db.query(query, [email, password], (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Database query error' });
            return;
        }

        if (results.length > 0) {
            const { id, name } = results[0]; // Extract username from query result
            res.json({ message: 'Login successful', id: id, username: name }); // // Send username in the response
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    });
});

// 회원을 생성하는 register 함수
app.post('/register', (req, res) => {
    const { name, email, password, phoneNumber } = req.body;

    const query = 'INSERT INTO Customer (name, email, password, phone) VALUES (?, ?, ?, ?)';
    db.query(query, [name, email, password, phoneNumber], (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Failed to register user' });
            return;
        }

        res.json({ message: 'Registration successful' });
    });
});

// 채팅방을 검색하는 searchRoom 함수
app.post('/searchRoom', (req, res) => {
    const { searchTerm } = req.body;

    const query = 'SELECT * FROM ChatingRoom WHERE name = ?';
    db.query(query, [searchTerm], (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Database query error' });
            return;
        }

        if (results.length > 0) {
            res.json({ exists: true, room: results[0] });
        } else {
            res.json({ exists: false });
        }
    });
});

// 채팅방을 생성하는 createRoom 함수
app.post('/createRoom', (req, res) => {
    const { name } = req.body;

    const query = 'INSERT INTO ChatingRoom (name) VALUES (?)';
    db.query(query, [name], (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Failed to create room' });
            return;
        }

        res.json({ message: 'Room created successfully' });
    });
});

// 채팅방 목록을 가져오는 fetchRooms 함수
app.get('/fetchRooms', (req, res) => {
    const query = 'SELECT * FROM ChatingRoom';
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Database query error' });
            return;
        }
        res.json({ rooms: results }); // Send the rooms data in the response
    });
});

// 사용자의 정보를 가져오는 fetchUserInfo 함수
app.get('/fetchUserInfo/:userName', (req, res) => {
    const { userName } = req.params;

    const query = 'SELECT * FROM Customer WHERE name = ?';
    db.query(query, [userName], (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Database query error' });
            return;
        }

        if (results.length > 0) {
            res.json({ userInfo: results[0] });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    });
});

// 사용자의 정보를 업데이트하는 updateProfile 함수
app.put('/updateProfile/:userName', (req, res) => {
    const { userName } = req.params;
    const { name, email, password, phone } = req.body;

    const query = 'UPDATE Customer SET name = ?, email = ?, password = ?, phone = ? WHERE name = ?';
    db.query(query, [name, email, password, phone, userName], (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Database query error' });
            return;
        }

        if (results.affectedRows > 0) {
            res.json({ message: 'Profile updated successfully', updatedUserInfo: { name, email, password, phone } });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    });
});

// 사용자의 정보를 삭제하는 deleteProfile 함수
app.delete('/deleteProfile/:username', (req, res) => {
    const { username } = req.params;

    const msgDeleteQuery = 'DELETE FROM Messages WHERE cust_id = (SELECT id FROM Customer WHERE name = ?)';
    const custDeleteQuery = 'DELETE FROM Customer WHERE name = ?';
    db.query(msgDeleteQuery, [username, username], (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Database query error' });
            return;
        }
        db.query(custDeleteQuery, [username, username], (err, results) => {
            if (err) {
                res.status(500).json({ error: 'Database query error' });
                return;
            }
            
            if (results.affectedRows > 0) {
                res.json({ message: 'Profile deleted successfully' });
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        });
    });
});

// 메시지 정보를 저장하는 saveMessage 함수
app.post('/saveMessage', (req, res) => {
    const { room, userName, message } = req.body;

    // 현재 채팅방 id와 사용자 id 가져오기
    const getRoomIdQuery = 'SELECT id FROM ChatingRoom WHERE name = ?';
    const getUserIdQuery = 'SELECT id FROM Customer WHERE name = ?';

    db.query(getRoomIdQuery, [room], (roomErr, roomResults) => {
        if (roomErr || roomResults.length === 0) {
            return res.status(500).json({ error: 'Failed to get room id' });
        }
        const roomId = roomResults[0].id;

        db.query(getUserIdQuery, [userName], (userErr, userResults) => {
            if (userErr || userResults.length === 0) {
                return res.status(500).json({ error: 'Failed to get user id' });
            }
            const userId = userResults[0].id;

            // 메시지 저장
            const saveMessageQuery = 'INSERT INTO Messages (id, cust_id, chat, timelog) VALUES (?, ?, ?, ?)';
            const timelog = moment().format('YYYY-MM-DD HH:mm:ss');
            db.query(saveMessageQuery, [roomId, userId, message, timelog], (insertErr, insertResults) => {
                if (insertErr) {
                    return res.status(500).json({ error: 'Failed to save message' });
                }
                res.json({ message: 'Message saved successfully' });
            });
        });
    });
});

// 채팅방의 메시지 정보들을 불러오는 fetchMessages 함수
app.get('/fetchMessages/:room', (req, res) => {
    const { room } = req.params;

    // 채팅방의 메시지 및 사용자 이름 데이터를 가져오는 쿼리
    const query = `
        SELECT Messages.chat, Customer.name 
        FROM Messages 
        INNER JOIN Customer ON Messages.cust_id = Customer.id 
        WHERE Messages.id = (SELECT id FROM ChatingRoom WHERE name = ?)
    `;

    db.query(query, [room], (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Database query error' });
            return;
        }
        // 결과 데이터를 가공하여 사용자 이름과 메시지를 추출하여 전송
        const messages = results.map(result => ({ userName: result.name, message: result.chat }));
        res.json({ messages });
    });
});

// Socket.io configuration
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinRoom', (room) => {
        socket.join(room);
        console.log(`User joined room: ${room}`);
    });

    socket.on('sendMessage', (data) => {
        io.to(data.room).emit('receiveMessage', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
