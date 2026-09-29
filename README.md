# GymRank

Aplicativo mobile de academia com **progressão competitiva**: cada grupo muscular tem sua própria pontuação e seu próprio rank, que sobem quando você treina com constância e caem quando você abandona aquele grupo.

> Link do repositório: <adicionar aqui>
>
> Vídeo de demonstração: <adicionar aqui>

---

## Descrição

O GymRank transforma a rotina de treinos em um sistema ranqueado, inspirado em jogos competitivos, mas com identidade visual própria.

- O usuário registra os treinos e marca quais grupos musculares trabalhou.
- A **semana** é a unidade da competição: treinar um grupo ao menos uma vez na semana rende pontos; deixar de treinar custa pontos.
- Ficar **duas semanas seguidas** sem treinar um grupo causa **rebaixamento** de rank naquele grupo.
- O Dashboard mostra o progresso da semana e o Ranking mostra a evolução de cada grupo.

Todos os dados ficam no próprio aparelho (AsyncStorage), sem backend.

## Tecnologias

| Tecnologia | Uso |
|---|---|
| React Native 0.86 | Interface nativa |
| Expo SDK 57 | Ambiente de execução e ferramentas (compatível com **Expo Go** para SDK 57) |
| TypeScript 6 (strict) | Tipagem estática |
| React Navigation 7 | Navegação (`native-stack` + `bottom-tabs`) |
| AsyncStorage | Persistência local |
| react-native-safe-area-context | Áreas seguras (notch, barra de status) |
| @expo/vector-icons | Ícones (Ionicons e MaterialCommunityIcons) |
| Jest + jest-expo | Testes unitários das regras de negócio |

### Dependências principais

| Pacote | Motivo |
|---|---|
| `@react-navigation/native`, `native-stack`, `bottom-tabs` | Requisito da atividade: navegação com React Navigation |
| `react-native-screens`, `react-native-safe-area-context` | Dependências nativas do React Navigation (já incluídas no Expo Go) |
| `@react-native-async-storage/async-storage` | Persistência local (incluída no Expo Go) |
| `@expo/vector-icons` + `expo-font` | Ícones (`expo-font` é dependência par exigida pelo `expo-doctor`) |
| `react-dom`, `react-native-web` | Opcionais: permitem pré-visualizar no navegador com `npm run web` |
| `jest`, `jest-expo`, `eslint`, `eslint-config-expo` | Somente desenvolvimento (testes e lint) |

Nenhuma biblioteca exige _development build_ ou _prebuild_.

## Como executar

Pré-requisitos: Node.js 20+ e o app **Expo Go** compatível com o **SDK 57** instalado no celular (Android ou iOS).

```bash
npm install
npx expo start
```

1. Com o servidor iniciado, aparecerá um **QR Code** no terminal.
2. **Android:** abra o Expo Go e toque em _Scan QR code_.
   **iOS:** abra a câmera do iPhone e aponte para o QR Code.
3. Celular e computador precisam estar na **mesma rede Wi-Fi**. Se a rede bloquear a conexão, use `npx expo start --tunnel`.

Outros comandos:

```bash
npm test            # testes unitários (datas, ranking, validação)
npm run typecheck   # verificação de tipos
npx expo lint       # lint
npm run web         # pré-visualização no navegador (opcional)
```

### Dados de demonstração

Em modo de desenvolvimento (que é o modo do Expo Go), a tela **Perfil** exibe a seção _Ferramentas de desenvolvimento_ com:

- **Carregar demonstração** — substitui os dados por 16 semanas de treinos fictícios (ranks variados e um rebaixamento em Pernas). Útil para apresentar o app.
- **Apagar todos os dados** — volta ao estado de primeira execução.

Os dados de demonstração ficam isolados em `src/dev/demoData.ts` e **nunca** são carregados automaticamente.

## Funcionalidades

- **Início (Dashboard):** saudação com nome e avatar, resumo da semana (grupos concluídos/pendentes), sequência de semanas ativas e um card por grupo muscular com rank, pontos e status da semana. Tocar em um grupo abre o Novo Treino com ele já selecionado.
- **Novo Treino:** título, data (com atalhos _Hoje_/_Ontem_), seleção múltipla de grupos, duração e observações opcionais, com validação e feedback.
- **Ranking:** grupos ordenados por rank e pontos, barra de progresso até o próximo rank, status da semana, semanas sem treino, aviso de risco de rebaixamento, histórico visual das últimas semanas e legenda com as regras e faixas de rank.
- **Histórico:** treinos do mais recente para o mais antigo, agrupados por semana (`SectionList`), com exclusão direta.
- **Detalhes do treino:** todas as informações, edição e exclusão.
- **Editar treino:** mesmo formulário do cadastro; ao salvar, o ranking é recalculado.
- **Perfil:** avatar, nome editável (persistido), data de início, total de treinos e semanas acompanhadas.
- **Persistência** local, com tratamento de primeira execução, dados inexistentes, JSON inválido e erros de leitura/escrita.
- **Estados vazios**, **feedback** via `Alert` e **acessibilidade básica** (`accessibilityLabel`, `accessibilityRole`, áreas de toque ≥ 44 pt).

