#!/usr/bin/env node

const child_process = require('child_process');
const net = require('net');
const os = require('os');
const path = require('path');

let connected = false;

const socket = path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'navplace/navplace.sock');
const client = net.createConnection(socket);
client.on('connect', function () {
    connected = true;
    client.end();
});
client.on('error', function () {
    if (connected) {
        return;
    }
    // ~/.local/share/applications/navplace.desktop
    child_process.spawn('gtk-launch', ['navplace'], {detached: true, stdio: 'ignore'}).unref();
});

client.setTimeout(150);
client.on('timeout', () => client.destroy());
