'use strict';

class StartStop {
    static get startButton() {
        return document.getElementById('startButton');
    }
    static get startBackground() {
        return document.getElementById('startBackground');
    }

    static get stopButton() {
        return document.getElementById('stopButton');
    }

    static enableStop() {
        this.disableAll();
        this.stopButton.classList.add('available');
        this.stopButton.onclick = () => {
            FunctionButtons.disable();
            AudioManager.currentlyPlaying.audio.stop();
            StartStop.disableAll();
        }
    }

    static enableStart() {
        this.disableAll();
        this.startBackground.classList.add('available');
        this.startButton.onclick = () => {
            this.startButton.onclick = undefined;
            this.startBackground.classList.remove('available');
            FunctionButtons.enable();

            AudioManager.currentlyPlaying.audio.play();
            this.enableStop();
        }
    }

    static disableAll() {
        this.startBackground.classList.remove('available');
        this.stopButton.classList.remove('available');
        this.stopButton.onclick = undefined;
        this.startButton.onclick = undefined;
    }
}

class AudioManager {
    static get availableAnnouncements() {
        return mappings
    }
    static get audioQueue() {
        return this.queue || [];
    }

    static set audioQueue(announcement) {
        if (this.audioQueue.length === 0) {
            this.queue = []
        }

        if (announcement.priority < this.currentlyPlaying.priority) {
            this.currentlyPlaying.audio.pause();
            this.queue.splice(0, 0, this.currentlyPlaying);

            this.currentlyPlaying = announcement;
            LCD.displayAudio();

            StartStop.enableStart();
        } else {
            for (let i = 0; i < this.queue.length; i++) {
                if (announcement.priority > this.queue[i].priorty) {
                    this.queue.splice(i, 0, announcement);
                }
            }

            if (this.queue.length === 0) {
                this.queue.splice(0, 0, announcement);
            }
        }
    }

    static get currentlyPlaying() {
        return this.playingNow;
    }

    static set currentlyPlaying(audioObject) {
        this.playingNow = audioObject
    }

    static getType(number) {
        for (const [key, values] of Object.entries(this.availableAnnouncements)) {
            if (Object.keys(values.announcements).includes(number)) {
                return key;
            }
        }
    }

    static exists(announcementType, number) {
        if (Object.keys(this.availableAnnouncements[announcementType].announcements).includes(number)) {
            return true;
        }

        return false;
    }

    static addQueue(number, type) {
        const announcementName = this.availableAnnouncements[type].announcements[number].name;

        const announcement = {
            name: announcementName,
            priority: this.availableAnnouncements[type].properties.priority,
            audio: new Howl({
                src: [`/sound/${type}/${number}.mp3`],
                html5: true,
                onplay: function() {
                    LCD.displayAudio();
                },
                onstop: function() {
                    LCD.displayAudio();
                    FunctionButtons.enableType(type);
                    AudioManager.currentlyPlaying = undefined;
                    AudioManager.organiseQueue();
                    this.unload();
                },
            }),
        }

        announcement.audio.once('end', () => {
            LCD.displayAudio();
            FunctionButtons.enableType(type);
            AudioManager.currentlyPlaying = undefined;
            StartStop.disableAll();
            AudioManager.organiseQueue();
        });

        if (!this.currentlyPlaying) {
            this.currentlyPlaying = announcement;
            LCD.displayAudio();

            this.currentlyPlaying.audio.once('load', () => {
                StartStop.enableStart();
            });
        } else {
            this.audioQueue = announcement;
        }

        LCD.displayAudio();
    }

    static organiseQueue() {
        if (this.audioQueue.length > 0) {
            this.currentlyPlaying = this.audioQueue.shift();

            if (this.currentlyPlaying.audio.seek() != 0) {
                this.currentlyPlaying.audio.play()
                StartStop.enableStop();
            } else {
                LCD.displayAudio();
                StartStop.enableStart();
            }
        } else {
            App.reset();
        }
    }
}

class FunctionButtons {
    static get functionButtons() {
        return document.getElementById('functionButtons').childNodes;
    }

