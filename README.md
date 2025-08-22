### 1. Clone the Repository
```bash
git clone <repository-url>
cd mern-stack-app
```

### 2. Install Backend Dependencies
```bash
npm install
```

### 3. Install Frontend Dependencies
```bash
cd client
npm install
cd ..
```

### 4. Environment Configuration
Create a `config.env` file in the root directory:
```env
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/
JWT_SECRET=your-jwt-secret-key
PORT=5000
NODE_ENV=development


### Run 
npm run dev
