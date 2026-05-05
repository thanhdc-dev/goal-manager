import {
  Component, Input, OnChanges, AfterViewInit,
  ViewChild, ElementRef, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ArcElement, DoughnutController, Tooltip, Legend } from 'chart.js';

Chart.register(ArcElement, DoughnutController, Tooltip, Legend);

@Component({
  selector: 'app-progress-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-wrap">
      <canvas #canvas width="220" height="220"></canvas>
      <div class="chart-center">
        <span class="pct">{{ progress | number:'1.0-1' }}%</span>
        <span class="label">hoàn thành</span>
      </div>
    </div>
  `,
  styles: [`
    .chart-wrap {
      position: relative;
      width: 220px;
      height: 220px;
      margin: 0 auto;
    }
    .chart-center {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      pointer-events: none;
    }
    .pct {
      display: block;
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1.1;
    }
    .label {
      display: block;
      font-size: 0.72rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  `]
})
export class ProgressChartComponent implements OnChanges, AfterViewInit {
  @Input() progress = 0;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;

  ngAfterViewInit(): void {
    this.buildChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['progress'] && this.chart) {
      this.updateChart();
    }
  }

  private buildChart(): void {
    const ctx = this.canvasRef.nativeElement.getContext('2d')!;
    const style = getComputedStyle(document.documentElement);
    const accent = style.getPropertyValue('--accent').trim() || '#6366f1';
    const surface = style.getPropertyValue('--surface').trim() || '#1e1e2e';

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [this.progress, Math.max(0, 100 - this.progress)],
          backgroundColor: [accent, surface],
          borderWidth: 0,
          borderRadius: 6,
        }]
      },
      options: {
        cutout: '72%',
        responsive: false,
        animation: { animateRotate: true, duration: 700 },
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
      }
    });
  }

  private updateChart(): void {
    if (!this.chart) return;
    this.chart.data.datasets[0].data = [
      this.progress, Math.max(0, 100 - this.progress)
    ];
    this.chart.update('active');
  }
}
