import { Injectable, ElementRef, NgZone, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { gsap } from 'gsap';
// 1. Re-importamos a nossa geometria de cantos arredondados
import { RoundedBoxGeometry } from './three-addons/RoundedBoxGeometry';

@Injectable({
  providedIn: 'root'
})

export class ThreeDKeyboardService implements OnDestroy {
  private camera!: THREE.PerspectiveCamera;
  private scene!: THREE.Scene;
  private renderer!: THREE.WebGLRenderer;
  private keys: THREE.Mesh[] = [];
  private keyboardGroup!: THREE.Group; // Novo grupo para as teclas
  private mouse = new THREE.Vector2(-10, -10);
  private raycaster = new THREE.Raycaster();
  private waveCenter = new THREE.Vector3(999, 999, 999); // Inicia o centro da onda longe

  private animationFrameId?: number;
  private baseColor = new THREE.Color(0x8892b0);
  private hoverColor = new THREE.Color(0x64ffda);

  // Geometria e Material partilhados para performance
  private keyGeometry!: THREE.BufferGeometry;
  private keyMaterial!: THREE.MeshStandardMaterial;


  constructor(private ngZone: NgZone) {}

  public createScene(canvas: ElementRef<HTMLCanvasElement>, onBuild?: () => void): void {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a192f, 0.01); // Adicionamos uma leve neblina para um efeito mais atmosférico

    // 2. CORREÇÃO DO CLIPPING: Ajustamos a câmara
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    this.camera.position.set(0, 0, 20); // Reduzindo de 25 para 20 para aproximar o teclado menor

    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas.nativeElement,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limita o pixel ratio para evitar desfoque
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Luz ambiente mais suave
    this.scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x64ffda, 300, 200);
    pointLight.position.set(0, 10, 25);
    this.scene.add(pointLight);

    // Geramos a geometria e o material uma única vez
    this.keyGeometry = this.createKeyGeometry();
    this.keyMaterial = new THREE.MeshStandardMaterial({
      color: this.baseColor,
      metalness: 0.8,
      roughness: 0.4
    });

    // Cria o grupo de teclas e aplica rotação de 45°
    this.keyboardGroup = new THREE.Group();
    this.createKeyboardLayout();
    this.keyboardGroup.rotation.x = -Math.PI / 6; // Reduz a inclinação para 30°
    this.keyboardGroup.position.set(0, 0, 0); // Centraliza o teclado
    this.scene.add(this.keyboardGroup);

    this.animate();
    if (onBuild) {
      setTimeout(() => onBuild(), 300); // Pequeno delay para garantir renderização
    }
  }

  // Anima montagem das teclas uma a uma
  public animateKeyboardBuild(): void {
    this.keys.forEach((key, i) => {
      key.scale.set(0, 0, 0);
      key.visible = true;
    });
    gsap.to(this.keys.map(k => k.scale), {
      x: 0.8,
      y: 0.8,
      z: 0.8,
      stagger: 0.1, // Aumenta o stagger para 9 teclas
      duration: 0.6,
      ease: 'back.out(1.7)',
      onStart: () => {
        this.keys.forEach(k => k.visible = true);
      }
    });
  }
  private createKeyGeometry(): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    const size = 3.5; // Reduzindo de 4.7 para 3.5 para diminuir o tamanho geral
    const radius = 0.2; // Reduzindo o raio também
    shape.moveTo(-size / 2 + radius, -size / 2);
    shape.lineTo(size / 2 - radius, -size / 2);
    shape.quadraticCurveTo(size / 2, -size / 2, size / 2, -size / 2 + radius);
    shape.lineTo(size / 2, size / 2 - radius);
    shape.quadraticCurveTo(size / 2, size / 2, size / 2 - radius, size / 2);
    shape.lineTo(-size / 2 + radius, size / 2);
    shape.quadraticCurveTo(-size / 2, size / 2, -size / 2, size / 2 - radius);
    shape.lineTo(-size / 2, -size / 2 + radius);
    shape.quadraticCurveTo(-size / 2, -size / 2, -size / 2 + radius, -size / 2);

    const extrudeSettings = {
      steps: 1,
      depth: 3,
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.1,
      bevelOffset: 0,
      bevelSegments: 8
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }
  // 3. APARÊNCIA: RoundedBoxGeometry
  private createKeyboardLayout(): void {
    const keySize = 3.8; // Reduzindo de 5 para 3.8
    const spacing = 0.6; // Reduzindo espaçamento de 0.8 para 0.6
    const numCols = 3; // 3 colunas
    const numRows = 3; // 3 linhas

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const key = new THREE.Mesh(this.keyGeometry, this.keyMaterial); // Usa a geometria e material partilhados
        key.position.x = (col - numCols / 2) * (keySize + spacing);
        key.position.y = (row - numRows / 2) * (keySize + spacing);
        key.position.z = 0; // Coloca as teclas no plano central
        key.rotation.z = Math.PI / 2; // Rotacionamos para a orientação correta
        key.scale.set(0.8, 0.8, 0.8); // Reduzindo escala de 1.0 para 0.8
        this.keys.push(key);
        this.keyboardGroup.add(key); // Adiciona ao grupo, não à cena
      }
    }
  }
  // 4. ANIMAÇÃO: Lógica de onda mais subtil e eficiente
  private animate(): void {
    this.ngZone.runOutsideAngular(() => {
      const loop = () => {
        // Faz o teclado girar continuamente em torno do eixo Y
        this.keyboardGroup.rotation.z += 0.003;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.keys);

        if (intersects.length > 0) {
          this.waveCenter.copy(intersects[0].object.position); // Usamos a posição da tecla, não o ponto exato, para um efeito mais estável
        } else {
          this.waveCenter.set(999, 999, 999);
        }

        const maxDistance = 9; // Raio da onda mais pequeno
        const peakHeight = 3;   // Altura máxima da tecla no centro mais baixa
        const baseHeight = -1;  // As outras teclas descem um pouco

        this.keys.forEach(key => {
          const distance = key.position.distanceTo(this.waveCenter);
          const influence = Math.max(0, 1 - (distance / maxDistance));

          // A tecla sob o rato sobe (peakHeight), as outras descem (baseHeight).
          const targetZ = baseHeight + (peakHeight - baseHeight) * influence;

          // Usamos o GSAP para uma interpolação suave
          gsap.to(key.position, {
            z: targetZ,
            duration: 1.4,
            ease: 'power2.out',
          });

          const targetColor = new THREE.Color().lerpColors(this.baseColor, this.hoverColor, influence);
          gsap.to((key.material as THREE.MeshStandardMaterial).color, {
            r: targetColor.r,
            g: targetColor.g,
            b: targetColor.b,
            duration: 1.5,
            ease: 'power4.inOut',
          });
        });

        this.renderer.render(this.scene, this.camera);
        this.animationFrameId = requestAnimationFrame(loop);
      };
      loop();
    });
  }

  public ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  public resize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Mantém o pixel ratio limitado
  }

  public updateMousePosition(event: MouseEvent): void {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }
}
