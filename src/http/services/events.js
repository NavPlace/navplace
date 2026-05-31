const WebSocket = require('ws');
const db = require('../../../db');
const user_create = require('../models/user_create');

const HEARTBEAT_INTERVAL_MS = 30_000;
const UPGRADE_PATH = '/api/v1/events';

const subscriptions = new Map(); // user_uid -> Set<WebSocket>
let wss = null;
let heartbeat_timer = null;

function setup_websockets(server)
{
    wss = new WebSocket.Server({noServer: true});

    server.on('upgrade', async function (req, socket, head) {
        let url;
        try {
            url = new URL(req.url, 'http://localhost');
        }
        catch {
            socket.destroy();
            return;
        }
        if (url.pathname !== UPGRADE_PATH) {
            return; // not ours — let any other handler deal with it
        }

        console.log(`[ws_upgrade] ${req.url} x-auth-user=${req.headers['x-auth-user'] || '(none)'}`);

        let user;
        try {
            user = await resolve_user(req);
        }
        catch (error) {
            console.error(`[ws_upgrade_error] ${error.stack || error.message}`);
            socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
            socket.destroy();
            return;
        }

        if (!user) {
            console.log('[ws_unauthorized] missing x-auth-user — responding 401');
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }

        wss.handleUpgrade(req, socket, head, function (ws) {
            subscribe(user.uid, ws);
            send(ws, make_message('hello', null));
            console.log(`[ws_connect] user_uid=${user.uid} subscribers=${subscriptions.get(user.uid).size}`);
        });
    });

    heartbeat_timer = setInterval(function () {
        for (const sockets of subscriptions.values()) {
            for (const ws of sockets) {
                if (ws.is_alive === false) {
                    console.log('[ws_heartbeat_terminate] unresponsive socket terminated');
                    ws.terminate();
                    continue;
                }
                ws.is_alive = false;
                try { ws.ping(); } catch {}
            }
        }
    }, HEARTBEAT_INTERVAL_MS);
    heartbeat_timer.unref?.();

    server.on('close', function () {
        if (heartbeat_timer) {
            clearInterval(heartbeat_timer);
            heartbeat_timer = null;
        }
        wss?.close();
    });
}

async function resolve_user(req)
{
    const authwall_user_uid = req.headers['x-auth-user'];
    if (!authwall_user_uid) {
        return null;
    }
    let user = await db('users').where({authwall_user_uid}).first();
    user ??= await user_create({authwall_user_uid});
    return user;
}

function subscribe(user_uid, ws)
{
    let set = subscriptions.get(user_uid);
    if (!set) {
        set = new Set();
        subscriptions.set(user_uid, set);
    }
    set.add(ws);

    ws.is_alive = true;
    ws.on('pong', function () { ws.is_alive = true; });
    ws.on('close', function (code, reason) {
        console.log(`[ws_close] user_uid=${user_uid} code=${code} reason=${JSON.stringify(reason.toString())}`);
        unsubscribe(user_uid, ws);
    });
    ws.on('error', function (error) {
        console.error(`[ws_error] user_uid=${user_uid} ${error.message}`);
        unsubscribe(user_uid, ws);
    });
}

function unsubscribe(user_uid, ws)
{
    const set = subscriptions.get(user_uid);
    if (!set) return;
    set.delete(ws);
    console.log(`[ws_disconnect] user_uid=${user_uid} subscribers=${set.size}`);
    if (set.size === 0) {
        subscriptions.delete(user_uid);
    }
}

function notify(user_uid, type, value)
{
    const set = subscriptions.get(user_uid);
    if (!set || set.size === 0) {
        console.log(`[ws_notify_skip] user_uid=${user_uid} type=${type} subscribers=0`);
        return;
    }
    console.log(`[ws_notify] user_uid=${user_uid} type=${type} subscribers=${set.size}`);
    const message = make_message(type, value);
    for (const ws of set) {
        if (ws.readyState !== WebSocket.OPEN) {
            continue;
        }
        try {
            ws.send(message);
        }
        catch {
            unsubscribe(user_uid, ws);
        }
    }
}

function make_message(type, value)
{
    return JSON.stringify({type, value, time: new Date().toISOString()});
}

function send(ws, event)
{
    try {
        ws.send(JSON.stringify(event));
    }
    catch {}
}

module.exports = {setup_websockets, notify};
