import { Injectable, ElementRef, NgZone, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { gsap } from 'gsap';

@Injectable({
  providedIn: 'root'
})
export class ThreeDKeyboardNewService implements OnDestroy {
  private camera!: THREE.PerspectiveCamera;
  private scene!: THREE.Scene;
  private renderer!: THREE.WebGLRenderer;
  private keys: THREE.Mesh[] = [];
  private keyboardGroup!: THREE.Group;
  private mouse = new THREE.Vector2(-10, -10);
  private raycaster = new THREE.Raycaster();
  private waveCenter = new THREE.Vector3(999, 999, 999);
  private animationFrameId?: number;

  constructor(private ngZone: NgZone) {}

  // Definição das tecnologias com ícones SVG reais
  private getTechStack() {
    return [
      {
        name: 'Angular',
        color: '#dd0031',
        svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2.5L3.5 5.5v5.5c0 4.5 3 8.5 8.5 9.5 5.5-1 8.5-5 8.5-9.5V5.5L12 2.5z" fill="#dd0031"/>
          <path d="M12 7l-3 7h1.5l.5-1.5h3l.5 1.5H16L12 7zm-1 4.5L12 9l1 2.5h-2z" fill="white"/>
        </svg>`
      },
      {
        name: 'TypeScript',
        color: '#3178c6',
        svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="22" height="22" rx="2" fill="#3178c6"/>
          <path d="M7.5 8.5h4v1.5h-1.5v6h-1.5v-6H7.5v-1.5z" fill="white"/>
          <path d="M14 10.5h1.5v1c0 .5.2 1 .8 1.2.3.1.7.1 1 0 .6-.2.7-.7.7-1.2v-.2c0-.4-.2-.7-.5-.9l-1.5-.8c-.6-.3-1-1-1-1.7 0-1 .8-1.8 1.8-1.8.5 0 1 .2 1.3.5.3.3.5.7.5 1.2h-1.5c0-.3-.1-.5-.3-.6-.2-.1-.4-.1-.6 0-.2.1-.3.3-.3.5 0 .2.1.4.3.5l1.5.8c.6.3 1 1 1 1.7v.2c0 1-.8 1.8-1.8 1.8-.5 0-1-.2-1.3-.5-.3-.3-.5-.7-.5-1.2v-1z" fill="white"/>
        </svg>`
      },
      {
        name: 'JavaScript',
        color: '#f7df1e',
        svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="22" height="22" rx="2" fill="#f7df1e"/>
          <path d="M8 8v4c0 1-.5 1.5-1.5 1.5S5 13 5 12h1.5c0 .3.2.5.5.5s.5-.2.5-.5V8H8z" fill="black"/>
          <path d="M10.5 12h1.5c0 .8.3 1.3 1 1.3.5 0 .8-.3.8-.7 0-.4-.2-.6-.8-.9l-.5-.2c-.9-.4-1.5-1-1.5-2.1 0-1.1.8-1.9 2.1-1.9 1 0 1.8.5 2 1.5h-1.5c-.1-.5-.4-.7-.8-.7-.3 0-.6.2-.6.5 0 .3.2.5.7.7l.5.2c1.1.5 1.6 1.1 1.6 2.2 0 1.3-1 2-2.3 2-1.3 0-2.2-.7-2.2-2z" fill="black"/>
        </svg>`
      },
      {
        name: 'HTML5',
        color: '#e34f26',
        svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3.5 2l1.7 19 7.8 2.2 7.8-2.2L22.5 2H3.5zM18.5 7.5H9l.3 3h8.9l-.9 10-6.3 1.8-6.3-1.8-.4-4.5h3l.2 2.3 3.4.9 3.4-.9.4-4.3H8.5l-.8-9h11.8l-.2 3z" fill="#e34f26"/>
        </svg>`
      },
      {
        name: 'CSS3',
        color: '#1572b6',
        svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3.5 2l1.7 19 7.8 2.2 7.8-2.2L22.5 2H3.5zM18.5 7.5H9l.3 3h8.9l-.9 10-6.3 1.8-6.3-1.8-.4-4.5h3l.2 2.3 3.4.9 3.4-.9.4-4.3H8.5l-.8-9h11.8l-.2 3z" fill="#1572b6"/>
        </svg>`
      },
      {
        name: 'GSAP',
        color: '#88ce02',
        svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#88ce02"/>
          <path d="M7 7l10 10M17 7L7 17" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="12" cy="12" r="2" fill="white"/>
        </svg>`
      },
      {
        name: 'Three.js',
        color: '#000000',
        svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="22" height="22" rx="2" fill="#000000"/>
          <path d="M6 8h4l-2 8h-2l2-8zM10 8h4v2h-2v6h-2V8zM14 8h4v2h-2v2h2v2h-2v2h2v2h-4V8z" fill="white"/>
          <circle cx="18" cy="6" r="1.5" fill="#00ff88"/>
        </svg>`
      },
      {
        name: 'Git',
        color: '#f05032',
        svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M23.15 12.15l-10.94-10.94c-.47-.47-1.24-.47-1.71 0L8.55 3.15c-.47.47-.47 1.24 0 1.71l1.06 1.06L12 8.31c.5-.18 1.07-.05 1.46.34.4.4.52.98.3 1.48l2.38 2.38c.5-.22 1.08-.1 1.48.3.78.78.78 2.05 0 2.83-.78.78-2.05.78-2.83 0-.42-.42-.52-1.03-.31-1.54l-2.22-2.22v5.85c.19.09.37.22.52.37.78.78.78 2.05 0 2.83-.78.78-2.05.78-2.83 0-.78-.78-.78-2.05 0-2.83.19-.19.41-.33.64-.41V11.1c-.23-.08-.45-.22-.64-.41-.42-.42-.52-1.04-.3-1.55L7.1 6.6.85 12.85c-.47.47-.47 1.24 0 1.71l10.94 10.94c.47.47 1.24.47 1.71 0l10.94-10.94c.47-.47.47-1.24 0-1.71z" fill="#f05032"/>
        </svg>`
      },
      {
        name: 'Figma',
        color: '#f24e1e',
        svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 12a4 4 0 1 1 8 0 4 4 0 0 1-8 0z" fill="#1abcfe"/>
          <path d="M8 4a4 4 0 0 1 4-4h4a4 4 0 1 1 0 8h-4a4 4 0 0 1-4-4z" fill="#0acf83"/>
          <path d="M8 20a4 4 0 0 1 4-4h4a4 4 0 1 1 0 8h-4a4 4 0 0 1-4-4z" fill="#ff7262"/>
          <path d="M8 12a4 4 0 0 1 4-4h4a4 4 0 1 1 0 8h-4a4 4 0 0 1-4-4z" fill="#f24e1e"/>
          <path d="M4 20a4 4 0 0 1 4-4v4a4 4 0 0 1-4 4 4 4 0 0 1 0-8z" fill="#a259ff"/>
        </svg>`
      }
    ];
  }

  // Criar material com ícones SVG reais
  private async createSVGMaterial(techData: any): Promise<THREE.MeshStandardMaterial> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = 256;
      canvas.height = 256;

      // Fundo com gradiente baseado na cor da tecnologia
      const gradient = ctx.createLinearGradient(0, 0, 256, 256);
      gradient.addColorStop(0, techData.color);
      gradient.addColorStop(0.5, this.lightenColor(techData.color, 0.1));
      gradient.addColorStop(1, this.darkenColor(techData.color, 0.2));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);

      // Borda moderna com glow
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
      ctx.shadowBlur = 8;
      ctx.strokeRect(8, 8, 240, 240);
      ctx.shadowBlur = 0;

      // Renderizar ícone SVG
      const img = new Image();
      const svgBlob = new Blob([techData.svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        // Desenhar ícone centralizado
        const iconSize = 120;
        const x = (256 - iconSize) / 2;
        const y = (256 - iconSize) / 2 - 20;

        ctx.drawImage(img, x, y, iconSize, iconSize);

        // Nome da tecnologia
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(techData.name, 128, 220);

        // Criar textura
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const material = new THREE.MeshStandardMaterial({
          map: texture,
          metalness: 0.3,
          roughness: 0.7,
          emissive: new THREE.Color(techData.color).multiplyScalar(0.08),
          emissiveIntensity: 0.4
        });

        URL.revokeObjectURL(url);
        resolve(material);
      };

      img.onerror = () => {
        // Fallback para ícone de texto se SVG falhar
        this.createFallbackTexture(ctx, techData);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const material = new THREE.MeshStandardMaterial({
          map: texture,
          metalness: 0.3,
          roughness: 0.7,
          emissive: new THREE.Color(techData.color).multiplyScalar(0.08)
        });

        resolve(material);
      };

      img.src = url;
    });
  }

  // Método fallback para criar textura com texto
  private createFallbackTexture(ctx: CanvasRenderingContext2D, techData: any): void {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 6;
    ctx.fillText(this.getTechIcon(techData.name), 128, 140);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px Arial';
    ctx.shadowBlur = 4;
    ctx.fillText(techData.name, 128, 200);
  }

  // Função auxiliar para clarear cor
  private lightenColor(color: string, amount: number): string {
    const col = new THREE.Color(color);
    col.r = Math.min(1, col.r + amount);
    col.g = Math.min(1, col.g + amount);
    col.b = Math.min(1, col.b + amount);
    return `#${col.getHexString()}`;
  }

  // Função auxiliar para escurecer cor
  private darkenColor(color: string, amount: number): string {
    const col = new THREE.Color(color);
    col.r *= (1 - amount);
    col.g *= (1 - amount);
    col.b *= (1 - amount);
    return `#${col.getHexString()}`;
  }

  // Função auxiliar para ícones simples
  private getTechIcon(techName: string): string {
    const icons: { [key: string]: string } = {
      'Angular': 'A',
      'TypeScript': 'TS',
      'JavaScript': 'JS',
      'HTML5': 'H',
      'CSS3': 'C',
      'GSAP': 'G',
      'Three.js': '3D',
      'Git': 'G',
      'Figma': 'F'
    };
    return icons[techName] || techName.charAt(0);
  }

  // Criar cena 3D principal
  public async createScene(canvas: ElementRef<HTMLCanvasElement>, onBuild?: () => void): Promise<void> {

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0a192f, 20, 100);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    this.camera.position.set(0, 3, 18);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas.nativeElement,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;

    // Iluminação otimizada para cubos 3D
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(0, 15, 30);
    mainLight.castShadow = true;
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x64ffda, 0.3);
    fillLight.position.set(-15, 5, 10);
    this.scene.add(fillLight);

    const topLight = new THREE.DirectionalLight(0xffffff, 0.4);
    topLight.position.set(0, 30, 0);
    this.scene.add(topLight);

    this.keyboardGroup = new THREE.Group();

    await this.createKeyboardLayout();

    this.keyboardGroup.rotation.x = -Math.PI / 8;
    this.keyboardGroup.position.set(0, -2, 5);
    this.scene.add(this.keyboardGroup);

    this.animate();

    if (onBuild) {
      setTimeout(() => {
        onBuild();
      }, 500);
    }
  }

  // Criar teclado com layout 3x3 e ícones SVG
  private async createKeyboardLayout(): Promise<void> {

    const keySize = 3.2;
    const keyDepth = 1.2;
    const spacing = 0.8;
    const numCols = 3;
    const numRows = 3;
    const techStack = this.getTechStack();

    let keyIndex = 0;
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        if (keyIndex >= techStack.length) break;

        const geometry = new THREE.BoxGeometry(keySize, keySize, keyDepth);
        const material = await this.createSVGMaterial(techStack[keyIndex]);

        const key = new THREE.Mesh(geometry, material);

        key.position.x = (col - (numCols - 1) / 2) * (keySize + spacing);
        key.position.y = -((row - (numRows - 1) / 2) * (keySize + spacing));
        key.position.z = keyDepth / 2;

        key.userData = {
          techName: techStack[keyIndex].name,
          techColor: techStack[keyIndex].color,
          index: keyIndex
        };


        this.keys.push(key);
        this.keyboardGroup.add(key);
        keyIndex++;
      }
    }

  }

  private animate(): void {
    this.ngZone.runOutsideAngular(() => {
      const loop = () => {
        this.keyboardGroup.rotation.z += 0.003;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.keys);

        if (intersects.length > 0) {
          this.waveCenter.copy(intersects[0].object.position);
        } else {
          this.waveCenter.set(999, 999, 999);
        }

        this.keys.forEach((key: THREE.Mesh) => {
          const distance = key.position.distanceTo(this.waveCenter);
          const waveIntensity = Math.max(0, 1 - distance / 8);

          if (distance < 8) {
            const time = Date.now() * 0.005;
            const wave = Math.sin(time - distance) * waveIntensity;
            key.position.z = (key.userData['index'] % 3 === 1 ? 0.6 : 0.3) + wave * 0.5;

            const material = key.material as THREE.MeshStandardMaterial;
            material.emissiveIntensity = 0.1 + waveIntensity * 0.3;
            material.metalness = 0.2 + waveIntensity * 0.3;
          } else {
            key.position.z = key.userData['index'] % 3 === 1 ? 0.6 : 0.3;
            const material = key.material as THREE.MeshStandardMaterial;
            material.emissiveIntensity = 0.1;
            material.metalness = 0.2;
          }
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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  public updateMousePosition(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }
}
