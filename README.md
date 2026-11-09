# GymRank

Aplicativo mobile de academia com **progressão competitiva**: cada grupo muscular tem sua própria pontuação e seu próprio rank, que sobem quando você treina com constância e caem quando você abandona aquele grupo. Ao finalizar um treino, o app gera uma **imagem compartilhável** com a sua foto e os dados reais do treino.

---

## Descrição

O GymRank transforma a rotina de treinos em um sistema ranqueado, inspirado em jogos competitivos, mas com identidade visual própria.

- O usuário registra os treinos e marca quais grupos musculares trabalhou.
- A **semana** é a unidade da competição: treinar um grupo ao menos uma vez na semana rende pontos; deixar de treinar custa pontos.
- Ficar **duas semanas seguidas** sem treinar um grupo causa **rebaixamento** de rank naquele grupo.
- O Dashboard mostra o progresso da semana e o Ranking mostra a evolução de cada grupo.
- Ao **finalizar** um treino, o app mostra o resumo e oferece tirar uma foto, que vira uma imagem 9:16 com o logotipo do GymRank e os dados do treino, pronta para salvar e compartilhar.
- Um **catálogo de exercícios** consulta a API pública wger para escolher os exercícios do treino.

Os dados ficam no próprio aparelho, sem backend: **SQLite** para treinos e fotos, **AsyncStorage** para perfil e preferências e **arquivos do app** para as imagens.

## Tecnologias

| Tecnologia | Uso |
|---|---|
| React Native 0.88 | Interface nativa |
| Expo SDK 58 | Ambiente de execução e ferramentas (compatível com **Expo Go** para SDK 58) |
| TypeScript 6 (strict) | Tipagem estática |
| React Navigation 7 | Navegação (`native-stack` + `bottom-tabs`) |
| expo-sqlite | Banco relacional local: treinos, grupos, exercícios e fotos |
| AsyncStorage | Perfil e preferências (chave-valor) |
| Axios | Consumo da API wger (JSON) |
| expo-image-picker | Câmera e galeria |
| react-native-view-shot | Geração da imagem final a partir da composição |
| expo-file-system | Armazenamento persistente das imagens |
| expo-media-library / expo-sharing | Salvar na galeria e compartilhar |
| expo-linear-gradient | Degradê que garante a leitura do texto sobre a foto |
| Jest + jest-expo | Testes automatizados (regras, SQL, migração, API) |

### Dependências principais

| Pacote | Motivo |
|---|---|
| `@react-navigation/native`, `native-stack`, `bottom-tabs` | Requisito da atividade: navegação com React Navigation |
| `react-native-screens`, `react-native-safe-area-context` | Dependências nativas do React Navigation |
| `@react-native-async-storage/async-storage` | Preferências e perfil |
| `expo-sqlite` | Persistência relacional (segunda etapa) |
| `axios` | Cliente HTTP da API wger (segunda etapa) |
| `expo-image-picker`, `react-native-view-shot`, `expo-file-system`, `expo-media-library`, `expo-sharing`, `expo-linear-gradient` | Foto do treino: captura, composição, arquivo, galeria e compartilhamento |
| `@expo/vector-icons` + `expo-font` | Ícones |
| `react-dom`, `react-native-web` | Opcionais: pré-visualização no navegador com `npm run web` |
| `jest`, `jest-expo`, `eslint`, `eslint-config-expo` | Somente desenvolvimento |

Todas foram instaladas com `npx expo install` e estão **incluídas no Expo Go**: nenhuma exige _development build_ ou _prebuild_.

## Como executar

Pré-requisitos: Node.js 22.13+ ou 24.3+ (exigência do SDK 58; os testes de banco usam o SQLite nativo do Node) e o app **Expo Go** compatível com o **SDK 58** no celular (Android ou iOS).

```bash
npm install
npx expo start
```

1. Com o servidor iniciado, aparecerá um **QR Code** no terminal.
2. **Android:** abra o Expo Go e toque em _Scan QR code_. **iOS:** aponte a câmera do iPhone para o QR Code.
3. Celular e computador precisam estar na **mesma rede Wi-Fi**. Se a rede bloquear a conexão, use `npx expo start --tunnel`.

Outros comandos:

```bash
npm test            # testes automatizados (ranking, datas, validação, SQLite, migração, parser da API)
npm run test:api    # consulta REAL à API wger (precisa de internet)
npm run typecheck   # verificação de tipos
npx expo lint       # lint
npm run web         # pré-visualização no navegador (sem salvar fotos)
```

