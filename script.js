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
    },
    {
        name: "Custom",
        parameters: "custom"
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
function openSavePopup() {
    document.getElementById("savePopup").style.display = "flex"
}
function closeSavePopup() {
    document.getElementById("savePopup").style.display = "none"
}

class ParameterManager {
    constructor() {

    }
    update(params = null) {
        let custom = params == "custom"
        const paramContainer = document.querySelector("#optionsContainer")
        const checkboxes = paramContainer.querySelectorAll("input")
        if (custom || !params) {
            paramContainer.addEventListener("click", e => {
                this.update()
            }, { once: true })
            custom = true
            params = {}

            checkboxes.forEach(check => {
                check.disabled = false
                switch (check.parentElement.classList[0].split("-")[2]) {
                    case "checkbox":
                        params[check.id] = check.checked
                        break;
                    case "checkbox2":
                    case "checkbox3":
                    case "checkbox4":
                        params[check.id] = check.classList[1] || "unchecked"
                        break;
                    default:
                        break;
                }
            })
        } else {
            checkboxes.forEach(p => p.disabled = true)

        }
        Object.keys(params).forEach((p, i) => {
            this[p] = Object.values(params)[i]
        })
        updateParameters(params)
    }
    toJSON() {
        const paramContainer = document.querySelector("#optionsContainer")
        const checkboxes = paramContainer.querySelectorAll("input")
        let params = {}

        checkboxes.forEach(check => {
            check.disabled = false
            switch (check.parentElement.classList[0].split("-")[2]) {
                case "checkbox":
                    params[check.id] = check.checked
                    break;
                case "checkbox2":
                case "checkbox3":
                case "checkbox4":
                    params[check.id] = check.classList[1] || "unchecked"
                    break;
                default:
                    break;
            }
        })
        return params
    }
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
const singleRouteQuery = `{
  route(id: "ROUTE_ID") {
    stops {
      name
      gtfsId
      code
      lat
      lon
    }
    mode
    type
    patterns {
      directionId
      geometry {
        lat
        lon
      }
    }
  }
}`
let suggestions = [];
let stopsOnScreen = [];
let selectedRoute = "";
let guessN = 1

//[][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][]
//[][][][][] EXECUTION START [][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][
//[][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][]

const saveCustomButton = document.getElementById("saveCustom")
saveCustomButton.addEventListener("mousedown", e => saveCustomButton.classList.add("clicked"))
saveCustomButton.addEventListener("mouseup", e => saveCustomButton.classList.remove("clicked"))
saveCustomButton.addEventListener("click", () => {
    openSavePopup()
})
const saveC = document.getElementById("saveC")
saveC.addEventListener("mousedown", e => saveC.classList.add("clicked"))
saveC.addEventListener("mouseup", e => saveC.classList.remove("clicked"))
saveC.addEventListener("click", () => {
    closeSavePopup()
    const gameMode = {
        name: document.getElementById("Cname").value || "",
        parameters: parameterManager.toJSON()
    }
    window.location.replace(window.location.href.split("?")[0]+"?gameMode="+encodeURIComponent(JSON.stringify(gameMode)))
    window.location.reload()
})

const parameterManager = new ParameterManager()

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
    const startButton = document.getElementById("start")
    startButton.classList.add("active")
    startButton.innerHTML = "<h1>START</h1>"
    startButton.addEventListener("mousedown", e => {
        startButton.classList.add("clicked")
    }, { once: true })
    startButton.addEventListener("click", e => startGame(stop1, stop2), { once: true })
})

const map = L.map('map').setView({ lat: 60.17210770417428, lng: 24.94059562683106 }, 13);

const canvasRenderer = L.canvas({ padding: 0.5, tolerance: 5 });

const routesGroup = L.layerGroup().addTo(map);

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
        guessRoute()
    })

    const routeSearcher = document.getElementById("routesearcher");
    routeSearcher.addEventListener("input", function () {
        searchRoutes(this.value)
    })

    stop1Id = stop1.gtfsId
    stop2Id = stop2.gtfsId
}


