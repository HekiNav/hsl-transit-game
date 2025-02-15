const gameModes = [
    {
        name: "Easy",
        parameters: {
            "map-visibility": "checked1",
            "favour-stops": "checked1",
            "night-lines": true,
            "trunk-buses": true,
            "other-trunk": true,
            "trams": true,
            "u-lines": true,
            "neigh-buses": false,
            "route-input-opt": "checked1"
        }
    },
    {
        name: "Normal",
        parameters: {
            "map-visibility": "checked1",
            "favour-stops": "checked1",
            "night-lines": false,
            "trunk-buses": true,
            "other-trunk": false,
            "trams": true,
            "u-lines": true,
            "neigh-buses": false,
            "route-input-opt": "checked2"
        }
    },
    {
        name: "Hard",
        parameters: {
            "favour-stops": "checked1",
            "map-visibility": "checked1",
            "night-lines": false,
            "trunk-buses": false,
            "other-trunk": false,
            "trams": false,
            "u-lines": false,
            "neigh-buses": true,
            "route-input-opt": "checked3"
        }
    },
    {
        name: "Extreme",
        parameters: {
            "favour-stops": "checked2",
            "map-visibility": "checked2",
            "night-lines": false,
            "trunk-buses": false,
            "other-trunk": false,
            "trams": false,
            "u-lines": false,
            "neigh-buses": true,
            "route-input-opt": "checked4"
        }
    },
    {
        name: "Pain and Suffering",
        parameters: {
            "favour-stops": "checked3",
            "map-visibility": "unchecked",
            "night-lines": false,
            "trunk-buses": false,
            "other-trunk": false,
            "trams": false,
            "u-lines": false,
            "neigh-buses": true,
            "route-input-opt": "unchecked"
        }
    }
]
const parameters = [
    {
        id: "night-lines",
        type: "checkbox",
        label: "Night-only lines"
    },
    {
        id: "u-lines",
        type: "checkbox",
        label: "U Buses"
    },
    {
        id: "neigh-buses",
        type: "checkbox",
        label: "Neighbourhood buses"
    },
    {
        id: "trunk-buses",
        type: "checkbox",
        label: "Trunk buses"
    },
    {
        id: "other-trunk",
        type: "checkbox",
        label: "Non-bus trunk lines (trains, metro, 15)"
    },
    {
        id: "trams",
        type: "checkbox",
        label: "Trams (not incl. 15)"
    },
    {
        id: "map-visibility",
        type: "checkbox2",
        labels: {
            checked1: "Map",
            checked2: "No background map",
            unchecked: "Map"
        },
    },
    {
        id: "favour-stops",
        type: "checkbox3",
        labels: {
            checked1: "Favour stops with more departures",
            checked2: "Favour stops with <strong>less</strong> departures",
            checked3: "Favour stops with <strong>even less</strong> departures",
            unchecked: "Favour stops with more departures"
        },
    },
    {
        id: "route-input-opt",
        type: "checkbox4",
        labels: {
            checked1: "Search, only reached routes, terminuses in search",
            checked2: "Search, all routes, terminuses in search",
            checked3: "search, all routes, first letters of terminuses",
            checked4: "No search, route <strong>name</strong> input",
            unchecked: "No search, route <strong>ID</strong> input"
        },
    }
]


function show() {
    document.getElementById("popup").style.display = "flex"
}
function hide() {
    document.getElementById("popup").style.display = "none"
}
const stopsQuery = `
query {
  stops{
    lon
    lat
    name
    code
    gtfsId
    parentStation {
      name
      id
      gtfsId
      lat
      lon
      stops {
        routes {
            gtfsId
        }
      }
    }
    routes {
      gtfsId
    }
  }
}
`
const routesQuery = `{
  routes(name: "STOP_NAME") {
    gtfsId
    shortName
    longName
    mode
    type
    stops {
      gtfsId
    }
  }
}`