### Dados de demonstração

Em modo de desenvolvimento (que é o modo do Expo Go), a tela **Perfil** exibe a seção _Ferramentas de desenvolvimento_ com:

- **Carregar demonstração**: substitui os dados por 16 semanas de treinos de exemplo (ranks variados e um rebaixamento em Pernas).
- **Apagar todos os dados**: volta ao estado de primeira execução (SQLite, fotos, perfil e preferências).
- Um resumo de onde os dados estão guardados (SQLite, arquivos e AsyncStorage).

Os dados de demonstração ficam isolados em `src/dev/demoData.ts` e **nunca** são carregados automaticamente.

## Funcionalidades

- **Início (Dashboard):** saudação, resumo da semana, sequência de semanas, card por grupo com rank e pontos e atalho para o **catálogo de exercícios**.
- **Novo Treino:** título, data, grupos, **exercícios do catálogo** (opcional), duração e observações. O botão **Finalizar treino** salva o treino e abre o resumo.
- **Treino concluído:** resumo do treino, resultado de cada grupo no ranking (rank e pontos realmente conquistados) e as opções **Tirar foto do treino**, **Escolher da galeria** ou **Concluir sem foto**.
- **Foto do treino:** pré-visualização 9:16 com os dados reais, refazer a foto, trocar pela galeria, mostrar/ocultar ranks e pontos, cor de destaque, **salvar no treino**, **salvar na galeria** e **compartilhar**.
- **Catálogo de exercícios (API wger):** filtro por grupo muscular, busca por nome (português, inglês ou apelido), paginação, detalhes (músculos e descrição) e seleção para o treino.
- **Ranking:** grupos ordenados por rank e pontos, progresso até o próximo rank e histórico das últimas semanas.
- **Histórico:** treinos agrupados por semana (`SectionList`), com **miniatura** quando o treino tem foto.
- **Detalhes do treino:** informações, exercícios, **composição gerada e foto original**, compartilhar de novo, salvar na galeria, recriar a imagem, substituir e remover a foto, editar e excluir.
- **Perfil:** nome editável, **foto de perfil** (tirada na câmera ou escolhida da galeria, com recorte quadrado; também aparece no Início) e **preferências da foto** (salvas no AsyncStorage).

## Sistema de ranking

O ranking **não é salvo**: ele é sempre **recalculado a partir do histórico de treinos** por uma função pura central (`src/features/ranking/services/rankingService.ts`).

```text
histórico de treinos (SQLite) → rankingService → ranking de cada grupo → interface
```

Todos os valores ficam em `src/constants/rankingConfig.ts`. A regra é **competitiva**: quanto maior o rank, mais difícil subir (faixas mais largas) e mais caro faltar (penalidade maior).

> Como o ranking é derivado, mudar a regra recalcula na hora o rank de quem já tem treinos registrados.

### Ranks

| Rank | Pontos | Semanas para o próximo (só +25) | Penalidade por semana sem treino |
|---|---|---|---|
| Iniciante | 0–49 | 2 | −10 |
| Bronze | 50–149 | 4 | −15 |
| Prata | 150–274 | 5 | −20 |
| Ouro | 275–399 | 5 | −25 |
| Platina | 400–549 | 6 | −30 |
| Diamante | 550–799 | 10 | −35 |
| Mestre | 800–1099 | 12 | −40 |
| Elite | 1100+ | — | −50 |

Com o bônus de sequência, quem treina o grupo **toda semana** chega ao Prata na 5ª semana, ao Ouro na 9ª, à Platina na 12ª, ao Diamante na 17ª, ao Mestre na 24ª e ao **Elite na 32ª**. Sem o bônus, o Elite levaria 44 semanas.

### Pontuação semanal

As semanas seguem o padrão ISO 8601 (segunda a domingo). Para cada grupo muscular e cada **semana completa** desde o início do acompanhamento:

| Situação | Efeito |
|---|---|
| Treinou o grupo ao menos 1 vez | **+25 pts**, mais o **bônus de sequência**, e zera as semanas sem treino |
| Não treinou o grupo | Perde a **penalidade do rank atual** (de −10 a −50, nunca abaixo de 0), +1 semana sem treino e a sequência volta a zero |

