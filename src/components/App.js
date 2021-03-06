import React from 'react';
import Countries from './Countries';
import Cities from './Cities';
import Controls from './Controls';
import Choices from './Choices';
import Score from './Score';
import '../styles/components/app.scss';

class App extends React.Component {

    constructor(){
        super(); 

        this.apikey = process.env.API_KEY;
        this.baseURL = 'https://api.unsplash.com/search/collections/';
        this.keepArray = ["tower", "summer", "explore", "holiday", "street", "village", "town", "urban", "rural", "desert", "mountain", "view", "river", "stream", "field", "beach", "sea", "sunset", "landmark", "architecture", "city", "building", "cathedral", "bridge"];  
        this.ignoreArray = ["wood", "wall", "texture", "glass", "metal"]; // const ignoreArray = ["leaf", "fashion", "table", "coffee", "fish", "computer", "office", "food", "guitar", "music", "sport", "background", "door", "wood", "wallpaper", "wall", "texture", "glass", "metal"];
    
        this.fetchLocations = this.fetchLocations.bind(this);
        this.receiveLocation = this.receiveLocation.bind(this);
        this.controlCurrentPhoto = this.controlCurrentPhoto.bind(this);
        this.cleanCityPhotos = this.cleanCityPhotos.bind(this);
        this.randomiseChoices = this.randomiseChoices.bind(this);
        this.receiveChoice = this.receiveChoice.bind(this);
        this.addFavourites = this.addFavourites.bind(this);
        this.renderFavourites = this.renderFavourites.bind(this);

        this.state = {
            results: [],
            currentPhoto: 0,
            lives: 10,
            error: '',
            favourites: [],
            loaded: true
        }

        // localStorage.clear();
    }

    /* initialise, add and render favourites 
    // for storing score, name, id and date into localStorage
    ////////////////////////////////////////////////////////*/

    componentDidMount(){
        const favourites = window.localStorage.getItem('favourites');
        const favouritesArray = favourites ? JSON.parse(favourites) : [];
        this.setState({
            favourites: favouritesArray
        });
    }

    addFavourites(name) {
        const date = new Date();
        const addZero = n => n < 10 ? `0${n}` : n;
        const formattedDate = `${addZero(date.getDate())}-${addZero(date.getMonth()+1)}-${date.getFullYear()}`;
        const score = {name, score: (Number(this.state.lives) * 10), city: this.state.currentCity, date: formattedDate, id: +new Date};
        this.setState({
            favourites: this.state.favourites.concat(score),
            showFavourites: true
        }, () => {
            window.localStorage.setItem('favourites', JSON.stringify(this.state.favourites));
        });
    }

    renderFavourites () {
        const rows = [...this.state.favourites];
        return rows.sort( (a, b) => b.score === a.score ? b.id - a.id : b.score - a.score)
        .map(item => {
            return <ul className="score__board__rows" key={item.id}><li>{item.name}</li><li>{item.score}</li><li>{item.city}</li><li>{item.date}</li></ul>;
        });
    }

    /* fetch from Unsplash API based on currentCity
    /////////////////////////////////////////////*/

    fetchLocations () {
        const url = `${this.baseURL}?query=${this.state.currentCity}&page=1&per_page=30&client_id=${this.apikey}`;
        fetch(url)
        .then(response => response.json())
        .then(body => {
            this.setState({
                currentPhoto: 0,
                cityUrl: url,
                lives: 10,
                prevPhoto: 0,
                choice: null,
                choiceSubmitted: null,
                showFavourites: null,
                choices: this.randomiseChoices (),
                results: this.cleanCityPhotos(body.results),
                loaded: true
            });
        });
        this.keepArray.push(this.state.currentCity.toLowerCase());
    }

    /* control photos from <Controls>
    /////////////////////////////////////////////*/

    controlCurrentPhoto (direction) {
        if (!this.state.choiceSubmitted) {
            const maxNum = 10;
            let num = this.state.currentPhoto + direction;
            num = num > maxNum-1 ? maxNum-1 : (num < 0 ? 0 : num);
            this.setState({ currentPhoto: num });
            if (direction === 1 && num > this.state.prevPhoto) {
                let lives = this.state.lives;
                lives--;
                this.setState({ lives: lives, prevPhoto: num })
            }
        }
    }

