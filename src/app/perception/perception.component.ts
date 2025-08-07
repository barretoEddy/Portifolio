import { Component, ChangeDetectionStrategy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-perception',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="perception-section">
 <div class="perception-container">
 <div class="road-silhouette"></div>
 <div class="scene-elements">
        <!-- Placeholder elements for cars, pedestrians, signs with bounding boxes and labels -->
 <div class="element-container">
 <div class="car"></div>
 <div class="bounding-box">VEÍCULO: 98%</div>
 </div>
 <div class="element-container"><div class="pedestrian"></div><div class="bounding-box">PEDESTRE: 92%</div></div>
 <div class="element-container"><div class="sign"></div><div class="bounding-box">SINAL: 99%</div></div>
 </div>
 <div class="explanation-text">
 <p>A Inteligência Artificial analisa dados de sensores para entender o ambiente.</p>
 </div>
      </div>
    </section>
  `,
  styles: `
    /* Add component-specific styles here */
    :host {
      display: block;
      min-height: 100vh; /* Placeholder height */
 background-color: #f0f0f0; /* Placeholder background */
      position: relative;
 overflow: hidden;
    }
    .perception-container {
      position: relative;
      width: 100%;
      height: 100vh;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerceptionComponent implements AfterViewInit {

  @ViewChild( 'perceptionSection', { static: true } ) section!: ElementRef;
  ngAfterViewInit(): void {
    const section = this.section.nativeElement;
    const road = section.querySelector('.road-silhouette');
    const sceneElements = section.querySelectorAll('.scene-elements > div'); // Select placeholder elements
    const boundingBoxes = section.querySelectorAll('.bounding-box'); // Select placeholder bounding boxes

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top', // Start when the top of the section hits the top of the viewport
        end: '+=1000', // End after scrolling 1000px down from the start
        scrub: true, // Link animation progress to scroll position
        pin: true, // Pin the section while scrolling
        markers: true, // Optional: shows markers for debugging
      },
    });

    // Initial state (dark background)
    tl.to(section, {
      backgroundColor: '#000',
      duration: 0.2,
    });

    // Animate in the road silhouette
    tl.from(road, {
      opacity: 0,
      y: '100%',
      duration: 0.3,
    });

    // Animate in the scene elements and bounding boxes progressively
    tl.from(sceneElements, {
      opacity: 0,
      stagger: 0.1, // Animate elements with a slight delay
      duration: 0.2,
    }, '-=0.1'); // Start slightly before the previous animation ends

    tl.from(boundingBoxes, {
      opacity: 0,
      stagger: 0.1,
      duration: 0.2,
    }, '-=0.1');
  }
}