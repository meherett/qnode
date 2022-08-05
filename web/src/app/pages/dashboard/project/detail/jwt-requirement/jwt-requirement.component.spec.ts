import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JwtRequirementComponent } from './jwt-requirement.component';

describe('JwtRequirementComponent', () => {
  let component: JwtRequirementComponent;
  let fixture: ComponentFixture<JwtRequirementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JwtRequirementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JwtRequirementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
