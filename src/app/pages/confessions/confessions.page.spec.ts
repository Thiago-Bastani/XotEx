import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfessionsPage } from './confessions.page';

describe('ConfessionsPage', () => {
  let component: ConfessionsPage;
  let fixture: ComponentFixture<ConfessionsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfessionsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
