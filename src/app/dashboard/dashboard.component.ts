import { Component, AfterViewInit, ElementRef, ViewChild, Input } from '@angular/core';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BridgeService } from '../services/rosbridge.service';
import * as THREE from 'three/build/three';
//import * as data from '../../assets/Points.json';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})

export class DashboardComponent implements AfterViewInit {

  @ViewChild('canvas', { read: ElementRef, static: false }) elementView: ElementRef;

  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private points: THREE.Points;
  private controls: OrbitControls;

  public isConnected: boolean = false;
  public listeningForMessages: boolean = false;
  public isCanvasDisplayed: boolean = true;
  public isImageDisplayed: boolean = false;

  private msg_listener: any;
  public frame: any;
  public imageUrl: string;

  public dashboardWidth: number;
  public dashboardHeight: number;

  constructor(
    public __BridgeService: BridgeService,
    private elementRef: ElementRef
  ) { }

  ngAfterViewInit() {
    // retrieve the width and height of the canvas div dynamically  
    this.dashboardWidth = this.elementRef.nativeElement.offsetWidth;
    this.dashboardHeight = this.elementRef.nativeElement.offsetHeight;

    this.__BridgeService.getConnnectionStatus().subscribe(status => {
      this.isConnected = status
    });
    /*data.points.forEach(element => {
      this.test.push(new THREE.Vector3(element.x, element.y, element.z));
    });*/
  }

  public startListening(): void {
    this.msg_listener = this.__BridgeService.subscribeToTopic('/output', 'world_mapper/Frame')
    // listen for basic messages
    this.listeningForMessages = true;
    this.msg_listener.subscribe((frame: any) => {
      // output entire frame to console
      console.log(frame);
      // update the current frame
      this.frame = frame;
      // update the image url per frame
      this.imageUrl = 'data:image/jpeg;base64,' + frame.img;
      this.generatePoint(frame);
    });
    this.create3DCanvas();
  }

  public stopListening(): void {
    this.msg_listener.unsubstribe();
    this.listeningForMessages = false;
    this.isCanvasDisplayed = false;
  }

  private generatePoint(frame): void {
    var baseVectors = [];

    if (frame.angle_increment >= 0.1) {
      frame.angle_increment = (frame.angle_max - frame.angle_min) / (frame.ranges.length - 1);
    }
    if (frame.angle_increment == 0) {
      console.log("Cannot have an angle increment of 0, because then we'll get nowhere!\nThere are " + frame.ranges.length + " readings.");
    }

    var reps = 500;
    for (var angle = frame.angle_min; angle < frame.angle_max; angle += frame.angle_increment) {
      baseVectors.push(new THREE.Vector3(Math.cos(angle * (Math.PI / 180)), 0, Math.sin(angle * (Math.PI / 180))));
      reps--;
      if (reps < 0) {
        console.log("There's too many vectors to add!");
        console.log("frame.ranges.Length = " + frame.ranges.length + "frame.angle_increment = " + frame.angle_increment + "\nframe.angle_min = " + frame.angle_min + "\nframe.angle_max = " + frame.angle_max);
        break;
      }
    }

    var results = [];
    for (let i = 0; i < baseVectors.length; i++) {
      var baseVector = baseVectors[i];

      var alpha = frame.rotX * (Math.PI / 180);
      var beta = frame.rotY * (Math.PI / 180);
      var gamma = frame.rotZ * (Math.PI / 180);

      var cosa = Math.cos(alpha);
      var sina = Math.sin(alpha);
      var cosb = Math.cos(beta);
      var sinb = Math.sin(beta);
      var cosc = Math.cos(gamma);
      var sinc = Math.sin(gamma);

      var axx = cosa * cosb;
      var axy = cosa * sinb * sinc - sina * cosc;
      var axz = cosa * sinb * cosc + sina * sinc;
      var ayx = sina * cosb;
      var ayy = sina * sinb * sinc + cosa * cosc;
      var ayz = sina * sinb * cosc - cosa * sinc;
      var azx = -sinb;
      var azy = cosb * sinc;
      var azz = cosb * cosc;

      var mx = (axx * baseVector.x) + (axy * baseVector.y) + (axz * baseVector.z)
      var my = (ayx * baseVector.x) + (ayy * baseVector.y) + (ayz * baseVector.z)
      var mz = (azx * baseVector.x) + (azy * baseVector.y) + (azz * baseVector.z)

      results.push(new THREE.Vector3(mx * frame.ranges[i], my * frame.ranges[i], mz * frame.ranges[i]).add(new THREE.Vector3(frame.posX, frame.posY, frame.posZ)));
    }

    this.addToCanvas(results);
  }

  public onResize(event: any): void {
    /* The event will only detect window resize events, 
    Therefore we need to substract 520 pixels from the innerWidth manually 
    to take into account the two side navigation panels which are both 260*/
    this.dashboardWidth = event.target.innerWidth - 520;
    this.dashboardHeight = event.target.innerHeight - 164;
  }

  public toggleImages(): void {
    if (this.isImageDisplayed) {
      this.isImageDisplayed = false;
    }
    else {
      this.isImageDisplayed = true;
      this.isCanvasDisplayed = false;
    }
  }

  public toggleCanvas(): void {
    if (this.isCanvasDisplayed) {
      this.isCanvasDisplayed = false;
    }
    else {
      this.isImageDisplayed = false;
      this.isCanvasDisplayed = true;
    }
  }

  private create3DCanvas(): void {
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.camera.position.z = 15;
    this.camera.position.y = 5;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });

    this.renderer.setClearColor('#00000');
    this.renderer.setSize(this.dashboardWidth, this.dashboardHeight);

    this.elementView.nativeElement.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => {
      this.renderer.setSize(this.dashboardWidth, this.dashboardHeight);
      this.camera.aspect = this.dashboardWidth / this.dashboardHeight;
      this.camera.updateProjectionMatrix();
    });

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  private addToCanvas(points) {
    this.scene = new THREE.Scene();

    // LIGHTS
    var light = new THREE.PointLight(0xFFFFFF, 1, 500);
    light.position.set(10, 0, 25);
    this.scene.add(light);

    // MATERIAL
    var material = new THREE.PointsMaterial({ size: 1, sizeAttenuation: false });

    // GEOMETRY
    var geometry = new THREE.Geometry();

    // Add vertices
    points.forEach(element => {
      geometry.vertices.push(element)
    });

    this.points = new THREE.Points(geometry, material);
    // Add points to Scene
    this.scene.add(this.points);

    let component: DashboardComponent = this;
    // Render the animation in the canvas
    (function render() {
      requestAnimationFrame(render);
      component.controls.update();
      component.renderer.render(component.scene, component.camera);
    }());
  }
}