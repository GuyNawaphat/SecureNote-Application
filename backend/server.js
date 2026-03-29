import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

const app = express();
app.use(cors());
app.use(express.json());

function initDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ notes: [] }, null, 2));
    }
}
initDB();

function getDB() {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (!parsed.notes) parsed.notes = [];
    return parsed;
}

function saveDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    
    const token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.split(' ')[1] 
        : authHeader;

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    if (token !== process.env.SECRET_TOKEN) {
        return res.status(401).json({ error: 'Invalid token.' });
    }
    
    next();
}

app.get('/api/notes', (req, res) => {
    const db = getDB();
    res.status(200).json(db.notes);
});

app.post('/api/notes', authenticateToken, (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required.' });
    }

    const db = getDB();
    const newNote = {
        id: uuidv4(),
        title,
        content,
        createdAt: new Date().toISOString()
    };
    
    db.notes.push(newNote);
    saveDB(db);

    res.status(201).json(newNote);
});

app.delete('/api/notes/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const db = getDB();
    
    const noteIndex = db.notes.findIndex(n => n.id === id);
    if (noteIndex === -1) {
        return res.status(404).json({ error: 'Note not found.' });
    }

    db.notes.splice(noteIndex, 1);
    saveDB(db);

    res.status(200).json({ message: 'Note deleted successfully.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`SecureNote API server running on http://localhost:${PORT}`);
});
