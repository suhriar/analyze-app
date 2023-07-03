const themeIcon = document.getElementById("theme-icon")
const cssLinkImport = document.querySelector('link[rel=stylesheet]')

// const cssLinkImport = document.getElementById('css')

const changeThemeFunc = (hrefValue) => {
    cssLinkImport.setAttribute('href', hrefValue)
}



addEventListener("DOMContentLoaded", (event) => {
    console.log(localStorage.getItem('mode'))
    if (localStorage.getItem('mode') == null) {
        themeIcon.innerText = 'light_mode'
        changeThemeFunc('../static/css/lightStyle.css')
    }
    else if (localStorage.getItem('mode') == 'dark_mode') {
        themeIcon.innerText = 'dark_mode'
        changeThemeFunc('../static/css/darkStyle.css')

    }

    themeIcon.innerText = 'light_mode'
    changeThemeFunc('../static/css/lightStyle.css')
});

themeIcon.addEventListener('click', () => {
    if (themeIcon.innerText == 'light_mode') {
        themeIcon.innerText = 'dark_mode'
        localStorage.setItem('mode', 'dark_mode')
        changeThemeFunc('../static/css/darkStyle.css')
    }
    else {
        themeIcon.innerText = 'light_mode'
        localStorage.setItem('mode', 'light_mode')
        changeThemeFunc('../static/css/lightStyle.css')
    }
})