//[][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][]
//[][][][][] EXECUTION START [][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][
//[][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][]
const dropdown = document.querySelector(".e-select")
dropdown.addEventListener("click", e => {
    if (e.target.tagName == "INPUT") return
    dropdown.classList.contains("clicked") ?
        dropdown.classList.remove("clicked") :
        dropdown.classList.add("clicked")
})
const tabSelector1 = document.getElementById("modes")
tabSelector1.addEventListener("click", e => {
    document.getElementById("modesC").classList.remove("hidden")
    document.getElementById("guideC").classList.add("hidden")

})
const tabSelector2 = document.getElementById("guide")
tabSelector2.addEventListener("click", e => {
    document.getElementById("modesC").classList.add("hidden")
    document.getElementById("guideC").classList.remove("hidden")
})

show()
initGameModes()
prepareGame().then((stops) => {
    const [stop1, stop2] = stops
    console.log(stop1, stop2)
    const startButton = document.getElementById("start")
    startButton.classList.add("active")
    startButton.innerHTML = "<h1>START</h1>"
    startButton.addEventListener("mousedown", e => {
        startButton.classList.add("clicked")
    }, { once: true })
    startButton.addEventListener("click", e => startGame(stop1, stop2), { once: true })
})

const map = L.map('map').setView({ lat: 60.17210770417428, lng: 24.94059562683106 }, 13);

L.tileLayer('https://cdn.digitransit.fi/map/v3/hsl-map-en/{z}/{x}/{y}@2x.png?digitransit-subscription-key=754a004ba87c4fdd8506532327e212c0', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    tileSize: 512,
    zoomOffset: -1,
    keepBuffer: 5
}).addTo(map);

var reset = L.control({ position: "topleft" });

reset.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'leaflet-bar')
    this._div.classList.add("resetcontrol")
    const a = L.DomUtil.create("a", "resetbutton", this._div)
    L.DomUtil.create("span", "reseticon", a).innerHTML = "↺"
    a.addEventListener("click", e => {
        e.preventDefault()
        map.fitBounds(zoomToGroup.getBounds().pad(0.1))
    })
    const pin1 = L.DomUtil.create("a", "resetbutton", this._div)
    L.DomUtil.create("span", "pinicon", pin1).innerHTML = "<img src='img/pin1.png'>"
    pin1.addEventListener("click", e => {
        e.preventDefault()
        map.flyTo(zoomToGroup.getLayers()[0].getLatLng(), 13, {
            animate: true,
            duration: 1
        })
    })
    const pin2 = L.DomUtil.create("a", "resetbutton", this._div)
    L.DomUtil.create("span", "pinicon", pin2).innerHTML = "<img src='img/pin2.png'>"
    pin2.addEventListener("click", e => {
        e.preventDefault()
        map.flyTo(zoomToGroup.getLayers()[1].getLatLng(), 13, {
            animate: true,
            duration: 1
        })
    })
    return this._div;
};

reset.addTo(map);

const zoomToGroup = L.featureGroup().addTo(map)

//[][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][]
//[][][][][] FUNCTIONS [][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][
//[][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][]

