import paramiko

def check_schema():
    ip = "46.225.9.243"
    username = "root"
    password = "OnExpertiz2026!Hetzner"
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(ip, username=username, password=password, timeout=15)
    
    node_script = """
    const db = require('./db');
    async function run() {
        const res = await db.query("PRAGMA table_info(mesai_companies);");
        console.log(res.rows);
    }
    run();
    """
    
    command = f'docker exec qimlik-backend node -e "{node_script.replace(chr(10), "")}"'
    stdin, stdout, stderr = ssh.exec_command(command)
    
    out = stdout.read()
    err = stderr.read()
    
    print("STDOUT:", out.decode('utf-8', errors='ignore'))
    print("STDERR:", err.decode('utf-8', errors='ignore'))
    
    ssh.close()

if __name__ == "__main__":
    check_schema()
