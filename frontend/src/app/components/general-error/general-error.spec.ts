import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralError } from './general-error';

describe('GeneralError', () => {
  let component: GeneralError;
  let fixture: ComponentFixture<GeneralError>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneralError]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneralError);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