async function prepareGame() {
    const response = await fetch("https://api.digitransit.fi/routing/v2/hsl/gtfs/v1?digitransit-subscription-key=a1e437f79628464c9ea8d542db6f6e94", {
        "headers": {
            "Content-Type": "application/graphql",
        },
        body: stopsQuery,
        method: "POST",
    })
    const data = await response.json()
    const stops = await data.data.stops
    const filtered =
        await stops.map(
            stop =>
                stop.parentStation ||
                stop
        ).filter(
            (value, index, self) =>
                index === self.findIndex((t) => (
                    t.gtfsId === value.gtfsId
                ))
        ).filter(
            stop =>
                stop.routes ?
                    stop.routes.length :
                    stop.stops.some(s => s.routes.length)
        )
    const [random1] = await filtered.splice(Math.floor(Math.random() * filtered.length), 1)
    const [random2] = await filtered.splice(Math.floor(Math.random() * filtered.length), 1)
    console.log(random1, random2)
    return [random1, random2]
}
function startGame(stop1, stop2) {
    hide()
    const stop1M = L.marker({ lat: stop1.lat, lng: stop1.lon }).addTo(zoomToGroup).bindTooltip((stop1.code ? stop1.code + " " : "") + stop1.name)
    const stop2M = L.marker({ lat: stop2.lat, lng: stop2.lon }).addTo(zoomToGroup).bindTooltip((stop2.code ? stop2.code + " " : "") + stop2.name)
    map.fitBounds(zoomToGroup.getBounds().pad(0.1))
    document.getElementById("hpt2").innerHTML = `${(stop1.code ? stop1.code + " " : "") + stop1.name} to ${(stop2.code ? stop2.code + " " : "") + stop2.name}`
    textFit(document.getElementById("hpt2"))

    const guessBtn = document.getElementById("guess")
    guessBtn.addEventListener("mousedown", e => guessBtn.classList.add("clicked"))
    guessBtn.addEventListener("mouseup", e => guessBtn.classList.remove("clicked"))
    guessBtn.addEventListener("click", () => {

    })

    const routeSearcher = document.getElementById("routesearcher");
    routeSearcher.addEventListener("input", function () {
        searchRoutes(this.value)
    })
}


