# 🎯 MissionKids - Gestor Familiar Gamificado

**MissionKids** é uma aplicação web progressiva (PWA) gamificada para gestão de tarefas e finanças familiares, focada em crianças de 11-13 anos.

## 🌟 Características Principais

### 👨‍👩‍👧 Para os Pais
- ✅ Painel Administrativo Completo
- ✅ Cadastro de Filhos com gerenciamento de contas
- ✅ Criação de Tarefas com valores em R$ e XP
- ✅ Sistema de Validação Parental para aprovar/rejeitar tarefas
- ✅ Metas de Poupança (até 3 por criança)
- ✅ Filtros de Tarefas (Diárias/Semanais/Mensais)
- ✅ Edição e Exclusão de tarefas
- ✅ Notificações de tarefas aguardando validação

### 👦 Para as Crianças
- ✅ Dashboard Gamificado com sistema de níveis e XP
- ✅ Visualização de Tarefas com filtros e paginação
- ✅ Sistema de Recompensas (R$ e XP por tarefa concluída)
- ✅ Loja de XP com avatares e acessórios (5 níveis de raridade)
- ✅ Sistema de Inventário e equipamento de itens
- ✅ Metas de Poupança com visualização de progresso
- ✅ Histórico de Transações

## 🛠️ Stack Tecnológica

- **Backend:** FastAPI (Python) + MongoDB
- **Frontend:** React + TailwindCSS + Shadcn/ui
- **Auth:** JWT + Bcrypt
- **Deploy:** Kubernetes + Supervisor

## 📊 Sistema de Gamificação

### Loja de XP - 5 Níveis de Raridade

| Classificação | Custo XP | Descrição |
|--------------|----------|-----------|
| ⚪ Simples | 50-150 XP | Itens básicos |
| 🟢 Comum | 200-400 XP | Itens temáticos |
| 🔵 Importante | 500-800 XP | Itens com efeitos |
| 🟣 Raro | 900-1500 XP | Avatares únicos |
| 💎 Diamante | 2000+ XP | Itens premium |

## 🚀 Como Usar

### Primeiro Acesso

1. **Cadastre-se como Pai**
   - Email e senha
   
2. **Registre seus Filhos**
   - Nome, email, PIN de 4 dígitos

3. **Crie Tarefas**
   - Defina valor em R$ e XP
   - Configure frequência (Diária/Semanal/Mensal)

4. **Crianças Completam Tarefas**
   - Status muda para "Aguardando Validação"

5. **Pais Aprovam/Rejeitam**
   - Aprovação credita R$ e XP
   
6. **Crianças Usam XP na Loja**
   - Comprar avatares e acessórios

## 🔐 Segurança

- Senhas criptografadas (Bcrypt)
- Autenticação JWT
- Recuperação de senha com token
- Validação de autorização
- CORS configurável

## 📱 Funcionalidades Principais

### Sistema de Tarefas
- ✅ CRUD completo
- ✅ Validação parental obrigatória
- ✅ Filtros por frequência
- ✅ Paginação (10 itens/página)
- ✅ Status: Pendente → Aguardando Validação → Aprovada

### Sistema Financeiro
- ✅ Saldo disponível
- ✅ Mesada total acumulada
- ✅ Metas de poupança (máx 3/criança)
- ✅ Histórico de transações

### Recuperação de Senha
- ✅ Token único e seguro
- ✅ Expiração em 1 hora
- ✅ Sistema mock (exibe token na tela)
- ✅ Em produção: integrar serviço de email

## 📈 Status do Projeto

**Versão:** 1.0.0 - Produção

### ✅ Funcionalidades Implementadas
- [x] Autenticação (Pais e Crianças)
- [x] Recuperação de senha/PIN
- [x] Sistema de tarefas completo
- [x] Validação parental
- [x] Sistema financeiro
- [x] Metas de poupança
- [x] Loja de XP (15 itens)
- [x] Sistema de inventário
- [x] Notificações mock
- [x] Filtros e paginação

### 🔄 Melhorias Futuras
- [ ] Email real (SendGrid/AWS SES)
- [ ] Notificações push (FCM)
- [ ] PWA offline
- [ ] Relatórios PDF
- [ ] Rankings familiares
- [ ] Modo escuro

## 🛠️ Tecnologias

```json
{
  "backend": {
    "framework": "FastAPI",
    "database": "MongoDB",
    "auth": "JWT + Bcrypt",
    "validation": "Pydantic"
  },
  "frontend": {
    "library": "React 18",
    "styling": "TailwindCSS",
    "components": "Shadcn/ui",
    "http": "Axios"
  }
}
```

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com o suporte.

---

**🎮 Transformando tarefas em diversão para toda a família!**