**Bônus de sequência:** semanas seguidas treinando o mesmo grupo rendem **+5 pts na 2ª semana** e **+10 a partir da 3ª** (limite de +10). Ou seja, 25, 30, 35, 35… A tela de Ranking mostra a sequência de cada grupo, e o resumo do treino mostra quanto veio do bônus ("inclui +10 de sequência").

### Rebaixamento

A cada **2 semanas completas consecutivas** sem treinar um grupo (2ª, 4ª, 6ª...), ele cai **um rank**, mesmo que os pontos ainda estivessem dentro do rank anterior.

- A referência é o rank que o grupo tinha **no início** desse período de 2 semanas, para não cair dois ranks de uma vez.
- Após o rebaixamento, os pontos passam a ser no máximo o **meio da faixa do novo rank** (ex.: Ouro 390 → −25 → −25 → Prata 212).
- O rank Iniciante não tem rank inferior.

### Proteção contra pontuação duplicada ("farm")

O critério semanal é binário: _treinou o grupo ao menos uma vez na semana?_ Cinco treinos de peito na mesma semana valem o mesmo que um.

### Semana atual e reabertura do app

- A semana atual **nunca é penalizada** antes de terminar (e não quebra a sequência); se o grupo já foi treinado nela, os pontos da semana aparecem na hora.
- Tudo é recalculado a partir da data de início, do histórico e das semanas completas, então abrir o app depois de semanas produz o mesmo resultado que abri-lo todo dia.
- Não é permitido registrar treinos com data futura.

---

## Segunda etapa — Integração de APIs, persistência e recursos do dispositivo

### Visão geral

```text
                 Interface (telas e componentes)
                              │
                 Hooks / AppDataContext
                              │
     Serviços de domínio (workoutService, photoService, rankingService)
                              │
      Repositórios (workoutRepository, photoRepository, settingsStorage)
          │                   │                  │                │
     AsyncStorage           SQLite          FileSystem       API wger (Axios)
  perfil e preferências  treinos e fotos  arquivos das      catálogo de
                          (metadados)       imagens          exercícios
```

### 1. Como a API é consumida com Axios

- O cliente HTTP é único: `src/services/api/apiClient.ts` cria a instância com `baseURL` (`https://wger.de/api/v2/`), `timeout` de 15 s e `Accept: application/json`. Nenhuma URL fica espalhada pelos componentes, e a API é pública, sem chave secreta.
- Toda falha vira um `ApiError` com mensagem pronta para a tela: sem internet ou servidor fora do ar, tempo limite, erro HTTP, cancelamento ou JSON inesperado.
- A tela usa o hook `useExerciseCatalog`, que controla carregamento, erro com **Tentar novamente**, lista vazia, paginação e o cancelamento da requisição anterior ao trocar de grupo (`AbortController`).
- Se a API estiver fora do ar, só o catálogo mostra o erro: treinos, ranking e fotos continuam funcionando.

### 2. Endpoint utilizado

```text
GET https://wger.de/api/v2/exerciseinfo/?category=11&limit=20&offset=0
```

O endpoint, os filtros e a estrutura do JSON foram conferidos na API real antes da implementação. Cada grupo do GymRank vira um filtro (`src/features/exercises/constants/wgerCatalog.ts`):

| Grupo | Filtro |
|---|---|
| Peito / Costas / Ombros / Abdômen | `category=11` / `12` / `13` / `10` |
| Bíceps | `category=8&muscles=1` (Braços + bíceps braquial) |
| Tríceps | `category=8&muscles=5` (Braços + tríceps braquial) |
| Pernas | `category__in=9,14` (Pernas + Panturrilhas) |

A API não oferece busca por trecho do nome. Por isso, enquanto há texto na busca, o app carrega as páginas restantes do grupo e filtra localmente (português, inglês e apelidos, ignorando acentos).

### 3. Como o JSON é processado

`src/services/api/exerciseApi.ts` valida a resposta **campo a campo**, sem `any`. Um formato inesperado gera `ApiError('invalid-response')`, e itens sem nome utilizável são descartados. Cada exercício recebe:

- **Nome:** a tradução em português (`language: 7`) quando existe; senão, a inglesa (`language: 2`). O nome em inglês fica como apoio.
- **Categoria, músculos e equipamentos:** traduzidos por id para o português.
- **Descrição:** HTML convertido em texto simples.
- **Imagem:** a miniatura de 200×200 da imagem principal.
- **Paginação:** os campos `count`, `next` e `offset` definem a próxima página.

O exercício escolhido é salvo no treino com id e nome, então o treino continua legível sem internet. Os exercícios **não alteram a pontuação**.

