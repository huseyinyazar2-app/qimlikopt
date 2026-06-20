import paramiko

def fix_db():
    ip = "46.225.9.243"
    username = "root"
    password = "OnExpertiz2026!Hetzner"
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(ip, username=username, password=password, timeout=15)
    
    command = "docker exec qimlik-backend node force_alter.js"
    stdin, stdout, stderr = ssh.exec_command(command)
    
    out = stdout.read()
    err = stderr.read()
    
    with open("c:\\Users\\hyaza\\Documents\\antigravitiy\\qimlikOTP\\scratch\\db_fix_result.txt", "w", encoding="utf-8") as f:
        f.write("STDOUT: " + out.decode('utf-8', errors='ignore') + "\n")
        f.write("STDERR: " + err.decode('utf-8', errors='ignore') + "\n")
    
    ssh.close()

if __name__ == "__main__":
    fix_db()
