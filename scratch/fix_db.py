import paramiko

def fix_db():
    ip = "46.225.9.243"
    username = "root"
    password = "OnExpertiz2026!Hetzner"
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(ip, username=username, password=password, timeout=15)
    
    # Upload a robust JS script
    js_content = """
    const { createClient } = require('@libsql/client');
    require('dotenv').config();

    const db = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:local.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    async function run() {
        console.log("URL used:", process.env.TURSO_DATABASE_URL || 'file:local.db');
        const commands = [
            "ALTER TABLE dijital_companies ADD COLUMN contact_name VARCHAR(100);",
            "ALTER TABLE dijital_companies ADD COLUMN contact_surname VARCHAR(100);",
            "ALTER TABLE mesai_companies ADD COLUMN contact_name VARCHAR(100);",
            "ALTER TABLE mesai_companies ADD COLUMN contact_surname VARCHAR(100);",
            "ALTER TABLE teslimat_companies ADD COLUMN contact_name VARCHAR(100);",
            "ALTER TABLE teslimat_companies ADD COLUMN contact_surname VARCHAR(100);",
            "ALTER TABLE clients ADD COLUMN contact_name VARCHAR(100);",
            "ALTER TABLE clients ADD COLUMN contact_surname VARCHAR(100);"
        ];

        for (const cmd of commands) {
            try {
                await db.execute(cmd);
                console.log(`Success: ${cmd}`);
            } catch (err) {
                console.log(`Error or Skipped: ${cmd} - ${err.message}`);
            }
        }
        console.log("Done!");
    }
    run();
    """
    
    sftp = ssh.open_sftp()
    with sftp.open("/data/qimlik/backend/force_alter.js", "w") as f:
        f.write(js_content)
    sftp.close()
    
    command = "docker exec qimlik-backend node force_alter.js"
    stdin, stdout, stderr = ssh.exec_command(command)
    
    out = stdout.read()
    err = stderr.read()
    
    print("STDOUT:", out.decode('utf-8', errors='ignore'))
    print("STDERR:", err.decode('utf-8', errors='ignore'))
    
    ssh.close()

if __name__ == "__main__":
    fix_db()
