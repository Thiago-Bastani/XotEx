import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { GameService } from '../services/game';
import { GameSession, GameStatus } from '../models/game.model';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class Tab1Page implements OnInit, OnDestroy {
  currentGame: GameSession | null = null;
  hasExistingGame = false;
  private gameSubscription: Subscription | null = null;

  constructor(
    private gameService: GameService,
    private router: Router,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.gameSubscription = this.gameService.gameSession$.subscribe((session: GameSession | null) => {
      this.currentGame = session;
      this.hasExistingGame = session !== null;
    });
  }

  ngOnDestroy() {
    if (this.gameSubscription) {
      this.gameSubscription.unsubscribe();
    }
  }

  startNewGame() {
    if (this.hasExistingGame) {
      this.confirmNewGame();
    } else {
      this.createNewGame();
    }
  }

  private async confirmNewGame() {
    const alert = await this.alertController.create({
      header: 'Novo Jogo',
      message: 'Já existe um jogo em andamento. Deseja iniciar um novo jogo? Os dados atuais serão perdidos.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Novo Jogo',
          handler: () => {
            this.createNewGame();
          }
        }
      ]
    });

    await alert.present();
  }

  private createNewGame() {
    const gameId = this.gameService.createNewGame();
    this.router.navigate(['/setup']);
  }

  continueGame() {
    if (!this.currentGame) return;

    switch (this.currentGame.status) {
      case GameStatus.SETUP:
        this.router.navigate(['/setup']);
        break;
      case GameStatus.CONFESSIONS:
        this.router.navigate(['/confessions']);
        break;
      case GameStatus.PLAYING:
        this.router.navigate(['/game']);
        break;
      case GameStatus.FINISHED:
        this.router.navigate(['/game']);
        break;
    }
  }

  async showRules() {
    const alert = await this.alertController.create({
      header: 'Regras do XotEx',
      message: `
        <strong>Objetivo:</strong> Adivinhar quem escreveu cada confissão!
        
        <br><br><strong>Como jogar:</strong>
        <br>1. Adicione de 3 a 8 jogadores
        <br>2. Cada jogador escreve 3-5 confissões anônimas
        <br>3. Uma confissão aleatória é revelada
        <br>4. Todos votam em quem acham que escreveu
        <br>5. O autor é revelado
        
        <br><br><strong>Consequências:</strong>
        <br>• Quem errou: bebe! 🍺
        <br>• Quem acertou: distribui doses! 😈
        
        <br><br><strong>Heat Level:</strong>
        <br>A cada 3 rodadas, o nível de "calor" aumenta e confissões mais picantes aparecem!
        
        <br><br><strong>Categorias:</strong>
        <br>🤣 Engraçado • 🧸 Infantil • 😳 Vergonhoso • 💕 Romântico • 🌶️ Picante
      `,
      buttons: ['Entendi!']
    });

    await alert.present();
  }

  async confirmClearGame() {
    const alert = await this.alertController.create({
      header: 'Limpar Dados',
      message: 'Tem certeza que deseja limpar todos os dados do jogo? Esta ação não pode ser desfeita.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Limpar',
          role: 'destructive',
          handler: () => {
            this.gameService.clearGameData();
          }
        }
      ]
    });

    await alert.present();
  }
}
