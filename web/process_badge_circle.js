const sharp = require('sharp');

async function createCircularBadge() {
    const input = 'C:\\Users\\lutsi\\.gemini\\antigravity\\brain\\6a9affc9-66a2-440b-bbd6-9018ab38eb95\\media__1772568271421.jpg';
    const metadata = await sharp(input).metadata();
    console.log('Badge dimensions:', metadata.width, metadata.height);

    const width = metadata.width;
    const height = metadata.height;

    // The circle diameter is slightly less than the min dimension. Let's approximate.
    // The image is 1024x979. Let's create an SVG circle mask.
    const cx = width / 2;
    const cy = height / 2;
    const r = 475; // A 950px diameter circle should perfectly cut out the teal ring, leaving out the corners.

    const maskSvg = Buffer.from(
        `<svg width="${width}" height="${height}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="white" />
    </svg>`
    );

    await sharp(input)
        .composite([{
            input: maskSvg,
            blend: 'dest-in'
        }])
        .png()
        .toFile('c:\\Users\\lutsi\\OneDrive\\Desktop\\Agenzia Deal Room\\web\\public\\email-badge.png');

    console.log('Transparent circular badge generated and saved to public/email-badge.png');
}

createCircularBadge().catch(console.error);
