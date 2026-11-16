# Ficha Técnica & Textos das Lojas — Almare (Google Play Store & Apple App Store)

Este documento reúne todos os textos obrigatórios, palavras-chave, respostas aos questionários de Privacidade de Dados (Data Safety / App Privacy) e instruções de revisão (App Review Information) para submissão na **Google Play Console** e no **App Store Connect** sem risco de reprovação.

---

## 1. Verificação Técnica de Assets Visuais (`app.json`)

| Ficheiro | Função | Dimensões Exatas | Formato / Canal Alpha | Estado de Conformidade |
| :--- | :--- | :--- | :--- | :--- |
| `./assets/icon.png` | Ícone Principal & iOS App Store | `1024 × 1024 px` | PNG 24-bit RGB (`ColorType=2`, **sem transparência**, fundo sólido `#0D0D11`) | **Aprovado** (Cumpre exigência Apple sem canal alpha) |
| `./assets/adaptive-icon.png` | Android Adaptive Icon (Foreground) | `1024 × 1024 px` | PNG 32-bit RGBA (`ColorType=6`, fundo transparente, centrado na *Safe Zone* de 66%) | **Aprovado** (Sem corte em máscaras circulares/squircle) |
| `./assets/logo.png` | Ecrã de Arranque (`expo-splash-screen`) | `1024 × 1024 px` | PNG 32-bit RGBA (`ColorType=6`, alta resolução com fundo `#0D0D11`) | **Aprovado** |

---

## 2. Textos da Ficha da Loja (Português — `pt-PT`)

### Nome da Aplicação (30 caracteres máx.)
```text
Almare: Barbearia & Estética
```

### Subtítulo (App Store — 30 caracteres máx.)
```text
Agendamento Barber & Beauty
```

### Texto Promocional (App Store — 170 caracteres máx.)
```text
Reserve o seu corte, ritual de barba, Head-Spa, manicure ou uma experiência a dois com jantar romântico incluído. Marcação imediata sem registo complicado!
```

### Descrição Curta (Google Play Store — 80 caracteres máx.)
```text
Marcações rápidas na Almare: Barbearia, Head-Spa, Estética e Experiências a 2.
```

### Descrição Completa (Google Play Store & App Store — até 4000 caracteres)
```text
Bem-vindo à Almare — Barbearia & Estética, o seu espaço de excelência onde o cuidado masculino (Almare Barber) e o bem-estar feminino (Almare Beauty) se encontram num ambiente sofisticado e acolhedor.

Com a aplicação oficial Almare, pode agendar o seu próximo serviço em segundos, consultar horários disponíveis em tempo real e personalizar a sua visita com toda a comodidade.

✨ DOIS UNIVERSOS NUM SÓ ESPAÇO:

• ALMARE BARBER (Para Eles):
  - Cortes de cabelo clássicos, modernos e Fade / Degradê de alta precisão;
  - Ritual de Barba Almare com toalha quente, aromaterapia e óleo de argan;
  - Combos Signature (Corte + Barba) e camuflagem discreta de cabelos brancos;
  - Serviços extra: Lavagem com massagem craniana, máscara negra facial, sobrancelhas e tónico fortalecedor.

• ALMARE BEAUTY (Para Elas):
  - Head-Spa Ritual Holístico e Detox Capilar com cascata de água morna e aromaterapia;
  - Tratamentos faciais e capilares: Hydra-Facial Glow, Cronograma Capilar / Botox e Brow Lamination;
  - Manicure Verniz Gel, Extensão em Gel/Acrigel, Nail Art e Pedicure Spa;
  - Pacotes de luxo Signature (Golden Luxury e Combo Harmony).

🍽️ ALMARE GRAND ROMANCE EXPERIENCE (Experiências a Dois):
Surpreenda quem mais gosta com uma experiência sensorial a dois (atendimento simultâneo Barber & Beauty) seguida de um jantar romântico num dos nossos restaurantes parceiros selecionados, com menu completo escolhido diretamente na aplicação.

📲 FUNCIONALIDADES PRINCIPAIS:
• Marcação Rápida em 2 Passos: Escolha os serviços/extras e selecione o seu profissional preferido (ou a opção "Sem Preferência" para a primeira vaga disponível).
• Sem Registo Obrigatório de Conta: Basta indicar o seu nome e número de telemóvel para confirmar a reserva instantaneamente.
• Pagamento Presencial no Salão: Não são pedidos cartões bancários nem pagamentos online na aplicação.
• Lembretes Inteligentes: Ative o lembrete automático 2 horas antes da marcação e adicione o agendamento diretamente ao Calendário do telemóvel ou Google Calendar.
• Contacto Direto: Esclareça dúvidas ou reagende facilmente via WhatsApp com um só toque.

Descarregue a aplicação Almare e reserve já o seu momento de cuidado e relaxamento!
```

### Palavras-Chave / Keywords (App Store — 100 caracteres máx., separadas por vírgula sem espaços)
```text
barbearia,estetica,cabeleireiro,barber,headspa,manicure,agenda,marcacoes,salao,beleza,lisboa,barba
```

### Categoria Principal e Secundária
- **Categoria Principal:** Estilo de Vida (*Lifestyle*)
- **Categoria Secundária:** Beleza (*Beauty*) / Saúde e Fitness (*Health & Fitness*)
- **Classificação Etária:** +4 anos (App Store) / PEGI 3 (Google Play) — Não contém conteúdo restrito.

