import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BasicRequirementComponent } from './basic-requirement.component';

describe('BasicRequirementComponent', () => {
  let component: BasicRequirementComponent;
  let fixture: ComponentFixture<BasicRequirementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BasicRequirementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BasicRequirementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
