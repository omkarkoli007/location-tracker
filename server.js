const path = require("path")
const http = require("http")
const express = require("express")
const cookieParser = require("cookie-parser")
const socketIO = require("socket.io")
const tarkine = require("tarkine")
const { tunnel: cloudflaredTunnel } = require("cloudflared")
const config = require("./config")

const app = express()
const server = http.createServer(app)
const io = new socketIO.Server(server)
const PORT = config.port

global.IO = io

global.remoteURL = `http://localhost:${PORT}`

app.set("views", path.join(__dirname, "views"))
app.set("view engine", "html")
app.engine("html", tarkine.renderFile)
app.use(cookieParser())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, "public")))
app.use(express.json())

app.use((req, res, next) => {
    res.locals.remoteURL = global.remoteURL
    next()
})

app.use("/", require("./router"))

server.listen(PORT, async () => {
    const localURL = `http://localhost:${PORT}`

    try {
        const tunnel = cloudflaredTunnel({
            "--url": localURL
        })

        global.remoteURL = await tunnel.url.catch(() => localURL)
    } catch (error) {
        console.warn("Cloudflared tunnel unavailable; using local URL only.")
        global.remoteURL = localURL
    }

    console.log(`LOCAL  : ${localURL}`)
    console.log(`REMOTE : ${global.remoteURL}`)
})