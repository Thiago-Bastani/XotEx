import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { GameService } from '../../services/game';
import { 
  Player, 
  GameSession, 
  Confession, 
  ConfessionCategory,
  RoundResult
} from '../../models/game.model';

type GamePhase = 'reading' | 'voting' | 'results' | 'finished';

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class GamePage implements OnInit, OnDestroy {
  players: Player[] = [];
  currentConfession: Confession | null = null;
  gamePhase: GamePhase = 'reading';
  heatLevel = 1;
  completedRounds = 0;
  
  // Box animation
  isBoxOpening = false;
  
  // Voting
  currentVote: string | null = null;
  votes: { [playerId: string]: string } = {};
  currentVotingPlayerIndex = 0;
  currentVotingPlayer: Player | null = null;
  
  // Results
  roundResult: RoundResult | null = null;
  gameStats: any = null;
  
  // UI
  showErrorToast = false;
  errorMessage = '';
  isRevealingResults = false;
  
  private gameSubscription: Subscription | null = null;

  constructor(
    private gameService: GameService,
    private router: Router,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.gameSubscription = this.gameService.gameSession$.subscribe((session: GameSession | null) => {
      if (session) {
        this.players = [...session.players];
        this.heatLevel = session.heatLevel;
        this.completedRounds = session.completedRounds.length;
        
        if (session.currentRound) {
          this.currentConfession = session.currentRound.confession;
          
          const oldVotesCount = Object.keys(this.votes).length;
          
          // NOVA ESTRATÉGIA: Sempre sincronizar com o serviço (fonte da verdade)
          // mas preservar currentVote se estiver selecionado
          const preservedCurrentVote = this.currentVote;
          this.votes = { ...session.currentRound.votes };
          this.currentVote = preservedCurrentVote;
          
          const newVotesCount = Object.keys(this.votes).length;
          if (newVotesCount !== oldVotesCount) {            
            // Re-encontrar o jogador atual após sincronização
            this.findNextVotingPlayer();
          }
          
          if (session.currentRound.revealed) {
            this.gamePhase = 'results';
            // Só calcular o resultado se ainda não temos e não estamos revelando
            if (!this.roundResult && !this.isRevealingResults) {
              try {
                this.roundResult = this.calculateRoundResult(session.currentRound, session.players);
              } catch (error) {
                console.error('Erro ao calcular resultado:', error);
              }
            }
          } else if (Object.keys(this.votes).length > 0) {
            this.gamePhase = 'voting';
            this.initializeVotingState();
          } else {
            this.gamePhase = 'voting';
            this.initializeVotingState();
          }
        } else {
          // Tentar iniciar próxima rodada
          const hasNext = this.gameService.nextRound();
          if (!hasNext) {
            this.gamePhase = 'finished';
            this.gameStats = this.gameService.getGameStats();
          }
        }
      } else {
        this.router.navigate(['/tabs/tab1']);
      }
    });
  }

  ngOnDestroy() {
    if (this.gameSubscription) {
      this.gameSubscription.unsubscribe();
    }
  }

  openBox() {
    if (this.gamePhase !== 'reading') return;
    
    this.isBoxOpening = true;
    
    setTimeout(() => {
      this.gamePhase = 'voting';
      this.isBoxOpening = false;
      this.initializeVotingState();
    }, 1000);
  }

  // Inicializar estado da votação de forma consistente
  initializeVotingState() {
    this.currentVote = null;
    this.currentVotingPlayerIndex = 0;
    this.findNextVotingPlayer();
  }

  updateCurrentVotingPlayer() {
    this.findNextVotingPlayer();
  }

  // Método principal para encontrar o próximo jogador
  findNextVotingPlayer() {
    this.currentVotingPlayer = null;
    
    // Verificações de segurança
    if (!this.players || this.players.length === 0) {
      return;
    }
    
    // Verificar se todos os jogadores já votaram
    if (this.allPlayersVoted()) {
      return;
    }
    
    // Procurar o próximo jogador que ainda não votou
    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      if (player && player.id && !this.hasPlayerVoted(player.id)) {
        this.currentVotingPlayer = player;
        this.currentVotingPlayerIndex = i;
        return;
      }
    }
  }

  getCurrentVotingPlayerName(): string {
    return this.currentVotingPlayer?.name || 'Nenhum jogador';
  }

  getVotingOptions(): Player[] {
    // Verificar se temos dados válidos
    if (!this.currentConfession || !this.currentVotingPlayer || !this.currentVotingPlayer.id || !this.players) {
      return [];
    }
    
    // Todos os jogadores votam nas mesmas opções: podem votar em qualquer um exceto si mesmos
    // Isso mantém o anonimato - ninguém pode votar em si mesmo
    return this.players.filter(player => 
      player && player.id && player.id !== this.currentVotingPlayer!.id
    );
  }

  isCurrentPlayerTurn(playerId: string): boolean {
    if (!playerId || !this.currentVotingPlayer) return false;
    return this.currentVotingPlayer.id === playerId;
  }

  getCategoryEmoji(category: ConfessionCategory | undefined): string {
    if (!category) return '💭';
    
    const emojiMap = {
      [ConfessionCategory.FUNNY]: '🤣',
      [ConfessionCategory.CHILDISH]: '🧸',
      [ConfessionCategory.EMBARRASSING]: '😳',
      [ConfessionCategory.ROMANTIC]: '💕',
      [ConfessionCategory.SPICY]: '🌶️'
    };
    return emojiMap[category] || '💭';
  }

  vote(playerId: string) {
    // Validações de segurança
    if (!playerId) {
      this.showError('Erro: ID do jogador inválido');
      return;
    }
    
    if (!this.canPlayerVote()) {
      this.showError('Erro: Não é possível votar agora');
      return;
    }
    
    if (!this.currentVotingPlayer) {
      this.showError('Erro: Nenhum jogador selecionado para votar');
      return;
    }
    
    // Verificar se é uma opção válida
    const votingOptions = this.getVotingOptions();
    if (!votingOptions.some(player => player.id === playerId)) {
      this.showError('Erro: Opção de voto inválida');
      return;
    }
    
    this.currentVote = playerId;
  }

  confirmVote() {
    // Validações de segurança
    if (!this.currentVote || !this.currentVotingPlayer) {
      this.showError('Erro: Dados de votação inválidos');
      return;
    }

    // Verificar se o jogador ainda não votou (double check)
    if (this.hasPlayerVoted(this.currentVotingPlayer.id)) {
      this.showError('Erro: Jogador já votou');
      return;
    }
    
    try {
      // Registrar o voto no serviço
      this.gameService.vote(this.currentVotingPlayer.id, this.currentVote);
      
      // NÃO atualizar votos localmente - deixar a subscription fazer isso
      // Isso evita duplicação de estado
      
      // Limpar seleção atual
      this.currentVote = null;
      
      // A subscription vai chamar findNextVotingPlayer() automaticamente
      
    } catch (error: any) {
      console.error('❌ ERRO AO VOTAR:', error);
      this.showError(error.message || 'Erro ao registrar voto');
    }
  }

  canPlayerVote(): boolean {
    // Verificar se estamos na fase de votação
    if (this.gamePhase !== 'voting') return false;
    
    // Verificar se há um jogador atual válido
    if (!this.currentVotingPlayer || !this.currentVotingPlayer.id) return false;
    
    // Verificar se o jogador atual ainda não votou
    if (this.hasPlayerVoted(this.currentVotingPlayer.id)) return false;
    
    // Verificar se ainda não terminaram todos os votos
    if (this.allPlayersVoted()) return false;
    
    return true;
  }

  getVotesCount(): number {
    return this.votes ? Object.keys(this.votes).length : 0;
  }

  hasVotes(): boolean {
    return this.votes ? Object.keys(this.votes).length > 0 : false;
  }

  hasPlayerVoted(playerId: string): boolean {
    if (!playerId || !this.votes) return false;
    return this.votes[playerId] !== undefined;
  }

  allPlayersVoted(): boolean {
    if (!this.players || this.players.length === 0 || !this.votes) return false;
    
    // Verificar localmente se todos os jogadores votaram
    const localCheck = this.players.every(player => 
      player && player.id && this.votes[player.id] !== undefined
    );
    
    // Verificar também com o serviço
    try {
      const serviceCheck = this.gameService.allPlayersVoted();
      return localCheck && serviceCheck;
    } catch (error) {
      console.error('Erro ao verificar votos no serviço:', error);
      return localCheck;
    }
  }

  revealResults() {
    if (this.isRevealingResults) return; // Evitar múltiplas chamadas
    
    try {
      this.isRevealingResults = true;
      this.roundResult = this.gameService.revealRound();
      this.gamePhase = 'results';
    } catch (error: any) {
      this.showError(error.message);
    } finally {
      this.isRevealingResults = false;
    }
  }

  nextRound() {
    const hasNext = this.gameService.nextRound();
    
    if (hasNext) {
      this.gamePhase = 'reading';
      this.roundResult = null;
      this.currentVote = null;
      this.votes = {};
      this.currentVotingPlayerIndex = 0;
      this.currentVotingPlayer = null;
    } else {
      this.gamePhase = 'finished';
      this.gameStats = this.gameService.getGameStats();
    }
  }

  async showGameStats() {
    const stats = this.gameService.getGameStats();
    if (!stats) return;
    
    let message = `
      <strong>Estatísticas do Jogo:</strong><br>
      🏆 Rodadas: ${stats.totalRounds}<br>
      🔥 Heat Level: ${stats.heatLevel}<br><br>
      <strong>Jogadores:</strong><br>
    `;
    
    stats.playerStats.forEach((stat: any) => {
      message += `${stat.player.avatar} ${stat.player.name}: ${stat.accuracy.toFixed(1)}% acertos<br>`;
    });

    const alert = await this.alertController.create({
      header: 'Estatísticas',
      message,
      buttons: ['Fechar']
    });

    await alert.present();
  }

  goHome() {
    this.router.navigate(['/tabs/tab1']);
  }

  // Calcular resultado da rodada sem modificar estado (evitar loop infinito)
  calculateRoundResult(round: any, players: Player[]): RoundResult {
    const actualAuthor = players.find(p => p.id === round.confession.playerId)!;
    
    // Calcular resultados dos votos
    const voteResults: any[] = [];
    const voteCounts: { [playerId: string]: number } = {};

    // Contar votos
    Object.values(round.votes).forEach((votedForId: any) => {
      voteCounts[votedForId] = (voteCounts[votedForId] || 0) + 1;
    });

    // Criar resultados
    players.forEach(player => {
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
      
      const voter = players.find(p => p.id === voterId)!;
      if (votedForId === round.confession.playerId) {
        correctGuessers.push(voter);
      } else {
        wrongGuessers.push(voter);
      }
    });

    return {
      confession: round.confession,
      actualAuthor,
      votes: voteResults,
      correctGuessers,
      wrongGuessers
    };
  }

  private showError(message: string) {
    this.errorMessage = message;
    this.showErrorToast = true;
  }
}
