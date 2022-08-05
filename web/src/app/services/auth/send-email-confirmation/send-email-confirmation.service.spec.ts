import { TestBed } from '@angular/core/testing';

import { SendEmailConfirmationService } from './send-email-confirmation.service';

describe('SendEmailConfirmationService', () => {
  let service: SendEmailConfirmationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SendEmailConfirmationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
