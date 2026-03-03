// Debug version of loadStats with error logging
async function loadStatsDebug() {
    console.log('🔍 Starting loadStats...');
    try {
        const response = await fetch('/api/stats');
        console.log('📡 Response status:', response.status);
        const data = await response.json();
        console.log('📦 Received data:', JSON.stringify(data, null, 2));
        
        console.log('🔧 Setting CPU:', data.piStats.cpu);
        document.getElementById('cpu').textContent = data.piStats.cpu;
        
        console.log('🔧 Setting MEM:', data.piStats.mem);
        document.getElementById('mem').textContent = data.piStats.mem;
        
        console.log('🔧 Setting TEMP:', data.piStats.temp);
        document.getElementById('temp').textContent = data.piStats.temp;
        
        console.log('🔧 Setting DISK:', data.piStats.disk);
        document.getElementById('disk').textContent = data.piStats.disk;
        
        console.log('🔧 Setting UPTIME:', data.piStats.uptime);
        document.getElementById('uptime').textContent = data.piStats.uptime;
        
        console.log('🔧 Setting LOAD:', data.piStats.load);
        document.getElementById('load').textContent = data.piStats.load;
        
        console.log('🔧 Setting PROCESSES:', data.piStats.processes.length, 'items');
        const processes = document.getElementById('processes');
        processes.innerHTML = '';
        data.piStats.processes.forEach((proc, i) => {
            console.log(`  Process ${i}:`, proc.command);
            const row = `<tr><td>${proc.user}</td><td>${proc.pid}</td><td>${proc.cpu}</td><td>${proc.mem}</td><td>${proc.command}</td></tr>`;
            processes.innerHTML += row;
        });
        
        console.log('✅ loadStats completed successfully!');
    } catch (error) {
        console.error('❌ loadStats failed:', error);
        document.getElementById('cpu').textContent = 'ERROR';
    }
}

// Run it
loadStatsDebug();
