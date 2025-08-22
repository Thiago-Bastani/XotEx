export interface Player {
  id: string;
  name: string;
  color: string;
  avatar: string;
}

export interface Confession {
  id: string;
  playerId: string;
  text: string;
  category: ConfessionCategory;
  isUsed: boolean;
}

export interface GameRound {
  confession: Confession;
  votes: { [playerId: string]: string }; // playerId -> votedForPlayerId
  revealed: boolean;
  correctGuesses: string[]; // playerIds who guessed correctly
}

export interface GameSession {
  id: string;
  players: Player[];
  confessions: Confession[];
  currentRound: GameRound | null;
  completedRounds: GameRound[];
  heatLevel: number;
  createdAt: Date;
  status: GameStatus;
}

export enum ConfessionCategory {
  FUNNY = 'Engraçado',
  CHILDISH = 'Infantil', 
  EMBARRASSING = 'Vergonhoso',
  ROMANTIC = 'Romântico',
  SPICY = 'Picante'
}

export enum GameStatus {
  SETUP = 'setup',
  CONFESSIONS = 'confessions',
  PLAYING = 'playing',
  FINISHED = 'finished'
}

export interface VoteResult {
  playerId: string;
  playerName: string;
  votes: number;
  isCorrect: boolean;
}

export interface RoundResult {
  confession: Confession;
  actualAuthor: Player;
  votes: VoteResult[];
  correctGuessers: Player[];
  wrongGuessers: Player[];
}

// Configurações predefinidas
export const PLAYER_COLORS = [
  '#6c5ce7', '#a29bfe', '#fd79a8', '#fdcb6e', 
  '#e84393', '#00b894', '#e17055', '#74b9ff'
];

export const PLAYER_AVATARS = [
  '🎭', '🎪', '🎨', '🎯', '🎲', '🎸', '🎺', '🎼'
];

export const HEAT_LEVEL_CATEGORIES: { [key: number]: ConfessionCategory[] } = {
  1: [ConfessionCategory.FUNNY, ConfessionCategory.CHILDISH],
  2: [ConfessionCategory.FUNNY, ConfessionCategory.CHILDISH],
  3: [ConfessionCategory.FUNNY, ConfessionCategory.CHILDISH, ConfessionCategory.EMBARRASSING],
  4: [ConfessionCategory.FUNNY, ConfessionCategory.CHILDISH, ConfessionCategory.EMBARRASSING, ConfessionCategory.ROMANTIC],
  5: [ConfessionCategory.FUNNY, ConfessionCategory.CHILDISH, ConfessionCategory.EMBARRASSING, ConfessionCategory.ROMANTIC, ConfessionCategory.SPICY]
};

export const CONFESSION_SUGGESTIONS = {
  [ConfessionCategory.FUNNY]: [
    'Já ri tanto que fiz xixi nas calças',
    'Já falei sozinho em público sem perceber',
    'Já fingi que entendia uma piada que não entendi',
    'Já dancei pelado no espelho',
    'Já tentei impressionar alguém e me ferrei'
  ],
  [ConfessionCategory.CHILDISH]: [
    'Ainda durmo com um bichinho de pelúcia',
    'Já chorei assistindo desenho animado',
    'Ainda como escondido igual criança',
    'Já brinquei de boneca/carrinho recentemente',
    'Ainda tenho medo do escuro às vezes'
  ],
  [ConfessionCategory.EMBARRASSING]: [
    'Já passei vergonha na frente do crush',
    'Já caí em público de forma épica',
    'Já mandei mensagem para a pessoa errada',
    'Já fui flagrado fazendo algo embaraçoso',
    'Já menti sobre algo e fui descoberto na hora'
  ],
  [ConfessionCategory.ROMANTIC]: [
    'Já escrevi carta de amor e não entreguei',
    'Já stalkeei ex nas redes sociais',
    'Já fingi estar bem depois de um término',
    'Já me apaixonei por alguém impossível',
    'Já tive crush em amigo(a) do grupo'
  ],
  [ConfessionCategory.SPICY]: [
    'Já tive sonho picante com alguém do grupo',
    'Já fiz algo que nunca contei para ninguém',
    'Já menti sobre minha experiência',
    'Já tive encontro que deu muito errado',
    'Já fiz algo que me deixou com vergonha depois'
  ]
};