    /* remove / clean irrelevant photos after fetch
    /////////////////////////////////////////////*/

    cleanCityPhotos (results) {
        const obj = {};
        return results.reduce((acc, item, index, array) => {
            if ( item.cover_photo && (this.keepRelevantImage (item, array.length))) {
                const imgURL = item.cover_photo.urls.small;
                if (!obj[imgURL]) {
                    obj[imgURL] = true;
                    acc.push(item);
                }
            }
            return acc;
        }, []);
    }

    keepRelevantImage (image, arrayLength) {
        const imageIsRelevant = image.tags.filter(n => this.keepArray.indexOf(n.title) >= 0).length > 0;
        const imageNotRelevant = image.tags.filter(n => this.ignoreArray.indexOf(n.title) >= 0).length > 0;
        return (arrayLength < 20) ? true : imageIsRelevant && !imageNotRelevant || image.tags == [];
    }

    /* get city and country from <Countries>
    /////////////////////////////////////////////*/

    receiveLocation (city, country, europeFullArrays){
        this.setState({
            currentCity: city,
            currentCountry: country,
            europeFullArrays: europeFullArrays,
            loaded: false
        }, () => {
            this.fetchLocations ();
        })
    }

    /* randomise choices
    /////////////////////////////////////////////*/

    randomiseChoices () {
        const choicesArray = [...this.state.europeFullArrays];
        const currentCityPos = choicesArray.indexOf(this.state.currentCity);
        choicesArray.splice(currentCityPos, 1);
        let count = 1, choices = [this.state.currentCity];
        while (count++ < 4) {
            const rand = Math.floor(Math.random() * choicesArray.length);
            choices.push(choicesArray.splice(rand, 1)[0]);
        }
        choices.sort((a,b) => Math.floor(Math.random() * choices.length));
        return choices;
    }

    /* set user's choice from <Choices> and display final score
    /////////////////////////////////////////////*/

    receiveChoice(choice) {
        (!this.state.choiceSubmitted) &&
        this.setState({
            choice: choice,
            choiceSubmitted: true
        })
    }

    /* render <Countries> <Cities> <Controls> <Choices> and score
    //////////////////////////////////////////////////////////////*/

    render(){

        const countries = 
        (this.state.results) ?
        <Countries 
            receiveLocation={this.receiveLocation} 
        /> : null;

        const cities =  
        (this.state.results.length && this.state.currentCity && this.state.loaded) ?
        <Cities 
            results={this.state.results} 
            currentPhoto={this.state.currentPhoto} 
            image={this.state.results[this.state.currentPhoto]}
            currentCity={this.state.currentCity}
            cityUrl={this.state.cityUrl}
        /> : null;

        const loader = 
        (!this.state.loaded) ?
            <div className="city__loading-ring"><div></div><div></div><div></div><div></div></div>
        : null;

        const controls = 
        (this.state.results.length && this.state.currentCity && this.state.loaded) ?
        <Controls 
            controlCurrentPhoto={this.controlCurrentPhoto} 
            currentPhoto={this.state.currentPhoto} 
            lives={this.state.lives} 
        /> : null;

        const choices = 
        (this.state.results && this.state.currentCity && this.state.choices && this.state.loaded) ?
        <Choices 
            receiveChoice={this.receiveChoice} 
            choice={this.state.choice} 
            choices={this.state.choices} 
            currentCity={this.state.currentCity}
        /> : null;  

        const score = 
        (this.state.choiceSubmitted && this.state.loaded) ?
        <Score 
            choice={this.state.choice} 
            currentCity={this.state.currentCity}
            lives={this.state.lives}
            receiveScore={this.receiveScore}
            addFavourites={this.addFavourites}
        /> : null;

        const showFavourites = <div className="score__board fadein"> 
            <ul className="score__board__header"><li>Name</li><li>Score</li><li>City</li><li>Date</li></ul>
            <div className="score__board__content"> 
                {this.renderFavourites()}
            </div>
        </div>;

        return (
            <div className="app">
                
                { showFavourites }
                
                <div className="intro-message">
                    Choose a country and guess the city
                </div>

                { countries }
                { loader }
                { cities }
                { controls }
                { choices }
                { score }

            </div>
        )
    }
}

export default App;