### 4. O que fica no AsyncStorage

| Chave | Conteúdo |
|---|---|
| `@gym-ranked/profile` | Nome, data de início do acompanhamento, data de criação do perfil e, se houver, o **caminho relativo** da foto de perfil (`avatarPath`) |
| `@gym-ranked/settings` | Preferências da foto: mostrar ranks, mostrar pontos e cor de destaque |

As preferências mudam na tela da foto ou no Perfil, e continuam salvas depois de fechar e abrir o app. O histórico de treinos **não** fica mais no AsyncStorage.

### 5. Dados armazenados no SQLite

Banco `gymrank.db`, com o esquema versionado por `PRAGMA user_version` (`src/services/database/migrations/schemaMigrations.ts`), `PRAGMA foreign_keys = ON` e WAL:

| Tabela | Colunas | Observação |
|---|---|---|
| `workouts` | `id`, `title`, `date`, `duration_minutes`, `notes`, `created_at` | Um registro por treino finalizado |
| `workout_muscle_groups` | `workout_id`, `muscle_group` | Relação N:N treino × grupo |
| `workout_exercises` | `workout_id`, `exercise_id`, `name`, `muscle_group`, `position` | Exercícios do catálogo |
| `workout_photos` | `id`, `workout_id` (único), `original_image_path`, `generated_image_path`, `created_at` | Somente caminhos: a imagem não vai para o banco |
| `app_meta` | `key`, `value` | Controle interno, como a migração concluída |

- As chaves estrangeiras usam `ON DELETE CASCADE`: excluir um treino remove os grupos, os exercícios e o registro da foto.
- Toda consulta é **parametrizada** (`?`), e operações em várias tabelas usam transação (`withTransactionAsync`).
- A interface nunca executa SQL. O acesso passa pelos repositórios em `src/services/database/repositories/`.
- **Não há coluna de status:** no GymRank, todo treino registrado é um treino concluído (o registro acontece pelo botão "Finalizar treino"). Por isso, treinos antigos continuam válidos sem nenhum campo novo.

**Migração dos dados da primeira etapa** (`src/services/database/migrations/legacyWorkoutsMigration.ts`). Na primeira abertura após a atualização, o app:

1. Lê os treinos antigos do AsyncStorage e os adapta ao modelo novo (sem exercícios).
2. Insere tudo no SQLite em **uma transação**, com `INSERT OR IGNORE`: os mesmos ids, datas e grupos, sem duplicar.
3. Grava a marca de "migração concluída" **na mesma transação**, ou seja, ela só existe se tudo foi salvo.
4. Só **depois** do commit, e de conferir que todos os ids estão no banco, apaga os treinos antigos do AsyncStorage.
5. Não roda de novo. Se o app fechar entre o commit e a limpeza, a limpeza é concluída na próxima abertura.

### 6. Como funciona a captura de fotos

Com **expo-image-picker** (`src/features/workout-photo/services/photoPicker.ts` e o hook `usePhotoPicker`):

- **Permissão:** é verificada antes de abrir a câmera e só é pedida nesse momento.
- **Permissão negada:** o app explica o motivo e oferece **Abrir configurações**. O treino continua salvo.
- **Cancelamento:** volta para a tela anterior sem mensagem de erro.
- **Erros inesperados:** viram uma mensagem amigável.
- **Galeria:** usa o seletor do sistema, que não exige permissão.
- **Refazer a foto:** pode ser feito quantas vezes quiser na tela de personalização.

A foto é **opcional**: o treino e a pontuação já foram salvos no **Finalizar treino**, e a foto nunca gera pontos.

**Foto de perfil** (`src/features/profile/components/ProfilePhotoEditor.tsx` e `src/features/profile/services/profilePhotoService.ts`):

- Toque no avatar do Perfil e escolha **Câmera** ou **Galeria**. O mesmo `usePhotoPicker` abre o **recorte quadrado** (`allowsEditing`, `aspect: [1, 1]`), e a foto aparece em círculo no Perfil e no Início.
- O arquivo é copiado para `documentos/profile-photo/`, e o perfil no AsyncStorage guarda só o caminho relativo.
- **Ordem segura:** copia o arquivo, grava o perfil e só então apaga a foto anterior. Se a gravação falhar, o arquivo novo é removido.
- **Remover foto** volta ao avatar padrão e apaga o arquivo. Se o arquivo sumir, o avatar padrão aparece no lugar.
- Sobras da pasta são limpas na abertura do app, e **Apagar todos os dados** também apaga a foto de perfil.
- A foto de perfil não altera a pontuação. No navegador aparece o aviso "Disponível no celular".

