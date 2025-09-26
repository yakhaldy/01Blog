import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingalPost } from './singal-post';

describe('SingalPost', () => {
  let component: SingalPost;
  let fixture: ComponentFixture<SingalPost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SingalPost]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SingalPost);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
