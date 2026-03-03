const https = require('https');

const PAT = 'sbp_36f95224948f4fd8b90b030db5770b5e5508386d';
const PROJECT_REF = 'prj_ePdnTwO8iJ7L0m'; // Will lookup if needed, but we can query it first

async function listProjects() {
    const options = {
        hostname: 'api.supabase.com',
        path: '/v1/projects',
        method: 'GET',
        headers: {
            'Authorization': \`Bearer \${PAT}\`
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

listProjects().then(console.log).catch(console.error);