### 7. Como a imagem final é gerada

1. `WorkoutPhotoTemplate` desenha a composição: a foto ocupa todo o quadro 9:16, com o logotipo GYMRANK e, sobre um degradê escuro, os dados do treino:
   - "TREINO CONCLUÍDO" e o nome do treino;
   - data e duração (a duração só aparece quando foi informada);
   - grupos trabalhados, com o **rank de cada grupo** e os **pontos realmente conquistados**.
2. **Origem dos dados:** tudo vem do treino salvo e do ranking calculado, por `getWorkoutContributions` em `workoutContributionService.ts`. A recompensa semanal (+25 e o bônus de sequência) aparece só no treino que fez a semana do grupo contar. Um segundo treino do mesmo grupo na semana não mostra pontos inventados, e quando o treino tem vários grupos, cada um mostra o próprio rank.
3. **Resolução:** a composição é desenhada em exatamente **1080 px** de largura (em dp: `1080 / PixelRatio`) e apenas **reduzida visualmente** na tela. Assim, a captura sai em resolução final, sem ampliação. A pré-visualização e o arquivo são a mesma view.
4. **Captura:** só fica disponível depois do `onLoad` da foto, e o app ainda aguarda dois quadros para garantir que a última personalização foi desenhada. Então o `captureRef` (react-native-view-shot) gera um **JPG 1080×1920**. Os botões ficam fora da view capturada e nunca entram na imagem.
5. **Armazenamento:** a original e a composição são copiadas do cache para `documentos/workout-photos/` (expo-file-system). Os caminhos relativos vão para `workout_photos` no SQLite.
6. **Ordem segura:** copia os arquivos, grava o banco e só então apaga os arquivos substituídos. Arquivos órfãos são limpos na abertura do app, e excluir um treino apaga também as imagens dele.

### 8. Como salvar ou compartilhar

- **Salvar no treino:** vincula a imagem ao treino. Ela aparece no Histórico (miniatura) e nos Detalhes, mesmo depois de fechar o app.
- **Galeria:** `expo-media-library` (`Asset.create`) salva o JPG final na galeria do aparelho.
- **Compartilhar:** `expo-sharing` abre a folha de compartilhamento do sistema com o JPG, já com as informações dentro da imagem.
- **Nos Detalhes do treino:**
  - ver a composição ou a foto original;
  - compartilhar de novo ou salvar na galeria;
  - **Recriar** a imagem com os dados atuais (útil depois de editar o treino);
  - **Substituir** a foto;
  - **Remover** a foto sem excluir o treino.
- **Uploads:** nenhum upload automático é feito. As imagens só saem do aparelho quando o usuário compartilha.

### 9. Permissões necessárias

| Permissão | Quando é pedida | Configuração |
|---|---|---|
| Câmera | Ao tocar em **Tirar foto do treino** / **Refazer foto**, ou ao escolher **Câmera** na foto de perfil | Plugin `expo-image-picker` (`cameraPermission`) |
| Fotos (somente gravação) | Ao tocar em **Galeria** para salvar a imagem | Plugin `expo-media-library` (`savePhotosPermission`, `granularPermissions: ["photo"]`) |
| Microfone | **Nunca** (vídeo não é usado) | `microphonePermission: false` |

Escolher uma foto da galeria usa o seletor do sistema e não pede permissão. No Expo Go, o pedido de permissão aparece com os textos do próprio Expo Go; os textos do `app.json` valem para builds próprias.

### 10. Como executar e testar no Expo Go

1. `npm install` e `npx expo start`; leia o QR Code com o Expo Go (SDK 58).
2. **Migração:** se o aparelho já tinha a primeira etapa instalada, abra o app e confira no Histórico que os treinos antigos continuam lá, uma única vez.
3. **Novo Treino:**
   - preencha o nome e toque em **Adicionar do catálogo**;
   - escolha o grupo, busque (ex.: "supino") e marque os exercícios;
   - toque em **Adicionar N ao treino** e depois em **Finalizar treino**.
4. **Resumo:** confira os pontos de cada grupo e toque em **Tirar foto do treino**:
   - aceite a permissão da câmera e fotografe;
   - teste também negar a permissão e cancelar a câmera.
