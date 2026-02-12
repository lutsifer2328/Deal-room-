
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

// Load env manully
const envPath = path.resolve(__dirname, '../.env.local');
let apiKey = process.env.RESEND_API_KEY;

if (!apiKey && fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/RESEND_API_KEY=(.+)/);
    if (match) {
        apiKey = match[1].trim();
    }
}

const resultFile = path.resolve(__dirname, 'email-result.json');

if (!apiKey) {
    fs.writeFileSync(resultFile, JSON.stringify({ error: 'API Key missing' }));
    process.exit(1);
}

const resend = new Resend(apiKey);
const targetEmail = process.argv[2];

(async () => {
    try {
        console.log(`Sending from dealroom@agenzia.bg to ${targetEmail}`);
        const result = await resend.emails.send({
            from: 'Agenzia Deal Room <dealroom@agenzia.bg>',
            to: [targetEmail],
            subject: 'Test Email Verification',
            html: '<strong>Verification Test</strong><br>If you see this, the domain is correctly configured.'
        });

        fs.writeFileSync(resultFile, JSON.stringify(result, null, 2));
        console.log('Done, wrote result to ' + resultFile);

    } catch (err) {
        fs.writeFileSync(resultFile, JSON.stringify({ error: err.message, stack: err.stack }, null, 2));
        console.error('Error wrote to ' + resultFile);
    }
})();
