#!/bin/bash

# MissionKids Setup Script
# Este script configura o ambiente para primeira execução

echo "🎯 MissionKids - Setup Inicial"
echo "================================"
echo ""

# Check if MongoDB is running
echo "📊 Verificando MongoDB..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB não está rodando. Por favor, inicie o MongoDB primeiro."
    echo "   sudo systemctl start mongod"
    exit 1
fi
echo "✅ MongoDB está rodando"
echo ""

# Backend Setup
echo "🔧 Configurando Backend..."
cd /app/backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "  Criando ambiente virtual..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "  Instalando dependências..."
pip install -q -r requirements.txt

# Check .env file
if [ ! -f ".env" ]; then
    echo "  ⚠️  Arquivo .env não encontrado!"
    echo "  Criando .env de exemplo..."
    cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=missionkids
JWT_SECRET=$(openssl rand -hex 32)
CORS_ORIGINS=http://localhost:3000
EOF
    echo "  ✅ Arquivo .env criado com JWT_SECRET aleatório"
fi

# Populate store if empty
echo "  Populando loja de XP..."
python populate_store.py

echo "✅ Backend configurado"
echo ""

# Frontend Setup
echo "🎨 Configurando Frontend..."
cd /app/frontend

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "  Instalando dependências..."
    yarn install --silent
fi

# Check .env file
if [ ! -f ".env" ]; then
    echo "  ⚠️  Arquivo .env não encontrado!"
    echo "  Criando .env de exemplo..."
    cat > .env << EOF
REACT_APP_BACKEND_URL=http://localhost:8001
EOF
    echo "  ✅ Arquivo .env criado"
fi

echo "✅ Frontend configurado"
echo ""

echo "================================"
echo "🎉 Setup concluído com sucesso!"
echo ""
echo "Para iniciar a aplicação:"
echo ""
echo "1. Backend:"
echo "   cd /app/backend"
echo "   source venv/bin/activate"
echo "   uvicorn server:app --reload --host 0.0.0.0 --port 8001"
echo ""
echo "2. Frontend (em outro terminal):"
echo "   cd /app/frontend"
echo "   yarn start"
echo ""
echo "Acesse: http://localhost:3000"
echo "================================"
