const numberGuideButton = document.getElementById('numberGuideButton')
const usageGuideButton = document.getElementById('usageGuideButton')
const imageModal = document.getElementById("imageModal");
const imagePlace = document.getElementById("imagePlace")


class ImageButton {
    constructor(button, image) {
        const self = this;

        this.image = image;

        button.addEventListener('click', () => {
            imageModal.style.display = "block";
            imagePlace.src = this.image;
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ImageButton(numberGuideButton, 'numbersGuide.png');
    new ImageButton(usageGuideButton, '/images/usageGuide.png');

    const span = document.getElementsByClassName("close")[0];

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
        imageModal.style.display = "none";
    }
});
