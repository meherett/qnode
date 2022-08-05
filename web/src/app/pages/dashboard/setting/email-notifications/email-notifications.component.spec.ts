import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailNotificationsComponent } from './email-notifications.component';

describe('EmailNotificationsComponent', () => {
  let component: EmailNotificationsComponent;
  let fixture: ComponentFixture<EmailNotificationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EmailNotificationsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EmailNotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
