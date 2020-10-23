const express = require('express');

let router = express.Router();

// POST /api/forge/modelderivative/jobs - submits a new translation job for given object URN.
// Request body must be a valid JSON in the form of { "objectName": "<translated-object-urn>" }.
router.post('/done', async (req, res, next) => {
    res.status(200).end();
});

module.exports = router;
