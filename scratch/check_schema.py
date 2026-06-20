import paramiko

def check_schema():
    ip = "46.225.9.243"
    username = "root"
    password = "OnExpertiz2026!Hetzner"
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(ip, username=username, password=password, timeout=15)
    
    # query local.db using sqlite3
    command = 'docker exec qimlik-backend sqlite3 local.db ".schema mesai_companies"'
    stdin, stdout, stderr = ssh.exec_command(command)
    
    out = stdout.read()
    err = stderr.read()
    
    print("STDOUT:", out.decode('utf-8', errors='ignore'))
    print("STDERR:", err.decode('utf-8', errors='ignore'))
    
    ssh.close()

if __name__ == "__main__":
    check_schema()
