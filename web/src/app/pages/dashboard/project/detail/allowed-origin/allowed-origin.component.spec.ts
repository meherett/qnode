import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllowedOriginComponent } from './allowed-origin.component';

describe('AllowedOriginComponent', () => {
  let component: AllowedOriginComponent;
  let fixture: ComponentFixture<AllowedOriginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AllowedOriginComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllowedOriginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