### URLs Obrigatórios na Ficha da Loja
- **URL da Política de Privacidade Pública:** `https://luismartinho21.github.io/almare/privacy.html`
- **URL de Suporte / Website:** `https://luismartinho21.github.io/almare/`

---

## 3. Questionário de Privacidade de Dados (Google Play "Data Safety" & Apple "App Privacy")

Como a aplicação utiliza o Firebase Firestore para guardar as marcações com **Nome** e **Número de Telemóvel**, não exige criação de conta com palavra-passe e não contém SDKs de publicidade ou rastreamento:

### A) Google Play Console — Secção "Segurança dos Dados" (Data Safety)
1. **A sua app recolhe ou partilha algum dos tipos de dados de utilizador obrigatórios?**
   - Resposta: **Sim**
2. **Todos os dados de utilizador recolhidos pela sua app são encriptados em trânsito?**
   - Resposta: **Sim** (Comunicação HTTPS/TLS via Google Firebase).
3. **Oferece uma forma de os utilizadores solicitarem a eliminação dos seus dados?**
   - Resposta: **Sim** (A app não cria contas com palavra-passe; na secção de eliminação de dados / URL de política de privacidade `https://luismartinho21.github.io/almare/privacy.html` e no botão dentro da app, o utilizador pode solicitar a eliminação imediata dos dados de agendamento via WhatsApp/contacto direto).
4. **Tipos de dados selecionados:**
   - **Informações pessoais → Nome:** Recolhido (*Collected*), **Não partilhado** (*Not shared*), Obrigatório para a funcionalidade da app (*App functionality*).
   - **Informações pessoais → Número de telefone:** Recolhido (*Collected*), **Não partilhado** (*Not shared*), Obrigatório para a funcionalidade da app (*App functionality*).
   - Todos os restantes tipos de dados (Localização, Contactos, Dados financeiros, Fotos, Identificadores de dispositivo): **Não recolhidos**.

### B) Apple App Store Connect — Secção "Privacidade da App" (App Privacy)
1. **Recolhe dados desta app?** → **Sim**
2. **Dados recolhidos:**
   - **Informação de Contacto (Contact Info) → Nome (Name)**
     - Utilizado para: **Funcionalidade da App (App Functionality)**
     - Associado à identidade do utilizador? **Sim** (identifica a reserva do cliente)
     - Utilizado para rastreamento (Tracking)? **Não**
   - **Informação de Contacto (Contact Info) → Número de Telefone (Phone Number)**
     - Utilizado para: **Funcionalidade da App (App Functionality)**
     - Associado à identidade do utilizador? **Sim**
     - Utilizado para rastreamento (Tracking)? **Não**

---

## 4. Instruções e Credenciais de Demonstração para Revisão (App Review Information)

Na secção **App Review Information** (App Store Connect) e **Acesso à App / App Access** (Google Play Console), tens **duas opções** consoante o que preferires que os revisores testem:

### Opção A (Recomendada para Aprovação Mais Rápida): Revisão Focada na Vista de Cliente
Os clientes não precisam de login nem PIN para usar 100% das funcionalidades públicas de marcação.
- **Sign-in required?** Podes desmarcar (*No sign-in required*) ou colocar nas notas de revisão:
```text
Notas para o Revisor (Review Notes):
A aplicação Almare permite a qualquer cliente efetuar marcações completas de barbearia e estética sem necessidade de criar conta ou iniciar sessão.
1. No ecrã inicial, toque em "ALMARE ESTÉTICA" (esquerda) ou "ALMARE BARBER" (direita).
2. Escolha 1 ou mais serviços e toque em "Continuar".
3. Escolha um profissional (ou "Sem Preferência"), selecione um horário disponível e confirme inserindo um nome e telefone de teste (ex: Nome: "Teste Revisor", Telemóvel: "910000000").
4. Nenhum pagamento é cobrado na aplicação (o pagamento é presencial no salão).

Caso a equipa de revisão pretenda inspecionar também a área interna restrita a funcionários/gestores do salão, mantenha premido (long press durante 1.5 segundos) sobre qualquer um dos painéis do ecrã inicial ou sobre o logótipo "ALMARE" no topo para abrir o teclado de PIN profissional:
- PIN Vista de Staff (Gonçalo Silva - Barber): 1001
- PIN Vista de Staff (Sofia Rodrigues - Beauty): 2001
- PIN Gestor Barber: 1111
- PIN Gestor Beauty: 2222
- PIN Administrador Geral: 9999
```

### Opção B: Tabela Rápida de Todos os PINs Configurados na App
| Perfil / Vista | Código PIN (4 dígitos) | Como aceder na App |
| :--- | :---: | :--- |
| **Cliente (Padrão)** | *Sem PIN (Acesso livre)* | Abre automaticamente ao iniciar a app |
| **Staff Individual (Barber — Gonçalo Silva)** | `1001` | Manter premido 1.2s no ecrã inicial ou no título "ALMARE" no topo |
| **Staff Individual (Beauty — Sofia Rodrigues)** | `2001` | Manter premido 1.2s no ecrã inicial ou no título "ALMARE" no topo |
| **Equipa Geral (Vista de Staff)** | `3333` | Manter premido 1.2s no ecrã inicial ou no título "ALMARE" no topo |
| **Gestor Almare Barber** | `1111` | Manter premido 1.2s no ecrã inicial ou no título "ALMARE" no topo |
| **Gestor Almare Beauty** | `2222` | Manter premido 1.2s no ecrã inicial ou no título "ALMARE" no topo |
| **Administrador Geral** | `9999` | Manter premido 1.2s no ecrã inicial ou no título "ALMARE" no topo |
