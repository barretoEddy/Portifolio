import { Directive, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { ScrollAnimationService } from '../services/scroll-animation.service';

@Directive({
  selector: '[appRevealOnScroll]',
  standalone: true,
})
export class RevealOnScrollDirective implements OnInit, OnDestroy {
  constructor(
    private element: ElementRef,
    private scrollAnimationService: ScrollAnimationService
  ) {}

  ngOnInit(): void {
    this.element.nativeElement.classList.add('reveal');
    this.scrollAnimationService.observe(this.element);
  }

  ngOnDestroy(): void {
    this.scrollAnimationService.unobserve(this.element);
  }
}
