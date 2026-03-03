#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');

const PORT = 8081;
const SECRET_PATH = '/admin';
const SESSION_DURATION = 3600000;

const ADMIN_USER = process.env.ADMIN_USER || 'henry';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Dfhj!';

const sessions = new Map();

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

function parseCookies(cookieHeader) {
    const cookies = {};
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            cookies[name] = value;
        });
    }
    return cookies;
}

function validateSession(token) {
    if (!token) return false;
    const session = sessions.get(token);
    if (!session) return false;
    if (Date.now() > session.expires) {
        sessions.delete(token);
        return false;
    }
    return true;
}

function getPiStats() {
    return new Promise((resolve) => {
        const commands = {
            cpu: "top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'",
            mem: "free | grep Mem | awk '{printf \"%.1f/%.1f GB (%.1f%%)\", $3/1024/1024, $2/1024/1024, $3*100/$2}'",
            temp: "vcgencmd measure_temp | cut -d'=' -f2",
            uptime: "uptime -p",
            disk: "df -h / | tail -1 | awk '{printf \"%s/%s (%s)\", $3, $2, $5}'",
            load: "uptime | awk -F'load average:' '{print $2}' | xargs",
            processes: "ps aux --sort=-%mem | head -6"
        };
        const results = {};
        let completed = 0;
        Object.entries(commands).forEach(([key, cmd]) => {
            exec(cmd, { timeout: 5000 }, (error, stdout) => {
                if (error) {
                    results[key] = 'N/A';
                } else if (key === 'processes') {
                    // Parse process output into array of objects
                    const lines = stdout.trim().split('\n');
                    results[key] = lines.slice(1).map(line => {
                        const parts = line.split(/\s+/);
                        return {
                            user: parts[0],
                            pid: parts[1],
                            cpu: parts[2],
                            mem: parts[3],
                            command: parts.slice(10).join(' ').substring(0, 50)
                        };
                    });
                } else {
                    results[key] = stdout.trim();
                }
                completed++;
                if (completed === Object.keys(commands).length) resolve(results);
            });
        });
    });
}

function getUptimeKumaStatus() {
    return new Promise((resolve) => {
        exec(`sqlite3 /home/henry/uptime-kuma/data/kuma.db "SELECT m.name, h.status, h.msg, datetime(h.time, 'unixepoch', 'localtime') as last_check FROM monitor m LEFT JOIN heartbeat h ON m.id = h.monitor_id WHERE m.active = 1 GROUP BY m.id ORDER BY m.id;"`, 
        { timeout: 5000 }, (error, stdout) => {
            if (error) { resolve([]); return; }
            const monitors = stdout.trim().split('\n').map(line => {
                const [name, status, msg, lastCheck] = line.split('|');
                return { name, status: parseInt(status), msg, lastCheck };
            });
            resolve(monitors);
        });
    });
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const cookies = parseCookies(req.headers.cookie || '');
    const isAuthed = validateSession(cookies.session);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

    if (url.pathname === '/api/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { username, password } = JSON.parse(body);
                if (username === ADMIN_USER && password === ADMIN_PASS) {
                    const token = generateToken();
                    sessions.set(token, { user: username, expires: Date.now() + SESSION_DURATION });
                    res.writeHead(200, {
                        'Content-Type': 'application/json',
                        'Set-Cookie': `session=${token}; Path=/; Max-Age=3600; HttpOnly`
                    });
                    res.end(JSON.stringify({ success: true }));
                } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Invalid credentials' }));
                }
            } catch (e) {
                res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid request' }));
            }
        });
        return;
    }

    if (url.pathname === '/api/stats' && isAuthed) {
        try {
            const [piStats, kumaStatus] = await Promise.all([getPiStats(), getUptimeKumaStatus()]);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ piStats, kumaStatus }));
        } catch (e) {
            res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    if (url.pathname === '/api/logout' && isAuthed) {
        sessions.delete(cookies.session);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': 'session=; Path=/; Max-Age=0' });
        res.end(JSON.stringify({ success: true }));
        return;
    }

    if (url.pathname === SECRET_PATH || url.pathname === SECRET_PATH + "/") {
        const htmlPath = path.join(__dirname, 'index.html');
        if (fs.existsSync(htmlPath)) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(fs.readFileSync(htmlPath, 'utf8'));
            return;
        }
    }

    res.writeHead(404); res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`🔒 Admin dashboard: http://127.0.0.1:${PORT}${SECRET_PATH}`);
});
