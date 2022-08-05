import { TestBed } from '@angular/core/testing';

import { EmailIsRegisteredService } from './email-is-registered.service';

describe('EmailIsRegisteredService', () => {
  let service: EmailIsRegisteredService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmailIsRegisteredService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
