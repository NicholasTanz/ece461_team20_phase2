<h1>Package Manager</h1>

<p>
A web-based package management system that allows users to <strong>rate</strong>, <strong>upload</strong>, <strong>update</strong>, and <strong>remove</strong> packages from the system. The application consists of both a <strong>frontend</strong> and a <strong>backend</strong>, developed using <strong>TypeScript</strong> and deployed using <strong>AWS</strong>.
</p>

---

<h2>Team Members</h2>
<ul>
  <li>Nicholas Tanzillo</li>
  <li>Akash Amalarasan</li>
  <li>Charlie Kim</li>
  <li>Alison Liang</li>
</ul>

---

<h2>Tech Stack</h2>
<ul>
  <li><strong>Frontend</strong>: Vue.js with TypeScript</li>
  <li><strong>Backend</strong>: Node.js with Express</li>
  <li><strong>Deployed on</strong>: AWS</li>
</ul>

---

<h2>AWS Installation Instructions</h2>

<h3>1. Launch an EC2 Instance</h3>
<ol>
  <li>Navigate to the AWS Management Console and go to the <strong>EC2 Dashboard</strong>.</li>
  <li>Launch a new instance:
    <ul>
      <li><strong>AMI</strong>: Amazon Linux 2 or Ubuntu 22.04.</li>
      <li><strong>Instance Type</strong>: t2.micro (or higher based on your needs).</li>
      <li><strong>Security Group</strong>: Ensure ports <code>22</code> (SSH), <code>3000</code>, and <code>5173</code> are open to your IP or <code>0.0.0.0/0</code>.</li>
      <li><strong>IAM Role</strong>: Attach a role with S3 and EC2 access if required.</li>
    </ul>
  </li>
  <li>Download the private key (<code>.pem</code>) during the instance launch.</li>
</ol>

<h3>2. SSH into the Instance</h3>
<pre>
<code>ssh -i path/to/your-key.pem ec2-user@&lt;ec2-public-ip&gt;</code>
</pre>

<h3>3. Install Docker</h3>
<ol>
  <li>Update the package manager:
    <pre><code>sudo yum update -y   # Amazon Linux
sudo apt update -y   # Ubuntu</code></pre>
  </li>
  <li>Install Docker:
    <pre><code>sudo yum install -y docker   # Amazon Linux
sudo apt install -y docker   # Ubuntu</code></pre>
  </li>
  <li>Start Docker:
    <pre><code>sudo systemctl start docker
sudo systemctl enable docker</code></pre>
  </li>
</ol>

<h3>4. Clone the Project</h3>
<ol>
  <li>Install Git:
    <pre><code>sudo yum install -y git   # Amazon Linux
sudo apt install -y git   # Ubuntu</code></pre>
  </li>
  <li>Clone the repository:
    <pre><code>git clone &lt;your-repo-url&gt;
cd &lt;repository-folder&gt;</code></pre>
  </li>
</ol>

<h3>5. Run the Application in Docker</h3>
<ol>
  <li>Build and start the Docker container:
    <pre><code>docker run -it -p 3000:5173 -v $(pwd):/usr/src/app -w /usr/src/app node:18 bash</code></pre>
  </li>
  <li>Install dependencies inside the container:
    <pre><code>npm install</code></pre>
  </li>
  <li>Start the server:
    <pre><code>npm run dev -- --host</code></pre>
  </li>
  <li>Access the application:
    <pre><code>http://&lt;ec2-public-ip&gt;:3000</code></pre>
  </li>
</ol>

---

<h2>What Metrics We Use to Calculate NetScore and Justifications</h2>

<h3>1. Bus Factor</h3>
<p>Measures how many contributors are actively working on the codebase. Based on the total number of contributors and assigned an exponential score.</p>

<h3>2. Ramp-Up Time</h3>
<p>
Measures how quickly a new developer can understand the codebase. Based on:
<ul>
  <li>Word count in the README.</li>
  <li>Comment-to-code ratio.</li>
  <li>External links in the README.</li>
  <li>Whether a README is present (score of 0 if absent).</li>
