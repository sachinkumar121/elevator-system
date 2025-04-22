const floors = 10;
const elevatorCount = 5;
const floorHeight = 80;
const elevators = [];
const queue = [];
const SPEED_PER_FLOOR = 1000; // speed in ms
const timerIds = [];

function setupElevators() {
  for (let i = 0; i < elevatorCount; i++) {
    const element = document.getElementById(`elevator-${i}`);
    elevators.push({
      id: i,
      busy: false,
      element,
      currentFloor: 0
    });
  }
}

function handleElevatorRequest(floor, button) {
  button.textContent = 'Waiting';
  button.classList.add('waiting');
  button.disabled = true;

  // Find nearest available elevator
  const availableElevators = elevators.filter(e => !e.busy && e.currentFloor != floor);
  if (availableElevators.length === 0) {
    queue.push({ floor, button });
    return;
  }

  const closest = availableElevators.reduce((prev, curr) => {
    return Math.abs(curr.currentFloor - floor) < Math.abs(prev.currentFloor - floor) ? curr : prev

  });

  moveElevatorToFloor(closest, floor, button);
}

function findClosestAvailableElevator(floor) {
  const available = elevators.filter(e => !e.busy);
  if (!available.length) return null;

  return available.reduce((closest, current) => {
    const closestDist = Math.abs(closest.currentFloor - floor);
    const currentDist = Math.abs(current.currentFloor - floor);
    return currentDist < closestDist ? current : closest;
  });
}

function moveElevatorToFloor(elevator, targetFloor, button) {
  const floorsToTravel = Math.abs(elevator.currentFloor - targetFloor);
  const travelTime = floorsToTravel * SPEED_PER_FLOOR;
  const start = performance.now();
  // const timeTakenElement = document.getElementById(`elevator-${elevator.id}-taken-time`);
  // const timeTravelElement = document.getElementById(`elevator-${elevator.id}-travel-time`);
  const timeCell = document.querySelector(`.cell[data-floor="${targetFloor}"][data-elevator="${elevator.id}"]`);
  timeCell.insertAdjacentHTML('beforeend', `<span class="waiting-time">${msToReadableTime(travelTime)}</span>`);
  // RED while moving
  // timeTakenElement.textContent = "";
  // timeTravelElement.textContent = `${travelTime}s`;
  elevator.element.classList.remove('green', 'black');
  elevator.element.classList.add('red');
  elevator.element.style.transition = `transform ${travelTime}ms ease-in-out`;

  // Move up/down: translateY goes negative to go "up"
  const translateY = -(targetFloor * floorHeight);
  elevator.element.style.transform = `translateY(${translateY}px)`;

  elevator.currentFloor = targetFloor;
  elevator.busy = true;

  let outerTimer = setTimeout(() => {
    timeCell.querySelector('span.waiting-time').remove();

    const end = performance.now();
    const timeTaken = ((end - start) / 1000).toFixed(2);
    // timeTakenElement.textContent = `${timeTaken}s`;

    new Audio('beep_short.ogg').play();

    elevator.element.classList.remove('red');
    elevator.element.classList.add('green');

    button.textContent = 'Arrived';
    button.classList.remove('waiting');
    button.classList.add('arrived');

    let innerTimer = setTimeout(() => {
      elevator.element.classList.remove('green');
      elevator.element.classList.add('black');

      button.textContent = 'Call';
      button.classList.remove('arrived');
      button.disabled = false;

      elevator.busy = false;

      if (queue.length > 0) {
        const next = queue.shift();
        handleElevatorRequest(next.floor, next.button);
      }
    }, 2000);
    timerIds.push(innerTimer);
  }, travelTime);

  timerIds.push(outerTimer);
}

function isAllIdleElevatorsOnSameFloor(floor) {
  const allElevatorAtFloor = elevators.filter(e => !e.busy && e.currentFloor == floor);
  return allElevatorAtFloor.length === elevatorCount;
}

function main() {
  setupElevators();

  document.querySelectorAll('.call-btn').forEach(button => {
    button.addEventListener('click', () => {
      const floor = parseInt(button.dataset.floor);

      // If all idle elevators are on the same floor then we do nothing.
      if (isAllIdleElevatorsOnSameFloor(floor)) {
        console.log(`All idle elevators are on the same floor then we do nothing.`)
        return false;
      }

      button.textContent = 'Waiting';
      button.classList.add('waiting');
      handleElevatorRequest(floor, button);
    });
  });

  window.addEventListener('beforeunload', () => {
    for (const timerId in timerIds) {
      clearTimeout(timerId);
    }
  });
}

function msToReadableTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes) parts.push(`${minutes} min${minutes !== 1 ? 's' : ''}`);
  if (seconds || parts.length === 0) parts.push(`${seconds} sec${seconds !== 1 ? 's' : ''}`);

  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts.join(' and ');

  return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
}


main();