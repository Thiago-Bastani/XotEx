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
  
  // Results
  roundResult: RoundResult | null = null;
  gameStats: any = null;
  
  // UI
  showErrorToast = false;
  errorMessage = '';
  
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
          this.votes = { ...session.currentRound.votes };
          
          if (session.currentRound.revealed) {
            this.gamePhase = 'results';
            this.roundResult = this.gameService.revealRound();
          } else if (Object.keys(this.votes).length > 0) {
            this.gamePhase = 'voting';
          } else {
            this.gamePhase = 'voting';
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
    }, 1000);
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

  getVotablePlayers(): Player[] {
    if (!this.currentConfession) return [];
    
    return this.players.filter(player => 
      player.id !== this.currentConfession!.playerId
    );
  }

  vote(playerId: string) {
    this.currentVote = playerId;
  }

  confirmVote() {
    if (!this.currentVote) return;
    
    try {
      // Para simulação, vamos usar o primeiro jogador como votante
      // Em uma implementação real, isso seria baseado no jogador atual
      const votingPlayer = this.getVotablePlayers()[0];
      if (votingPlayer) {
        this.gameService.vote(votingPlayer.id, this.currentVote);
        this.currentVote = null;
      }
    } catch (error: any) {
      this.showError(error.message);
    }
  }

  hasVotes(): boolean {
    return Object.keys(this.votes).length > 0;
  }

  hasPlayerVoted(playerId: string): boolean {
    return this.votes[playerId] !== undefined;
  }

  allPlayersVoted(): boolean {
    return this.gameService.allPlayersVoted();
  }

  revealResults() {
    try {
      this.roundResult = this.gameService.revealRound();
      this.gamePhase = 'results';
    } catch (error: any) {
      this.showError(error.message);
    }
  }

  nextRound() {
    const hasNext = this.gameService.nextRound();
    
    if (hasNext) {
      this.gamePhase = 'reading';
      this.roundResult = null;
      this.currentVote = null;
      this.votes = {};
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

  private showError(message: string) {
    this.errorMessage = message;
    this.showErrorToast = true;
  }
}