</ul>
</p>

<h3>3. Correctness</h3>
<p>Evaluates how tested the codebase is. Metrics include:
<ul>
  <li>Presence of test suites.</li>
  <li>Ratio of test lines of code (slotc) to source lines of code (sloc).</li>
</ul>
</p>

<h3>4. Responsive Maintainer</h3>
<p>Measures how actively the package is maintained. Based on:
<ul>
  <li>Ratio of open to closed issues and pull requests.</li>
  <li>Frequency of updates.</li>
</ul>
</p>

<h3>5. License Compatibility</h3>
<p>Checks if the package’s license is compatible with the project’s GNU LGPLv2.1 license. Outputs <code>1</code> for compatible licenses and <code>0</code> for incompatible ones.</p>

<h3>6. Good Pinning Practice</h3>
<p>Evaluates dependency management by checking for pinned major and minor versions in <code>package.json</code>.</p>

<h3>7. Pull Request Contribution</h3>
<p>Analyzes the last 100 commits to see how many originated from pull requests. Measures lines modified from these commits compared to total lines modified.</p>

---

<h2>Useful Commands</h2>

<h3>Testing CURL Endpoints</h3>
<pre><code>npx ts-node src/tests/CURLtests.ts</code></pre>

<h3>Cleaning CURL Test Files</h3>
<pre><code>curl -X DELETE "http://localhost:3000/cleanup"</code></pre>

<h3>Building and Running the Server</h3>
<ol>
  <li>Build Files:
    <pre><code>npx tsc --build</code></pre>
  </li>
  <li>Start Server:
    <pre><code>npx ts-node src/run.ts</code></pre>
  </li>
</ol>

<h3>Uploading Packages</h3>
<h4>Via Content</h4>
<pre><code>curl -X POST "http://localhost:3000/sender/package/" \
     -H "Content-Type: application/json" \
     -d '{
           "Name": "test-package-content",
           "Version": "1.1.0",
           "Content": "UEsDBAoAAAAAACAfUFkAAAAAAAAAAAAAAAASAAkAdW5kZXJzY29yZS1t",
           "JSProgram": "if (process.argv.length === 7) { console.log(\"Success\"); process.exit(0); } else { console.log(\"Failed\"); process.exit(1); }"
         }'</code></pre>

<h4>Via URL</h4>
<pre><code>curl -X POST "http://localhost:3000/sender/package" \
     -H "Content-Type: application/json" \
     -d '{
           "Name": "test-package-url",
           "Version": "1.0.0",
           "URL": "https://github.com/jashkenas/underscore",
           "JSProgram": "if (process.argv.length === 7) { console.log(\"Success\"); process.exit(0); } else { console.log(\"Failed\"); process.exit(1); }"
         }'</code></pre>

<h3>Downloading Packages</h3>
<pre><code>curl -X GET "http://localhost:3000/receiver/download/test-package-content-ver-1-1-0" -o "downloads/test-package-content-1.0.0.zip"</code></pre>

---

## Local Development Setup

This project includes a **backend** and a **frontend**, which need to be set up separately for local development.

---

### **Backend Setup**

1. Navigate to the root directory of the project:
   ```bash
   cd ece461_team20_phase2
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Start the backend server:
   ```bash
   npx ts-node src/run.ts
   ```

4. Verify the backend is running:
   - By default, the server listens on port `3000`. You can confirm by accessing:
     ```
     http://localhost:3000
     ```

---

### **Frontend Setup**

1. Navigate to the frontend directory:
   ```bash
   cd ece461_team20_phase2/src/frontend/vite-project
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   ```

4. Access the frontend:
   - The frontend runs on port `5173` by default. You can access it at:
     ```
     http://localhost:5173
     ```

---

### **Important Notes**
- The **backend** and **frontend** have independent setups, each with its own `package.json` and `package-lock.json` files. Ensure you install dependencies in the correct directories:
  - **Backend dependencies**: Installed in the root directory.
  - **Frontend dependencies**: Installed in `src/frontend/vite-project`.
  
- If you make changes to the backend code, restart the server to reflect updates.

---



