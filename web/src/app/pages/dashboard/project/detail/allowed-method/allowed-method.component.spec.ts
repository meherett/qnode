import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllowedMethodComponent } from './allowed-method.component';

describe('AllowedMethodComponent', () => {
  let component: AllowedMethodComponent;
  let fixture: ComponentFixture<AllowedMethodComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AllowedMethodComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllowedMethodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
