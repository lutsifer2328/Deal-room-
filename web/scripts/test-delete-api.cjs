const http = require('http');

const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/users/00000000-0000-0000-0000-000000000000',
    method: 'DELETE',
    headers: {
        'x-forwarded-for': '127.0.0.1'
    }
}, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => console.log('Status:', res.statusCode, 'Body:', data));
});

req.on('error', (e) => console.error(e));
req.end();
