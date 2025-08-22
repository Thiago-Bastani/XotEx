import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { 
  GameSession, 
  Player, 
  Confession, 
  GameRound, 
  ConfessionCategory, 
  GameStatus,
  PLAYER_COLORS,
  PLAYER_AVATARS,
  HEAT_LEVEL_CATEGORIES,
  VoteResult,
  RoundResult
} from '../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private readonly STORAGE_KEY = 'confession_box_game';
  
  private gameSessionSubject = new BehaviorSubject<GameSession | null>(null);
  public gameSession$ = this.gameSessionSubject.asObservable();

  constructor() {
    this.loadGameSession();
  }

  // Criar nova sessão de jogo
  createNewGame(): string {
    const gameSession: GameSession = {
      id: this.generateId(),
      players: [],
      confessions: [],
      currentRound: null,
      completedRounds: [],
      heatLevel: 1,
      createdAt: new Date(),
      status: GameStatus.SETUP
    };

    this.saveGameSession(gameSession);
    return gameSession.id;
  }

  // Adicionar jogador
  addPlayer(name: string): Player {
    const session = this.getCurrentSession();
    if (!session) throw new Error('Nenhuma sessão ativa');

    if (session.players.length >= 8) {
      throw new Error('Máximo de 8 jogadores permitido');
    }

    if (session.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('Nome já existe');
    }

    const player: Player = {
      id: this.generateId(),
      name,
      color: PLAYER_COLORS[session.players.length],
      avatar: PLAYER_AVATARS[session.players.length]
    };

    session.players.push(player);
    this.saveGameSession(session);
    
    return player;
  }

  // Remover jogador
  removePlayer(playerId: string): void {
    const session = this.getCurrentSession();
    if (!session) return;

    session.players = session.players.filter(p => p.id !== playerId);
    // Reorganizar cores e avatares
    session.players.forEach((player, index) => {
      player.color = PLAYER_COLORS[index];
      player.avatar = PLAYER_AVATARS[index];
    });

    this.saveGameSession(session);
  }

  // Iniciar fase de confissões
  startConfessions(): void {
    const session = this.getCurrentSession();
    if (!session) throw new Error('Nenhuma sessão ativa');

    if (session.players.length < 4) {
      throw new Error('Mínimo de 4 jogadores necessário');
    }

    session.status = GameStatus.CONFESSIONS;
    this.saveGameSession(session);
  }

  // Adicionar confissão
  addConfession(playerId: string, text: string, category: ConfessionCategory): void {
    const session = this.getCurrentSession();
    if (!session) throw new Error('Nenhuma sessão ativa');

    const confession: Confession = {
      id: this.generateId(),
      playerId,
      text: text.trim(),
      category,
      isUsed: false
    };

    session.confessions.push(confession);
    this.saveGameSession(session);
  }

  // Obter confissões de um jogador
  getPlayerConfessions(playerId: string): Confession[] {
    const session = this.getCurrentSession();
    if (!session) return [];

    return session.confessions.filter(c => c.playerId === playerId);
  }

  // Verificar se todos os jogadores escreveram confissões
  allPlayersHaveConfessions(): boolean {
    const session = this.getCurrentSession();
    if (!session) return false;

    return session.players.every(player => {
      const playerConfessions = this.getPlayerConfessions(player.id);
      return playerConfessions.length >= 3; // Mínimo 3 confissões por jogador
    });
  }

  // Iniciar jogo
  startGame(): void {
    const session = this.getCurrentSession();
    if (!session) throw new Error('Nenhuma sessão ativa');

    if (!this.allPlayersHaveConfessions()) {
      throw new Error('Nem todos os jogadores escreveram confissões');
    }

    session.status = GameStatus.PLAYING;
    this.nextRound();
  }

  // Próxima rodada
  nextRound(): boolean {
    const session = this.getCurrentSession();
    if (!session) return false;

    // Finalizar rodada atual se existir
    if (session.currentRound && session.currentRound.revealed) {
      session.completedRounds.push(session.currentRound);
      
      // Aumentar heat level a cada 3 rodadas
      if (session.completedRounds.length % 3 === 0) {
        session.heatLevel = Math.min(5, session.heatLevel + 1);
      }
    }

    // Buscar próxima confissão baseada no heat level
    const availableConfessions = this.getAvailableConfessions();
    if (availableConfessions.length === 0) {
      session.status = GameStatus.FINISHED;
      this.saveGameSession(session);
      return false;
    }

    // Selecionar confissão aleatória
    const randomIndex = Math.floor(Math.random() * availableConfessions.length);
    const selectedConfession = availableConfessions[randomIndex];
    selectedConfession.isUsed = true;

    // Criar nova rodada
    session.currentRound = {
      confession: selectedConfession,
      votes: {},
      revealed: false,
      correctGuesses: []
    };

    this.saveGameSession(session);
    return true;
  }

  // Obter confissões disponíveis baseadas no heat level
  private getAvailableConfessions(): Confession[] {
    const session = this.getCurrentSession();
    if (!session) return [];

    const allowedCategories = HEAT_LEVEL_CATEGORIES[session.heatLevel] || [];
    
    return session.confessions.filter(confession => 
      !confession.isUsed && allowedCategories.includes(confession.category)
    );
  }

  // Votar em uma confissão
  vote(playerId: string, votedForPlayerId: string): void {
    const session = this.getCurrentSession();
    if (!session || !session.currentRound) {
      throw new Error('Sessão ou rodada inválida');
    }

    if (session.currentRound.revealed) {
      throw new Error('Rodada já foi revelada');
    }

    // Verificar se o jogador existe
    const player = session.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Jogador não encontrado');
    }

    // Verificar se o voto já foi registrado
    if (session.currentRound.votes[playerId] !== undefined) {
      throw new Error('Jogador já votou');
    }

    // Verificar se o voto é para um jogador válido
    const votedPlayer = session.players.find(p => p.id === votedForPlayerId);
    if (!votedPlayer) {
      throw new Error('Jogador votado não encontrado');
    }

    // Ninguém pode votar em si mesmo para manter anonimato
    if (playerId === votedForPlayerId) {
      throw new Error('Não pode votar em si mesmo');
    }

    session.currentRound.votes[playerId] = votedForPlayerId;
    this.saveGameSession(session);
  }

  // Verificar se todos votaram
  allPlayersVoted(): boolean {
    const session = this.getCurrentSession();
    if (!session || !session.currentRound) return false;

    // Todos os jogadores votam, incluindo o autor da confissão
    return session.players.every(player => 
      session.currentRound!.votes[player.id] !== undefined
    );
  }

  // Revelar resultado da rodada
  revealRound(): RoundResult {
    const session = this.getCurrentSession();
    if (!session || !session.currentRound) {
      throw new Error('Nenhuma rodada ativa');
    }

    const round = session.currentRound;
    round.revealed = true;

    const actualAuthor = session.players.find(p => p.id === round.confession.playerId)!;
    
    // Calcular resultados dos votos
    const voteResults: VoteResult[] = [];
    const voteCounts: { [playerId: string]: number } = {};

    // Contar votos
    Object.values(round.votes).forEach(votedForId => {
      voteCounts[votedForId] = (voteCounts[votedForId] || 0) + 1;
    });

    // Criar resultados
    session.players.forEach(player => {
      if (player.id !== round.confession.playerId) {
        voteResults.push({
          playerId: player.id,
          playerName: player.name,
          votes: voteCounts[player.id] || 0,
          isCorrect: player.id === round.confession.playerId
        });
      }
    });

    // Identificar quem acertou e errou (excluindo o autor da confissão)
    const correctGuessers: Player[] = [];
    const wrongGuessers: Player[] = [];

    Object.entries(round.votes).forEach(([voterId, votedForId]) => {
      // O autor da confissão vota mas não sofre consequências
      if (voterId === round.confession.playerId) return;
      
      const voter = session.players.find(p => p.id === voterId)!;
      if (votedForId === round.confession.playerId) {
        correctGuessers.push(voter);
        round.correctGuesses.push(voterId);
      } else {
        wrongGuessers.push(voter);
      }
    });

    this.saveGameSession(session);

    return {
      confession: round.confession,
      actualAuthor,
      votes: voteResults,
      correctGuessers,
      wrongGuessers
    };
  }

  // Obter estatísticas do jogo
  getGameStats() {
    const session = this.getCurrentSession();
    if (!session) return null;

    const totalRounds = session.completedRounds.length;
    const playerStats = session.players.map(player => {
      const correctGuesses = session.completedRounds.reduce((count, round) => {
        return count + (round.correctGuesses.includes(player.id) ? 1 : 0);
      }, 0);

      const confessionsRevealed = session.completedRounds.filter(round => 
        round.confession.playerId === player.id
      ).length;

      return {
        player,
        correctGuesses,
        confessionsRevealed,
        accuracy: totalRounds > 0 ? (correctGuesses / totalRounds) * 100 : 0
      };
    });

    return {
      totalRounds,
      heatLevel: session.heatLevel,
      playerStats
    };
  }

  // Limpar dados do jogo
  clearGameData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.gameSessionSubject.next(null);
  }

  // Métodos privados
  getCurrentSession(): GameSession | null {
    return this.gameSessionSubject.value;
  }

  private saveGameSession(session: GameSession): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    this.gameSessionSubject.next(session);
  }

  private loadGameSession(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const session = JSON.parse(saved);
        session.createdAt = new Date(session.createdAt);
        this.gameSessionSubject.next(session);
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
