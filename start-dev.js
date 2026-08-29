const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting BikinPolygon Multi-App Development Environment...');
console.log('----------------------------------------------------');
console.log('🌐 Landing Page : http://localhost:5173');
console.log('🗺️  Web App GIS   : http://localhost:5174');
console.log('⚙️  Server API   : http://localhost:5000');
console.log('----------------------------------------------------');

const runProcess = (name, command, args, cwd, colorCode) => {
    const proc = spawn(command, args, { cwd: path.join(__dirname, cwd), shell: true });
    
    proc.stdout.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
            if (line) console.log(`\x1b[${colorCode}m[${name}]\x1b[0m ${line}`);
        });
    });

    proc.stderr.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
            if (line) console.error(`\x1b[${colorCode}m[${name} ERR]\x1b[0m ${line}`);
        });
    });

    proc.on('close', (code) => {
        console.log(`[${name}] process exited with code ${code}`);
    });

    return proc;
};

runProcess('SERVER', 'npm', ['run', 'dev'], 'server', '33'); // Yellow
runProcess('LANDING', 'npm', ['run', 'dev'], 'landing-page', '36'); // Cyan
runProcess('WEB-APP', 'npm', ['run', 'dev'], 'web-app', '32'); // Green
