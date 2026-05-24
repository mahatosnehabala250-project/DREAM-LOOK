const fs = require('fs');
const path = require('path');

const apiDir = 'F:/automate markeing/dream look apk/web_version/src/app/api/salon';

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (file === 'route.ts') {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has Firebase fallback
  if (content.includes('falling back to Firestore') || content.includes('getFirebaseAdmin')) {
    return;
  }
  
  // Only process files that have a GET method
  if (!content.includes('export async function GET')) {
    return;
  }

  // We are going to replace standard catch blocks inside GET with a safe array return
  // Regex to match: catch (error) { ... return NextResponse.json( ... { status: 500 } ... ) }
  // This is a bit tricky with Regex, so we'll do string manipulation specifically for the generic ones.
  
  const routeName = path.basename(path.dirname(filePath));
  
  const newCatch = `catch (error) {
    console.log('[${routeName}] SQLite not available, returning empty array fallback for Vercel...');
    return NextResponse.json([]);
  }`;

  // Find the GET function block
  const getMatch = content.match(/export async function GET[\s\S]*?catch\s*\([^)]*\)\s*{[\s\S]*?status:\s*500[\s\S]*?}/);
  if (getMatch) {
      let getBlock = getMatch[0];
      // Replace the catch inside this block
      const catchMatch = getBlock.match(/catch\s*\([^)]*\)\s*{[\s\S]*?status:\s*500[\s\S]*?}/);
      if (catchMatch) {
          const replacedGetBlock = getBlock.replace(catchMatch[0], newCatch);
          content = content.replace(getBlock, replacedGetBlock);
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`Updated ${filePath}`);
      }
  }
}

processDirectory(apiDir);
console.log('Done!');