5. **Personalização:**
   - troque a cor e desligue Ranks/Pontos;
   - toque em **Refazer foto**;
   - depois use **Compartilhar** e **Galeria**, e confira na galeria que o texto está dentro da imagem;
   - por fim, **Salvar no treino**.
6. **Histórico:** confira a miniatura, abra o treino e teste compartilhar de novo, Recriar, Substituir e Remover a foto.
7. **Persistência:** feche o app por completo e reabra. Os treinos, a foto e as preferências (Perfil → Preferências da foto) continuam lá.
8. **Sem internet:** ative o modo avião, abra o catálogo, veja a mensagem e use **Tentar novamente** depois de reconectar.
9. **Ranking:** registre um segundo treino do mesmo grupo na semana. O resumo mostra "Semana já contabilizada" e os pontos não mudam; tirar foto também não altera os pontos.
10. **Foto de perfil:** no Perfil, toque no avatar:
    - escolha **Câmera**, fotografe e ajuste o recorte quadrado; repita com **Galeria**;
    - confira a foto no Perfil e no Início;
    - feche e reabra o app: a foto continua lá;
    - toque em **Remover foto** e confira que o avatar padrão volta.

### Requisitos da segunda etapa atendidos

| Requisito | Onde foi aplicado |
|---|---|
| Consumo de API com Axios e JSON | Cliente em `src/services/api/apiClient.ts:8`; endpoint e parser tipado em `src/services/api/exerciseApi.ts:97` e `:121`; estado/erros/paginação em `src/features/exercises/hooks/useExerciseCatalog.ts:46`; tela em `src/features/exercises/screens/ExerciseCatalogScreen.tsx` |
| Dados da API na interface | `ExerciseCatalogScreen` (`FlatList`), `ExerciseCard` e lista de exercícios no formulário (`WorkoutExerciseList`) |
| Persistência com AsyncStorage | Perfil (inclusive o caminho da foto de perfil) em `src/services/storage/profileStorage.ts:21`; preferências em `src/services/storage/settingsStorage.ts:40`; usadas em `PhotoCustomizationBar` e `PhotoPreferencesSection` |
| Persistência com SQLite | Conexão em `src/services/database/database.ts:26`; esquema em `migrations/schemaMigrations.ts:70`; repositórios `workoutRepository.ts:142` e `photoRepository.ts:28`; migração do AsyncStorage em `migrations/legacyWorkoutsMigration.ts:46` (executada em `src/contexts/AppDataContext.tsx:106`) |
| Câmera | `src/features/workout-photo/services/photoPicker.ts:47` (permissão) e `:57` (`launchCameraAsync`); galeria em `:61`; foto de perfil com recorte quadrado em `src/features/profile/components/ProfilePhotoEditor.tsx:37` |
| Manipulação de imagens | Composição em `src/features/workout-photo/components/WorkoutPhotoTemplate.tsx:37`; geração do JPG em `services/compositionExport.ts:47` (`captureRef`) |
| Arquivos das fotos | `src/services/filesystem/photoFileStorage.ts:40`; orquestração em `src/features/workout-photo/services/photoService.ts:33` e limpeza de órfãos em `:86`; foto de perfil em `src/features/profile/services/profilePhotoService.ts:21` (salvar), `:38` (remover) e `:56` (limpeza) |
| Salvar e compartilhar | Galeria em `services/deviceGallery.ts:22` (`Asset.create`); compartilhamento em `services/imageSharing.ts:8` (`shareAsync`) |
| Foto ao finalizar o treino | `src/features/workouts/screens/WorkoutCompletedScreen.tsx:24` → `src/features/workout-photo/screens/WorkoutPhotoScreen.tsx:72` |
| Foto vinculada ao histórico | Miniatura em `src/features/history/screens/HistoryScreen.tsx`; seção nos detalhes em `src/features/workout-photo/components/WorkoutPhotoSection.tsx:26` |
| Ranking derivado do histórico | Regras centralizadas em `rankingService.ts` e `rankingConfig.ts` (fotos e exercícios nunca alteram pontos); leitura somente-leitura em `src/features/ranking/services/workoutContributionService.ts:37` |

### Verificações executadas