function initGameModes() {
    const selected = document.querySelector(".e-selected")
    const options = document.querySelector(".e-options")
    const defaultMode = 1
    const defaultValues = gameModes[defaultMode].parameters
    const urlParam = window.location.href.split("?")[1]
    const urlParamParsed = urlParam ? urlParam.split("&").map(p => p.split("=")) : null 
    if (urlParamParsed.some(p => p[0] == "gameMode")) {
        const param = JSON.parse(decodeURIComponent(urlParamParsed.find(p => p[0] == "gameMode")[1]))
        console.log(param)
        gameModes.push({
            name: `Custom (${param.name})`,
            parameters: param.parameters
        })
    }
    gameModes.forEach((mode, i) => {
        console.log(mode)
        selected.setAttribute("data-" + i, mode.name)

        options.innerHTML += `
        <div title="${mode.name}">
            <input id="option-${i}" name="option" type="radio" ${i == defaultMode ? "checked" : ""} />
            <label class="e-option" for="option-${i}" data-txt="${mode.name}"></label>
        </div>
        `
    })
    document.querySelector(".e-options").addEventListener("click", e => {

        if (document.getElementById("option-5").checked) {
            document.getElementById("saveCustom").classList.remove("hidden")
        } else {
            document.getElementById("saveCustom").classList.add("hidden")
        }
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
                paramContainer.append(checkbox3)
                break;
            case "checkbox4":
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

                })
                paramContainer.append(checkbox4)
                break;

            default:
                break;
        }
    })
    parameterManager.update(defaultValues)
    const things = document.querySelectorAll(".e-options > *")
    things.forEach(p => {
        p.addEventListener("click", e => {
            const mode = e.target.parentElement.title
            if (!mode) return
            parameterManager.update(gameModes.find(gm => gm.name == mode).parameters)
        })
    })

}
function updateParameters(param) {
    const paramContainer = document.querySelector("#optionsContainer")
    const params = paramContainer.querySelectorAll("input")

    params.forEach((p) => {
        const para = parameters.find(par => par.id == p.id)
        switch (para.type) {
            case "checkbox":
                p.checked = param[p.id]
                break;
            case "checkbox2":
            case "checkbox3":
            case "checkbox4":
                p.classList.forEach(c => {
                    if (c == "le-checkbox") return
                    p.classList.remove(c)
                })
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
   <div class="route-suggestion-container" id="${route.gtfsId}">
      <span class="route-suggestion-icon"></span>
      <div class="route-suggestion-text-container">
         <p class="routeheader">${route.shortName}</p>
         <p class="routelongname">${route.longName}</p>
      </div>
   </div>
</li>`
    })

    suggestions = routes

    searchResults.innerHTML = resultList;
    const suggestionDivs = document.getElementsByClassName("route-suggestion-container")
    for (let i = 0; i < suggestionDivs.length; i++) {
        suggestionDivs[i].addEventListener("click", () => selectRoute(i))
    }
}

function selectRoute(num) {
    const searchResults = document.getElementById("searchresults")
    const routeSearcher = document.getElementById("routesearcher")
    selectedRoute = suggestions[num]

    searchResults.innerHTML = "";
    routeSearcher.value = selectedRoute.shortName
}

async function guessRoute() {
    const routeSearcher = document.getElementById("routesearcher")
    const guessBtn = document.getElementById("guess")
    let route = ""

    // if route was just typed in and not chosen from the suggestions box
    if (selectedRoute.shortName != routeSearcher.value) {
        const response = await fetch("https://api.digitransit.fi/routing/v2/hsl/gtfs/v1?digitransit-subscription-key=a1e437f79628464c9ea8d542db6f6e94", {
            "headers": {
                "Content-Type": "application/graphql",
            },
            body: routesQuery.replace("STOP_NAME", routeSearcher.value),
            method: "POST",
        })
        const data = await response.json()
        const routes = data.data.routes
        if (routes.length == 0) {
            //tbd if typed route does not exist
            return 1
        }
        route = routes[0]
    } else {
        route = selectedRoute
    }

    guessN += 1
    guessBtn.innerHTML = `${guessN}/10`
    routeSearcher.value = ""

    const response = await fetch("https://api.digitransit.fi/routing/v2/hsl/gtfs/v1?digitransit-subscription-key=a1e437f79628464c9ea8d542db6f6e94", {
        "headers": {
            "Content-Type": "application/graphql",
        },
        body: singleRouteQuery.replace("ROUTE_ID", route.gtfsId),
        method: "POST",
    })
    const data = await response.json()
    const resRoute = data.data.route

    renderPolyline(resRoute.patterns[0].geometry, "blue")
    if (resRoute.patterns.length != 1) renderPolyline(resRoute.patterns[1].geometry, "blue")

    renderStops(resRoute.stops)
    resRoute.stops.forEach(stop => {
        stopsOnScreen.push(stop.gtfsId)
    })
}

function renderPolyline(shape, color) {
    //Draw polyline
    const polyline = L.polyline(shape, {
        color: color,
        dashArray: color == 'gray' ? [2, 3] : null,
        renderer: canvasRenderer,
    })
    polyline.addTo(routesGroup);
    return polyline
}

function renderStops(stops) {
    stops.forEach(stop => {
        const marker = L.circleMarker([stop.lat, stop.lon],
            {
                radius: getStopStyle("radius", stop),
                color: getStopStyle("color", stop),
                fillColor: getStopStyle("fillcolor", stop),
                fillOpacity: 1,
                renderer: canvasRenderer,
            }).bindTooltip(`${stop.code} ${stop.name}`)
        marker.addTo(routesGroup)
    })
}

function getStopStyle(type, stop) {
    if (type == "radius") {
        if (stopsOnScreen.includes(stop.gtfsId) || stop.gtfsId == stop1Id || stop.gtfsId == stop2Id) return 8
        return 4
    }
    if (type == "fillcolor") {
        if (stop.gtfsId == stop1Id) return "green"
        if (stop.gtfsId == stop2Id) return "green"
        if (stopsOnScreen.includes(stop.gtfsId)) return "white"
        return "blue"
    }
    if (type == "color") {
        if (stop.gtfsId == stop1Id) return "green"
        if (stop.gtfsId == stop2Id) return "green"
        return "blue"
    }
}