## Sistema de ranking

O ranking **não é salvo**: ele é sempre **recalculado a partir do histórico de treinos** por uma função pura central (`src/features/ranking/services/rankingService.ts`).

```text
histórico de treinos → rankingService → ranking de cada grupo → interface
```

Todos os valores ficam em `src/constants/rankingConfig.ts`.

### Ranks

| Rank | Pontos |
|---|---|
| Iniciante | 0–99 |
| Bronze | 100–199 |
| Prata | 200–299 |
| Ouro | 300–399 |
| Platina | 400–499 |
| Diamante | 500–599 |
| Mestre | 600–699 |
| Elite | 700+ |

### Pontuação semanal

As semanas seguem o padrão ISO 8601 (segunda a domingo), identificadas por chaves como `2026-W40`. Para cada grupo muscular e cada **semana completa** desde o início do acompanhamento:

| Situação | Efeito |
|---|---|
| Treinou o grupo ao menos 1 vez | **+25 pts** e zera as semanas sem treino |
| Não treinou o grupo | **−15 pts** (nunca abaixo de 0) e +1 semana sem treino |

### Rebaixamento

A cada **2 semanas completas consecutivas** sem treinar um grupo (2ª, 4ª, 6ª...), ele cai **um rank**, mesmo que os pontos ainda estivessem dentro do rank anterior.

- A referência é o rank que o grupo tinha **no início** desse período de 2 semanas. Assim, se a penalidade da 1ª semana já cruzou a fronteira de rank (ex.: Ouro 300 → 285), a 2ª semana não derruba dois ranks de uma vez.
- Após o rebaixamento, os pontos passam a ser no máximo **mínimo do novo rank + 50** (ex.: Ouro 348 → Prata 250), mantendo o rank sempre coerente com a pontuação.
- O rank Iniciante não tem rank inferior.

### Proteção contra pontuação duplicada ("farm")

O critério semanal é binário: _treinou o grupo ao menos uma vez na semana?_ Cinco treinos de peito na mesma semana valem o mesmo que um. O histórico continua mostrando todos os treinos.

### Semana atual e reabertura do app

- A semana atual **nunca é penalizada** antes de terminar.
- Se o grupo já foi treinado na semana atual, os +25 pts aparecem imediatamente (a recompensa é garantida, pois a semana terminará como "treinada").
- Como tudo é recalculado a partir da data de início, do histórico e das semanas completas transcorridas, abrir o app depois de vários dias ou semanas produz exatamente o mesmo resultado que abri-lo todos os dias. A data é reavaliada quando o app volta ao primeiro plano.
- O acompanhamento começa na semana de criação do perfil ou na semana do treino mais antigo registrado, o que vier primeiro (permite registrar treinos retroativos).
- Não é permitido registrar treinos com data futura.

As regras estão cobertas por testes em `src/features/ranking/services/__tests__/rankingService.test.ts`.

## Estrutura do projeto

```text
gym-ranked/
├── App.tsx                     # Providers (SafeArea, dados) + navegador
├── assets/images/avatar.png    # Avatar padrão local
└── src/
    ├── components/             # Componentes reutilizáveis (RankBadge, WorkoutCard, StatCard...)
    ├── constants/              # Tema, grupos musculares, configuração do ranking, imagens
    ├── contexts/               # AppDataContext: estado global, CRUD e ranking derivado
    ├── dev/                    # Dados de demonstração (apenas modo desenvolvimento)
    ├── features/
    │   ├── dashboard/          # Tela inicial
    │   ├── history/            # Histórico (SectionList)
    │   ├── profile/            # Perfil + ferramentas de desenvolvimento
    │   ├── ranking/            # rankingService, resumo semanal, tela e componentes do ranking
    │   └── workouts/           # Formulário, validação, cadastro, detalhes e edição
    ├── hooks/                  # useWorkouts, useRanking, useProfile, useToday
    ├── navigation/             # Stack + Bottom Tabs tipados
    ├── services/storage/       # Camada isolada de AsyncStorage (repositórios)
    ├── types/                  # Tipos comuns (DateKey, WeekKey)
    └── utils/                  # Datas/semanas, IDs e diálogos
```

**Fluxo de dados:** `Tela → hook (useWorkouts/useRanking/useProfile) → AppDataContext → services/storage → AsyncStorage`. As telas nunca acessam o AsyncStorage diretamente.

