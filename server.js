const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// الاتصال بقاعدة البيانات
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ Error: MONGO_URI is missing.");
} else {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('✅ Connected to MongoDB'))
        .catch(err => console.error('❌ DB Error:', err));
}

// جداول البيانات
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

// الروابط
app.get('/', (req, res) => res.send('Backend is Working!'));

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });
        if (user) res.json({ success: true, user });
        else res.status(401).json({ success: false, message: 'Wrong pass' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

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

app.get('/api/setup', async (req, res) => {
    const count = await User.countDocuments();
    if (count === 0) {
        await User.create([
            { username: 'admin', password: '123', name: 'المدير', role: 'admin' },
            { username: 'user', password: '123', name: 'الموظف', role: 'employee' }
        ]);
        res.send('Users Created!');
    } else {
        res.send('Users already exist.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
