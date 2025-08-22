import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { GameService } from '../../services/game';
import { Player, GameSession } from '../../models/game.model';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.page.html',
  styleUrls: ['./setup.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class SetupPage implements OnInit, OnDestroy {
  players: Player[] = [];
  newPlayerName = '';
  showErrorToast = false;
  errorMessage = '';
  
  private gameSubscription: Subscription | null = null;

  constructor(
    private gameService: GameService,
    private router: Router
  ) {}

  goBack() {
    this.router.navigate(['/home']);
  }

  ngOnInit() {
    this.gameSubscription = this.gameService.gameSession$.subscribe((session: GameSession | null) => {
      if (session) {
        this.players = [...session.players];
      } else {
        // Se não há sessão, criar uma nova
        this.gameService.createNewGame();
      }
    });
  }

  ngOnDestroy() {
    if (this.gameSubscription) {
      this.gameSubscription.unsubscribe();
    }
  }

  isValidPlayerName(): boolean {
    return this.newPlayerName.trim().length >= 2 && this.newPlayerName.trim().length <= 20;
  }

  addPlayer() {
    if (!this.isValidPlayerName()) {
      this.showError('Nome deve ter entre 2 e 20 caracteres');
      return;
    }

    try {
      const player = this.gameService.addPlayer(this.newPlayerName.trim());
      this.newPlayerName = '';
    } catch (error: any) {
      this.showError(error.message);
    }
  }

  removePlayer(playerId: string) {
    try {
      this.gameService.removePlayer(playerId);
    } catch (error: any) {
      this.showError(error.message);
    }
  }

  proceedToConfessions() {
    if (this.players.length < 4) {
      this.showError('Mínimo de 4 jogadores necessário');
      return;
    }

    try {
      this.gameService.startConfessions();
      this.router.navigate(['/confessions']);
    } catch (error: any) {
      this.showError(error.message);
    }
  }

  trackByPlayerId(index: number, player: Player): string {
    return player.id;
  }

  private showError(message: string) {
    this.errorMessage = message;
    this.showErrorToast = true;
  }
}
