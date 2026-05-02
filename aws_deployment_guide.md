# Deploying Your Restaurant App to AWS (Free Tier)

Since you are using the AWS Free Tier, the most cost-effective way to host your entire application (Node.js Server, Python AI Service, and React Frontend) is on a single **Amazon EC2 instance** (virtual server). Your backend uses SQLite, which is file-based, so you don't need a separate database service like RDS.

Here is the step-by-step plan to get your app live.

## Architecture
- **EC2 Instance (t2.micro/t3.micro)**: Runs everything.
- **Nginx**: A web server that serves your React frontend and routes traffic to your backends.
- **PM2**: A process manager that keeps your Node.js and Python servers running in the background.

---

### Step 1: Push Your Code to GitHub
The easiest way to get your code onto the AWS server is by using a Git repository.
1. Create a free repository on [GitHub](https://github.com/).
2. Commit your code and push it to the main branch.
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

### Step 2: Launch an EC2 Instance on AWS
1. Log in to the [AWS Management Console](https://console.aws.amazon.com/).
2. Search for **EC2** and click **Launch Instance**.
3. **Name**: `restro-server`
4. **AMI (OS)**: Select **Ubuntu** (Ubuntu Server 24.04 LTS). *Make sure it says "Free tier eligible".*
5. **Instance Type**: Select `t2.micro` or `t3.micro` (Free tier eligible).
6. **Key Pair**: Click **Create new key pair**. Name it `aws-restro-key`, select **RSA** and **.pem**, then download it. Keep this file safe!
7. **Network Settings**:
   - Check **Allow SSH traffic**
   - Check **Allow HTTP traffic from the internet**
   - Check **Allow HTTPS traffic from the internet**
8. **Storage**: You get up to 30GB free. Set it to `20 GB` (gp3) to be safe.
9. Click **Launch Instance**.

### Step 3: Connect to Your EC2 Instance
Once the instance status shows "Running", connect to it via your local terminal.
1. Open PowerShell or Command Prompt where you downloaded your `.pem` key.
2. Run this to connect (replace the IP with your instance's Public IPv4 address from the AWS console):
   ```bash
   ssh -i "aws-restro-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
   ```
*(If you have issues on Windows with permissions, AWS provides a browser-based "EC2 Instance Connect" button in the console which is even easier).*

### Step 4: Install Required Software on EC2
Once connected, run these commands to install Node.js, Python, Nginx, and PM2:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python and pip
sudo apt install -y python3 python3-pip python3-venv

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2
```

### Step 5: Clone Your Repository & Setup
Clone your code onto the server:
```bash
git clone <YOUR_GITHUB_REPO_URL> restro
cd restro
```

#### 1. Setup Node.js Server
```bash
cd server
npm install
# Start server in the background using PM2
pm2 start index.js --name "restro-node"
cd ..
```

#### 2. Setup Python AI Service
```bash
cd ai-service
# Create a virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Start python app via PM2
pm2 start app.py --name "restro-ai" --interpreter python3
cd ..
```

#### 3. Build React Frontend
```bash
cd client
npm install
npm run build
cd ..
```

### Step 6: Configure Nginx
Nginx will serve your React app and proxy API requests.
1. Open the default Nginx config:
   ```bash
   sudo nano /etc/nginx/sites-available/default
   ```
2. Replace the contents with the following (update ports if your server/AI run on different ones, e.g., Node on 5000, AI on 8000):
   ```nginx
   server {
       listen 80;
       server_name _; # Or your domain name

       # Serve React Frontend
       location / {
           root /home/ubuntu/restro/client/dist;
           index index.html index.htm;
           try_files $uri $uri/ /index.html;
       }

       # Proxy to Node.js backend
       location /api/ {
           proxy_pass http://localhost:5000/; # Change port if your node app uses a different one
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # Proxy to Python AI Service
       location /ai/ {
           proxy_pass http://localhost:8000/; # Change port if AI service uses a different one
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```
3. Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).
4. Restart Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

### Step 7: Finalize PM2
To ensure your servers restart if the EC2 instance reboots:
```bash
pm2 save
pm2 startup
# Follow the command PM2 prints out to configure startup scripts
```

---
**Your app should now be live!** You can view it by going to your EC2 instance's Public IP address in your browser: `http://<YOUR_EC2_PUBLIC_IP>`