    static enable() {
        for (let i = 0; i < this.functionButtons.length; i++) {
            const nodeType = this.functionButtons[i].nodeName;
            const inUse = (nodeType == 'circle') ? this.functionButtons[i].classList.contains('inUse') : false;

            if (!inUse) {
                const announcementType = this.functionButtons[i].classList;

                this.functionButtons[i].onclick = () => {
                    this.functionButtons[i].classList.add('inUse');
                    this.disable()
                    LCD.setDisplay('ENTER NUMBER');
                    Numpad.enable(announcementType[0])
                };
            }
        }
    }

    static enableType(type) {
        const functionButton = document.querySelectorAll(`#functionButtons > .${type}`)
        functionButton[0].classList.remove('inUse');
    }

    static disable() {
        for (let i = 0; i < this.functionButtons.length; i++) {
            this.functionButtons[i].onclick = null;
        }
    }
}

class LCD {
    static get display() {
        return document.getElementById('LED');
    }

    static get topLine() {
        return document.getElementById('LEDTopText');
    }

    static get bottomLine() {
        return document.getElementById('LEDBottomText');
    }

    static setDisplay(toDisplay) {
        if (toDisplay.includes('\\n')) {
            const newLineIndex = toDisplay.indexOf('\\n');

            this.topLine.textContent = toDisplay.substr(0, newLineIndex);
            this.bottomLine.textContent = toDisplay.substr(newLineIndex + 2);
        } else {
            this.topLine.textContent = toDisplay;
            this.bottomLine.textContent = '';
        }
    }

    static displayAudio() {
        if (!Numpad.enabled) {
            if (AudioManager.currentlyPlaying.audio.playing()) {
                this.topLine.textContent = AudioManager.currentlyPlaying.name;
                this.bottomLine.textContent = 'PLAYING'
            } else {
                this.topLine.textContent = AudioManager.currentlyPlaying.name;
                this.bottomLine.textContent = 'STOPPED'
            }
        }
    }

    static reset() {
        LCD.setDisplay(this.defaultText);
    }

    static get contents() {
        return `${this.topLine.textContent}${this.bottomLine.textContent.length > 0 ? '\n' : ''}${this.bottomLine.textContent}`;
    }

    static get defaultText() {
        return 'SELECT MODE';
    }
}

class Numpad {
    static get numberButtons() {
        return document.querySelectorAll('.number');
    }

    static get clearButtons()  {
        return document.querySelectorAll('.buttonRV');
    }

    static get enterButtons()  {
        return document.querySelectorAll('.buttonEnter');
    }

    static get enabled() {
        return this.inUse || false;
    }

    static enable(announcementType) {
        this.inUse = true;

        for (let i = 0; i < this.numberButtons.length; i++) {
            const number = this.numberButtons[i].classList[1]
            this.numberButtons[i].onclick = () => {
                LCD.setDisplay(`${LCD.contents === LCD.defaultText || LCD.contents === 'ENTER NUMBER' ? '' : LCD.contents}${number}`)
            }
        }

        for (let i = 0; i < this.enterButtons.length; i++) {
            this.enterButtons[i].onclick = () => {
                this.disable();

                const reqNumber = LCD.contents

                if (AudioManager.exists(announcementType, reqNumber)) {
                    this.disable();

                    AudioManager.addQueue(reqNumber, announcementType);
                } else {
                    LCD.setDisplay('INVALID NUMBER');
                    setTimeout(() => {
                        FunctionButtons.enableType(announcementType);
                        App.reset();
                    }, 5000);
                }
            }
        }

        for (let i = 0; i < this.clearButtons.length; i++) {
            this.clearButtons[i].onclick = () => {
                LCD.setDisplay(LCD.contents.slice(0, -1));
            }
        }
    }

    static disable() {
        this.inUse = false;

        for (let i = 0; i < this.numberButtons.length; i++) {
            this.numberButtons[i].onclick = undefined;
        }

        for (let i = 0; i < this.enterButtons.length; i++) {
            this.enterButtons[i].onclick =  undefined
        }

        for (let i = 0; i < this.clearButtons.length; i++) {
            this.clearButtons[i].onclick =  undefined
        }
    }
}

class App {
    constructor() {
        FunctionButtons.enable();
    }

    static reset() {
        if (!Numpad.enabled) {
            LCD.reset();
            FunctionButtons.enable();
            Numpad.disable();
        }
    }
}

// Instantiate the App directly
const app = new App();
