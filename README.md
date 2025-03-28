# Companio: Your digital Companion 

## **About the Project**
Companio is an AI-powered companion designed to support seniors dealing with memory loss, cognitive decline, and loneliness. It leverages **empathetic AI conversations, memory recall through face recognition, and voice-first accessibility** to provide comfort and companionship. 

With **photo-based reminiscence therapy, AI-powered journaling, and sentiment-aware interactions**, Companio helps seniors stay connected to their past, their loved ones, and the world around them.

---

## **Features**
### **1. AI-Powered Companionship**
- **Empathetic AI Conversations** – Uses fine-tuned NLP to provide warm and emotionally aware responses.
- **Sentiment-Adaptive Interactions** – Detects user emotions and adjusts AI replies accordingly.
- **AI-Generated Storytelling & Poetry** – Engages seniors with personalized narratives.

### **2. Memory Recall & Cognitive Support**
- **Photo-Based Reminiscence Therapy** – Recognizes people in images and retrieves past memories associated with them.
- **AI-Powered Journaling** – Allows users to upload photos and write journals with automatic face-tagging.

### **3. Smart Daily Assistance**
- **Routine Manager** – Syncs with Google Calendar for medication reminders.
- **Weather & Dressing Suggestions** – Provides real-time weather updates and seasonal dressing advice.
- **Facial Recognition for Social Connection** – Helps seniors identify familiar faces.

### **4. Accessibility & Research-Backed UI**
- **Voice-First Interaction** – Allows full app navigation using speech commands.
- **Minimalist, Elderly-Friendly UI** – Uses large fonts, warm colors, and high contrast for easy usability.
- **Emergency Assistance** – Speech emotion recognition alerts caregivers during distress.

### **5. Scalable & Secure Infrastructure**
- **Azure AI Services** – Integrates OpenAI, Blob Storage, Cosmos DB, and Speech-to-Text.
- **Microservices Architecture** – Modular backend for efficient scaling.
- **Security Measures** – End-to-end encryption, password hashing, and secure medical data storage.


---

## **How to Run the Project**
### **1. Clone the Repository**
```sh
git clone https://github.com/your-repo/companio.git
cd companio
```
### 2. Set Up the Backend
```sh
cd server
npm install
yarn add nodemon
node server.js
```
### 3. Set Up the Frontend
```sh
cd client
npm install
yarn add
yarn start
```
### 4. Set Up AI Services
```sh
cd ai/EmpatheticBot
uvicorn conversation:app --reload
```

###5. Set Up Environment Variables
```sh
# Database Configuration
MONGODB_URI="your_mongodb_connection_string"

# Authentication
JWT_SECRET="your_jwt_secret"

# Server Configuration
PORT=5000
PYTHON_EXECUTABLE="your_python_path"

# API Keys
OPENWEATHER_API_KEY="your_openweather_api_key"

# Azure OpenAI Configuration
AZURE_OPENAI_KEY="your_azure_openai_key"
AZURE_OPENAI_ENDPOINT="your_azure_openai_endpoint"
AZURE_OPENAI_DEPLOYMENT_NAME="your_openai_deployment_name"

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING="your_azure_storage_connection_string"
AZURE_STORAGE_CONTAINER_NAME="your_azure_storage_container_name"

# Azure Speech Services
AZURE_SPEECH_KEY="your_azure_speech_key"
AZURE_SPEECH_REGION="your_azure_speech_region"

```
