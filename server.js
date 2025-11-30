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

// الجداول
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: String,
    role: { type: String, default: 'employee' }
});
const User = mongoose.model('User', UserSchema);

const TaskSchema = new mongoose.Schema({
    title: String,
    type: String, // design, video, other
    status: { type: String, default: 'pending' },
    assignedTo: String,
    date: String,
    createdAt: { type: Date, default: Date.now }
});
const Task = mongoose.model('Task', TaskSchema);

// --- الروابط (APIs) ---

app.get('/', (req, res) => res.send('Backend Working v2'));

// تسجيل دخول
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });
        if (user) res.json({ success: true, user });
        else res.status(401).json({ success: false, message: 'Wrong credentials' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// إدارة المهام
app.get('/api/tasks', async (req, res) => {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
});

app.post('/api/tasks', async (req, res) => {
    const newTask = new Task(req.body);
    await newTask.save();
    res.json(newTask);
});

app.put('/api/tasks/:id', async (req, res) => {
    await Task.findByIdAndUpdate(req.params.id, { status: req.body.status });
    res.json({ success: true });
});

// --- إدارة المستخدمين (جديد) ---

// جلب كل الموظفين
app.get('/api/users', async (req, res) => {
    const users = await User.find();
    res.json(users);
});

// إضافة موظف جديد
app.post('/api/users', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.json({ success: true, user: newUser });
    } catch (e) { res.status(400).json({ error: 'Username exists' }); }
});

// حذف موظف
app.delete('/api/users/:id', async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// تغيير الباسورد
app.put('/api/users/:id', async (req, res) => {
    const { password } = req.body;
    await User.findByIdAndUpdate(req.params.id, { password });
    res.json({ success: true });
});

// تفعيل النظام
app.get('/api/setup', async (req, res) => {
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
});

module.exports = app;