| Verificação | Resultado |
|---|---|
| `npm test` | 95 testes passando: ranking (faixas crescentes, penalidade por rank, bônus de sequência e rebaixamento) e datas, validação, contribuição do treino, **SQL real** (repositórios, cascata, chave estrangeira e transação via `node:sqlite`), migração do AsyncStorage, parser da API e foto de perfil (gravação, troca, falhas e limpeza) |
| `npm run test:api` | 2 testes contra a **API wger real** (peito com paginação; filtro de bíceps) passando |
| `npm run typecheck` e `npx expo lint` | Sem erros nem avisos |
| `npx expo export --platform android --platform ios --platform web` | Bundles gerados sem erro |
| `npx expo-doctor` | 19/20. O item restante diz que `.expo/` não é ignorado pelo Git, mas o `.gitignore` já contém `.expo/`: o aviso aparece porque o Git não está instalado no computador usado |

Também testado na pré-visualização web:
- catálogo com dados reais, busca, paginação, troca de grupo e erro sem rede com nova tentativa;
- **Finalizar treino** → resumo com pontos reais;
- composição da foto com título longo e 7 grupos, sem texto cortado;
- personalização gravada no AsyncStorage e mantida após recarregar;
- dados de demonstração no SQLite;
- **migração ponta a ponta** (treinos antigos importados uma única vez e a chave antiga apagada);
- avatar do Perfil com o selo de câmera e o aviso "Disponível no celular" ao tocar nele.

### Pendente de validação no aparelho físico

Estes itens dependem de recursos nativos e não puderam ser executados no ambiente de desenvolvimento:

- **Câmera:** abrir, fotografar, negar a permissão e cancelar.
- **Imagem:** gerar o JPG com `captureRef` e conferir na galeria que o texto está incorporado.
- **Galeria e compartilhamento:** salvar na galeria (`Asset.create`) e compartilhar com outro app.
- **Arquivos:** persistência das imagens em `documentos/workout-photos/` após reiniciar e reabertura de uma imagem antiga pelo histórico.
- **Foto de perfil:** câmera e galeria com recorte quadrado, troca, remoção e persistência em `documentos/profile-photo/` após reiniciar.

## Estrutura do projeto

```text
gym-ranked/
├── App.tsx                     # Providers (SafeArea, dados) + navegador
├── metro.config.js             # Suporte a .wasm (SQLite na pré-visualização web)
├── scripts/test-api.js         # Executa o teste contra a API real
└── src/
    ├── components/             # Componentes reutilizáveis (RankBadge, WorkoutCard, StatCard...)
    ├── constants/              # Tema, grupos musculares, configuração do ranking, imagens
    ├── contexts/               # AppDataContext: estado global e ranking derivado
    ├── dev/                    # Dados de demonstração (apenas modo desenvolvimento)
    ├── features/
    │   ├── dashboard/          # Tela inicial
    │   ├── exercises/          # Catálogo da API wger (tela, hook, componentes, busca)
    │   ├── history/            # Histórico (SectionList)
    │   ├── profile/            # Perfil, foto de perfil, preferências da foto e ferramentas de desenvolvimento
    │   ├── ranking/            # rankingService, contribuição do treino, tela do ranking
    │   ├── workout-photo/      # Composição, tela da foto, captura, arquivos, galeria e compartilhamento
    │   └── workouts/           # Formulário, conclusão, detalhes, edição e workoutService
    ├── hooks/                  # useWorkouts, useRanking, useProfile, useSettings, useWorkoutPhotos...
    ├── navigation/             # Stack + Bottom Tabs tipados
    ├── services/
    │   ├── api/                # Axios: apiClient e exerciseApi
    │   ├── database/           # SQLite: conexão, migrações e repositórios
    │   ├── filesystem/         # Arquivos das fotos e da foto de perfil (expo-file-system)
    │   └── storage/            # AsyncStorage: perfil, preferências e leitura dos dados antigos
    ├── test-utils/             # Banco SQLite real em memória para os testes
    ├── types/                  # Tipos comuns (DateKey, WeekKey)
    └── utils/                  # Datas, textos, validações de JSON, IDs e diálogos
```

**Fluxo de dados:** `Tela → hook → AppDataContext → serviço de domínio → repositório → SQLite / AsyncStorage / arquivos / API`. As telas nunca acessam SQL, AsyncStorage ou arquivos diretamente.

## Requisitos da atividade atendidos (primeira etapa)

