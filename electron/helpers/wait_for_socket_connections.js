const fs = require('fs');
const net = require('net');
const path = require('path');

async function wait_for_socket_connections({socket, connection})
{
    try {
        await fs.promises.unlink(socket);
    }
    catch {
    }

    await fs.promises.mkdir(path.dirname(socket), {recursive: true});

    const server = net.createServer(function (sock) {
        sock.destroy();
        connection();
    });

    await new Promise(function (resolve, reject) {
        server.listen(socket, resolve);
        server.on('error', reject);
    });

    return {
        async [Symbol.asyncDispose]() {
            await new Promise(function (resolve) {
                server.close(resolve);
            });
            try {
                await fs.promises.unlink(socket);
            }
            catch {
            }
        }
    };
}

module.exports = wait_for_socket_connections;
