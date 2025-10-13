# 🔥 MissionKids Firebase Setup Guide

## Configuração Completa do Firebase

### 1. Criar Projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Nome do projeto: `missionkids-app`
4. Ative Google Analytics (opcional)

### 2. Configurar Autenticação

1. No console Firebase, vá em **Authentication**
2. Clique em "Começar"
3. Na aba "Sign-in method", ative:
   - **Email/Password** (para pais)
   - **Anonymous** (desabilitado - usaremos Firestore para crianças)

### 3. Configurar Firestore Database

1. Vá em **Firestore Database**
2. Clique em "Criar banco de dados"
3. Escolha "Modo de produção" 
4. Selecione localização (us-central1)

**Regras de segurança iniciais:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Pais podem ler/escrever apenas seus próprios dados
    match /parents/{parentId} {
      allow read, write: if request.auth != null && request.auth.uid == parentId;
    }
    
    // Crianças associadas ao pai logado
    match /children/{childId} {
      allow read, write: if request.auth != null && 
        resource.data.parentId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.parentId == request.auth.uid;
    }
  }
}
```

### 4. Configurar Storage (para avatares)

1. Vá em **Storage**
2. Clique em "Começar"
3. Aceite as regras padrão

**Regras de Storage:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{childId}/{filename} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Obter Configurações

1. No console Firebase, vá em **Configurações do projeto** (ícone de engrenagem)
2. Na seção "Seus aplicativos", clique em **Adicionar app** > **Web**
3. Nome do app: "MissionKids Web"
4. Copie as configurações geradas

### 6. Configurar Variáveis de Ambiente

Substitua as variáveis no arquivo `/app/frontend/.env`:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY="AIzaSy..."
REACT_APP_FIREBASE_AUTH_DOMAIN="missionkids-app.firebaseapp.com"
REACT_APP_FIREBASE_PROJECT_ID="missionkids-app"
REACT_APP_FIREBASE_STORAGE_BUCKET="missionkids-app.appspot.com"
REACT_APP_FIREBASE_MESSAGING_SENDER_ID="123456789"
REACT_APP_FIREBASE_APP_ID="1:123456789:web:abc123def456"
```

### 7. Estrutura de Dados Firestore

**Coleção `parents`:**
```javascript
{
  parentId: "firebase_auth_uid",
  name: "Maria Silva",
  email: "maria@example.com",
  children: ["child001", "child002"],
  createdAt: timestamp
}
```

**Coleção `children`:**
```javascript
{
  parentId: "firebase_auth_uid",
  name: "João",
  age: 13,
  username: "joao13",
  password: "1234", // PIN
  avatar: "default.png",
  xp: 150,
  level: 2,
  tasks: [],
  wallet: {
    balance: 25.50,
    goals: [
      {
        name: "Bicicleta",
        target: 200,
        progress: 50
      }
    ]
  },
  createdAt: timestamp
}
```

### 8. Testar Integração

1. Reinicie o frontend: `sudo supervisorctl restart frontend`
2. Acesse a aplicação
3. Escolha "Firebase Edition"
4. Teste o registro de pais
5. Teste a criação de subcontas de crianças
6. Teste login de crianças com username/PIN

## ✅ Funcionalidades Firebase Implementadas

### 🔐 Autenticação Dual
- **Pais**: Firebase Auth (email/senha)
- **Crianças**: Firestore custom (username/PIN)
- Sessions independentes e seguras
- Logout automático

### 👨‍👩‍👧 Sistema de Subcontas
- Pais criam contas para filhos
- Validação de username único
- Vinculação automática parentId
- Gerenciamento centralizado

### 📊 Dashboard em Tempo Real
- Firestore listeners automáticos
- Atualizações instantâneas
- Interface responsiva
- Dados sincronizados

### 🎮 Gamificação Completa
- Sistema XP/Níveis
- Avatares desbloqueáveis
- Carteira virtual
- Metas de poupança

## 🚀 Próximos Passos

1. **Cloud Functions** (opcional):
   ```javascript
   // Função para notificar pais
   exports.onChildTaskComplete = functions.firestore
     .document('children/{childId}')
     .onUpdate((change, context) => {
       // Enviar notificação para o pai
     });
   ```

2. **Firebase Cloud Messaging**:
   - Notificações push para pais
   - Alertas de tarefas concluídas

3. **Firebase Storage**:
   - Upload de avatares personalizados
   - Fotos de prova das tarefas

## 🛡️ Segurança

- Regras Firestore restritivas
- Validação no frontend e backend
- Isolamento de dados por família
- Sessões seguras para crianças

## 🎯 Resultado Final

Um sistema completo de gamificação familiar com:
- ✅ Autenticação Firebase robusta
- ✅ Subcontas seguras para crianças  
- ✅ Dados em tempo real
- ✅ Interface moderna e responsiva
- ✅ Sistema educativo e divertido