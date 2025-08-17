import { Component, AfterViewInit, ElementRef } from '@angular/core';
import { gsap } from 'gsap';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.html',
  standalone: true,
  styleUrls: ['./logo.css']
})
export class Logo implements AfterViewInit {

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    const root = this.el.nativeElement as HTMLElement;

    const email = document.querySelector('#email') as HTMLInputElement;
    const password = document.querySelector('#password') as HTMLInputElement;

    // عناصر من SVG
    const armL = root.querySelector('.armL');
    const armR = root.querySelector('.armR');
    const eyeL = root.querySelector('.eyeL');
    const eyeR = root.querySelector('.eyeR');
    const nose = root.querySelector('.nose');
    const mouth = root.querySelector('.mouth');
    const mouthBG = root.querySelector('.mouthBG');
    const mouthSmallBG = root.querySelector('.mouthSmallBG');
    const mouthMediumBG = root.querySelector('.mouthMediumBG');
    const mouthLargeBG = root.querySelector('.mouthLargeBG');
    const mouthMaskPath = root.querySelector('#mouthMaskPath');
    const mouthOutline = root.querySelector('.mouthOutline');
    const tooth = root.querySelector('.tooth');
    const tongue = root.querySelector('.tongue');
    const chin = root.querySelector('.chin');
    const face = root.querySelector('.face');
    const eyebrow = root.querySelector('.eyebrow');
    const outerEarL = root.querySelector('.earL .outerEar');
    const outerEarR = root.querySelector('.earR .outerEar');
    const earHairL = root.querySelector('.earL .earHair');
    const earHairR = root.querySelector('.earR .earHair');
    const hair = root.querySelector('.hair');

    // مبدئياً نحط الذراعين تحت
    gsap.set(armL, {x: -93, y: 220, rotation: 105, transformOrigin: "top left"});
    gsap.set(armR, {x: -93, y: 220, rotation: -105, transformOrigin: "top right"});

    // عند focus على password -> غلق العيون
    password?.addEventListener('focus', () => {
      gsap.to(armL, { duration: .45, x: -93, y: 2, rotation: 0 });
      gsap.to(armR, { duration: .45, x: -93, y: 2, rotation: 0, delay: .1 });
    });

    // عند blur -> فتح العيون
    password?.addEventListener('blur', () => {
      gsap.to(armL, { duration: 1.35, y: 220, rotation: 105 });
      gsap.to(armR, { duration: 1.35, y: 220, rotation: -105, delay: .1 });
    });

    // تقدر بعدها تضيف نفس وظائف onEmailInput من main.js
    // (تتبع حركة العيون + تكبير/تصغير الفم حسب نص الإيميل)
    // email?.addEventListener('input', (e) => {
    //   const val = (e.target as HTMLInputElement).value;
    //   if (val.includes('@')) {
    //     gsap.to([mouthBG, mouthOutline, mouthMaskPath], { duration: 1, morphSVG: mouthLargeBG });
    //   } else if (val.length > 0) {
    //     gsap.to([mouthBG, mouthOutline, mouthMaskPath], { duration: 1, morphSVG: mouthMediumBG });
    //   } else {
    //     gsap.to([mouthBG, mouthOutline, mouthMaskPath], { duration: 1, morphSVG: mouthSmallBG });
    //   }
    // });
  }
}