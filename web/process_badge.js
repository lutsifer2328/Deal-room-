const sharp = require('sharp');

async function processBadge() {
    const input = 'C:\\Users\\lutsi\\.gemini\\antigravity\\brain\\6a9affc9-66a2-440b-bbd6-9018ab38eb95\\media__1772568271421.jpg';
    const metadata = await sharp(input).metadata();
    console.log('Badge dimensions:', metadata.width, metadata.height);

    await sharp(input)
        .toFile('c:\\Users\\lutsi\\OneDrive\\Desktop\\Agenzia Deal Room\\web\\public\\email-badge.jpg');

    console.log('Badge processed and saved to public/email-badge.jpg');
}

processBadge().catch(console.error);
