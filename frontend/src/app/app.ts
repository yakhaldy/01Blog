import { Component, signal, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from './components/toast/toast';
import { ToastService } from './service/toast-service';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet ,Toast],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  @ViewChild(Toast) toast!: Toast;

  constructor(private toastSrevice: ToastService,private router: Router ){}

  ngAfterViewInit(){
    this.toastSrevice.register(this.toast)
  }
   ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        window.scrollTo(0, 0);
      }
    });
  }
  protected readonly title = signal('01Blog');
}