**Preparado para expansão:** `workoutStorage` e `profileStorage` implementam as interfaces `WorkoutRepository` e `ProfileRepository`. Para migrar para uma API REST, Firebase ou Supabase basta criar outra implementação dessas interfaces — as telas não mudam. Serviços futuros podem ser adicionados ao lado de `storage/` (`src/services/api/`, `camera/`, `location/`, `notifications/`).

## Requisitos da atividade atendidos

| Requisito | Onde foi aplicado |
|---|---|
| React Native + Expo | Projeto base criado com `create-expo-app` (template TypeScript), Expo SDK 57 |
| Funciona no Expo Go | Apenas bibliotecas incluídas no Expo Go; `npx expo-doctor` sem problemas |
| Estrutura organizada | Arquitetura por features em `src/` (ver seção acima) |
| Componentes funcionais | Todos os componentes e telas, ex.: `src/components/RankBadge/index.tsx`, `src/features/dashboard/screens/DashboardScreen.tsx` |
| Props | `RankBadgeProps` em `src/components/RankBadge/index.tsx`, `WorkoutCardProps` em `src/components/WorkoutCard/index.tsx`, `MuscleGroupCardProps`, `StatCardProps`, `EmptyStateProps`, `AppHeaderProps`, `WorkoutFormProps` |
| State (`useState`) | Formulário de treino em `src/features/workouts/hooks/useWorkoutForm.ts:26`, edição do nome em `src/features/profile/screens/ProfileScreen.tsx:29`, envio em `NewWorkoutScreen.tsx:18`, estado global em `src/contexts/AppDataContext.tsx:107` |
| Context API | `createContext`/`useContext` em `src/contexts/AppDataContext.tsx`, consumido pelos hooks `src/hooks/useWorkouts.ts`, `useRanking.ts`, `useProfile.ts` |
| `View` / `Text` | Em todas as telas e componentes |
| `Image` | Avatar em `src/features/dashboard/screens/DashboardScreen.tsx:29`, `src/features/profile/screens/ProfileScreen.tsx:64` e `src/components/LoadingScreen/index.tsx:16` |
| `Pressable` | `src/components/AppButton/index.tsx:38`, `src/components/MuscleGroupCard/index.tsx:22`, `src/components/WorkoutCard/index.tsx:23`, `src/features/workouts/components/MuscleGroupSelector.tsx:21` |
| `ScrollView` | Dashboard em `src/features/dashboard/screens/DashboardScreen.tsx:24`; também Novo Treino, Detalhes, Edição e Perfil |
| `StyleSheet` / Flexbox | `StyleSheet.create` em todos os componentes; layouts com `flexDirection`, `flexWrap`, `flex`, `gap`, ex.: grade de grupos em `DashboardScreen.tsx` e seletor em `MuscleGroupSelector.tsx` |
| `FlatList` / `SectionList` | `SectionList` agrupada por semana em `src/features/history/screens/HistoryScreen.tsx:45`; `FlatList` em `src/features/ranking/screens/RankingScreen.tsx:16` |
| React Navigation | Native Stack em `src/navigation/AppNavigator.tsx:10`, Bottom Tabs em `src/navigation/BottomTabs.tsx:15`, rotas tipadas em `src/navigation/navigationTypes.ts` |
| Interface mobile | Tema escuro central em `src/constants/theme.ts`, safe area via `react-native-safe-area-context` (`src/components/ScreenContainer`), áreas de toque ≥ 44 pt, `KeyboardAvoidingView` nos formulários |
| Persistência | AsyncStorage isolado em `src/services/storage/` com chaves centralizadas em `storageKeys.ts` |

## Decisões técnicas

- **Ranking derivado, nunca salvo:** evita inconsistências entre telas e facilita migrar para backend (o servidor poderia executar a mesma função).
- **Datas como `YYYY-MM-DD` e aritmética em UTC:** evita erros de fuso e horário de verão. Utilitários próprios e testados em `src/utils/date.ts`, sem bibliotecas pesadas.
- **Rebaixamento com rank de referência do início do período:** evita cair dois ranks quando a penalidade semanal já cruza a fronteira (ver "Sistema de ranking").
- **Data digitada em `DD/MM/AAAA` com atalhos Hoje/Ontem** em vez de um seletor de data nativo, para não adicionar dependências.
- **Diálogos centralizados em `src/utils/dialogs.ts`:** usam `Alert` no celular e `window.alert/confirm` no navegador, onde `Alert` não mostra botões.
- **Registros corrompidos** no armazenamento são descartados individualmente, sem perder o restante dos dados.

## Próximas funcionalidades

- Câmera e fotos de progresso
- Geolocalização (check-in na academia)
- Autenticação e backend/API com sincronização em nuvem
- Ranking online entre usuários
- Notificações (lembrete de grupos pendentes antes do fim da semana)
- Desafios e conquistas
- Integração com sensores e dispositivos de atividade física

## GitHub

Link do repositório: <adicionar aqui>

## Vídeo

Vídeo de demonstração: <adicionar aqui>
