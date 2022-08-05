'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const edit_Delete_Icon = document.querySelector('.edit_delete');
const deleteAllBtn = document.querySelector('.delete_all_button');
const ascending = document.querySelector('.ascending');
// const descending = document.querySelector('.descending');
const sortDropDown = document.querySelector('.sort_dropdown');
const inputEl = document.querySelector('.distanceIn');

let map, mapEvent;

class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);
    click = 0;

    constructor(coords, distance, duration) {
        console.log("workout class",this)
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }

    _setDescription() {
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)}  on  ${months[this.date.getMonth()]}  ${this.date.getDate()}`;
    }

    // click(){
    //     this.click++;
    // }
}
class Running extends Workout {
    type = "running";
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        console.log("running class",this)
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }
    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}
class Cycling extends Workout {
    type = "cycling";
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
    }
}

// const run1 = new Running([32, 20], 20, 10, 12);
// const cycl1 = new Cycling([35, 25], 30, 15, 20);
// console.log(run1, cycl1);

class App {
    #map;
    #mapEvent;
    #workout = [];
    #mapZoomLvl = 13;

    constructor() {
        // get user's position
        this._getPosition();

        // get data from local storage
        this._getLocalStorage();

        // attach event hadlers
        form.addEventListener("submit", this._newWorkout.bind(this));
        inputType.addEventListener("change", this._toggleElevationField);
        containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
        deleteAllBtn.addEventListener("click", this._reset.bind(this));
        ascending.addEventListener("click", this._asec.bind(this));
        sortDropDown.addEventListener("click", this._sortData.bind(this));
        // descending.addEventListener("click", this._desc.bind(this));
        // inputEl.addEventListener("click", this.ed.bind(this));
    }

    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
                alert("Could not get your location");
            });
        }
    }

    _loadMap(position) {
        console.log(position);
        const { latitude } = position.coords;
        const { longitude } = position.coords;
        console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

        const coords = [latitude, longitude];
        console.log(this);
        this.#map = L.map('map').setView(coords, this.#mapZoomLvl);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        // L.marker(coords).addTo(map)
        // .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
        // .openPopup();

        this.#map.on("click", this._showForm.bind(this));

        this.#workout.forEach(work => {
            this._renderWorkoutMarker(work);
        })
    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove("hidden");
        inputDistance.focus();
    }

    _hideForm(){
        // Empty input fields
        inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = "";

        // hidden input form
        form.style.display = "none";
        form.classList.add("hidden");
        setTimeout(() => form.style.display = "grid", 1000);
    }

    _toggleElevationField() {
        inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
        inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    }

    _newWorkout(e) {
        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);

        e.preventDefault();

        // Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;

        // If workout running, create running object
        if (type == "running") {
            const cadence = +inputCadence.value;
            // check if the data is valid
            if (!validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence))
                return alert("Inputs have to be positive numbers");

            workout = new Running([lat, lng], distance, duration, cadence);
        }

        // If workout cycling, create cycling object
        if (type == "cycling") {
            const elevation = +inputElevation.value;
            // check if the data is valid
            if (!validInputs(distance, duration, elevation) || !allPositive(distance, duration))
                return alert("Inputs have to be positive numbers");

            workout = new Cycling([lat, lng], distance, duration, elevation);
        }

        // add new object to workout array
        this.#workout.push(workout);

        // render workout on map
        this._renderWorkoutMarker(workout);

        // rander workout on list
        this._randerWorkout(workout);

        // hide the form + clear input fields
        this._hideForm();

        // set local storage to all workouts
        this._setLocalStorage();
    }
    _renderWorkoutMarker(workout) {
        console.log("randermarkerworkout");
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(L.popup({
                maxwidth: 250,
                minwidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`
            }))
            .setPopupContent(`${workout.type == "running" ? '🏃‍♂️' : '🚴‍♀️'}  ${workout.description}`)
            .openPopup();

            console.log({workout});
    }

    _randerWorkout(workout) {
        console.log("randerworkout");
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class='edit_delete'>
            <button class="edit_icon icons"><i class="fa-solid fa-pen"></i></button>
            <button class="delete_icon icons"><i class="fa-solid fa-trash"></i></button>
          </div>
          <div class="workout__details">
            <span class="workout__icon">${workout.type == "running" ? '🏃‍♂️' : '🚴‍♀️'}</span>
            <span class="workout__value distance">${workout.distance}</span>
            <input type="text" class="distanceIn hidden"> &nbsp;
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value duration">${workout.duration}</span>
            <input type="text" class="durationIn hidden"> &nbsp;
            <span class="workout__unit">min</span>
          </div>
          `;
        if (workout.type == "running") {
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value pace">${workout.pace.toFixed(1)}</span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value cadence">${workout.cadence}</span>
                    <input type="text" class="cadenceIn hidden"> &nbsp; &nbsp;
                    <span class="workout__unit">spm</span>
                </div>
            </li>
            `;
        }
        if (workout.type == "cycling") {
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value speed">${workout.speed.toFixed(1)}</span>
                    <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                     <span class="workout__icon">⛰</span>
                    <span class="workout__value elevationGain">${workout.elevationGain}</span>
                    <input type="text" class="elevationGainIn hidden"> &nbsp; &nbsp;
                    <span class="workout__unit">m</span>
                </div>
            </li>
            `;
        }
        document.querySelector('.workout_parent').insertAdjacentHTML("afterbegin", html);
    }
    _moveToPopup(e){
        const workoutEl = e.target.closest(".workout");
        console.log(workoutEl);

        if(!workoutEl) return;

        const workout = this.#workout.find(work => work.id == workoutEl.dataset.id);
        console.log(workout);

        this.#map.setView(workout.coords, this.#mapZoomLvl, {
            animate: true,
            pan: {
                duration: 1
            }
        })

        console.log(e.target);
        
        // edit record
        if(e.target.classList.contains("fa-pen")){
            console.log("edit");

           this._showInputField(e);

            workoutEl.addEventListener("keydown", this._setData.bind(this));
        }

        // delete record
        if(e.target.classList.contains("fa-trash")){
            const id = workoutEl.dataset.id;
            const index = this.#workout.findIndex(work => work.id ==  workoutEl.dataset.id);
            this.#workout.splice(index, 1);

            this._setLocalStorage();
            const data = JSON.parse(localStorage.getItem("workouts"));
            console.log(data);
    
            if(!data) return;

            this.#workout = [];

            this.#workout = data;

            document.querySelector('.workout_parent').innerHTML = '';
            this.#workout.forEach(work => {
                this._randerWorkout(work);
                // L.marker(work.coords).removeFrom(this.#map);
                // location.reload();
            })
        }

        // this.click();
    }

    _showInputField(e){
        const workoutEl = e.target.closest(".workout");
        console.log(workoutEl);

        workoutEl.querySelector(".distance").classList.toggle("hidden");
        workoutEl.querySelector(".distanceIn").classList.toggle("hidden");
        
        workoutEl.querySelector(".duration").classList.toggle("hidden");
        workoutEl.querySelector(".durationIn").classList.toggle("hidden");
        
        if(workoutEl.classList.contains("workout--running")){
            workoutEl.querySelector(".cadence").classList.toggle("hidden");
            workoutEl.querySelector(".cadenceIn").classList.toggle("hidden");
        }

        if(workoutEl.classList.contains("workout--cycling")){
            workoutEl.querySelector(".elevationGain").classList.toggle("hidden");
            workoutEl.querySelector(".elevationGainIn").classList.toggle("hidden");
        }
    }

    _setData(e){
        if(e.key == "Enter"){
            console.log("GHJ");
        
            const workoutEl = e.target.closest(".workout");
            console.log(workoutEl);
            
            workoutEl.querySelector(".distance").textContent = workoutEl.querySelector(".distanceIn").value;
            workoutEl.querySelector(".duration").textContent = workoutEl.querySelector(".durationIn").value;
            
            if(workoutEl.classList.contains("workout--running")){
                workoutEl.querySelector(".cadence").textContent = workoutEl.querySelector(".cadenceIn").value;
                workoutEl.querySelector(".pace").textContent = (workoutEl.querySelector(".durationIn").value / workoutEl.querySelector(".distanceIn").value);
            }

            if(workoutEl.classList.contains("workout--cycling")){
                workoutEl.querySelector(".elevationGain").textContent = workoutEl.querySelector(".elevationGainIn").value;
                workoutEl.querySelector(".speed").textContent = (workoutEl.querySelector(".distanceIn").value / (workoutEl.querySelector(".durationIn").value / 60));
            }

            workoutEl.querySelector(".distance").classList.remove("hidden");
            workoutEl.querySelector(".distanceIn").classList.add("hidden");
            
            workoutEl.querySelector(".duration").classList.remove("hidden");
            workoutEl.querySelector(".durationIn").classList.add("hidden");
            
            if(workoutEl.classList.contains("workout--running")){
                workoutEl.querySelector(".cadence").classList.remove("hidden");
                workoutEl.querySelector(".cadenceIn").classList.add("hidden");
            }
    
            if(workoutEl.classList.contains("workout--cycling")){
                workoutEl.querySelector(".elevationGain").classList.remove("hidden");
                workoutEl.querySelector(".elevationGainIn").classList.add("hidden");
            }

        this.#workout.forEach(work => {
            console.log("inner");
            console.log(work);
            if(work.id == workoutEl.dataset.id){
                work.distance = workoutEl.querySelector(".distance").textContent;
                work.duration = workoutEl.querySelector(".duration").textContent;

                if(work.type == "running"){
                    work.pace = (workoutEl.querySelector(".duration").textContent / workoutEl.querySelector(".distance").textContent);
                    work.cadence = workoutEl.querySelector(".cadence").textContent;
                }

                if(work.type == "cycling"){
                    work.speed = workoutEl.querySelector(".distance").textContent / (workoutEl.querySelector(".duration").textContent / 60);
                    work.elevationGain =  workoutEl.querySelector(".elevationGain").textContent;
                }
            }
            console.log("outer");
            console.log(work);
        })
        this._setLocalStorage();

        }
    }

    _setLocalStorage(){
        console.log("ok");
        localStorage.setItem("workouts",JSON.stringify(this.#workout));
    }

    _getLocalStorage(){
        const data = JSON.parse(localStorage.getItem("workouts"));
        console.log(data);

        if(!data) return;

        this.#workout = data;
        
        this.#workout.forEach(work => {
            this._randerWorkout(work);
        })
    }

    _asec(){
        console.log("asec");
        sortDropDown.classList.toggle("hidden");
    }

    _sortData(e){
        console.log(e.target.textContent);

        if(e.target.textContent == "Distance (A to Z)"){
            this.#workout.sort((a,b) => b.distance - a.distance);
            
            this._displaySortData();
        }

        else if(e.target.textContent == "Distance (Z to A)"){
            this.#workout.sort((a,b) => a.distance - b.distance);
            
            this._displaySortData();
        }

        else if(e.target.textContent == "Duration (A to Z)"){
            this.#workout.sort((a,b) => b.duration - a.duration);
            
            this._displaySortData();
        }

        else if(e.target.textContent == "Duration (Z to A)"){
            this.#workout.sort((a,b) => a.duration - b.duration);
            
            this._displaySortData();
        }
    }

    _displaySortData(){
        document.querySelector('.workout_parent').innerHTML = '';
        this.#workout.forEach(work => {
            this._randerWorkout(work);
        })
    }

    _reset(){
        localStorage.removeItem("workouts");
        location.reload();
    }

   
}

const app = new App();