function initGameModes() {
    const selected = document.querySelector(".e-selected")
    const options = document.querySelector(".e-options")
    const defaultMode = 1
    const defaultValues = gameModes[defaultMode].parameters
    gameModes.forEach((mode, i) => {
        selected.setAttribute("data-" + i, mode.name)
        options.innerHTML += `
        <div title="${mode.name}">
            <input id="option-${i}" name="option" type="radio" ${i == defaultMode ? "checked" : ""} />
            <label class="e-option" for="option-${i}" data-txt="${mode.name}"></label>
        </div>
        `
    })
    const paramContainer = document.querySelector("#optionsContainer")
    parameters.forEach(param => {
        switch (param.type) {
            case "checkbox":
                paramContainer.innerHTML += `
                    <div class="o-option-${param.type}">
                        <input id="${param.id}" type="checkbox" class="le-checkbox" disabled/>
                        <label class="option-label" for="${param.id}">${param.label}</label>
                    </div>
                `
                break;
            case "checkbox2":
                const checkbox2 = parseHTML(`
                        <div class="o-option-${param.type}">
                            <input id="${param.id}" type="checkbox" class="le-checkbox" disabled/>
                            <label class="option-label" for="${param.id}"></label>
                        </div>
                    `)

                checkbox2.addEventListener("click", e => {
                    e.preventDefault()
                    const input = checkbox2.firstElementChild
                    if (input.disabled) return

                    if (!input.classList.contains("checked1") && !input.classList.contains("checked2")) {
                        input.classList.add("checked1")
                    } else if (input.classList.contains("checked1") && !input.classList.contains("checked2")) {
                        input.classList.add("checked2")
                        input.classList.remove("checked1")
                    } else {
                        input.classList.remove("checked2")
                    }
                })
                paramContainer.append(checkbox2)
                break;
            case "checkbox3":
                const checkbox3 = parseHTML(`
                            <div class="o-option-${param.type}">
                                <input id="${param.id}" type="checkbox" class="le-checkbox" disabled/>
                                <label class="option-label" for="${param.id}"></label>
                            </div>
                        `)

                checkbox3.addEventListener("click", e => {
                    e.preventDefault()
                    const input = checkbox3.firstElementChild
                    if (input.disabled) return

                    if (!input.classList.contains("checked1") && !input.classList.contains("checked2") && !input.classList.contains("checked3")) {
                        input.classList.add("checked1")
                    } else if (input.classList.contains("checked1") && !input.classList.contains("checked2") && !input.classList.contains("checked3")) {
                        input.classList.add("checked2")
                        input.classList.remove("checked1")
                    } else if (input.classList.contains("checked2") && !input.classList.contains("checked1") && !input.classList.contains("checked3")) {
                        input.classList.add("checked3")
                        input.classList.remove("checked2")
                    } else {
                        input.classList.remove("checked3")
                        input.classList.remove("checked1")
                    }

                })
                console.log(checkbox3)
                paramContainer.append(checkbox3)
                break;
            case "checkbox4":
                console.log("e")
                const checkbox4 = parseHTML(`
                                <div class="o-option-${param.type}">
                                    <input id="${param.id}" type="checkbox" class="le-checkbox" disabled/>
                                    <label class="option-label" for="${param.id}"></label>
                                </div>
                            `)

                checkbox4.addEventListener("click", e => {
                    e.preventDefault()
                    const input = checkbox4.firstElementChild
                    if (input.disabled) return

                    if (!input.classList.contains("checked1") && !input.classList.contains("checked2") && !input.classList.contains("checked3") && !input.classList.contains("checked4")) {
                        input.classList.add("checked1")
                    } else if (input.classList.contains("checked1") && !input.classList.contains("checked2") && !input.classList.contains("checked3") && !input.classList.contains("checked4")) {
                        input.classList.add("checked2")
                        input.classList.remove("checked1")
                    } else if (input.classList.contains("checked2") && !input.classList.contains("checked1") && !input.classList.contains("checked3") && !input.classList.contains("checked4")) {
                        input.classList.add("checked3")
                        input.classList.remove("checked2")
                    } else if (!input.classList.contains("checked2") && !input.classList.contains("checked1") && input.classList.contains("checked3") && !input.classList.contains("checked4")) {
                        input.classList.add("checked4")
                        input.classList.remove("checked3")
                    } else {
                        input.classList.remove("checked4")
                    }
                    console.log("f1")

                })
                paramContainer.append(checkbox4)
                break;

            default:
                break;
        }
    })
    updateParameters(defaultValues)
    const things = document.querySelectorAll(".e-options > *")
    console.log(things)
    things.forEach(p => {
        p.addEventListener("click", e => {
            const mode = e.target.parentElement.title
            if (!mode) return
            console.log(gameModes.find(gm => gm.name == mode))
            updateParameters(gameModes.find(gm => gm.name == mode).parameters)
        })
    })

}
function updateParameters(param) {
    const paramContainer = document.querySelector("#optionsContainer")
    const params = paramContainer.querySelectorAll("input")
    params.forEach((p) => {
        const para = parameters.find(par => par.id == p.id)
        console.log(p.id, para.type)
        switch (para.type) {
            case "checkbox":
                p.checked = param[p.id]
                break;
            case "checkbox2":
            case "checkbox3":
            case "checkbox4":
                console.log(p.classList)
                p.classList.forEach(c => {
                    console.log(c)
                    if (c == "le-checkbox") return
                    p.classList.remove(c)
                })
                console.log(p.classList)
                if (param[p.id] != "unchecked") p.classList.add(param[p.id])
                paramContainer.querySelector(`[for=${p.id}]`).innerHTML = para.labels[param[p.id]]
                break;
            default:
                break;
        }
    })
}

function parseHTML(html) {
    var t = document.createElement('template');
    t.innerHTML = html;
    return t.content.querySelector("div")
}

async function searchRoutes(text) {
    const response = await fetch("https://api.digitransit.fi/routing/v2/hsl/gtfs/v1?digitransit-subscription-key=a1e437f79628464c9ea8d542db6f6e94", {
        "headers": {
            "Content-Type": "application/graphql",
        },
        body: routesQuery.replace("STOP_NAME", text),
        method: "POST",
    })
    const data = await response.json()
    const routes = data.data.routes
    const searchResults = document.getElementById("searchresults")

    let resultList = ""
    routes.forEach(route => {
        resultList += `<li>
   <div class="route-suggestion-container">
      <span class="route-suggestion-icon"></span>
      <div class="route-suggestion-text-container">
         <p class="routeheader">${route.shortName}</p>
         <p class="routelongname">${route.longName}</p>
      </div>
   </div>
</li>`
    })

    searchResults.innerHTML = resultList;
}