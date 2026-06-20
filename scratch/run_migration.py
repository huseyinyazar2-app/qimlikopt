import paramiko

def run_remote_migration():
    ip = "46.225.9.243"
    username = "root"
    password = "OnExpertiz2026!Hetzner"
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print("Connecting...")
    ssh.connect(ip, username=username, password=password, timeout=15)
    
    print("Running node alter_db.js inside the container or on the host...")
    command = "docker exec qimlik-backend node alter_db.js"
    stdin, stdout, stderr = ssh.exec_command(command)
    
    out = stdout.read()
    err = stderr.read()
    
    print("STDOUT:", out.decode('utf-8', errors='ignore'))
    print("STDERR:", err.decode('utf-8', errors='ignore'))
    
    ssh.close()

if __name__ == "__main__":
    import sys
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='ignore')
    run_remote_migration()
