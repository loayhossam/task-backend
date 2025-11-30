const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();

// --- 1. حل مشكلة CORS نهائياً (السماح للجميع) ---
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.use(bodyParser.json());

// --- 2. الاتصال بقاعدة البيانات ---
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ Fatal Error: MONGO_URI is missing from Environment Variables!");
} else {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('✅ Connected to MongoDB Successfully'))
        .catch(err => console.error('❌ MongoDB Connection Error:', err));
}

// --- 3. تصميم الجداول (المحدث) ---
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: String,
    role: { type: String, default: 'employee' }
});
const User = mongoose.model('User', UserSchema);

const TaskSchema = new mongoose.Schema({
    title: String,
    type: String, // design, video, code, other
    priority: String, // high, medium, low (جديد)
    status: { type: String, default: 'pending' },
    assignedTo: String,
    date: String,
    createdAt: { type: Date, default: Date.now }
});
const Task = mongoose.model('Task', TaskSchema);

// --- 4. الروابط (API Routes) ---

app.get('/', (req, res) => res.send('🚀 Ultimate Task Manager Backend is Running!'));

// تسجيل الدخول
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });
        if (user) res.json({ success: true, user });
        else res.status(401).json({ success: false, message: 'بيانات غير صحيحة' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// إدارة المهام
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Task.find().sort({ priority: 1, createdAt: -1 }); // ترتيب بالأهمية
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

app.delete('/api/tasks/:id', async (req, res) => { // (جديد) حذف المهمة
    try {
        await Task.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// إدارة الموظفين
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', async (req, res) => {
    try {
        const existing = await User.findOne({ username: req.body.username });
        if (existing) return res.status(400).json({ error: 'Username exists' });
        const newUser = new User(req.body);
        await newUser.save();
        res.json({ success: true, user: newUser });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// التفعيل الأولي
app.get('/api/setup', async (req, res) => {
    try {
        const count = await User.countDocuments();
        if (count === 0) {
            await User.create([
                { username: 'admin', password: '123', name: 'المدير العام', role: 'admin' },
                { username: 'user', password: '123', name: 'موظف تجريبي', role: 'employee' }
            ]);
            res.send('✅ System Setup Complete! Users Created.');
        } else {
            res.send('ℹ️ System already setup.');
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = app;
