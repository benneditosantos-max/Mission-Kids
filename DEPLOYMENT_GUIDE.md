# 🚀 Guia de Deployment - MissionKids

## 📋 Pré-requisitos

### Servidor
- Ubuntu 20.04+ ou Debian 11+
- 2GB RAM mínimo (4GB recomendado)
- 20GB espaço em disco
- Docker 20.10+
- Docker Compose 1.29+

### Domínio (Opcional)
- Domínio configurado apontando para o servidor
- Acesso SSH ao servidor

## 🛠️ Opções de Deploy

### Opção 1: Deploy com Docker (Recomendado)

#### 1.1 Preparação do Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalação
docker --version
docker-compose --version
```

#### 1.2 Clone do Repositório

```bash
# Clone o código
git clone <seu-repositorio> /opt/missionkids
cd /opt/missionkids
```

#### 1.3 Configuração

```bash
# Copiar arquivo de exemplo
cp .env.production.example .env.production

# Editar configurações
nano .env.production
```

**Configurações importantes:**
```env
# Gerar JWT_SECRET forte
JWT_SECRET=$(openssl rand -hex 32)

# Configurar CORS para seu domínio
CORS_ORIGINS=https://seu-dominio.com

# MongoDB (usar MongoDB Atlas em produção)
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/missionkids
```

#### 1.4 Deploy Automático

```bash
# Executar script de deploy
sudo ./deploy.sh
```

O script irá:
- ✅ Verificar pré-requisitos
- ✅ Configurar ambiente
- ✅ Fazer backup (se existir deployment anterior)
- ✅ Build do frontend
- ✅ Construir imagens Docker
- ✅ Iniciar containers
- ✅ Verificar saúde dos serviços

#### 1.5 Verificação

```bash
# Ver status
docker-compose ps

# Ver logs
docker-compose logs -f

# Testar aplicação
curl http://localhost/health
```

### Opção 2: Deploy Manual (Sem Docker)

#### 2.1 Instalar Dependências

```bash
# Python e pip
sudo apt install python3 python3-pip python3-venv -y

# Node.js e Yarn
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y
npm install -g yarn

# MongoDB
sudo apt install mongodb -y

# Nginx
sudo apt install nginx -y

# Supervisor
sudo apt install supervisor -y
```

#### 2.2 Backend Setup

```bash
cd /app/backend

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Configurar .env
nano .env
```

#### 2.3 Frontend Build

```bash
cd /app/frontend

# Instalar dependências
yarn install

# Build de produção
yarn build
```

#### 2.4 Configurar Nginx

```bash
# Copiar configuração
sudo cp /app/nginx-production.conf /etc/nginx/sites-available/missionkids
sudo ln -s /etc/nginx/sites-available/missionkids /etc/nginx/sites-enabled/

# Remover default
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar nginx
sudo systemctl restart nginx
```

#### 2.5 Configurar Supervisor

```bash
# Copiar configuração
sudo cp /app/supervisord-production.conf /etc/supervisor/conf.d/missionkids.conf

# Recarregar supervisor
sudo supervisorctl reread
sudo supervisorctl update

# Iniciar serviços
sudo supervisorctl start missionkids:*
```

#### 2.6 Popular Store

```bash
cd /app/backend
source venv/bin/activate
python populate_store.py
```

## 🔒 Configuração SSL (HTTPS)

### Usando Let's Encrypt (Gratuito)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Renovação automática
sudo certbot renew --dry-run
```

## 🔥 Firewall

```bash
# Permitir SSH
sudo ufw allow 22

# Permitir HTTP e HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Ativar firewall
sudo ufw enable
```

## 📊 Monitoramento

### Logs

```bash
# Logs do Docker
docker-compose logs -f

# Logs do Supervisor
sudo tail -f /var/log/supervisor/*.log

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Health Checks

```bash
# Backend health
curl http://localhost/health

# Verificar containers
docker ps

# Verificar serviços (sem Docker)
sudo supervisorctl status
```

## 💾 Backup

### Backup Automático do MongoDB

```bash
# Criar script de backup
cat > /opt/backup-mongo.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/missionkids-backups/mongo"
DATE=$(date +%Y%m%d-%H%M%S)
mkdir -p $BACKUP_DIR

# Backup com Docker
docker exec missionkids-mongo mongodump --out /backup/$DATE

# Ou sem Docker
mongodump --out $BACKUP_DIR/$DATE

# Limpar backups antigos (manter últimos 7 dias)
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
EOF

chmod +x /opt/backup-mongo.sh

# Adicionar ao cron (diariamente às 2h)
echo "0 2 * * * /opt/backup-mongo.sh" | sudo crontab -
```

## 🔄 Atualizações

### Com Docker

```bash
cd /opt/missionkids

# Pull latest changes
git pull

# Rebuild e restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Sem Docker

```bash
cd /opt/missionkids

# Pull latest changes
git pull

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd ../frontend
yarn install
yarn build

# Restart services
sudo supervisorctl restart missionkids:*
```

## 🚨 Troubleshooting

### Container não inicia

```bash
# Ver logs
docker-compose logs backend

# Verificar configuração
docker-compose config

# Reconstruir
docker-compose build --no-cache
docker-compose up -d
```

### Frontend não carrega

```bash
# Verificar build
ls -la /app/frontend/build

# Verificar nginx
sudo nginx -t
sudo systemctl status nginx

# Rebuild frontend
cd /app/frontend
rm -rf build
yarn build
```

### Banco de dados não conecta

```bash
# Verificar MongoDB
docker exec -it missionkids-mongo mongosh

# Verificar credenciais no .env
cat .env.production | grep MONGO
```

## 📈 Performance

### Otimizações

1. **CDN**: Usar Cloudflare para cache de assets estáticos
2. **Compressão**: Gzip já habilitado no nginx
3. **Cache**: Headers de cache configurados
4. **Workers**: Backend usa 4 workers (ajustar conforme CPU)

## 🔐 Segurança

### Checklist

- [ ] JWT_SECRET forte e único
- [ ] CORS configurado corretamente
- [ ] Firewall habilitado
- [ ] SSL/HTTPS configurado
- [ ] Senhas do MongoDB alteradas
- [ ] Rate limiting configurado
- [ ] Backups automáticos funcionando
- [ ] Logs sendo monitorados

## 📞 Suporte

Para problemas:
1. Verificar logs
2. Consultar troubleshooting
3. Abrir issue no repositório

---

**✅ Deployment Completo!**
