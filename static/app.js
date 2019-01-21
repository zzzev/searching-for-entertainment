import 'https://unpkg.com/intersection-observer@0.5.0/intersection-observer.js'
import {require} from 'https://unpkg.com/d3-require?module';
import Chart from './chart.js';

const scrollStartStep = 1;
const lineStartStep = scrollStartStep + 1;
const weekendShadeStep = 4;
const scrollingSteps = 5;
const birdBoxStep = 6;
const aquamanStep = 8;
const finalStep = 9;

const headline = "Searching for Entertainment"

// Animate the input box in the splash screen area.
const splash = function splash(d3) {
  const input = d3.select(".page input")
    .attr('value', '')
    .attr('autofocus', true);
  const r = d3.randomNormal(100, 20);
  const scheduleKeystroke = function scheduleKeystroke() {
    d3.timeout(() => {
      const current = input.attr('value');
      let newValue;
      if (Math.random() < 0.9) {
        newValue = headline.slice(0, current.length + 1);
      } else {
        newValue = current.slice(0, -1);
      }
      input.attr('value', newValue);
      if (newValue.length === headline.length) {
        d3.timeout(scheduleDelete, 2000);
      } else {
        scheduleKeystroke();
      }
    }, r());
  }
  const scheduleDelete = function scheduleDelete() {
    d3.timeout(() => {
      const newValue = input.attr('value').slice(0, -1);
      input.attr('value', newValue);
      if (newValue.length > 0) {
        scheduleDelete();
      } else {
        d3.timeout(scheduleKeystroke, r());
      }
    }, r());
  }
  scheduleKeystroke();
}

// Initial set up (event listeners, height, etc.)
const bootstrap = async function bootstrap() {
  const results = await Promise.all([
    require('d3'),
    require('scrollama'),
  ])
  const d3 = results[0];
  const scrollama = results[1];
  
  const data = await d3.csv('data.csv');
  data.forEach(d => {
    d.day = new Date(d.Day);
    d.day.setHours(0);
    d.day.setMinutes(0);
    d.day.setSeconds(0);
    d.day.setMilliseconds(0);
    delete d.Day;
  });

  splash(d3);

  const pageHeight = Math.max(window.innerHeight, 1000);
  const numPages = d3.selectAll('.page')
    .style('height', `${pageHeight}px`)
    .nodes().length;

  const c = new Chart(d3, data);

  let lastIndex = 0;

  const onIndexChange = (index) => {
    if (index < scrollStartStep || index === finalStep) {
      c.hideAxis();
    } else {
      c.showAxis();
    }
    
    if (index < lineStartStep || index >= aquamanStep) {
      ['netflix', 'meme'].forEach((id, index) => c.hideLine(id, Chart.duration, index * 250));
    } else {
      ['netflix', 'meme'].forEach((id, index) => c.showLine(id, Chart.duration, index * 250));
    }

    if (index < weekendShadeStep || index > weekendShadeStep + 1 || index === finalStep) {
      c.hideWeekendShading();
    } else {
      c.showWeekendShading();
    }

    if (index < birdBoxStep || index === finalStep) {
      c.hideLine('birdbox');
    } else {    
      c.showLine('birdbox');
    }

    if (index < aquamanStep || index === finalStep) {
      c.hideLine('aquaman');
    } else {
      c.showLine('aquaman');
    }

    if (index < weekendShadeStep || index === finalStep) {
      c.hideHolidays();
    } else {
      c.showHolidays();
    }
  }

  onIndexChange(lastIndex);

  window.addEventListener('scroll', function onScroll(e) {
    const middle = window.scrollY + window.innerHeight / 2;
    const progress = middle / pageHeight;
    const pageIndex = Math.floor(progress);
    const pageProgress = progress - pageIndex;
    if (pageIndex !== lastIndex) {
      onIndexChange(pageIndex);
      lastIndex = pageIndex;
    }
    if (pageIndex >= scrollStartStep) {
      const scrollProgress = pageProgress / scrollingSteps + ((pageIndex - scrollStartStep) / scrollingSteps);
      c.updateNow(scrollProgress);
    }
  });
}

bootstrap();