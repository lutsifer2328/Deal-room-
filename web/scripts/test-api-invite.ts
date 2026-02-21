async function main() {
    const email = `test-api-${Date.now()}@agency.com`;
    console.log(`Calling API for: ${email}`);

    try {
        const response = await fetch('http://localhost:3000/api/invite-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                fullName: 'API Test User',
                role: 'admin',
                isInternal: true,
            })
        });

        const data = await response.json();
        console.log('API Status:', response.status);
        console.log('API Response:', data);
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

main();
