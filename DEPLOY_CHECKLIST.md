# ✅ Deployment Checklist Rápido

## Antes do Deploy

- [ ] Servidor com Ubuntu/Debian atualizado
- [ ] Docker e Docker Compose instalados
- [ ] Domínio configurado (opcional)
- [ ] 2GB+ RAM disponível
- [ ] 20GB+ espaço em disco

## Configuração

- [ ] Clone do repositório no servidor
- [ ] Arquivo `.env.production` criado e configurado
- [ ] JWT_SECRET forte gerado (`openssl rand -hex 32`)
- [ ] CORS_ORIGINS configurado para seu domínio
- [ ] MongoDB configurado (Atlas ou local)

## Deploy

```bash
# Opção 1: Deploy Automático (Recomendado)
sudo ./deploy.sh

# Opção 2: Deploy Manual com Docker
docker-compose build
docker-compose up -d

# Opção 3: Quick Start (Desenvolvimento)
./quick-start.sh
```

## Verificação

- [ ] `curl http://localhost/health` retorna status healthy
- [ ] Frontend acessível em http://localhost
- [ ] Backend API responde em http://localhost:8001
- [ ] MongoDB conectado
- [ ] Logs sem erros: `docker-compose logs`

## SSL/HTTPS (Produção)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Configurar SSL
sudo certbot --nginx -d seu-dominio.com
```

## Firewall

```bash
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw enable
```

## Backup

```bash
# Configurar backup diário
sudo crontab -e

# Adicionar linha:
# 0 2 * * * /opt/backup-mongo.sh
```

## Monitoramento

```bash
# Ver logs em tempo real
docker-compose logs -f

# Verificar status
docker-compose ps

# Verificar saúde
curl http://localhost/health
```

## Problemas Comuns

### Container não inicia
```bash
docker-compose logs backend
docker-compose restart
```

### Frontend não carrega
```bash
cd /app/frontend
yarn build
docker-compose restart
```

### Banco não conecta
```bash
# Verificar MongoDB
docker exec -it missionkids-mongo mongosh
```

## Comandos Úteis

```bash
# Parar tudo
docker-compose down

# Reiniciar
docker-compose restart

# Rebuild completo
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Ver logs de serviço específico
docker-compose logs -f backend
docker-compose logs -f nginx

# Acessar container
docker exec -it missionkids-app bash
docker exec -it missionkids-mongo mongosh

# Backup manual
docker exec missionkids-mongo mongodump --out /backup/manual-backup
```

## Próximos Passos

- [ ] Configurar monitoring (Prometheus, Grafana)
- [ ] Configurar alertas (email, Slack)
- [ ] Configurar backups automáticos
- [ ] Testar restore de backup
- [ ] Configurar CDN (Cloudflare)
- [ ] Configurar rate limiting
- [ ] Documentar runbooks de operação

---

**Status: Pronto para Deploy! 🚀**

Para deploy imediato:
1. Configure .env.production
2. Execute: `sudo ./deploy.sh`
3. Configure SSL com Certbot
4. Teste tudo!
