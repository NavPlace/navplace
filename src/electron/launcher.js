#!/usr/bin/env node

const child_process = require('child_process');
const config = require('./config');
const net = require('net');

let connected = false;

const client = net.createConnection(config.socket_file);
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
