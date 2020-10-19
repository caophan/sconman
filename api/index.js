const path = require('path');
const express = require('express');

const config = require('./config');
if (config.credentials.client_id == null || config.credentials.client_secret == null) {
    console.error('Missing FORGE_CLIENT_ID or FORGE_CLIENT_SECRET env. variables.');
    return;
}
let app = express();
app.use(express.json({ limit: '50mb' }));
app.use('/forge/oauth', require('./routes/oauth'));
app.use('/forge/oss', require('./routes/oss'));
app.use('/forge/modelderivative', require('./routes/modelderivative'));
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.statusCode).json(err);
});

// Export the server middleware
module.exports = {
    path: '/api',
    handler: app,
}