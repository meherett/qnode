import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllowedUserAgentComponent } from './allowed-user-agent.component';

describe('AllowedUserAgentComponent', () => {
  let component: AllowedUserAgentComponent;
  let fixture: ComponentFixture<AllowedUserAgentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AllowedUserAgentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllowedUserAgentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
