const Chart = class Chart {
  constructor(d3, data) {
    this.d3 = d3;
    this.data = data;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
  
    this.svg = d3.select('#chart').append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    const trends = Object.keys(data[0]).slice(0, -1);

    // scales
    const dayExtent = d3.extent(data, d => d.day);
    
    this.xStart = d3.interpolateNumber.apply(this, dayExtent.map(d => d.getTime()));
    const start = this.xStart(0);
    this.x = d3.scaleTime()
      .domain([start, start + Chart.msPerDay * 28])
      .range([Chart.margin.left, this.width - Chart.margin.right - Chart.margin.left]);
    this.y = d3.scaleLinear()
      .domain([0, 100])
      .range([this.height - Chart.margin.bottom, Chart.margin.top]);  
    this.color = d3.scaleOrdinal(d3.schemeCategory10);

    // clip paths
    // note: use a foreach loop because data binding doesn't work w/ clipPath elements
    trends.forEach(d => {
      this.svg.append('clipPath')
        .attr('id', `clip-${d}`)
        .append('rect')
          .attr('x', this.x(dayExtent[0]))
          .attr('width', 0)
          .attr('y', this.y(100))
          .attr('height', this.y(0) - this.y(100));
    });

    // axis
    this.axis = this.svg.append('g')
      .attr('transform', `translate(0, ${this.height - Chart.margin.bottom})`)
      .call(d3.axisBottom(this.x).ticks(d3.timeWeek.every(1)))
      .attr('opacity', 0);
    this.drawDayOfWeek();

    // lines
    const lines = this.svg.append('g')
      .classed('lines', true);
    this.updateLineCallbacks = trends.map(t => {
      const line = d3.line()
        .x(d => this.x(d.day))
        .y(d => d[t] === "<1" ? this.y(0) : this.y(d[t]));
      const l = lines.append('g')
        .selectAll('path').data([data]).enter()
        .append('path')
          .attr('d', line)
          .attr('stroke', this.color(t))
          .attr('clip-path', `url(#clip-${t})`);
      return () => l.attr('d', line);
    });
  }

  updateChart() {
    this.axis
      .call(this.d3.axisBottom(this.x).ticks(this.d3.timeWeek.every(1)));
    this.updateLineCallbacks.forEach(cb => cb());
    this.dayOfWeekG.attr('transform', d => `translate(${this.x(d.day)}, 0)`);
  }

  drawDayOfWeek() {
    this.daysOfWeek = this.svg.append('g').classed('days', true);
    this.dayOfWeekG = this.daysOfWeek.selectAll('g')
      .data(this.data).enter().append('g')
      .attr('transform', d => `translate(${this.x(d.day)}, 0)`);
    const xDomain = this.x.domain();
    const yRange = this.y.range();
    this.dayOfWeekG.append('rect')
      .attr('x', d => this.x(d.day.getTime() - Chart.msPerDay / 2) - this.x(d.day.getTime()))
      .attr('y', yRange[1])
      .attr('width', d => this.x(d.day.getTime() + Chart.msPerDay) - this.x(d.day))
      .attr('height', yRange[0] - yRange[1])
      .attr('fill', d => Chart.isWeekend[d.day.getDay()] ? 'rgba(0,0,0,0.2)' : 'none');
    this.dayOfWeekG.append('text')
      .text(d => Chart.daysOfWeek[d.day.getDay()])
      .attr('font-size', 10)
      .attr('fill', d => Chart.isWeekend[d.day.getDay()] ? 'white' : 'grey')
      .attr('text-anchor', 'middle')
      .attr('y', this.height - Chart.margin.bottom - 20);
  }

  showAxis() {
    this.axis
      .transition()
      .duration(Chart.duration)
      .attr('opacity', 1);
  }

  hideAxis() {
    this.axis
      .transition()
      .duration(Chart.duration)
      .attr('opacity', 0);
  }

  showLine(id, duration = Chart.duration, delay = 0) {
    const range = this.x.range();
    this.svg
      .select(`#clip-${id} rect`)
      .transition()
      .duration(duration)
      .delay(delay)
      .attr('x', range[0])
      .attr('width', range[1] - range[0]);
  }

  hideLine(id, duration = Chart.duration, delay = 0) {
    this.svg
      .select(`#clip-${id} rect`)
      .transition()
      .duration(duration)
      .delay(delay)
      .attr('x', this.x.range()[0])
      .attr('width', 0);
  }

  showWeekendShading() {
    this.daysOfWeek
      .transition()
      .duration(Chart.duration)
      .attr('opacity', 1);
  }

  hideWeekendShading() {
    this.daysOfWeek
      .transition()
      .duration(Chart.duration)
      .attr('opacity', 0);
  }

  updateNow(progress) {
    const start = this.xStart(progress);
    const msPerChart = Chart.msPerDay * 28;
    const end = start + msPerChart;
    const max = this.xStart(1);
    if (end < max) {
      this.x.domain([start, end]);
    } else {
      this.x.domain([max - msPerChart, max])
    }
    this.updateChart();
  }
};
Chart.margin = {
  top: 20,
  left: 40,
  right: 20,
  bottom: 40,
};
Chart.daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
Chart.isWeekend = [false, false, false, false, false, true, true];
Chart.msPerDay = 1000 * 60 * 60 * 24;
Chart.duration = 2000;

export default Chart;