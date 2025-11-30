const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.log("❌ Error: MONGO_URI missing");
} else {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('✅ Connected to MongoDB'))
        .catch(err => console.error('❌ DB Error:', err));
}

// 1. تعريف الجداول
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: String,
    role: { type: String, default: 'employee' }
});
const User = mongoose.model('User', UserSchema);

const TaskSchema = new mongoose.Schema({
    title: String,
    type: String,
    status: { type: String, default: 'pending' },
    assignedTo: String,
    date: String,
    createdAt: { type: Date, default: Date.now }
});
const Task = mongoose.model('Task', TaskSchema);

// 2. الروابط (APIs)
app.get('/', (req, res) => res.send('Backend Updated v4 (Employees Ready) 🚀'));

// تسجيل الدخول
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });
        if (user) res.json({ success: true, user });
        else res.status(401).json({ success: false, message: 'Wrong data' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- أوامر التاسكات ---
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Task.find().sort({ createdAt: -1 });
        res.json(tasks);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const newTask = new Task(req.body);
        await newTask.save();
        res.json(newTask);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/tasks/:id', async (req, res) => {
    try {
        await Task.findByIdAndUpdate(req.params.id, { status: req.body.status });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- أوامر الموظفين (تأكد إن الجزء ده موجود) ---

// 1. جلب الموظفين
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. إضافة موظف
app.post('/api/users', async (req, res) => {
    try {
        const existing = await User.findOne({ username: req.body.username });
        if (existing) return res.status(400).json({ error: 'Username exists' });
        
        const newUser = new User(req.body);
        await newUser.save();
        res.json({ success: true, user: newUser });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. حذف موظف
app.delete('/api/users/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. تغيير باسورد
app.put('/api/users/:id', async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { password: req.body.password });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Setup
app.get('/api/setup', async (req, res) => {
    try {
        const count = await User.countDocuments();
        if (count === 0) {
            await User.create([
                { username: 'admin', password: '123', name: 'المدير', role: 'admin' },
                { username: 'user', password: '123', name: 'موظف', role: 'employee' }
            ]);
            res.send('Users Created!');
        } else {
            res.send('Users Exist');
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = app;
