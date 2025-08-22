import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

export interface CategoryOption {
  value: string;
  emoji: string;
  label: string;
}

@Component({
  selector: 'app-category-selector',
  templateUrl: './category-selector.component.html',
  styleUrls: ['./category-selector.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class CategorySelectorComponent implements OnInit {
  @Input() selectedValue: string = '';
  @Input() placeholder: string = 'Selecione uma categoria';
  @Input() options: CategoryOption[] = [];
  @Output() selectionChange = new EventEmitter<string>();

  isModalOpen = false;

  constructor() {}

  ngOnInit() {}

  get selectedOption(): CategoryOption | undefined {
    return this.options.find(option => option.value === this.selectedValue);
  }

  get displayText(): string {
    if (this.selectedOption) {
      return `${this.selectedOption.emoji} ${this.selectedOption.label}`;
    }
    return this.placeholder;
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  selectOption(option: CategoryOption) {
    this.selectedValue = option.value;
    this.selectionChange.emit(option.value);
    this.closeModal();
  }

  getCategoryEmoji(category: string): string {
    const option = this.options.find(opt => opt.value === category);
    return option ? option.emoji : '📝';
  }
}