| Requisito | Onde foi aplicado |
|---|---|
| React Native + Expo | Projeto base criado com `create-expo-app` (template TypeScript), atualizado para o Expo SDK 58 |
| Funciona no Expo Go | Apenas bibliotecas incluídas no Expo Go |
| Estrutura organizada | Arquitetura por features em `src/` (ver seção acima) |
| Componentes funcionais | Todos os componentes e telas, ex.: `src/components/RankBadge/index.tsx`, `src/features/dashboard/screens/DashboardScreen.tsx` |
| Props | `RankBadgeProps` em `src/components/RankBadge/index.tsx`, `WorkoutCardProps` em `src/components/WorkoutCard/index.tsx`, `WorkoutPhotoTemplateProps`, `ExerciseCardProps`, `StatCardProps`, `EmptyStateProps`, `WorkoutFormProps` |
| State (`useState`) | Formulário de treino em `src/features/workouts/hooks/useWorkoutForm.ts:26`, edição do nome em `src/features/profile/screens/ProfileScreen.tsx:29`, envio em `NewWorkoutScreen.tsx:17`, estado global em `src/contexts/AppDataContext.tsx:180` |
| Context API | `createContext`/`useContext` em `src/contexts/AppDataContext.tsx`, consumido pelos hooks em `src/hooks/` |
| `View` / `Text` | Em todas as telas e componentes |
| `Image` | Avatar/foto de perfil em `src/components/ProfileAvatar.tsx:19` (usado no Início e no Perfil); foto na composição em `WorkoutPhotoTemplate.tsx:60` |
| `Pressable` | `src/components/AppButton/index.tsx:38`, `src/components/MuscleGroupCard/index.tsx:22`, `src/components/WorkoutCard/index.tsx:28`, `src/features/workouts/components/MuscleGroupSelector.tsx:21` |
| `ScrollView` | Dashboard em `src/features/dashboard/screens/DashboardScreen.tsx:25`; também Novo Treino, Treino concluído, Foto, Detalhes e Perfil |
| `StyleSheet` / Flexbox | `StyleSheet.create` em todos os componentes; layouts com `flexDirection`, `flexWrap`, `flex`, `gap` |
| `FlatList` / `SectionList` | `SectionList` em `src/features/history/screens/HistoryScreen.tsx:58`; `FlatList` em `src/features/ranking/screens/RankingScreen.tsx:16` e `src/features/exercises/screens/ExerciseCatalogScreen.tsx:169` |
| React Navigation | Native Stack em `src/navigation/AppNavigator.tsx:13`, Bottom Tabs em `src/navigation/BottomTabs.tsx:15`, rotas tipadas em `src/navigation/navigationTypes.ts` |
| Interface mobile | Tema escuro central em `src/constants/theme.ts`, safe area via `react-native-safe-area-context`, áreas de toque ≥ 44 pt |

## Decisões técnicas

- **Ranking derivado, nunca salvo:** evita inconsistências e garante que a foto, o catálogo e a migração não alterem pontos.
- **Registrar = concluir:** todo treino registrado é um treino concluído; o botão "Finalizar treino" cria exatamente um registro (com trava contra toque duplo), então finalizar não concede recompensa duas vezes.
- **Pontos na imagem só quando houve alteração:** a recompensa semanal é atribuída ao primeiro treino registrado do grupo na semana.
- **Caminhos relativos no SQLite:** o diretório de documentos do app pode mudar de caminho absoluto entre atualizações no iOS.
- **Uma foto por treino:** `workout_id` único em `workout_photos`; substituir troca os arquivos com segurança.
- **Testes de SQL com o SQLite real do Node (`node:sqlite`):** os repositórios dependem de uma interface mínima (`SqlDatabase`), a mesma do expo-sqlite, então os testes executam o SQL exato do app.
- **Pré-visualização web:** o SQLite funciona no navegador (WebAssembly); salvar e compartilhar fotos é exclusivo do app (versões `.web.ts` informam isso sem quebrar). Abra pelo **localhost** (ex.: `http://localhost:8081`): pelo IP da rede ou de VPN em HTTP o navegador não considera a página segura, bloqueia o armazenamento (OPFS) usado pelo SQLite e o app avisa que o banco não pode ser aberto. No celular, use o Expo Go, que não tem essa limitação.
- **Datas como `YYYY-MM-DD` e aritmética em UTC:** evita erros de fuso e horário de verão.

## Próximas funcionalidades

- Séries, repetições e carga por exercício
- Geolocalização (check-in na academia)
- Autenticação e backend/API com sincronização em nuvem
- Ranking online entre usuários
- Notificações (lembrete de grupos pendentes antes do fim da semana)
- Desafios e conquistas
