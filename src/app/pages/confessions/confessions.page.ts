import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { GameService } from '../../services/game';
import { CategorySelectorComponent, CategoryOption } from '../../components/category-selector/category-selector.component';
import { 
  Player, 
  GameSession, 
  Confession, 
  ConfessionCategory,
  CONFESSION_SUGGESTIONS 
} from '../../models/game.model';

@Component({
  selector: 'app-confessions',
  templateUrl: './confessions.page.html',
  styleUrls: ['./confessions.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, CategorySelectorComponent]
})
export class ConfessionsPage implements OnInit, OnDestroy {
  players: Player[] = [];
  currentPlayerIndex = 0;
  currentPlayer: Player | null = null;
  currentPlayerConfessions: Confession[] = [];
  
  confessionText = '';
  selectedCategory: ConfessionCategory = ConfessionCategory.FUNNY;
  availableCategories = Object.values(ConfessionCategory);
  categoryOptions: CategoryOption[] = [];
  suggestions: string[] = [];
  
  minConfessions = 3;
  showErrorToast = false;
  errorMessage = '';
  
  private gameSubscription: Subscription | null = null;

  constructor(
    private gameService: GameService,
    private router: Router
  ) {
    this.initializeCategoryOptions();
  }

  goBack() {
    this.router.navigate(['/setup']);
  }

  ngOnInit() {
    this.gameSubscription = this.gameService.gameSession$.subscribe((session: GameSession | null) => {
      if (session) {
        this.players = [...session.players];
        if (this.players.length > 0) {
          this.currentPlayer = this.players[this.currentPlayerIndex];
          this.updateCurrentPlayerConfessions();
        }
      } else {
        this.router.navigate(['/home']);
      }
    });
    
    this.updateSuggestions();
  }

  initializeCategoryOptions() {
    this.categoryOptions = [
      {
        value: ConfessionCategory.FUNNY,
        emoji: '🤣',
        label: 'Engraçado'
      },
      {
        value: ConfessionCategory.CHILDISH,
        emoji: '🧸',
        label: 'Infantil'
      },
      {
        value: ConfessionCategory.EMBARRASSING,
        emoji: '😳',
        label: 'Vergonhoso'
      },
      {
        value: ConfessionCategory.ROMANTIC,
        emoji: '💕',
        label: 'Romântico'
      },
      {
        value: ConfessionCategory.SPICY,
        emoji: '🌶️',
        label: 'Picante'
      }
    ];
  }

  onCategoryChange(category: string) {
    this.selectedCategory = category as ConfessionCategory;
    this.updateSuggestions();
  }

  ngOnDestroy() {
    if (this.gameSubscription) {
      this.gameSubscription.unsubscribe();
    }
  }

  onPlayerChange(event: any) {
    this.currentPlayerIndex = event.detail.value;
    this.currentPlayer = this.players[this.currentPlayerIndex];
    this.updateCurrentPlayerConfessions();
    this.clearForm();
  }

  selectPlayer(index: number) {
    this.currentPlayerIndex = index;
    this.currentPlayer = this.players[this.currentPlayerIndex];
    this.updateCurrentPlayerConfessions();
    this.clearForm();
  }

  getProgressValue(): number {
    if (!this.currentPlayerConfessions) return 0;
    return Math.min(this.currentPlayerConfessions.length / this.minConfessions, 1);
  }

  getPlayerConfessions(playerId: string): Confession[] {
    return this.gameService.getPlayerConfessions(playerId);
  }

  updateCurrentPlayerConfessions() {
    if (this.currentPlayer) {
      this.currentPlayerConfessions = this.getPlayerConfessions(this.currentPlayer.id);
    }
  }

  getCategoryEmoji(category: ConfessionCategory): string {
    const emojiMap = {
      [ConfessionCategory.FUNNY]: '🤣',
      [ConfessionCategory.CHILDISH]: '🧸',
      [ConfessionCategory.EMBARRASSING]: '😳',
      [ConfessionCategory.ROMANTIC]: '💕',
      [ConfessionCategory.SPICY]: '🌶️'
    };
    return emojiMap[category] || '💭';
  }

  updateSuggestions() {
    this.suggestions = CONFESSION_SUGGESTIONS[this.selectedCategory] || [];
  }

  useSuggestion(suggestion: string) {
    this.confessionText = suggestion;
  }

  isValidConfession(): boolean {
    return this.confessionText.trim().length >= 10 && 
           this.confessionText.trim().length <= 200 && 
           this.selectedCategory !== null;
  }

  addConfession() {
    if (!this.isValidConfession() || !this.currentPlayer) {
      this.showError('Confissão deve ter entre 10 e 200 caracteres');
      return;
    }

    try {
      this.gameService.addConfession(
        this.currentPlayer.id,
        this.confessionText.trim(),
        this.selectedCategory
      );
      
      this.updateCurrentPlayerConfessions();
      this.clearForm();
      
      // Auto-advance to next player if current is complete
      if (this.currentPlayerConfessions.length >= this.minConfessions) {
        this.goToNextIncompletePlayer();
      }
    } catch (error: any) {
      this.showError(error.message);
    }
  }

  removeConfession(confessionId: string) {
    // Implementar remoção de confissão se necessário
    // Por agora, vamos simplesmente recarregar as confissões
    this.updateCurrentPlayerConfessions();
  }

  isPlayerComplete(playerId: string): boolean {
    return this.getPlayerConfessions(playerId).length >= this.minConfessions;
  }

  canStartGame(): boolean {
    return this.gameService.allPlayersHaveConfessions();
  }

  startGame() {
    if (!this.canStartGame()) {
      this.showError('Todos os jogadores devem escrever pelo menos ' + this.minConfessions + ' confissões');
      return;
    }

    try {
      this.gameService.startGame();
      this.router.navigate(['/game']);
    } catch (error: any) {
      this.showError(error.message);
    }
  }

  private goToNextIncompletePlayer() {
    const incompletePlayerIndex = this.players.findIndex((player, index) => 
      index > this.currentPlayerIndex && !this.isPlayerComplete(player.id)
    );
    
    if (incompletePlayerIndex !== -1) {
      this.currentPlayerIndex = incompletePlayerIndex;
      this.currentPlayer = this.players[this.currentPlayerIndex];
      this.updateCurrentPlayerConfessions();
    } else {
      // Check from beginning
      const firstIncompleteIndex = this.players.findIndex(player => 
        !this.isPlayerComplete(player.id)
      );
      
      if (firstIncompleteIndex !== -1 && firstIncompleteIndex !== this.currentPlayerIndex) {
        this.currentPlayerIndex = firstIncompleteIndex;
        this.currentPlayer = this.players[this.currentPlayerIndex];
        this.updateCurrentPlayerConfessions();
      }
    }
  }

  private clearForm() {
    this.confessionText = '';
    this.selectedCategory = ConfessionCategory.FUNNY;
    this.updateSuggestions();
  }

  private showError(message: string) {
    this.errorMessage = message;
    this.showErrorToast = true;
  }

  // Adiciona método auxiliar para extrair o value do select
  getSelectValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }
}
